"""
Utility functions for detection service
"""
import requests
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


def add_points_to_user(user_qr_code, points, description=""):
    """
    Add points to user via Auth Service API
    
    Args:
        user_qr_code: User's QR code (e.g., "SB-uuid")
        points: Points to add
        description: Description of the transaction
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Extract user_id from QR code (format: SB-{user_id})
        if user_qr_code.startswith('SB-'):
            user_id = user_qr_code[3:]  # Remove "SB-" prefix
        else:
            logger.error(f"Invalid QR code format: {user_qr_code}")
            return False
        
        # Call Auth Service to add points
        url = f"{settings.AUTH_SERVICE_URL}/api/auth/points/add/"
        payload = {
            "user_id": user_id,
            "amount": points,
            "description": description
        }
        
        response = requests.post(url, json=payload, timeout=5)
        
        if response.status_code == 200:
            logger.info(f"Added {points} points to user {user_qr_code}")
            return True
        else:
            logger.error(f"Failed to add points. Status: {response.status_code}, Response: {response.text}")
            return False
    
    except requests.exceptions.RequestException as e:
        logger.error(f"Error calling Auth Service: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error adding points: {e}")
        return False


def get_user_by_qr_code(user_qr_code):
    """
    Get user info from Auth Service by QR code
    
    Returns:
        dict: User data or None
    """
    try:
        if user_qr_code.startswith('SB-'):
            user_id = user_qr_code[3:]
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
