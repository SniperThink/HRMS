import React, { useEffect, useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { fetchSalaryData, SalaryRawData, TimePeriod, fetchPayments, createPayment, fetchSalaryDataForEmployeeMonth } from '../services/salaryService';
import { useNavigate } from 'react-router-dom';

interface PayrollData {
  employee_id: string;
  name: string;
  department: string;
  designation: string;
  basic_salary: string;
  ot_hours: string;
  late_minutes: string;
  salary_before_tds: string;
  tds: string;
  final_tax: string;
  total_advance_pending: string;
  advance_deduction: string;
  net_payable: string;
}

interface HRPayrollProps {
  timePeriod?: TimePeriod;
}

const normalizeDepartment = (dept: string | undefined) => (dept && dept.trim() !== '' && dept !== '0') ? dept : 'N/A';

const HRPayroll: React.FC<HRPayrollProps> = ({ timePeriod = 'this_month' }) => {
  const [payrollData, setPayrollData] = useState<SalaryRawData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriod>(timePeriod);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [pendingDepartments, setPendingDepartments] = useState<string[]>([]);
  const [showDeptFilter, setShowDeptFilter] = useState(false);
  const [comments, setComments] = useState<{ [id: string]: string }>({});
  const [openAdvanceModal, setOpenAdvanceModal] = useState<string | null>(null);
  const [openPayModal, setOpenPayModal] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'payroll' | 'advance' | 'payments'>('payroll');
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [advanceForm, setAdvanceForm] = useState({
    employee: '',
    advanceDate: '',
    amount: '',
    forMonth: '',
    paymentMethod: '',
    remarks: '',
  });
  const [advanceLedger, setAdvanceLedger] = useState<any[]>([]);
  const [advanceLedgerLoading, setAdvanceLedgerLoading] = useState(false);
  const [advanceLedgerError, setAdvanceLedgerError] = useState<string | null>(null);
  const [editAdvanceId, setEditAdvanceId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    employee: '',
    paymentDate: '',
    amount: '',
    payPeriod: '',
    paymentMethod: '',
    advanceDeductions: '',
    net_payable: '',
  });
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);
  const [payModalForm, setPayModalForm] = useState({
    paymentDate: '',
    net_payable: '',
    advanceDeductions: '',
    amount: '',
    payPeriod: '',
    paymentMethod: '',
  });
  const [employeeSalaryData, setEmployeeSalaryData] = useState<SalaryRawData[]>([]);
  const navigate = useNavigate();

  // Initial state for payment form
  const initialPaymentForm = {
    employee: '',
    paymentDate: '',
    amount: '',
    payPeriod: '',
    paymentMethod: '',
    advanceDeductions: '',
    net_payable: '',
  };

  useEffect(() => {
    setSelectedTimePeriod(timePeriod);
  }, [timePeriod]);

  useEffect(() => {
    const loadPayrollData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://127.0.0.1:8000/api/excel/salary-data/');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch payroll data: ${response.status}`);
        }
        
        const rawData: SalaryRawData[] = await response.json();
        const processedData = processPayrollData(rawData);
        setPayrollData(processedData);
        setError(null);
      } catch (err) {
        console.error('Error loading payroll data:', err);
        setError('Failed to load payroll data');
        setPayrollData([]);
      } finally {
        setLoading(false);
      }
    };

    loadPayrollData();
  }, [selectedTimePeriod]);

  useEffect(() => {
    if (activeTab !== 'advance') return;
    setAdvanceLedgerLoading(true);
    setAdvanceLedgerError(null);
    fetch('http://127.0.0.1:8000/api/excel/advance-ledger/')
      .then(res => res.json())
      .then(data => setAdvanceLedger(data))
      .catch(() => setAdvanceLedgerError('Failed to load advance ledger'))
      .finally(() => setAdvanceLedgerLoading(false));
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'payments') return;
    setPaymentsLoading(true);
    setPaymentsError(null);
    fetchPayments()
      .then(data => setPayments(data))
      .catch(() => setPaymentsError('Failed to load payments'))
      .finally(() => setPaymentsLoading(false));
  }, [activeTab]);

  const processPayrollData = (rawData: SalaryRawData[]): SalaryRawData[] => {
    const employeeMap = new Map<string, SalaryRawData>();
    const sortedData = [...rawData].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });
    sortedData.forEach(record => {
      if (!record.employee_id) return;
      if (!employeeMap.has(record.employee_id)) {
        employeeMap.set(record.employee_id, record);
      }
    });
    return Array.from(employeeMap.values());
  };

  const filteredData = payrollData.filter(record => {
    if (selectedDepartments.length > 0 && !selectedDepartments.includes(normalizeDepartment(record.department))) {
      return false;
    }
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      record.employee_id.toLowerCase().includes(query) ||
      record.name.toLowerCase().includes(query) ||
      record.department.toLowerCase().includes(query)
    );
  });

  const salaryFields = [
    'date', 'employee_id', 'name', 'department', 'basic_salary', 'days_present', 'days_absent', 'ot_hours', 'ot_charges', 'late_minutes', 'incentive', 'late_charges', 'salary_wo_advance_deduction', 'adv_paid_on_25th', 'repayment_of_old_adv', 'tds', 'sal_before_tds', 'total_advance', 'net_payable', 'comment', 'actions'
  ];
  const salaryFieldLabels: Record<string, string> = {
    date: 'Date',
    employee_id: 'Employee ID',
    name: 'Full Name',
    department: 'Department',
    basic_salary: 'Basic Salary',
    days_present: 'Days Present',
    days_absent: 'Days Absent',
    ot_hours: 'OT Hours',
    ot_charges: 'OT Charges',
    late_minutes: 'Late Minutes',
    incentive: 'Incentive',
    late_charges: 'Late Charges',
    salary_wo_advance_deduction: 'Salary w/o Advance Deduction',
    adv_paid_on_25th: 'Adv Paid on 25th',
    repayment_of_old_adv: 'Repayment of Old Adv',
    tds: 'TDS',
    sal_before_tds: 'Salary Before TDS',
    total_advance: 'Total Advance',
    net_payable: 'Net Payable',
    comment: 'Comment',
    actions: 'Actions',
  };

  const employeesList = payrollData.map(e => ({ id: e.employee_id, name: e.name }));

  const openAdvance = (employeeId?: string, entry?: any) => {
    setShowAdvanceModal(true);
    setEditAdvanceId(entry?.id || null);
    setAdvanceForm(entry ? {
      employee: entry.employee_id,
      advanceDate: entry.advance_date,
      amount: entry.amount,
      forMonth: entry.for_month,
      paymentMethod: entry.payment_method,
      remarks: entry.remarks,
    } : {
      employee: employeeId || '',
      advanceDate: '',
      amount: '',
      forMonth: '',
      paymentMethod: '',
      remarks: '',
    });
  };

  const paymentMethodMap: Record<string, string> = {
    'Cash': 'CASH',
    'Bank Transfer': 'BANK_TRANSFER',
    'Cheque': 'CHEQUE',
    'cash': 'CASH',
    'bank': 'BANK_TRANSFER',
    'bank transfer': 'BANK_TRANSFER',
    'cheque': 'CHEQUE',
  };

  const refreshPayrollData = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/excel/salary-data/');
      const rawData = await response.json();
      const processedData = processPayrollData(rawData);
      setPayrollData(processedData);
    } catch (err) {
      setError('Failed to load payroll data');
      setPayrollData([]);
    } finally {
      setLoading(false);
    }
  };

  const saveAdvance = async () => {
    const method = editAdvanceId ? 'PATCH' : 'POST';
    const url = editAdvanceId
      ? `http://127.0.0.1:8000/api/excel/advance-ledger/${editAdvanceId}/`
      : 'http://127.0.0.1:8000/api/excel/advance-ledger/';
    const employeeObj = employeesList.find(e => e.id === advanceForm.employee);
    const body = {
      employee_id: advanceForm.employee,
      employee_name: employeeObj ? employeeObj.name : '',
      advance_date: advanceForm.advanceDate,
      amount: advanceForm.amount,
      for_month: advanceForm.forMonth,
      payment_method: paymentMethodMap[advanceForm.paymentMethod] || advanceForm.paymentMethod,
      remarks: advanceForm.remarks,
    };
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setShowAdvanceModal(false);
    setEditAdvanceId(null);
    setAdvanceLedgerLoading(true);
    fetch('http://127.0.0.1:8000/api/excel/advance-ledger/')
      .then(res => res.json())
      .then(data => setAdvanceLedger(data))
      .finally(() => setAdvanceLedgerLoading(false));
    // Refresh payroll data after advance
    await refreshPayrollData();
  };

  const handleOpenPayModal = (employeeId: string) => {
    const employee = payrollData.find(r => r.employee_id === employeeId);
    setPayModalForm({
      paymentDate: '',
      net_payable: employee?.net_payable || '',
      advanceDeductions: '',
      amount: '',
      payPeriod: '',
      paymentMethod: '',
    });
    setOpenPayModal(employeeId);
  };

  // Helper to get payroll record for employee and month
  const getPayrollForEmployeeMonth = (employeeId: string, payPeriod: string) => {
    return payrollData.find(r => r.employee_id === employeeId && r.date && r.date.includes(payPeriod.split(' ')[0])) || null;
  };

  // Helper to get payroll record for employee and month/year from date
  const getPayrollForEmployeeDate = (employeeId: string, dateStr: string) => {
    if (!dateStr) return null;
    const dateObj = new Date(dateStr);
    const month = dateObj.getMonth() + 1; // JS months are 0-based
    const year = dateObj.getFullYear();
    return payrollData.find(r => {
      if (r.employee_id !== employeeId || !r.date) return false;
      const recDate = new Date(r.date);
      return recDate.getMonth() + 1 === month && recDate.getFullYear() === year;
    }) || null;
  };

  // Fetch salary data for selected employee when employee changes
  useEffect(() => {
    if (!paymentForm.employee) {
      setEmployeeSalaryData([]);
      setPaymentForm(f => ({ ...f, net_payable: '' }));
      return;
    }
    const fetchEmployeeSalary = async () => {
      try {
        const url = `http://127.0.0.1:8000/api/excel/salary-data/by_employee/?employee_id=${paymentForm.employee}`;
        const response = await fetch(url);
        if (!response.ok) {
          setEmployeeSalaryData([]);
          return;
        }
        const data: SalaryRawData[] = await response.json();
        setEmployeeSalaryData(data);
      } catch (e) {
        setEmployeeSalaryData([]);
      }
    };
    fetchEmployeeSalary();
  }, [paymentForm.employee]);

  // When date changes, filter employeeSalaryData for the correct month/year
  useEffect(() => {
    if (!paymentForm.employee || !paymentForm.paymentDate) {
      setPaymentForm(f => ({ ...f, net_payable: '' }));
      return;
    }
    const dateObj = new Date(paymentForm.paymentDate);
    const year = dateObj.getFullYear();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[dateObj.getMonth()];
    const record = employeeSalaryData.find(r => {
      // Compare year and month (case-insensitive)
      return r.year === year && r.month.toLowerCase().startsWith(month.toLowerCase());
    });
    setPaymentForm(f => ({ ...f, net_payable: record ? record.net_payable : '' }));
  }, [paymentForm.paymentDate, paymentForm.employee, employeeSalaryData]);

  // When opening the modal, reset form and salary data
  const openPaymentModal = () => {
    setPaymentForm({ ...initialPaymentForm, employee: '' });
    setEmployeeSalaryData([]);
    setShowPaymentModal(true);
  };

  // When closing the modal, reset form and salary data
  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setPaymentForm(initialPaymentForm);
    setEmployeeSalaryData([]);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-semibold">Payroll</h1>
          <p className="text-sm text-gray-500">All Employee Payroll</p>
        </div>

        {/* Search and Filters */}
        <div className="flex justify-between mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            />
          </div>
          
          <div className="flex items-center gap-4">
            {/* Time Period Filter */}
            <select
              value={selectedTimePeriod}
              onChange={(e) => setSelectedTimePeriod(e.target.value as TimePeriod)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            >
              <option value="this_month">This Month</option>
              <option value="last_6_months">Last 6 Months</option>
              <option value="last_12_months">Last 12 Months</option>
              <option value="last_5_years">Last 5 Years</option>
            </select>

            <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm" onClick={() => { setPendingDepartments(selectedDepartments); setShowDeptFilter(true); }}>
              <Filter size={16} />
              Filter
            </button>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 mb-4">
          <button className={`px-4 py-2 rounded ${activeTab === 'payroll' ? 'bg-white border border-gray-200 font-semibold' : 'bg-gray-100 text-gray-600'}`} onClick={() => setActiveTab('payroll')}>Payroll</button>
          <button className={`px-4 py-2 rounded ${activeTab === 'advance' ? 'bg-white border border-gray-200 font-semibold' : 'bg-gray-100 text-gray-600'}`} onClick={() => setActiveTab('advance')}>Advance Ledger</button>
          <button className={`px-4 py-2 rounded ${activeTab === 'payments' ? 'bg-white border border-gray-200 font-semibold' : 'bg-gray-100 text-gray-600'}`} onClick={() => setActiveTab('payments')}>Payments</button>
        </div>

        {/* Table */}
        {activeTab === 'payroll' ? (
          loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-gray-500">Loading payroll data...</div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-red-500">{error}</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead className="bg-gray-50">
                  <tr>
                    {salaryFields.map(field => (
                      <th key={field} className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                        {salaryFieldLabels[field] || field}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={salaryFields.length} className="px-4 py-6 text-center text-gray-500">
                        No payroll records found.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((record, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        {salaryFields.map(field => (
                          <td key={field} className="px-4 py-3 text-sm">
                            {field === 'department' ? normalizeDepartment(record[field as keyof SalaryRawData] as string)
                              : field === 'total_advance' ? (record.total_advance ?? record.total_old_advance ?? '-')
                              : field === 'comment' ? (
                                <input
                                  type="text"
                                  value={comments[record.employee_id] || ''}
                                  onChange={e => setComments({ ...comments, [record.employee_id]: e.target.value })}
                                  placeholder="Add comment"
                                  className="border rounded px-2 py-1 text-sm w-32"
                                />
                              )
                              : field === 'actions' ? (
                                <div className="flex gap-2">
                                  <button className="px-2 py-1 bg-gray-100 rounded text-xs" onClick={() => openAdvance(record.employee_id)}>+ Advance</button>
                                  <button className="px-2 py-1 bg-gray-100 rounded text-xs" onClick={() => handleOpenPayModal(record.employee_id)}>$ Pay</button>
                                </div>
                              )
                              : (record[field as keyof SalaryRawData] ?? '-')}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )
        ) : activeTab === 'advance' ? (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Advance Ledger</h2>
              <button className="bg-teal-700 text-white px-5 py-2 rounded-lg font-medium" onClick={() => openAdvance()}>+ Record Advance</button>
            </div>
            <table className="w-full min-w-max">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Employee ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Employee Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Advance Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">For Month</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Payment Method</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Remarks</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {advanceLedgerLoading ? (
                  <tr><td colSpan={9} className="text-center py-6">Loading...</td></tr>
                ) : advanceLedgerError ? (
                  <tr><td colSpan={9} className="text-center py-6 text-red-500">{advanceLedgerError}</td></tr>
                ) : advanceLedger.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-6">No records found.</td></tr>
                ) : (
                  advanceLedger.map((row, idx) => (
                    <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{row.employee_id}</td>
                      <td className="px-4 py-3 text-sm">{row.employee_name}</td>
                      <td className="px-4 py-3 text-sm">{row.advance_date}</td>
                      <td className="px-4 py-3 text-sm">₹{Number(row.amount).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm">{row.for_month}</td>
                      <td className="px-4 py-3 text-sm">{row.payment_method}</td>
                      <td className="px-4 py-3 text-sm">{row.status === 'Repaid' ? <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs">Repaid</span> : <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs">Pending</span>}</td>
                      <td className="px-4 py-3 text-sm">{row.remarks}</td>
                      <td className="px-4 py-3 text-sm"><button className="border px-4 py-1 rounded" onClick={() => openAdvance(undefined, row)}>Edit</button></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Payments</h2>
              <button className="bg-teal-700 text-white px-5 py-2 rounded-lg font-medium" onClick={openPaymentModal}>+ Record Payment</button>
            </div>
            <table className="w-full min-w-max">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Employee ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Employee Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Payment Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Pay Period</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Payment Method</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Net Payable</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Advance Deductions</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Amount Paid</th>
                </tr>
              </thead>
              <tbody>
                {paymentsLoading ? (
                  <tr><td colSpan={8} className="text-center py-6">Loading...</td></tr>
                ) : paymentsError ? (
                  <tr><td colSpan={8} className="text-center py-6 text-red-500">{paymentsError}</td></tr>
                ) : payments.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-6">No payment records found.</td></tr>
                ) : (
                  payments.map((row, idx) => (
                    <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{row.employee_id}</td>
                      <td className="px-4 py-3 text-sm">{row.employee_name}</td>
                      <td className="px-4 py-3 text-sm">{row.payment_date}</td>
                      <td className="px-4 py-3 text-sm">{row.pay_period}</td>
                      <td className="px-4 py-3 text-sm">{row.payment_method}</td>
                      <td className="px-4 py-3 text-sm">{row.net_payable}</td>
                      <td className="px-4 py-3 text-sm">{row.advance_deduction}</td>
                      <td className="px-4 py-3 text-sm">{parseFloat(row.net_payable || '0') - parseFloat(row.advance_deduction || '0')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {/* Payment Modal */}
            {showPaymentModal && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
                <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
                  <h2 className="text-xl font-semibold mb-6">Record Payment</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-200 rounded"
                        value={paymentForm.employee}
                        onChange={e => {
                          // Always update paymentForm.employee and trigger fetch for this employee only
                          setPaymentForm(f => ({ ...f, employee: e.target.value }));
                        }}
                      >
                        <option value="">Select employee</option>
                        {employeesList.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                      <input type="date" className="w-full px-3 py-2 border border-gray-200 rounded" value={paymentForm.paymentDate} onChange={e => setPaymentForm(f => ({ ...f, paymentDate: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Net Payable</label>
                      <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded bg-gray-100" value={paymentForm.net_payable || ''} readOnly />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Advance Deductions</label>
                      <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded" placeholder="₹ 0" value={paymentForm.advanceDeductions || ''} min={0} max={(() => {
                        const selectedEmployee = payrollData.find(e => e.employee_id === paymentForm.employee);
                        const maxAdvance = selectedEmployee ? (selectedEmployee.total_advance ?? selectedEmployee.total_old_advance ?? 0) : 0;
                        return maxAdvance;
                      })()} onChange={e => setPaymentForm(f => ({ ...f, advanceDeductions: e.target.value }))} />
                      <div className="text-xs text-gray-500 mt-1">Max: ₹{(() => {
                        const selectedEmployee = payrollData.find(e => e.employee_id === paymentForm.employee);
                        const maxAdvance = selectedEmployee ? (selectedEmployee.total_advance ?? selectedEmployee.total_old_advance ?? 0) : 0;
                        return maxAdvance;
                      })()}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid</label>
                      <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded bg-gray-100" value={parseFloat(paymentForm.net_payable || '0') - parseFloat(paymentForm.advanceDeductions || '0')} readOnly />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pay Period</label>
                      <select className="w-full px-3 py-2 border border-gray-200 rounded" value={paymentForm.payPeriod} onChange={e => setPaymentForm(f => ({ ...f, payPeriod: e.target.value }))}>
                        <option value="">Select pay period</option>
                        <option value="Jan 2025">Jan 2025</option>
                        <option value="Feb 2025">Feb 2025</option>
                        <option value="Mar 2025">Mar 2025</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                      <select className="w-full px-3 py-2 border border-gray-200 rounded" value={paymentForm.paymentMethod} onChange={e => setPaymentForm(f => ({ ...f, paymentMethod: e.target.value }))}>
                        <option value="">Select payment method</option>
                        <option value="Cash">Cash</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Cheque">Cheque</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-8">
                    <button className="px-5 py-2 border border-gray-200 text-gray-700 rounded-lg" onClick={closePaymentModal}>Cancel</button>
                    <button className="px-5 py-2 bg-teal-600 text-white rounded-lg" disabled={(() => {
                      const selectedEmployee = payrollData.find(e => e.employee_id === paymentForm.employee);
                      const maxAdvance = selectedEmployee ? (selectedEmployee.total_advance ?? selectedEmployee.total_old_advance ?? 0) : 0;
                      return maxAdvance < parseFloat(paymentForm.advanceDeductions || '0');
                    })()} onClick={async () => {
                      if ((() => {
                        const selectedEmployee = payrollData.find(e => e.employee_id === paymentForm.employee);
                        const maxAdvance = selectedEmployee ? (selectedEmployee.total_advance ?? selectedEmployee.total_old_advance ?? 0) : 0;
                        return maxAdvance;
                      })() < parseFloat(paymentForm.advanceDeductions || '0')) return;
                      // Save payment to backend
                      const backendMethod = paymentMethodMap[paymentForm.paymentMethod] || paymentForm.paymentMethod;
                      const payload = {
                        employee_id: paymentForm.employee,
                        employee_name: employeesList.find(e => e.id === paymentForm.employee)?.name,
                        payment_date: paymentForm.paymentDate,
                        net_payable: paymentForm.net_payable,
                        advance_deduction: paymentForm.advanceDeductions,
                        amount_paid: parseFloat(paymentForm.net_payable || '0') - parseFloat(paymentForm.advanceDeductions || '0'),
                        pay_period: paymentForm.payPeriod,
                        payment_method: backendMethod,
                      };
                      await createPayment(payload);
                      closePaymentModal();
                      setPaymentsLoading(true);
                      fetchPayments()
                        .then(data => setPayments(data))
                        .finally(() => setPaymentsLoading(false));
                      // Refresh payroll data after payment
                      await refreshPayrollData();
                    }}>Save</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAdvanceModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-6">Record Advance Payment</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded" value={advanceForm.employee} onChange={e => setAdvanceForm(f => ({ ...f, employee: e.target.value }))}>
                  <option value="">Select employee</option>
                  {employeesList.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Advance Date</label>
                <input type="date" className="w-full px-3 py-2 border border-gray-200 rounded" value={advanceForm.advanceDate} onChange={e => setAdvanceForm(f => ({ ...f, advanceDate: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Advance Amount</label>
                <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded" placeholder="₹ 0" value={advanceForm.amount} onChange={e => setAdvanceForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">For Month</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded" value={advanceForm.forMonth} onChange={e => setAdvanceForm(f => ({ ...f, forMonth: e.target.value }))}>
                  <option value="">Select pay period</option>
                  <option value="Jan 2025">Jan 2025</option>
                  <option value="Feb 2025">Feb 2025</option>
                  <option value="Mar 2025">Mar 2025</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded" value={advanceForm.paymentMethod} onChange={e => setAdvanceForm(f => ({ ...f, paymentMethod: e.target.value }))}>
                  <option value="">Select payment method</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason / Notes</label>
                <textarea className="w-full px-3 py-2 border border-gray-200 rounded" placeholder="Optional notes about this advance" value={advanceForm.remarks} onChange={e => setAdvanceForm(f => ({ ...f, remarks: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-8">
              <button className="px-5 py-2 border border-gray-200 text-gray-700 rounded-lg" onClick={() => setShowAdvanceModal(false)}>Cancel</button>
              <button className="px-5 py-2 bg-teal-600 text-white rounded-lg" onClick={saveAdvance}>Save</button>
            </div>
          </div>
        </div>
      )}
      {openPayModal && (() => {
        const employee = payrollData.find(r => r.employee_id === openPayModal);
        return (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
              <h2 className="text-xl font-semibold mb-2">Make Payment</h2>
              <p className="text-sm text-blue-700 mb-6">Record a payment for {employee?.name} ({employee?.employee_id})</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                  <input type="date" className="w-full px-3 py-2 border border-gray-200 rounded" value={payModalForm.paymentDate} onChange={e => setPayModalForm(f => ({ ...f, paymentDate: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Net Payable</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded" value={payModalForm.net_payable} onChange={e => setPayModalForm(f => ({ ...f, net_payable: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Advance Deductions</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded" placeholder="₹ 0" value={payModalForm.advanceDeductions} onChange={e => setPayModalForm(f => ({ ...f, advanceDeductions: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount to Pay (INR)</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded" placeholder="₹ 0" value={payModalForm.amount} onChange={e => setPayModalForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select pay period</label>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded" value={payModalForm.payPeriod} onChange={e => setPayModalForm(f => ({ ...f, payPeriod: e.target.value }))}>
                    <option value="">Select pay period</option>
                    <option value="Jan 2025">Jan 2025</option>
                    <option value="Feb 2025">Feb 2025</option>
                    <option value="Mar 2025">Mar 2025</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded" value={payModalForm.paymentMethod} onChange={e => setPayModalForm(f => ({ ...f, paymentMethod: e.target.value }))}>
                    <option value="">Select payment method</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-8">
                <button className="px-5 py-2 border border-gray-200 text-gray-700 rounded-lg" onClick={() => setOpenPayModal(null)}>Cancel</button>
                <button className="px-5 py-2 bg-teal-600 text-white rounded-lg" onClick={async () => {
                  // Save payment to backend
                  const backendMethod = paymentMethodMap[payModalForm.paymentMethod] || payModalForm.paymentMethod;
                  const payload = {
                    employee_id: employee?.employee_id,
                    employee_name: employee?.name,
                    payment_date: payModalForm.paymentDate,
                    net_payable: payModalForm.net_payable,
                    advance_deduction: payModalForm.advanceDeductions,
                    amount_paid: payModalForm.amount,
                    pay_period: payModalForm.payPeriod,
                    payment_method: backendMethod,
                  };
                  await createPayment(payload);
                  setOpenPayModal(null);
                  setPaymentsLoading(true);
                  fetchPayments()
                    .then(data => setPayments(data))
                    .finally(() => setPaymentsLoading(false));
                  // Refresh payroll data after payment
                  await refreshPayrollData();
                }}>Save Payment</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Department Filter Modal */}
      {showDeptFilter && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-xs">
            <h2 className="text-lg font-semibold mb-4">Filter</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <div className="grid grid-cols-2 gap-2">
                {['PLATING', 'MECHINE', 'CASTING', 'PACKING', 'HELPERS', 'N/A(0)', 'Sales', 'polish'].map(dept => (
                  <label key={dept} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={pendingDepartments.includes(dept)}
                      onChange={e => {
                        if (e.target.checked) {
                          setPendingDepartments(prev => [...prev, dept]);
                        } else {
                          setPendingDepartments(prev => prev.filter(d => d !== dept));
                        }
                      }}
                      className="accent-teal-700"
                    />
                    {dept}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button className="px-5 py-2 border border-gray-200 text-gray-700 rounded-lg" onClick={() => setShowDeptFilter(false)}>Cancel</button>
              <button className="px-5 py-2 bg-teal-700 text-white rounded-lg" onClick={() => { setSelectedDepartments(pendingDepartments); setShowDeptFilter(false); }}>Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRPayroll;