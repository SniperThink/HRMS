import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
   Cell, LineChart, Line
} from 'recharts';
import { fetchSalaryData, SalaryData, TimePeriod } from '../services/salaryService';
import { formatSalary } from '../services/salaryService';

const COLORS = ['#1A6262', '#4A90E2', '#50E3C2', '#F5A623', '#FF5252', '#8E44AD'];

interface HROverviewChartsProps {
  timePeriod: TimePeriod;
  selectedDepartment: string;
}

// Add this utility function at the top of the file after the imports
const toCamelCase = (str: string): string => {
  // Handle empty or null strings
  if (!str) return '';
  
  // Split the string by spaces, hyphens, and underscores
  return str
    .split(/[\s-_]+/)
    .map(word => 
      word.charAt(0).toUpperCase() + 
      word.slice(1).toLowerCase()
    )
    .join(' ');
};

const normalizeDepartment = (dept: string | undefined) => (dept && dept.trim() !== '' && dept !== '0') ? dept : 'N/A';

const HROverviewCharts: React.FC<HROverviewChartsProps> = ({ timePeriod, selectedDepartment }) => {
  const [salaryData, setSalaryData] = useState<SalaryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Add state for year filters
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYearOT, setSelectedYearOT] = useState<number | null>(null);
  const [selectedYearSalary, setSelectedYearSalary] = useState<number | null>(null);

  useEffect(() => {
    const loadSalaryData = async () => {
      try {
        setLoading(true);
        // Only filter by timePeriod, not department
        const data = await fetchSalaryData(timePeriod);
        setSalaryData(data);
        
        // Extract available years from the actual data
        const years = new Set<number>();
        
        // Function to extract years from month strings
        const extractYears = (items: any[]) => {
          items.forEach(item => {
            if (!item.month) return;
            
            const monthStr = String(item.month || '');
            const yearPatterns = [
              /\s(\d{4})$/,  // "Jan 2024"
              /(\d{4})$/,    // "Jan2024" or "2024"
              /-(\d{4})$/,   // "Jan-2024"
              /\/(\d{4})$/   // "Jan/2024"
            ];
            
            for (const pattern of yearPatterns) {
              const match = monthStr.match(pattern);
              if (match && match[1]) {
                const year = parseInt(match[1], 10);
                if (!isNaN(year)) {
                  years.add(year);
                  break;
                }
              }
            }
          });
        };
        
        // Extract years from OT trends and salary trends
        if (data.otTrends && data.otTrends.length > 0) {
          extractYears(data.otTrends);
        }
        
        if (data.salaryTrends && data.salaryTrends.length > 0) {
          extractYears(data.salaryTrends);
        }
        
        // Convert to array and sort in descending order (newest first)
        const yearArray = Array.from(years).sort((a, b) => b - a);
        console.log('Available years from data:', yearArray);
        
        setAvailableYears(yearArray);
        
        // Set default selected year to the most recent
        if (yearArray.length > 0) {
          setSelectedYearOT(yearArray[0]);
          setSelectedYearSalary(yearArray[0]);
        }
        
        setError(null);
      } catch (err) {
        setError('Failed to load salary data');
        setSalaryData(null);
      } finally {
        setLoading(false);
      }
    };

    loadSalaryData();
  }, [timePeriod]);

  // Helper function to filter data by year
  const filterDataByYear = (data: any[], year: number | null) => {
    if (!year || !data) return data;
    
    // Filter data to only show items from the selected year
    return data.filter(item => {
      if (!item.month) {
        console.warn('Item missing month property:', item);
        return false;
      }
      
      // Extract year from the month property in various formats
      const monthStr = String(item.month || '');
      
      // Try to find a year pattern in the month string
      const yearPatterns = [
        /\s(\d{4})$/,  // "Jan 2024"
        /(\d{4})$/,    // "Jan2024" or "2024"
        /-(\d{4})$/,   // "Jan-2024"
        /\/(\d{4})$/   // "Jan/2024"
      ];
      
      for (const pattern of yearPatterns) {
        const match = monthStr.match(pattern);
        if (match && match[1]) {
          const extractedYear = parseInt(match[1], 10);
          console.log(`Extracted year ${extractedYear} from month string: "${monthStr}"`);
          return extractedYear === year;
        }
      }
      
      console.warn(`Could not extract year from month string: "${monthStr}"`);
      return false;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading HR data...</div>
      </div>
    );
  }

  if (error || !salaryData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">
          {error || 'Failed to load HR data'}
        </div>
      </div>
    );
  }

  if ((salaryData && salaryData.departmentData && salaryData.departmentData.length === 0) || (salaryData && salaryData.departmentDistribution && salaryData.departmentDistribution.length === 0)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 text-lg font-semibold">No data found for the selected filter.</div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded">
          <p className="font-semibold">{label}</p>
          {payload.map((entry: any, index: number) => {
            // Format the value based on what type of data it is
            let formattedValue = entry.value;
            
            if (entry.name.includes('Salary')) {
              formattedValue = formatSalary(entry.value);
            } else if (entry.name.includes('Percentage')) {
              formattedValue = `${Number(entry.value).toFixed(1)}%`;
            } else if (entry.name.includes('Hours')) {
              formattedValue = `${Number(entry.value).toFixed(1)} hrs`;
            } else if (typeof entry.value === 'number') {
              formattedValue = Number(entry.value).toFixed(1);
            }
            
            return (
              <p key={index} style={{ color: entry.color || entry.fill }}>
                {entry.name}: {formattedValue}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  // Filter trend data based on selected years
  const filteredOTTrends = filterDataByYear(salaryData.otTrends, selectedYearOT);
  const filteredSalaryTrends = filterDataByYear(salaryData.salaryTrends, selectedYearSalary);

  // Debug logging for year filters
  console.log('Year filter states:', { 
    availableYears, 
    selectedYearOT, 
    selectedYearSalary,
    originalOTTrends: salaryData.otTrends,
    filteredOTTrends,
    originalSalaryTrends: salaryData.salaryTrends,
    filteredSalaryTrends
  });

  // Render year filter based on available years for OT trends
  const renderOTYearFilter = () => {
    if (availableYears.length <= 1) {
      return null;
    }

    return (
      <div className="flex flex-col">
        <span className="text-xs text-gray-500 mb-1">Filter by Year:</span>
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedYearOT(null)}
            className={`px-3 py-1 text-xs rounded-md ${
              selectedYearOT === null 
                ? 'bg-blue-600 text-white font-medium shadow-sm' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {availableYears.map(year => (
            <button
              key={year}
              onClick={() => setSelectedYearOT(year)}
              className={`px-3 py-1 text-xs rounded-md ${
                selectedYearOT === year 
                  ? 'bg-blue-600 text-white font-medium shadow-sm' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Render year filter based on available years for Salary trends
  const renderSalaryYearFilter = () => {
    if (availableYears.length <= 1) {
      return null;
    }
  
    return (
      <div className="flex flex-col">
        <span className="text-xs text-gray-500 mb-1">Filter by Year:</span>
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedYearSalary(null)}
            className={`px-3 py-1 text-xs rounded-md ${
              selectedYearSalary === null 
                ? 'bg-blue-600 text-white font-medium shadow-sm' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {availableYears.map(year => (
            <button
              key={year}
              onClick={() => setSelectedYearSalary(year)}
              className={`px-3 py-1 text-xs rounded-md ${
                selectedYearSalary === year 
                  ? 'bg-blue-600 text-white font-medium shadow-sm' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      </div>
    );
  };
  const maxCount = Math.max(...salaryData.departmentDistribution.map(item => item.count));
  const tickStep = Math.ceil(maxCount / 4); // For 5 ticks (0 and 4 steps)
  const yAxisTicks = [0, tickStep, tickStep*2, tickStep*3, tickStep*4];
  console.log('Y-axis calculations:', {
    maxCount,
    tickStep,
    yAxisTicks,
    departmentData: salaryData.departmentDistribution
  });
  return (
    <div className="space-y-6">
      {/* First row of charts */}
      <div className="grid grid-cols-2 gap-6">
        {/* Department Distribution Bar Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="font-semibold mb-6">Department Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={salaryData.departmentDistribution}
                barSize={20}
                margin={{ top: 5, right: 30, left: 20, bottom: 50 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="department" 
                  axisLine={false} 
                  tickLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval={0}
                  tick={{ 
                    fill: '#666666',
                    fontSize: 10
                  }}
                />
                <YAxis 
                 axisLine={false} 
                 tickLine={false} 
                 tick={{ fill: '#666666' }}
                 domain={[0, maxCount]} // Use maxCount directly
                 tickCount={5}
                 allowDecimals={false}
                />               
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Employee Count" radius={[4, 4, 4, 4]}>
                  {salaryData.departmentDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3C7A7A' : '#1A626299'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department-wise Attendance Bar Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="font-semibold mb-6">Department-wise Attendance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={salaryData.departmentData} 
                barSize={20}
                margin={{ top: 5, right: 30, left: 20, bottom: 50 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="department" 
                  axisLine={false} 
                  tickLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval={0}
                  tick={{ 
                    fill: '#666666',
                    fontSize: 10
                  }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#666666' }}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${Number(value).toFixed(1)}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="attendancePercentage" name="Attendance Percentage" radius={[4, 4, 4, 4]}>
                  {salaryData.departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3C7A7A' : '#1A626299'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Second row of charts */}
      <div className="grid grid-cols-2 gap-6">
        {/* OT Hours vs Department Bar Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="font-semibold mb-6">OT Hours by Department</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={salaryData.departmentData}
                barSize={20}
                margin={{ top: 5, right: 30, left: 20, bottom: 50 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="department" 
                  axisLine={false} 
                  tickLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval={0}
                  tick={{ 
                    fill: '#666666',
                    fontSize: 10
                  }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#666666' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="totalOTHours" name="OT Hours" radius={[4, 4, 4, 4]}>
                  {salaryData.departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3C7A7A' : '#1A626299'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Salaried Employees Bar Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="font-semibold mb-6">Top Salaried Employees</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={salaryData.topSalariedEmployees} 
                layout="vertical"
                barSize={20}
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  type="number"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#666666' }}
                  tickFormatter={(value) => formatSalary(Math.round(value)).replace('₹', '')}
                />
                <YAxis 
                  type="category"
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#666666' }}
                  width={80}
                  tickFormatter={(value) => {
                    return value.replace(/\s+\d+$/, '');
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="salary" 
                  name="Salary" 
                  fill="#1A6262" 
                  radius={[4, 4, 4, 4]}
                >
                  {salaryData.topSalariedEmployees.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3C7A7A' : '#1A626299'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Third row of charts */}
      <div className="grid grid-cols-2 gap-6">
        {/* Average OT Trends Line Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold">Avg. OT Trends</h3>
            {renderOTYearFilter()}
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredOTTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false}
                  angle={-45}
                  tick={{ 
                    fill: '#666666', 
                    fontSize: 10,
                    textAnchor: 'end',
                    dy: 0
                  }}
                  height={50}
                  interval={0}
                  padding={{ left: 10, right: 10 }}
                  tickMargin={8}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#666666' }}
                  tickFormatter={(value) => `${Number(value).toFixed(1)} hrs`}
                  width={60}
                  domain={[0, 'auto']}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="averageOTHours" 
                  name="Average OT Hours"
                  stroke="#F5A623" 
                  strokeWidth={2}
                  dot={{ stroke: '#F5A623', strokeWidth: 2, r: 4, fill: 'white' }}
                  activeDot={{ stroke: '#F5A623', strokeWidth: 2, r: 6, fill: 'white' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Salary Trend Line Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold">Salary Trend</h3>
            {renderSalaryYearFilter()}
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredSalaryTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false}
                  angle={-45}
                  tick={{ 
                    fill: '#666666', 
                    fontSize: 10,
                    textAnchor: 'end',
                    dy: 0
                  }}
                  height={50}
                  interval={0}
                  padding={{ left: 10, right: 10 }}
                  tickMargin={8}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#666666' }}
                  tickFormatter={(value) => formatSalary(Math.round(value))}
                  width={70}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="averageSalary" 
                  name="Average Salary"
                  stroke="#50E3C2" 
                  strokeWidth={2}
                  dot={{ stroke: '#50E3C2', strokeWidth: 2, r: 4, fill: 'white' }}
                  activeDot={{ stroke: '#50E3C2', strokeWidth: 2, r: 6, fill: 'white' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HROverviewCharts; 