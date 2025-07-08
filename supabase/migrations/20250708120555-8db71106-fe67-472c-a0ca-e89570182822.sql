-- Create company_agreement_templates table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.company_agreement_templates (
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

-- Enable RLS on company_agreement_templates
ALTER TABLE public.company_agreement_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for company templates (with error handling)
DO $$
BEGIN
  -- Users can view all company templates
  BEGIN
    CREATE POLICY "Users can view all company templates" 
      ON public.company_agreement_templates 
      FOR SELECT 
      USING (true);
  EXCEPTION WHEN duplicate_object THEN
    NULL; -- Policy already exists
  END;

  -- Users can create company templates
  BEGIN
    CREATE POLICY "Users can create company templates" 
      ON public.company_agreement_templates 
      FOR INSERT 
      WITH CHECK (auth.uid() = created_by);
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  -- Users can update their own company templates
  BEGIN
    CREATE POLICY "Users can update their own company templates" 
      ON public.company_agreement_templates 
      FOR UPDATE 
      USING (auth.uid() = created_by);
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  -- Users can delete their own company templates
  BEGIN
    CREATE POLICY "Users can delete their own company templates" 
      ON public.company_agreement_templates 
      FOR DELETE 
      USING (auth.uid() = created_by);
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END
$$;

-- Create storage bucket for employee agreements if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('employee-agreements', 'employee-agreements', true)
ON CONFLICT (id) DO NOTHING;