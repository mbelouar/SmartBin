# SmartBin Database Schema

## Essential Tables

### Core Application Tables

1. **`bins`** - Smart bin information

   - Stores bin details (name, location, coordinates, status, NFC tag, QR code)
   - Auto-generates QR codes and NFC tags

2. **`auth_users`** - User accounts

   - Custom user model with points system
   - Stores user credentials, points, QR codes

3. **`auth_points_history`** - Points transaction history

   - Tracks all points earned/redeemed/adjusted
   - Links to users

4. **`bin_usage_logs`** - Bin usage tracking

   - Logs when bins are opened/closed
   - Tracks user interactions with bins

5. **`material_detections`** - Waste detection events

   - Records material type detected (plastic, paper, etc.)
   - Stores confidence scores and points awarded

6. **`detection_stats`** - Aggregated statistics

   - Daily statistics for material detections
   - Total counts by material type

7. **`reclamations`** - User complaints/reports

   - User-submitted issues about bins
   - Status tracking (pending, in_progress, resolved)

### Django System Tables (Required)

- **`django_content_type`** - Content type registry (required by Django)
- **`django_migrations`** - Migration tracking (required by Django)
- **`django_session`** - Session storage (required for user sessions)

## Removed Tables

The following tables were removed as they're not essential:

- ❌ `auth_group` - Django groups (not used)
- ❌ `auth_group_permissions` - Group permissions (not used)
- ❌ `auth_permission` - Django permissions (not used)
- ❌ `auth_users_groups` - User-group relationships (not used)
- ❌ `auth_users_user_permissions` - User permissions (not used)
- ❌ `django_admin_log` - Admin action log (not essential)
- ❌ `reclamation_attachments` - File attachments (not needed)

## Total Tables: 10

- 7 Application tables
- 3 Django system tables

## Cleanup Script

Run `./cleanup_database.sh` to remove unnecessary tables.
