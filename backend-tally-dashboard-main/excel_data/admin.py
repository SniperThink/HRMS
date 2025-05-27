from django.contrib import admin
from .models import SalaryData, EmployeeProfile, Attendance, DailyAttendance, AdvanceLedger, Payment

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = [
        'employee_id', 
        'name',
        'department', 
        'date', 
        'calendar_days',
        'total_working_days', 
        'present_days', 
        'absent_days',
        'ot_hours',
        'late_minutes'
    ]
    list_filter = ['date', 'employee_id', 'department']
    search_fields = ['employee_id', 'name', 'department']
    ordering = ['-date', 'name']
    
    def get_readonly_fields(self, request, obj=None):
        # Make certain fields read-only as they are calculated
        return ['absent_days', 'created_at', 'updated_at']

@admin.register(SalaryData)
class SalaryDataAdmin(admin.ModelAdmin):
    list_display = [field.name for field in SalaryData._meta.fields] + ['total_advance'] if 'total_advance' not in [field.name for field in SalaryData._meta.fields] else [field.name for field in SalaryData._meta.fields]
    list_filter = ('year', 'month')

@admin.register(EmployeeProfile)
class EmployeeProfileAdmin(admin.ModelAdmin):
    list_display = ('employee_id', 'first_name', 'last_name', 'department', 'designation', 
                    'mobile_number', 'email', 'is_active')
    list_filter = ('department', 'is_active', 'employment_type', 'date_of_joining')
    search_fields = ('first_name', 'last_name', 'employee_id', 'mobile_number', 'email', 'department')
    readonly_fields = ('employee_id', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Personal Information', {
            'fields': ('first_name', 'last_name', 'mobile_number', 'email', 'date_of_birth',
                      'marital_status', 'gender', 'nationality', 'address', 'city', 'state')
        }),
        ('Professional Information', {
            'fields': ('department', 'designation', 'employment_type', 'date_of_joining',
                      'location_branch', 'shift_start_time', 'shift_end_time', 
                      'basic_salary', 'tds_percentage')
        }),
        ('Off Days', {
            'fields': ('off_monday', 'off_tuesday', 'off_wednesday', 'off_thursday',
                      'off_friday', 'off_saturday', 'off_sunday')
        }),
        ('System Information', {
            'fields': ('employee_id', 'is_active', 'created_at', 'updated_at')
        }),
    )

@admin.register(DailyAttendance)
class DailyAttendanceAdmin(admin.ModelAdmin):
    list_display = [
        'date',
        'employee_id',
        'employee_name',
        'department',
        'designation',
        'employment_type',
        'attendance_status',
        'check_in',
        'check_out',
        'working_hours',
        'time_status'
    ]
    list_filter = [
        'date',
        'department',
        'attendance_status',
        'time_status',
        'employment_type'
    ]
    search_fields = [
        'employee_id',
        'employee_name',
        'department',
        'designation'
    ]
    ordering = ['-date', 'employee_name']
    readonly_fields = ['working_hours', 'time_status', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Employee Information', {
            'fields': (
                'employee_id',
                'employee_name',
                'department',
                'designation',
                'employment_type'
            )
        }),
        ('Attendance Details', {
            'fields': (
                'date',
                'attendance_status',
                'check_in',
                'check_out',
                'working_hours',
                'time_status'
            )
        }),
        ('System Information', {
            'fields': (
                'created_at',
                'updated_at'
            ),
            'classes': ('collapse',)
        })
    )

@admin.register(AdvanceLedger)
class AdvanceLedgerAdmin(admin.ModelAdmin):
    list_display = ('employee_id', 'employee_name', 'advance_date', 'amount', 'for_month', 'payment_method', 'status', 'remarks')
    list_filter = ('payment_method', 'status', 'for_month', 'advance_date')
    search_fields = ('employee_id', 'employee_name', 'remarks', 'for_month')
    ordering = ('-advance_date', '-created_at')

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('employee_id', 'employee_name', 'payment_date', 'net_payable', 'advance_deduction', 'amount_paid', 'pay_period', 'payment_method')
    list_filter = ('payment_method', 'pay_period', 'payment_date')
    search_fields = ('employee_id', 'employee_name', 'pay_period')
    ordering = ('-payment_date', '-created_at')

