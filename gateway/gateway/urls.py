"""
URL configuration for gateway project.
Routes to all microservices
"""
from django.contrib import admin
from django.urls import path, re_path
from apps.views import (
    HealthCheckView,
    AuthProxyView,
    BinProxyView,
    DetectionProxyView,
    ReclamationProxyView
)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Gateway health check
    path('health/', HealthCheckView.as_view(), name='health'),
    
    # Proxy to Auth Service
    re_path(r'^api/auth/(?P<path>.*)$', AuthProxyView.as_view(), name='auth-proxy'),
    
    # Proxy to Bin Service
    re_path(r'^api/bins/(?P<path>.*)$', BinProxyView.as_view(), name='bin-proxy'),
    
    # Proxy to Detection Service
    re_path(r'^api/detections/(?P<path>.*)$', DetectionProxyView.as_view(), name='detection-proxy'),
    
    # Proxy to Reclamation Service
    re_path(r'^api/reclamations/(?P<path>.*)$', ReclamationProxyView.as_view(), name='reclamation-proxy'),
]
