#!/usr/bin/env python3
"""
Script to create test users for SmartBin
Creates an admin user and a regular client user
"""

import os
import sys
import django

# Add the auth_service directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'services', 'auth_service'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'auth_service.settings')
django.setup()

from accounts.models import User

def create_test_users():
    """Create admin and client test users"""
    
    # Create admin user
    admin_username = 'admin'
    admin_email = 'admin@smartbin.com'
    admin_password = 'admin123'
    
    if User.objects.filter(username=admin_username).exists():
        admin_user = User.objects.get(username=admin_username)
        admin_user.set_password(admin_password)
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.save()
        print(f"✓ Updated existing admin user: {admin_username}")
    else:
        admin_user = User.objects.create_user(
            username=admin_username,
            email=admin_email,
            password=admin_password,
            is_staff=True,
            is_superuser=True
        )
        print(f"✓ Created admin user: {admin_username}")
    
    print(f"  Email: {admin_email}")
    print(f"  Password: {admin_password}")
    print(f"  QR Code: {admin_user.qr_code}")
    print()
    
    # Create client user
    client_username = 'user'
    client_email = 'user@smartbin.com'
    client_password = 'user123'
    
    if User.objects.filter(username=client_username).exists():
        client_user = User.objects.get(username=client_username)
        client_user.set_password(client_password)
        client_user.save()
        print(f"✓ Updated existing client user: {client_username}")
    else:
        client_user = User.objects.create_user(
            username=client_username,
            email=client_email,
            password=client_password,
            is_staff=False,
            is_superuser=False
        )
        print(f"✓ Created client user: {client_username}")
    
    print(f"  Email: {client_email}")
    print(f"  Password: {client_password}")
    print(f"  QR Code: {client_user.qr_code}")
    print()
    
    print("=" * 50)
    print("Test Users Created Successfully!")
    print("=" * 50)
    print()
    print("Admin User:")
    print(f"  Username: {admin_username}")
    print(f"  Password: {admin_password}")
    print()
    print("Client User:")
    print(f"  Username: {client_username}")
    print(f"  Password: {client_password}")
    print()

if __name__ == '__main__':
    try:
        create_test_users()
    except Exception as e:
        print(f"Error creating users: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
