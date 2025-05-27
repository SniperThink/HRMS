import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Tabs } from './components/Tabs';
import { TabContent } from './components/TabContent';
import { FilterState } from './types/dashboard';
import HRSidebar from './components/HRSidebar';
import HRHeader from './components/HRHeader';
import HRStats from './components/HRStats';
import HROverviewCharts from './components/HROverviewCharts';
import HRRecentActivities from './components/HRRecentActivities';
import HRDirectory from './components/HRDirectory';
import HRAddEmployee from './components/HRAddEmployee';
import HRPayroll from './components/HRPayroll';
import HRAttendanceTracker from './components/HRAttendanceTracker';
import HRLeaveManagement from './components/HRLeaveManagement';
import HROperationsLog from './components/HROperationsLog';
import HRSettings from './components/HRSettings';
import HREmployeeDetails from './components/HREmployeeDetails';
import { ChevronDown } from 'lucide-react';
import { TimePeriod } from './services/salaryService';

const initialFilters: FilterState = {
  dateRange: {
    start: new Date(),
    end: new Date(),
    type: 'daily'
  },
  category: 'all',
  timePeriod: 'this_month',
  department: 'All',
  employee: 'All',
  status: 'All',
  date: 'All',
  year: 'All'
};

const timeFilterOptions = [
  { value: 'this_month', label: 'This Month' },
  { value: 'last_6_months', label: 'Last 6 Months' },
  { value: 'last_12_months', label: 'Last 12 Months' },
  { value: 'last_5_years', label: 'Last 5 Years' }
];

// Time period options for HR dashboard
const timePeriodOptions: { label: string; value: TimePeriod }[] = [
  { label: 'This Month', value: 'this_month' },
  { label: 'Last 6 Months', value: 'last_6_months' },
  { label: 'Last 12 Months', value: 'last_12_months' },
  { label: 'Last 5 Years', value: 'last_5_years' },
];

// Main app wrapper to use location hooks
function AppContent() {
  const [activeTab, setActiveTab] = useState('revenue');
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('this_month');
  const [showTimePeriodDropdown, setShowTimePeriodDropdown] = useState(false);
  const [activePage, setActivePage] = useState('overview'); // Track active HR page
  const location = useLocation();
  const [selectedDepartment, setSelectedDepartment] = useState('All');

  // Get current time period label
  const currentTimePeriodLabel = timePeriodOptions.find(opt => opt.value === timePeriod)?.label || 'This Month';

  // Update activePage based on current route
  useEffect(() => {
    if (location.pathname === '/hr-management') {
      setActivePage('overview');
    } else if (location.pathname === '/hr-management/directory') {
      setActivePage('directory');
    } else if (location.pathname === '/hr-management/directory/add') {
      setActivePage('add-employee');
    } else if (location.pathname === '/hr-management/operations-log') {
      setActivePage('operations-log');
    } else if (location.pathname === '/hr-management/payroll') {
      setActivePage('payroll');
    } else if (location.pathname === '/hr-management/attendance-tracker') {
      setActivePage('attendance-tracker');
    } else if (location.pathname === '/hr-management/leave-management') {
      setActivePage('leave-management');
    } else if (location.pathname === '/hr-management/settings') {
      setActivePage('settings');
    }
  }, [location.pathname]);

  // Handle time period selection
  const handleTimePeriodSelect = (newTimePeriod: TimePeriod) => {
    setTimePeriod(newTimePeriod);
    setShowTimePeriodDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowTimePeriodDropdown(false);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Prevent dropdown from closing when clicking inside
  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <Routes>
        <Route path="/hr-management/*" element={<HRSidebar activePage={activePage} onPageChange={setActivePage} />} />
        <Route path="/dashboard" element={<Sidebar activePath="dashboard" onNavigate={() => {}} />} />
        <Route path="*" element={<HRSidebar activePage={activePage} onPageChange={setActivePage} />} />
      </Routes>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Routes>
          <Route path="/dashboard" element={<Header filters={filters} onFilterChange={setFilters} />} />
          <Route path="/hr-management/*" element={<HRHeader />} />
          <Route path="*" element={<HRHeader />} />
        </Routes>

        {/* Main Content with Right Sidebar */}
        <div className="flex flex-1 overflow-hidden">
          {/* Main Content */}
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-full mx-auto">
              <Routes>
                {/* Redirect the root path to /hr-management */}
                <Route path="/" element={<Navigate to="/hr-management" />} />

                {/* Dashboard Route */}
                <Route path="/dashboard" element={
                  <>
                    <h1 className="text-2xl font-semibold mb-1">Dashboard</h1>
                    <p className="text-gray-600 mb-6">Review your business performance with key metrics</p>
                    <div className="space-y-6">
                      <Tabs activeTab={activeTab} onTabChange={setActiveTab} />
                      <TabContent activeTab={activeTab} filters={filters} />
                    </div>
                  </>
                } />

                {/* HR Management Routes */}
                <Route path="/hr-management" element={
                  <>
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-4">
                        <div className="relative" onClick={handleDropdownClick}>
                          <button 
                            className="flex items-center gap-2 text-sm px-4 py-2 bg-white border rounded-lg"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowTimePeriodDropdown(!showTimePeriodDropdown);
                            }}
                          >
                            {currentTimePeriodLabel}
                            <ChevronDown size={16} />
                          </button>
                          
                          {showTimePeriodDropdown && (
                            <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-md z-10 w-48">
                              {timePeriodOptions.map((option) => (
                                <button
                                  key={option.value}
                                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                                  onClick={() => handleTimePeriodSelect(option.value)}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <select
                          value={selectedDepartment}
                          onChange={(e) => setSelectedDepartment(e.target.value)}
                          className="text-sm px-4 py-2 bg-white border rounded-lg w-48"
                        >
                          <option value="All">All Departments</option>
                          <option value="polish">Polish</option>
                          <option value="Sales">Sales</option>
                          <option value="PLATING">Plating</option>
                          <option value="HELPERS">Helpers</option>
                          <option value="N/A">N/A</option>
                          <option value="PACKING">Packing</option>
                          <option value="CASTING">Casting</option>
                          <option value="MECHINE">Machine</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <HRStats timePeriod={timePeriod} selectedDepartment={selectedDepartment === "N/A" ? "N/A" : selectedDepartment} />
                      <HROverviewCharts timePeriod={timePeriod} selectedDepartment={selectedDepartment === "N/A" ? "N/A" : selectedDepartment} />
                    </div>
                  </>
                } />
                
                {/* Directory/Employees Route */}
                <Route path="/hr-management/directory" element={<HRDirectory />} />

                {/* Add Employee Route */}
                <Route path="/hr-management/directory/add" element={<HRAddEmployee />} />

                {/* Employee Details Route */}
                <Route path="/hr-management/directory/:id" element={<HREmployeeDetails />} />

                {/* Operations Log Route */}
                <Route path="/hr-management/operations-log" element={<HROperationsLog />} />

                {/* Payroll Route */}
                <Route path="/hr-management/payroll" element={<HRPayroll timePeriod={timePeriod} />} />

                {/* Attendance Tracker Route */}
                <Route path="/hr-management/attendance-tracker" element={<HRAttendanceTracker timePeriod={timePeriod} />} />

                {/* Leave Management Route */}
                <Route path="/hr-management/leave-management" element={<HRLeaveManagement />} />

                {/* Settings Route */}
                <Route path="/hr-management/settings" element={<HRSettings />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;