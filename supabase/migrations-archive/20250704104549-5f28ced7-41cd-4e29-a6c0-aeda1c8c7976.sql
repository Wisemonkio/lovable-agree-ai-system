
-- Add bonus column to employee_details table
ALTER TABLE public.employee_details 
ADD COLUMN bonus numeric DEFAULT 0;
