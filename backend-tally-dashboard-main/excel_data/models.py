from django.db import models
from django.utils import timezone
from datetime import datetime, date, time

# Create your models here.
class SalaryData(models.Model):
    year = models.IntegerField(null=True, blank=True)
    month = models.CharField(max_length=20, null=True, blank=True)
    date = models.DateField(null=True, blank=True)
    
    name = models.CharField(max_length=100, null=True, blank=True)
    employee_id = models.CharField(max_length=50, null=True, blank=True)
    department = models.CharField(max_length=100, null=True, blank=True)

    basic_salary = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    days_present = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    days_absent = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    sl_wo_ot_wo_late = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    ot_hours = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    basic_salary_per_hour = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    ot_charges = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    late_minutes = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    basic_salary_per_minute = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    incentive = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    late_charges = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    salary_wo_advance_deduction = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    adv_paid_on_25th = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    repayment_of_old_adv = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    net_payable = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    total_old_advance = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    final_balance_advance = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    tds = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    sal_before_tds = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    advance = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    total_advance = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.name} - {self.month} {self.year}"


class EmployeeProfile(models.Model):
    # Personal Information
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    mobile_number = models.CharField(max_length=20)
    email = models.EmailField(max_length=100, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    
    MARITAL_STATUS_CHOICES = [
        ('SINGLE', 'Single'),
        ('MARRIED', 'Married'),
        ('DIVORCED', 'Divorced'),
        ('WIDOWED', 'Widowed'),
    ]
    marital_status = models.CharField(max_length=20, choices=MARITAL_STATUS_CHOICES, blank=True, null=True)
    
    GENDER_CHOICES = [
        ('MALE', 'Male'),
        ('FEMALE', 'Female'),
        ('OTHER', 'Other'),
    ]
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True, null=True)
    
    nationality = models.CharField(max_length=50, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=50, blank=True, null=True)
    state = models.CharField(max_length=50, blank=True, null=True)
    
    # Professional Information
    # We already have first_name and last_name, together they form employee_name
    department = models.CharField(max_length=100, blank=True, null=True)
    designation = models.CharField(max_length=100, blank=True, null=True)
    
    EMPLOYMENT_TYPE_CHOICES = [
        ('FULL_TIME', 'Full Time'),
        ('PART_TIME', 'Part Time'),
        ('CONTRACT', 'Contract'),
        ('INTERN', 'Intern'),
    ]
    employment_type = models.CharField(max_length=20, choices=EMPLOYMENT_TYPE_CHOICES, blank=True, null=True)
    
    date_of_joining = models.DateField(blank=True, null=True)
    location_branch = models.CharField(max_length=100, blank=True, null=True)
    shift_start_time = models.TimeField(blank=True, null=True)
    shift_end_time = models.TimeField(blank=True, null=True)
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    tds_percentage = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    
    # Off Days
    off_monday = models.BooleanField(default=False)
    off_tuesday = models.BooleanField(default=False)
    off_wednesday = models.BooleanField(default=False)
    off_thursday = models.BooleanField(default=False)
    off_friday = models.BooleanField(default=False)
    off_saturday = models.BooleanField(default=False)
    off_sunday = models.BooleanField(default=True)  # Sunday is commonly off
    
    # System fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    employee_id = models.CharField(max_length=50, unique=True, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    
    ot_charge_per_hour = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    
    def save(self, *args, **kwargs):
        # Generate employee_id if not provided
        if not self.employee_id:
            import uuid
            import hashlib
            
            # Create a consistent hash from name and date of birth
            key = f"{self.first_name.upper()}{self.last_name.upper()}{self.mobile_number}".encode('utf-8')
            self.employee_id = hashlib.md5(key).hexdigest()[:8]
            
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.employee_id})"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

class Attendance(models.Model):
    """
    Model to track employee attendance details including working days, absences, OT, and late minutes.
    """
    employee_id = models.CharField(max_length=50, db_index=True)
    name = models.CharField(max_length=255)
    department = models.CharField(max_length=100, blank=True, null=True)
    date = models.DateField(default=timezone.now)
    calendar_days = models.IntegerField(default=0, help_text="Total calendar days in the month")
    total_working_days = models.IntegerField(default=0, help_text="Total working days excluding holidays and weekends")
    present_days = models.IntegerField(default=0)
    absent_days = models.IntegerField(default=0)
    ot_hours = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    late_minutes = models.IntegerField(default=0)
    
    # Metadata fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date', 'name']
        # Ensure we don't have duplicate entries for the same employee on the same date
        unique_together = ['employee_id', 'date']
        
    def __str__(self):
        return f"{self.name} - {self.date}"
        
    def save(self, *args, **kwargs):
        # Ensure absent_days is calculated correctly
        self.absent_days = self.total_working_days - self.present_days
        super().save(*args, **kwargs)

class DailyAttendance(models.Model):
    """
    Model to track daily attendance of employees including check-in/out times and status
    """
    ATTENDANCE_STATUS_CHOICES = [
        ('PRESENT', 'Present'),
        ('ABSENT', 'Absent'),
        ('HALF_DAY', 'Half Day'),
    ]

    TIME_STATUS_CHOICES = [
        ('ON_TIME', 'On Time'),
        ('LATE', 'Late'),
    ]

    employee_id = models.CharField(max_length=50, db_index=True)
    employee_name = models.CharField(max_length=255)
    department = models.CharField(max_length=100)
    designation = models.CharField(max_length=100)
    employment_type = models.CharField(max_length=50)
    attendance_status = models.CharField(max_length=10, choices=ATTENDANCE_STATUS_CHOICES)
    date = models.DateField(default=timezone.now)
    check_in = models.TimeField(null=True, blank=True)
    check_out = models.TimeField(null=True, blank=True)
    working_hours = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    time_status = models.CharField(max_length=10, choices=TIME_STATUS_CHOICES, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', 'employee_name']
        unique_together = ['employee_id', 'date']

    def save(self, *args, **kwargs):
        # Calculate working hours if both check_in and check_out are present
        if self.check_in and self.check_out:
            check_in_dt = datetime.combine(date.today(), self.check_in)
            check_out_dt = datetime.combine(date.today(), self.check_out)
            duration = check_out_dt - check_in_dt
            self.working_hours = round(duration.total_seconds() / 3600, 2)  # Convert to hours

            # Determine if employee is late (assuming 9:30 AM is the cutoff)
            cutoff_time = time(9, 30)  # 9:30 AM
            self.time_status = 'LATE' if self.check_in > cutoff_time else 'ON_TIME'

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.employee_name} - {self.date}"

class AdvanceLedger(models.Model):
    PAYMENT_METHOD_CHOICES = [
        ('CASH', 'Cash'),
        ('BANK_TRANSFER', 'Bank Transfer'),
        ('CHEQUE', 'Cheque'),
    ]
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('REPAID', 'Repaid'),
    ]

    employee_id = models.CharField(max_length=50)
    employee_name = models.CharField(max_length=255)
    advance_date = models.DateField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    for_month = models.CharField(max_length=20)  # e.g., 'Mar 2025'
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.employee_id} - {self.employee_name} - {self.advance_date}"

class Payment(models.Model):
    PAYMENT_METHOD_CHOICES = [
        ('CASH', 'Cash'),
        ('BANK_TRANSFER', 'Bank Transfer'),
        ('CHEQUE', 'Cheque'),
    ]

    employee_id = models.CharField(max_length=50)
    employee_name = models.CharField(max_length=255)
    payment_date = models.DateField()
    net_payable = models.DecimalField(max_digits=12, decimal_places=2)
    advance_deduction = models.DecimalField(max_digits=12, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2)
    pay_period = models.CharField(max_length=20)  # e.g., 'Mar 2025'
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.employee_id} - {self.employee_name} - {self.payment_date}"
