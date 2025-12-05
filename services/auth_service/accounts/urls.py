from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    LoginView,
    UserProfileView,
    UserDetailView,
    AddPointsView,
    PointsHistoryView,
    HealthCheckView,
)

urlpatterns = [
    # Authentication
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # User Profile
    path('profile/', UserProfileView.as_view(), name='user_profile'),
    path('users/<uuid:id>/', UserDetailView.as_view(), name='user_detail'),
    
    # Points Management
    path('points/add/', AddPointsView.as_view(), name='add_points'),
    path('points/history/', PointsHistoryView.as_view(), name='points_history'),
    
    # Health Check
    path('health/', HealthCheckView.as_view(), name='health_check'),
]
