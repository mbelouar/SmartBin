from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import PointsHistory

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'points', 'qr_code', 'phone_number', 'created_at', 'is_staff', 'is_superuser']
        read_only_fields = ['id', 'points', 'qr_code', 'created_at', 'is_staff', 'is_superuser']


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
        
        # Generate QR code for user
        user.generate_qr_code()
        
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
    user_id = serializers.UUIDField()
    amount = serializers.IntegerField(min_value=1)
    description = serializers.CharField(required=False, allow_blank=True)
    
    def validate_user_id(self, value):
        """Validate user exists"""
        try:
            User.objects.get(id=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found")
        return value
