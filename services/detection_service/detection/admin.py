from django.contrib import admin
from .models import MaterialDetection, DetectionStats


@admin.register(MaterialDetection)
class MaterialDetectionAdmin(admin.ModelAdmin):
    list_display = ['material_type', 'user_qr_code', 'bin_id', 'points_awarded', 'points_added_to_user', 'created_at']
    list_filter = ['material_type', 'points_added_to_user', 'created_at']
    search_fields = ['user_qr_code', 'bin_id']
    readonly_fields = ['id', 'created_at', 'points_awarded', 'points_added_to_user']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Detection Info', {
            'fields': ('id', 'bin_id', 'user_qr_code', 'material_type', 'confidence')
        }),
        ('Points', {
            'fields': ('points_awarded', 'points_added_to_user')
        }),
        ('Timestamp', {
            'fields': ('created_at',)
        }),
    )


@admin.register(DetectionStats)
class DetectionStatsAdmin(admin.ModelAdmin):
    list_display = ['date', 'total_detections', 'plastic_count', 'paper_count', 'glass_count', 'total_points_awarded']
    list_filter = ['date']
    readonly_fields = ['updated_at']
    ordering = ['-date']
