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
    
    @action(detail=True, methods=['post'], url_path='open')
    def open_bin(self, request, pk=None):
        """
        Open a specific bin
        POST /api/bins/{id}/open/
        Body: {"user_qr_code": "SB-..."}
        """
        bin_instance = self.get_object()
        serializer = OpenBinSerializer(data=request.data)
        
        if serializer.is_valid():
            user_qr_code = serializer.validated_data['user_qr_code']
            
            # Check if bin is already open
            if bin_instance.is_open:
                return Response({
                    'error': 'Bin is already open'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if bin is active
            if bin_instance.status != 'active':
                return Response({
                    'error': f'Bin is not available. Status: {bin_instance.status}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Publish MQTT command to open bin
            mqtt_success = mqtt_client.open_bin(bin_instance.id, user_qr_code)
            
            if mqtt_success:
                # Update bin status
                bin_instance.open_bin()
                
                # Log usage
                BinUsageLog.objects.create(
                    bin=bin_instance,
                    user_qr_code=user_qr_code
                )
                
                return Response({
                    'message': 'Bin opened successfully',
                    'bin': BinSerializer(bin_instance).data
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Failed to send open command to bin'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], url_path='close')
    def close_bin(self, request, pk=None):
        """
        Close a specific bin
        POST /api/bins/{id}/close/
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
    
    @action(detail=True, methods=['post'], url_path='update-fill-level')
    def update_fill_level(self, request, pk=None):
        """
        Update bin fill level
        POST /api/bins/{id}/update-fill-level/
        Body: {"fill_level": 75}
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
