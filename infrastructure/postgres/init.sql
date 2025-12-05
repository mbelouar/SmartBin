-- PostgreSQL initialization script for SmartBin
-- This creates the initial database structure

-- Create the main database (already done by docker-compose env vars)
-- CREATE DATABASE smartbin_db;

-- Connect to the database
\c smartbin_db;

-- Enable UUID extension (useful for unique identifiers)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create schemas for each microservice (optional, helps organize tables)
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS bins;
CREATE SCHEMA IF NOT EXISTS detection;
CREATE SCHEMA IF NOT EXISTS reclamation;

-- Grant permissions
GRANT ALL PRIVILEGES ON SCHEMA auth TO smartbin_user;
GRANT ALL PRIVILEGES ON SCHEMA bins TO smartbin_user;
GRANT ALL PRIVILEGES ON SCHEMA detection TO smartbin_user;
GRANT ALL PRIVILEGES ON SCHEMA reclamation TO smartbin_user;

-- Set default search path
ALTER DATABASE smartbin_db SET search_path TO public, auth, bins, detection, reclamation;

-- Create initial system user (optional)
-- Tables will be created by Django migrations

COMMENT ON SCHEMA auth IS 'Authentication and user management';
COMMENT ON SCHEMA bins IS 'Smart bin management and operations';
COMMENT ON SCHEMA detection IS 'Material detection and logging';
COMMENT ON SCHEMA reclamation IS 'User complaints and reclamations';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'SmartBin database initialized successfully!';
END $$;
