"""
Clerk JWT authentication for bin service
Verifies Clerk JWT tokens and creates a minimal user object
"""
import os
import jwt
import requests
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth.models import AnonymousUser
import logging

logger = logging.getLogger(__name__)


class ClerkAuthentication(BaseAuthentication):
    """
    Authenticate using Clerk JWT tokens.
    For now, we decode the token to get user info without full verification.
    In production, you should verify the token signature with Clerk's public keys.
    """
    
    def authenticate(self, request):
        """
        Authenticate a request using Clerk JWT token.
        Returns (user, token) tuple if successful, None otherwise.
        """
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        logger.info(f"ClerkAuthentication: Checking auth for {request.path}")
        logger.info(f"ClerkAuthentication: Auth header present: {bool(auth_header)}")
        
        if not auth_header:
            logger.info("ClerkAuthentication: No Authorization header")
            return None
            
        if not auth_header.startswith('Bearer '):
            logger.info(f"ClerkAuthentication: Auth header doesn't start with Bearer: {auth_header[:20]}")
            return None
        
        token = auth_header.split(' ')[1] if len(auth_header.split(' ')) > 1 else None
        
        if not token:
            return None
        
        try:
            logger.info(f"ClerkAuthentication: Token received, length: {len(token)}")
            logger.info(f"ClerkAuthentication: Token preview: {token[:50]}...")
            
            # Try to decode the JWT token
            try:
                # Decode without verification to get the payload
                decoded = jwt.decode(token, options={"verify_signature": False})
                logger.info(f"ClerkAuthentication: Successfully decoded token")
                logger.info(f"ClerkAuthentication: Token keys: {list(decoded.keys())}")
                
                # Clerk tokens typically have 'sub' for user ID
                clerk_user_id = decoded.get('sub') or decoded.get('user_id') or decoded.get('id') or decoded.get('sid')
                
                # If no user ID found, use a default or the token itself as identifier
                if not clerk_user_id:
                    # Try to get any identifier from the token
                    clerk_user_id = decoded.get('session_id') or f"clerk_user_{hash(token) % 10000}"
                    logger.warning(f"ClerkAuthentication: No user ID in token, using generated ID: {clerk_user_id}")
                
                logger.info(f"ClerkAuthentication: User ID: {clerk_user_id}")
                
                # Create a minimal user object
                class MinimalUser:
                    def __init__(self, user_id, token_data):
                        self.id = user_id
                        self.pk = user_id
                        self.is_authenticated = True
                        self.is_active = True
                        # Check if user is admin from token metadata
                        org_metadata = token_data.get('org_metadata') or {}
                        metadata = token_data.get('metadata') or {}
                        public_metadata = metadata.get('public') or token_data.get('public_metadata') or {}
                        role = public_metadata.get('role') or token_data.get('role')
                        is_admin = role == 'admin' if role else False
                        self.is_staff = True  # Allow all authenticated users
                        self.is_superuser = is_admin
                    
                    def __str__(self):
                        return f"ClerkUser({self.id})"
                
                user = MinimalUser(clerk_user_id, decoded)
                logger.info(f"ClerkAuthentication: Successfully authenticated user {clerk_user_id}")
                return (user, token)
                
            except jwt.DecodeError as e:
                # Token is not a valid JWT - might be a session token
                logger.warning(f"ClerkAuthentication: JWT decode error: {e}")
                logger.warning(f"ClerkAuthentication: Token might be a session token, not JWT")
                
                # For now, accept any token that looks like a Clerk token
                # This is a temporary solution - in production, verify properly
                if token and len(token) > 20:
                    logger.info("ClerkAuthentication: Accepting token as valid (temporary)")
                    class MinimalUser:
                        def __init__(self, token_id):
                            self.id = token_id
                            self.pk = token_id
                            self.is_authenticated = True
                            self.is_active = True
                            self.is_staff = True
                            self.is_superuser = False
                        
                        def __str__(self):
                            return f"ClerkUser({self.id})"
                    
                    user = MinimalUser(f"clerk_session_{hash(token) % 10000}")
                    logger.info(f"ClerkAuthentication: Authenticated with session token")
                    return (user, token)
                
                return None
            
        except Exception as e:
            # Log the error for debugging
            import traceback
            logger.error(f"ClerkAuthentication: Exception: {e}")
            logger.error(traceback.format_exc())
            return None
    
    def authenticate_header(self, request):
        """
        Return a string to be used as the value of the `WWW-Authenticate`
        header in a `401 Unauthenticated` response.
        """
        return 'Bearer realm="api"'

