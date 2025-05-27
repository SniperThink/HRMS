import React, { useState } from 'react';
import { Calendar, Tag, Bell, ChevronDown } from 'lucide-react';
import { FilterState } from '../types/dashboard';

interface HeaderProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

const dateRanges = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' }
];

const categories = [
  { label: 'Category 1', value: 'cat1' },
  { label: 'Category 2', value: 'cat2' },
  { label: 'Category 3', value: 'cat3' }
];

const alerts = [
  {
    title: 'Low cash balance alert',
    description: 'Your cash balance is below the threshold of ₹50,000',
    type: 'warning'
  },
  {
    title: 'Inventory threshold reached',
    description: 'Product X inventory is low - reorder required',
    type: 'warning'
  }
];

export const Header: React.FC<HeaderProps> = ({ filters, onFilterChange }) => {
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);

  const getCurrentDateRangeLabel = () => {
    const range = dateRanges.find(r => r.value === filters.dateRange.type);
    return range ? range.label : 'Daily';
  };

  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setShowDateDropdown(!showDateDropdown)}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-sm">{getCurrentDateRangeLabel()}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {showDateDropdown && (
              <div className="absolute z-10 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200">
                {dateRanges.map((range) => (
                  <button
                    key={range.value}
                    onClick={() => {
                      onFilterChange({ 
                        ...filters, 
                        dateRange: { 
                          ...filters.dateRange, 
                          type: range.value 
                        } 
                      });
                      setShowDateDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              <Tag className="w-4 h-4 text-blue-600" />
              <span className="text-sm">Product Category</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {showCategoryDropdown && (
              <div className="absolute z-10 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200">
                {categories.map((category) => (
                  <button
                    key={category.value}
                    onClick={() => {
                      onFilterChange({ ...filters, category: category.value });
                      setShowCategoryDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowAlerts(!showAlerts)}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-amber-50 hover:bg-amber-100"
            >
              <Bell className="w-4 h-4 text-amber-500" />
              <span className="text-sm">Alerts</span>
              <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
                {alerts.length}
              </span>
            </button>
            
            {showAlerts && (
              <div className="absolute z-10 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200">
                {alerts.map((alert, index) => (
                  <div
                    key={index}
                    className="p-4 border-b last:border-b-0 hover:bg-gray-50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <Bell className="w-4 h-4 text-amber-500" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">{alert.title}</h4>
                        <p className="text-sm text-gray-600">{alert.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
            JS
          </div>
          <span className="text-sm font-medium">John Smith</span>
        </div>
      </div>
    </div>
  );
};