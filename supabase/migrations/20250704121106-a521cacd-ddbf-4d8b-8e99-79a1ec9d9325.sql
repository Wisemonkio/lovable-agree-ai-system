
-- Update bonus field to support text input instead of numeric
ALTER TABLE employee_details ALTER COLUMN bonus TYPE text;

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

-- Create RLS policies
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

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_company_agreement_templates_updated_at 
  BEFORE UPDATE ON public.company_agreement_templates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
