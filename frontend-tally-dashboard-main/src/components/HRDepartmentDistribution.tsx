import React from 'react';

const departments = [
  { name: "HR", count: 120, percentage: 80, color: "bg-indigo-400" },
  { name: "Engineering", count: 190, percentage: 75, color: "bg-teal-400" },
  { name: "Designing", count: 190, percentage: 80, color: "bg-black" },
  { name: "Operation", count: 240, percentage: 90, color: "bg-blue-400" },
  { name: "Marketing", count: 190, percentage: 75, color: "bg-blue-300" }
];

const HRDepartmentDistribution: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-8">
      <h3 className="font-semibold mb-6">Department Distribution</h3>
      <div className="space-y-4">
        {departments.map((dept) => (
          <div key={dept.name} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{dept.name}</span>
              <span className="font-medium">{dept.count}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${dept.color} rounded-full transition-all duration-500`}
                style={{ width: `${dept.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HRDepartmentDistribution;