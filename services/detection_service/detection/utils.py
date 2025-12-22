"""
Utility functions for detection service
"""
import requests
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


def add_points_to_user(user_nfc_code, points, description=""):
    """
    Add points to user via Auth Service API
    
    Args:
        user_nfc_code: User's NFC code (e.g., "SB-user-001" or "SB-{uuid}")
        points: Points to add
        description: Description of the transaction
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        logger.info(f"💰 Attempting to add {points} points to user with NFC code: {user_nfc_code}")
        logger.info(f"   Type of user_nfc_code: {type(user_nfc_code)}")
        
        # Call Auth Service to add points
        # The auth service can accept either user_id (UUID) or NFC code
        url = f"{settings.AUTH_SERVICE_URL}/api/auth/points/add/"
        
        # Send the full NFC code - auth service can handle UUID, NFC code, or username
        # The auth service will try: UUID -> NFC code -> username
        user_identifier = user_nfc_code
        
        logger.info(f"📝 Using user identifier: {user_identifier} (NFC code: {user_nfc_code})")
        
        payload = {
            "user_id": user_identifier,  # Can be UUID, NFC code (SB-...), or username
            "amount": points,
            "description": description
        }
        
        logger.info(f"🌐 Calling Auth Service: {url}")
        logger.info(f"📦 Payload: {payload}")
        
        response = requests.post(url, json=payload, timeout=10)
        
        logger.info(f"📨 Response status: {response.status_code}")
        logger.info(f"📨 Response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            try:
                response_data = response.json()
                logger.info(f"✅ Successfully added {points} points to user {user_nfc_code}")
                logger.info(f"   Response data: {response_data}")
                return True
            except:
                logger.info(f"✅ Successfully added {points} points to user {user_nfc_code} (no JSON response)")
                return True
        else:
            logger.error(f"❌ Failed to add points. Status: {response.status_code}")
            try:
                error_data = response.json()
                logger.error(f"   Error response (JSON): {error_data}")
            except:
                logger.error(f"   Error response (text): {response.text}")
            return False
    
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Network error calling Auth Service: {e}")
        logger.error(f"   Auth Service URL: {settings.AUTH_SERVICE_URL}")
        import traceback
        traceback.print_exc()
        return False
    except Exception as e:
        logger.error(f"❌ Unexpected error adding points: {e}")
        import traceback
        traceback.print_exc()
        return False


def get_user_by_nfc_code(user_nfc_code):
    """
    Get user info from Auth Service by NFC code
    
    Returns:
        dict: User data or None
    """
    try:
        if user_nfc_code.startswith('SB-'):
            user_id = user_nfc_code[3:]
        else:
            return None
        
        url = f"{settings.AUTH_SERVICE_URL}/api/auth/users/{user_id}/"
        response = requests.get(url, timeout=5)
        
        if response.status_code == 200:
            return response.json()
        return None
    
    except Exception as e:
        logger.error(f"Error getting user info: {e}")
        return None
