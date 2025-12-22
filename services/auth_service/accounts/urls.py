from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    LoginView,
    UserProfileView,
    UserDetailView,
    UserByClerkIdView,
    AddPointsView,
    PointsHistoryView,
    HealthCheckView,
    ClerkSyncView,
)

urlpatterns = [
    # Authentication
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # User Profile
    path('profile/', UserProfileView.as_view(), name='user_profile'),
    path('users/<uuid:id>/', UserDetailView.as_view(), name='user_detail'),
    path('users/clerk/<str:clerk_id>/', UserByClerkIdView.as_view(), name='user_by_clerk_id'),
    
    # Points Management
    path('points/add/', AddPointsView.as_view(), name='add_points'),
    path('points/history/', PointsHistoryView.as_view(), name='points_history'),
    
    # Clerk Integration
    path('clerk-sync/', ClerkSyncView.as_view(), name='clerk_sync'),
    
    # Health Check
    path('health/', HealthCheckView.as_view(), name='health_check'),
]
