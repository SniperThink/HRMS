import React from 'react';
import { MetricCard } from '../types/dashboard';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  metric: MetricCard;
}

export const StatCard: React.FC<StatCardProps> = ({ metric }) => {
  const isPositive = metric.trend >= 0;

  return (
    <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <h3 className="text-gray-600 text-sm">{metric.title}</h3>
      </div>
      <div className="mt-2">
        <div className="text-2xl font-semibold">{metric.value}</div>
        <div className={`flex items-center mt-2 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? (
            <TrendingUp className="w-4 h-4 mr-1" />
          ) : (
            <TrendingDown className="w-4 h-4 mr-1" />
          )}
          <span>{`${isPositive ? '+' : ''}${metric.trend}% ${metric.trendLabel || ''}`}</span>
        </div>
        {metric.subtitle && metric.subtitle !== metric.trendLabel && (
          <div className="mt-1 text-sm text-gray-500">{metric.subtitle}</div>
        )}
      </div>
    </div>
  );
};