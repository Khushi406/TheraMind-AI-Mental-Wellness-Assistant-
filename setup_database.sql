-- TheraMind Database Setup Script
-- Run this script to set up your local PostgreSQL database
-- Created by Khushi

-- Connect to PostgreSQL and run these commands:

-- 1. Create the TheraMind database (if it doesn't exist)
CREATE DATABASE theramind_db;

-- 2. Connect to the theramind_db database and create a user
-- (You can run this after connecting to theramind_db)

-- Create a dedicated user for TheraMind (optional but recommended)
CREATE USER theramind_user WITH PASSWORD 'theramind_password_123';

-- Grant privileges to the user
GRANT ALL PRIVILEGES ON DATABASE theramind_db TO theramind_user;

-- Connect to theramind_db and grant schema permissions
\c theramind_db;
GRANT ALL PRIVILEGES ON SCHEMA public TO theramind_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO theramind_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO theramind_user;

-- Show confirmation
SELECT 'TheraMind database setup complete!' as status;