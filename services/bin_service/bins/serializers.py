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
    user_qr_code = serializers.CharField(
        required=True,
        help_text="User's QR code (obtained from scanning their app)"
    )
    nfc_tag_id = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="NFC tag ID scanned from the bin (for proximity verification)"
    )
    
    def validate_user_qr_code(self, value):
        """Validate QR code format"""
        if not value.startswith('SB-'):
            raise serializers.ValidationError("Invalid QR code format. Must start with 'SB-'")
        return value
    
    def validate_nfc_tag_id(self, value):
        """Validate NFC tag format"""
        if value and not value.startswith('NFC-'):
            raise serializers.ValidationError("Invalid NFC tag format. Must start with 'NFC-'")
        return value


class CloseBinSerializer(serializers.Serializer):
    """Serializer for closing a bin (optional, can be empty)"""
    pass


class UpdateFillLevelSerializer(serializers.Serializer):
    """Serializer for updating bin fill level"""
    fill_level = serializers.IntegerField(min_value=0, max_value=100)
