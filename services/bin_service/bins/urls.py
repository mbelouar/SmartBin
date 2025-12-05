from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BinViewSet, BinUsageLogViewSet, BinByQRCodeView, HealthCheckView

router = DefaultRouter()
router.register(r'list', BinViewSet, basename='bin')
router.register(r'usage-logs', BinUsageLogViewSet, basename='bin-logs')

urlpatterns = [
    path('qr/<str:qr_code>/', BinByQRCodeView.as_view(), name='bin-by-qr'),
    path('health/', HealthCheckView.as_view(), name='health'),
    path('', include(router.urls)),
]
