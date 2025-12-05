from rest_framework import serializers
from .models import Reclamation, ReclamationAttachment


class ReclamationAttachmentSerializer(serializers.ModelSerializer):
    """Serializer for ReclamationAttachment model"""
    
    class Meta:
        model = ReclamationAttachment
        fields = ['id', 'file_path', 'file_type', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']


class ReclamationSerializer(serializers.ModelSerializer):
    """Serializer for Reclamation model"""
    attachments = ReclamationAttachmentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Reclamation
        fields = [
            'id', 'user_qr_code', 'bin_id', 'reclamation_type', 'title', 'message',
            'location', 'latitude', 'longitude', 'status', 'priority',
            'admin_notes', 'resolved_at', 'created_at', 'updated_at', 'attachments'
        ]
        read_only_fields = ['id', 'status', 'admin_notes', 'resolved_at', 'created_at', 'updated_at']
    
    def validate(self, data):
        """Validate reclamation data"""
        # Ensure user_qr_code starts with SB-
        user_qr = data.get('user_qr_code', '')
        if user_qr and not user_qr.startswith('SB-'):
            raise serializers.ValidationError({
                'user_qr_code': "Invalid QR code format. Must start with 'SB-'"
            })
        return data


class ReclamationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a reclamation (excludes admin fields)"""
    
    class Meta:
        model = Reclamation
        fields = [
            'user_qr_code', 'bin_id', 'reclamation_type', 'title', 'message',
            'location', 'latitude', 'longitude', 'priority'
        ]
    
    def validate_user_qr_code(self, value):
        """Validate QR code format"""
        if not value.startswith('SB-'):
            raise serializers.ValidationError("Invalid QR code format. Must start with 'SB-'")
        return value


class ReclamationUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating reclamation status (admin only)"""
    
    class Meta:
        model = Reclamation
        fields = ['status', 'priority', 'admin_notes']
    
    def validate_status(self, value):
        """Validate status transition"""
        if self.instance and self.instance.status == 'resolved' and value != 'resolved':
            raise serializers.ValidationError("Cannot change status of a resolved reclamation")
        return value
