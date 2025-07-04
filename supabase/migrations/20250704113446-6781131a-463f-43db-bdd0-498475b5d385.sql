
-- Update the generated columns in employee_details table to use 1440000 threshold instead of 1275000

-- Drop the existing generated columns first
ALTER TABLE employee_details 
DROP COLUMN IF EXISTS yfbp,
DROP COLUMN IF EXISTS annual_special_allowance,
DROP COLUMN IF EXISTS monthly_special_allowance,
DROP COLUMN IF EXISTS mfbp;

-- Recreate the columns with updated threshold (1440000 instead of 1275000)
ALTER TABLE employee_details 
ADD COLUMN yfbp DECIMAL(12,2) GENERATED ALWAYS AS (
  CASE WHEN annual_gross_salary <= 1440000 THEN 0 ELSE 169392 END
) STORED,
ADD COLUMN annual_special_allowance DECIMAL(12,2) GENERATED ALWAYS AS (
  annual_gross_salary - (annual_gross_salary / 2) - ((annual_gross_salary / 2) / 2) - 
  ((annual_gross_salary / 2) / 5) - 
  CASE WHEN annual_gross_salary <= 1440000 THEN 0 ELSE 169392 END - 21600
) STORED,
ADD COLUMN monthly_special_allowance DECIMAL(12,2) GENERATED ALWAYS AS (
  (annual_gross_salary - (annual_gross_salary / 2) - ((annual_gross_salary / 2) / 2) - 
  ((annual_gross_salary / 2) / 5) - 
  CASE WHEN annual_gross_salary <= 1440000 THEN 0 ELSE 169392 END - 21600) / 12
) STORED,
ADD COLUMN mfbp DECIMAL(12,2) GENERATED ALWAYS AS (
  CASE WHEN annual_gross_salary <= 1440000 THEN 0 ELSE 169392 / 12 END
) STORED;
