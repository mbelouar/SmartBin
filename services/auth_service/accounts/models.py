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
    points = models.IntegerField(default=0, help_text="Points earned from proper waste disposal")
    qr_code = models.CharField(
        max_length=100, 
        blank=True, 
        null=True, 
        unique=True,
        help_text="Unique QR code identifier for the user"
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
    
    def generate_qr_code(self):
        """Generate unique QR code for user if not exists"""
        if not self.qr_code:
            self.qr_code = f"SB-{self.id}"
            self.save(update_fields=['qr_code', 'updated_at'])
        return self.qr_code


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
