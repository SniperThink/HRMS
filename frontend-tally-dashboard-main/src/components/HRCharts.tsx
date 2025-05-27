import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area } from 'recharts';

const otHoursData = [
  { name: 'HR', hours: 45 },
  { name: 'Tech', hours: 75 },
  { name: 'Design', hours: 60 },
  { name: 'Operations', hours: 85 },
  { name: 'Marketing', hours: 40 },
  { name: 'Finance', hours: 65 }
];

const attendanceData = [
  { name: 'HR', value: 52.1, color: '#333333' },
  { name: 'Engineering', value: 22.8, color: '#4A90E2' },
  { name: 'Designing', value: 13.9, color: '#50E3C2' },
  { name: 'Other', value: 11.2, color: '#F5A623' }
];

const monthlyAttendanceData = [
  { name: 'Jan', value: 5000 },
  { name: 'Feb', value: 8000 },
  { name: 'Mar', value: 12000 },
  { name: 'Apr', value: 18000 },
  { name: 'May', value: 22000 },
  { name: 'Jun', value: 20000 },
  { name: 'Jul', value: 23000 }
];

const leaveTypeData = [
  { name: 'CL', value: 20 },
  { name: 'EL/PL', value: 40 },
  { name: 'LWP', value: 15 },
  { name: 'Comp Off', value: 30 },
  { name: 'Sick Leave', value: 12 },
  { name: 'ML', value: 10 }
];

const COLORS = ['#333333', '#4A90E2', '#50E3C2', '#F5A623'];

const HRCharts: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="font-semibold mb-6">OT Hours by Department</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={otHoursData} barSize={30}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#666666' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#666666' }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                  contentStyle={{ border: '1px solid #e0e0e0', borderRadius: '4px', background: 'white' }}
                />
                <Bar dataKey="hours" fill="#4A90E2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="font-semibold mb-6">Department-wise Attendance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attendanceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  fill="#8884d8"
                  paddingAngle={2}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {attendanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => `${value}%`}
                  contentStyle={{ border: '1px solid #e0e0e0', borderRadius: '4px', background: 'white' }}
                />
                <Legend 
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  align="center"
                  formatter={(value, entry, index) => {
                    return <span style={{ color: '#666666' }}>{value}</span>;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Second row of charts */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold">Monthly Attendance Trend</h3>
            <div className="flex items-center text-xs text-gray-500">
              <span>This year</span>
              <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyAttendanceData}>
                <defs>
                  <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4A90E2" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4A90E2" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#666666' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#666666' }} />
                <Tooltip
                  contentStyle={{ border: '1px solid #e0e0e0', borderRadius: '4px', background: 'white' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#4A90E2" 
                  fillOpacity={1} 
                  fill="url(#colorAttendance)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="font-semibold mb-6">Leave Type Usage</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={leaveTypeData} 
                layout="vertical"
                barSize={12}
                margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#666666' }} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#666666' }}
                  width={80}
                />
                <Tooltip
                  contentStyle={{ border: '1px solid #e0e0e0', borderRadius: '4px', background: 'white' }}
                />
                <Bar dataKey="value" fill="#333333" radius={[0, 4, 4, 0]}>
                  {leaveTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#333333" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRCharts;