from django.urls import path
from .views import RevenueView

urlpatterns = [
    path('revenue/', RevenueView.as_view(), name='revenue'),
]