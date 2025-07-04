export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      employee_details: {
        Row: {
          aadhar: string | null
          address_line1: string | null
          address_line2: string | null
          age: number | null
          agreement_status: string | null
          annual_basic: number
          annual_gross_salary: number
          annual_hra: number
          annual_lta: number
          annual_special_allowance: number | null
          bonus: number | null
          city: string | null
          client_email: string | null
          client_name: string | null
          created_at: string
          doc_url: string | null
          email: string
          fathers_name: string | null
          first_name: string
          gender: string | null
          id: string
          job_description: string | null
          job_title: string
          joining_date: string
          last_date: string | null
          last_name: string
          manager_details: string | null
          mfbp: number | null
          monthly_basic: number
          monthly_gross: number
          monthly_hra: number
          monthly_lta: number
          monthly_special_allowance: number | null
          pdf_download_url: string | null
          pdf_url: string | null
          pincode: string | null
          place: string | null
          processing_completed_at: string | null
          processing_started_at: string | null
          signing_completed_at: string | null
          signing_sent_at: string | null
          state: string | null
          updated_at: string
          user_id: string | null
          yfbp: number | null
          zoho_sign_document_id: string | null
          zoho_sign_error: string | null
          zoho_sign_request_id: string | null
          zoho_sign_status: string | null
        }
        Insert: {
          aadhar?: string | null
          address_line1?: string | null
          address_line2?: string | null
          age?: number | null
          agreement_status?: string | null
          annual_basic: number
          annual_gross_salary: number
          annual_hra: number
          annual_lta: number
          annual_special_allowance?: number | null
          bonus?: number | null
          city?: string | null
          client_email?: string | null
          client_name?: string | null
          created_at?: string
          doc_url?: string | null
          email: string
          fathers_name?: string | null
          first_name: string
          gender?: string | null
          id?: string
          job_description?: string | null
          job_title: string
          joining_date: string
          last_date?: string | null
          last_name: string
          manager_details?: string | null
          mfbp?: number | null
          monthly_basic: number
          monthly_gross: number
          monthly_hra: number
          monthly_lta: number
          monthly_special_allowance?: number | null
          pdf_download_url?: string | null
          pdf_url?: string | null
          pincode?: string | null
          place?: string | null
          processing_completed_at?: string | null
          processing_started_at?: string | null
          signing_completed_at?: string | null
          signing_sent_at?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string | null
          yfbp?: number | null
          zoho_sign_document_id?: string | null
          zoho_sign_error?: string | null
          zoho_sign_request_id?: string | null
          zoho_sign_status?: string | null
        }
        Update: {
          aadhar?: string | null
          address_line1?: string | null
          address_line2?: string | null
          age?: number | null
          agreement_status?: string | null
          annual_basic?: number
          annual_gross_salary?: number
          annual_hra?: number
          annual_lta?: number
          annual_special_allowance?: number | null
          bonus?: number | null
          city?: string | null
          client_email?: string | null
          client_name?: string | null
          created_at?: string
          doc_url?: string | null
          email?: string
          fathers_name?: string | null
          first_name?: string
          gender?: string | null
          id?: string
          job_description?: string | null
          job_title?: string
          joining_date?: string
          last_date?: string | null
          last_name?: string
          manager_details?: string | null
          mfbp?: number | null
          monthly_basic?: number
          monthly_gross?: number
          monthly_hra?: number
          monthly_lta?: number
          monthly_special_allowance?: number | null
          pdf_download_url?: string | null
          pdf_url?: string | null
          pincode?: string | null
          place?: string | null
          processing_completed_at?: string | null
          processing_started_at?: string | null
          signing_completed_at?: string | null
          signing_sent_at?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string | null
          yfbp?: number | null
          zoho_sign_document_id?: string | null
          zoho_sign_error?: string | null
          zoho_sign_request_id?: string | null
          zoho_sign_status?: string | null
        }
        Relationships: []
      }
      generated_agreements: {
        Row: {
          created_at: string | null
          employee_id: string | null
          file_name: string | null
          generation_status: string | null
          google_doc_id: string | null
          google_doc_url: string | null
          id: string
          pdf_download_url: string | null
          pdf_file_id: string | null
          pdf_preview_url: string | null
          placeholders_replaced: Json | null
          processing_time_seconds: number | null
          salary_breakdown: Json | null
        }
        Insert: {
          created_at?: string | null
          employee_id?: string | null
          file_name?: string | null
          generation_status?: string | null
          google_doc_id?: string | null
          google_doc_url?: string | null
          id?: string
          pdf_download_url?: string | null
          pdf_file_id?: string | null
          pdf_preview_url?: string | null
          placeholders_replaced?: Json | null
          processing_time_seconds?: number | null
          salary_breakdown?: Json | null
        }
        Update: {
          created_at?: string | null
          employee_id?: string | null
          file_name?: string | null
          generation_status?: string | null
          google_doc_id?: string | null
          google_doc_url?: string | null
          id?: string
          pdf_download_url?: string | null
          pdf_file_id?: string | null
          pdf_preview_url?: string | null
          placeholders_replaced?: Json | null
          processing_time_seconds?: number | null
          salary_breakdown?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_agreements_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_agreements_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_signing_status"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      employee_signing_status: {
        Row: {
          display_status: string | null
          email: string | null
          first_name: string | null
          has_pdf: boolean | null
          id: string | null
          last_name: string | null
          pdf_url: string | null
          sent_for_signing: boolean | null
          signing_completed_at: string | null
          signing_sent_at: string | null
          zoho_sign_request_id: string | null
          zoho_sign_status: string | null
        }
        Insert: {
          display_status?: never
          email?: string | null
          first_name?: string | null
          has_pdf?: never
          id?: string | null
          last_name?: string | null
          pdf_url?: string | null
          sent_for_signing?: never
          signing_completed_at?: string | null
          signing_sent_at?: string | null
          zoho_sign_request_id?: string | null
          zoho_sign_status?: string | null
        }
        Update: {
          display_status?: never
          email?: string | null
          first_name?: string | null
          has_pdf?: never
          id?: string | null
          last_name?: string | null
          pdf_url?: string | null
          sent_for_signing?: never
          signing_completed_at?: string | null
          signing_sent_at?: string | null
          zoho_sign_request_id?: string | null
          zoho_sign_status?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
