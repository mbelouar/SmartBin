from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count, Sum
from datetime import date, timedelta
from .models import MaterialDetection, DetectionStats
from .serializers import (
    MaterialDetectionSerializer,
    DetectionStatsSerializer,
    SimulateDetectionSerializer
)
import logging

logger = logging.getLogger(__name__)


class MaterialDetectionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing material detections
    """
    queryset = MaterialDetection.objects.all()
    serializer_class = MaterialDetectionSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        """Filter by user_qr_code, bin_id, or material_type if provided"""
        queryset = super().get_queryset()
        
        user_qr = self.request.query_params.get('user_qr_code', None)
        if user_qr:
            queryset = queryset.filter(user_qr_code=user_qr)
        
        bin_id = self.request.query_params.get('bin_id', None)
        if bin_id:
            queryset = queryset.filter(bin_id=bin_id)
        
        material = self.request.query_params.get('material', None)
        if material:
            queryset = queryset.filter(material_type=material)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent detections (last 24 hours)"""
        yesterday = date.today() - timedelta(days=1)
        recent_detections = self.get_queryset().filter(created_at__gte=yesterday)
        serializer = self.get_serializer(recent_detections, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get detection summary by material type"""
        summary = self.get_queryset().values('material_type').annotate(
            count=Count('id'),
            total_points=Sum('points_awarded')
        ).order_by('-count')
        
        return Response(summary)


class DetectionStatsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing detection statistics
    """
    queryset = DetectionStats.objects.all()
    serializer_class = DetectionStatsSerializer
    permission_classes = [permissions.AllowAny]
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        """Get today's statistics"""
        today_stats = self.get_queryset().filter(date=date.today()).first()
        if today_stats:
            serializer = self.get_serializer(today_stats)
            return Response(serializer.data)
        return Response({
            'date': date.today(),
            'total_detections': 0,
            'message': 'No detections today yet'
        })
    
    @action(detail=False, methods=['get'])
    def last_week(self, request):
        """Get last 7 days statistics"""
        week_ago = date.today() - timedelta(days=7)
        stats = self.get_queryset().filter(date__gte=week_ago)
        serializer = self.get_serializer(stats, many=True)
        return Response(serializer.data)


class SimulateDetectionView(APIView):
    """
    Simulate a detection event (for testing without Node-RED)
    POST /api/detections/simulate/
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = SimulateDetectionSerializer(data=request.data)
        
        if serializer.is_valid():
            data = serializer.validated_data
            
            # Create detection
            detection = MaterialDetection.objects.create(
                bin_id=data['bin_id'],
                user_qr_code=data['user_qr_code'],
                material_type=data['material'],
                confidence=data['confidence']
            )
            
            # Award points
            success = detection.award_points()
            
            return Response({
                'message': 'Detection simulated successfully',
                'detection': MaterialDetectionSerializer(detection).data,
                'points_awarded': success
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class HealthCheckView(APIView):
    """Health check endpoint"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        # Check if MQTT client would be running
        # (In production, you'd check the actual MQTT connection)
        return Response({
            'status': 'healthy',
            'service': 'detection_service'
        }, status=status.HTTP_200_OK)
