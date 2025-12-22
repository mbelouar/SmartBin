"""
Gateway views - proxy requests to microservices
"""
import json
import time
import threading
from django.http import JsonResponse, StreamingHttpResponse
from django.views import View
from django.conf import settings
from .proxy import proxy_request
import requests


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


class DetectionStreamView(View):
    """
    Server-Sent Events (SSE) endpoint for real-time detection updates
    GET /api/stream/detections/?bin_id=<uuid>
    """
    
    def get(self, request):
        bin_id = request.GET.get('bin_id')
        if not bin_id:
            return JsonResponse({'error': 'bin_id parameter required'}, status=400)
        
        def event_stream():
            """Generator function for SSE events"""
            last_detection_id = None
            while True:
                try:
                    # Poll detection service for new detections
                    url = f"{settings.DETECTION_SERVICE_URL}api/detections/?bin_id={bin_id}&ordering=-created_at&limit=1"
                    response = requests.get(url, timeout=5)
                    
                    if response.status_code == 200:
                        data = response.json()
                        if data.get('results') and len(data['results']) > 0:
                            detection = data['results'][0]
                            detection_id = detection.get('id')
                            
                            # Only send if this is a new detection
                            if detection_id != last_detection_id:
                                last_detection_id = detection_id
                                event_data = {
                                    'type': 'detection',
                                    'data': detection
                                }
                                yield f"data: {json.dumps(event_data)}\n\n"
                    
                    # Wait before next poll
                    time.sleep(0.5)  # Poll every 500ms
                    
                except Exception as e:
                    # Send error event
                    error_data = {
                        'type': 'error',
                        'message': str(e)
                    }
                    yield f"data: {json.dumps(error_data)}\n\n"
                    time.sleep(1)  # Wait longer on error
        
        response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'  # Disable buffering in nginx
        return response
