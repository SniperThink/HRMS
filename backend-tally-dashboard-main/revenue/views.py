from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta, date
import locale
from django.db.models import Sum, Count

from data.models import MasterData, SalesData

class RevenueView(APIView):
    def get_period_dates(self, period_type, reference_date):
        """Calculate start and end dates for current and previous periods"""
        if period_type == 'daily':
            current_start = reference_date
            current_end = current_start
            previous_start = current_start - timedelta(days=1)
            previous_end = previous_start
        elif period_type == 'weekly':
            current_start = reference_date - timedelta(days=reference_date.weekday())
            current_end = current_start + timedelta(days=6)
            previous_start = current_start - timedelta(days=7)
            previous_end = previous_start + timedelta(days=6)
        else:  # monthly
            current_start = date(reference_date.year, reference_date.month, 1)
            if reference_date.month == 12:
                current_end = date(reference_date.year + 1, 1, 1) - timedelta(days=1)
            else:
                current_end = date(reference_date.year, reference_date.month + 1, 1) - timedelta(days=1)
            
            if current_start.month == 1:
                previous_start = date(current_start.year - 1, 12, 1)
                previous_end = date(current_start.year, 1, 1) - timedelta(days=1)
            else:
                previous_start = date(current_start.year, current_start.month - 1, 1)
                previous_end = current_start - timedelta(days=1)
            
        return current_start, current_end, previous_start, previous_end

    def format_currency(self, amount):
        """Format amount in Indian currency format"""
        locale.setlocale(locale.LC_MONETARY, 'en_IN')
        return locale.currency(float(amount), grouping=True, symbol='₹')

    def get(self, request):
        period_type = request.query_params.get('period_type', 'daily')
        category = request.query_params.get('category', 'all')
        # reference_date = timezone.now().date()
        # reference_date = date(2025, 1, 31)
        reference_entry = SalesData.objects.select_related('master_data').order_by('-master_data__date').first()
        reference_date = reference_entry.master_data.date if reference_entry else None

        # Get date ranges
        current_start, current_end, previous_start, previous_end = self.get_period_dates(
            period_type, reference_date
        )
        print(current_start, current_end, previous_start, previous_end)

        # Base query filters for MasterData
        base_query = MasterData.objects.filter(voucher_type='Sales')
        if category != 'all':
            base_query = base_query.filter(category=category)

        # Query current period revenue
        current_revenue = base_query.filter(
            date__range=(current_start, current_end)
        ).aggregate(
            total=Sum('amount')
        )['total'] or 0

        # Query previous period revenue
        previous_revenue = base_query.filter(
            date__range=(previous_start, previous_end)
        ).aggregate(
            total=Sum('amount')
        )['total'] or 0

        # Calculate growth rate
        growth_rate = 0
        if previous_revenue > 0:
            growth_rate = ((current_revenue - previous_revenue) / previous_revenue) * 100

        # Get additional metrics
        current_metrics = base_query.filter(date__range=(current_start, current_end)).aggregate(
            total_qty=Sum('qty_number'),
            total_orders=Count('id')
        )

        previous_metrics = base_query.filter(date__range=(previous_start, previous_end)).aggregate(
            total_qty=Sum('qty_number'),
            total_orders=Count('id')
        )

        # Calculate average order value
        current_aov = current_revenue / current_metrics['total_orders'] if current_metrics['total_orders'] > 0 else 0
        previous_aov = previous_revenue / previous_metrics['total_orders'] if previous_metrics['total_orders'] > 0 else 0

        response_data = {
            'current_period': {
                'revenue': float(current_revenue),
                'start_date': current_start.isoformat(),
                'end_date': current_end.isoformat(),
                'total_orders': current_metrics['total_orders'],
                'total_quantity': float(current_metrics['total_qty'] or 0),
                'average_order_value': float(current_aov)
            },
            'previous_period': {
                'revenue': float(previous_revenue),
                'start_date': previous_start.isoformat(),
                'end_date': previous_end.isoformat(),
                'total_orders': previous_metrics['total_orders'],
                'total_quantity': float(previous_metrics['total_qty'] or 0),
                'average_order_value': float(previous_aov)
            },
            'growth_rate': round(growth_rate, 1),
            'period_type': period_type,
            'metadata': {
                'currency': 'INR',
                'formatted_current_revenue': self.format_currency(current_revenue),
                'formatted_previous_revenue': self.format_currency(previous_revenue),
                'formatted_current_aov': self.format_currency(current_aov),
                'formatted_previous_aov': self.format_currency(previous_aov)
            }
        }

        return Response(response_data)
