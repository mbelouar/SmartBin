"""
Gateway views - proxy requests to microservices
"""
from django.http import JsonResponse
from django.views import View
from django.conf import settings
from .proxy import proxy_request


class HealthCheckView(View):
    """Gateway health check"""
    
    def get(self, request):
        return JsonResponse({
            'status': 'healthy',
            'service': 'gateway',
            'services': {
                'auth': settings.AUTH_SERVICE_URL,
                'bin': settings.BIN_SERVICE_URL,
                'detection': settings.DETECTION_SERVICE_URL,
                'reclamation': settings.RECLAMATION_SERVICE_URL,
            }
        })


class AuthProxyView(View):
    """Proxy all auth service requests"""
    
    def dispatch(self, request, *args, **kwargs):
        path = kwargs.get('path', '')
        return proxy_request(request, settings.AUTH_SERVICE_URL, f"api/auth/{path}")


class BinProxyView(View):
    """Proxy all bin service requests"""
    
    def dispatch(self, request, *args, **kwargs):
        path = kwargs.get('path', '')
        return proxy_request(request, settings.BIN_SERVICE_URL, f"api/bins/{path}")


class DetectionProxyView(View):
    """Proxy all detection service requests"""
    
    def dispatch(self, request, *args, **kwargs):
        path = kwargs.get('path', '')
        return proxy_request(request, settings.DETECTION_SERVICE_URL, f"api/detections/{path}")


class ReclamationProxyView(View):
    """Proxy all reclamation service requests"""
    
    def dispatch(self, request, *args, **kwargs):
        path = kwargs.get('path', '')
        return proxy_request(request, settings.RECLAMATION_SERVICE_URL, f"api/reclamations/{path}")
