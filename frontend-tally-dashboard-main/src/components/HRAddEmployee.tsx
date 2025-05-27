import React, { useState, useRef } from 'react';
import { User, Briefcase, Calendar, ChevronDown, Upload, FileText, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Define interface for form state
interface EmployeeFormState {
  // Personal Information
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
  
  // Professional Information
  department: string;
  designation: string;
  employment_type: string;
  date_of_joining: string;
  location_branch: string;
  shift_start_time: string;
  shift_end_time: string;
  basic_salary: string;
  tds_percentage: string;
  ot_charge: string;
  
  // Off Days
  off_monday: boolean;
  off_tuesday: boolean;
  off_wednesday: boolean;
  off_thursday: boolean;
  off_friday: boolean;
  off_saturday: boolean;
  off_sunday: boolean;
}

const HRAddEmployee: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'personal' | 'professional'>('personal');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize form state with default values
  const [formData, setFormData] = useState<EmployeeFormState>({
    // Personal Information
    first_name: '',
    last_name: '',
    mobile_number: '',
    email: '',
    date_of_birth: '',
    marital_status: '',
    gender: '',
    nationality: '',
    address: '',
    city: '',
    state: '',
    
    // Professional Information
    department: '',
    designation: '',
    employment_type: '',
    date_of_joining: '',
    location_branch: '',
    shift_start_time: '',
    shift_end_time: '',
    basic_salary: '',
    tds_percentage: '',
    ot_charge: '',
    
    // Off Days
    off_monday: false,
    off_tuesday: false,
    off_wednesday: false,
    off_thursday: false,
    off_friday: false,
    off_saturday: false,
    off_sunday: true,
  });
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Handle checkboxes separately
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => {
        let updated = { ...prev, [name]: value };
        if (name === 'basic_salary') {
          const salaryNum = parseFloat(value.replace(/,/g, ''));
          if (!isNaN(salaryNum) && salaryNum > 0) {
            updated.ot_charge = (salaryNum / 240).toFixed(2);
          } else {
            updated.ot_charge = '';
          }
        }
        return updated;
      });
    }
  };
  
  // Handle checkbox changes for off days
  const handleCheckboxChange = (day: string) => {
    const fieldName = `off_${day.toLowerCase()}` as keyof EmployeeFormState;
    setFormData(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };
  
  // Function to validate the form based on active tab
  const validateForm = (): boolean => {
    if (activeTab === 'personal') {
      if (!formData.first_name || !formData.last_name || !formData.mobile_number) {
        setError('Please fill in all required fields: First Name, Last Name, and Mobile Number');
        return false;
      }
    } else if (activeTab === 'professional') {
      if (!formData.department || !formData.designation) {
        setError('Please fill in all required fields: Department and Designation');
        return false;
      }
    }
    
    setError(null);
    return true;
  };

  // Handle file upload events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv')) {
        setSelectedFile(file);
      } else {
        alert('Please upload a CSV file');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.endsWith('.csv')) {
        setSelectedFile(file);
      } else {
        alert('Please upload a CSV file');
      }
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleTemplateDownload = () => {
    // In a real application, this would download an employee template CSV file
    alert('Downloading employee template CSV...');
  };

  // Function to handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    if (activeTab === 'personal') {
      // Move to professional tab if on personal tab
      setActiveTab('professional');
      return;
    }
    
    // If on professional tab, submit the form
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Structure data according to the backend expectation
      // Separate personal and professional information
      const personalInfo = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        mobile_number: formData.mobile_number,
        email: formData.email,
        date_of_birth: formData.date_of_birth,
        marital_status: formData.marital_status,
        gender: formData.gender,
        nationality: formData.nationality,
        address: formData.address,
        city: formData.city,
        state: formData.state
      };
      
      // Prepare off days list
      const offDaysList: string[] = [];
      if (formData.off_monday) offDaysList.push('MONDAY');
      if (formData.off_tuesday) offDaysList.push('TUESDAY');
      if (formData.off_wednesday) offDaysList.push('WEDNESDAY');
      if (formData.off_thursday) offDaysList.push('THURSDAY');
      if (formData.off_friday) offDaysList.push('FRIDAY');
      if (formData.off_saturday) offDaysList.push('SATURDAY');
      if (formData.off_sunday) offDaysList.push('SUNDAY');
      
      const professionalInfo = {
        department: formData.department,
        designation: formData.designation,
        employment_type: formData.employment_type,
        date_of_joining: formData.date_of_joining,
        location_branch: formData.location_branch,
        shift_start_time: formData.shift_start_time,
        shift_end_time: formData.shift_end_time,
        basic_salary: formData.basic_salary.replace(/,/g, ''), // Remove commas from salary
        tds_percentage: formData.tds_percentage.replace('%', ''), // Remove % sign from TDS
        ot_charge: formData.ot_charge,
        off_days: offDaysList
      };
      
      // Format the data for the API
      const apiData = {
        personal_info: personalInfo,
        professional_info: professionalInfo
      };
      
      // Make the API call to your backend endpoint
      const response = await fetch('http://localhost:8000/api/excel/create-employee/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add CSRF token if needed
          // 'X-CSRFToken': getCookie('csrftoken'),
        },
        body: JSON.stringify(apiData),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.errors ? JSON.stringify(data.errors) : data.message || 'Failed to create employee');
      }
      
      // If successful, show a success message and navigate to the directory page
      alert('Employee added successfully!');
      navigate('/hr-management/directory');
    } catch (err) {
      console.error('Error creating employee:', err);
      let errorMessage = 'An error occurred while saving the employee data';
      
      // Try to parse error message if it's JSON
      if (err instanceof Error) {
        try {
          const parsedError = JSON.parse(err.message);
          errorMessage = '';
          
          // Format error messages for each field
          for (const [field, messages] of Object.entries(parsedError)) {
            errorMessage += `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}\n`;
          }
        } catch {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* File Upload Area */}
      <div className="m-6">
        {/* <h3 className="text-lg font-medium mb-4">Add New Employee</h3> */}
        
        <div 
          className={`border-2 border-dashed rounded-lg p-8 ${
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <Upload size={28} className="text-blue-500" />
            </div>
            
            <h4 className="text-lg font-medium mb-2">Drag your file(s) to start uploading</h4>
            <p className="text-gray-500 mb-4">OR</p>
            
            <button 
              onClick={handleBrowseClick}
              className="px-6 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Browse files
            </button>
            
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />
            
            <p className="text-gray-500 mt-4 mb-4">Only supports .CSV files</p>
            
            <button 
              onClick={handleTemplateDownload}
              className="flex items-center gap-2 px-4 py-2 bg-[#1A6262] text-white rounded-md hover:bg-[#155252]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 16V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15 13L12 16L9 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 21H8C4 21 2 19 2 15V9C2 5 4 3 8 3H16C20 3 22 5 22 9V15C22 19 20 21 16 21Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Download Template</span>
            </button>
            
            {selectedFile && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md flex items-center gap-2 w-full max-w-md">
                <FileText size={20} className="text-green-600" />
                <span className="font-medium">{selectedFile.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mx-6">
        <div className="flex border-b">
          <div className="relative px-6">
            <button
              className={`flex items-center gap-2 pb-4 ${
                activeTab === 'personal' ? 'text-teal-600 font-medium' : 'text-gray-600'
              }`}
              onClick={() => setActiveTab('personal')}
            >
              <User size={18} />
              <span>Personal Information</span>
            </button>
            {activeTab === 'personal' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-teal-600"></div>
            )}
          </div>
          <div className="relative px-6">
            <button
              className={`flex items-center gap-2 pb-4 ${
                activeTab === 'professional' ? 'text-teal-600 font-medium' : 'text-gray-600'
              }`}
              onClick={() => setActiveTab('professional')}
            >
              <Briefcase size={18} />
              <span>Professional Information</span>
            </button>
            {activeTab === 'professional' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-teal-600"></div>
            )}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6 pt-4">
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2 text-red-700">
            <AlertCircle size={18} className="mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        
        {/* Personal Information Form */}
        {activeTab === 'personal' && (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                placeholder="First Name"
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-500 placeholder-gray-500"
              />
            </div>
            <div>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                placeholder="Last Name"
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-500 placeholder-gray-500"
              />
            </div>
            <div>
              <input
                type="text"
                name="mobile_number"
                value={formData.mobile_number}
                onChange={handleInputChange}
                placeholder="Mobile Number"
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-500 placeholder-gray-500"
              />
            </div>
            <div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Email Address"
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-500 placeholder-gray-500"
              />
            </div>
            <div className="relative">
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleInputChange}
                placeholder="Date of Birth"
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-500 placeholder-gray-500"
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            </div>
            <div className="relative">
              <select 
                name="marital_status"
                value={formData.marital_status}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none text-gray-500"
              >
                <option value="" disabled className="text-gray-500">Marital Status</option>
                <option value="SINGLE" className="text-gray-500">Single</option>
                <option value="MARRIED" className="text-gray-500">Married</option>
                <option value="DIVORCED" className="text-gray-500">Divorced</option>
                <option value="WIDOWED" className="text-gray-500">Widowed</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            </div>
            <div className="relative">
              <select 
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none text-gray-500"
              >
                <option value="" disabled className="text-gray-500">Gender</option>
                <option value="MALE" className="text-gray-500">Male</option>
                <option value="FEMALE" className="text-gray-500">Female</option>
                <option value="OTHER" className="text-gray-500">Other</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            </div>
            <div className="relative">
              <select 
                name="nationality"
                value={formData.nationality}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none text-gray-500"
              >
                <option value="" disabled className="text-gray-500">Nationality</option>
                <option value="India" className="text-gray-500">India</option>
                <option value="USA" className="text-gray-500">USA</option>
                <option value="UK" className="text-gray-500">UK</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            </div>
            <div className="col-span-2">
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Address"
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-500 placeholder-gray-500"
              />
            </div>
            <div className="relative">
              <select 
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none text-gray-500"
              >
                <option value="" disabled className="text-gray-500">City</option>
                <option value="Delhi" className="text-gray-500">Delhi</option>
                <option value="Mumbai" className="text-gray-500">Mumbai</option>
                <option value="Bangalore" className="text-gray-500">Bangalore</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            </div>
            <div className="relative">
              <select 
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none text-gray-500"
              >
                <option value="" disabled className="text-gray-500">State</option>
                <option value="Delhi" className="text-gray-500">Delhi</option>
                <option value="Maharashtra" className="text-gray-500">Maharashtra</option>
                <option value="Karnataka" className="text-gray-500">Karnataka</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            </div>
          </div>
        )}

        {/* Professional Information Form */}
        {activeTab === 'professional' && (
          <div className="grid grid-cols-2 gap-6">
            <div className="relative">
              <select 
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none text-gray-500"
              >
                <option value="" disabled className="text-gray-500">Department</option>
                <option value="PLATING" className="text-gray-500">PLATING</option>
                <option value="MECHINE" className="text-gray-500">MECHINE</option>
                <option value="CASTING" className="text-gray-500">CASTING</option>
                <option value="PACKING" className="text-gray-500">PACKING</option>
                <option value="HELPERS" className="text-gray-500">HELPERS</option>
                <option value="N/A" className="text-gray-500">N/A</option>
                <option value="Sales" className="text-gray-500">Sales</option>
                <option value="polish" className="text-gray-500">polish</option>
                <option value="Engineering" className="text-gray-500">Engineering</option>
                <option value="Design" className="text-gray-500">Design</option>
                <option value="Marketing" className="text-gray-500">Marketing</option>
                <option value="HR" className="text-gray-500">HR</option>
                <option value="Finance" className="text-gray-500">Finance</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            </div>
            <div>
              <input
                type="text"
                name="designation"
                value={formData.designation}
                onChange={handleInputChange}
                placeholder="Designation"
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-500 placeholder-gray-500"
              />
            </div>
            <div className="relative">
              <select 
                name="employment_type"
                value={formData.employment_type}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none text-gray-500"
              >
                <option value="" disabled className="text-gray-500">Employment Type</option>
                <option value="FULL_TIME" className="text-gray-500">Full-time</option>
                <option value="PART_TIME" className="text-gray-500">Part-time</option>
                <option value="CONTRACT" className="text-gray-500">Contract</option>
                <option value="INTERN" className="text-gray-500">Intern</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            </div>
            <div className="relative">
              <input
                type="date"
                name="date_of_joining"
                value={formData.date_of_joining}
                onChange={handleInputChange}
                placeholder="Date of Joining"
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-500 placeholder-gray-500"
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            </div>
            <div className="relative">
              <select 
                name="location_branch"
                value={formData.location_branch}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none text-gray-500"
              >
                <option value="" disabled className="text-gray-500">Location/Branch</option>
                <option value="Delhi" className="text-gray-500">Delhi</option>
                <option value="Mumbai" className="text-gray-500">Mumbai</option>
                <option value="Bangalore" className="text-gray-500">Bangalore</option>
                <option value="Hyderabad" className="text-gray-500">Hyderabad</option>
                <option value="Chennai" className="text-gray-500">Chennai</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            </div>
            <div className="relative">
              <select 
                name="shift_start_time"
                value={formData.shift_start_time}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none text-gray-500"
              >
                <option value="" disabled className="text-gray-500">Shift Start Time</option>
                <option value="09:00:00" className="text-gray-500">9:00 AM</option>
                <option value="09:30:00" className="text-gray-500">9:30 AM</option>
                <option value="10:00:00" className="text-gray-500">10:00 AM</option>
                <option value="10:30:00" className="text-gray-500">10:30 AM</option>
                <option value="11:00:00" className="text-gray-500">11:00 AM</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            </div>
            <div className="relative">
              <select 
                name="shift_end_time"
                value={formData.shift_end_time}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none text-gray-500"
              >
                <option value="" disabled className="text-gray-500">Shift End Time</option>
                <option value="17:00:00" className="text-gray-500">5:00 PM</option>
                <option value="17:30:00" className="text-gray-500">5:30 PM</option>
                <option value="18:00:00" className="text-gray-500">6:00 PM</option>
                <option value="18:30:00" className="text-gray-500">6:30 PM</option>
                <option value="19:00:00" className="text-gray-500">7:00 PM</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            </div>
            <div className="relative">
              <input
                type="text"
                name="basic_salary"
                value={formData.basic_salary}
                onChange={handleInputChange}
                placeholder="Basic Salary (e.g., 400,000)"
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-500 placeholder-gray-500"
              />
            </div>
            <div className="relative">
              <input
                type="text"
                name="tds_percentage"
                value={formData.tds_percentage}
                onChange={handleInputChange}
                placeholder="TDS (e.g., 7%)"
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-500 placeholder-gray-500"
              />
            </div>
            <div className="relative">
              <input
                type="text"
                name="ot_charge"
                value={formData.ot_charge}
                onChange={handleInputChange}
                placeholder="OT Charge per Hour (e.g., 100)"
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-500 placeholder-gray-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-gray-600 mb-2">Off Days</label>
              <div className="grid grid-cols-7 gap-2">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                  <div key={day} className="flex items-center">
                    <input
                      type="checkbox"
                      id={day}
                      name={`off_${day.toLowerCase()}`}
                      checked={formData[`off_${day.toLowerCase()}` as keyof EmployeeFormState] as boolean}
                      onChange={() => handleCheckboxChange(day)}
                      className="h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                    />
                    <label htmlFor={day} className="ml-2 text-sm text-gray-600">
                      {day}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer with Action Buttons */}
        <div className="flex justify-end gap-4 mt-8">
          <button
            onClick={() => navigate('/hr-management/directory')}
            className="px-5 py-2 border border-gray-200 text-gray-700 rounded-lg"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          
          {activeTab === 'personal' ? (
            <button
              onClick={handleSubmit}
              className="px-5 py-2 bg-teal-600 text-white rounded-lg"
              disabled={isSubmitting}
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-5 py-2 bg-teal-600 text-white rounded-lg flex items-center justify-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default HRAddEmployee; 