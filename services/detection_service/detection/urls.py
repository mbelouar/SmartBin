from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MaterialDetectionViewSet,
    DetectionStatsViewSet,
    SimulateDetectionView,
    HealthCheckView
)

router = DefaultRouter()
router.register(r'list', MaterialDetectionViewSet, basename='detection')
router.register(r'stats', DetectionStatsViewSet, basename='stats')

urlpatterns = [
    path('simulate/', SimulateDetectionView.as_view(), name='simulate-detection'),
    path('health/', HealthCheckView.as_view(), name='health'),
    path('', include(router.urls)),
]
