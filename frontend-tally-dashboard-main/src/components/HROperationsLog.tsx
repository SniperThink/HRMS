import React, { useEffect, useState } from 'react';
import { Search, Filter, Calendar } from 'lucide-react';

interface EmployeeProfile {
  employee_id: string;
  name: string;
  department: string;
  shift_start_time?: string;
  shift_end_time?: string;
}

interface AttendanceRow {
  employee_id: string;
  name: string;
  department: string;
  clock_in: string;
  clock_out: string;
  status: string;
  late_minutes: number;
  ot_minutes: number;
}

const STATUS_OPTIONS = [
  { value: 'Present', label: 'Present', icon: <span className="text-green-600">✔️</span> },
  { value: 'Absent', label: 'Absent', icon: <span className="text-red-500">✖️</span> },
  { value: 'Half Day', label: 'Half Day', icon: <span className="text-yellow-500">●</span> },
  { value: 'Paid Leave', label: 'Paid Leave', icon: <span className="text-blue-500">●</span> },
];

const DEFAULT_SHIFT_START = '09:00';
const DEFAULT_SHIFT_END = '17:00';

function isValidTime(time: string) {
  return /^\d{2}:\d{2}$/.test(time);
}

function getMinutesDiff(start: string, end: string) {
  if (!isValidTime(start) || !isValidTime(end)) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

const STATUS_API_MAP: Record<string, string> = {
  'Present': 'PRESENT',
  'Absent': 'ABSENT',
  'Half Day': 'HALF DAY',
  'Paid Leave': 'PAID LEAVE',
};

const normalizeDepartment = (dept: string | undefined) => (dept && dept.trim() !== '' && dept !== '0') ? dept : 'N/A';

const AttendanceLog: React.FC = () => {
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [attendanceRows, setAttendanceRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const res = await fetch('http://127.0.0.1:8000/api/excel/employees/get_directory_data/');
        if (!res.ok) throw new Error('Failed to fetch employees');
        const data: EmployeeProfile[] = await res.json();
        setEmployees(data);
        // Build attendance rows for the selected date
        setAttendanceRows(
          data.map(emp => {
            const shiftStart = isValidTime(emp.shift_start_time || '') ? emp.shift_start_time! : DEFAULT_SHIFT_START;
            const shiftEnd = isValidTime(emp.shift_end_time || '') ? emp.shift_end_time! : DEFAULT_SHIFT_END;
            return {
              employee_id: emp.employee_id,
              name: emp.name,
              department: emp.department,
              clock_in: shiftStart,
              clock_out: shiftEnd,
              status: 'Present',
              late_minutes: 0,
              ot_minutes: 0,
            };
          })
        );
        setError(null);
      } catch (err) {
        setError('Failed to load employees');
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, [date]);

  // Calculate late and OT whenever clock_in/out or status changes
  useEffect(() => {
    setAttendanceRows(rows =>
      rows.map(row => {
        const emp = employees.find(e => e.employee_id === row.employee_id);
        const shiftStart = isValidTime(emp?.shift_start_time || '') ? emp?.shift_start_time : DEFAULT_SHIFT_START;
        const shiftEnd = isValidTime(emp?.shift_end_time || '') ? emp?.shift_end_time : DEFAULT_SHIFT_END;
        let late = 0;
        let ot = 0;
        if ((row.status === 'Present' || row.status === 'Half Day') && isValidTime(row.clock_in) && isValidTime(row.clock_out)) {
          late = Math.max(0, getMinutesDiff(shiftStart!, row.clock_in));
          ot = Math.max(0, getMinutesDiff(shiftEnd!, row.clock_out));
        }
        return { ...row, late_minutes: late, ot_minutes: ot };
      })
    );
    // eslint-disable-next-line
  }, [employees]);

  const handleRowChange = (index: number, field: keyof AttendanceRow, value: string) => {
    setAttendanceRows(rows =>
      rows.map((row, i) =>
        i === index
          ? {
              ...row,
              [field]: value,
              ...(field === 'clock_in' || field === 'clock_out' || field === 'status'
                ? (() => {
                    const emp = employees.find(e => e.employee_id === row.employee_id);
                    const shiftStart = isValidTime(emp?.shift_start_time || '') ? emp?.shift_start_time : DEFAULT_SHIFT_START;
                    const shiftEnd = isValidTime(emp?.shift_end_time || '') ? emp?.shift_end_time : DEFAULT_SHIFT_END;
                    let late = 0;
                    let ot = 0;
                    if ((field === 'status' && (value === 'Present' || value === 'Half Day')) || (row.status === 'Present' || row.status === 'Half Day')) {
                      const clockIn = field === 'clock_in' ? value : row.clock_in;
                      const clockOut = field === 'clock_out' ? value : row.clock_out;
                      if (isValidTime(clockIn) && isValidTime(clockOut)) {
                        late = Math.max(0, getMinutesDiff(shiftStart!, clockIn));
                        ot = Math.max(0, getMinutesDiff(shiftEnd!, clockOut));
                      }
                    }
                    return { late_minutes: late, ot_minutes: ot };
                  })()
                : {}),
            }
          : row
      )
    );
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const payload = attendanceRows.map(row => ({
        employee_id: row.employee_id,
        date,
        attendance_status: STATUS_API_MAP[row.status] || row.status,
        check_in: row.clock_in,
        check_out: row.clock_out,
        late_minutes: row.late_minutes,
        ot_minutes: row.ot_minutes,
      }));
      // Send POST for each row (or batch if backend supports)
      await Promise.all(
        payload.map(row =>
          fetch('http://127.0.0.1:8000/api/excel/daily-attendance/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(row),
          })
        )
      );
      setError(null);
      alert('Attendance saved!');
    } catch (err) {
      setError('Failed to save attendance');
    } finally {
      setLoading(false);
    }
  };

  const filteredRows = attendanceRows.filter(row => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      row.name.toLowerCase().includes(query) ||
      row.employee_id.toLowerCase().includes(query) ||
      row.department.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Attendance Log</h1>
        <p className="text-gray-500">Daily Attendance</p>
      </div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="text-gray-400" size={20} />
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0B5E59]"
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm">
            <Filter size={16} />
            Filter
          </button>
        </div>
      </div>
      <div className="bg-white rounded-lg border border-gray-200">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-gray-500">Loading attendance data...</div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-red-500">{error}</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left text-sm font-medium text-gray-600 px-4 py-3">Employee ID</th>
                  <th className="text-left text-sm font-medium text-gray-600 px-4 py-3">Name</th>
                  <th className="text-left text-sm font-medium text-gray-600 px-4 py-3">Department</th>
                  <th className="text-left text-sm font-medium text-gray-600 px-4 py-3">Status</th>
                  <th className="text-left text-sm font-medium text-gray-600 px-4 py-3">Clock In</th>
                  <th className="text-left text-sm font-medium text-gray-600 px-4 py-3">Clock Out</th>
                  <th className="text-left text-sm font-medium text-gray-600 px-4 py-3">Late (mins)</th>
                  <th className="text-left text-sm font-medium text-gray-600 px-4 py-3">OT (mins)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                      No attendance records found.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, index) => (
                    <tr key={row.employee_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{row.employee_id}</td>
                      <td className="px-4 py-3 text-sm">{row.name}</td>
                      <td className="px-4 py-3 text-sm">{normalizeDepartment(row.department)}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="relative inline-block w-full">
                          <select
                            value={row.status}
                            onChange={e => handleRowChange(index, 'status', e.target.value)}
                            className="border border-gray-200 rounded px-2 py-1 pr-8 appearance-none w-full"
                          >
                            {STATUS_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <input
                          type="time"
                          value={row.clock_in}
                          onChange={e => handleRowChange(index, 'clock_in', e.target.value)}
                          className="border border-gray-200 rounded px-2 py-1"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <input
                          type="time"
                          value={row.clock_out}
                          onChange={e => handleRowChange(index, 'clock_out', e.target.value)}
                          className="border border-gray-200 rounded px-2 py-1"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm">{row.late_minutes}</td>
                      <td className="px-4 py-3 text-sm">{row.ot_minutes}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="flex justify-end mt-4">
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-[#0B5E59] text-white rounded-lg hover:bg-[#094947]"
        >
          Save Attendance
        </button>
      </div>
    </div>
  );
};

export default AttendanceLog; 