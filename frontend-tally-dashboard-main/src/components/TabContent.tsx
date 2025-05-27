import React, { useEffect, useState } from 'react';
import { RevenueChart } from './charts/RevenueChart';
import { ProductsChart } from './charts/ProductsChart';
import { CashFlowChart } from './charts/CashFlowChart';
import { CapitalChart } from './charts/CapitalChart';
import { StatCard } from './StatCard';
import { MetricCard, FilterState } from '../types/dashboard';
import { fetchRevenueData } from '../services/revenueService';

interface TabContentProps {
  activeTab: string;
  filters: FilterState;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
};

const getPeriodLabel = (periodType: string = 'daily'): string => {
  switch (periodType) {
    case 'daily':
      return 'Last Day';
    case 'weekly':
      return 'Last Week';
    case 'monthly':
      return 'Last Month';
    default:
      return 'Current Period';
  }
};

const getComparisonLabel = (periodType: string = 'daily'): string => {
  switch (periodType) {
    case 'daily':
      return 'vs Last Day';
    case 'weekly':
      return 'vs Last Week';
    case 'monthly':
      return 'vs Last Month';
    default:
      return 'vs Last Period';
  }
};

const getInitialMetrics = (): Record<string, MetricCard[]> => ({
  revenue: [
    {
      title: '💎 Total Business Revenue',
      value: formatCurrency(0),
      trend: 0,
      icon: 'trending-up'
    },
    {
      title: '📈 Sales Growth Rate',
      value: '0%',
      trend: 0,
      icon: 'trending-up'
    },
    {
      title: '💵 Profit After All Expenses',
      value: '0%',
      trend: 0,
      icon: 'trending-down'
    },
    {
      title: '🌍 Sales Performance by Location',
      value: '0 Regions',
      trend: 0,
      icon: 'map'
    }
  ],
  cashflow: [
    {
      title: '💰 Available Cash',
      value: '₹285,640',
      trend: 5.2,
      icon: 'trending-up'
    },
    {
      title: '🔄 Cash Flow Ratio',
      value: '1.45',
      trend: 8.7,
      icon: 'trending-up'
    },
    {
      title: '📊 Working Capital',
      value: '₹356,780',
      trend: 3.5,
      icon: 'trending-up'
    },
    {
      title: '⚖️ Current Ratio',
      value: '1.8',
      trend: 0.2,
      icon: 'trending-up'
    }
  ],
  sales: [
    {
      title: '🎯 Total Sales',
      value: '₹892,450',
      trend: 15.8,
      icon: 'trending-up'
    },
    {
      title: '👥 Active Customers',
      value: '1,245',
      trend: 4.3,
      icon: 'trending-up'
    },
    {
      title: '🛒 Average Order Value',
      value: '₹7,169',
      trend: 2.8,
      icon: 'trending-up'
    },
    {
      title: '🔁 Repeat Purchase Rate',
      value: '42%',
      trend: 5.1,
      icon: 'trending-up'
    }
  ],
  receivables: [
    {
      title: '📥 Total Receivables',
      value: '₹245,780',
      trend: -2.5,
      icon: 'trending-down'
    },
    {
      title: '📤 Total Payables',
      value: '₹178,920',
      trend: 1.8,
      icon: 'trending-up'
    },
    {
      title: '⏳ Average Collection Period',
      value: '32 days',
      trend: -3.5,
      icon: 'trending-down'
    },
    {
      title: '💳 Payment Success Rate',
      value: '94.5%',
      trend: 1.2,
      icon: 'trending-up'
    }
  ],
  inventory: [
    {
      title: '📦 Total Inventory Value',
      value: '₹567,890',
      trend: 4.2,
      icon: 'trending-up'
    },
    {
      title: '🔄 Inventory Turnover',
      value: '5.8x',
      trend: 0.5,
      icon: 'trending-up'
    },
    {
      title: '⚡ Stock Velocity',
      value: '63 days',
      trend: -2.1,
      icon: 'trending-down'
    },
    {
      title: '📊 Stock Accuracy',
      value: '98.7%',
      trend: 0.8,
      icon: 'trending-up'
    }
  ],
  expense: [
    {
      title: '💸 Total Expenses',
      value: '₹678,450',
      trend: 3.2,
      icon: 'trending-up'
    },
    {
      title: '📉 Expense Ratio',
      value: '46.5%',
      trend: -1.8,
      icon: 'trending-down'
    },
    {
      title: '🎯 Budget Variance',
      value: '-2.3%',
      trend: 4.5,
      icon: 'trending-up'
    },
    {
      title: '📊 Cost per Revenue',
      value: '₹0.47',
      trend: -0.9,
      icon: 'trending-down'
    }
  ]
});

export const TabContent: React.FC<TabContentProps> = ({ activeTab, filters }) => {
  const [metrics, setMetrics] = useState<Record<string, MetricCard[]>>(getInitialMetrics());
  const periodType = filters.dateRange.type || 'daily';

  useEffect(() => {
    const updateRevenueMetrics = async () => {
      if (activeTab === 'revenue') {
        try {
          const revenueData = await fetchRevenueData(filters.dateRange);
          const comparisonLabel = getComparisonLabel(periodType);
          
          setMetrics(prev => ({
            ...prev,
            revenue: [
              {
                title: '💎 Total Business Revenue',
                value: formatCurrency(revenueData.total),
                trend: revenueData.trend,
                icon: revenueData.trend >= 0 ? 'trending-up' : 'trending-down',
                trendLabel: comparisonLabel
              },
              {
                title: '📈 Sales Growth Rate',
                value: '0%',
                trend: 0,
                icon: 'trending-up'
              },
              ...prev.revenue.slice(2)
            ]
          }));
        } catch (error) {
          console.error('Error updating revenue metrics:', error);
        }
      }
    };

    updateRevenueMetrics();
  }, [activeTab, filters.dateRange, periodType]);

  const currentMetrics = metrics[activeTab] || metrics.revenue;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {currentMetrics.map((metric, index) => (
          <StatCard key={index} metric={metric} />
        ))}
      </div>
      
      {activeTab === 'revenue' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <RevenueChart.Provider>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Revenue Trend</h3>
                <RevenueChart.TimePeriodSelect />
              </div>
              <RevenueChart />
            </RevenueChart.Provider>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <ProductsChart.Provider>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">💰 Top Products by Revenue</h3>
                <ProductsChart.TimePeriodSelect />
              </div>
              <ProductsChart />
            </ProductsChart.Provider>
          </div>
        </div>
      )}
      
      {activeTab === 'cashflow' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Cash Flow Analysis</h3>
            <CashFlowChart />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Working Capital Trend</h3>
            <CapitalChart />
          </div>
        </div>
      )}
    </div>
  );
};