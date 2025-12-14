#!/bin/bash
# Cleanup database - Remove unnecessary tables, keep only essentials

set -e

echo "🧹 Cleaning up database..."

# Connect to MySQL and drop unnecessary tables
docker-compose exec -T mysql mysql -usmartbin_user -psmartbin_pass smartbin_db <<'EOF'
-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Drop Django auth group/permission tables (not needed if not using groups)
-- Drop in correct order to avoid FK constraint issues
DROP TABLE IF EXISTS auth_group_permissions;
DROP TABLE IF EXISTS auth_users_groups;
DROP TABLE IF EXISTS auth_users_user_permissions;
DROP TABLE IF EXISTS auth_group;
DROP TABLE IF EXISTS auth_permission;

-- Drop admin log (not essential)
DROP TABLE IF EXISTS django_admin_log;

-- Remove reclamation_attachments (not needed)
DROP TABLE IF EXISTS reclamation_attachments;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Keep these Django system tables (required):
-- django_content_type (required by Django)
-- django_migrations (required by Django)
-- django_session (required for sessions)

-- Keep these essential tables:
-- bins
-- auth_users
-- auth_points_history
-- bin_usage_logs
-- material_detections
-- detection_stats
-- reclamations
-- reclamation_attachments

SELECT '✅ Unnecessary tables dropped' AS status;
EOF

echo ""
echo "✅ Database cleanup complete!"
echo ""
echo "📊 Remaining tables:"
docker-compose exec -T mysql mysql -usmartbin_user -psmartbin_pass smartbin_db -e "SHOW TABLES;" | grep -v "Tables_in"
