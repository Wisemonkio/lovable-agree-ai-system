
-- Add new fields to employee_details table
ALTER TABLE employee_details 
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS address_line2 TEXT,
ADD COLUMN IF NOT EXISTS job_description TEXT,
ADD COLUMN IF NOT EXISTS last_date DATE;

-- Update existing data: rename place to address_line2 conceptually
-- (We'll handle the field mapping in the frontend)

-- Add index for better performance on new fields
CREATE INDEX IF NOT EXISTS idx_employee_details_last_date ON employee_details(last_date);
CREATE INDEX IF NOT EXISTS idx_employee_details_gender ON employee_details(gender);
