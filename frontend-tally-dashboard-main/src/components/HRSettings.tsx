import React from 'react';
import { ChevronDown } from 'lucide-react';

const HRSettings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Settings</h1>
          <p className="text-gray-500">Admin Details</p>
        </div>
      </div>

      {/* Form container */}
      <div className="bg-white rounded-lg p-8 shadow-sm">
        <div className="max-w-3xl mx-auto">
          <form className="space-y-6">
            {/* Company Name */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="sr-only">Company Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg"
                  placeholder="Sniperthink"
                  defaultValue="Sniperthink"
                />
              </div>
              <div>
                <label className="sr-only">Website</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg"
                  placeholder="Sniperthink.com"
                  defaultValue="Sniperthink.com"
                />
              </div>
            </div>

            {/* Employee Count */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="sr-only">Employee Count</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg"
                  placeholder="10-15 Employees"
                  defaultValue="10-15 Employees"
                />
              </div>
              <div>
                <label className="sr-only">Email</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg"
                  placeholder="Sniperthink@gmail.com"
                  defaultValue="Sniperthink@gmail.com"
                />
              </div>
            </div>

            {/* Clock In Time */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="sr-only">Clock-in Time</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg"
                  placeholder="Enter Clock-in Time"
                  defaultValue="Enter Clock-in Time"
                />
              </div>
              <div className="relative">
                <div className="flex justify-between items-center w-full px-4 py-3 border border-gray-200 rounded-lg">
                  <span>09:00</span>
                  <ChevronDown size={20} className="text-gray-400" />
                </div>
              </div>
            </div>

            {/* Clock Out Time */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="sr-only">Clock-out Time</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg"
                  placeholder="Enter Clock-out Time"
                  defaultValue="Enter Clock-out Time"
                />
              </div>
              <div className="relative">
                <div className="flex justify-between items-center w-full px-4 py-3 border border-gray-200 rounded-lg">
                  <span>07:00</span>
                  <ChevronDown size={20} className="text-gray-400" />
                </div>
              </div>
            </div>

            {/* Working Week Starts */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="sr-only">Working week Starts on</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg"
                  placeholder="Working week Starts on"
                  defaultValue="Working week Starts on"
                />
              </div>
              <div className="relative">
                <div className="flex justify-between items-center w-full px-4 py-3 border border-gray-200 rounded-lg">
                  <span>Monday</span>
                  <ChevronDown size={20} className="text-gray-400" />
                </div>
              </div>
            </div>

            {/* Working Week Ends */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="sr-only">Working Week Ends on</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg"
                  placeholder="Working Week Ends on"
                  defaultValue="Working Week Ends on"
                />
              </div>
              <div className="relative">
                <div className="flex justify-between items-center w-full px-4 py-3 border border-gray-200 rounded-lg">
                  <span>Friday</span>
                  <ChevronDown size={20} className="text-gray-400" />
                </div>
              </div>
            </div>

            {/* Form actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button 
                type="button"
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                type="button"
                className="px-6 py-2 bg-[#0B5E59] text-white rounded-md hover:bg-[#0a5350]"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HRSettings; 