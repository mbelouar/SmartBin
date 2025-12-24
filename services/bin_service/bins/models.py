from django.db import models
import uuid
import random
import string


class Bin(models.Model):
    """
    Smart Bin model representing physical trash bins
    """
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('maintenance', 'Under Maintenance'),
        ('full', 'Full'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    qr_code = models.CharField(max_length=100, unique=True, help_text="Auto-generated unique bin ID", blank=True)
    nfc_tag_id = models.CharField(max_length=100, unique=True, help_text="Auto-generated NFC tag ID", blank=True)
    city = models.CharField(max_length=100, blank=True, help_text="City where the bin is located")
    location = models.CharField(max_length=255)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    capacity = models.IntegerField(default=100, help_text="Capacity in liters")
    fill_level = models.IntegerField(default=0, help_text="Current fill level percentage")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    is_open = models.BooleanField(default=False)
    last_opened_at = models.DateTimeField(null=True, blank=True)
    last_emptied_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'bins'
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        """
        Auto-generate QR code and NFC tag ID on creation
        Auto-set fill_level based on status changes:
        - If status is "full": set fill_level to 100%
        - If status changes FROM "full" to anything else: reset fill_level to 0%
        """
        if not self.qr_code:
            # Generate unique QR code like SB-ABC123
            prefix = 'SB-'
            unique_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            self.qr_code = f"{prefix}{unique_part}"
            
            # Ensure uniqueness
            while Bin.objects.filter(qr_code=self.qr_code).exists():
                unique_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
                self.qr_code = f"{prefix}{unique_part}"
        
        if not self.nfc_tag_id:
            # Generate unique NFC tag ID like NFC-1A2B3C4D5E6F
            prefix = 'NFC-'
            unique_part = ''.join(random.choices(string.hexdigits.upper(), k=12))
            self.nfc_tag_id = f"{prefix}{unique_part}"
            
            # Ensure uniqueness
            while Bin.objects.filter(nfc_tag_id=self.nfc_tag_id).exists():
                unique_part = ''.join(random.choices(string.hexdigits.upper(), k=12))
                self.nfc_tag_id = f"{prefix}{unique_part}"
        
        # Handle status changes and fill_level synchronization
        if self.pk:  # Only for existing bins (updates)
            try:
                old_bin = Bin.objects.get(pk=self.pk)
                old_status = old_bin.status
                
                # If status changed FROM "full" to something else, reset fill_level to 0
                if old_status == 'full' and self.status != 'full':
                    self.fill_level = 0
                # If status changed TO "full", set fill_level to 100
                elif self.status == 'full' and old_status != 'full':
                    self.fill_level = 100
            except Bin.DoesNotExist:
                # Shouldn't happen, but handle gracefully
                pass
        else:
            # For new bins, set fill_level based on initial status
            if self.status == 'full':
                self.fill_level = 100
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.name} ({self.location})"
    
    def open_bin(self):
        """Mark bin as open"""
        from django.utils import timezone
        self.is_open = True
        self.last_opened_at = timezone.now()
        self.save(update_fields=['is_open', 'last_opened_at', 'updated_at'])
    
    def close_bin(self):
        """Mark bin as closed"""
        self.is_open = False
        self.save(update_fields=['is_open', 'updated_at'])
    
    def update_fill_level(self, level):
        """
        Update fill level percentage
        """
        self.fill_level = level
        
        # Update status based on fill level
        if level >= 90:
            self.status = 'full'
        elif self.status == 'full' and level < 80:
            self.status = 'active'
        
        self.save(update_fields=['fill_level', 'status', 'updated_at'])
    
    def add_trash(self, liters=5.0):
        """
        Add trash to the bin and update fill level
        Default is 5 liters per trash deposit
        Calculates percentage based on liters and capacity
        Returns True if successful, False if bin is full
        """
        # Calculate percentage increase
        percentage_increase = int((liters / self.capacity) * 100)
        new_fill_level = self.fill_level + percentage_increase
        
        # Check if bin would be full
        if new_fill_level >= 100:
            self.fill_level = 100
            self.status = 'full'
            self.save(update_fields=['fill_level', 'status', 'updated_at'])
            return False  # Bin is now full
        else:
            self.fill_level = new_fill_level
            
            # Update status based on fill level
            if self.fill_level >= 90:
                self.status = 'full'
            elif self.status == 'full' and self.fill_level < 80:
                self.status = 'active'
            
            self.save(update_fields=['fill_level', 'status', 'updated_at'])
            return True
    
    def increase_capacity(self, additional_liters=10):
        """
        Increase bin capacity when user earns bonus points
        Default is 10 liters increase per bonus
        Fill level percentage stays the same, just more total capacity
        """
        self.capacity = int(self.capacity + additional_liters)
        
        # No need to recalculate fill_level - it stays the same percentage
        # Just update status if needed
        if self.fill_level >= 90:
            self.status = 'full'
        elif self.status == 'full' and self.fill_level < 80:
            self.status = 'active'
        
        self.save(update_fields=['capacity', 'status', 'updated_at'])
    
    def is_full(self):
        """Check if bin is at full capacity"""
        return self.fill_level >= 90 or self.status == 'full'
    
    def empty_bin(self):
        """Empty the bin (reset fill level to 0)"""
        self.fill_level = 0
        if self.status == 'full':
            self.status = 'active'
        from django.utils import timezone
        self.last_emptied_at = timezone.now()
        self.save(update_fields=['fill_level', 'status', 'last_emptied_at', 'updated_at'])


class BinUsageLog(models.Model):
    """
    Log every time a bin is used
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    bin = models.ForeignKey(Bin, on_delete=models.CASCADE, related_name='usage_logs')
    user_nfc_code = models.CharField(max_length=100, help_text="User's NFC code who used the bin")
    opened_at = models.DateTimeField(auto_now_add=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    detection_completed = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'bin_usage_logs'
        ordering = ['-opened_at']
    
    def __str__(self):
        return f"{self.bin.name} - {self.user_nfc_code} - {self.opened_at}"
    
    def complete_usage(self):
        """Mark usage as completed with detection"""
        from django.utils import timezone
        self.closed_at = timezone.now()
        self.detection_completed = True
        self.save(update_fields=['closed_at', 'detection_completed'])
