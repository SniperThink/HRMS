import React from 'react';
import { Search, Bell } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';

interface HRHeaderProps {
  pageName?: string;
}

const HRHeader: React.FC<HRHeaderProps> = ({ pageName }) => {
  const location = useLocation();
  
  // Function to get the greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Function to determine current page title based on route
  const getPageTitle = () => {
    const path = location.pathname;
    
    if (pageName) {
      return pageName;
    } else if (path.includes('/hr-management/directory/add')) {
      return 'Add New Employee';
    } else if (path.includes('/hr-management/directory')) {
      return 'All Employees';
    } else if (path.includes('/hr-management/data-upload')) {
      return 'Data Upload';
    } else if (path.includes('/hr-management/operations-log')) {
      return 'Operations Log';
    } else if (path.includes('/hr-management/payroll')) {
      return 'Payroll';
    } else if (path.includes('/hr-management/attendance-tracker')) {
      return 'Attendance Tracker';
    } else if (path.includes('/hr-management/leave-management')) {
      return 'Leave Management';
    } else if (path.includes('/hr-management/settings')) {
      return 'Settings';
    } else {
      return 'Overview';
    }
  };

  // Check if we're on the overview page
  const isOverviewPage = location.pathname === '/hr-management' || location.pathname === '/';

  // Render breadcrumb for add employee page
  const renderBreadcrumb = () => {
    if (location.pathname.includes('/hr-management/directory/add')) {
      return (
        <div className="flex items-center text-sm text-gray-500 space-x-2">
          {/* <Link to="/hr-management/directory" className="hover:text-blue-600">All Employees</Link>
          <span>&gt;</span>
          <span>Add New Employee</span> */}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex justify-between items-center px-6 py-4 bg-white border-b border-gray-200">
      <div className="flex flex-col">
        {isOverviewPage ? (
          <>
            <h1 className="text-xl font-semibold">Hello <span className="text-blue-600">Sniperthink</span> 👋</h1>
            <p className="text-gray-500 text-sm">{getGreeting()}</p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
            {renderBreadcrumb()}
          </>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search"
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-60"
          />
        </div>
        <div className="relative">
          <Bell className="text-gray-600 cursor-pointer hover:text-blue-600 transition-colors" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
            {/* Avatar placeholder */}
          </div>
          <span className="font-medium">Pravalika</span>
        </div>
      </div>
    </div>
  );
};

export default HRHeader;