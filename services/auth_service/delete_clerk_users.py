#!/usr/bin/env python
"""
Delete users from Clerk
"""
import os
import requests

# Clerk API configuration
CLERK_SECRET_KEY = os.environ.get('CLERK_SECRET_KEY', 'sk_test_SsMW9j9gVmBDdDidssxbmV82lERokmG4Gki44sKZNi')
CLERK_API_BASE = 'https://api.clerk.com/v1'

def delete_all_clerk_users():
    """Delete all users from Clerk"""
    headers = {
        'Authorization': f'Bearer {CLERK_SECRET_KEY}',
        'Content-Type': 'application/json'
    }
    
    try:
        # Get all users
        response = requests.get(
            f'{CLERK_API_BASE}/users',
            headers=headers,
            params={'limit': 100}
        )
        
        if response.status_code == 200:
            users = response.json()
            
            if not users:
                print("✅ No users found in Clerk")
                return
            
            print(f"Found {len(users)} users in Clerk")
            
            for user in users:
                user_id = user['id']
                email = user.get('email_addresses', [{}])[0].get('email_address', 'Unknown')
                
                # Delete user
                delete_response = requests.delete(
                    f'{CLERK_API_BASE}/users/{user_id}',
                    headers=headers
                )
                
                if delete_response.status_code == 200:
                    print(f"   ✅ Deleted: {email} (ID: {user_id})")
                else:
                    print(f"   ❌ Failed to delete: {email} - {delete_response.text}")
            
            print(f"\n✅ Cleanup complete!")
        else:
            print(f"❌ Error fetching users: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == '__main__':
    print("🗑️  Deleting all users from Clerk...\n")
    delete_all_clerk_users()
