from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReclamationViewSet, HealthCheckView

router = DefaultRouter()
router.register(r'list', ReclamationViewSet, basename='reclamation')

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='health'),
    path('', include(router.urls)),
]
