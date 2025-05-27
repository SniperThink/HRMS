import { DateRange } from '../types/dashboard';

interface APIResponse {
  current_period: {
    revenue: number;
    start_date?: string;
  };
  previous_period: {
    revenue: number;
    start_date?: string;
  };
  growth_rate: number;
  period_type: string;
  metadata: {
    currency: string;
    formatted_current?: string;
  };
}

export type TimePeriod = 'last_7_days' | 'last_30_days' | 'last_6_months' | 'last_year' | 'last_5_years';

export interface RevenueData {
  total: number;
  trend: number;
  chartData: {
    labels: string[];
    data: number[];
  };
}

const getPeriodLabels = (periodType: string): [string, string] => {
  switch (periodType) {
    case 'daily':
      return ['Yesterday', 'Today'];
    case 'weekly':
      return ['Previous Week', 'This Week'];
    case 'monthly':
      return ['Last Month', 'This Month'];
    default:
      return ['Previous Period', 'Current Period'];
  }
};

const mockData: RevenueData = {
  total: 0,
  trend: 0,
  chartData: {
    labels: ['Previous', 'Current'],
    data: [0, 0]
  }
};

export const fetchRevenueData = async (timePeriod: TimePeriod | DateRange): Promise<RevenueData> => {
  try {
    let url;
    if (typeof timePeriod === 'string') {
      // Use the revenue-trend endpoint for time period filters
      url = `http://127.0.0.1:8000/data/revenue-trend/?time_period=${timePeriod}`;
    } else {
      // Handle DateRange case with the original revenue endpoint
      url = `http://127.0.0.1:8000/api/revenue/?period_type=${timePeriod.type || 'daily'}&category=all`;
    }

    console.log('Fetching from URL:', url);
    const response = await fetch(url);
    const responseText = await response.text();
    console.log('Raw API Response:', responseText);

    if (!response.ok) {
      console.error('API Error Response:', response.status);
      console.error('Error details:', responseText);
      throw new Error('Failed to fetch revenue data');
    }

    let apiData;
    try {
      apiData = JSON.parse(responseText);
      console.log('Parsed API data:', apiData);
    } catch (e) {
      console.error('Failed to parse JSON:', e);
      throw new Error('Invalid JSON response from server');
    }

    // Handle different response formats based on the endpoint
    if (typeof timePeriod === 'string') {
      // New revenue-trend endpoint format
      return {
        total: Array.isArray(apiData.data) ? apiData.data[apiData.data.length - 1] : 0,
        trend: apiData.trend || 0,
        chartData: {
          labels: apiData.labels || [],
          data: apiData.data || []
        }
      };
    } else {
      // Original revenue endpoint format
      if (!apiData || !apiData.current_period || !apiData.previous_period) {
        throw new Error('Invalid data structure received');
      }

      const [previousLabel, currentLabel] = getPeriodLabels(timePeriod.type || 'daily');
      
      return {
        total: apiData.current_period.revenue,
        trend: apiData.growth_rate,
        chartData: {
          labels: [previousLabel, currentLabel],
          data: [apiData.previous_period.revenue, apiData.current_period.revenue]
        }
      };
    }
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    return mockData;
  }
};

export const getTimePeriodLabel = (period: TimePeriod): string => {
  const labels: Record<TimePeriod, string> = {
    'last_7_days': 'Last 7 Days',
    'last_30_days': 'Last 30 Days',
    'last_6_months': 'Last 6 Months',
    'last_year': 'Last Year',
    'last_5_years': 'Last 5 Years'
  };
  return labels[period];
}; 