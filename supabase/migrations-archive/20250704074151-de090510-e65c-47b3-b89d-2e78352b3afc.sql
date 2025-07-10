
-- Add client_email column to employee_details table
ALTER TABLE employee_details 
ADD COLUMN IF NOT EXISTS client_email TEXT;

-- Update the zoho_sign_status column to allow NULL values to match our TypeScript interface
ALTER TABLE employee_details 
DROP CONSTRAINT IF EXISTS employee_details_zoho_sign_status_check;

ALTER TABLE employee_details 
ADD CONSTRAINT employee_details_zoho_sign_status_check 
CHECK (zoho_sign_status IS NULL OR zoho_sign_status IN ('sent', 'completed', 'declined', 'expired', 'failed'));
