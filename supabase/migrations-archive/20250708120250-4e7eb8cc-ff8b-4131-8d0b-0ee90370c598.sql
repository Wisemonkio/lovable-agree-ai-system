-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.email
  );
  RETURN new;
END;
$$;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create employee_details table with auto-calculated salary fields
CREATE TABLE public.employee_details (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  job_title TEXT NOT NULL,
  job_description TEXT,
  annual_gross_salary DECIMAL(12,2) NOT NULL,
  bonus TEXT DEFAULT '0',
  joining_date DATE NOT NULL,
  last_date DATE,
  client_name TEXT,
  client_email TEXT,
  manager_details TEXT,
  fathers_name TEXT,
  age INTEGER,
  gender TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  place TEXT,
  aadhar TEXT,
  agreement_status TEXT DEFAULT 'pending' CHECK (agreement_status IN ('pending', 'processing', 'completed', 'failed')),
  pdf_url TEXT,
  doc_url TEXT,
  pdf_download_url TEXT,
  processing_started_at TIMESTAMP WITH TIME ZONE,
  processing_completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Zoho Sign columns
  zoho_sign_request_id TEXT,
  zoho_sign_document_id TEXT,
  zoho_sign_status TEXT CHECK (zoho_sign_status IS NULL OR zoho_sign_status IN ('sent', 'completed', 'declined', 'expired', 'failed')),
  signing_sent_at TIMESTAMPTZ,
  signing_completed_at TIMESTAMPTZ,
  zoho_sign_error TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add salary calculation columns (generated columns with updated threshold)
ALTER TABLE public.employee_details 
ADD COLUMN monthly_gross DECIMAL(12,2) GENERATED ALWAYS AS (annual_gross_salary / 12) STORED,
ADD COLUMN annual_basic DECIMAL(12,2) GENERATED ALWAYS AS (annual_gross_salary / 2) STORED,
ADD COLUMN annual_hra DECIMAL(12,2) GENERATED ALWAYS AS ((annual_gross_salary / 2) / 2) STORED,
ADD COLUMN annual_lta DECIMAL(12,2) GENERATED ALWAYS AS ((annual_gross_salary / 2) / 5) STORED,
ADD COLUMN yfbp DECIMAL(12,2) GENERATED ALWAYS AS (
  CASE WHEN annual_gross_salary <= 1440000 THEN 0 ELSE 169392 END
) STORED,
ADD COLUMN annual_special_allowance DECIMAL(12,2) GENERATED ALWAYS AS (
  annual_gross_salary - (annual_gross_salary / 2) - ((annual_gross_salary / 2) / 2) - 
  ((annual_gross_salary / 2) / 5) - 
  CASE WHEN annual_gross_salary <= 1440000 THEN 0 ELSE 169392 END - 21600
) STORED,
ADD COLUMN monthly_basic DECIMAL(12,2) GENERATED ALWAYS AS ((annual_gross_salary / 2) / 12) STORED,
ADD COLUMN monthly_hra DECIMAL(12,2) GENERATED ALWAYS AS (((annual_gross_salary / 2) / 2) / 12) STORED,
ADD COLUMN monthly_lta DECIMAL(12,2) GENERATED ALWAYS AS (((annual_gross_salary / 2) / 5) / 12) STORED,
ADD COLUMN monthly_special_allowance DECIMAL(12,2) GENERATED ALWAYS AS (
  (annual_gross_salary - (annual_gross_salary / 2) - ((annual_gross_salary / 2) / 2) - 
  ((annual_gross_salary / 2) / 5) - 
  CASE WHEN annual_gross_salary <= 1440000 THEN 0 ELSE 169392 END - 21600) / 12
) STORED,
ADD COLUMN mfbp DECIMAL(12,2) GENERATED ALWAYS AS (
  CASE WHEN annual_gross_salary <= 1440000 THEN 0 ELSE 169392 / 12 END
) STORED;

-- Add validation constraints
ALTER TABLE public.employee_details 
ADD CONSTRAINT valid_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE public.employee_details 
ADD CONSTRAINT valid_salary_range 
CHECK (annual_gross_salary > 0 AND annual_gross_salary <= 100000000);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employee_details_user_id ON employee_details(user_id);
CREATE INDEX IF NOT EXISTS idx_employee_details_zoho_request_id ON employee_details(zoho_sign_request_id);
CREATE INDEX IF NOT EXISTS idx_employee_details_zoho_status ON employee_details(zoho_sign_status);
CREATE INDEX IF NOT EXISTS idx_employee_details_last_date ON employee_details(last_date);
CREATE INDEX IF NOT EXISTS idx_employee_details_gender ON employee_details(gender);

-- Enable RLS on employee_details
ALTER TABLE public.employee_details ENABLE ROW LEVEL SECURITY;

-- Create policies for employee_details
CREATE POLICY "Users can view own employee details" ON public.employee_details
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own employee details" ON public.employee_details
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own employee details" ON public.employee_details
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own employee details" ON public.employee_details
  FOR DELETE USING (auth.uid() = user_id);

-- Create security function to ensure user_id is always set correctly
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
CREATE TRIGGER enforce_user_id_security
  BEFORE INSERT OR UPDATE ON employee_details
  FOR EACH ROW
  EXECUTE FUNCTION ensure_user_id_on_employee_details();

-- Create generated_agreements table
CREATE TABLE public.generated_agreements (
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

-- Enable RLS on generated_agreements
ALTER TABLE generated_agreements ENABLE ROW LEVEL SECURITY;

-- Create function to verify agreement access
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

-- Create policies for generated_agreements
CREATE POLICY "Users can view their own agreements" ON generated_agreements
FOR SELECT USING (verify_agreement_access(employee_id));

CREATE POLICY "Users can insert their own agreements" ON generated_agreements
FOR INSERT WITH CHECK (verify_agreement_access(employee_id));

-- Create company_agreement_templates table
CREATE TABLE public.company_agreement_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL UNIQUE,
  google_doc_id TEXT NOT NULL,
  google_doc_url TEXT NOT NULL,
  template_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users NOT NULL DEFAULT auth.uid(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.company_agreement_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for company templates
CREATE POLICY "Users can view all company templates" 
  ON public.company_agreement_templates 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create company templates" 
  ON public.company_agreement_templates 
  FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own company templates" 
  ON public.company_agreement_templates 
  FOR UPDATE 
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own company templates" 
  ON public.company_agreement_templates 
  FOR DELETE 
  USING (auth.uid() = created_by);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for company templates
CREATE TRIGGER update_company_agreement_templates_updated_at 
  BEFORE UPDATE ON public.company_agreement_templates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create employee signing status view
CREATE OR REPLACE VIEW employee_signing_status AS
SELECT 
    id,
    first_name,
    last_name,
    email,
    pdf_url,
    zoho_sign_request_id,
    zoho_sign_status,
    signing_sent_at,
    signing_completed_at,
    CASE 
        WHEN zoho_sign_status IS NULL THEN 'not_sent'
        WHEN zoho_sign_status = 'sent' THEN 'pending_signature'
        WHEN zoho_sign_status = 'completed' THEN 'signed'
        WHEN zoho_sign_status = 'failed' THEN 'error'
        ELSE zoho_sign_status
    END as display_status,
    CASE 
        WHEN pdf_url IS NULL THEN false
        ELSE true
    END as has_pdf,
    CASE 
        WHEN zoho_sign_request_id IS NOT NULL THEN true
        ELSE false
    END as sent_for_signing
FROM employee_details;

-- Create storage bucket for employee agreements
INSERT INTO storage.buckets (id, name, public)
VALUES ('employee-agreements', 'employee-agreements', true)
ON CONFLICT (id) DO NOTHING;

-- Policy for storage bucket
CREATE POLICY "Allow public access to employee agreements" ON storage.objects
FOR ALL USING (bucket_id = 'employee-agreements');

-- Enable realtime for employee_details table
ALTER TABLE employee_details REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE employee_details;