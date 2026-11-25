export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          diff_json: Json | null
          entity: string | null
          entity_id: string | null
          id: string
          tenant_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          diff_json?: Json | null
          entity?: string | null
          entity_id?: string | null
          id?: string
          tenant_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          diff_json?: Json | null
          entity?: string | null
          entity_id?: string | null
          id?: string
          tenant_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      contracts: {
        Row: {
          created_at: string
          customer_id: string
          device_id: string | null
          down_payment: number
          financed_amount: number
          frequency: string
          grace_days: number
          id: string
          installments_count: number
          markup: number
          start_date: string
          status: string
          tenant_id: string
          total_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          device_id?: string | null
          down_payment?: number
          financed_amount: number
          frequency?: string
          grace_days?: number
          id?: string
          installments_count: number
          markup?: number
          start_date: string
          status?: string
          tenant_id?: string
          total_price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          device_id?: string | null
          down_payment?: number
          financed_amount?: number
          frequency?: string
          grace_days?: number
          id?: string
          installments_count?: number
          markup?: number
          start_date?: string
          status?: string
          tenant_id?: string
          total_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          agreement_url: string | null
          cnic: string
          consent_at: string | null
          created_at: string
          deleted_at: string | null
          guarantor_name: string | null
          guarantor_phone: string | null
          id: string
          name: string
          phone: string
          photo_url: string | null
          tenant_id: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          agreement_url?: string | null
          cnic: string
          consent_at?: string | null
          created_at?: string
          deleted_at?: string | null
          guarantor_name?: string | null
          guarantor_phone?: string | null
          id?: string
          name: string
          phone: string
          photo_url?: string | null
          tenant_id?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          agreement_url?: string | null
          cnic?: string
          consent_at?: string | null
          created_at?: string
          deleted_at?: string | null
          guarantor_name?: string | null
          guarantor_phone?: string | null
          id?: string
          name?: string
          phone?: string
          photo_url?: string | null
          tenant_id?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      device_commands: {
        Row: {
          acked_at: string | null
          created_at: string
          device_id: string
          expires_at: string
          id: string
          payload_json: Json
          sent_at: string | null
          status: string
          tenant_id: string
          type: string
        }
        Insert: {
          acked_at?: string | null
          created_at?: string
          device_id: string
          expires_at?: string
          id?: string
          payload_json?: Json
          sent_at?: string | null
          status?: string
          tenant_id?: string
          type: string
        }
        Update: {
          acked_at?: string | null
          created_at?: string
          device_id?: string
          expires_at?: string
          id?: string
          payload_json?: Json
          sent_at?: string | null
          status?: string
          tenant_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_commands_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_commands_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      device_events: {
        Row: {
          created_at: string
          device_id: string
          id: string
          payload_json: Json
          tenant_id: string
          type: string
        }
        Insert: {
          created_at?: string
          device_id: string
          id?: string
          payload_json?: Json
          tenant_id: string
          type: string
        }
        Update: {
          created_at?: string
          device_id?: string
          id?: string
          payload_json?: Json
          tenant_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_events_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      device_secrets: {
        Row: {
          created_at: string
          device_id: string
          enroll_token: string
          secret_hex: string
        }
        Insert: {
          created_at?: string
          device_id: string
          enroll_token: string
          secret_hex: string
        }
        Update: {
          created_at?: string
          device_id?: string
          enroll_token?: string
          secret_hex?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_secrets_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: true
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          android_version: string | null
          app_version: string | null
          battery: number | null
          brand: string | null
          created_at: string
          customer_id: string | null
          deleted_at: string | null
          enrollment_status: string
          fcm_token: string | null
          id: string
          imei1: string | null
          imei2: string | null
          last_lat: number | null
          last_lng: number | null
          last_seen_at: string | null
          lock_state: string
          model: string | null
          setup_steps: Json
          sim_serial: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          android_version?: string | null
          app_version?: string | null
          battery?: number | null
          brand?: string | null
          created_at?: string
          customer_id?: string | null
          deleted_at?: string | null
          enrollment_status?: string
          fcm_token?: string | null
          id?: string
          imei1?: string | null
          imei2?: string | null
          last_lat?: number | null
          last_lng?: number | null
          last_seen_at?: string | null
          lock_state?: string
          model?: string | null
          setup_steps?: Json
          sim_serial?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          android_version?: string | null
          app_version?: string | null
          battery?: number | null
          brand?: string | null
          created_at?: string
          customer_id?: string | null
          deleted_at?: string | null
          enrollment_status?: string
          fcm_token?: string | null
          id?: string
          imei1?: string | null
          imei2?: string | null
          last_lat?: number | null
          last_lng?: number | null
          last_seen_at?: string | null
          lock_state?: string
          model?: string | null
          setup_steps?: Json
          sim_serial?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "devices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      installments: {
        Row: {
          amount: number
          contract_id: string
          created_at: string
          due_date: string
          id: string
          paid_amount: number
          paid_at: string | null
          seq_no: number
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          contract_id: string
          created_at?: string
          due_date: string
          id?: string
          paid_amount?: number
          paid_at?: string | null
          seq_no: number
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          contract_id?: string
          created_at?: string
          due_date?: string
          id?: string
          paid_amount?: number
          paid_at?: string | null
          seq_no?: number
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "installments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          contract_id: string
          created_at: string
          id: string
          idempotency_key: string | null
          installment_id: string | null
          method: string
          receipt_url: string | null
          reference_no: string | null
          status: string
          submitted_by: string
          tenant_id: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          contract_id: string
          created_at?: string
          id?: string
          idempotency_key?: string | null
          installment_id?: string | null
          method?: string
          receipt_url?: string | null
          reference_no?: string | null
          status?: string
          submitted_by?: string
          tenant_id?: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          contract_id?: string
          created_at?: string
          id?: string
          idempotency_key?: string | null
          installment_id?: string | null
          method?: string
          receipt_url?: string | null
          reference_no?: string | null
          status?: string
          submitted_by?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_installment_id_fkey"
            columns: ["installment_id"]
            isOneToOne: false
            referencedRelation: "installments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          name: string | null
          phone: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id: string
          name?: string | null
          phone?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          phone?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          apk_checksum: string | null
          apk_url: string | null
          created_at: string
          device_quota: number
          id: string
          license_expiry: string | null
          name: string
          phone: string | null
          plan: string
          status: string
          support_phone: string | null
          updated_at: string
        }
        Insert: {
          apk_checksum?: string | null
          apk_url?: string | null
          created_at?: string
          device_quota?: number
          id?: string
          license_expiry?: string | null
          name: string
          phone?: string | null
          plan?: string
          status?: string
          support_phone?: string | null
          updated_at?: string
        }
        Update: {
          apk_checksum?: string | null
          apk_url?: string | null
          created_at?: string
          device_quota?: number
          id?: string
          license_expiry?: string | null
          name?: string
          phone?: string | null
          plan?: string
          status?: string
          support_phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      unlock_codes: {
        Row: {
          action: string
          code_hash: string
          counter: number
          created_at: string
          device_id: string
          expires_at: string
          generated_by: string | null
          id: string
          tenant_id: string
          used_at: string | null
        }
        Insert: {
          action?: string
          code_hash: string
          counter: number
          created_at?: string
          device_id: string
          expires_at: string
          generated_by?: string | null
          id?: string
          tenant_id?: string
          used_at?: string | null
        }
        Update: {
          action?: string
          code_hash?: string
          counter?: number
          created_at?: string
          device_id?: string
          expires_at?: string
          generated_by?: string | null
          id?: string
          tenant_id?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "unlock_codes_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unlock_codes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_payment: { Args: { p_id: string }; Returns: undefined }
      create_contract: {
        Args: {
          p_count: number
          p_customer: string
          p_device: string
          p_down: number
          p_frequency: string
          p_grace: number
          p_markup: number
          p_start: string
          p_total: number
        }
        Returns: string
      }
      current_tenant_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      record_payment: {
        Args: {
          p_amount: number
          p_contract: string
          p_key: string
          p_method: string
          p_ref: string
        }
        Returns: string
      }
      reject_payment: { Args: { p_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "super_admin" | "shop_owner" | "staff"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "shop_owner", "staff"],
    },
  },
} as const
