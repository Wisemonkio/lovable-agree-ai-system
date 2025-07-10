
-- Add Zoho Sign columns to employee_details table
ALTER TABLE employee_details 
ADD COLUMN IF NOT EXISTS zoho_sign_request_id TEXT,
ADD COLUMN IF NOT EXISTS zoho_sign_document_id TEXT,
ADD COLUMN IF NOT EXISTS zoho_sign_status TEXT CHECK (zoho_sign_status IN ('sent', 'completed', 'declined', 'expired', 'failed')),
ADD COLUMN IF NOT EXISTS signing_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS signing_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS zoho_sign_error TEXT;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_employee_details_zoho_request_id ON employee_details(zoho_sign_request_id);
CREATE INDEX IF NOT EXISTS idx_employee_details_zoho_status ON employee_details(zoho_sign_status);

-- Create a view for easy querying of signing status
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
