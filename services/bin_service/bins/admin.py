from django.contrib import admin
from .models import Bin, BinUsageLog


@admin.register(Bin)
class BinAdmin(admin.ModelAdmin):
    list_display = ['name', 'location', 'status', 'capacity', 'fill_level', 'is_open', 'created_at']
    list_filter = ['status', 'is_open', 'created_at']
    search_fields = ['name', 'location', 'qr_code']
    readonly_fields = ['id', 'created_at', 'updated_at', 'last_opened_at', 'last_emptied_at']
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('id', 'name', 'qr_code', 'location', 'latitude', 'longitude')
        }),
        ('Status', {
            'fields': ('status', 'is_open', 'capacity', 'fill_level')
        }),
        ('Timestamps', {
            'fields': ('last_opened_at', 'last_emptied_at', 'created_at', 'updated_at')
        }),
    )


@admin.register(BinUsageLog)
class BinUsageLogAdmin(admin.ModelAdmin):
    list_display = ['bin', 'user_nfc_code', 'opened_at', 'closed_at', 'detection_completed']
    list_filter = ['detection_completed', 'opened_at']
    search_fields = ['bin__name', 'user_nfc_code']
    readonly_fields = ['id', 'opened_at']
    ordering = ['-opened_at']
