
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

-- Create policies
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

-- Create employee_details table (for the employment agreement system)
CREATE TABLE public.employee_details (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  job_title TEXT NOT NULL,
  annual_gross_salary DECIMAL(12,2) NOT NULL,
  monthly_gross DECIMAL(12,2) NOT NULL,
  annual_basic DECIMAL(12,2) NOT NULL,
  annual_hra DECIMAL(12,2) NOT NULL,
  annual_lta DECIMAL(12,2) NOT NULL,
  annual_special_allowance DECIMAL(12,2) NOT NULL,
  monthly_basic DECIMAL(12,2) NOT NULL,
  monthly_hra DECIMAL(12,2) NOT NULL,
  monthly_lta DECIMAL(12,2) NOT NULL,
  monthly_special_allowance DECIMAL(12,2) NOT NULL,
  yfbp DECIMAL(12,2) NOT NULL,
  mfbp DECIMAL(12,2) NOT NULL,
  joining_date DATE NOT NULL,
  client_name TEXT,
  manager_details TEXT,
  fathers_name TEXT,
  age INTEGER,
  address_line1 TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  place TEXT,
  agreement_status TEXT DEFAULT 'pending' CHECK (agreement_status IN ('pending', 'processing', 'completed', 'failed')),
  pdf_url TEXT,
  doc_url TEXT,
  pdf_download_url TEXT,
  processing_started_at TIMESTAMP WITH TIME ZONE,
  processing_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

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
