from django.db import models
import uuid


class Reclamation(models.Model):
    """
    Model for user complaints/reclamations about bins
    """
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('rejected', 'Rejected'),
    )
    
    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    )
    
    TYPE_CHOICES = (
        ('full', 'Bin is Full'),
        ('broken', 'Bin is Broken'),
        ('missing', 'Bin is Missing'),
        ('overflow', 'Bin Overflowing'),
        ('odor', 'Bad Odor'),
        ('other', 'Other'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_nfc_code = models.CharField(max_length=100, help_text="NFC code of the user submitting the reclamation")
    bin_id = models.UUIDField(null=True, blank=True, help_text="ID of the bin (if applicable)")
    reclamation_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='other')
    title = models.CharField(max_length=200)
    message = models.TextField(help_text="Detailed description of the issue")
    location = models.CharField(max_length=255, blank=True, help_text="Location description")
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    admin_notes = models.TextField(blank=True, help_text="Internal notes (not visible to user)")
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'reclamations'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.get_status_display()} ({self.created_at.date()})"
    
    def mark_resolved(self):
        """Mark reclamation as resolved"""
        from django.utils import timezone
        self.status = 'resolved'
        self.resolved_at = timezone.now()
        self.save(update_fields=['status', 'resolved_at', 'updated_at'])
    
    def mark_in_progress(self):
        """Mark reclamation as in progress"""
        self.status = 'in_progress'
        self.save(update_fields=['status', 'updated_at'])
