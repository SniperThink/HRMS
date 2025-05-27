import React from 'react';

const recentActivities = [
  { id: 1, user: "Sarah Chen", action: "Changed the style.", time: "Just now" },
  { id: 2, user: "User", action: "Edited profile", time: "39 minutes ago" },
  { id: 3, user: "User", action: "Edited Profile", time: "12 hours ago" },
  { id: 4, user: "User", action: "Modified Phone number", time: "Today, 11:59 AM" },
  { id: 5, user: "User", action: "Deleted Last Name in Profile", time: "Feb 2, 2025" }
];

const HRRecentActivities: React.FC = () => {
  return (
    <div className="p-4">
      <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-4">
        <h3 className="font-semibold">Recent Activities</h3>
      </div>
      <div className="space-y-4">
        {recentActivities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0"></div>
            <div>
              <p className="text-sm">
                <span className="font-medium">{activity.user}</span> {activity.action}
              </p>
              <p className="text-xs text-gray-500">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
      <button className="text-blue-600 mt-4 text-sm font-medium">View All Activities</button>
    </div>
  );
};

export default HRRecentActivities;