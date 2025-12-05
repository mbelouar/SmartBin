"""
URL configuration for bin_service project.
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/bins/', include('bins.urls')),
]
