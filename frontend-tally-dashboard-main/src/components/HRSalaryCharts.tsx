import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area 
} from 'recharts';
import { fetchSalaryData, SalaryData, TimePeriod } from '../services/salaryService';
import { formatSalary } from '../services/salaryService';

const COLORS = ['#333333', '#4A90E2', '#50E3C2', '#F5A623', '#FF5252', '#8E44AD'];

interface HRSalaryChartsProps {
  timePeriod?: TimePeriod;
}

const HRSalaryCharts: React.FC<HRSalaryChartsProps> = ({ timePeriod }) => {
  const [salaryData, setSalaryData] = useState<SalaryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSalaryData = async () => {
      try {
        setLoading(true);
        const data = await fetchSalaryData(timePeriod);
        console.log(data);
        setSalaryData(data);
        setError(null);
      } catch (err) {
        setError('Failed to load salary data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadSalaryData();
  }, [timePeriod]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading salary data...</div>
      </div>
    );
  }

  if (error || !salaryData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">
          {error || 'Failed to load salary data'}
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded">
          <p className="font-semibold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('alary') ? formatSalary(entry.value) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {/* Department Average Salary Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="font-semibold mb-6">Department Average Salary</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salaryData.departmentData} barSize={30}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="department" axisLine={false} tickLine={false} tick={{ fill: '#666666' }} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#666666' }}
                  tickFormatter={(value) => formatSalary(value).replace('$', '').replace(',', '')}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="averageSalary" name="Average Salary" fill="#4A90E2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Salary Distribution Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="font-semibold mb-6">Salary Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={salaryData.salaryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  fill="#8884d8"
                  paddingAngle={2}
                  dataKey="count"
                  nameKey="range"
                >
                  {salaryData.salaryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  align="center"
                  formatter={(value, entry, index) => (
                    <span style={{ color: '#666666' }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Second row of charts */}
      <div className="grid grid-cols-2 gap-6">
        {/* Salary Trends Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold">Salary Trends</h3>
            <div className="flex items-center text-xs text-gray-500">
              <span>Average by month</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salaryData.salaryTrends}>
                <defs>
                  <linearGradient id="colorSalary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4A90E2" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4A90E2" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#666666' }} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#666666' }}
                  tickFormatter={(value) => formatSalary(value).replace('$', '').replace(',', '')}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="averageSalary"
                  name="Average Salary"
                  stroke="#4A90E2" 
                  fillOpacity={1} 
                  fill="url(#colorSalary)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Role Salary Comparison */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="font-semibold mb-6">Salaries by Department</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={salaryData.departmentData} 
                layout="vertical"
                barSize={12}
                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  type="number" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#666666' }}
                  tickFormatter={(value) => formatSalary(value).replace('$', '').replace(',', '')}
                />
                <YAxis 
                  type="category" 
                  dataKey="department" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#666666' }}
                  width={80}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="averageSalary" name="Average Salary" fill="#333333" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRSalaryCharts; 