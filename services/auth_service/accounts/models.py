from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid


class User(AbstractUser):
    """
    Custom User model for SmartBin authentication.
    Extends Django's AbstractUser with additional fields for the smart bin system.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    clerk_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        unique=True,
        help_text="Clerk authentication ID for hybrid auth support"
    )
    points = models.IntegerField(default=5, help_text="Points earned from proper waste disposal (new users start with 5 points)")
    nfc_code = models.CharField(
        max_length=100, 
        blank=True, 
        null=True, 
        unique=True,
        help_text="Unique NFC code identifier for the user"
    )
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Make email required
    REQUIRED_FIELDS = ['email']
    
    class Meta:
        db_table = 'auth_users'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.username
    
    def add_points(self, amount):
        """Add points to user account"""
        self.points += amount
        self.save(update_fields=['points', 'updated_at'])
    
    def deduct_points(self, amount):
        """Deduct points from user account (for rewards redemption)"""
        if self.points >= amount:
            self.points -= amount
            self.save(update_fields=['points', 'updated_at'])
            return True
        return False
    
    def generate_nfc_code(self):
        """Generate unique NFC code for user if not exists"""
        if not self.nfc_code:
            self.nfc_code = f"SB-{self.id}"
            # Ensure new users start with 5 points if they have 0
            if self.points == 0:
                self.points = 5
            self.save(update_fields=['nfc_code', 'points', 'updated_at'])
        return self.nfc_code


class PointsHistory(models.Model):
    """
    Track points history for each user.
    """
    TRANSACTION_TYPES = (
        ('earned', 'Earned'),
        ('redeemed', 'Redeemed'),
        ('adjusted', 'Adjusted'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='points_history')
    amount = models.IntegerField()
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'auth_points_history'
        ordering = ['-created_at']
        verbose_name_plural = 'Points histories'
    
    def __str__(self):
        return f"{self.user.username} - {self.transaction_type} - {self.amount} points"
