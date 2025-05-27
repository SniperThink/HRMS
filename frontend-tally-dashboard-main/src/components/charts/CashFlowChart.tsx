import React from 'react';
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
          return context.dataset.label + ': ₹' + context.raw.toLocaleString();
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: function(value: any) {
          return '₹' + (value/1000).toFixed(0) + 'K';
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
      label: 'Cash In (₹)',
      data: [280000, 320000, 260000, 340000, 300000, 360000, 380000, 410000, 430000, 400000, 450000, 500000],
      borderColor: '#198754',
      backgroundColor: 'rgba(25, 135, 84, 0.1)',
      tension: 0.3,
      fill: true
    },
    {
      label: 'Cash Out (₹)',
      data: [220000, 240000, 230000, 270000, 250000, 280000, 310000, 320000, 350000, 330000, 370000, 390000],
      borderColor: '#dc3545',
      backgroundColor: 'rgba(220, 53, 69, 0.1)',
      tension: 0.3,
      fill: true
    }
  ]
};

export const CashFlowChart: React.FC = () => {
  return (
    <div className="h-[300px]">
      <Line options={options} data={data} />
    </div>
  );
};