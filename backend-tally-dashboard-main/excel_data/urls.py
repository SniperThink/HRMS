from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UploadSalaryAndPolDataAPIView, 
    SalaryDataViewSet, 
    EmployeeProfileViewSet,
    AttendanceViewSet,
    DailyAttendanceViewSet,
    AdvanceLedgerViewSet,
    PaymentViewSet,
    cleanup_salary_data,
    CreateEmployeeFormView,
    migrate_employees_from_salary_data,
    migrate_attendance_from_salary_data,
    migrate_employees_to_daily_attendance
)

# Create a router for the viewsets
router = DefaultRouter()
router.register(r'salary-data', SalaryDataViewSet)
router.register(r'employees', EmployeeProfileViewSet)
router.register(r'attendance', AttendanceViewSet)
router.register(r'daily-attendance', DailyAttendanceViewSet)
router.register(r'advance-ledger', AdvanceLedgerViewSet)
router.register(r'payments', PaymentViewSet)

urlpatterns = [
    path('upload-salary/', UploadSalaryAndPolDataAPIView.as_view(), name='upload_salary'),
    path('cleanup-salary-data/', cleanup_salary_data, name='cleanup_salary_data'),
    path('create-employee/', CreateEmployeeFormView.as_view(), name='create_employee_form'),
    path('migrate-employees/', migrate_employees_from_salary_data, name='migrate_employees'),
    path('migrate-attendance/', migrate_attendance_from_salary_data, name='migrate_attendance'),
    path('migrate-employees-to-daily-attendance/', migrate_employees_to_daily_attendance, name='migrate_employees_to_daily_attendance'),
    path('', include(router.urls)),
]
