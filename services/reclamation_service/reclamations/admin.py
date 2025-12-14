from django.contrib import admin
from .models import Reclamation


@admin.register(Reclamation)
class ReclamationAdmin(admin.ModelAdmin):
    list_display = ['title', 'reclamation_type', 'user_qr_code', 'status', 'priority', 'created_at']
    list_filter = ['status', 'priority', 'reclamation_type', 'created_at']
    search_fields = ['title', 'message', 'user_qr_code']
    readonly_fields = ['id', 'created_at', 'updated_at', 'resolved_at']
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('id', 'user_qr_code', 'bin_id', 'reclamation_type', 'title', 'message')
        }),
        ('Location', {
            'fields': ('location', 'latitude', 'longitude')
        }),
        ('Status', {
            'fields': ('status', 'priority', 'admin_notes', 'resolved_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    actions = ['mark_as_resolved', 'mark_as_in_progress', 'set_high_priority']
    
    def mark_as_resolved(self, request, queryset):
        """Admin action to mark selected reclamations as resolved"""
        for reclamation in queryset:
            reclamation.mark_resolved()
        self.message_user(request, f"{queryset.count()} reclamations marked as resolved.")
    mark_as_resolved.short_description = "Mark selected reclamations as resolved"
    
    def mark_as_in_progress(self, request, queryset):
        """Admin action to mark selected reclamations as in progress"""
        queryset.update(status='in_progress')
        self.message_user(request, f"{queryset.count()} reclamations marked as in progress.")
    mark_as_in_progress.short_description = "Mark selected reclamations as in progress"
    
    def set_high_priority(self, request, queryset):
        """Admin action to set priority to high"""
        queryset.update(priority='high')
        self.message_user(request, f"{queryset.count()} reclamations set to high priority.")
    set_high_priority.short_description = "Set selected reclamations to high priority"
