# Login and Test Admin Bin Creation

## Quick Start Guide

### Step 1: Start the Application

Make sure all services are running:

```bash
docker-compose ps
```

If not running:

```bash
docker-compose up -d
```

### Step 2: Access the Application

Open your browser and go to:

```
http://localhost:3000
```

### Step 3: Login

1. Click the **"Login"** button in the top-right corner
2. You'll be redirected to the login page: `http://localhost:3000/login`
3. You have two options:

**Option A: Quick Fill (Recommended)**

- Click the **"Admin"** button to auto-fill admin credentials
- Click **"Sign In"**

**Option B: Manual Entry**

- Username: `admin`
- Password: `admin123`
- Click **"Sign In"**

### Step 4: Verify Login

After successful login, you should:

- See your username in the top-right corner
- See an **"Admin"** button (because you're logged in as admin)
- Be automatically redirected to the admin dashboard

### Step 5: Add a New Bin

1. If not already there, click the **"Admin"** button to go to the admin dashboard

   - Or navigate directly to: `http://localhost:3000/admin`

2. Click **"Add New Bin"** button (it should now be enabled)

3. Fill in the form:

   - **Bin Name**: e.g., "Smart Bin #001"
   - **QR Code**: e.g., "SB-001"
   - **Location**: e.g., "Central Park, Main Street"
   - **Coordinates**:
     - Click on the map to select a location, OR
     - Manually enter:
       - Latitude: `40.7128`
       - Longitude: `-74.0060`
   - **Capacity**: `100` (liters)
   - **Status**: Select "Active"

4. Click **"Create Bin"**

5. You should see:
   - A success message
   - The form closes
   - Your new bin appears in the list below

### Step 6: Verify the Bin

**In the Admin Dashboard:**

- Scroll down to see all bins
- Your new bin should be visible

**In the Main Dashboard:**

- Click **"Home"** button
- Go to **"Dashboard"** or **"Map View"**
- Your new bin should appear

**In phpMyAdmin:**

1. Open `http://localhost:8080`
2. Login:
   - Username: `smartbin_user`
   - Password: `smartbin_pass`
3. Select database: `smartbin_db`
4. Click on table: `bins_bin`
5. Your bin should be in the list

## Test Credentials

### Admin Account

- **Username**: `admin`
- **Password**: `admin123`
- **Permissions**: Can create, edit, and delete bins

### Regular User Account

- **Username**: `user`
- **Password**: `user123`
- **Permissions**: Can view bins only (cannot create/edit/delete)

## Features

### When Logged In:

- ✅ See your username in the header
- ✅ Access admin dashboard (if you're an admin)
- ✅ Create new bins (admin only)
- ✅ Delete bins (admin only)
- ✅ Logout button

### When Not Logged In:

- ❌ Cannot access admin features
- ❌ "Add New Bin" button is disabled
- ✅ Can still view bins on the map and dashboard

## Troubleshooting

### Issue: Login button doesn't appear

**Solution**: Refresh the page (`Cmd+R` or `F5`)

### Issue: Still shows "Authentication Required" after login

**Solution**:

1. Check if you're actually logged in by opening the browser console (F12)
2. Run: `console.log(localStorage.getItem('smartbin_token'))`
3. If null, log in again
4. Refresh the page after logging in

### Issue: "Add New Bin" button is still disabled after login

**Solution**:

1. Make sure you logged in as `admin` (not `user`)
2. Check your user info in the header - it should say "(Admin)"
3. Refresh the page

### Issue: Cannot access /login or /admin pages

**Solution**:

- Make sure frontend is running: `docker-compose ps frontend`
- Check frontend logs: `docker-compose logs frontend --tail=50`
- Restart frontend: `docker-compose restart frontend`

### Issue: Login fails with "Invalid credentials"

**Solution**:

- Make sure test users exist by running:
  ```bash
  python3 create_test_users.py
  ```
- Or check in phpMyAdmin if users exist in `accounts_user` table

## Complete Flow Example

```
1. Open http://localhost:3000
   └─> See "Login" button

2. Click "Login" button
   └─> Redirected to /login page

3. Click "Admin" quick fill button
   └─> Form fills with: admin / admin123

4. Click "Sign In"
   └─> Success! Redirected to /admin
   └─> Header shows: "admin (Admin)"

5. Click "Add New Bin"
   └─> Form appears

6. Fill in:
   - Name: Smart Bin #001
   - QR Code: SB-001
   - Location: Central Park
   - Click on map at your preferred location
   - Capacity: 100
   - Status: Active

7. Click "Create Bin"
   └─> Success message appears
   └─> Form closes
   └─> New bin appears in the list

8. Click "Home" button
   └─> Return to main dashboard
   └─> See your new bin on the map!

9. Click "Logout" when done
   └─> Logged out
   └─> "Login" button appears again
```

## API Endpoints Used

- **Login**: `POST http://localhost:8001/api/auth/login/`
- **Create Bin**: `POST http://localhost:8002/api/bins/list/`
- **List Bins**: `GET http://localhost:8002/api/bins/list/`
- **Delete Bin**: `DELETE http://localhost:8002/api/bins/list/{id}/`

## Next Steps

After successfully creating a bin:

1. Test opening/closing the bin using the QR code
2. Simulate waste detection
3. Monitor bin fill levels
4. Create reclamation requests
5. Track eco points earned

Enjoy testing SmartBin! 🌱
