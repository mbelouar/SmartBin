from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import PointsHistory

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'points', 'nfc_code', 'phone_number', 'created_at', 'is_staff', 'is_superuser']
        read_only_fields = ['id', 'points', 'nfc_code', 'created_at', 'is_staff', 'is_superuser']


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'phone_number']
    
    def validate(self, data):
        """Validate password confirmation"""
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Passwords do not match")
        return data
    
    def validate_email(self, value):
        """Validate email is unique"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")
        return value
    
    def validate_username(self, value):
        """Validate username is unique"""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists")
        return value
    
    def create(self, validated_data):
        """Create user with hashed password"""
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        user = User.objects.create_user(
            password=password,
            **validated_data
        )
        
        # Ensure new user starts with 5 points
        if user.points == 0:
            user.points = 5
            user.save(update_fields=['points', 'updated_at'])
        
        # Generate NFC code for user
        user.generate_nfc_code()
        
        return user


class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class PointsHistorySerializer(serializers.ModelSerializer):
    """Serializer for Points History"""
    user_username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = PointsHistory
        fields = ['id', 'user', 'user_username', 'amount', 'transaction_type', 'description', 'created_at']
        read_only_fields = ['id', 'created_at']


class AddPointsSerializer(serializers.Serializer):
    """Serializer for adding points to user"""
    user_id = serializers.CharField(help_text="User ID (UUID), NFC code (SB-...), or username")
    amount = serializers.IntegerField(min_value=1)
    description = serializers.CharField(required=False, allow_blank=True)
    
    def validate_user_id(self, value):
        """Validate user exists - accepts UUID, NFC code, or username"""
        # Don't validate here - let the view handle all lookups
        # This allows flexibility for NFC codes and usernames
        return value
