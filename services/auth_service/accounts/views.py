from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model
from .models import PointsHistory
from .serializers import (
    UserSerializer, 
    UserRegistrationSerializer, 
    UserLoginSerializer,
    PointsHistorySerializer,
    AddPointsSerializer
)

User = get_user_model()


class RegisterView(APIView):
    """User registration endpoint"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            # Ensure QR code is generated and saved
            if not user.qr_code:
                user.generate_qr_code()
            
            return Response({
                'message': 'User registered successfully',
                'user': UserSerializer(user).data,
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """User login endpoint"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']
            
            user = authenticate(username=username, password=password)
            
            if user is not None:
                # Generate JWT tokens
                refresh = RefreshToken.for_user(user)
                
                return Response({
                    'message': 'Login successful',
                    'user': UserSerializer(user).data,
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                }, status=status.HTTP_200_OK)
            
            return Response({
                'error': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """Get and update user profile"""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class UserDetailView(generics.RetrieveAPIView):
    """Get user details by ID (for other services)"""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = User.objects.all()
    lookup_field = 'id'


class AddPointsView(APIView):
    """Add points to a user (called by detection service)"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = AddPointsSerializer(data=request.data)
        if serializer.is_valid():
            user_id = serializer.validated_data['user_id']
            amount = serializer.validated_data['amount']
            description = serializer.validated_data.get('description', 'Points earned')
            
            try:
                user = User.objects.get(id=user_id)
                user.add_points(amount)
                
                # Log the transaction
                PointsHistory.objects.create(
                    user=user,
                    amount=amount,
                    transaction_type='earned',
                    description=description
                )
                
                return Response({
                    'message': 'Points added successfully',
                    'user': UserSerializer(user).data
                }, status=status.HTTP_200_OK)
            
            except User.DoesNotExist:
                return Response({
                    'error': 'User not found'
                }, status=status.HTTP_404_NOT_FOUND)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PointsHistoryView(generics.ListAPIView):
    """Get points history for current user"""
    serializer_class = PointsHistorySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return PointsHistory.objects.filter(user=self.request.user)


class HealthCheckView(APIView):
    """Health check endpoint"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        return Response({
            'status': 'healthy',
            'service': 'auth_service'
        }, status=status.HTTP_200_OK)
