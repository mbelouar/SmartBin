"""
Custom JWT authentication for bin service
Since bin service doesn't have user models, we create a minimal user object from JWT token
"""
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth.models import AnonymousUser


class BinServiceJWTAuthentication(JWTAuthentication):
    """
    Custom JWT authentication that doesn't require a user model
    Creates a minimal user object from JWT token payload
    """
    def get_user(self, validated_token):
        """
        Returns a minimal user object based on the validated token
        Since bin service doesn't have user models, we create a simple object
        """
        try:
            user_id = validated_token.get('user_id')
            if not user_id:
                return AnonymousUser()
            
            # Create a minimal user-like object
            # We don't need full user model, just enough for permission checks
            class MinimalUser:
                def __init__(self, user_id):
                    self.id = user_id
                    self.pk = user_id
                    self.is_authenticated = True
                    self.is_active = True
                    # For admin checks, we'd need to verify with auth service
                    # For now, assume authenticated users can perform actions
                    self.is_staff = True  # Temporary: allow all authenticated users
                    self.is_superuser = False
                
                def __str__(self):
                    return f"User({self.id})"
            
            return MinimalUser(user_id)
            
        except (InvalidToken, TokenError, KeyError):
            return AnonymousUser()
