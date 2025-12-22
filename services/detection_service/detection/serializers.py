from rest_framework import serializers
from .models import MaterialDetection, DetectionStats


class MaterialDetectionSerializer(serializers.ModelSerializer):
    """Serializer for MaterialDetection model"""
    
    class Meta:
        model = MaterialDetection
        fields = [
            'id', 'bin_id', 'user_nfc_code', 'material_type',
            'confidence', 'points_awarded', 'points_added_to_user', 'created_at'
        ]
        read_only_fields = ['id', 'points_awarded', 'points_added_to_user', 'created_at']


class DetectionStatsSerializer(serializers.ModelSerializer):
    """Serializer for DetectionStats model"""
    
    class Meta:
        model = DetectionStats
        fields = [
            'date', 'total_detections', 'plastic_count', 'paper_count',
            'glass_count', 'metal_count', 'organic_count', 'other_count',
            'total_points_awarded', 'updated_at'
        ]
        read_only_fields = ['updated_at']


class SimulateDetectionSerializer(serializers.Serializer):
    """Serializer for simulating detection (for testing)"""
    bin_id = serializers.UUIDField(required=True)
    user_nfc_code = serializers.CharField(required=True, max_length=100)
    material = serializers.ChoiceField(
        choices=['plastic', 'paper', 'glass', 'metal', 'organic', 'other'],
        default='plastic'
    )
    confidence = serializers.FloatField(min_value=0.0, max_value=1.0, default=0.95)
