# How to Test Adding a Bin as Admin

## Prerequisites

1. **Ensure all services are running:**

   ```bash
   docker-compose ps
   ```

   All services should be "Up" and healthy.

2. **Verify test users exist:**
   ```bash
   python3 create_test_users.py
   ```
   Or if using Docker:
   ```bash
   docker-compose exec auth_service python manage.py shell < create_test_users.py
   ```

## Step-by-Step Testing Guide

### Method 1: Using the Frontend Admin Dashboard (Recommended)

#### Step 1: Get Authentication Token

You need to log in first to get a JWT token. You can do this via API:

**Option A: Using curl**

```bash
curl -X POST http://localhost:8001/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

This will return a response like:

```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@smartbin.com",
    "is_staff": true,
    "is_superuser": true,
    ...
  }
}
```

**Option B: Using the Browser Console**

1. Open your browser and go to `http://localhost:3000`
2. Open Developer Tools (F12)
3. Go to the Console tab
4. Run this JavaScript code:

```javascript
// Login as admin
fetch("http://localhost:8001/api/auth/login/", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    username: "admin",
    password: "admin123",
  }),
})
  .then((response) => response.json())
  .then((data) => {
    // Save token to localStorage
    localStorage.setItem("smartbin_token", data.access);
    localStorage.setItem("smartbin_user", JSON.stringify(data.user));
    console.log("✅ Logged in as admin!", data.user);
    console.log("Token saved to localStorage");
    // Reload the page
    window.location.reload();
  })
  .catch((error) => {
    console.error("❌ Login failed:", error);
  });
```

#### Step 2: Access Admin Dashboard

1. After logging in, navigate to: `http://localhost:3000/admin`
2. You should see the "Bin Management" dashboard
3. The "Add New Bin" button should now be enabled (not grayed out)

#### Step 3: Add a New Bin

1. Click the **"Add New Bin"** button
2. Fill in the form:
   - **Bin Name**: e.g., "Smart Bin #001"
   - **QR Code**: e.g., "SB-001"
   - **Location**: e.g., "Central Park, Main Street"
   - **Latitude/Longitude**:
     - Click on the map to select a location, OR
     - Manually enter coordinates (e.g., 40.7128, -74.0060 for New York)
   - **Capacity**: e.g., 100 (liters)
   - **Status**: Select "Active"
3. Click **"Create Bin"**
4. You should see a success message and the new bin will appear in the list

### Method 2: Using API Directly (curl/Postman)

#### Step 1: Get JWT Token

```bash
TOKEN=$(curl -X POST http://localhost:8001/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}' \
  | jq -r '.access')

echo "Token: $TOKEN"
```

#### Step 2: Create a Bin

```bash
curl -X POST http://localhost:8002/api/bins/list/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Smart Bin #001",
    "qr_code": "SB-001",
    "location": "Central Park, Main Street",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "capacity": 100,
    "status": "active"
  }'
```

### Method 3: Using Postman Collection

1. Import the `SmartBin_Postman_Collection.json` file into Postman
2. First, run the "Login (Admin)" request to get a token
3. Copy the `access` token from the response
4. Use it in the "Create Bin" request's Authorization header as `Bearer {token}`

## Troubleshooting

### Issue: "Authentication credentials were not provided"

**Solution**: You need to log in first and get a JWT token. Follow Step 1 above.

### Issue: "You are not authorized to perform this action"

**Solution**: Make sure you're logged in as an admin user (is_staff=True). Check:

```bash
docker-compose exec auth_service python manage.py shell
```

Then in the shell:

```python
from accounts.models import User
admin = User.objects.get(username='admin')
print(f"is_staff: {admin.is_staff}, is_superuser: {admin.is_superuser}")
```

If not admin, fix it:

```python
admin.is_staff = True
admin.is_superuser = True
admin.save()
```

### Issue: "Add New Bin" button is disabled

**Solution**:

1. Check if you're logged in by opening browser console and running:
   ```javascript
   console.log("Token:", localStorage.getItem("smartbin_token"));
   console.log(
     "User:",
     JSON.parse(localStorage.getItem("smartbin_user") || "{}")
   );
   ```
2. If no token, follow Step 1 to log in
3. If token exists but user is not admin, log in with admin credentials

### Issue: Can't access admin dashboard

**Solution**:

- Make sure frontend is running: `docker-compose ps frontend`
- Check frontend logs: `docker-compose logs frontend`
- Navigate to: `http://localhost:3000/admin` (not `/admin/`)

## Verification

After creating a bin, verify it was created:

1. **Check in Admin Dashboard**: The bin should appear in the list
2. **Check via API**:
   ```bash
   curl http://localhost:8002/api/bins/list/
   ```
3. **Check in phpMyAdmin**:
   - Go to `http://localhost:8080`
   - Login with: `smartbin_user` / `smartbin_pass`
   - Select database: `smartbin_db`
   - Check table: `bins_bin`

## Test Data Examples

Here are some example bins you can create:

```json
{
  "name": "Smart Bin #001",
  "qr_code": "SB-001",
  "location": "Central Park, New York",
  "latitude": 40.7829,
  "longitude": -73.9654,
  "capacity": 100,
  "status": "active"
}
```

```json
{
  "name": "Smart Bin #002",
  "qr_code": "SB-002",
  "location": "Times Square, New York",
  "latitude": 40.758,
  "longitude": -73.9855,
  "capacity": 150,
  "status": "active"
}
```

## Quick Test Script

Save this as `test_add_bin.sh`:

```bash
#!/bin/bash

# Login and get token
echo "Logging in as admin..."
TOKEN=$(curl -s -X POST http://localhost:8001/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}' \
  | jq -r '.access')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Login failed!"
  exit 1
fi

echo "✅ Logged in successfully!"

# Create bin
echo "Creating bin..."
RESPONSE=$(curl -s -X POST http://localhost:8002/api/bins/list/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Test Bin",
    "qr_code": "SB-TEST-001",
    "location": "Test Location",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "capacity": 100,
    "status": "active"
  }')

echo "Response: $RESPONSE"
```

Make it executable and run:

```bash
chmod +x test_add_bin.sh
./test_add_bin.sh
```
