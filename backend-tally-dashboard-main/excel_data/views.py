from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status, viewsets, filters
from rest_framework.decorators import api_view, action
from decimal import Decimal
from datetime import date
import pandas as pd
import uuid
import re
import hashlib
from django.db.models import Q
from .models import SalaryData, EmployeeProfile, Attendance, DailyAttendance, AdvanceLedger, Payment
from .serializers import (
    SalaryDataSerializer, SalaryDataSummarySerializer,
    EmployeeProfileSerializer, EmployeeProfileListSerializer,
    EmployeeFormSerializer, EmployeeTableSerializer,
    AttendanceSerializer, DailyAttendanceSerializer,
    AdvanceLedgerSerializer, PaymentSerializer
)
from django.utils import timezone

class UploadSalaryAndPolDataAPIView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    # Helpers for cleaning
    def clean_decimal(self, value):
        try:
            if value in [None, '', 'NaN', 'nan']:
                return Decimal('0.00')
            return Decimal(str(value))
        except Exception:
            return Decimal('0.00')

    def clean_int(self, value):
        try:
            return int(value)
        except Exception:
            return 0

    def is_valid_name(self, name):
        """
        Check if a name is valid (not empty, not just '-', not '0', etc.)
        """
        if not name:
            return False
            
        name_str = str(name).strip()
        invalid_names = ['', '-', '0', 'nan', 'NaN', 'None', 'none']
        
        # Check if name is just one of the invalid values
        if name_str.lower() in invalid_names:
            return False
            
        # Check if name is only made up of special characters
        if all(c in '- _.,' for c in name_str):
            return False
            
        return True

    # Returns the 25th day of the given month/year based on month abbreviation.
    def get_last_day(self, year, month_abbr):
        try:
            month_abbr = month_abbr.strip().upper()
            month_lookup = {
                'JANUARY': 1, 'JAN': 1,
                'FEBRUARY': 2, 'FEB': 2,
                'MARCH': 3, 'MAR': 3,
                'APRIL': 4, 'APR': 4,
                'MAY': 5,
                'JUNE': 6, 'JUN': 6,
                'JULY': 7, 'JUL': 7,
                'AUGUST': 8, 'AUG': 8,
                'SEPTEMBER': 9, 'SEPT': 9,
                'OCTOBER': 10, 'OCT': 10,
                'NOVEMBER': 11, 'NOV': 11,
                'DECEMBER': 12, 'DEC': 12
            }
            month_number = month_lookup[month_abbr]
            result = date(int(year), month_number, 25)
            print(f"Computed date: {result} for {month_abbr} {year}")
            return result
        except Exception as e:
            print(f"Error in get_last_day for {month_abbr} {year}: {e}")
            return None

    # Extract month and year from the sheet name using regex
    def extract_month_year(self, sheet_name):
        clean = sheet_name.upper().strip().replace('_', ' ').replace('-', ' ')
        tokens = re.findall(r'[A-Z]+|\d{2,4}', clean)
        months_map = {
            'JANUARY': 'JAN', 'FEBRUARY': 'FEB', 'MARCH': 'MAR', 'APRIL': 'APR',
            'MAY': 'MAY', 'JUNE': 'JUN', 'JULY': 'JUL', 'AUGUST': 'AUG',
            'SEPTEMBER': 'SEPT', 'OCTOBER': 'OCT', 'NOVEMBER': 'NOV', 'DECEMBER': 'DEC',
            'JAN': 'JAN', 'FEB': 'FEB', 'MAR': 'MAR', 'APR': 'APR',
            'JUN': 'JUN', 'JUL': 'JUL', 'AUG': 'AUG', 'SEPT': 'SEPT',
            'OCT': 'OCT', 'NOV': 'NOV', 'DEC': 'DEC'
        }
        month = None
        year = None
        for token in tokens:
            token_upper = token.upper()
            if token_upper in months_map:
                month = months_map[token_upper]
            elif token.isdigit():
                year = '20' + token if len(token) == 2 else token
        return month, int(year) if year and year.isdigit() else None

    # Generate a consistent employee ID based on name and department
    def generate_employee_id(self, name, department=""):
        if not name or str(name).strip() in ['', '0', 'nan', 'NaN', '-']:
            return str(uuid.uuid4())[:8]  # Random ID for empty names
        
        # Create a consistent hash from the employee name (and optionally department)
        key = (name.strip().upper() + department.strip().upper()).encode('utf-8')
        return hashlib.md5(key).hexdigest()[:8]  # Use first 8 chars of MD5 hash

    def post(self, request, *args, **kwargs):
        try:
            excel_file = request.FILES.get('file')
            if not excel_file:
                return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

            xls = pd.ExcelFile(excel_file)
            # Process sheets containing "SAL" (including both SAL and SAL POL) and excluding unwanted ones (like SALESMEN)
            sheets = [s for s in xls.sheet_names if 'SAL' in s.upper() and 'SALESMEN' not in s.upper()]
            print(f"Found sheets: {sheets}")

            # Define column mapping (normalized header -> model field)
            column_map = {
              "YEAR": "year",
              "MONTH": "month",
              "DATE": "date",
              "NAME": "name",
              "SALERY": "basic_salary",
              "SALARY": "basic_salary",  # This is your existing SALERY to basic_salary
              "DAYS": "days_present",
              "ABSENT": "days_absent",
              "SL W/O OT": "sl_wo_ot_wo_late",  # This is your SL W/O OT
              "OT": "ot_hours",  # This is your OT
              "PER HOUR RS": "basic_salary_per_hour",  # This is your PER HOUR RS
              "OT CHARGES": "ot_charges",  # This is your OT CHARGES
              "LATE": "late_minutes",  # This is your LATE
              "CHARGE": "basic_salary_per_minute",  # This is your CHARGE
              "INCENTIVE": "incentive",  # This is your INCENTIVE
              "AMT": "late_charges",  # This is your AMT
              "SAL+OT": "salary_wo_advance_deduction",  # This is your SAL+OT
              "25TH ADV": "adv_paid_on_25th",  # This is your 25TH ADV
              "OLD ADV": "repayment_of_old_adv",  # This is your OLD ADV
              "NETT PAYABLE": "net_payable",  # This is your NETT PAYABLE
              "NETT SALRY": "net_payable",  # This is your NETT SALRY (same as NETT PAYABLE)
              "Net payable": "net_payable",
              "TOTAL OLD ADV": "total_old_advance",
              "Total old ADV": "total_old_advance",  # This is your Total old ADV
              "BALNCE ADV": "final_balance_advance",  # This is your Balnce Adv
              "Balnce Adv": "final_balance_advance",  # This is your Balnce Adv
              "TDS": "tds",  # This is your TDS
              "SAL-TDS": "sal_before_tds",  # This is your SAL-TDS
              "ADVANCE": "advance",  # This is your ADVANCE
              "DEPARTMENT": "department",  # This is your Department
              "EMPLOYE_ID": "employee_id"  # This is your employee_id
            }

            # Dictionary to store name -> employee_id mappings for consistency across sheets
            employee_id_map = {}
            
            records = []
            skipped_count = 0
            
            for sheet in sheets:
                print(f"\n📄 Processing sheet: {sheet}")
                sheet_upper = sheet.strip().upper()
                
                # Special handling for "SAL POL" sheets, extracting year from B3
                if 'SAL' and 'POL' in sheet_upper:
                    fallback_df = pd.read_excel(xls, sheet_name=sheet, header=None)
                    try:
                        # Extract the month from B2
                        month = str(fallback_df.iloc[1, 1]).strip().upper()  # Month in B2
                        
                        # Extract the year from B3 (for "SAL POL" sheets)
                        year_val = str(fallback_df.iloc[2, 1]).strip()  # Year in B3
                        if not year_val.isdigit():
                            raise Exception(f"Invalid year value: {year_val}")
                        
                        year = int(year_val) if len(year_val) > 2 else int("20" + year_val)
                        print(f"Extracted month/year from B2 and B3: {month} {year}")
                    except Exception as e:
                        print(f"⚠️ Error extracting month/year from B2/B3 for {sheet}: {e}")
                        continue
                    df = pd.read_excel(xls, sheet_name=sheet, header=3)
                else:
                    # Special handling for "POL SAL APRL" and "POL SAL MAY" sheets
                    # if sheet_upper in ["POL SAL APRL", "POL SAL MAY"]:
                    #     fallback_df = pd.read_excel(xls, sheet_name=sheet, header=None)
                    #     try:
                    #         # Extract the year from a specific cell (e.g., B3)
                    #         year_val = str(fallback_df.iloc[2, 1]).strip()  # Adjust the cell index as needed
                    #         if not year_val.isdigit():
                    #             raise Exception(f"Invalid year value: {year_val}")
                    #         year = int(year_val) if len(year_val) > 2 else int("20" + year_val)
                    #         print(f"Extracted year for {sheet}: {year}")
                    #     except Exception as e:
                    #         print(f"⚠️ Error extracting year for {sheet}: {e}")
                    #         continue
                    # Special handling for specific sheets like "AUG SAL"
                    if sheet_upper == "AUG SAL":
                        fallback_df = pd.read_excel(xls, sheet_name=sheet, header=None)
                        try:
                            month = str(fallback_df.iloc[5, 1]).strip().upper()  # Example: from cell B6
                            year_val = str(fallback_df.iloc[5, 2]).strip()
                            if not year_val.isdigit():
                                raise Exception(f"Invalid year value: {year_val}")
                            year = int(year_val) if len(year_val) > 2 else int("20" + year_val)
                        except Exception as e:
                            print(f"⚠️ Error extracting month/year for {sheet}: {e}")
                            continue
                        print(f"{sheet} | Fallback extracted month/year: {month} {year}")
                        df = pd.read_excel(xls, sheet_name=sheet, header=7)  # Data starts from row 8
                    else:
                        month, year = self.extract_month_year(sheet)
                        if not (month and year):
                            # Fallback: try to extract from fixed cells (B2 and C2)
                            fallback_df = pd.read_excel(xls, sheet_name=sheet, header=None)
                            try:
                                month = str(fallback_df.iloc[1, 1]).strip().upper()
                                year_val = str(fallback_df.iloc[1, 2]).strip()
                                if not year_val.isdigit():
                                    raise Exception(f"Invalid year value: {year_val}")
                                year = int(year_val) if len(year_val) > 2 else int("20" + year_val)
                                print(f"Fallback for {sheet}: Extracted month/year from B2/C2: {month} {year}")
                            except Exception as e:
                                print(f"⚠️ Skipping sheet {sheet} due to missing or invalid month/year: {e}")
                                continue
                        df = pd.read_excel(xls, sheet_name=sheet, header=3)

                # Normalize headers: strip spaces, convert to uppercase, replace spaces with underscores
                df.columns = df.columns.str.strip().str.upper()
                print(f"Sheet '{sheet}' columns after normalization: {df.columns.tolist()}")

                # Check if the header appears valid (i.e. not all "UNNAMED")
                if all(col.startswith("UNNAMED") for col in df.columns):
                    print(f"⚠️ Skipping sheet {sheet} because header row is not set correctly.")
                    continue

                # Rename columns based on our mapping
                df = df.rename(columns={col: column_map[col] for col in df.columns if col in column_map})
                # Add the extracted month and year, and compute the date
                df['month'] = month
                df['year'] = year
                computed_date = self.get_last_day(year, month)
                df['date'] = computed_date

                print(f"Sheet {sheet} | Computed date: {df['date'].iloc[0] if not df.empty else 'No Data'}")
                df = df.fillna(0)

                # Ensure required columns exist in the DataFrame
                required_columns = ['name', 'basic_salary', 'year', 'month', 'date']
                missing = [col for col in required_columns if col not in df.columns]
                if missing:
                    print(f"❌ Missing required columns in sheet: {sheet}: {missing}")
                    continue

                # Process each row and build record objects
                for idx, row in df.iterrows():
                    try:
                        name = row.get('name')
                        
                        # Skip rows with invalid/empty names
                        if not self.is_valid_name(name):
                            skipped_count += 1
                            continue
                            
                        # Get department (if available)
                        department = str(row.get("department")).strip() if "department" in row else ""

                        # Try to get employee_id from Excel first
                        emp_id = row.get("employee_id")
                        
                        # If not valid in Excel, check our mapping or create a new one
                        if not emp_id or str(emp_id).strip().lower() in ['', '0', 'nan']:
                            # Use our name-to-ID map for consistency
                            emp_key = name.strip().upper()
                            if emp_key in employee_id_map:
                                emp_id = employee_id_map[emp_key]
                            else:
                                # Generate a consistent ID based on name (and department)
                                emp_id = self.generate_employee_id(name, department)
                                # Store for future use
                                employee_id_map[emp_key] = emp_id
                            
                        # Check if basic salary is valid (greater than zero)
                        basic_salary = self.clean_decimal(row.get("basic_salary"))
                        
                        # Use row's date if valid; otherwise, calculate from year/month
                        rec_date = row['date'] if isinstance(row['date'], date) else self.get_last_day(row['year'], row['month'])
                        record = SalaryData(
                            year=self.clean_int(row['year']),
                            month=str(row['month']).strip(),
                            date=rec_date,
                            name=name,
                            basic_salary=basic_salary,
                            days_present=self.clean_int(row.get("days_present")) if "days_present" in row else 0,
                            days_absent=self.clean_int(row.get("days_absent")) if "days_absent" in row else 0,
                            sl_wo_ot_wo_late=self.clean_decimal(row.get("sl_wo_ot_wo_late")) if "sl_wo_ot_wo_late" in row else Decimal("0.00"),
                            ot_hours=self.clean_decimal(row.get("ot_hours")) if "ot_hours" in row else Decimal("0.00"),
                            basic_salary_per_hour=self.clean_decimal(row.get("basic_salary_per_hour")) if "basic_salary_per_hour" in row else Decimal("0.00"),
                            ot_charges=self.clean_decimal(row.get("ot_charges")) if "ot_charges" in row else Decimal("0.00"),
                            late_minutes=self.clean_decimal(row.get("late_minutes")) if "late_minutes" in row else Decimal("0.00"),
                            basic_salary_per_minute=self.clean_decimal(row.get("basic_salary_per_minute")) if "basic_salary_per_minute" in row else Decimal("0.00"),
                            incentive=self.clean_decimal(row.get("incentive")) if "incentive" in row else Decimal("0.00"),
                            late_charges=self.clean_decimal(row.get("late_charges")) if "late_charges" in row else Decimal("0.00"),
                            salary_wo_advance_deduction=self.clean_decimal(row.get("salary_wo_advance_deduction")) if "salary_wo_advance_deduction" in row else Decimal("0.00"),
                            adv_paid_on_25th=self.clean_decimal(row.get("adv_paid_on_25th")) if "adv_paid_on_25th" in row else Decimal("0.00"),
                            repayment_of_old_adv=self.clean_decimal(row.get("repayment_of_old_adv")) if "repayment_of_old_adv" in row else Decimal("0.00"),
                            net_payable=self.clean_decimal(row.get("net_payable")),
                            total_old_advance=self.clean_decimal(row.get("total_old_advance")) if "total_old_advance" in row else Decimal("0.00"),
                            final_balance_advance=self.clean_decimal(row.get("final_balance_advance")),
                            tds=self.clean_decimal(row.get("tds")) if "tds" in row else Decimal("0.00"),
                            sal_before_tds=self.clean_decimal(row.get("sal_before_tds")) if "sal_before_tds" in row else Decimal("0.00"),
                            advance=self.clean_decimal(row.get("advance")) if "advance" in row else Decimal("0.00"),
                            department=department,
                            employee_id=emp_id,
                        )
                        records.append(record)
                    except Exception as e:
                        print(f"⚠️ Skipped row in sheet {sheet} at index {idx} due to error: {e}")
                        skipped_count += 1

            print(f"Total records ready to save: {len(records)}")
            print(f"Total records skipped: {skipped_count}")
            
            # Only create records if there are valid ones
            if records:
                SalaryData.objects.bulk_create(records, ignore_conflicts=True)
                return Response({
                    "message": f"{len(records)} records uploaded. {skipped_count} invalid records skipped."
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    "message": "No valid records found to upload.",
                    "skipped": skipped_count
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Add new API views for fetching salary data
class SalaryDataViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows salary data to be viewed and filtered.
    """
    queryset = SalaryData.objects.all().order_by('-date')
    serializer_class = SalaryDataSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'employee_id', 'department']
    ordering_fields = ['year', 'month', 'date', 'name', 'basic_salary', 'net_payable']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return SalaryDataSerializer
        return SalaryDataSerializer
    
    @action(detail=False, methods=['get'])
    def by_employee(self, request):
        """
        Get all salary records for a specific employee
        """
        employee_id = request.query_params.get('employee_id')
        name = request.query_params.get('name')
        
        if not (employee_id or name):
            return Response(
                {"error": "Either employee_id or name parameter is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        queryset = self.queryset
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        elif name:
            queryset = queryset.filter(name__icontains=name)
            
        serializer = SalaryDataSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_period(self, request):
        """
        Get salary records for a specific year and/or month
        """
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        
        queryset = self.queryset
        
        if year:
            queryset = queryset.filter(year=year)
        if month:
            queryset = queryset.filter(month__icontains=month)
            
        serializer = SalaryDataSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """
        Search salary records by query
        """
        query = request.query_params.get('q', '')
        if not query:
            return Response(self.get_serializer(self.queryset[:20], many=True).data)
            
        queryset = self.queryset.filter(
            Q(name__icontains=query) | 
            Q(employee_id__icontains=query) |
            Q(department__icontains=query)
        )
        
        serializer = SalaryDataSerializer(queryset, many=True)
        return Response(serializer.data)

class EmployeeProfileViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing employee profiles.
    """
    queryset = EmployeeProfile.objects.all().order_by('-created_at')
    serializer_class = EmployeeProfileSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['first_name', 'last_name', 'employee_id', 'mobile_number', 'email', 'department', 'designation']
    ordering_fields = ['first_name', 'last_name', 'created_at', 'department', 'date_of_joining']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return EmployeeProfileListSerializer
        elif self.action == 'table_view':
            return EmployeeTableSerializer
        elif self.action == 'get_directory_data':
            return EmployeeTableSerializer
        return EmployeeProfileSerializer

    def create(self, request, *args, **kwargs):
        """
        Create a new employee profile.
        """
        # Handle personal information and professional information
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            # Save the employee profile
            employee = serializer.save()
            
            return Response({
                'message': 'Employee profile created successfully',
                'employee_id': employee.employee_id,
                'id': employee.id
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """
        Search for employees by name, department, designation, etc.
        """
        query = request.query_params.get('q', '')
        if not query:
            return Response(EmployeeProfileListSerializer(self.queryset[:20], many=True).data)
            
        queryset = self.queryset.filter(
            Q(first_name__icontains=query) | 
            Q(last_name__icontains=query) |
            Q(employee_id__icontains=query) |
            Q(department__icontains=query) |
            Q(designation__icontains=query) |
            Q(mobile_number__icontains=query) |
            Q(email__icontains=query)
        )
        
        serializer = EmployeeProfileListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def create_employee(self, request):
        """
        Create a new employee with both personal and professional information.
        """
        # This is an alternative to the create method if you need to handle
        # personal and professional information separately in your frontend
        personal_info = request.data.get('personal_info', {})
        professional_info = request.data.get('professional_info', {})
        
        # Combine the data
        combined_data = {**personal_info, **professional_info}
        
        # Handle off days (checkboxes)
        off_days = professional_info.get('off_days', [])
        if isinstance(off_days, list):
            for day in ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']:
                combined_data[f'off_{day}'] = day.upper() in map(str.upper, off_days)
        
        serializer = EmployeeProfileSerializer(data=combined_data)
        
        if serializer.is_valid():
            employee = serializer.save()
            return Response({
                'message': 'Employee profile created successfully',
                'employee_id': employee.employee_id,
                'id': employee.id
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def table_view(self, request):
        """
        Get employee data formatted for the All Employees table view.
        Includes attendance percentage and OT hours calculations.
        """
        # Get query parameters for filtering
        department = request.query_params.get('department')
        search = request.query_params.get('search')
        
        # Start with all employees
        queryset = self.queryset
        
        # Apply department filter if provided
        if department:
            queryset = queryset.filter(department=department)
            
        # Apply search filter if provided
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(employee_id__icontains=search) |
                Q(department__icontains=search) |
                Q(designation__icontains=search)
            )
        
        # Get page size from query params or use default
        page_size = int(request.query_params.get('page_size', 10))
        
        # Use pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = EmployeeTableSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = EmployeeTableSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def get_directory_data(self, request):
        """
        Get employee data for directory view with only required fields.
        """
        try:
            # Get query parameters for filtering
            department = request.query_params.get('department')
            search = request.query_params.get('search')
            employee_id = request.query_params.get('id')  # New parameter for employee_id
            
            # Start with all active employees
            queryset = self.queryset.filter(is_active=True)
            
            # Filter by employee_id if provided
            if employee_id:
                queryset = queryset.filter(employee_id=employee_id)
            
            # Apply department filter if provided
            if department:
                queryset = queryset.filter(department=department)
                
            # Apply search filter if provided
            if search:
                queryset = queryset.filter(
                    Q(first_name__icontains=search) |
                    Q(last_name__icontains=search) |
                    Q(employee_id__icontains=search) |
                    Q(department__icontains=search) |
                    Q(designation__icontains=search)
                )

            # Prepare response data with only required fields
            response_data = []
            
            for employee in queryset:
                employee_data = {
                    'employee_id': employee.employee_id,
                    'name': f"{employee.first_name} {employee.last_name}",
                    'first_name': employee.first_name,
                    'last_name': employee.last_name,
                    'mobile_number': employee.mobile_number or '-',
                    'email': employee.email or '-',
                    'date_of_birth': employee.date_of_birth,
                    'marital_status': employee.marital_status,
                    'gender': employee.gender,
                    'nationality': employee.nationality,
                    'address': employee.address,
                    'city': employee.city,
                    'state': employee.state,
                    'department': employee.department or 'N/A',
                    'designation': employee.designation or '-',
                    'employment_type': employee.get_employment_type_display() if employee.employment_type else '-',
                    'date_of_joining': employee.date_of_joining,
                    'branch_location': employee.location_branch or '-',
                    'shift_start_time': employee.shift_start_time.strftime('%I:%M %p') if employee.shift_start_time else '-',
                    'shift_end_time': employee.shift_end_time.strftime('%I:%M %p') if employee.shift_end_time else '-',
                    'basic_salary': str(employee.basic_salary) if employee.basic_salary else '-',
                    'ot_charge_per_hour': str(employee.ot_charge_per_hour) if employee.ot_charge_per_hour else '-',
                    'tds_percentage': str(employee.tds_percentage) if employee.tds_percentage else '-',
                    'off_monday': employee.off_monday,
                    'off_tuesday': employee.off_tuesday,
                    'off_wednesday': employee.off_wednesday,
                    'off_thursday': employee.off_thursday,
                    'off_friday': employee.off_friday,
                    'off_saturday': employee.off_saturday,
                    'off_sunday': employee.off_sunday,
                    'created_at': employee.created_at,
                    'updated_at': employee.updated_at,
                    'is_active': employee.is_active,
                }
                response_data.append(employee_data)

            # If filtering by employee_id, return single object instead of array
            if employee_id and response_data:
                return Response(response_data[0])
                
            return Response(response_data)
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['patch'])
    def update_by_employee_id(self, request):
        """
        Custom PATCH endpoint to update an employee profile by employee_id.
        Usage: PATCH /api/excel/employees/update_by_employee_id/?employee_id=xxxx
        Body: { ...fields to update... }
        """
        employee_id = request.query_params.get('employee_id')
        if not employee_id:
            return Response({'error': 'employee_id query parameter is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            employee = EmployeeProfile.objects.get(employee_id=employee_id)
        except EmployeeProfile.DoesNotExist:
            return Response({'error': 'Employee not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = EmployeeProfileSerializer(employee, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['delete'])
    def delete_by_employee_id(self, request):
        """
        Custom DELETE endpoint to delete an employee profile by employee_id.
        Usage: DELETE /api/excel/employees/delete_by_employee_id/?employee_id=xxxx
        """
        employee_id = request.query_params.get('employee_id')
        if not employee_id:
            return Response({'error': 'employee_id query parameter is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            employee = EmployeeProfile.objects.get(employee_id=employee_id)
            employee.delete()
            return Response({'message': f'Employee {employee_id} deleted successfully.'}, status=status.HTTP_200_OK)
        except EmployeeProfile.DoesNotExist:
            return Response({'error': 'Employee not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def cleanup_salary_data(request):
    """
    Clean up existing salary data by removing entries with invalid names
    """
    try:
        # Find all records with invalid names
        invalid_records = []
        for record in SalaryData.objects.all():
            name = record.name
            
            # Check if name is invalid
            if not name or name.strip() in ['', '-', '0', 'nan', 'NaN', 'None', 'none']:
                invalid_records.append(record.id)
                continue
                
            # Check if name is only special characters
            if all(c in '- _.,' for c in name.strip()):
                invalid_records.append(record.id)
        
        # Delete the invalid records
        deleted_count = 0
        if invalid_records:
            result = SalaryData.objects.filter(id__in=invalid_records).delete()
            deleted_count = result[0]
            
        return Response({
            "message": f"Cleanup completed. {deleted_count} invalid records removed.",
            "deleted_count": deleted_count
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CreateEmployeeFormView(APIView):
    """
    API view to handle employee form submissions from the frontend.
    This view is specifically designed to handle the data from the two-tab form
    (Personal Information and Professional Information).
    """
    
    def post(self, request, *args, **kwargs):
        """
        Handle POST requests to create a new employee.
        
        The request data should be in this format:
        {
            "personal_info": {
                "first_name": "John",
                "last_name": "Doe",
                // other personal fields
            },
            "professional_info": {
                "department": "Engineering",
                "designation": "Software Developer",
                // other professional fields
                "off_days": ["MONDAY", "SUNDAY"]  // List of off days
            }
        }
        """
        try:
            # Extract personal and professional information
            personal_info = request.data.get('personal_info', {})
            professional_info = request.data.get('professional_info', {})
            
            # Combine the data
            combined_data = {**personal_info, **professional_info}
            
            # Extract off days from professional info
            off_days = professional_info.get('off_days', [])
            if off_days:
                combined_data['off_days'] = off_days
            
            # Create serializer with combined data
            serializer = EmployeeFormSerializer(data=combined_data)
            
            if serializer.is_valid():
                # Save the employee profile
                employee = serializer.save()
                
                return Response({
                    'success': True,
                    'message': 'Employee profile created successfully',
                    'employee_id': employee.employee_id,
                    'id': employee.id
                }, status=status.HTTP_201_CREATED)
            
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error creating employee profile: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AttendanceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing employee attendance records.
    Provides CRUD operations and additional functionality for attendance data.
    """
    queryset = Attendance.objects.all().order_by('-date', 'name')
    serializer_class = AttendanceSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['employee_id', 'name']
    ordering_fields = ['date', 'name', 'present_days', 'absent_days', 'ot_hours', 'late_minutes']

    @action(detail=False, methods=['get'])
    def by_employee(self, request):
        """
        Get attendance records for a specific employee
        """
        employee_id = request.query_params.get('employee_id')
        if not employee_id:
            return Response(
                {"error": "employee_id parameter is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        queryset = self.queryset.filter(employee_id=employee_id)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_date_range(self, request):
        """
        Get attendance records within a date range
        """
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        if not (start_date and end_date):
            return Response(
                {"error": "Both start_date and end_date parameters are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        queryset = self.queryset.filter(date__range=[start_date, end_date])
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def get_attendance_data(self, request):
        """
        Get formatted attendance data with filtering and search capabilities
        """
        try:
            # Get query parameters
            department = request.query_params.get('department')
            search = request.query_params.get('search')
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            
            # Start with all records
            queryset = self.queryset
            
            # Apply filters
            if department:
                queryset = queryset.filter(department=department)
            
            if search:
                queryset = queryset.filter(
                    Q(name__icontains=search) |
                    Q(employee_id__icontains=search) |
                    Q(department__icontains=search)
                )
                
            if start_date and end_date:
                queryset = queryset.filter(date__range=[start_date, end_date])
            
            # Get page size from query params or use default
            page_size = int(request.query_params.get('page_size', 10))
            
            # Use pagination
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response({
                    'results': [{
                        'id': record['id'],
                        'employee_id': record['employee_id'],
                        'name': record['name'],
                        'department': record['department'] or 'N/A',
                        'date': record['date'],
                        'calendar_days': record['calendar_days'],
                        'total_working_days': record['total_working_days'],
                        'present_days': record['present_days'],
                        'absent_days': record['absent_days'],
                        'attendance_percentage': round((record['present_days'] / record['total_working_days']) * 100, 1) if record['total_working_days'] > 0 else 0,
                        'ot_hours': f"{float(record['ot_hours']):.2f}",
                        'late_minutes': record['late_minutes']
                    } for record in serializer.data]
                })
            
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """
        Create multiple attendance records at once
        """
        serializer = self.get_serializer(data=request.data, many=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def migrate_employees_from_salary_data(request):
    """
    Migrate unique employees from SalaryData to EmployeeProfile.
    Only migrates Employee ID, Name, Department, and Basic Salary.
    """
    try:
        # Get unique employees from SalaryData based on employee_id
        unique_employees = {}
        
        # Get all salary records
        salary_records = SalaryData.objects.all()
        
        for record in salary_records:
            emp_id = record.employee_id
            if not emp_id:  # Skip if no employee_id
                continue
                
            # If this is a new employee or has a more recent record
            if emp_id not in unique_employees or record.date > unique_employees[emp_id]['date']:
                # Split name into first_name and last_name
                full_name = record.name.strip() if record.name else ""
                name_parts = full_name.split(maxsplit=1)
                first_name = name_parts[0] if name_parts else ""
                last_name = name_parts[1] if len(name_parts) > 1 else ""
                
                unique_employees[emp_id] = {
                    'employee_id': emp_id,
                    'first_name': first_name,
                    'last_name': last_name,
                    'department': record.department,
                    'basic_salary': record.basic_salary,
                    'date': record.date  # Keep track of date to get most recent record
                }
        
        # Create or update EmployeeProfile records
        created_count = 0
        updated_count = 0
        skipped_count = 0
        
        for emp_data in unique_employees.values():
            try:
                # Remove the date field as it's not needed for EmployeeProfile
                emp_data.pop('date')
                
                # Try to find existing employee or create new one
                employee, created = EmployeeProfile.objects.update_or_create(
                    employee_id=emp_data['employee_id'],
                    defaults={
                        'first_name': emp_data['first_name'],
                        'last_name': emp_data['last_name'],
                        'department': emp_data['department'],
                        'basic_salary': emp_data['basic_salary'] or 0
                    }
                )
                
                if created:
                    created_count += 1
                else:
                    updated_count += 1
                    
            except Exception as e:
                print(f"Error processing employee {emp_data['employee_id']}: {e}")
                skipped_count += 1
        
        return Response({
            "message": f"Migration completed. {created_count} employees created, {updated_count} updated, {skipped_count} skipped.",
            "created": created_count,
            "updated": updated_count,
            "skipped": skipped_count,
            "total_unique_employees": len(unique_employees)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def migrate_attendance_from_salary_data(request):
    """
    Migrate attendance data from SalaryData to Attendance model.
    This includes: employee_id, name, department, date, present_days, absent_days, ot_hours, late_minutes
    Calendar Days and Total Working Days will be set to default values.
    """
    try:
        # Get all salary records
        salary_records = SalaryData.objects.all()
        
        # Track statistics
        created_count = 0
        updated_count = 0
        skipped_count = 0
        
        for record in salary_records:
            try:
                if not record.employee_id or not record.name or not record.date:
                    skipped_count += 1
                    continue

                # Default values for calendar days and working days
                # Assuming a standard month with weekends off
                calendar_days = 30  # Standard month length
                total_working_days = 22  # Typical working days in a month (excluding weekends)

                # Create or update attendance record
                attendance, created = Attendance.objects.update_or_create(
                    employee_id=record.employee_id,
                    date=record.date,  # This combination should be unique
                    defaults={
                        'name': record.name,
                        'department': record.department or '',
                        'calendar_days': calendar_days,
                        'total_working_days': total_working_days,
                        'present_days': int(record.days_present or 0),
                        'absent_days': int(record.days_absent or 0),
                        'ot_hours': float(record.ot_hours or 0),
                        'late_minutes': int(record.late_minutes or 0)
                    }
                )
                
                if created:
                    created_count += 1
                else:
                    updated_count += 1
                    
            except Exception as e:
                print(f"Error processing record for {record.name} on {record.date}: {e}")
                skipped_count += 1
                continue
        
        return Response({
            "message": f"Attendance migration completed. {created_count} records created, {updated_count} updated, {skipped_count} skipped.",
            "created": created_count,
            "updated": updated_count,
            "skipped": skipped_count,
            "total_processed": len(salary_records)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class DailyAttendanceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing daily attendance records.
    """
    queryset = DailyAttendance.objects.all().order_by('-date', 'employee_name')
    serializer_class = DailyAttendanceSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['employee_id', 'employee_name', 'department']
    ordering_fields = ['date', 'employee_name', 'check_in', 'check_out']

    def get_queryset(self):
        queryset = super().get_queryset()
        employee_id = self.request.query_params.get('employee_id')
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        return queryset

    def create(self, request, *args, **kwargs):
        """
        Create a daily attendance record.
        First fetches employee details from EmployeeProfile.
        Accepts a 'date' field in the request to associate check-in/check-out with that date.
        """
        try:
            # Get employee details from EmployeeProfile
            employee_id = request.data.get('employee_id')
            try:
                employee = EmployeeProfile.objects.get(employee_id=employee_id)
            except EmployeeProfile.DoesNotExist:
                return Response(
                    {'error': 'Employee not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Parse date from request, default to today if not provided
            from datetime import datetime
            date_str = request.data.get('date')
            if date_str:
                try:
                    # Accept both 'YYYY-MM-DD' and date objects
                    if isinstance(date_str, str):
                        attendance_date = datetime.strptime(date_str, '%Y-%m-%d').date()
                    else:
                        attendance_date = date_str
                except Exception:
                    return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)
            else:
                attendance_date = timezone.now().date()

            # Fetch designation and employment_type from profile, defaulting if missing
            designation = employee.designation if employee.designation else '-'
            employment_type = employee.employment_type if employee.employment_type else 'N/A'

            # Prepare attendance data (do NOT take designation or employment_type from request)
            attendance_data = {
                'employee_id': employee_id,
                'employee_name': f"{employee.first_name} {employee.last_name}",
                'department': employee.department,
                'designation': designation,
                'employment_type': employment_type,
                'attendance_status': request.data.get('attendance_status'),
                'date': attendance_date,
                'check_in': request.data.get('check_in'),
                'check_out': request.data.get('check_out')
            }

            serializer = self.get_serializer(data=attendance_data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)

            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def by_employee(self, request):
        """
        Get attendance records for a specific employee
        """
        employee_id = request.query_params.get('employee_id')
        if not employee_id:
            return Response(
                {"error": "employee_id parameter is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        queryset = self.queryset.filter(employee_id=employee_id)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_date(self, request):
        """
        Get attendance records for a specific date
        """
        date = request.query_params.get('date')
        if not date:
            return Response(
                {"error": "date parameter is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        queryset = self.queryset.filter(date=date)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

@api_view(['POST'])
def migrate_employees_to_daily_attendance(request):
    """
    Migrate unique employees from SalaryData to DailyAttendance.
    This includes: employee_id, name, department.
    """
    try:
        # Get unique employees from SalaryData based on employee_id
        unique_employees = {}
        
        # Get all salary records
        salary_records = SalaryData.objects.all()
        
        for record in salary_records:
            emp_id = record.employee_id
            if not emp_id:  # Skip if no employee_id
                continue
                
            # If this is a new employee or has a more recent record
            if emp_id not in unique_employees or record.date > unique_employees[emp_id]['date']:
                unique_employees[emp_id] = {
                    'employee_id': emp_id,
                    'employee_name': record.name,
                    'department': record.department or 'N/A',
                    'date': record.date  # Keep track of date to get most recent record
                }
        
        # Create or update DailyAttendance records
        created_count = 0
        updated_count = 0
        skipped_count = 0
        
        for emp_data in unique_employees.values():
            try:
                # Remove the date field as it's not needed for DailyAttendance
                record_date = emp_data.pop('date')
                
                # Create a default attendance record
                daily_attendance, created = DailyAttendance.objects.update_or_create(
                    employee_id=emp_data['employee_id'],
                    date=record_date,
                    defaults={
                        'attendance_status': 'ABSENT',  # Default status
                        'designation': 'N/A',  # Add a default value
                        'employment_type': 'FULL_TIME',  # Add a default value
                        **emp_data
                    }
                )
                
                if created:
                    created_count += 1
                else:
                    updated_count += 1
                    
            except Exception as e:
                print(f"Error processing employee {emp_data['employee_id']}: {e}")
                skipped_count += 1
        
        return Response({
            "message": f"Migration to Daily Attendance completed. {created_count} records created, {updated_count} updated, {skipped_count} skipped.",
            "created": created_count,
            "updated": updated_count,
            "skipped": skipped_count,
            "total_unique_employees": len(unique_employees)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AdvanceLedgerViewSet(viewsets.ModelViewSet):
    queryset = AdvanceLedger.objects.all().order_by('-advance_date', '-created_at')
    serializer_class = AdvanceLedgerSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['employee_id', 'employee_name', 'remarks', 'for_month']
    ordering_fields = ['advance_date', 'amount', 'for_month', 'status', 'payment_method']

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all().order_by('-payment_date', '-created_at')
    serializer_class = PaymentSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['employee_id', 'employee_name', 'pay_period']
    ordering_fields = ['payment_date', 'net_payable', 'advance_deduction', 'amount_paid', 'pay_period', 'payment_method']
