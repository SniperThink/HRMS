// src/components/Sidebar.tsx
import React from 'react';
import { LayoutDashboard, LineChart, FileText, FileInput, Settings, UserCog, HelpCircle, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom'; // Import Link from react-router-dom
import { MenuItem } from '../types/dashboard';

const menuItems: MenuItem[] = [
  { icon: 'LayoutDashboard', label: 'Dashboard', path: '/dashboard' },
  { icon: 'LineChart', label: 'Analysis', path: '/analysis' },
  { icon: 'FileText', label: 'Reports', path: '/reports' },
  { icon: 'FileInput', label: 'Data Input', path: '/data-input' },
  { icon: 'Settings', label: 'Settings', path: '/settings' },
  { icon: 'UserCog', label: 'Profile', path: '/profile' },
  { icon: 'HelpCircle', label: 'Help', path: '/help' },
  { icon: 'Briefcase', label: 'HR Management', path: '/hr-management', target: '_blank' }
];

const iconComponents = {
  LayoutDashboard,
  LineChart,
  FileText,
  FileInput,
  Settings,
  UserCog,
  HelpCircle,
  Briefcase
};

interface SidebarProps {
  activePath: string;
  onNavigate: (path: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePath, onNavigate }) => {
  return (
    <div className="w-64 bg-white h-screen shadow-lg flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-center gap-2">
          <LayoutDashboard className="w-6 h-6 text-blue-600" />
          <h1 className="text-lg font-semibold text-blue-600">Tally Dashboard</h1>
        </div>
      </div>

      <nav className="flex-1 p-4">
        {menuItems.map((item) => {
          const Icon = iconComponents[item.icon as keyof typeof iconComponents];
          return (
            item.target === '_blank' ? (
              <a
                key={item.path}
                href={item.path}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm ${
                  activePath === item.path
                    ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </a>
            ) : (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => onNavigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm ${
                  activePath === item.path
                    ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            )
          );
        })}
      </nav>
    </div>
  );
};
