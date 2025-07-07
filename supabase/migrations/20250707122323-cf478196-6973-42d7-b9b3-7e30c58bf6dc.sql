
-- Critical Security Fix 1: Make user_id NOT NULL to prevent RLS bypass
-- This is essential for proper data isolation
ALTER TABLE employee_details 
ALTER COLUMN user_id SET NOT NULL;

-- Critical Security Fix 2: Set default value for user_id to current authenticated user
ALTER TABLE employee_details 
ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Critical Security Fix 3: Add trigger to ensure user_id is always set correctly
CREATE OR REPLACE FUNCTION ensure_user_id_on_employee_details()
RETURNS TRIGGER AS $$
BEGIN
  -- Always set user_id to the current authenticated user for new records
  IF TG_OP = 'INSERT' THEN
    NEW.user_id := auth.uid();
  END IF;
  
  -- Prevent users from modifying user_id to reference other users
  IF TG_OP = 'UPDATE' AND OLD.user_id != NEW.user_id THEN
    RAISE EXCEPTION 'Cannot change user_id - access denied';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to enforce user_id security
DROP TRIGGER IF EXISTS enforce_user_id_security ON employee_details;
CREATE TRIGGER enforce_user_id_security
  BEFORE INSERT OR UPDATE ON employee_details
  FOR EACH ROW
  EXECUTE FUNCTION ensure_user_id_on_employee_details();

-- Critical Security Fix 4: Add data validation constraints
ALTER TABLE employee_details 
ADD CONSTRAINT valid_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE employee_details 
ADD CONSTRAINT valid_salary_range 
CHECK (annual_gross_salary > 0 AND annual_gross_salary <= 100000000);

-- Critical Security Fix 5: Audit any existing records with NULL user_id
-- This will help identify data that needs cleanup
DO $$
DECLARE
    null_user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_user_count 
    FROM employee_details 
    WHERE user_id IS NULL;
    
    IF null_user_count > 0 THEN
        RAISE NOTICE 'WARNING: Found % employee records with NULL user_id that need manual review', null_user_count;
    END IF;
END $$;

-- Critical Security Fix 6: Strengthen generated_agreements RLS
-- Add additional validation to prevent cross-user data access
CREATE OR REPLACE FUNCTION verify_agreement_access(employee_record_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM employee_details 
    WHERE id = employee_record_id 
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Update generated_agreements policies to use the verification function
DROP POLICY IF EXISTS "Users can view their own agreements" ON generated_agreements;
CREATE POLICY "Users can view their own agreements" ON generated_agreements
FOR SELECT USING (verify_agreement_access(employee_id));

DROP POLICY IF EXISTS "Users can insert their own agreements" ON generated_agreements;
CREATE POLICY "Users can insert their own agreements" ON generated_agreements
FOR INSERT WITH CHECK (verify_agreement_access(employee_id));
