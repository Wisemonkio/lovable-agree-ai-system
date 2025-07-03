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
          address_line1: string | null
          age: number | null
          agreement_status: string | null
          annual_basic: number
          annual_gross_salary: number
          annual_hra: number
          annual_lta: number
          annual_special_allowance: number
          city: string | null
          client_name: string | null
          created_at: string
          doc_url: string | null
          email: string
          fathers_name: string | null
          first_name: string
          id: string
          job_title: string
          joining_date: string
          last_name: string
          manager_details: string | null
          mfbp: number
          monthly_basic: number
          monthly_gross: number
          monthly_hra: number
          monthly_lta: number
          monthly_special_allowance: number
          pdf_download_url: string | null
          pdf_url: string | null
          pincode: string | null
          place: string | null
          processing_completed_at: string | null
          processing_started_at: string | null
          state: string | null
          updated_at: string
          user_id: string | null
          yfbp: number
        }
        Insert: {
          address_line1?: string | null
          age?: number | null
          agreement_status?: string | null
          annual_basic: number
          annual_gross_salary: number
          annual_hra: number
          annual_lta: number
          annual_special_allowance: number
          city?: string | null
          client_name?: string | null
          created_at?: string
          doc_url?: string | null
          email: string
          fathers_name?: string | null
          first_name: string
          id?: string
          job_title: string
          joining_date: string
          last_name: string
          manager_details?: string | null
          mfbp: number
          monthly_basic: number
          monthly_gross: number
          monthly_hra: number
          monthly_lta: number
          monthly_special_allowance: number
          pdf_download_url?: string | null
          pdf_url?: string | null
          pincode?: string | null
          place?: string | null
          processing_completed_at?: string | null
          processing_started_at?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string | null
          yfbp: number
        }
        Update: {
          address_line1?: string | null
          age?: number | null
          agreement_status?: string | null
          annual_basic?: number
          annual_gross_salary?: number
          annual_hra?: number
          annual_lta?: number
          annual_special_allowance?: number
          city?: string | null
          client_name?: string | null
          created_at?: string
          doc_url?: string | null
          email?: string
          fathers_name?: string | null
          first_name?: string
          id?: string
          job_title?: string
          joining_date?: string
          last_name?: string
          manager_details?: string | null
          mfbp?: number
          monthly_basic?: number
          monthly_gross?: number
          monthly_hra?: number
          monthly_lta?: number
          monthly_special_allowance?: number
          pdf_download_url?: string | null
          pdf_url?: string | null
          pincode?: string | null
          place?: string | null
          processing_completed_at?: string | null
          processing_started_at?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string | null
          yfbp?: number
        }
        Relationships: []
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
      [_ in never]: never
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
