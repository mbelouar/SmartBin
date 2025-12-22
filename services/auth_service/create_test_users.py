#!/usr/bin/env python
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'auth_service.settings')
django.setup()

from accounts.models import User
from django.contrib.auth.hashers import make_password

def create_test_users():
    print("Creating test users...")
    
    # Using stronger passwords
    admin_password = 'SmartBin@Admin2024!'
    user_password = 'SmartBin@User2024!'
    
    # Create admin user
    admin_email = 'admin@smartbin.com'
    admin_user, created = User.objects.get_or_create(
        email=admin_email,
        defaults={
            'username': 'admin',
            'first_name': 'Admin',
            'last_name': 'User',
            'password': make_password(admin_password),
            'is_staff': True,
            'is_superuser': True,
            'is_active': True
        }
    )
    
    if created:
        print(f"✅ Admin user created successfully!")
    else:
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.is_active = True
        admin_user.password = make_password(admin_password)
        admin_user.clerk_id = None  # Reset Clerk ID for re-sync
        admin_user.save()
        print(f"✅ Admin user updated!")
    
    print(f"   📧 Email: {admin_email}")
    print(f"   🔑 Password: {admin_password}")
    print(f"   👤 Username: {admin_user.username}")
    
    # Create normal user
    user_email = 'user@smartbin.com'
    normal_user, created = User.objects.get_or_create(
        email=user_email,
        defaults={
            'username': 'user',
            'first_name': 'Normal',
            'last_name': 'User',
            'password': make_password(user_password),
            'is_staff': False,
            'is_superuser': False,
            'is_active': True
        }
    )
    
    if created:
        print(f"\n✅ Normal user created successfully!")
    else:
        normal_user.is_staff = False
        normal_user.is_superuser = False
        normal_user.is_active = True
        normal_user.password = make_password(user_password)
        normal_user.clerk_id = None  # Reset Clerk ID for re-sync
        normal_user.save()
        print(f"\n✅ Normal user updated!")
    
    print(f"   📧 Email: {user_email}")
    print(f"   🔑 Password: {user_password}")
    print(f"   👤 Username: {normal_user.username}")
    
    print(f"\n📊 Total users in database: {User.objects.count()}")
    
    # List all users
    print("\n📋 All users:")
    for user in User.objects.all():
        role = "Admin" if user.is_superuser else "User"
        print(f"   • {user.username} ({user.email}) - {role}")

if __name__ == '__main__':
    create_test_users()
