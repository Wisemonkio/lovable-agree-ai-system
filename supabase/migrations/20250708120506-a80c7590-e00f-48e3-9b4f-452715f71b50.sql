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

-- Create RLS policies for company templates
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'company_agreement_templates' AND policyname = 'Users can view all company templates') THEN
    CREATE POLICY "Users can view all company templates" 
      ON public.company_agreement_templates 
      FOR SELECT 
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'company_agreement_templates' AND policyname = 'Users can create company templates') THEN
    CREATE POLICY "Users can create company templates" 
      ON public.company_agreement_templates 
      FOR INSERT 
      WITH CHECK (auth.uid() = created_by);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'company_agreement_templates' AND policyname = 'Users can update their own company templates') THEN
    CREATE POLICY "Users can update their own company templates" 
      ON public.company_agreement_templates 
      FOR UPDATE 
      USING (auth.uid() = created_by);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'company_agreement_templates' AND policyname = 'Users can delete their own company templates') THEN
    CREATE POLICY "Users can delete their own company templates" 
      ON public.company_agreement_templates 
      FOR DELETE 
      USING (auth.uid() = created_by);
  END IF;
END
$$;

-- Create trigger for company templates if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_company_agreement_templates_updated_at') THEN
    CREATE TRIGGER update_company_agreement_templates_updated_at 
      BEFORE UPDATE ON public.company_agreement_templates 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;

-- Create storage bucket for employee agreements if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('employee-agreements', 'employee-agreements', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.policies WHERE name = 'Allow public access to employee agreements') THEN
    CREATE POLICY "Allow public access to employee agreements" ON storage.objects
    FOR ALL USING (bucket_id = 'employee-agreements');
  END IF;
END
$$;