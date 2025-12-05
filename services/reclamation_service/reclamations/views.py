from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count, Q
from .models import Reclamation
from .serializers import (
    ReclamationSerializer,
    ReclamationCreateSerializer,
    ReclamationUpdateSerializer
)
import logging

logger = logging.getLogger(__name__)


class ReclamationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Reclamation CRUD operations
    """
    queryset = Reclamation.objects.all()
    permission_classes = [permissions.AllowAny]  # Changed for microservice communication
    
    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == 'create':
            return ReclamationCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ReclamationUpdateSerializer
        return ReclamationSerializer
    
    def get_queryset(self):
        """Filter reclamations by various parameters"""
        queryset = super().get_queryset()
        
        # Filter by user QR code
        user_qr = self.request.query_params.get('user_qr_code', None)
        if user_qr:
            queryset = queryset.filter(user_qr_code=user_qr)
        
        # Filter by bin_id
        bin_id = self.request.query_params.get('bin_id', None)
        if bin_id:
            queryset = queryset.filter(bin_id=bin_id)
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by reclamation_type
        reclamation_type = self.request.query_params.get('type', None)
        if reclamation_type:
            queryset = queryset.filter(reclamation_type=reclamation_type)
        
        return queryset
    
    def perform_create(self, serializer):
        """Set default status when creating"""
        serializer.save(status='pending')
    
    @action(detail=True, methods=['post'], url_path='resolve')
    def resolve(self, request, pk=None):
        """Mark reclamation as resolved"""
        reclamation = self.get_object()
        reclamation.mark_resolved()
        serializer = self.get_serializer(reclamation)
        return Response({
            'message': 'Reclamation marked as resolved',
            'reclamation': serializer.data
        })
    
    @action(detail=True, methods=['post'], url_path='in-progress')
    def set_in_progress(self, request, pk=None):
        """Mark reclamation as in progress"""
        reclamation = self.get_object()
        reclamation.mark_in_progress()
        serializer = self.get_serializer(reclamation)
        return Response({
            'message': 'Reclamation marked as in progress',
            'reclamation': serializer.data
        })
    
    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        """Get reclamation statistics"""
        total = self.get_queryset().count()
        by_status = self.get_queryset().values('status').annotate(
            count=Count('id')
        )
        by_type = self.get_queryset().values('reclamation_type').annotate(
            count=Count('id')
        )
        by_priority = self.get_queryset().values('priority').annotate(
            count=Count('id')
        )
        
        pending_count = self.get_queryset().filter(status='pending').count()
        
        return Response({
            'total': total,
            'pending': pending_count,
            'by_status': list(by_status),
            'by_type': list(by_type),
            'by_priority': list(by_priority)
        })


class HealthCheckView(APIView):
    """Health check endpoint"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        return Response({
            'status': 'healthy',
            'service': 'reclamation_service'
        }, status=status.HTTP_200_OK)
