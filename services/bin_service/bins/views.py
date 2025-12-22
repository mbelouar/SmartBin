from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import Bin, BinUsageLog
from .serializers import (
    BinSerializer,
    BinUsageLogSerializer,
    OpenBinSerializer,
    CloseBinSerializer,
    UpdateFillLevelSerializer
)
from .permissions import IsAdminOrReadOnly
from mqtt.mqtt_client import mqtt_client
import logging

logger = logging.getLogger(__name__)


class BinViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Bin CRUD operations
    Only admins can create/update/delete bins
    Users can view bins
    """
    queryset = Bin.objects.all()
    serializer_class = BinSerializer
    lookup_field = 'id'  # Use UUID field for lookups
    
    def get_permissions(self):
        """
        Only authenticated users can create, update, or delete bins
        Everyone can view bins
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # For now, just require authentication
            # In production, verify admin status with auth service
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]
    
    def get_queryset(self):
        """Filter bins by status and location"""
        queryset = super().get_queryset()
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by coordinates (nearby bins)
        lat = self.request.query_params.get('latitude', None)
        lon = self.request.query_params.get('longitude', None)
        radius = self.request.query_params.get('radius', 5)  # default 5km
        
        if lat and lon:
            # Simple distance filter (for production, use PostGIS)
            # This is a rough approximation
            try:
                from decimal import Decimal
                lat = Decimal(lat)
                lon = Decimal(lon)
                radius = Decimal(radius)
                
                # Rough calculation: 1 degree ≈ 111km
                lat_range = radius / Decimal('111')
                lon_range = radius / Decimal('111')
                
                queryset = queryset.filter(
                    latitude__range=(lat - lat_range, lat + lat_range),
                    longitude__range=(lon - lon_range, lon + lon_range)
                )
            except:
                pass
        
        return queryset
    
    @action(detail=True, methods=['post'], url_path='open', permission_classes=[permissions.AllowAny])
    def open_bin(self, request, id=None):
        """
        Open a specific bin
        POST /api/bins/{id}/open/
        Body: {"user_nfc_code": "SB-...", "nfc_tag_id": "NFC-..."}
        Note: AllowAny for Node-RED and IoT device integration
        """
        bin_instance = self.get_object()
        serializer = OpenBinSerializer(data=request.data)
        
        if not serializer.is_valid():
            # Log validation errors for debugging
            logger.error(f"Open bin validation failed: {serializer.errors}")
            logger.error(f"Request data: {request.data}")
            logger.error(f"Request body: {request.body}")
            return Response({
                'error': 'Validation failed',
                'details': serializer.errors,
                'request_data': str(request.data)
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Support both old 'user_qr_code' and new 'user_nfc_code' for backward compatibility
        user_nfc_code = serializer.validated_data.get('user_nfc_code') or serializer.validated_data.get('user_qr_code')
        nfc_tag_id = serializer.validated_data.get('nfc_tag_id')
        
        # Ensure user_nfc_code has SB- prefix for compatibility
        if user_nfc_code and not user_nfc_code.startswith('SB-'):
            user_nfc_code = f'SB-{user_nfc_code}'
        
        logger.info(f"Opening bin {bin_instance.id} for user {user_nfc_code}")
        logger.info(f"Bin current state: is_open={bin_instance.is_open}, status={bin_instance.status}")
        
        # Verify NFC tag if provided (proximity verification)
        if nfc_tag_id:
            if nfc_tag_id != bin_instance.nfc_tag_id:
                logger.warning(f"NFC tag mismatch: expected {bin_instance.nfc_tag_id}, got {nfc_tag_id}")
                return Response({
                    'error': 'Invalid NFC tag. Please scan the correct bin.',
                    'detail': 'You must be near the bin to open it.'
                }, status=status.HTTP_403_FORBIDDEN)
        
        # Check if bin is already open
        if bin_instance.is_open:
            logger.warning(f"Bin {bin_instance.id} is already open")
            # Instead of failing, just return success (bin is already open)
            return Response({
                'message': 'Bin is already open',
                'bin': BinSerializer(bin_instance).data
            }, status=status.HTTP_200_OK)
        
        # Check if bin is active
        if bin_instance.status != 'active':
            logger.warning(f"Bin {bin_instance.id} is not active, status: {bin_instance.status}")
            return Response({
                'error': f'Bin is not available. Status: {bin_instance.status}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Publish MQTT command to open bin
        logger.info(f"Publishing MQTT open command for bin {bin_instance.id}")
        mqtt_success = mqtt_client.open_bin(bin_instance.id, user_nfc_code)
        logger.info(f"MQTT publish result: {mqtt_success}")
        
        # Update bin status regardless of MQTT success (MQTT is for physical bin, we still track state)
        bin_instance.open_bin()
        logger.info(f"Bin {bin_instance.id} marked as open in database")
        
        # Log usage
        BinUsageLog.objects.create(
            bin=bin_instance,
            user_nfc_code=user_nfc_code
        )
        logger.info(f"Usage log created for bin {bin_instance.id}")
        
        # Return success even if MQTT failed (for testing/development)
        response_data = {
            'message': 'Bin opened successfully',
            'bin': BinSerializer(bin_instance).data,
            'mqtt_published': mqtt_success
        }
        
        if not mqtt_success:
            logger.warning(f"MQTT publish failed but bin state updated. This is OK for testing.")
            response_data['warning'] = 'MQTT command failed, but bin state updated'
        
        return Response(response_data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], url_path='close', permission_classes=[permissions.AllowAny])
    def close_bin(self, request, id=None):
        """
        Close a specific bin
        POST /api/bins/{id}/close/
        Note: AllowAny for Node-RED and IoT device integration
        """
        bin_instance = self.get_object()
        
        if not bin_instance.is_open:
            return Response({
                'error': 'Bin is already closed'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Publish MQTT command to close bin
        mqtt_success = mqtt_client.close_bin(bin_instance.id)
        
        if mqtt_success:
            # Update bin status
            bin_instance.close_bin()
            
            return Response({
                'message': 'Bin closed successfully',
                'bin': BinSerializer(bin_instance).data
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Failed to send close command to bin'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'], url_path='update-fill-level', permission_classes=[permissions.AllowAny])
    def update_fill_level(self, request, pk=None):
        """
        Update bin fill level
        POST /api/bins/{id}/update-fill-level/
        Body: {"fill_level": 75}
        Note: AllowAny for IoT sensors and automated systems
        """
        bin_instance = self.get_object()
        serializer = UpdateFillLevelSerializer(data=request.data)
        
        if serializer.is_valid():
            fill_level = serializer.validated_data['fill_level']
            bin_instance.update_fill_level(fill_level)
            
            return Response({
                'message': 'Fill level updated successfully',
                'bin': BinSerializer(bin_instance).data
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BinUsageLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing bin usage logs
    """
    queryset = BinUsageLog.objects.all()
    serializer_class = BinUsageLogSerializer
    permission_classes = [permissions.AllowAny]  # Changed for microservice communication
    
    def get_queryset(self):
        """Filter logs by bin_id if provided"""
        queryset = super().get_queryset()
        bin_id = self.request.query_params.get('bin_id', None)
        if bin_id:
            queryset = queryset.filter(bin_id=bin_id)
        return queryset


class BinByQRCodeView(APIView):
    """
    Get bin information by QR code
    GET /api/bins/qr/{qr_code}/
    """
    permission_classes = [permissions.AllowAny]  # Changed for microservice communication
    
    def get(self, request, qr_code):
        bin_instance = get_object_or_404(Bin, qr_code=qr_code)
        serializer = BinSerializer(bin_instance)
        return Response(serializer.data)


class HealthCheckView(APIView):
    """Health check endpoint"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        # Check MQTT connection
        mqtt_status = 'connected' if mqtt_client.connected else 'disconnected'
        
        return Response({
            'status': 'healthy',
            'service': 'bin_service',
            'mqtt': mqtt_status
        }, status=status.HTTP_200_OK)
