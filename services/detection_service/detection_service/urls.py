"""
URL configuration for detection_service project.
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/detections/', include('detection.urls')),
]
