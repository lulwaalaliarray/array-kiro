-- Initialize PatientCare database
-- This script runs when the PostgreSQL container starts for the first time

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create database user if not exists
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'patientcare_user') THEN

      CREATE ROLE patientcare_user LOGIN PASSWORD 'patientcare_password';
   END IF;
END
$do$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE patientcare_db TO patientcare_user;
GRANT ALL ON SCHEMA public TO patientcare_user;