from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, PointsHistory


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'points', 'nfc_code', 'is_staff', 'created_at']
    list_filter = ['is_staff', 'is_superuser', 'is_active', 'created_at']
    search_fields = ['username', 'email', 'nfc_code']
    ordering = ['-created_at']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('SmartBin Info', {
            'fields': ('points', 'nfc_code', 'phone_number')
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']


@admin.register(PointsHistory)
class PointsHistoryAdmin(admin.ModelAdmin):
    list_display = ['user', 'amount', 'transaction_type', 'created_at']
    list_filter = ['transaction_type', 'created_at']
    search_fields = ['user__username', 'user__email', 'description']
    readonly_fields = ['created_at']
    ordering = ['-created_at']
