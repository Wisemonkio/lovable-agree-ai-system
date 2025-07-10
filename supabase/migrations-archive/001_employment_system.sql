
-- Create employee_details table with auto-calculated salary fields
CREATE TABLE IF NOT EXISTS employee_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Personal Information
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  fathers_name VARCHAR(100),
  age INTEGER,
  address_line1 TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  
  -- Employment Information
  job_title VARCHAR(200) NOT NULL,
  joining_date DATE NOT NULL,
  client_name VARCHAR(200),
  manager_details TEXT,
  place VARCHAR(100),
  
  -- Salary Information (auto-calculated by database)
  annual_gross_salary DECIMAL(12,2) NOT NULL,
  annual_basic DECIMAL(12,2) GENERATED ALWAYS AS (annual_gross_salary / 2) STORED,
  annual_hra DECIMAL(12,2) GENERATED ALWAYS AS ((annual_gross_salary / 2) / 2) STORED,
  annual_lta DECIMAL(12,2) GENERATED ALWAYS AS ((annual_gross_salary / 2) / 5) STORED,
  yfbp DECIMAL(12,2) GENERATED ALWAYS AS (
    CASE WHEN annual_gross_salary <= 1275000 THEN 0 ELSE 169392 END
  ) STORED,
  annual_special_allowance DECIMAL(12,2) GENERATED ALWAYS AS (
    annual_gross_salary - (annual_gross_salary / 2) - ((annual_gross_salary / 2) / 2) - 
    ((annual_gross_salary / 2) / 5) - 
    CASE WHEN annual_gross_salary <= 1275000 THEN 0 ELSE 169392 END - 21600
  ) STORED,
  monthly_gross DECIMAL(12,2) GENERATED ALWAYS AS (annual_gross_salary / 12) STORED,
  monthly_basic DECIMAL(12,2) GENERATED ALWAYS AS ((annual_gross_salary / 2) / 12) STORED,
  monthly_hra DECIMAL(12,2) GENERATED ALWAYS AS (((annual_gross_salary / 2) / 2) / 12) STORED,
  monthly_special_allowance DECIMAL(12,2) GENERATED ALWAYS AS (
    (annual_gross_salary - (annual_gross_salary / 2) - ((annual_gross_salary / 2) / 2) - 
    ((annual_gross_salary / 2) / 5) - 
    CASE WHEN annual_gross_salary <= 1275000 THEN 0 ELSE 169392 END - 21600) / 12
  ) STORED,
  monthly_lta DECIMAL(12,2) GENERATED ALWAYS AS (((annual_gross_salary / 2) / 5) / 12) STORED,
  mfbp DECIMAL(12,2) GENERATED ALWAYS AS (
    CASE WHEN annual_gross_salary <= 1275000 THEN 0 ELSE 169392 / 12 END
  ) STORED,
  
  -- Agreement Status and URLs (populated by Edge Function)
  agreement_status VARCHAR(20) DEFAULT 'pending',
  pdf_url TEXT,
  doc_url TEXT,
  pdf_download_url TEXT,
  
  -- Processing timestamps
  processing_started_at TIMESTAMP WITH TIME ZONE,
  processing_completed_at TIMESTAMP WITH TIME ZONE
);

-- Generated agreements table for detailed tracking
CREATE TABLE IF NOT EXISTS generated_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employee_details(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Document information
  google_doc_id VARCHAR(100),
  google_doc_url TEXT,
  pdf_file_id VARCHAR(100),
  pdf_preview_url TEXT,
  pdf_download_url TEXT,
  
  -- Generation details
  generation_status VARCHAR(20) DEFAULT 'completed',
  file_name VARCHAR(255),
  processing_time_seconds INTEGER,
  
  -- Metadata
  placeholders_replaced JSONB,
  salary_breakdown JSONB
);

-- Function to call Edge Function asynchronously
CREATE OR REPLACE FUNCTION call_generate_agreement_edge_function()
RETURNS TRIGGER AS $$
DECLARE
  edge_function_url TEXT;
  payload JSONB;
BEGIN
  -- Set the Edge Function URL for current project
  edge_function_url := 'https://kzejmozxbhzkrbfmwmnx.supabase.co/functions/v1/generate-agreement';
  
  -- Create payload
  payload := jsonb_build_object('employee_id', NEW.id);
  
  -- Make async call to Edge Function using pg_net (if available)
  -- For now, we'll update status to processing and let the Edge Function handle the rest
  UPDATE employee_details 
  SET agreement_status = 'pending'
  WHERE id = NEW.id;
  
  -- In a real implementation, you would use pg_net.http_post to call the Edge Function
  -- PERFORM net.http_post(
  --   url := edge_function_url,
  --   headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.supabase_service_role_key', true) || '"}',
  --   body := payload::text
  -- );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that calls Edge Function after employee is created
DROP TRIGGER IF EXISTS after_employee_insert ON employee_details;
CREATE TRIGGER after_employee_insert
  AFTER INSERT ON employee_details
  FOR EACH ROW
  EXECUTE FUNCTION call_generate_agreement_edge_function();

-- Enable RLS
ALTER TABLE employee_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_agreements ENABLE ROW LEVEL SECURITY;

-- Create policies (for demo, allow all access)
DROP POLICY IF EXISTS "Allow all access to employee_details" ON employee_details;
CREATE POLICY "Allow all access to employee_details" ON employee_details FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all access to generated_agreements" ON generated_agreements;
CREATE POLICY "Allow all access to generated_agreements" ON generated_agreements FOR ALL USING (true);

-- Create storage bucket for PDFs (optional, for future use)
INSERT INTO storage.buckets (id, name, public)
VALUES ('employee-agreements', 'employee-agreements', true)
ON CONFLICT (id) DO NOTHING;

-- Policy for storage bucket
CREATE POLICY "Allow public access to employee agreements" ON storage.objects
FOR ALL USING (bucket_id = 'employee-agreements');
