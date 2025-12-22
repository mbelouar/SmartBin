#!/usr/bin/env python
"""
Sync Django users to Clerk
This script takes existing Django users and creates them in Clerk
"""
import os
import sys
import django
import requests

# Setup Django
sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'auth_service.settings')
django.setup()

from accounts.models import User

# Clerk API configuration
CLERK_SECRET_KEY = os.environ.get('CLERK_SECRET_KEY', 'sk_test_SsMW9j9gVmBDdDidssxbmV82lERokmG4Gki44sKZNi')
CLERK_API_BASE = 'https://api.clerk.com/v1'

def create_clerk_user(user, password):
    """Create a user in Clerk"""
    headers = {
        'Authorization': f'Bearer {CLERK_SECRET_KEY}',
        'Content-Type': 'application/json'
    }
    
    # Create user in Clerk
    data = {
        'email_address': [user.email],
        'username': user.username,
        'first_name': user.first_name or '',
        'last_name': user.last_name or '',
        'password': password,
        'skip_password_checks': True,
        'skip_password_requirement': False,
        'public_metadata': {
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
            'django_user_id': str(user.id)  # Convert UUID to string
        }
    }
    
    try:
        response = requests.post(
            f'{CLERK_API_BASE}/users',
            headers=headers,
            json=data
        )
        
        if response.status_code == 200:
            clerk_user = response.json()
            clerk_id = clerk_user['id']
            
            # Update Django user with Clerk ID
            user.clerk_id = clerk_id
            user.save()
            
            return True, clerk_id
        elif response.status_code == 422:
            # User might already exist, try to find them
            search_response = requests.get(
                f'{CLERK_API_BASE}/users',
                headers=headers,
                params={'email_address': user.email}
            )
            
            if search_response.status_code == 200:
                users = search_response.json()
                if users and len(users) > 0:
                    clerk_id = users[0]['id']
                    user.clerk_id = clerk_id
                    user.save()
                    return True, clerk_id
            
            return False, f"User exists but couldn't retrieve: {response.text}"
        else:
            return False, f"Error: {response.status_code} - {response.text}"
            
    except Exception as e:
        return False, str(e)

def sync_users_to_clerk():
    """Sync all Django users to Clerk"""
    print("🔄 Syncing Django users to Clerk...\n")
    
    users = User.objects.all()
    
    if not users.exists():
        print("❌ No users found in Django database!")
        return
    
    # User credentials mapping (you need to know the passwords)
    # Using stronger passwords that won't be flagged as compromised
    user_passwords = {
        'admin@smartbin.com': 'SmartBin@Admin2024!',
        'user@smartbin.com': 'SmartBin@User2024!'
    }
    
    success_count = 0
    error_count = 0
    
    for user in users:
        password = user_passwords.get(user.email)
        
        if not password:
            print(f"⚠️  Skipping {user.email} - no password provided")
            continue
        
        print(f"Processing: {user.email} ({user.username})...")
        
        success, result = create_clerk_user(user, password)
        
        if success:
            print(f"   ✅ Created in Clerk with ID: {result}")
            print(f"   📧 Email: {user.email}")
            print(f"   🔑 Password: {password}")
            print(f"   👤 Username: {user.username}")
            if user.is_superuser:
                print(f"   🛡️  Role: Admin (superuser)")
            elif user.is_staff:
                print(f"   🛡️  Role: Staff")
            else:
                print(f"   🛡️  Role: Regular User")
            print()
            success_count += 1
        else:
            print(f"   ❌ Failed: {result}\n")
            error_count += 1
    
    print(f"\n{'='*60}")
    print(f"📊 Sync Summary:")
    print(f"   ✅ Successfully synced: {success_count}")
    print(f"   ❌ Failed: {error_count}")
    print(f"   📝 Total processed: {success_count + error_count}")
    print(f"{'='*60}\n")
    
    if success_count > 0:
        print("🎉 You can now sign in at: http://localhost:3000/sign-in")
        print("\n📋 Test Credentials:")
        print("   Admin User:")
        print("   • Email: admin@smartbin.com")
        print("   • Password: SmartBin@Admin2024!")
        print("\n   Normal User:")
        print("   • Email: user@smartbin.com")
        print("   • Password: SmartBin@User2024!")

if __name__ == '__main__':
    sync_users_to_clerk()
