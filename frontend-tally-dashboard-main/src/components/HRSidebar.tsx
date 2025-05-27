import React from 'react';
import { 
  LayoutDashboard,
  Users, 
  UserPlus, 
  ClipboardList, 
  DollarSign, 
  CalendarCheck, 
  UserCheck, 
  Settings 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HRSidebarProps {
  activePage: string;
  onPageChange: (page: string) => void;
}

const HRSidebar: React.FC<HRSidebarProps> = ({ activePage, onPageChange }) => {
  const navigate = useNavigate();
  
  const navItems = [
    { name: "Overview", icon: LayoutDashboard, id: "overview", path: "/hr-management" },
    { name: "All Employees", icon: Users, id: "directory", path: "/hr-management/directory" },
    { name: "Add Employee", icon: UserPlus, id: "add-employee", path: "/hr-management/directory/add" },
    { name: "Attendance Log", icon: ClipboardList, id: "operations-log", path: "/hr-management/operations-log" },
    { name: "Payroll", icon: DollarSign, id: "payroll", path: "/hr-management/payroll" },
    { name: "Attendance Tracker", icon: CalendarCheck, id: "attendance-tracker", path: "/hr-management/attendance-tracker" },
    { name: "Leave Management", icon: UserCheck, id: "leave-management", path: "/hr-management/leave-management" },
    { name: "Settings", icon: Settings, id: "settings", path: "/hr-management/settings" }
  ];

  const handleNavigation = (id: string, path: string) => {
    onPageChange(id);
    navigate(path);
  };

  return (
    <div className="w-64 h-full bg-[#0B5E59] flex-shrink-0 overflow-y-auto">
      <div className="flex items-center gap-2 p-4 border-b border-[#0a5350]">
        <div className="w-6 h-6 rounded-full bg-[#4CDD83] flex-shrink-0"></div>
        <span className="font-semibold text-xl text-white">Sniperthink</span>
      </div>

      <nav className="p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <div 
              key={item.name} 
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer my-1 ${
                activePage === item.id 
                  ? 'bg-[#0a5350] font-medium text-white' 
                  : 'text-white hover:bg-[#0a5350] hover:bg-opacity-70'
              }`}
              onClick={() => handleNavigation(item.id, item.path)}
            >
              <Icon size={20} className="text-white" />
              <span>{item.name}</span>
            </div>
          );
        })}
      </nav>
    </div>
  );
};

export default HRSidebar;