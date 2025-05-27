import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Chart } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    tooltip: {
      callbacks: {
        label: function(context: any) {
          if (context.dataset.type === 'line') {
            return context.dataset.label + ': ' + context.raw.toFixed(2);
          } else {
            return context.dataset.label + ': ₹' + context.raw.toLocaleString();
          }
        }
      }
    }
  },
  scales: {
    y: {
      type: 'linear' as const,
      display: true,
      position: 'left' as const,
      beginAtZero: true,
      ticks: {
        callback: function(value: any) {
          return '₹' + (value/1000).toFixed(0) + 'K';
        }
      }
    },
    y1: {
      type: 'linear' as const,
      display: true,
      position: 'right' as const,
      beginAtZero: true,
      grid: {
        drawOnChartArea: false,
      },
      ticks: {
        callback: function(value: any) {
          return value.toFixed(1);
        }
      }
    }
  }
};

const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const data = {
  labels,
  datasets: [
    {
      type: 'line' as const,
      label: 'Working Capital Ratio',
      data: [1.4, 1.45, 1.38, 1.52, 1.6, 1.65, 1.72, 1.78, 1.83, 1.76, 1.85, 1.9],
      borderColor: '#ffc107',
      backgroundColor: 'rgba(255, 193, 7, 0.1)',
      tension: 0.3,
      yAxisID: 'y1',
    },
    {
      type: 'bar' as const,
      label: 'Working Capital (₹)',
      data: [240000, 250000, 235000, 275000, 290000, 310000, 335000, 350000, 370000, 360000, 390000, 420000],
      backgroundColor: 'rgba(67, 97, 238, 0.7)',
      yAxisID: 'y',
    }
  ]
};

export const CapitalChart: React.FC = () => {
  return (
    <div className="h-[300px]">
      <Chart type='bar' options={options} data={data} />
    </div>
  );
};