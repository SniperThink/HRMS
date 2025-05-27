import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreHorizontal, Eye, Edit, Trash2, Plus, Download, ChevronLeft, ChevronRight, Wallet, Gift, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { exportToExcel, EmployeeData } from '../utils/excelExport';

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

interface DirectoryData {
  employee_id: string;
  name: string;
  mobile_number: string;
  email: string;
  department: string;
  designation: string;
  employment_type: string;
  branch_location: string;
  shift_start_time: string;
  shift_end_time: string;
  basic_salary: string;
}

interface SalaryRecord {
  employee_id: string;
  days_present: string;
  days_absent: string;
  ot_hours: string;
}

const HRDirectory: React.FC = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showMenu, setShowMenu] = useState<boolean>(false);
  
  // Add pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const entriesPerPage = 15;

  // Add a new state to store the departments to be applied
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [pendingDepartments, setPendingDepartments] = useState<string[]>([]);
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    const loadEmployeeData = async () => {
      try {
        setLoading(true);
        
        // Fetch both directory and salary data in parallel
        const [directoryResponse, salaryResponse] = await Promise.all([
          fetch('http://127.0.0.1:8000/api/excel/employees/get_directory_data/'),
          fetch('http://127.0.0.1:8000/api/excel/salary-data/')
        ]);
        
        if (!directoryResponse.ok || !salaryResponse.ok) {
          throw new Error(`Failed to fetch data: ${directoryResponse.status}, ${salaryResponse.status}`);
        }
        
        const directoryData: DirectoryData[] = await directoryResponse.json();
        const salaryData: SalaryRecord[] = await salaryResponse.json();
        
        // Process and combine the data
        const processedData = processEmployeeData(directoryData, salaryData);
        setEmployees(processedData);
        setError(null);
      } catch (err) {
        console.error('Error loading employee data:', err);
        setError('Failed to load employee data');
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };

    loadEmployeeData();
  }, []);

  // Function to calculate attendance percentage and OT hours for an employee
  const calculateEmployeeMetrics = (employeeId: string, salaryRecords: SalaryRecord[]) => {
    const employeeRecords = salaryRecords.filter(record => record.employee_id === employeeId);
    
    if (employeeRecords.length === 0) {
      return {
        attendancePercentage: '-',
        totalOTHours: '-'
      };
    }

    // Calculate total present and absent days
    let totalPresent = 0;
    let totalDays = 0;
    let totalOTHours = 0;

    employeeRecords.forEach(record => {
      const present = parseInt(record.days_present || '0');
      const absent = parseInt(record.days_absent || '0');
      const otHours = parseFloat(record.ot_hours || '0');

      totalPresent += present;
      totalDays += (present + absent);
      totalOTHours += otHours;
    });

    // Calculate attendance percentage
    const attendancePercentage = totalDays > 0 
      ? `${((totalPresent / totalDays) * 100).toFixed(1)}%`
      : '-';

    // Format OT hours
    const formattedOTHours = totalOTHours > 0 
      ? `${totalOTHours.toFixed(2)} hrs`
      : '-';

    return {
      attendancePercentage,
      totalOTHours: formattedOTHours
    };
  };

  // Function to process and combine directory and salary data
  const processEmployeeData = (directoryData: DirectoryData[], salaryRecords: SalaryRecord[]): EmployeeData[] => {
    return directoryData.map(employee => {
      const metrics = calculateEmployeeMetrics(employee.employee_id, salaryRecords);
      
      return {
        employee_id: employee.employee_id,
        name: employee.name,
        mobile_number: employee.mobile_number,
        email: employee.email,
        department: employee.department,
        designation: employee.designation,
        employment_type: employee.employment_type,
        branch_location: employee.branch_location,
        attendance: metrics.attendancePercentage,
        ot_hours: metrics.totalOTHours,
        shiftStartTime: employee.shift_start_time,
        shiftEndTime: employee.shift_end_time,
        basic_salary: employee.basic_salary
      };
    });
  };

  // Filter employees based on search query
  const filteredEmployees = employees.filter(employee => {
    if (selectedDepartments.length > 0 && !selectedDepartments.includes(employee.department)) {
      return false;
    }
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      employee.name.toLowerCase().includes(query) ||
      employee.employee_id.toLowerCase().includes(query) ||
      employee.department.toLowerCase().includes(query) ||
      employee.designation.toLowerCase().includes(query)
    );
  });

  // Calculate pagination values
  const totalPages = Math.ceil(filteredEmployees.length / entriesPerPage);
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredEmployees.slice(indexOfFirstEntry, indexOfLastEntry);

  // Handle page changes
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    }
    return pageNumbers;
  };

  const handleExport = () => {
    exportToExcel(employees, 'employee_directory');
    setShowMenu(false);
  };

  const normalizeDepartment = (dept: string | undefined) => (dept && dept.trim() !== '' && dept !== '0') ? dept : 'N/A';

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="p-4">
        <div className="flex justify-between mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              className="flex items-center gap-2 px-3 py-2 bg-[#1A6262] text-white rounded-lg text-sm hover:bg-[#155252]"
              onClick={() => navigate('/hr-management/directory/add')}
            >
              <Plus size={16} />
              Add New Employee
            </button>
            
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm" onClick={() => { setPendingDepartments(selectedDepartments); setShowFilter(true); }}>
              <Filter size={16} />
              Filter
            </button>
            
            <div className="relative">
              <button 
                className="p-2 border border-gray-200 rounded-lg"
                onClick={() => setShowMenu(!showMenu)}
              >
                <MoreHorizontal size={16} />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 divide-y divide-gray-100">
                  <button 
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    onClick={handleExport}
                  >
                    <Download size={16} className="text-gray-500" />
                    Export to Excel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-gray-500">Loading employee data...</div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-red-500">{error}</div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Employee ID</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Employee Name</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Mobile Number</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Email</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Department</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Designation</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Employment Type</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Branch/Location</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Attendance %</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Total OT Hours</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Shift Start Time</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Shift End Time</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Basic Salary</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentEntries.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="px-4 py-6 text-center text-gray-500">
                        No employee records found.
                      </td>
                    </tr>
                  ) : (
                    currentEntries.map((employee) => (
                      <tr key={employee.employee_id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{employee.employee_id}</td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => navigate(`/hr-management/directory/${employee.employee_id}`)}
                            className="text-[#0B5E59] hover:underline text-left"
                          >
                            {employee.name}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm">{employee.mobile_number}</td>
                        <td className="px-4 py-3 text-sm">{employee.email}</td>
                        <td className="px-4 py-3 text-sm">{normalizeDepartment(employee.department)}</td>
                        <td className="px-4 py-3 text-sm">{employee.designation}</td>
                        <td className="px-4 py-3 text-sm">{employee.employment_type}</td>
                        <td className="px-4 py-3 text-sm">{employee.branch_location}</td>
                        <td className="px-4 py-3 text-sm">{employee.attendance}</td>
                        <td className="px-4 py-3 text-sm">{employee.ot_hours}</td>
                        <td className="px-4 py-3 text-sm">{employee.shiftStartTime}</td>
                        <td className="px-4 py-3 text-sm">{employee.shiftEndTime}</td>
                        <td className="px-4 py-3 text-sm">{employee.basic_salary}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              className="text-gray-500 hover:text-red-600"
                              onClick={async () => {
                                if (window.confirm('Are you sure you want to delete this employee?')) {
                                  try {
                                    const res = await fetch(`http://127.0.0.1:8000/api/excel/employees/delete_by_employee_id/?employee_id=${employee.employee_id}`, { method: 'DELETE' });
                                    if (res.ok) {
                                      setEmployees(prev => prev.filter(e => e.employee_id !== employee.employee_id));
                                    } else {
                                      alert('Failed to delete employee.');
                                    }
                                  } catch (err) {
                                    alert('Error deleting employee.');
                                  }
                                }
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 mt-4">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md 
                    ${currentPage === 1 
                      ? 'text-gray-300 cursor-not-allowed' 
                      : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium rounded-md
                    ${currentPage === totalPages 
                      ? 'text-gray-300 cursor-not-allowed' 
                      : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{indexOfFirstEntry + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(indexOfLastEntry, filteredEmployees.length)}
                    </span>{' '}
                    of <span className="font-medium">{filteredEmployees.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center rounded-l-md px-2 py-2 
                        ${currentPage === 1 
                          ? 'text-gray-300 cursor-not-allowed' 
                          : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    
                    {getPageNumbers().map((pageNum, index) => (
                      <button
                        key={index}
                        onClick={() => typeof pageNum === 'number' ? handlePageChange(pageNum) : null}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-medium
                          ${pageNum === currentPage 
                            ? 'z-10 bg-teal-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600' 
                            : pageNum === '...' 
                              ? 'text-gray-700'
                              : 'text-gray-900 hover:bg-gray-50'}`}
                      >
                        {pageNum}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center rounded-r-md px-2 py-2 
                        ${currentPage === totalPages 
                          ? 'text-gray-300 cursor-not-allowed' 
                          : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>

            {/* Filter Modal */}
            {showFilter && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
                <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-xs">
                  <h2 className="text-lg font-semibold mb-4">Filter</h2>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['PLATING', 'MECHINE', 'CASTING', 'PACKING', 'HELPERS', 'N/A(0)', 'Sales', 'polish'].map(dept => (
                        <label key={dept} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={pendingDepartments.includes(dept)}
                            onChange={e => {
                              if (e.target.checked) {
                                setPendingDepartments(prev => [...prev, dept]);
                              } else {
                                setPendingDepartments(prev => prev.filter(d => d !== dept));
                              }
                            }}
                            className="accent-teal-700"
                          />
                          {dept}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <button className="px-5 py-2 border border-gray-200 text-gray-700 rounded-lg" onClick={() => setShowFilter(false)}>Cancel</button>
                    <button className="px-5 py-2 bg-teal-700 text-white rounded-lg" onClick={() => { setSelectedDepartments(pendingDepartments); setShowFilter(false); }}>Apply</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HRDirectory; 