import React from 'react';
import { TabItem } from '../types/dashboard';

interface TabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const tabs: TabItem[] = [
  { icon: '💰', label: 'Revenue & Profitability', id: 'revenue' },
  { icon: '🏦', label: 'Cash Flow & Liquidity', id: 'cashflow' },
  { icon: '📊', label: 'Sales & Customer Insights', id: 'sales' },
  { icon: '💳', label: 'Receivables & Payables', id: 'receivables' },
  { icon: '📦', label: 'Inventory Management', id: 'inventory' },
  { icon: '📉', label: 'Expense Control', id: 'expense' }
];

export const Tabs: React.FC<TabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="border-b border-gray-200">
      <div className="flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              px-6 py-3 text-sm font-medium border-b-2 transition-colors
              ${activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};