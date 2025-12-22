from rest_framework import serializers
from .models import Bin, BinUsageLog


class BinSerializer(serializers.ModelSerializer):
    """Serializer for Bin model"""
    
    class Meta:
        model = Bin
        fields = [
            'id', 'name', 'qr_code', 'nfc_tag_id', 'city', 'location', 'latitude', 'longitude',
            'capacity', 'fill_level', 'status', 'is_open',
            'last_opened_at', 'last_emptied_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'qr_code', 'nfc_tag_id', 'is_open', 'last_opened_at', 'last_emptied_at', 'created_at', 'updated_at']


class BinUsageLogSerializer(serializers.ModelSerializer):
    """Serializer for BinUsageLog model"""
    bin_name = serializers.CharField(source='bin.name', read_only=True)
    bin_location = serializers.CharField(source='bin.location', read_only=True)
    
    class Meta:
        model = BinUsageLog
        fields = [
            'id', 'bin', 'bin_name', 'bin_location', 'user_qr_code',
            'opened_at', 'closed_at', 'detection_completed'
        ]
        read_only_fields = ['id', 'opened_at', 'closed_at', 'detection_completed']


class OpenBinSerializer(serializers.Serializer):
    """Serializer for opening a bin"""
    user_nfc_code = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
        help_text="User's NFC code (obtained from their app)"
    )
    user_qr_code = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
        help_text="User's QR code (deprecated, use user_nfc_code instead)"
    )
    nfc_tag_id = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
        help_text="NFC tag ID scanned from the bin (for proximity verification)"
    )
    
    def validate(self, data):
        """Validate that at least one user identifier is provided"""
        user_nfc_code = data.get('user_nfc_code')
        user_qr_code = data.get('user_qr_code')
        
        if not user_nfc_code and not user_qr_code:
            raise serializers.ValidationError("Either user_nfc_code or user_qr_code must be provided")
        
        # Prefer user_nfc_code if both are provided
        if user_nfc_code:
            data['user_nfc_code'] = user_nfc_code.strip() if isinstance(user_nfc_code, str) else str(user_nfc_code).strip()
        if user_qr_code:
            data['user_qr_code'] = user_qr_code.strip() if isinstance(user_qr_code, str) else str(user_qr_code).strip()
        
        return data
    
    def validate_user_nfc_code(self, value):
        """Validate NFC code format"""
        if not value:
            return None
        value = value.strip() if isinstance(value, str) else str(value).strip()
        if not value.startswith('SB-'):
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"User NFC code doesn't start with 'SB-': {value}. Allowing for compatibility.")
        return value
    
    def validate_user_qr_code(self, value):
        """Validate QR code format (deprecated, kept for backward compatibility)"""
        if not value:
            return None
        value = value.strip() if isinstance(value, str) else str(value).strip()
        if not value.startswith('SB-'):
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"User QR code doesn't start with 'SB-': {value}. Allowing for compatibility.")
        return value
    
    def validate_nfc_tag_id(self, value):
        """Validate NFC tag format"""
        if not value:
            return None  # Allow None/empty
        value = value.strip() if isinstance(value, str) else str(value).strip()
        if value and not value.startswith('NFC-'):
            # Log warning but allow it for testing
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"NFC tag doesn't start with 'NFC-': {value}. Allowing for compatibility.")
        return value if value else None


class CloseBinSerializer(serializers.Serializer):
    """Serializer for closing a bin (optional, can be empty)"""
    pass


class UpdateFillLevelSerializer(serializers.Serializer):
    """Serializer for updating bin fill level"""
    fill_level = serializers.IntegerField(min_value=0, max_value=100)
