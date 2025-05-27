import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { TimePeriod, getTimePeriodLabel } from '../../services/revenueService';
import { ChevronDown } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ProductData {
  stock_item: string;
  total_revenue: number;
  total_quantity: number;
}

const options = {
  indexAxis: 'y' as const,
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: function(context: any) {
          const product = context.chart.data.rawData[context.dataIndex];
          return [
            `Revenue: ${new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: 'INR',
              maximumFractionDigits: 0
            }).format(product.total_revenue)}`,
            `Quantity Sold: ${product.total_quantity.toLocaleString()} units`
          ];
        }
      }
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        callback: function(value: any) {
          return '₹' + (value/1000).toFixed(0) + 'K';
        }
      }
    },
    y: {
      grid: {
        display: false
      }
    }
  }
};

const chartColors = {
  bar: '#4361ee',
  barHover: '#3730a3'
};

const timePeriods: TimePeriod[] = [
  'last_7_days',
  'last_30_days',
  'last_6_months',
  'last_year',
  'last_5_years'
];

interface ProductsContextType {
  selectedPeriod: TimePeriod;
  setSelectedPeriod: (period: TimePeriod) => void;
}

const ProductsContext = createContext<ProductsContextType | null>(null);

const useProducts = () => {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
};

const ProductsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('last_30_days');

  return (
    <ProductsContext.Provider value={{ selectedPeriod, setSelectedPeriod }}>
      {children}
    </ProductsContext.Provider>
  );
};

const BaseChart: React.FC = () => {
  const { selectedPeriod } = useProducts();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productData, setProductData] = useState<ProductData[]>([]);

  useEffect(() => {
    const fetchTopProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`http://localhost:8000/data/top-products/?time_period=${selectedPeriod}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch top products data');
        }

        const data = await response.json();
        setProductData(data);
      } catch (err) {
        console.error('Error fetching top products:', err);
        setError('Failed to load top products data');
      } finally {
        setLoading(false);
      }
    };

    fetchTopProducts();
  }, [selectedPeriod]);

  if (loading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <div className="text-gray-500">Loading product data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!productData.length) {
    return (
      <div className="h-[300px] flex flex-col items-center justify-center text-gray-500">
        <div className="text-4xl mb-2">📊</div>
        <div className="text-lg">No products found for this time period</div>
        <div className="text-sm">Try selecting a different time range</div>
      </div>
    );
  }

  // Sort products by revenue in descending order
  const sortedProducts = [...productData].sort((a, b) => b.total_revenue - a.total_revenue);

  const chartData = {
    labels: sortedProducts.map(product => product.stock_item),
    rawData: sortedProducts, // Store raw data for tooltip
    datasets: [
      {
        data: sortedProducts.map(product => product.total_revenue),
        backgroundColor: chartColors.bar,
        hoverBackgroundColor: chartColors.barHover,
        borderRadius: 4,
        maxBarThickness: 20
      }
    ]
  };

  return (
    <div className="h-[300px]">
      <Bar options={options} data={chartData} />
    </div>
  );
};

const BaseTimePeriodSelect: React.FC = () => {
  const { selectedPeriod, setSelectedPeriod } = useProducts();
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

export const ProductsChart = Object.assign(
  () => {
    return <BaseChart />;
  },
  {
    Provider: ProductsProvider,
    TimePeriodSelect: () => {
      return <BaseTimePeriodSelect />;
    }
  }
);