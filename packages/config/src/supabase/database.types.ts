// Gerado via Supabase MCP (generate_typescript_types), projeto noun-app (vpcjzkygiwtodokcentu), 16/07/2026.
// Para regenerar: supabase gen types typescript --project-id vpcjzkygiwtodokcentu
//
// ATENÇÃO: cobre apenas o schema `public`. O schema `medical` (records, record_evolutions,
// prescriptions, reports, exam_requests — prontuário e receitas) existe no banco mas não é
// incluído pela geração padrão. Até isso ser resolvido (gerar tipos multi-schema ou expor
// medical.* via RPC SECURITY DEFINER com retorno tipado manualmente), qualquer query direta a
// medical.* no código não tem checagem de tipo contra o schema real. Ver apps/connect/CLAUDE.md,
// seção 8.

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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string
          complement: string | null
          country: string
          created_at: string
          id: string
          is_active: boolean
          is_default: boolean
          label: string | null
          latitude: number | null
          longitude: number | null
          neighborhood: string
          notes: string | null
          number: string
          postal_code: string
          recipient_name: string
          recipient_phone: string
          state: string
          street: string
          updated_at: string
          user_id: string
        }
        Insert: {
          city: string
          complement?: string | null
          country?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          label?: string | null
          latitude?: number | null
          longitude?: number | null
          neighborhood: string
          notes?: string | null
          number: string
          postal_code: string
          recipient_name: string
          recipient_phone: string
          state: string
          street: string
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string
          complement?: string | null
          country?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          label?: string | null
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string
          notes?: string | null
          number?: string
          postal_code?: string
          recipient_name?: string
          recipient_phone?: string
          state?: string
          street?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          cancelled_by: string | null
          cancelled_reason: string | null
          card_brand: string | null
          created_at: string
          doctor_id: string
          id: string
          paid_at: string | null
          patient_id: string
          patient_notes: string | null
          payment_method: string | null
          price: number | null
          slot_id: string | null
          status: Database["public"]["Enums"]["appointment_status"]
          telemedicine_url: string | null
          tenant_id: string
          type: Database["public"]["Enums"]["appointment_type"]
          updated_at: string
        }
        Insert: {
          cancelled_by?: string | null
          cancelled_reason?: string | null
          card_brand?: string | null
          created_at?: string
          doctor_id: string
          id?: string
          paid_at?: string | null
          patient_id: string
          patient_notes?: string | null
          payment_method?: string | null
          price?: number | null
          slot_id?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          telemedicine_url?: string | null
          tenant_id: string
          type?: Database["public"]["Enums"]["appointment_type"]
          updated_at?: string
        }
        Update: {
          cancelled_by?: string | null
          cancelled_reason?: string | null
          card_brand?: string | null
          created_at?: string
          doctor_id?: string
          id?: string
          paid_at?: string | null
          patient_id?: string
          patient_notes?: string | null
          payment_method?: string | null
          price?: number | null
          slot_id?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          telemedicine_url?: string | null
          tenant_id?: string
          type?: Database["public"]["Enums"]["appointment_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "availability_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_slots: {
        Row: {
          created_at: string
          doctor_id: string
          ends_at: string
          id: string
          is_booked: boolean
          price: number | null
          starts_at: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          ends_at: string
          id?: string
          is_booked?: boolean
          price?: number | null
          starts_at: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          ends_at?: string
          id?: string
          is_booked?: boolean
          price?: number | null
          starts_at?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_slots_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_slots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_waitlist: {
        Row: {
          cidade: string
          created_at: string
          email: string
          estado: string
          id: string
          nome: string
          telefone: string
          tipo: string
          whatsapp: string
        }
        Insert: {
          cidade: string
          created_at?: string
          email: string
          estado: string
          id?: string
          nome: string
          telefone: string
          tipo: string
          whatsapp: string
        }
        Update: {
          cidade?: string
          created_at?: string
          email?: string
          estado?: string
          id?: string
          nome?: string
          telefone?: string
          tipo?: string
          whatsapp?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          concentration: string | null
          dosage: string | null
          id: string
          notes: string | null
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          concentration?: string | null
          dosage?: string | null
          id?: string
          notes?: string | null
          order_id: string
          product_id: string
          quantity?: number
          unit_price: number
        }
        Update: {
          concentration?: string | null
          dosage?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address_id: string | null
          created_at: string
          delivery_snapshot: Json
          id: string
          notes: string | null
          patient_id: string
          pharmacy_id: string
          prescription_ref: string | null
          status: Database["public"]["Enums"]["order_status"]
          total_price: number | null
          tracking_code: string | null
          updated_at: string
        }
        Insert: {
          address_id?: string | null
          created_at?: string
          delivery_snapshot: Json
          id?: string
          notes?: string | null
          patient_id: string
          pharmacy_id: string
          prescription_ref?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_price?: number | null
          tracking_code?: string | null
          updated_at?: string
        }
        Update: {
          address_id?: string | null
          created_at?: string
          delivery_snapshot?: Json
          id?: string
          notes?: string | null
          patient_id?: string
          pharmacy_id?: string
          prescription_ref?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_price?: number | null
          tracking_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_profiles: {
        Row: {
          allergies: string | null
          avatar_url: string | null
          created_at: string
          current_medications: string | null
          gender_identity: string | null
          gender_identity_custom: string | null
          health_conditions: string[] | null
          id: string
          preferred_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allergies?: string | null
          avatar_url?: string | null
          created_at?: string
          current_medications?: string | null
          gender_identity?: string | null
          gender_identity_custom?: string | null
          health_conditions?: string[] | null
          id?: string
          preferred_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allergies?: string | null
          avatar_url?: string | null
          created_at?: string
          current_medications?: string | null
          gender_identity?: string | null
          gender_identity_custom?: string | null
          health_conditions?: string[] | null
          id?: string
          preferred_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          requires_prescription: boolean
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          requires_prescription?: boolean
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          requires_prescription?: boolean
          slug?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          active_principle: string | null
          anvisa_code: string | null
          base_price: number | null
          category_id: string | null
          controlled: boolean
          created_at: string
          description: string | null
          id: string
          is_available: boolean
          name: string
          requires_prescription: boolean
          tenant_id: string
        }
        Insert: {
          active_principle?: string | null
          anvisa_code?: string | null
          base_price?: number | null
          category_id?: string | null
          controlled?: boolean
          created_at?: string
          description?: string | null
          id?: string
          is_available?: boolean
          name: string
          requires_prescription?: boolean
          tenant_id: string
        }
        Update: {
          active_principle?: string | null
          anvisa_code?: string | null
          base_price?: number | null
          category_id?: string | null
          controlled?: boolean
          created_at?: string
          description?: string | null
          id?: string
          is_available?: boolean
          name?: string
          requires_prescription?: boolean
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_compensation: {
        Row: {
          active_from: string
          active_until: string | null
          created_at: string
          fixed_amount: number | null
          id: string
          model: Database["public"]["Enums"]["compensation_model"]
          monthly_salary: number | null
          percentage_rate: number | null
          profile_id: string
          settings: Json | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          active_from: string
          active_until?: string | null
          created_at?: string
          fixed_amount?: number | null
          id?: string
          model: Database["public"]["Enums"]["compensation_model"]
          monthly_salary?: number | null
          percentage_rate?: number | null
          profile_id: string
          settings?: Json | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          active_from?: string
          active_until?: string | null
          created_at?: string
          fixed_amount?: number | null
          id?: string
          model?: Database["public"]["Enums"]["compensation_model"]
          monthly_salary?: number | null
          percentage_rate?: number | null
          profile_id?: string
          settings?: Json | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_compensation_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_compensation_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_earnings: {
        Row: {
          appointment_id: string
          appointment_price: number
          calculation_details: Json | null
          compensation_id: string | null
          created_at: string
          id: string
          included_in_payout: string | null
          notes: string | null
          noun_fee: number
          professional_amount: number
          professional_id: string
          status: string
          tenant_id: string
        }
        Insert: {
          appointment_id: string
          appointment_price: number
          calculation_details?: Json | null
          compensation_id?: string | null
          created_at?: string
          id?: string
          included_in_payout?: string | null
          notes?: string | null
          noun_fee: number
          professional_amount: number
          professional_id: string
          status?: string
          tenant_id: string
        }
        Update: {
          appointment_id?: string
          appointment_price?: number
          calculation_details?: Json | null
          compensation_id?: string | null
          created_at?: string
          id?: string
          included_in_payout?: string | null
          notes?: string | null
          noun_fee?: number
          professional_amount?: number
          professional_id?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_earnings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_earnings_compensation_id_fkey"
            columns: ["compensation_id"]
            isOneToOne: false
            referencedRelation: "professional_compensation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_earnings_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_earnings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_payouts: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          deductions: number | null
          gross_amount: number
          id: string
          invoice_url: string | null
          net_amount: number
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          payment_reference: string | null
          period_end: string
          period_start: string
          professional_id: string
          status: Database["public"]["Enums"]["payout_status"]
          tenant_id: string
          total_appointments: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          deductions?: number | null
          gross_amount: number
          id?: string
          invoice_url?: string | null
          net_amount: number
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          period_end: string
          period_start: string
          professional_id: string
          status?: Database["public"]["Enums"]["payout_status"]
          tenant_id: string
          total_appointments: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          deductions?: number | null
          gross_amount?: number
          id?: string
          invoice_url?: string | null
          net_amount?: number
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          period_end?: string
          period_start?: string
          professional_id?: string
          status?: Database["public"]["Enums"]["payout_status"]
          tenant_id?: string
          total_appointments?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_payouts_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_payouts_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_payouts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          council_id: string | null
          council_state: string | null
          cpf: string | null
          created_at: string
          date_of_birth: string
          email: string | null
          full_name: string
          gender_consent_at: string | null
          gender_consent_version: string | null
          gender_identity: Database["public"]["Enums"]["gender_identity"] | null
          gender_identity_other: string | null
          id: string
          is_active: boolean
          lgpd_consent_at: string | null
          lgpd_consent_version: string | null
          medical_specialty: string | null
          phone_home: string | null
          phone_mobile: string | null
          role: Database["public"]["Enums"]["user_role"]
          social_name: string | null
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          council_id?: string | null
          council_state?: string | null
          cpf?: string | null
          created_at?: string
          date_of_birth: string
          email?: string | null
          full_name: string
          gender_consent_at?: string | null
          gender_consent_version?: string | null
          gender_identity?:
            | Database["public"]["Enums"]["gender_identity"]
            | null
          gender_identity_other?: string | null
          id: string
          is_active?: boolean
          lgpd_consent_at?: string | null
          lgpd_consent_version?: string | null
          medical_specialty?: string | null
          phone_home?: string | null
          phone_mobile?: string | null
          role: Database["public"]["Enums"]["user_role"]
          social_name?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          council_id?: string | null
          council_state?: string | null
          cpf?: string | null
          created_at?: string
          date_of_birth?: string
          email?: string | null
          full_name?: string
          gender_consent_at?: string | null
          gender_consent_version?: string | null
          gender_identity?:
            | Database["public"]["Enums"]["gender_identity"]
            | null
          gender_identity_other?: string | null
          id?: string
          is_active?: boolean
          lgpd_consent_at?: string | null
          lgpd_consent_version?: string | null
          medical_specialty?: string | null
          phone_home?: string | null
          phone_mobile?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          social_name?: string | null
          tenant_id?: string | null
          updated_at?: string
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
      support_ticket_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_admin: boolean
          sender_id: string | null
          ticket_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_admin?: boolean
          sender_id?: string | null
          ticket_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_admin?: boolean
          sender_id?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          opened_by: string | null
          priority: string
          source: string
          status: string
          tenant_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          id?: string
          opened_by?: string | null
          priority?: string
          source: string
          status?: string
          tenant_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          opened_by?: string | null
          priority?: string
          source?: string
          status?: string
          tenant_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          activated_at: string | null
          activated_by: string | null
          ae_numero: string | null
          afe_codigo: string | null
          agencia: string | null
          alvara_sanitario: string | null
          bairro: string | null
          banco: string | null
          cep: string | null
          cidade: string | null
          cnpj: string | null
          code: string
          commercial_notes: string | null
          commission_rate: number | null
          complemento: string | null
          conselho_numero: string | null
          conselho_uf: string | null
          conta: string | null
          contract_ref: string | null
          contract_signed_at: string | null
          cpf: string | null
          created_at: string
          email: string | null
          fiscal_type: string | null
          id: string
          inscricao_estadual: string | null
          logradouro: string | null
          name: string
          nome_fantasia: string | null
          notes: string | null
          numero_logradouro: string | null
          payout_delay_days: number | null
          pix_tipo: string | null
          pix_valor: string | null
          plan: string
          razao_social: string | null
          regime_tributario: string | null
          responsavel_legal_cpf: string | null
          responsavel_legal_nome: string | null
          responsavel_tecnico_crf: string | null
          responsavel_tecnico_crf_uf: string | null
          responsavel_tecnico_nome: string | null
          rqe: string | null
          settings: Json | null
          status: Database["public"]["Enums"]["tenant_status"]
          subtype: Database["public"]["Enums"]["tenant_subtype"] | null
          telefone: string | null
          termos_aceitos_em: string | null
          termos_cadastrado_por: string | null
          tipo_conta: string | null
          titular_documento: string | null
          titular_nome: string | null
          type: Database["public"]["Enums"]["tenant_type"]
          uf: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          activated_at?: string | null
          activated_by?: string | null
          ae_numero?: string | null
          afe_codigo?: string | null
          agencia?: string | null
          alvara_sanitario?: string | null
          bairro?: string | null
          banco?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          code?: string
          commercial_notes?: string | null
          commission_rate?: number | null
          complemento?: string | null
          conselho_numero?: string | null
          conselho_uf?: string | null
          conta?: string | null
          contract_ref?: string | null
          contract_signed_at?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          fiscal_type?: string | null
          id?: string
          inscricao_estadual?: string | null
          logradouro?: string | null
          name: string
          nome_fantasia?: string | null
          notes?: string | null
          numero_logradouro?: string | null
          payout_delay_days?: number | null
          pix_tipo?: string | null
          pix_valor?: string | null
          plan?: string
          razao_social?: string | null
          regime_tributario?: string | null
          responsavel_legal_cpf?: string | null
          responsavel_legal_nome?: string | null
          responsavel_tecnico_crf?: string | null
          responsavel_tecnico_crf_uf?: string | null
          responsavel_tecnico_nome?: string | null
          rqe?: string | null
          settings?: Json | null
          status?: Database["public"]["Enums"]["tenant_status"]
          subtype?: Database["public"]["Enums"]["tenant_subtype"] | null
          telefone?: string | null
          termos_aceitos_em?: string | null
          termos_cadastrado_por?: string | null
          tipo_conta?: string | null
          titular_documento?: string | null
          titular_nome?: string | null
          type: Database["public"]["Enums"]["tenant_type"]
          uf?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          activated_at?: string | null
          activated_by?: string | null
          ae_numero?: string | null
          afe_codigo?: string | null
          agencia?: string | null
          alvara_sanitario?: string | null
          bairro?: string | null
          banco?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          code?: string
          commercial_notes?: string | null
          commission_rate?: number | null
          complemento?: string | null
          conselho_numero?: string | null
          conselho_uf?: string | null
          conta?: string | null
          contract_ref?: string | null
          contract_signed_at?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          fiscal_type?: string | null
          id?: string
          inscricao_estadual?: string | null
          logradouro?: string | null
          name?: string
          nome_fantasia?: string | null
          notes?: string | null
          numero_logradouro?: string | null
          payout_delay_days?: number | null
          pix_tipo?: string | null
          pix_valor?: string | null
          plan?: string
          razao_social?: string | null
          regime_tributario?: string | null
          responsavel_legal_cpf?: string | null
          responsavel_legal_nome?: string | null
          responsavel_tecnico_crf?: string | null
          responsavel_tecnico_crf_uf?: string | null
          responsavel_tecnico_nome?: string | null
          rqe?: string | null
          settings?: Json | null
          status?: Database["public"]["Enums"]["tenant_status"]
          subtype?: Database["public"]["Enums"]["tenant_subtype"] | null
          telefone?: string | null
          termos_aceitos_em?: string | null
          termos_cadastrado_por?: string | null
          tipo_conta?: string | null
          titular_documento?: string | null
          titular_nome?: string | null
          type?: Database["public"]["Enums"]["tenant_type"]
          uf?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_consents: {
        Row: {
          accepted: boolean
          accepted_at: string | null
          consent_type: string
          created_at: string
          id: string
          revoked_at: string | null
          terms_version: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted?: boolean
          accepted_at?: string | null
          consent_type: string
          created_at?: string
          id?: string
          revoked_at?: string | null
          terms_version?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted?: boolean
          accepted_at?: string | null
          consent_type?: string
          created_at?: string
          id?: string
          revoked_at?: string | null
          terms_version?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_payout: {
        Args: {
          p_period_end: string
          p_period_start: string
          p_professional_id: string
          p_tenant_id: string
        }
        Returns: string
      }
      current_tenant_id: { Args: never; Returns: string }
      current_user_id: { Args: never; Returns: string }
      current_user_role: { Args: never; Returns: string }
      get_active_tenants_count: {
        Args: { p_end: string; p_start: string }
        Returns: number
      }
      get_alltime_kpis: {
        Args: never
        Returns: {
          gmv_appointments: number
          gmv_orders: number
          noun_revenue: number
        }[]
      }
      get_avg_days_to_first_appt: {
        Args: { p_end: string; p_start: string }
        Returns: number
      }
      get_churned_tenants_count: { Args: never; Returns: number }
      get_dashboard_blocks: { Args: never; Returns: Json }
      get_dashboard_summary: { Args: never; Returns: Json }
      get_monthly_chart_data: {
        Args: never
        Returns: {
          gmv_clinico: number
          gmv_farmacia: number
          month_num: number
          receita_noun: number
          year_num: number
        }[]
      }
      get_patient_city_distribution: {
        Args: never
        Returns: {
          city: string
          latitude: number
          longitude: number
          state: string
          user_count: number
        }[]
      }
      get_period_financial_kpis: {
        Args: { p_end: string; p_start: string }
        Returns: {
          gmv_appointments: number
          gmv_orders: number
          noun_revenue: number
        }[]
      }
      get_retention_rate: { Args: never; Returns: number }
      get_tenant_blocks_data: { Args: { p_tenant_id: string }; Returns: Json }
      get_tenant_last_transactions: {
        Args: { p_tenant_id: string }
        Returns: {
          card_brand: string
          created_at: string
          id: string
          payment_method: string
          price: number
          status: string
        }[]
      }
      get_tenant_monthly_chart_data: {
        Args: { p_tenant_id: string }
        Returns: {
          gmv_clinico: number
          gmv_farmacia: number
          month_num: number
          receita_noun: number
          year_num: number
        }[]
      }
      get_tenant_patient_city_distribution: {
        Args: { p_tenant_id: string }
        Returns: {
          city: string
          latitude: number
          longitude: number
          state: string
          user_count: number
        }[]
      }
      get_top_pharmacies: {
        Args: { p_end: string; p_start: string }
        Returns: {
          order_count: number
          pharmacy_id: string
          pharmacy_name: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_noun_admin: { Args: never; Returns: boolean }
      is_pharmacy_staff: { Args: never; Returns: boolean }
      is_professional: { Args: never; Returns: boolean }
    }
    Enums: {
      appointment_status:
        | "pending"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "no_show"
      appointment_type: "first_visit" | "follow_up" | "return" | "telemedicine"
      compensation_model: "percentage" | "fixed_per_visit" | "salary"
      gender_identity:
        | "cis_woman"
        | "trans_woman"
        | "travesti"
        | "non_binary"
        | "gender_fluid"
        | "prefer_not_to_say"
        | "self_described"
      order_status:
        | "pending_prescription"
        | "prescription_validated"
        | "in_production"
        | "ready"
        | "dispatched"
        | "delivered"
        | "cancelled"
      payout_status: "pending" | "approved" | "paid" | "disputed"
      tenant_status: "active" | "suspended" | "draft"
      tenant_subtype:
        | "clinico_geral"
        | "endocrinologista"
        | "urologista"
        | "ginecologista"
        | "psiquiatra"
        | "psicologo"
        | "nutricionista"
        | "rede"
        | "manipulacao"
      tenant_type: "pharmacy" | "platform" | "specialist"
      user_role:
        | "patient"
        | "doctor"
        | "nutritionist"
        | "psychologist"
        | "pharmacist"
        | "attendant"
        | "noun_admin"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      appointment_status: [
        "pending",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
        "no_show",
      ],
      appointment_type: ["first_visit", "follow_up", "return", "telemedicine"],
      compensation_model: ["percentage", "fixed_per_visit", "salary"],
      gender_identity: [
        "cis_woman",
        "trans_woman",
        "travesti",
        "non_binary",
        "gender_fluid",
        "prefer_not_to_say",
        "self_described",
      ],
      order_status: [
        "pending_prescription",
        "prescription_validated",
        "in_production",
        "ready",
        "dispatched",
        "delivered",
        "cancelled",
      ],
      payout_status: ["pending", "approved", "paid", "disputed"],
      tenant_status: ["active", "suspended", "draft"],
      tenant_subtype: [
        "clinico_geral",
        "endocrinologista",
        "urologista",
        "ginecologista",
        "psiquiatra",
        "psicologo",
        "nutricionista",
        "rede",
        "manipulacao",
      ],
      tenant_type: ["pharmacy", "platform", "specialist"],
      user_role: [
        "patient",
        "doctor",
        "nutritionist",
        "psychologist",
        "pharmacist",
        "attendant",
        "noun_admin",
      ],
    },
  },
} as const
