from django.db import models
import uuid


class MaterialDetection(models.Model):
    """
    Model to log material detection events from smart bins
    """
    MATERIAL_CHOICES = (
        ('plastic', 'Plastic'),
        ('paper', 'Paper'),
        ('glass', 'Glass'),
        ('metal', 'Metal'),
        ('organic', 'Organic'),
        ('other', 'Other'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    bin_id = models.UUIDField(help_text="ID of the bin where detection occurred")
    user_qr_code = models.CharField(max_length=100, help_text="QR code of the user")
    material_type = models.CharField(max_length=20, choices=MATERIAL_CHOICES)
    confidence = models.FloatField(default=0.0, help_text="Detection confidence (0-1)")
    points_awarded = models.IntegerField(default=0)
    points_added_to_user = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'material_detections'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.material_type} - {self.user_qr_code} - {self.created_at}"
    
    def award_points(self):
        """
        Award points to user via Auth Service
        Returns True if successful, False otherwise
        """
        if self.points_added_to_user:
            return True  # Already awarded
        
        from .utils import add_points_to_user
        from django.conf import settings
        
        # Get points for this material type
        points = settings.POINTS_CONFIG.get(self.material_type, 5)
        
        # Add points via Auth Service
        success = add_points_to_user(
            user_qr_code=self.user_qr_code,
            points=points,
            description=f"Detected {self.material_type} waste"
        )
        
        if success:
            self.points_awarded = points
            self.points_added_to_user = True
            self.save(update_fields=['points_awarded', 'points_added_to_user'])
            return True
        
        return False


class DetectionStats(models.Model):
    """
    Aggregated statistics for material detection
    """
    date = models.DateField(unique=True)
    total_detections = models.IntegerField(default=0)
    plastic_count = models.IntegerField(default=0)
    paper_count = models.IntegerField(default=0)
    glass_count = models.IntegerField(default=0)
    metal_count = models.IntegerField(default=0)
    organic_count = models.IntegerField(default=0)
    other_count = models.IntegerField(default=0)
    total_points_awarded = models.IntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'detection_stats'
        ordering = ['-date']
        verbose_name_plural = 'Detection statistics'
    
    def __str__(self):
        return f"Stats for {self.date}"
