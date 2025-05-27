from django.contrib import admin
from django.urls import path, include
# from .views import UploadSalarySheetsView
from .views import GetRandomDataView, UploadAndProcessExcelAPIView, RevenueTrendViewSet, CurrentDateInfoViewSet, TopProductsViewSet
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register('supermarketsales', SuperMarketSalesViewset, basename='supermarketsales')
router.register('branchedata', BrancheDataViewset, basename='branchedata')
router.register('salesdata', YearlySalesDataViewset, basename='salesdata')
router.register('statewisesalesdata', StatelySalesDataViewset, basename='statewisesalesdata')
router.register('timeperiodrevenue', RevenueViewset, basename='revenue')
router.register('revenue-trend', RevenueTrendViewSet, basename='revenue-trend')
router.register('current-date-info', CurrentDateInfoViewSet, basename='current-date-info')
router.register('top-products', TopProductsViewSet, basename='top-products')

urlpatterns = [
    path('upload/', UploadAndProcessExcelAPIView.as_view(), name='upload-excel'),
    # path('upload-salary/', UploadSalarySheetsView.as_view(), name='upload-salary'),
    path('get_data/',GetRandomDataView.as_view(), name='get-data'),
    path('', include(router.urls))
]
