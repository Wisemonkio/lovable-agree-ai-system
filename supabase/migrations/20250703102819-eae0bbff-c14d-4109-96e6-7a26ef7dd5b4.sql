
-- Create the missing generated_agreements table
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

-- Enable RLS on generated_agreements
ALTER TABLE generated_agreements ENABLE ROW LEVEL SECURITY;

-- Create policies for generated_agreements
CREATE POLICY "Users can view their own agreements" ON generated_agreements
FOR SELECT USING (
  employee_id IN (
    SELECT id FROM employee_details WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own agreements" ON generated_agreements
FOR INSERT WITH CHECK (
  employee_id IN (
    SELECT id FROM employee_details WHERE user_id = auth.uid()
  )
);

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
