import React, { useEffect, useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { TimePeriod } from '../services/salaryService';
import { useNavigate } from 'react-router-dom';

interface AttendanceRecord {
  id: number;
  employee_id: string;
  name: string;
  department: string;
  date: string;
  calendar_days: number;
  total_working_days: number;
  present_days: number;
  absent_days: number;
  attendance_percentage: number;
  ot_hours: string;
  late_minutes: number;
}

interface AggregatedRecord {
  id?: number;
  employee_id: string;
  name: string;
  date?: string;
  month?: string;
  year?: number;
  calendar_days: number;
  total_working_days: number;
  present_days: number;
  absent_days: number;
  attendance_percentage?: number;
  ot_hours: number;
  late_minutes: number;
}

interface MonthInfo {
  month: string;
  year: number;
  totalDays: number;
  workingDays: number;
}

type FilterType = TimePeriod | 'custom';

const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const HRAttendanceTracker: React.FC = () => {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('this_month');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [availableMonths, setAvailableMonths] = useState<{month: string, year: number}[]>([]);
  const navigate = useNavigate();

  // Function to get days in a month
  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Function to get working days in a month (excluding Sundays)
  const getWorkingDaysInMonth = (year: number, month: number): number => {
    const totalDays = getDaysInMonth(year, month);
    let workingDays = 0;
    
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, month, day);
      if (date.getDay() !== 0) { // 0 is Sunday
        workingDays++;
      }
    }
    
    return workingDays;
  };

  // Function to get month info for a specific period
  const getMonthsInfo = (startDate: Date, endDate: Date): MonthInfo[] => {
    const months: MonthInfo[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const monthIndex = currentDate.getMonth();
      const year = currentDate.getFullYear();
      
      months.push({
        month: monthNames[monthIndex],
        year: year,
        totalDays: getDaysInMonth(year, monthIndex),
        workingDays: getWorkingDaysInMonth(year, monthIndex)
      });
      
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return months;
  };

  // Function to get unique months from data
  const extractAvailableMonths = (data: AttendanceRecord[]) => {
    const uniqueMonths = new Set<string>();
    const months: {month: string, year: number}[] = [];

    data.forEach(record => {
      const date = new Date(record.date);
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      const key = `${month}-${year}`;
      
      if (!uniqueMonths.has(key)) {
        uniqueMonths.add(key);
        months.push({ month, year });
      }
    });

    return months.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return monthNames.indexOf(b.month) - monthNames.indexOf(a.month);
    });
  };

  // Function to get the latest date from data
  const getLatestDate = (data: AttendanceRecord[]): Date => {
    if (data.length === 0) return new Date(2025, 0, 1); // Default to Jan 2025
    
    const sortedDates = [...data].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });
    
    return new Date(sortedDates[0].date);
  };

  // Function to filter and aggregate data based on time period
  const filterAndAggregateData = (data: AttendanceRecord[], filterType: FilterType): AggregatedRecord[] => {
    // Use real current month and year
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const latestDate = getLatestDate(data);
    let filteredData: AttendanceRecord[] = [];
    let monthsInfo: MonthInfo[] = [];

    if (filterType === 'custom') {
      const monthIndex = monthNames.indexOf(selectedMonth);
      monthsInfo = getMonthsInfo(
        new Date(selectedYear, monthIndex, 1),
        new Date(selectedYear, monthIndex + 1, 0)
      );
      filteredData = data.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getMonth() === monthIndex && recordDate.getFullYear() === selectedYear;
      });
    } else {
      const startDate = (() => {
        switch (filterType) {
          case 'this_month':
            // Use the real current month and year
            return new Date(currentYear, currentMonth, 1);
          case 'last_6_months': {
            const date = new Date(latestDate);
            date.setMonth(date.getMonth() - 5);
            return date;
          }
          case 'last_12_months': {
            const date = new Date(latestDate);
            date.setMonth(date.getMonth() - 11);
            return date;
          }
          case 'last_5_years': {
            const date = new Date(latestDate);
            date.setFullYear(date.getFullYear() - 4);
            return date;
          }
          default:
            return new Date(currentYear, currentMonth, 1);
        }
      })();
      // For 'this_month', end date is the end of the current month
      const endDate = filterType === 'this_month'
        ? new Date(currentYear, currentMonth + 1, 0)
        : latestDate;
      monthsInfo = getMonthsInfo(startDate, endDate);
      filteredData = data.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= startDate && recordDate <= endDate;
      });
    }

    // Calculate total calendar days and working days for the period
    const totalCalendarDays = monthsInfo.reduce((sum, month) => sum + month.totalDays, 0);
    const totalWorkingDays = monthsInfo.reduce((sum, month) => sum + month.workingDays, 0);

    // Aggregate data by employee
    const aggregatedMap = new Map<string, AggregatedRecord>();
    
    filteredData.forEach(record => {
      const existing = aggregatedMap.get(record.employee_id);
      
      // Convert values, handling any potential invalid data
      const presentDays = record.present_days || 0;
      const absentDays = record.absent_days || 0;
      const otHours = parseFloat(record.ot_hours) || 0;
      const lateMinutes = record.late_minutes || 0;
      
      if (existing) {
        existing.present_days += presentDays;
        existing.absent_days += absentDays;
        existing.ot_hours += otHours;
        existing.late_minutes += lateMinutes;
      } else {
        aggregatedMap.set(record.employee_id, {
          id: record.id,
          employee_id: record.employee_id,
          name: record.name,
          ...(filterType === 'this_month' || filterType === 'custom' ? {
            date: record.date
          } : {}),
          calendar_days: totalCalendarDays,
          total_working_days: totalWorkingDays,
          present_days: presentDays,
          absent_days: absentDays,
          attendance_percentage: record.attendance_percentage,
          ot_hours: otHours,
          late_minutes: lateMinutes
        });
      }
    });

    return Array.from(aggregatedMap.values());
  };

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://127.0.0.1:8000/api/excel/attendance/');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch attendance data: ${response.status}`);
        }
        
        const data: AttendanceRecord[] = await response.json();
        setAttendanceData(data);
        
        // Extract and set available months
        const months = extractAvailableMonths(data);
        setAvailableMonths(months);
        
        // Set initial month/year if not set
        if (!selectedMonth && months.length > 0) {
          setSelectedMonth(months[0].month);
          setSelectedYear(months[0].year);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error loading attendance data:', err);
        setError('Failed to load attendance data');
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, []);

  // Filter data based on search query
  const filteredBySearch = attendanceData.filter(record => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      record.name.toLowerCase().includes(query) ||
      record.employee_id.toLowerCase().includes(query)
    );
  });

  // Apply time period filter and aggregation
  const finalData = filterAndAggregateData(filteredBySearch, filterType);

  const normalizeDepartment = (dept: string | undefined) => (dept && dept.trim() !== '' && dept !== '0') ? dept : 'N/A';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Attendance Tracker</h1>
        <p className="text-gray-500">All Employee Attendance</p>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0B5E59]"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilterType)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm"
          >
            <option value="this_month">This Month</option>
            <option value="custom">Custom Month</option>
            <option value="last_6_months">Last 6 Months</option>
            <option value="last_12_months">Last 12 Months</option>
            <option value="last_5_years">Last 5 Years</option>
          </select>

          {filterType === 'custom' && (
            <select
              value={`${selectedMonth}-${selectedYear}`}
              onChange={(e) => {
                const [month, year] = e.target.value.split('-');
                setSelectedMonth(month);
                setSelectedYear(parseInt(year));
              }}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm"
            >
              {availableMonths.map(({ month, year }) => (
                <option key={`${month}-${year}`} value={`${month}-${year}`}>
                  {month} {year}
                </option>
              ))}
            </select>
          )}

          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm">
            <Filter size={16} />
            Filter
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-gray-500">Loading attendance data...</div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-red-500">{error}</div>
          </div>
        ) : (
        <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left text-sm font-medium text-gray-600 px-4 py-3">Employee ID</th>
                  <th className="text-left text-sm font-medium text-gray-600 px-4 py-3">Name</th>
                  <th className="text-left text-sm font-medium text-gray-600 px-4 py-3">Calendar Days</th>
                  <th className="text-left text-sm font-medium text-gray-600 px-4 py-3">Total Working Days</th>
                  <th className="text-left text-sm font-medium text-gray-600 px-4 py-3">Present Days</th>
                  <th className="text-left text-sm font-medium text-gray-600 px-4 py-3">Absent Days</th>
                  <th className="text-left text-sm font-medium text-gray-600 px-4 py-3">OT Hours</th>
                  <th className="text-left text-sm font-medium text-gray-600 px-4 py-3">Late Minutes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                  {finalData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                        No attendance records found.
                    </td>
                  </tr>
                  ) : (
                    finalData.map((record, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{record.employee_id}</td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => navigate(`/hr-management/directory/${record.employee_id}`)}
                            className="text-[#0B5E59] hover:underline text-left"
                          >
                            {record.name}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm">{record.calendar_days}</td>
                        <td className="px-4 py-3 text-sm">{record.total_working_days}</td>
                        <td className="px-4 py-3 text-sm">{record.present_days.toFixed(1)}</td>
                        <td className="px-4 py-3 text-sm">{record.absent_days.toFixed(1)}</td>
                        <td className="px-4 py-3 text-sm">{record.ot_hours.toFixed(1)}</td>
                        <td className="px-4 py-3 text-sm">{record.late_minutes.toFixed(0)}</td>
                      </tr>
                    ))
                  )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HRAttendanceTracker; 