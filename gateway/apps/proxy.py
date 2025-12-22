"""
Proxy utility for forwarding requests to microservices
"""
import requests
import logging
from django.conf import settings
from django.http import JsonResponse

logger = logging.getLogger(__name__)


def proxy_request(request, service_url, path=''):
    """
    Forward request to a microservice
    
    Args:
        request: Django request object
        service_url: Base URL of the service
        path: Additional path to append
    
    Returns:
        JsonResponse with the service's response
    """
    try:
        # Build target URL
        target_url = f"{service_url}/{path}"
        
        # Get request method
        method = request.method
        
        # Prepare headers (minimal headers to avoid Django ALLOWED_HOSTS issues)
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Host': 'localhost'  # Override Host header to avoid Django ALLOWED_HOSTS validation
        }
        
        # Only forward Authorization header
        auth_header = request.headers.get('Authorization')
        if auth_header:
            headers['Authorization'] = auth_header
        
        # Prepare data
        data = None
        if request.method in ['POST', 'PUT', 'PATCH']:
            data = request.body
        
        # Prepare query parameters
        params = request.GET.dict()
        
        logger.info(f"Proxying {method} request to {target_url}")
        
        # Make request to microservice
        # Use allow_redirects=False to prevent HOST header forwarding issues
        response = requests.request(
            method=method,
            url=target_url,
            headers=headers,
            data=data,
            params=params,
            timeout=settings.SERVICE_TIMEOUT,
            allow_redirects=False
        )
        
        # Return response
        try:
            return JsonResponse(
                response.json(),
                status=response.status_code,
                safe=False
            )
        except ValueError:
            # If response is not JSON, return text
            return JsonResponse(
                {'detail': response.text},
                status=response.status_code
            )
    
    except requests.exceptions.Timeout:
        logger.error(f"Timeout calling {service_url}")
        return JsonResponse(
            {'error': 'Service timeout'},
            status=504
        )
    except requests.exceptions.ConnectionError:
        logger.error(f"Connection error calling {service_url}")
        return JsonResponse(
            {'error': 'Service unavailable'},
            status=503
        )
    except Exception as e:
        logger.error(f"Error proxying request: {e}")
        return JsonResponse(
            {'error': 'Internal gateway error'},
            status=500
        )
