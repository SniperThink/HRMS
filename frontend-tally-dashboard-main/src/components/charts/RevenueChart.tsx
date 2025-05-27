import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { fetchRevenueData, RevenueData, TimePeriod, getTimePeriodLabel } from '../../services/revenueService';
import { ChevronDown } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    tooltip: {
      callbacks: {
        label: function(context: any) {
          return '₹' + context.raw.toLocaleString();
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        display: false
      },
      ticks: {
        callback: function(value: any) {
          return '₹' + (value/1000).toFixed(0) + 'K';
        }
      }
    },
    x: {
      grid: {
        display: false
      }
    }
  }
};

const timePeriods: TimePeriod[] = [
  'last_7_days',
  'last_30_days',
  'last_6_months',
  'last_year',
  'last_5_years'
];

const defaultChartData = {
  labels: ['No Data'],
  datasets: [
    {
      label: 'Revenue (₹)',
      data: [0],
      borderColor: '#4361ee',
      backgroundColor: 'rgba(67, 97, 238, 0.1)',
      tension: 0.3,
      fill: true
    }
  ]
};

interface RevenueContextType {
  selectedPeriod: TimePeriod;
  setSelectedPeriod: (period: TimePeriod) => void;
}

const RevenueContext = createContext<RevenueContextType | null>(null);

const RevenueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('last_30_days');

  return (
    <RevenueContext.Provider value={{ selectedPeriod, setSelectedPeriod }}>
      {children}
    </RevenueContext.Provider>
  );
};

const useRevenue = () => {
  const context = useContext(RevenueContext);
  if (!context) {
    throw new Error('useRevenue must be used within a RevenueProvider');
  }
  return context;
};

const BaseChart: React.FC = () => {
  const { selectedPeriod } = useRevenue();
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const revenueData = await fetchRevenueData(selectedPeriod);
        
        if (!isMounted) return;

        if (!revenueData || !revenueData.chartData) {
          setError('Invalid data received from server');
          return;
        }

        setData(revenueData);
      } catch (err) {
        console.error('Error loading revenue data:', err);
        if (isMounted) {
          setError('Failed to load revenue data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [selectedPeriod]);

  if (loading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <div className="text-gray-500">Loading revenue data...</div>
      </div>
    );
  }

  const chartData = data?.chartData ? {
    labels: data.chartData.labels,
    datasets: [
      {
        label: 'Revenue (₹)',
        data: data.chartData.data,
        borderColor: '#4361ee',
        backgroundColor: 'rgba(67, 97, 238, 0.1)',
        tension: 0.3,
        fill: true
      }
    ]
  } : defaultChartData;

  return (
    <div className="h-[300px]">
      {error ? (
        <div className="h-full flex items-center justify-center">
          <div className="text-red-500">{error}</div>
        </div>
      ) : (
        <Line options={options} data={chartData} />
      )}
    </div>
  );
};

const BaseTimePeriodSelect: React.FC = () => {
  const { selectedPeriod, setSelectedPeriod } = useRevenue();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg bg-white hover:bg-gray-50"
      >
        {getTimePeriodLabel(selectedPeriod)}
        <ChevronDown className="w-4 h-4" />
      </button>
      
      {showDropdown && (
        <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
          {timePeriods.map((period) => (
            <button
              key={period}
              onClick={() => {
                setSelectedPeriod(period);
                setShowDropdown(false);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
            >
              {getTimePeriodLabel(period)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const RevenueChart = Object.assign(
  () => {
    const { selectedPeriod } = useRevenue();
    return <BaseChart />;
  },
  {
    Provider: RevenueProvider,
    TimePeriodSelect: () => {
      return <BaseTimePeriodSelect />;
    }
  }
);