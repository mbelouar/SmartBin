from rest_framework import serializers
from .models import Reclamation


class ReclamationSerializer(serializers.ModelSerializer):
    """Serializer for Reclamation model"""
    
    class Meta:
        model = Reclamation
        fields = [
            'id', 'user_nfc_code', 'bin_id', 'reclamation_type', 'title', 'message',
            'location', 'latitude', 'longitude', 'status', 'priority',
            'admin_notes', 'resolved_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'status', 'admin_notes', 'resolved_at', 'created_at', 'updated_at']
    
    def validate(self, data):
        """Validate reclamation data"""
        # Ensure user_nfc_code starts with SB-
        user_nfc = data.get('user_nfc_code', '')
        if user_nfc and not user_nfc.startswith('SB-'):
            raise serializers.ValidationError({
                'user_nfc_code': "Invalid NFC code format. Must start with 'SB-'"
            })
        return data


class ReclamationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a reclamation (excludes admin fields)"""
    
    class Meta:
        model = Reclamation
        fields = [
            'user_nfc_code', 'bin_id', 'reclamation_type', 'title', 'message',
            'location', 'latitude', 'longitude', 'priority'
        ]
    
    def validate_user_nfc_code(self, value):
        """Validate NFC code format"""
        if not value.startswith('SB-'):
            raise serializers.ValidationError("Invalid NFC code format. Must start with 'SB-'")
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
