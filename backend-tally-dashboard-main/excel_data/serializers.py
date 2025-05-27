from rest_framework import serializers
from .models import SalaryData, EmployeeProfile, Attendance, DailyAttendance, AdvanceLedger, Payment
from django.db.models import Avg, Sum
from django.utils import timezone

class SalaryDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalaryData
        fields = '__all__'

class SalaryDataSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = SalaryData
        fields = ['id', 'year', 'month', 'date', 'name', 'employee_id', 'department', 
                  'basic_salary', 'days_present', 'days_absent', 'net_payable']

class EmployeeProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and updating employee profiles.
    """
    class Meta:
        model = EmployeeProfile
        fields = '__all__'
        read_only_fields = ['employee_id', 'created_at', 'updated_at']
        
class EmployeeProfileListSerializer(serializers.ModelSerializer):
    """
    Serializer for listing employee profiles with essential information.
    """
    class Meta:
        model = EmployeeProfile
        fields = ['id', 'employee_id', 'first_name', 'last_name', 'department', 
                  'designation', 'mobile_number', 'email', 'is_active']
        
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['full_name'] = f"{instance.first_name} {instance.last_name}"
        return representation 

class EmployeeFormSerializer(serializers.ModelSerializer):
    """
    Serializer specifically designed for the employee form submission with separate 
    personal and professional information tabs.
    """
    # Custom field for handling off days checkboxes from the form
    off_days = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        write_only=True
    )
    
    class Meta:
        model = EmployeeProfile
        fields = [
            # Personal Info
            'first_name', 'last_name', 'mobile_number', 'email', 'date_of_birth',
            'marital_status', 'gender', 'nationality', 'address', 'city', 'state',
            
            # Professional Info
            'department', 'designation', 'employment_type', 'date_of_joining',
            'location_branch', 'shift_start_time', 'shift_end_time', 
            'basic_salary', 'tds_percentage', 
            
            # Custom field for checkboxes
            'off_days',
            
            # Individual off day fields
            'off_monday', 'off_tuesday', 'off_wednesday', 'off_thursday',
            'off_friday', 'off_saturday', 'off_sunday',
            
            # Read-only fields
            'employee_id', 'created_at', 'updated_at'
        ]
        read_only_fields = ['employee_id', 'created_at', 'updated_at']
    
    def validate(self, data):
        """
        Custom validation to ensure required fields are present
        """
        required_fields = [
            'first_name', 'last_name', 'mobile_number', 
            'department', 'designation'
        ]
        
        errors = {}
        for field in required_fields:
            if field not in data or not data.get(field):
                errors[field] = ["This field is required."]
        
        if errors:
            raise serializers.ValidationError(errors)
            
        return data
    
    def create(self, validated_data):
        """
        Override create method to handle off_days conversion
        """
        # Extract off_days from validated data (if present)
        off_days = validated_data.pop('off_days', [])
        
        # Set individual off day fields based on the list
        if off_days:
            for day in ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']:
                validated_data[f'off_{day}'] = day.upper() in map(str.upper, off_days)
                
        # Create the employee profile
        employee = EmployeeProfile.objects.create(**validated_data)
        return employee 

class EmployeeTableSerializer(serializers.ModelSerializer):
    """
    Serializer for the All Employees table view.
    Includes calculated fields for attendance and OT hours.
    """
    employee_name = serializers.SerializerMethodField()
    attendance_percentage = serializers.SerializerMethodField()
    total_ot_hours = serializers.SerializerMethodField()

    class Meta:
        model = EmployeeProfile
        fields = [
            'employee_id',
            'employee_name',
            'mobile_number',
            'email',
            'department',
            'designation',
            'employment_type',
            'location_branch',
            'shift_start_time',
            'shift_end_time',
            'basic_salary',
            'ot_charge_per_hour',
            'attendance_percentage',
            'total_ot_hours'
        ]

    def get_employee_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

    def get_attendance_percentage(self, obj):
        # Calculate attendance percentage from SalaryData
        current_month = timezone.now().month
        current_year = timezone.now().year

        attendance = SalaryData.objects.filter(
            employee_id=obj.employee_id,
            year=current_year,
            month__icontains=timezone.datetime(current_year, current_month, 1).strftime('%b').upper()
        ).aggregate(
            avg_attendance=Avg(
                100 * (models.F('days_present') / (models.F('days_present') + models.F('days_absent')))
            )
        )['avg_attendance'] or 0

        return round(attendance, 1)

    def get_total_ot_hours(self, obj):
        # Get total OT hours from SalaryData for current month
        current_month = timezone.now().month
        current_year = timezone.now().year

        total_ot = SalaryData.objects.filter(
            employee_id=obj.employee_id,
            year=current_year,
            month__icontains=timezone.datetime(current_year, current_month, 1).strftime('%b').upper()
        ).aggregate(
            total_ot=Sum('ot_hours')
        )['total_ot'] or 0

        return f"{total_ot:.2f} hrs"

class AttendanceSerializer(serializers.ModelSerializer):
    """
    Serializer for the Attendance model.
    """
    class Meta:
        model = Attendance
        fields = [
            'id',
            'employee_id',
            'name',
            'department',
            'date',
            'calendar_days',
            'total_working_days',
            'present_days',
            'absent_days',
            'ot_hours',
            'late_minutes',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'absent_days']

    def validate(self, data):
        """
        Custom validation to ensure:
        1. present_days doesn't exceed total_working_days
        2. calendar_days is greater than or equal to total_working_days
        """
        if data.get('present_days', 0) > data.get('total_working_days', 0):
            raise serializers.ValidationError(
                "Present days cannot exceed total working days"
            )
        
        if data.get('total_working_days', 0) > data.get('calendar_days', 0):
            raise serializers.ValidationError(
                "Total working days cannot exceed calendar days"
            )
            
        return data 

class DailyAttendanceSerializer(serializers.ModelSerializer):
    """
    Serializer for the DailyAttendance model.
    """
    class Meta:
        model = DailyAttendance
        fields = [
            'id',
            'employee_id',
            'employee_name',
            'department',
            'designation',
            'employment_type',
            'attendance_status',
            'date',
            'check_in',
            'check_out',
            'working_hours',
            'time_status',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['designation', 'employment_type', 'working_hours', 'time_status', 'created_at', 'updated_at']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Default designation and employment_type if missing or blank
        data['designation'] = data.get('designation') or '-'  # or 'N/A' if you prefer
        data['employment_type'] = data.get('employment_type') or 'N/A'
        return data 

class AdvanceLedgerSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdvanceLedger
        fields = '__all__'

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'