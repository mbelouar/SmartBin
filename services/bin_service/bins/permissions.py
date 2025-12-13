"""
Custom permissions for bin service
Since bin service doesn't have user models, we use simpler permission checks
"""
from rest_framework import permissions


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission that allows read-only access to everyone,
    but requires authentication for write operations.
    For admin checks, we'll verify with auth service in the future.
    """
    def has_permission(self, request, view):
        # Allow read-only access to everyone
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # For write operations, require authentication
        # The JWT token validation happens in authentication middleware
        # We just check if user is authenticated
        return request.user and request.user.is_authenticated
