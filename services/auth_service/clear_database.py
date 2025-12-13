#!/usr/bin/env python3
"""
Script to clear application data from SmartBin database
Keeps Django system tables (migrations, content types, sessions, etc.)
Removes all application data (users, bins, detections, reclamations)

Run this inside the auth_service container:
  docker-compose exec auth_service python /app/clear_database.py
Or use the shell script wrapper: ./clear_database.sh
"""

import os
import sys
import django

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'auth_service.settings')
django.setup()

from django.db import connection
from django.contrib.contenttypes.models import ContentType
from accounts.models import User, PointsHistory
from bins.models import Bin, BinUsageLog
from detection.models import MaterialDetection
from reclamations.models import Reclamation

def clear_database():
    """Clear all application data while keeping Django system tables"""
    
    print("🗑️  Clearing SmartBin Database")
    print("=" * 50)
    print()
    
    # Show current data counts
    print("📊 Current Data:")
    print(f"   Users: {User.objects.count()}")
    print(f"   Bins: {Bin.objects.count()}")
    print(f"   Detections: {MaterialDetection.objects.count()}")
    print(f"   Reclamations: {Reclamation.objects.count()}")
    print(f"   Usage Logs: {BinUsageLog.objects.count()}")
    print(f"   Points History: {PointsHistory.objects.count()}")
    print()
    
    # Confirm
    confirm = input("⚠️  This will delete ALL application data. Continue? (yes/no): ")
    if confirm.lower() != 'yes':
        print("❌ Operation cancelled.")
        return
    
    print()
    print("🔄 Clearing application data...")
    
    # Clear in order (respecting foreign keys)
    try:
        # Clear dependent tables first
        print("   Clearing usage logs...")
        BinUsageLog.objects.all().delete()
        
        print("   Clearing points history...")
        PointsHistory.objects.all().delete()
        
        print("   Clearing detections...")
        MaterialDetection.objects.all().delete()
        
        print("   Clearing reclamations...")
        Reclamation.objects.all().delete()
        
        print("   Clearing bins...")
        Bin.objects.all().delete()
        
        print("   Clearing users...")
        User.objects.all().delete()
        
        # Reset auto-increment counters
        with connection.cursor() as cursor:
            cursor.execute("ALTER TABLE accounts_user AUTO_INCREMENT = 1")
            cursor.execute("ALTER TABLE bins_bin AUTO_INCREMENT = 1")
            cursor.execute("ALTER TABLE bins_binusagelog AUTO_INCREMENT = 1")
            cursor.execute("ALTER TABLE detection_materialdetection AUTO_INCREMENT = 1")
            cursor.execute("ALTER TABLE reclamations_reclamation AUTO_INCREMENT = 1")
            cursor.execute("ALTER TABLE accounts_pointshistory AUTO_INCREMENT = 1")
        
        print()
        print("✅ Database cleared successfully!")
        print()
        
        # Show final counts
        print("📊 Final Data:")
        print(f"   Users: {User.objects.count()}")
        print(f"   Bins: {Bin.objects.count()}")
        print(f"   Detections: {MaterialDetection.objects.count()}")
        print(f"   Reclamations: {Reclamation.objects.count()}")
        print(f"   Usage Logs: {BinUsageLog.objects.count()}")
        print(f"   Points History: {PointsHistory.objects.count()}")
        print()
        
        # Show preserved Django tables
        print("✅ Preserved Django System Tables:")
        print("   - django_migrations (migration history)")
        print("   - django_content_type (content types)")
        print("   - django_session (sessions)")
        print("   - auth_permission (permissions)")
        print("   - auth_group (groups)")
        print("   - django_admin_log (admin logs)")
        print()
        
        print("📝 Next steps:")
        print("   1. Create test users: python3 create_test_users.py")
        print("   2. Add bins through admin dashboard: http://localhost:3000/admin")
        print()
        
    except Exception as e:
        print(f"❌ Error clearing database: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    clear_database()
