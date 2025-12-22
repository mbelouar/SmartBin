from django.contrib.auth.backends import BaseBackend
from django.contrib.auth import get_user_model
import requests
import os

User = get_user_model()


class ClerkBackend(BaseBackend):
    """
    Authenticate using Clerk JWT tokens.
    This allows users authenticated via Clerk to access Django APIs.
    """
    
    def authenticate(self, request, token=None):
        """
        Authenticate a user based on Clerk JWT token.
        The token should be verified by checking with Clerk's API.
        """
        if not token:
            return None
        
        try:
            # Verify token with Clerk
            clerk_secret = os.environ.get('CLERK_SECRET_KEY')
            if not clerk_secret:
                return None
            
            # Call Clerk API to verify the token
            response = requests.get(
                'https://api.clerk.com/v1/sessions/verify',
                headers={
                    'Authorization': f'Bearer {clerk_secret}',
                    'Content-Type': 'application/json',
                },
                params={'token': token},
                timeout=5
            )
            
            if response.status_code == 200:
                session_data = response.json()
                clerk_user_id = session_data.get('user_id')
                
                if clerk_user_id:
                    # Find or create user with this Clerk ID
                    try:
                        user = User.objects.get(clerk_id=clerk_user_id)
                        return user
                    except User.DoesNotExist:
                        # User not synced yet, could trigger sync here
                        return None
            
            return None
            
        except Exception as e:
            print(f"Error authenticating with Clerk: {e}")
            return None
    
    def get_user(self, user_id):
        """Get a user by ID"""
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
