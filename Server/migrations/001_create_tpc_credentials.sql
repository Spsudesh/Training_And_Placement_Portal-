-- Migration: Create TPC_Credentials table and update Student_Credentials schema
-- Description: Add TPC credentials table and remove role column from Student_Credentials

-- Create TPC_Credentials table
CREATE TABLE IF NOT EXISTS TPC_Credentials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  department_name VARCHAR(100) NOT NULL,
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_department (department_name),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Remove role column from Student_Credentials if it exists
-- NOTE: Make sure to backup your data first!
-- ALTER TABLE Student_Credentials DROP COLUMN IF EXISTS role;

-- If you need to preserve existing student data with roles, you can instead add a check constraint:
-- ALTER TABLE Student_Credentials ADD CONSTRAINT chk_student_role CHECK (role = 'student');

-- For now, we recommend:
-- 1. Update all existing student records to have role = 'student' (if not already)
-- 2. Then run the ALTER to drop the role column

-- Sample data insertion for testing:
-- INSERT INTO TPC_Credentials (email, password, department_name, is_active)
-- VALUES ('tpc_cs@ritindia.edu', 'hashed_password_here', 'Computer Science', 1);
