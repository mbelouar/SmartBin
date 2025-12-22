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
            
            # Ensure NFC code is generated and saved
            if not user.nfc_code:
                user.generate_nfc_code()
            
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


class UserByClerkIdView(APIView):
    """Get user by Clerk ID (for Clerk-authenticated users)"""
    permission_classes = [permissions.AllowAny]  # Allow Clerk-authenticated requests
    
    def get(self, request, clerk_id):
        """Get user by Clerk ID"""
        try:
            user = User.objects.get(clerk_id=clerk_id)
            return Response(UserSerializer(user).data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({
                'error': f'User not found with Clerk ID: {clerk_id}'
            }, status=status.HTTP_404_NOT_FOUND)


class AddPointsView(APIView):
    """Add points to a user (called by detection service)"""
    permission_classes = [permissions.AllowAny]  # Allow microservice-to-microservice communication
    
    def post(self, request):
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"💰 AddPointsView received request")
        logger.info(f"   Request data: {request.data}")
        
        serializer = AddPointsSerializer(data=request.data)
        if serializer.is_valid():
            user_id = serializer.validated_data['user_id']
            amount = serializer.validated_data['amount']
            description = serializer.validated_data.get('description', 'Points earned')
            
            logger.info(f"   Validated - user_id: {user_id}, amount: {amount}, description: {description}")
            
            try:
                user = None
                
                # First, check if user_id is a valid UUID
                try:
                    import uuid
                    uuid.UUID(str(user_id))
                    # It's a valid UUID, try to find by ID
                    logger.info(f"   Trying to find user by UUID: {user_id}")
                    try:
                        user = User.objects.get(id=user_id)
                        logger.info(f"   ✅ Found user by UUID: {user.username}")
                    except User.DoesNotExist:
                        logger.info(f"   ❌ User not found by UUID")
                        pass
                except (ValueError, AttributeError, TypeError):
                    # Not a UUID, skip ID lookup
                    logger.info(f"   Not a valid UUID, skipping UUID lookup")
                    pass
                
                # If not found by UUID, try NFC code
                if not user:
                    nfc_code = user_id if user_id.startswith('SB-') else f"SB-{user_id}"
                    logger.info(f"   Trying to find user by NFC code: {nfc_code}")
                    try:
                        user = User.objects.get(nfc_code=nfc_code)
                        logger.info(f"   ✅ Found user by NFC code: {user.username}")
                    except User.DoesNotExist:
                        logger.info(f"   ❌ User not found by NFC code")
                        pass
                
                # If still not found, try username
                # Strip "SB-" prefix if present for username lookup
                if not user:
                    username_to_try = user_id
                    if username_to_try.startswith('SB-'):
                        username_to_try = username_to_try[3:]  # Remove "SB-" prefix
                    logger.info(f"   Trying to find user by username: {username_to_try}")
                    try:
                        user = User.objects.get(username=username_to_try)
                        logger.info(f"   ✅ Found user by username: {user.username}")
                    except User.DoesNotExist:
                        logger.info(f"   ❌ User not found by username")
                        pass
                
                # If still not found, return error
                if not user:
                    logger.error(f"❌ User not found after all lookup attempts: {user_id}")
                    # Log all users in database for debugging
                    all_users = User.objects.all().values_list('id', 'username', 'nfc_code', 'clerk_id')
                    logger.error(f"   Available users in database:")
                    for u in all_users:
                        logger.error(f"     - ID: {u[0]}, Username: {u[1]}, NFC: {u[2]}, Clerk: {u[3]}")
                    return Response({
                        'error': f'User not found: {user_id} (tried UUID, NFC code, and username)'
                    }, status=status.HTTP_404_NOT_FOUND)
                
                logger.info(f"   Adding {amount} points to user {user.username} (current: {user.points})")
                user.add_points(amount)
                logger.info(f"   ✅ Points added! New balance: {user.points}")
                
                # Log the transaction
                history = PointsHistory.objects.create(
                    user=user,
                    amount=amount,
                    transaction_type='earned',
                    description=description
                )
                logger.info(f"   ✅ Points history created: {history.id}")
                
                return Response({
                    'message': 'Points added successfully',
                    'user': UserSerializer(user).data,
                    'points_added': amount,
                    'total_points': user.points
                }, status=status.HTTP_200_OK)
            except Exception as e:
                import traceback
                logger.error(f"❌ Exception in AddPointsView: {e}")
                traceback.print_exc()
                return Response({
                    'error': f'Error adding points: {str(e)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        logger.error(f"❌ Serializer validation failed: {serializer.errors}")
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


class ClerkSyncView(APIView):
    """Sync Clerk users with Django backend (called by webhook)"""
    permission_classes = [permissions.AllowAny]  # Webhook endpoint
    
    def post(self, request):
        """
        Sync user data from Clerk webhook
        Expected payload:
        {
            "clerk_id": "user_xxx",
            "email": "user@example.com",
            "username": "username",
            "first_name": "John",
            "last_name": "Doe",
            "event_type": "user.created" or "user.updated"
        }
        """
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"🔔 ClerkSyncView called with data: {request.data}")
        
        clerk_id = request.data.get('clerk_id')
        email = request.data.get('email')
        username = request.data.get('username')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        event_type = request.data.get('event_type', 'user.created')
        
        logger.info(f"📝 Parsed data - clerk_id: {clerk_id}, email: {email}, username: {username}, event_type: {event_type}")
        
        if not clerk_id:
            logger.error(f"❌ Missing required field - clerk_id: {clerk_id}")
            return Response({
                'error': 'clerk_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate email if not provided (for users created without email in Clerk)
        if not email:
            email = f"{username}@clerk.local" if username else f"user_{clerk_id[-8:]}@clerk.local"
            logger.info(f"📧 Generated email for user without email: {email}")
        
        try:
            # Try to find existing user by Clerk ID first
            user = None
            try:
                user = User.objects.get(clerk_id=clerk_id)
            except User.DoesNotExist:
                # For new Clerk users (user.created), always create a new Django user
                # even if email exists, to ensure they start with 5 points
                # For updates (user.updated), we can link to existing users
                if event_type == 'user.created':
                    # Don't link to existing users for new Clerk accounts
                    # This ensures each new Clerk user gets 5 starting points
                    pass
                else:
                    # For updates, try to find by email to link existing user
                    try:
                        user = User.objects.get(email=email)
                        # Link existing user to Clerk if they don't have a clerk_id
                        if not user.clerk_id:
                            user.clerk_id = clerk_id
                            user.save()
                    except User.DoesNotExist:
                        pass
            
            if user:
                # Update existing user
                # Check if this is a new Clerk account being linked to an existing user
                # If the existing user already has a clerk_id, this is a different Clerk account
                # and we should create a new user instead of linking
                if user.clerk_id and user.clerk_id != clerk_id:
                    # Existing user has a different Clerk ID, create new user instead
                    # This prevents linking multiple Clerk accounts to the same Django user
                    user = None
                else:
                    # Link existing user to this Clerk account
                    user.email = email
                    if username:
                        user.username = username
                    if first_name:
                        user.first_name = first_name
                    if last_name:
                        user.last_name = last_name
                    
                    # If this is a new Clerk account (user.created) and user doesn't have clerk_id yet,
                    # ensure they start with at least 5 points (but don't reset if they have more)
                    if event_type == 'user.created' and not user.clerk_id and user.points < 5:
                        user.points = 5
                    
                    if not user.clerk_id:
                        user.clerk_id = clerk_id
                    
                    user.save()
                    
                    return Response({
                        'message': 'User updated successfully',
                        'user': UserSerializer(user).data
                    }, status=status.HTTP_200_OK)
            
            # If we get here, either no user was found, or we need to create a new one
            if not user:
                # Create new user
                # Ensure username is unique
                base_username = username or email.split('@')[0]
                unique_username = base_username
                counter = 1
                while User.objects.filter(username=unique_username).exists():
                    unique_username = f"{base_username}{counter}"
                    counter += 1
                
                # Ensure email is unique (if email already exists, append counter)
                unique_email = email
                email_counter = 1
                while User.objects.filter(email=unique_email).exists():
                    # Extract email parts
                    email_parts = email.split('@')
                    unique_email = f"{email_parts[0]}+{email_counter}@{email_parts[1]}"
                    email_counter += 1
                
                import logging
                logger = logging.getLogger(__name__)
                
                logger.info(f"✨ Creating new user - email: {unique_email}, username: {unique_username}, clerk_id: {clerk_id}")
                
                user = User.objects.create(
                    clerk_id=clerk_id,
                    email=unique_email,
                    username=unique_username,
                    first_name=first_name,
                    last_name=last_name,
                    points=5,  # Explicitly set to 5 for new Clerk users
                )
                
                logger.info(f"✅ User created successfully - ID: {user.id}, username: {user.username}, email: {user.email}, points: {user.points}")
                
                # Generate NFC code for the new user
                user.generate_nfc_code()
                
                return Response({
                    'message': 'User created successfully',
                    'user': UserSerializer(user).data
                }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({
                'error': f'Error syncing user: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
