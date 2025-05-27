import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Users, Clock, Calendar, Activity, AlertCircle } from 'lucide-react';
import { fetchSalaryData, SalaryData, TimePeriod } from '../services/salaryService';

// Utility function to convert minutes to hours and format the display
const formatMinutesToHours = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  // Convert remaining minutes to decimal and format to exactly 2 decimal places
  const decimalHours = remainingMinutes > 0 
    ? (hours + (remainingMinutes / 60)).toFixed(2)
    : hours.toString();
  return decimalHours;
};

interface HRStatsProps {
  timePeriod: TimePeriod;
  selectedDepartment: string;
}

const HRStats: React.FC<HRStatsProps> = ({ timePeriod, selectedDepartment }) => {
  const [salaryData, setSalaryData] = useState<SalaryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSalaryData = async () => {
      try {
        setLoading(true);
        // First get data filtered by time period
        const data = await fetchSalaryData(timePeriod);
        
        // Then filter by department if not "All"
        if (selectedDepartment !== 'All') {
          const departmentData = data.departmentData.find(d => 
            d.department === selectedDepartment 
            // (selectedDepartment === 'N/A' && d.department === '0')

          );

          if (departmentData) {
            const filteredData: SalaryData = {
              ...data,
              totalEmployees: departmentData.headcount,
              avgAttendancePercentage: departmentData.attendancePercentage,
              totalOTHours: departmentData.totalOTHours,
              // Keep the changes/trends as they are for now
              employeesChange: data.employeesChange,
              attendanceChange: data.attendanceChange,
              otHoursChange: data.otHoursChange,
              lateMinutesChange: data.lateMinutesChange,
              totalLateMinutes: data.totalLateMinutes,
            };
            setSalaryData(filteredData);
          } else {
            setSalaryData(data); // Fallback to all data if department not found
          }
        } else {
          setSalaryData(data);
        }
        
        setError(null);
      } catch (err) {
        setError('Failed to load salary data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadSalaryData();
  }, [timePeriod, selectedDepartment]);

  console.log('DEBUG HRStats:', { selectedDepartment, salaryData, departmentData: salaryData?.departmentData });

  const departmentExists = selectedDepartment === 'All' || (salaryData && salaryData.departmentData && salaryData.departmentData.some(d => d.department === selectedDepartment));
  if (!departmentExists) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-gray-500 text-lg font-semibold">No data found for the selected filter.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-6 mb-8">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="bg-blue-50 p-6 rounded-lg shadow-sm border border-gray-100 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !salaryData) {
    return (
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-red-50 p-6 rounded-lg shadow-sm border border-red-100 col-span-4">
          <h3 className="text-red-500 text-sm">{error || 'Failed to load salary data'}</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-6 mb-8">
      <div className="bg-blue-50 p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-gray-500 text-sm">Total Employees</h3>
          <Users size={18} className="text-blue-600" />
        </div>
        <div className="flex items-end justify-between">
          <span className="text-2xl font-semibold">{salaryData.totalEmployees.toLocaleString()}</span>
          <span className={`text-sm flex items-center ${salaryData.employeesChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {salaryData.employeesChange >= 0 ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
            {salaryData.employeesChange >= 0 ? '+' : ''}{salaryData.employeesChange}%
          </span>
        </div>
      </div>
      
      <div className="bg-blue-50 p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-gray-500 text-sm">Avg. Attendance %</h3>
          <Activity size={18} className="text-blue-600" />
        </div>
        <div className="flex items-end justify-between">
          <span className="text-2xl font-semibold">{salaryData.avgAttendancePercentage.toFixed(1)}%</span>
          <span className={`text-sm flex items-center ${salaryData.attendanceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {salaryData.attendanceChange >= 0 ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
            {salaryData.attendanceChange >= 0 ? '+' : ''}{salaryData.attendanceChange}%
          </span>
        </div>
      </div>
      
      <div className="bg-blue-50 p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-gray-500 text-sm">Late Hours</h3>
          <AlertCircle size={18} className="text-red-500" />
        </div>
        <div className="flex items-end justify-between">
          <span className="text-2xl font-semibold">{formatMinutesToHours(salaryData.totalLateMinutes)} </span>
          <span className={`text-sm flex items-center ${salaryData.lateMinutesChange <= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {salaryData.lateMinutesChange <= 0 ? <TrendingDown size={16} className="mr-1" /> : <TrendingUp size={16} className="mr-1" />}
            {salaryData.lateMinutesChange > 0 ? '+' : ''}{salaryData.lateMinutesChange}%
          </span>
        </div>
      </div>
      
      <div className="bg-blue-50 p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-gray-500 text-sm">OT Hours</h3>
          <Clock size={18} className="text-blue-600" />
        </div>
        <div className="flex items-end justify-between">
          <span className="text-2xl font-semibold">{formatMinutesToHours(salaryData.totalOTHours)} </span>
          <span className={`text-sm flex items-center ${salaryData.otHoursChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {salaryData.otHoursChange >= 0 ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
            {salaryData.otHoursChange >= 0 ? '+' : ''}{salaryData.otHoursChange}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default HRStats;