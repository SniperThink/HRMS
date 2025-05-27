from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import DailyAttendance, Attendance, AdvanceLedger, Payment, SalaryData
from django.db.models import Sum
from datetime import date
from decimal import Decimal

@receiver([post_save, post_delete], sender=DailyAttendance)
def sync_attendance_from_daily(sender, instance, **kwargs):
    employee_id = instance.employee_id
    month = instance.date.month
    year = instance.date.year

    daily_qs = DailyAttendance.objects.filter(
        employee_id=employee_id,
        date__year=year,
        date__month=month
    )

    present_days = daily_qs.filter(attendance_status='PRESENT').count()
    half_days = daily_qs.filter(attendance_status='HALF_DAY').count()
    absent_days = daily_qs.filter(attendance_status='ABSENT').count()
    ot_hours = daily_qs.aggregate(total_ot=Sum('working_hours'))['total_ot'] or 0
    # TODO: Calculate late_minutes if you have a way to do so
    late_minutes = 0

    att_date = date(year, month, 1)

    Attendance.objects.update_or_create(
        employee_id=employee_id,
        date=att_date,
        defaults={
            'name': instance.employee_name,
            'department': instance.department,
            'calendar_days': daily_qs.count(),
            'total_working_days': daily_qs.count(),
            'present_days': present_days + 0.5 * half_days,
            'absent_days': absent_days,
            'ot_hours': ot_hours,
            'late_minutes': late_minutes,
        }
    )

@receiver([post_save, post_delete], sender=AdvanceLedger)
def update_total_advance_on_advance_change(sender, instance, **kwargs):
    employee_id = instance.employee_id
    # Sum all advances for this employee
    total_advance = AdvanceLedger.objects.filter(employee_id=employee_id).aggregate(
        total=Sum('amount')
    )['total'] or Decimal('0.00')
    # Subtract all advance deductions from payments
    total_deduction = Payment.objects.filter(employee_id=employee_id).aggregate(
        total=Sum('advance_deduction')
    )['total'] or Decimal('0.00')
    # Update all SalaryData records for this employee
    SalaryData.objects.filter(employee_id=employee_id).update(total_advance=total_advance - total_deduction)

@receiver([post_save, post_delete], sender=Payment)
def update_total_advance_on_payment(sender, instance, **kwargs):
    employee_id = instance.employee_id
    # Sum all advances
    total_advance = AdvanceLedger.objects.filter(employee_id=employee_id).aggregate(
        total=Sum('amount')
    )['total'] or Decimal('0.00')
    # Subtract all advance deductions
    total_deduction = Payment.objects.filter(employee_id=employee_id).aggregate(
        total=Sum('advance_deduction')
    )['total'] or Decimal('0.00')
    # Update all SalaryData records for this employee
    SalaryData.objects.filter(employee_id=employee_id).update(total_advance=total_advance - total_deduction) 