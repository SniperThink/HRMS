import * as XLSX from 'xlsx';

export interface EmployeeData {
  employee_id: string;
  name: string;
  mobile_number: string;
  email: string;
  department: string;
  designation: string;
  employment_type: string;
  branch_location: string;
  attendance: string;
  ot_hours: string;
  days_present?: string;
  days_absent?: string;
  shiftStartTime?: string;
  shiftEndTime?: string;
  basic_salary?: string;
}

export const exportToExcel = (data: EmployeeData[], fileName: string = 'employees') => {
  // Define headers with proper capitalization
  const headers = [
    'Employee Name',
    'Mobile Number',
    'Email',
    'Department',
    'Designation',
    'Employment Type',
    'Branch Location',
    'Attendance',
    'OT Hours',
    'Shift Start Time',
    'Shift End Time',
    'Basic Salary'
  ];

  // Create worksheet data with a blank row after headers
  const wsData = [
    headers,
    [], // Empty row for spacing
    ...data.map(item => [
      item.name,
      item.mobile_number,
      item.email,
      item.department,
      item.designation,
      item.employment_type,
      item.branch_location,
      item.attendance,
      item.ot_hours,
      item.shiftStartTime || '-',
      item.shiftEndTime || '-',
      item.basic_salary || '-'
    ])
  ];

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  const columnWidths = headers.map(() => ({ wch: 15 }));
  worksheet['!cols'] = columnWidths;

  // Apply bold style to headers
  const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!worksheet[cellRef]) continue;
    
    worksheet[cellRef].s = {
      font: {
        bold: true,
        sz: 12
      },
      alignment: {
        horizontal: 'center'
      }
    };
  }

  // Create workbook and add the worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');

  // Generate Excel file
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}; 