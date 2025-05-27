import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronDown, CalendarIcon, Edit } from 'lucide-react';

interface EmployeeProfileData {
  employee_id: string;
  name: string;
  first_name: string;
  last_name: string;
  mobile_number: string;
  email: string;
  date_of_birth: string;
  marital_status: string;
  gender: string;
  nationality: string;
  address: string;
  city: string;
  state: string;
  department: string;
  designation: string;
  employment_type: string;
  date_of_joining: string;
  branch_location: string;
  shift_start_time: string;
  shift_end_time: string;
  basic_salary: string;
  tds_percentage: string;
}

interface AttendanceRecord {
  date: string;
  check_in: string;
  check_out: string;
  working_hours: number;
  status: 'Present' | 'Absent' | 'Half Day';
}

const EMPLOYMENT_TYPE_MAP: Record<string, string> = {
  'Full Time': 'FULL_TIME',
  'Part Time': 'PART_TIME',
  'Contract': 'CONTRACT',
  'Intern': 'INTERN',
  'FULL_TIME': 'FULL_TIME',
  'PART_TIME': 'PART_TIME',
  'CONTRACT': 'CONTRACT',
  'INTERN': 'INTERN',
};

function formatTimeToHHMM(time: string) {
  // Accepts '09:00', '09:00:00', '09:00 AM', '17:30', etc. Returns 'HH:mm'.
  if (!time) return '';
  if (/^\d{2}:\d{2}$/.test(time)) return time;
  if (/^\d{2}:\d{2}:\d{2}$/.test(time)) return time.slice(0, 5);
  // Handle AM/PM
  const match = time.match(/^(\d{1,2}):(\d{2}) ?([AP]M)?$/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const ampm = match[3]?.toUpperCase();
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }
  return time;
}

const HREmployeeDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('personal');
  const [employeeData, setEmployeeData] = useState<EmployeeProfileData | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<EmployeeProfileData> | null>(null);

  // Move fetchEmployeeData outside useEffect so it can be called after save
  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://127.0.0.1:8000/api/excel/employees/get_directory_data/?id=${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch employee data');
      }
      const data = await response.json();
      setEmployeeData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching employee data:', err);
      setError('Failed to load employee data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/excel/daily-attendance/?employee_id=${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch attendance data');
        }
        const data = await response.json();
        
        // Process attendance records
        const processedRecords = data.map((record: any) => {
          // Calculate working hours
          const checkIn = new Date(`2000-01-01T${record.check_in}`);
          const checkOut = new Date(`2000-01-01T${record.check_out}`);
          const diffInMinutes = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60);
          const workingHours = diffInMinutes / 60;

          return {
            date: record.date,
            check_in: record.check_in || '-',
            check_out: record.check_out || '-',
            working_hours: workingHours,
            status: record.attendance_status || 'Absent'  // Use attendance_status from backend
          };
        });

        setAttendanceRecords(processedRecords);
      } catch (err) {
        console.error('Error fetching attendance data:', err);
        setError('Failed to fetch attendance data');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEmployeeData();
      fetchAttendanceData();
    }
  }, [id]);

  if (loading) {
    return <div className="flex justify-center items-center h-full">Loading...</div>;
  }

  if (error || !employeeData) {
    return <div className="text-red-500 text-center">{error || 'Employee not found'}</div>;
  }

  // Helper function to check if a field has valid data
  const hasValidData = (value: string | undefined) => {
    return value && value !== '-' && value.trim() !== '';
  };

  const formatTime = (time: string) => {
    try {
      const [hours, minutes] = time.split(':');
      const period = Number(hours) >= 12 ? 'PM' : 'AM';
      const formattedHours = Number(hours) % 12 || 12;
      return `${formattedHours}:${minutes} ${period}`;
    } catch {
      return time;
    }
  };

  const handleSave = async () => {
    if (!editData || !employeeData) return;
    // Only include fields that have changed and are not empty/null
    const updatedFields: Partial<EmployeeProfileData> = {};
    Object.keys(editData).forEach((key) => {
      const k = key as keyof EmployeeProfileData;
      let newValue = editData[k];
      let oldValue = employeeData[k];
      // Fix employment_type
      if (k === 'employment_type') {
        newValue = EMPLOYMENT_TYPE_MAP[newValue as string] || newValue;
        oldValue = EMPLOYMENT_TYPE_MAP[oldValue as string] || oldValue;
      }
      // Fix time fields
      if (k === 'shift_start_time' || k === 'shift_end_time') {
        newValue = formatTimeToHHMM(newValue as string);
        oldValue = formatTimeToHHMM(oldValue as string);
      }
      if (newValue !== oldValue && newValue !== '' && newValue !== null && newValue !== undefined) {
        updatedFields[k] = newValue;
      }
    });
    if (Object.keys(updatedFields).length === 0) {
      setIsEditing(false);
      setEditData(null);
      return; // Nothing to update
    }
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/excel/employees/update_by_employee_id/?employee_id=${editData.employee_id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedFields),
        }
      );
      if (!response.ok) throw new Error('Failed to update employee');
      // Instead of using returned data, refresh from backend
      await fetchEmployeeData();
      setIsEditing(false);
      setEditData(null);
    } catch (err) {
      alert('Failed to save changes');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with breadcrumb and edit button */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">All Employee</span>
          <span className="text-gray-500">/</span>
          <span>{employeeData.name}</span>
        </div>
        {!isEditing ? (
          <button
            onClick={() => {
              setEditData({ ...employeeData });
              setIsEditing(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#0B5E59] text-white rounded-lg hover:bg-[#094947] transition-colors"
          >
            <Edit size={16} />
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-[#0B5E59] text-white rounded-lg hover:bg-[#094947] transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => { setIsEditing(false); setEditData(null); }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Employee Profile Card */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center text-4xl font-semibold text-gray-400">
            {employeeData.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold mb-1">
              {employeeData.name}
            </h1>
            <p className="text-gray-500">
              {hasValidData(employeeData.department) ? employeeData.department : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="flex border-b">
          <button
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium ${
              activeTab === 'personal'
                ? 'border-b-2 border-[#0B5E59] text-[#0B5E59]'
                : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('personal')}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" />
              <path d="M20.5899 22C20.5899 18.13 16.7399 15 11.9999 15C7.25991 15 3.40991 18.13 3.40991 22" />
            </svg>
            Personal Information
          </button>
          <button
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium ${
              activeTab === 'professional'
                ? 'border-b-2 border-[#0B5E59] text-[#0B5E59]'
                : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('professional')}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
            Professional Information
          </button>
          <button
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium ${
              activeTab === 'attendance'
                ? 'border-b-2 border-[#0B5E59] text-[#0B5E59]'
                : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('attendance')}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
              <path d="M16 2v4" />
              <path d="M8 2v4" />
              <path d="M3 10h18" />
            </svg>
            Attendance
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'personal' && (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <input
                  type="text"
                  value={isEditing ? editData?.first_name || '' : employeeData.first_name || ''}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white"
                  placeholder="First Name"
                  readOnly={!isEditing}
                  onChange={e => isEditing && setEditData(prev => ({ ...prev, first_name: e.target.value }))}
                />
              </div>
              <div>
                <input
                  type="text"
                  value={isEditing ? editData?.last_name || '' : employeeData.last_name || ''}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white"
                  placeholder="Last Name"
                  readOnly={!isEditing}
                  onChange={e => isEditing && setEditData(prev => ({ ...prev, last_name: e.target.value }))}
                />
              </div>
              <div>
                <input
                  type="text"
                  value={isEditing ? editData?.mobile_number || '' : employeeData.mobile_number || ''}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white"
                  placeholder="Mobile Number"
                  readOnly={!isEditing}
                  onChange={e => isEditing && setEditData(prev => ({ ...prev, mobile_number: e.target.value }))}
                />
              </div>
              <div>
                <input
                  type="email"
                  value={isEditing ? editData?.email || '' : employeeData.email || ''}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white"
                  placeholder="Email Address"
                  readOnly={!isEditing}
                  onChange={e => isEditing && setEditData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <input
                  type="date"
                  value={isEditing ? editData?.date_of_birth || '' : employeeData.date_of_birth || ''}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white"
                  placeholder="Date of Birth"
                  readOnly={!isEditing}
                  onChange={e => isEditing && setEditData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                />
              </div>
              <div>
                <select
                  value={isEditing ? editData?.marital_status || '' : employeeData.marital_status || ''}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white appearance-none"
                  disabled={!isEditing}
                  onChange={e => isEditing && setEditData(prev => ({ ...prev, marital_status: e.target.value }))}
                >
                  <option value="">Marital Status</option>
                  <option value="SINGLE">Single</option>
                  <option value="MARRIED">Married</option>
                  <option value="DIVORCED">Divorced</option>
                  <option value="WIDOWED">Widowed</option>
                </select>
              </div>
              <div>
                <select
                  value={isEditing ? editData?.gender || '' : employeeData.gender || ''}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white appearance-none"
                  disabled={!isEditing}
                  onChange={e => isEditing && setEditData(prev => ({ ...prev, gender: e.target.value }))}
                >
                  <option value="">Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <input
                  type="text"
                  value={isEditing ? editData?.nationality || '' : employeeData.nationality || ''}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white"
                  placeholder="Nationality"
                  readOnly={!isEditing}
                  onChange={e => isEditing && setEditData(prev => ({ ...prev, nationality: e.target.value }))}
                />
              </div>
              <div className="col-span-2">
                <textarea
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white"
                  placeholder="Address"
                  rows={3}
                  value={isEditing ? editData?.address || '' : employeeData.address || ''}
                  readOnly={!isEditing}
                  onChange={e => isEditing && setEditData(prev => ({ ...prev, address: e.target.value }))}
                ></textarea>
              </div>
              <div>
                <input
                  type="text"
                  value={isEditing ? editData?.city || '' : employeeData.city || ''}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white"
                  placeholder="City"
                  readOnly={!isEditing}
                  onChange={e => isEditing && setEditData(prev => ({ ...prev, city: e.target.value }))}
                />
              </div>
              <div>
                <input
                  type="text"
                  value={isEditing ? editData?.state || '' : employeeData.state || ''}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white"
                  placeholder="State"
                  readOnly={!isEditing}
                  onChange={e => isEditing && setEditData(prev => ({ ...prev, state: e.target.value }))}
                />
              </div>
            </div>
          )}

          {activeTab === 'professional' && (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <input
                  type="text"
                  value={isEditing ? editData?.employee_id || '' : employeeData.employee_id || ''}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white"
                  placeholder="Employee ID"
                  readOnly={!isEditing}
                  onChange={e => isEditing && setEditData(prev => ({ ...prev, employee_id: e.target.value }))}
                />
              </div>
              <div>
                <input
                  type="text"
                  value={isEditing ? editData?.name || '' : employeeData.name || ''}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white"
                  placeholder="User Name"
                  readOnly={!isEditing}
                  onChange={e => isEditing && setEditData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <select
                  value={isEditing ? editData?.employment_type || '' : employeeData.employment_type || ''}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white appearance-none"
                  disabled={!isEditing}
                  onChange={e => isEditing && setEditData(prev => ({ ...prev, employment_type: e.target.value }))}
                >
                  <option value="">Select Employee Type</option>
                  <option value="Full Time">Full Time</option>
                  <option value="Part Time">Part Time</option>
                  <option value="Contract">Contract</option>
                  <option value="Intern">Intern</option>
                </select>
              </div>
              <div>
                <input
                  type="email"
                  value={isEditing ? editData?.email || '' : employeeData.email || ''}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white"
                  placeholder="Email Address"
                  readOnly={!isEditing}
                  onChange={e => isEditing && setEditData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <select
                  value={isEditing ? editData?.department || '' : employeeData.department || ''}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white appearance-none"
                  disabled={!isEditing}
                  onChange={e => isEditing && setEditData(prev => ({ ...prev, department: e.target.value }))}
                >
                  <option value="">Select Department</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Sales">Sales</option>
                  <option value="HR">HR</option>
                  <option value="Finance">Finance</option>
                  <option value="Design">Design</option>
                  <option value="Marketing">Marketing</option>
                  <option value="polish">Polish</option>
                  <option value="plating">Plating</option>
                  <option value="helpers">Helpers</option>
                  <option value="packing">Packing</option>
                  <option value="casting">Casting</option>
                  <option value="machine">Machine</option>
                </select>
              </div>
              <div>
                <input
                  type="text"
                  value={isEditing ? editData?.designation || '' : employeeData.designation || ''}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white"
                  placeholder="Designation"
                  readOnly={!isEditing}
                  onChange={e => isEditing && setEditData(prev => ({ ...prev, designation: e.target.value }))}
                />
              </div>
              <div>
                <select
                  value={isEditing ? editData?.branch_location || '' : employeeData.branch_location || ''}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white appearance-none"
                  disabled={!isEditing}
                  onChange={e => isEditing && setEditData(prev => ({ ...prev, branch_location: e.target.value }))}
                >
                  <option value="">Select Office Location</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Mumbai">Mumbai</option>
                </select>
              </div>
              <div>
                <input
                  type="date"
                  value={isEditing ? editData?.date_of_joining || '' : employeeData.date_of_joining || ''}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white"
                  placeholder="Date of Joining"
                  readOnly={!isEditing}
                  onChange={e => isEditing && setEditData(prev => ({ ...prev, date_of_joining: e.target.value }))}
                />
              </div>
              <div>
                <input
                  type="text"
                  value={isEditing ? editData?.shift_start_time || '' : employeeData.shift_start_time || ''}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white"
                  placeholder="Shift Start Time"
                  readOnly={!isEditing}
                  onChange={e => isEditing && setEditData(prev => ({ ...prev, shift_start_time: e.target.value }))}
                />
              </div>
              <div>
                <input
                  type="text"
                  value={isEditing ? editData?.shift_end_time || '' : employeeData.shift_end_time || ''}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white"
                  placeholder="Shift End Time"
                  readOnly={!isEditing}
                  onChange={e => isEditing && setEditData(prev => ({ ...prev, shift_end_time: e.target.value }))}
                />
              </div>
              <div>
                <input
                  type="text"
                  value={isEditing ? editData?.basic_salary || '' : employeeData.basic_salary || ''}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white"
                  placeholder="Basic Salary"
                  readOnly={!isEditing}
                  onChange={e => isEditing && setEditData(prev => ({ ...prev, basic_salary: e.target.value }))}
                />
              </div>
              <div>
                <input
                  type="text"
                  value={isEditing ? editData?.tds_percentage || '' : employeeData.tds_percentage || ''}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white"
                  placeholder="TDS (eg: 7%)"
                  readOnly={!isEditing}
                  onChange={e => isEditing && setEditData(prev => ({ ...prev, tds_percentage: e.target.value }))}
                />
              </div>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left text-sm font-medium text-gray-600 px-4 py-3">Date</th>
                    <th className="text-left text-sm font-medium text-gray-600 px-4 py-3">Check In</th>
                    <th className="text-left text-sm font-medium text-gray-600 px-4 py-3">Check Out</th>
                    <th className="text-left text-sm font-medium text-gray-600 px-4 py-3">Working Hours</th>
                    <th className="text-left text-sm font-medium text-gray-600 px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                        Loading attendance records...
                      </td>
                    </tr>
                  ) : attendanceRecords.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                        No attendance records found.
                      </td>
                    </tr>
                  ) : (
                    attendanceRecords.map((record, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{record.date}</td>
                        <td className="px-4 py-3 text-sm">{formatTime(record.check_in)}</td>
                        <td className="px-4 py-3 text-sm">{formatTime(record.check_out)}</td>
                        <td className="px-4 py-3 text-sm">{record.working_hours.toFixed(2)} Hrs</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            record.status === 'Present' 
                              ? 'bg-green-100 text-green-600' 
                              : record.status === 'Half Day'
                                ? 'bg-yellow-100 text-yellow-600'
                                : 'bg-red-100 text-red-600'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HREmployeeDetails; 