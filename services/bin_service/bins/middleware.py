"""
Custom middleware to bypass ALLOWED_HOSTS validation for internal service calls
"""
from django.core.exceptions import DisallowedHost
from django.utils.deprecation import MiddlewareMixin
from django.http import HttpRequest


class InternalServiceMiddleware(MiddlewareMixin):
    """
    Middleware to allow internal service communication
    Bypasses ALLOWED_HOSTS validation for requests from other services
    """
    
    def process_request(self, request):
        # Get host from META directly to avoid DisallowedHost exception
        host = request.META.get('HTTP_HOST', '')
        
        # If Host contains service names or localhost, allow it
        internal_hosts = ['bin_service', 'gateway', 'node_red', 'localhost', '127.0.0.1']
        
        # Check if host starts with any internal host (with or without port)
        host_without_port = host.split(':')[0] if host else ''
        
        if host_without_port in internal_hosts or any(host.startswith(h) for h in internal_hosts):
            # Override the host validation by setting _internal_service flag
            request._internal_service = True
            # Monkey patch get_host to return a valid host
            original_get_host = request.get_host
            
            def patched_get_host():
                try:
                    return original_get_host()
                except DisallowedHost:
                    # Return a valid host that Django will accept
                    return 'localhost'
            
            request.get_host = patched_get_host
            return None
        
        return None

