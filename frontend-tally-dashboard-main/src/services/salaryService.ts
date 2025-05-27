// Define the new TimePeriod type
export type TimePeriod = 'this_month' | 'last_6_months' | 'last_12_months' | 'last_5_years';

// Interface representing the raw API response format
export interface SalaryRawData {
  id: number;
  year: number;
  month: string;
  date: string;
  name: string;
  employee_id: string;
  department: string;
  basic_salary: string;
  days_present: string;
  days_absent: string;
  sl_wo_ot_wo_late: string;
  ot_hours: string;
  basic_salary_per_hour: string;
  ot_charges: string;
  late_minutes: string;
  basic_salary_per_minute: string;
  incentive: string;
  late_charges: string;
  salary_wo_advance_deduction: string;
  adv_paid_on_25th: string;
  repayment_of_old_adv: string;
  net_payable: string;
  total_old_advance: string;
  final_balance_advance: string;
  tds: string;
  sal_before_tds: string;
  advance: string;
}

// Interface for processed salary data to be used by the frontend
export interface SalaryData {
  // Stats data
  totalEmployees: number;
  avgAttendancePercentage: number;
  totalWorkingDays: number;
  totalOTHours: number;
  totalLateMinutes: number;
  
  // Comparison data (trends/changes)
  employeesChange: number;
  attendanceChange: number;
  lateMinutesChange: number;
  otHoursChange: number;
  
  // Department data
  departmentData: {
    department: string;
    averageSalary: number;
    headcount: number;
    totalSalary: number;
    attendancePercentage: number;
    totalOTHours: number;
  }[];
  
  // Distribution data
  salaryDistribution: {
    range: string;
    count: number;
  }[];
  
  // Attendance data
  todayAttendance: {
    status: string;
    count: number;
  }[];
  
  // Trends data
  salaryTrends: {
    month: string;
    averageSalary: number;
  }[];
  
  // OT trends
  otTrends: {
    month: string;
    averageOTHours: number;
  }[];
  
  // Top salaried employees
  topSalariedEmployees: {
    name: string;
    salary: number;
    department: string;
  }[];
  
  // Department distribution
  departmentDistribution: {
    department: string;
    count: number;
  }[];
}

// Constants
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthOrder = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  
  // Monthly mapping to handle all variants
  const monthMapping: Record<string, number> = {
    'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAY': 4, 'JUN': 5, 
    'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11,
    'JANUARY': 0, 'FEBRUARY': 1, 'MARCH': 2, 'APRIL': 3, 'JUNE': 5, 
    'JULY': 6, 'AUGUST': 7, 'SEPTEMBER': 8, 'OCTOBER': 9, 'NOVEMBER': 10, 'DECEMBER': 11,
    'SEPT': 8, // Special case
  };
  
// Helper functions
const normalizeDepartment = (dept: string | undefined): string => 
  (dept && dept.trim() !== '' && dept !== '0') ? dept : 'N/A';

const parseNumericField = (field: string | undefined): number => parseFloat(field || '0') || 0;

// Helper function to get the latest available month from data
const getLatestAvailableMonth = (data: SalaryRawData[]): Date => {
  if (data.length === 0) {
    return new Date(2025, 0, 1); // Default to January 2025 as specified
  }
  
  const sortedData = [...data].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return monthOrder.indexOf(b.month) - monthOrder.indexOf(a.month);
  });
  
  const latestRecord = sortedData[0];
  const monthIndex = monthMapping[latestRecord.month.toUpperCase()] || 0;
  return new Date(latestRecord.year, monthIndex, 1);
};

// Helper function to get time ranges based on latest month
const getTimeRanges = (latestMonth: Date): Record<TimePeriod, { start: Date; end: Date }> => {
  const normalizedLatestMonth = new Date(latestMonth.getFullYear(), latestMonth.getMonth(), 1);
  
  return {
    'this_month': {
      start: normalizedLatestMonth,
      end: new Date(normalizedLatestMonth.getFullYear(), normalizedLatestMonth.getMonth() + 1, 0)
    },
    'last_6_months': {
      start: new Date(normalizedLatestMonth.getFullYear(), normalizedLatestMonth.getMonth() - 5, 1),
      end: new Date(normalizedLatestMonth.getFullYear(), normalizedLatestMonth.getMonth() + 1, 0)
    },
    'last_12_months': {
      start: new Date(normalizedLatestMonth.getFullYear(), normalizedLatestMonth.getMonth() - 11, 1),
      end: new Date(normalizedLatestMonth.getFullYear(), normalizedLatestMonth.getMonth() + 1, 0)
    },
    'last_5_years': {
      start: new Date(normalizedLatestMonth.getFullYear() - 4, normalizedLatestMonth.getMonth(), 1),
      end: new Date(normalizedLatestMonth.getFullYear(), normalizedLatestMonth.getMonth() + 1, 0)
    }
  };
};
  
  // Helper function to extract month and year from date string
  const extractMonthYearFromDate = (dateStr: string | undefined, fallbackMonth: string, fallbackYear: number): { month: string, year: number } => {
    if (!dateStr) {
      // Fallback to the provided month and year fields
      const monthIdx = monthMapping[fallbackMonth?.toUpperCase()];
      const month = monthIdx !== undefined ? monthNames[monthIdx] : fallbackMonth;
      return { month, year: fallbackYear };
    }

    try {
      // First try MM/DD/YYYY format
      const parts = dateStr.split('/');
      if (parts.length >= 3) {
        const monthNum = parseInt(parts[0], 10);
        if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
          const month = monthNames[monthNum - 1];
          const year = parseInt(parts[2], 10);
          if (!isNaN(year)) {
            return { month, year };
          }
        }
      }
      
      // Try other formats if the first one failed
      const dateObj = new Date(dateStr);
      if (!isNaN(dateObj.getTime())) {
        const month = monthNames[dateObj.getMonth()];
        const year = dateObj.getFullYear();
        return { month, year };
      }
    } catch (e) {
      console.error(`Error parsing date: ${dateStr}`, e);
    }
    
    // If all parsing fails, use the fallback
    const monthIdx = monthMapping[fallbackMonth?.toUpperCase()];
    const month = monthIdx !== undefined ? monthNames[monthIdx] : fallbackMonth;
    return { month, year: fallbackYear };
  };
  
// Function to filter data by time period
const filterDataByTimePeriod = (data: SalaryRawData[], timePeriod?: TimePeriod): { 
  currentPeriodData: SalaryRawData[], 
  previousPeriodData: SalaryRawData[] 
} => {
  if (!timePeriod || data.length === 0) {
    return { currentPeriodData: data, previousPeriodData: [] };
  }
  
  const latestMonth = getLatestAvailableMonth(data);
  const timeRanges = getTimeRanges(latestMonth);
  const range = timeRanges[timePeriod];
  
  // Helper function to check if a record falls within a date range
  const isWithinRange = (record: SalaryRawData, start: Date, end: Date): boolean => {
    const monthIndex = monthMapping[record.month.toUpperCase()] || 0;
    const recordDate = new Date(record.year, monthIndex, 1);
    return recordDate >= start && recordDate <= end;
  };
  
  // Filter current period data
  const currentPeriodData = data.filter(record => isWithinRange(record, range.start, range.end));
  
  // Calculate previous period range
  const previousPeriodStart = new Date(range.start);
  const previousPeriodEnd = new Date(range.end);
  const monthDiff = range.end.getMonth() - range.start.getMonth() + 
                   (12 * (range.end.getFullYear() - range.start.getFullYear())) + 1;
  
  previousPeriodStart.setMonth(previousPeriodStart.getMonth() - monthDiff);
  previousPeriodEnd.setMonth(previousPeriodEnd.getMonth() - monthDiff);
  
  // Filter previous period data
  const previousPeriodData = data.filter(record => 
    isWithinRange(record, previousPeriodStart, previousPeriodEnd)
  );
  
  return { currentPeriodData, previousPeriodData };
};

// Compare periods for sorting
const comparePeriods = (a: { month: string }, b: { month: string }): number => {
  const [monthA, yearA] = a.month.split(' ');
  const [monthB, yearB] = b.month.split(' ');
  
  if (yearA !== yearB) {
    return parseInt(yearA) - parseInt(yearB);
  }
  
  return monthNames.indexOf(monthA) - monthNames.indexOf(monthB);
};

// Process the raw API data to the format needed by the frontend
const processRawData = (currentData: SalaryRawData[], previousData: SalaryRawData[], timePeriod: TimePeriod = 'this_month'): SalaryData => {
  // Initialize maps and constants
  const departments = new Map<string, {
    employees: number;
    totalSalary: number;
    totalOT: number;
    totalPresent: number;
    totalDays: number;
  }>();
  
  const monthlyData = new Map<string, {
    totalSalary: number;
    employeeCount: number;
    totalOT: number;
  }>();
  
  const salaryTrendsMap = new Map<string, {
    totalSalary: number;
    employeeCount: number;
    distinctEmployees: Set<string>;
  }>();
  
  const otTrendsMap = new Map<string, {
    totalOTHours: number;
    employeeCount: number;
  }>();
  
  const departmentEmployeeCounts = new Map<string, Set<string>>();
  
  // Salary ranges for distribution
  const salaryRanges = [
    { min: 0, max: 20000, label: '0-20k', count: 0 },
    { min: 20000, max: 40000, label: '20k-40k', count: 0 },
    { min: 40000, max: 60000, label: '40k-60k', count: 0 },
    { min: 60000, max: 80000, label: '60k-80k', count: 0 },
    { min: 80000, max: Infinity, label: '80k+', count: 0 }
  ];
  
  // Filter out records with empty names
  const validCurrentData = currentData.filter(employee => employee.name && employee.name.trim() !== '');
  const validPreviousData = previousData.filter(employee => employee.name && employee.name.trim() !== '');
  
  // Count distinct employees
  const distinctCurrentEmployees = new Set<string>();
  validCurrentData.forEach(employee => distinctCurrentEmployees.add(employee.name));
  
  const distinctPreviousEmployees = new Set<string>();
  validPreviousData.forEach(employee => distinctPreviousEmployees.add(employee.name));
  
  // Initialize stats
  let currentTotalPresent = 0;
  let currentTotalDays = 0;
  let currentTotalOTHours = 0;
  let currentTotalLateMinutes = 0;
  
  let previousTotalPresent = 0;
  let previousTotalDays = 0;
  let previousTotalOTHours = 0;
  let previousTotalLateMinutes = 0;
  
  // Employee-specific data
  const employeeData: Array<{ name: string; salary: number; department: string; }> = [];
  
  // Process current period data
  validCurrentData.forEach(employee => {
    const department = normalizeDepartment(employee.department);
    const salary = parseNumericField(employee.basic_salary);
    const present = parseNumericField(employee.days_present);
    const absent = parseNumericField(employee.days_absent);
    const totalDaysForEmployee = present + absent;
    const otHours = parseNumericField(employee.ot_hours);
    const lateMinutes = parseNumericField(employee.late_minutes);
    const period = `${employee.year}-${employee.month}`;
    
    // Store employee data
    employeeData.push({ name: employee.name, salary, department });
    
    // Update stats
    currentTotalOTHours += otHours;
    currentTotalLateMinutes += lateMinutes;
    currentTotalPresent += present;
    currentTotalDays += totalDaysForEmployee;
    
    // Department tracking
    if (!departments.has(department)) {
      departments.set(department, {
        employees: 0, totalSalary: 0, totalOT: 0, totalPresent: 0, totalDays: 0
      });
    }
    
    // Update department data
    const deptData = departments.get(department)!;
    deptData.employees += 1;
    deptData.totalSalary += salary;
    deptData.totalOT += otHours;
    deptData.totalPresent += present;
    deptData.totalDays += totalDaysForEmployee;
    
    // Track monthly data
    if (!monthlyData.has(period)) {
      monthlyData.set(period, { totalSalary: 0, employeeCount: 0, totalOT: 0 });
    }
    
    const monthData = monthlyData.get(period)!;
    monthData.totalSalary += salary;
    monthData.employeeCount += 1;
    monthData.totalOT += otHours;
    
    // Salary distribution
    for (const range of salaryRanges) {
      if (salary >= range.min && salary < range.max) {
        range.count += 1;
        break;
      }
    }
    
    // Department employee counts
    if (!departmentEmployeeCounts.has(department)) {
      departmentEmployeeCounts.set(department, new Set<string>());
    }
    departmentEmployeeCounts.get(department)!.add(employee.name);
    
    // Salary trends
    const { month, year } = extractMonthYearFromDate(employee.date, employee.month, employee.year);
    if (month && year) {
      const trendPeriod = `${year}-${month}`;
      if (!salaryTrendsMap.has(trendPeriod)) {
        salaryTrendsMap.set(trendPeriod, {
          totalSalary: 0, employeeCount: 0, distinctEmployees: new Set<string>()
        });
      }
      
      const periodData = salaryTrendsMap.get(trendPeriod)!;
      periodData.totalSalary += salary;
      periodData.employeeCount += 1;
      periodData.distinctEmployees.add(employee.name);
      
      // OT trends
      if (!otTrendsMap.has(trendPeriod)) {
        otTrendsMap.set(trendPeriod, { totalOTHours: 0, employeeCount: 0 });
      }
      
      const otData = otTrendsMap.get(trendPeriod)!;
      otData.totalOTHours += otHours;
      otData.employeeCount += 1;
    }
  });
  
  // Process previous period data
  validPreviousData.forEach(employee => {
    const present = parseNumericField(employee.days_present);
    const absent = parseNumericField(employee.days_absent);
    const totalDaysForEmployee = present + absent;
    const otHours = parseNumericField(employee.ot_hours);
    const lateMinutes = parseNumericField(employee.late_minutes);
    
    // Update previous stats
    previousTotalOTHours += otHours;
    previousTotalLateMinutes += lateMinutes;
    previousTotalPresent += present;
    previousTotalDays += totalDaysForEmployee;
  });
  
  // Process department data
  const departmentData = Array.from(departments.entries()).map(([dept, data]) => {
    const distinctCount = departmentEmployeeCounts.get(dept)?.size || 0;
    return {
      department: dept,
      headcount: distinctCount,
      totalSalary: data.totalSalary,
      averageSalary: distinctCount > 0 ? data.totalSalary / distinctCount : 0,
      attendancePercentage: data.totalDays > 0 ? (data.totalPresent / data.totalDays) * 100 : 0,
      totalOTHours: data.totalOT
    };
  });
  
  // Process salary trends
  const salaryTrends = Array.from(salaryTrendsMap.entries())
    .map(([period, data]) => {
      const [year, month] = period.split('-');
      return {
        month: `${month} ${year}`,
        averageSalary: data.employeeCount > 0 ? data.totalSalary / data.employeeCount : 0
      };
    })
    .sort(comparePeriods);
  
  // Process OT trends
  const otTrends = Array.from(otTrendsMap.entries())
    .map(([period, data]) => {
      const [year, month] = period.split('-');
      return {
        month: `${month} ${year}`,
        averageOTHours: data.employeeCount > 0 ? data.totalOTHours / data.employeeCount : 0
      };
    })
    .sort(comparePeriods);
  
  // Calculate attendance
  const avgAttendancePercentage = currentTotalDays > 0 ? (currentTotalPresent / currentTotalDays) * 100 : 0;
  const previousAvgAttendancePercentage = previousTotalDays > 0 ? (previousTotalPresent / previousTotalDays) * 100 : 0;
  
  // Calculate total working days
  const totalWorkingDays = validCurrentData.length > 0
    ? Math.max(...validCurrentData.map(e => parseNumericField(e.days_present) + parseNumericField(e.days_absent)))
    : 0;
  
  // Today's attendance
  const present = currentTotalPresent;
  const absent = currentTotalDays - currentTotalPresent;
  
  const todayAttendance = [
    { status: 'Present', count: present },
    { status: 'Absent', count: absent }
  ];
  
  // Top salaried employees
  const uniqueEmployees = new Map<string, { name: string, salary: number, department: string }>();
  
  employeeData.forEach(employee => {
    const cleanName = employee.name.replace(/\s+\d+$/, '');
    
    if (!uniqueEmployees.has(cleanName) || employee.salary > uniqueEmployees.get(cleanName)!.salary) {
      uniqueEmployees.set(cleanName, {
        name: cleanName,
        salary: employee.salary,
        department: employee.department
      });
    }
  });
  
  const topSalariedEmployees = Array.from(uniqueEmployees.values())
    .sort((a, b) => b.salary - a.salary)
    .slice(0, 5);
  
  // Department distribution
  const departmentDistribution = departmentData.map(dept => ({
    department: dept.department,
    count: dept.headcount
  }));
  
  // Salary distribution
  const salaryDistribution = salaryRanges.map(range => ({
    range: range.label,
    count: range.count
  }));
  
  // Calculate changes
  const totalEmployees = distinctCurrentEmployees.size;
  const previousTotalEmployees = distinctPreviousEmployees.size;
  
  // Calculate percentage changes for comparison metrics
  const calculatePercentageChange = (current: number, previous: number): number => {
    if (previous > 0) {
      return ((current - previous) / previous) * 100;
    } else if (current > 0) {
      return 100; // If no previous data but we have current data, show as 100% increase
    }
    return 0;
  };
  
  const employeesChange = calculatePercentageChange(totalEmployees, previousTotalEmployees);
  const attendanceChange = previousAvgAttendancePercentage > 0 ? avgAttendancePercentage - previousAvgAttendancePercentage : 0;
  const lateMinutesChange = calculatePercentageChange(currentTotalLateMinutes, previousTotalLateMinutes);
  const otHoursChange = calculatePercentageChange(currentTotalOTHours, previousTotalOTHours);
  
  // Cap and round the change values
  const capAndRoundChange = (value: number, max: number): number => 
    Math.max(Math.min(Math.round(value * 10) / 10, max), -max);
  
  return {
    totalEmployees,
    avgAttendancePercentage,
    totalWorkingDays,
    totalOTHours: currentTotalOTHours,
    totalLateMinutes: currentTotalLateMinutes,
    employeesChange: capAndRoundChange(employeesChange, 999.9),
    attendanceChange: capAndRoundChange(attendanceChange, 100),
    lateMinutesChange: capAndRoundChange(lateMinutesChange, 999.9),
    otHoursChange: capAndRoundChange(otHoursChange, 999.9),
    departmentData,
    salaryDistribution,
    todayAttendance,
    salaryTrends,
    otTrends,
    topSalariedEmployees,
    departmentDistribution
  };
};

// Export the main function to fetch salary data
export const fetchSalaryData = async (timePeriod: TimePeriod = 'this_month'): Promise<SalaryData> => {
  try {
    const url = 'http://127.0.0.1:8000/api/excel/salary-data/';
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', response.status, 'Error details:', errorText);
      throw new Error(`Failed to fetch salary data: ${response.status}`);
    }
    
    const rawData: SalaryRawData[] = await response.json();
    
    const { currentPeriodData, previousPeriodData } = filterDataByTimePeriod(rawData, timePeriod);
    
    return processRawData(currentPeriodData, previousPeriodData, timePeriod);
  } catch (error) {
    console.error('Error fetching salary data:', error);
    throw error; // Rethrow to allow proper error handling by caller
  }
};

// Helper function to format salary numbers
export const formatSalary = (salary: number): string => {
  const roundedSalary = Math.round(salary);
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(roundedSalary);
};

// Payment API integration
export const fetchPayments = async () => {
  const response = await fetch('http://127.0.0.1:8000/api/excel/payments/');
  if (!response.ok) throw new Error('Failed to fetch payments');
  return response.json();
};

export const createPayment = async (payload: any) => {
  const response = await fetch('http://127.0.0.1:8000/api/excel/payments/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to create payment');
  return response.json();
};

export const updatePayment = async (id: string, payload: any) => {
  const response = await fetch(`http://127.0.0.1:8000/api/excel/payments/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to update payment');
  return response.json();
};

// Fetch salary data for a specific employee and month/year
export const fetchSalaryDataForEmployeeMonth = async (
  employee_id: string,
  year: number,
  month: string
): Promise<SalaryRawData | null> => {
  const url = `http://127.0.0.1:8000/api/excel/salary-data/?employee_id=${employee_id}&year=${year}&month=${month}`;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const data: SalaryRawData[] = await response.json();
    // Return the first matching record (should be only one per employee/month)
    return data.length > 0 ? data[0] : null;
  } catch (e) {
    console.error('Error fetching salary data for employee/month:', e);
    return null;
  }
}; 