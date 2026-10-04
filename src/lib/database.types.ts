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
      appointments: {
        Row: {
          cancellation_reason: string | null
          clinic_id: string
          created_at: string
          created_by: string | null
          doctor_id: string | null
          end_at: string
          id: string
          notes: string | null
          patient_id: string
          room: string | null
          room_id: string | null
          start_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          treatment_id: string | null
          updated_at: string
        }
        Insert: {
          cancellation_reason?: string | null
          clinic_id: string
          created_at?: string
          created_by?: string | null
          doctor_id?: string | null
          end_at: string
          id?: string
          notes?: string | null
          patient_id: string
          room?: string | null
          room_id?: string | null
          start_at: string
          status?: Database["public"]["Enums"]["appointment_status"]
          treatment_id?: string | null
          updated_at?: string
        }
        Update: {
          cancellation_reason?: string | null
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          doctor_id?: string | null
          end_at?: string
          id?: string
          notes?: string | null
          patient_id?: string
          room?: string | null
          room_id?: string | null
          start_at?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          treatment_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_clinic_doctor_fkey"
            columns: ["clinic_id", "doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_clinic_patient_fkey"
            columns: ["clinic_id", "patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "appointments_clinic_room_fkey"
            columns: ["clinic_id", "room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "appointments_clinic_treatment_fkey"
            columns: ["clinic_id", "treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          clinic_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: number
          metadata: Json
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          clinic_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: never
          metadata?: Json
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          clinic_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: never
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_abuse_events: {
        Row: {
          clinic_id: string
          created_at: string
          fingerprint: string
          id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          fingerprint: string
          id?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          fingerprint?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_abuse_events_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_requests: {
        Row: {
          clinic_id: string
          created_at: string
          doctor_id: string | null
          duration_minutes: number
          email: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string
          preferred_date: string | null
          preferred_time: string | null
          requested_doctor: string | null
          requested_treatment: string | null
          status: Database["public"]["Enums"]["booking_request_status"]
          treatment_id: string | null
        }
        Insert: {
          clinic_id: string
          created_at?: string
          doctor_id?: string | null
          duration_minutes?: number
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone: string
          preferred_date?: string | null
          preferred_time?: string | null
          requested_doctor?: string | null
          requested_treatment?: string | null
          status?: Database["public"]["Enums"]["booking_request_status"]
          treatment_id?: string | null
        }
        Update: {
          clinic_id?: string
          created_at?: string
          doctor_id?: string | null
          duration_minutes?: number
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string
          preferred_date?: string | null
          preferred_time?: string | null
          requested_doctor?: string | null
          requested_treatment?: string | null
          status?: Database["public"]["Enums"]["booking_request_status"]
          treatment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_clinic_treatment_fkey"
            columns: ["clinic_id", "treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "booking_requests_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_requests_doctor_tenant_fkey"
            columns: ["clinic_id", "doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "booking_requests_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_business_hours: {
        Row: {
          clinic_id: string
          close_time: string | null
          enabled: boolean
          open_time: string | null
          slot_minutes: number
          updated_at: string
          weekday: number
        }
        Insert: {
          clinic_id: string
          close_time?: string | null
          enabled?: boolean
          open_time?: string | null
          slot_minutes?: number
          updated_at?: string
          weekday: number
        }
        Update: {
          clinic_id?: string
          close_time?: string | null
          enabled?: boolean
          open_time?: string | null
          slot_minutes?: number
          updated_at?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "clinic_business_hours_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_memberships: {
        Row: {
          active: boolean
          clinic_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["clinic_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          clinic_id: string
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["clinic_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          clinic_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["clinic_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_memberships_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_site_settings: {
        Row: {
          assets: Json
          booking_settings: Json
          clinic_id: string
          content: Json
          custom_domain: string | null
          domain_error: string | null
          domain_last_checked_at: string | null
          domain_requested_at: string | null
          domain_status: string
          domain_verified: boolean
          domain_verified_at: string | null
          platform_subdomain: string | null
          platform_subdomain_created_at: string | null
          favicon_url: string | null
          hero_image_url: string | null
          logo_url: string | null
          navigation: Json
          published: boolean
          sections: Json
          site_title: string | null
          tagline: string | null
          theme_key: string
          tokens: Json
          updated_at: string
        }
        Insert: {
          assets?: Json
          booking_settings?: Json
          clinic_id: string
          content?: Json
          custom_domain?: string | null
          domain_error?: string | null
          domain_last_checked_at?: string | null
          domain_requested_at?: string | null
          domain_status?: string
          domain_verified?: boolean
          domain_verified_at?: string | null
          platform_subdomain?: string | null
          platform_subdomain_created_at?: string | null
          favicon_url?: string | null
          hero_image_url?: string | null
          logo_url?: string | null
          navigation?: Json
          published?: boolean
          sections?: Json
          site_title?: string | null
          tagline?: string | null
          theme_key?: string
          tokens?: Json
          updated_at?: string
        }
        Update: {
          assets?: Json
          booking_settings?: Json
          clinic_id?: string
          content?: Json
          custom_domain?: string | null
          domain_error?: string | null
          domain_last_checked_at?: string | null
          domain_requested_at?: string | null
          domain_status?: string
          domain_verified?: boolean
          domain_verified_at?: string | null
          platform_subdomain?: string | null
          platform_subdomain_created_at?: string | null
          favicon_url?: string | null
          hero_image_url?: string | null
          logo_url?: string | null
          navigation?: Json
          published?: boolean
          sections?: Json
          site_title?: string | null
          tagline?: string | null
          theme_key?: string
          tokens?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_site_settings_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: true
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_site_settings_theme_key_fkey"
            columns: ["theme_key"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["key"]
          },
        ]
      }
      clinical_notes: {
        Row: {
          clinic_id: string
          created_at: string
          created_by: string | null
          doctor_id: string | null
          id: string
          note: string
          note_type: string
          patient_id: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          created_by?: string | null
          doctor_id?: string | null
          id?: string
          note: string
          note_type?: string
          patient_id: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          doctor_id?: string | null
          id?: string
          note?: string
          note_type?: string
          patient_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_notes_clinic_doctor_fkey"
            columns: ["clinic_id", "doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "clinical_notes_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_notes_clinic_patient_fkey"
            columns: ["clinic_id", "patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "clinical_notes_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          currency: string
          email: string | null
          id: string
          legal_name: string | null
          locale: string
          logo_path: string | null
          name: string
          onboarding_completed: boolean
          phone: string | null
          slug: string
          status: Database["public"]["Enums"]["clinic_status"]
          timezone: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          email?: string | null
          id?: string
          legal_name?: string | null
          locale?: string
          logo_path?: string | null
          name: string
          onboarding_completed?: boolean
          phone?: string | null
          slug: string
          status?: Database["public"]["Enums"]["clinic_status"]
          timezone?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          email?: string | null
          id?: string
          legal_name?: string | null
          locale?: string
          logo_path?: string | null
          name?: string
          onboarding_completed?: boolean
          phone?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["clinic_status"]
          timezone?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      dental_chart_entries: {
        Row: {
          clinic_id: string
          condition: Database["public"]["Enums"]["tooth_condition"]
          id: string
          notes: string | null
          patient_id: string
          recorded_at: string
          recorded_by: string | null
          status: Database["public"]["Enums"]["chart_record_status"]
          surfaces: string[]
          tooth_no: number
        }
        Insert: {
          clinic_id: string
          condition: Database["public"]["Enums"]["tooth_condition"]
          id?: string
          notes?: string | null
          patient_id: string
          recorded_at?: string
          recorded_by?: string | null
          status?: Database["public"]["Enums"]["chart_record_status"]
          surfaces?: string[]
          tooth_no: number
        }
        Update: {
          clinic_id?: string
          condition?: Database["public"]["Enums"]["tooth_condition"]
          id?: string
          notes?: string | null
          patient_id?: string
          recorded_at?: string
          recorded_by?: string | null
          status?: Database["public"]["Enums"]["chart_record_status"]
          surfaces?: string[]
          tooth_no?: number
        }
        Relationships: [
          {
            foreignKeyName: "chart_clinic_patient_fkey"
            columns: ["clinic_id", "patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "dental_chart_entries_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_chart_entries_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          active: boolean
          bio_ar: string | null
          bio_en: string | null
          clinic_id: string
          created_at: string
          display_name: string
          email: string | null
          id: string
          license_number: string | null
          phone: string | null
          profile_id: string | null
          specialty: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          bio_ar?: string | null
          bio_en?: string | null
          clinic_id: string
          created_at?: string
          display_name: string
          email?: string | null
          id?: string
          license_number?: string | null
          phone?: string | null
          profile_id?: string | null
          specialty?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          bio_ar?: string | null
          bio_en?: string | null
          clinic_id?: string
          created_at?: string
          display_name?: string
          email?: string | null
          id?: string
          license_number?: string | null
          phone?: string | null
          profile_id?: string | null
          specialty?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctors_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctors_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          active: boolean
          batch_no: string | null
          category: string | null
          clinic_id: string
          cost_per_unit: number
          created_at: string
          expiry_date: string | null
          id: string
          minimum_stock: number
          name: string
          quantity: number
          sku: string
          supplier: string | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          batch_no?: string | null
          category?: string | null
          clinic_id: string
          cost_per_unit?: number
          created_at?: string
          expiry_date?: string | null
          id?: string
          minimum_stock?: number
          name: string
          quantity?: number
          sku: string
          supplier?: string | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          batch_no?: string | null
          category?: string | null
          clinic_id?: string
          cost_per_unit?: number
          created_at?: string
          expiry_date?: string | null
          id?: string
          minimum_stock?: number
          name?: string
          quantity?: number
          sku?: string
          supplier?: string | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          appointment_id: string | null
          clinic_id: string
          created_at: string
          created_by: string | null
          id: string
          inventory_item_id: string
          quantity: number
          transaction_type: string
        }
        Insert: {
          appointment_id?: string | null
          clinic_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          inventory_item_id: string
          quantity: number
          transaction_type: string
        }
        Update: {
          appointment_id?: string | null
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          inventory_item_id?: string
          quantity?: number
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_tx_clinic_appt_fkey"
            columns: ["clinic_id", "appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "inventory_tx_clinic_item_fkey"
            columns: ["clinic_id", "inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["clinic_id", "id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          clinic_id: string
          description: string
          discount: number
          id: string
          invoice_id: string
          line_total: number
          quantity: number
          sort_order: number
          tooth_no: number | null
          unit_price: number
        }
        Insert: {
          clinic_id: string
          description: string
          discount?: number
          id?: string
          invoice_id: string
          line_total?: number
          quantity?: number
          sort_order?: number
          tooth_no?: number | null
          unit_price?: number
        }
        Update: {
          clinic_id?: string
          description?: string
          discount?: number
          id?: string
          invoice_id?: string
          line_total?: number
          quantity?: number
          sort_order?: number
          tooth_no?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_clinic_invoice_fkey"
            columns: ["clinic_id", "invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          balance_due: number | null
          clinic_id: string
          created_at: string
          created_by: string | null
          discount_total: number
          due_at: string | null
          id: string
          invoice_no: string
          issued_at: string | null
          paid_total: number
          patient_id: string
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          tax_total: number
          total: number
          treatment_plan_id: string | null
          updated_at: string
        }
        Insert: {
          balance_due?: number | null
          clinic_id: string
          created_at?: string
          created_by?: string | null
          discount_total?: number
          due_at?: string | null
          id?: string
          invoice_no?: string
          issued_at?: string | null
          paid_total?: number
          patient_id: string
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax_total?: number
          total?: number
          treatment_plan_id?: string | null
          updated_at?: string
        }
        Update: {
          balance_due?: number | null
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          discount_total?: number
          due_at?: string | null
          id?: string
          invoice_no?: string
          issued_at?: string | null
          paid_total?: number
          patient_id?: string
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax_total?: number
          total?: number
          treatment_plan_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_clinic_patient_fkey"
            columns: ["clinic_id", "patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "invoices_clinic_plan_fkey"
            columns: ["clinic_id", "treatment_plan_id"]
            isOneToOne: false
            referencedRelation: "treatment_plans"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "invoices_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_treatment_plan_id_fkey"
            columns: ["treatment_plan_id"]
            isOneToOne: false
            referencedRelation: "treatment_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_documents: {
        Row: {
          clinic_id: string
          created_at: string
          document_type: string
          file_size: number | null
          id: string
          mime_type: string | null
          patient_id: string
          patient_visible: boolean
          storage_path: string
          title: string
          uploaded_by: string | null
        }
        Insert: {
          clinic_id: string
          created_at?: string
          document_type?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          patient_id: string
          patient_visible?: boolean
          storage_path: string
          title: string
          uploaded_by?: string | null
        }
        Update: {
          clinic_id?: string
          created_at?: string
          document_type?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          patient_id?: string
          patient_visible?: boolean
          storage_path?: string
          title?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_clinic_patient_fkey"
            columns: ["clinic_id", "patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "patient_documents_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_medical_history: {
        Row: {
          allergies: string | null
          blood_type: string | null
          chronic_conditions: string | null
          clinic_id: string
          clinical_summary: string | null
          created_at: string
          current_medications: string | null
          dental_history: string | null
          patient_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          allergies?: string | null
          blood_type?: string | null
          chronic_conditions?: string | null
          clinic_id: string
          clinical_summary?: string | null
          created_at?: string
          current_medications?: string | null
          dental_history?: string | null
          patient_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          allergies?: string | null
          blood_type?: string | null
          chronic_conditions?: string | null
          clinic_id?: string
          clinical_summary?: string | null
          created_at?: string
          current_medications?: string | null
          dental_history?: string | null
          patient_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_history_clinic_patient_fkey"
            columns: ["clinic_id", "patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "patient_medical_history_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_medical_history_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          auth_user_id: string | null
          clinic_id: string
          created_at: string
          created_by: string | null
          date_of_birth: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string
          id: string
          last_name: string
          patient_no: string
          phone: string | null
          sex: string | null
          status: Database["public"]["Enums"]["patient_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          auth_user_id?: string | null
          clinic_id: string
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name: string
          id?: string
          last_name: string
          patient_no?: string
          phone?: string | null
          sex?: string | null
          status?: Database["public"]["Enums"]["patient_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          auth_user_id?: string | null
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string
          id?: string
          last_name?: string
          patient_no?: string
          phone?: string | null
          sex?: string | null
          status?: Database["public"]["Enums"]["patient_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          clinic_id: string
          created_at: string
          id: string
          invoice_id: string | null
          method: string
          paid_at: string
          patient_id: string
          received_by: string | null
          reference: string | null
        }
        Insert: {
          amount: number
          clinic_id: string
          created_at?: string
          id?: string
          invoice_id?: string | null
          method: string
          paid_at?: string
          patient_id: string
          received_by?: string | null
          reference?: string | null
        }
        Update: {
          amount?: number
          clinic_id?: string
          created_at?: string
          id?: string
          invoice_id?: string | null
          method?: string
          paid_at?: string
          patient_id?: string
          received_by?: string | null
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_clinic_invoice_fkey"
            columns: ["clinic_id", "invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "payments_clinic_patient_fkey"
            columns: ["clinic_id", "patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          active: boolean
          code: string
          created_at: string
          currency: string
          description: string | null
          features: Json
          id: string
          limits: Json
          name: string
          price_monthly: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json
          id?: string
          limits?: Json
          name: string
          price_monthly?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json
          id?: string
          limits?: Json
          name?: string
          price_monthly?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active: boolean
          avatar_path: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          platform_role: Database["public"]["Enums"]["platform_role"]
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          avatar_path?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          platform_role?: Database["public"]["Enums"]["platform_role"]
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          avatar_path?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          platform_role?: Database["public"]["Enums"]["platform_role"]
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          active: boolean
          clinic_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          clinic_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          clinic_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_signup_attempts: {
        Row: {
          created_at: string
          email_hash: string
          id: number
          ip_hash: string
          outcome: string
        }
        Insert: {
          created_at?: string
          email_hash: string
          id?: never
          ip_hash: string
          outcome?: string
        }
        Update: {
          created_at?: string
          email_hash?: string
          id?: never
          ip_hash?: string
          outcome?: string
        }
        Relationships: []
      }
      saas_leads: {
        Row: {
          clinic_name: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          message: string | null
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          clinic_name?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          message?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          clinic_name?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          message?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_provider: string
          clinic_id: string
          created_at: string
          current_period_end: string | null
          id: string
          plan_id: string | null
          provider_customer_id: string | null
          provider_subscription_id: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          billing_provider?: string
          clinic_id: string
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan_id?: string | null
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          billing_provider?: string
          clinic_id?: string
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan_id?: string | null
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: true
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      themes: {
        Row: {
          active: boolean
          created_at: string
          default_tokens: Json
          description: string | null
          id: string
          key: string
          name: string
          premium: boolean
          preview_image: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          default_tokens?: Json
          description?: string | null
          id?: string
          key: string
          name: string
          premium?: boolean
          preview_image?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          default_tokens?: Json
          description?: string | null
          id?: string
          key?: string
          name?: string
          premium?: boolean
          preview_image?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      treatment_plan_items: {
        Row: {
          clinic_id: string
          created_at: string
          description: string
          discount: number
          id: string
          quantity: number
          sort_order: number
          status: Database["public"]["Enums"]["plan_item_status"]
          tooth_no: number | null
          treatment_id: string | null
          treatment_plan_id: string
          unit_price: number
        }
        Insert: {
          clinic_id: string
          created_at?: string
          description: string
          discount?: number
          id?: string
          quantity?: number
          sort_order?: number
          status?: Database["public"]["Enums"]["plan_item_status"]
          tooth_no?: number | null
          treatment_id?: string | null
          treatment_plan_id: string
          unit_price?: number
        }
        Update: {
          clinic_id?: string
          created_at?: string
          description?: string
          discount?: number
          id?: string
          quantity?: number
          sort_order?: number
          status?: Database["public"]["Enums"]["plan_item_status"]
          tooth_no?: number | null
          treatment_id?: string | null
          treatment_plan_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "plan_items_clinic_plan_fkey"
            columns: ["clinic_id", "treatment_plan_id"]
            isOneToOne: false
            referencedRelation: "treatment_plans"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "plan_items_clinic_treatment_fkey"
            columns: ["clinic_id", "treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "treatment_plan_items_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_plan_items_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_plan_items_treatment_plan_id_fkey"
            columns: ["treatment_plan_id"]
            isOneToOne: false
            referencedRelation: "treatment_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_plans: {
        Row: {
          approved_at: string | null
          clinic_id: string
          created_at: string
          created_by: string | null
          discount_total: number
          estimated_total: number
          id: string
          notes: string | null
          patient_id: string
          status: Database["public"]["Enums"]["plan_status"]
          title: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          clinic_id: string
          created_at?: string
          created_by?: string | null
          discount_total?: number
          estimated_total?: number
          id?: string
          notes?: string | null
          patient_id: string
          status?: Database["public"]["Enums"]["plan_status"]
          title: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          discount_total?: number
          estimated_total?: number
          id?: string
          notes?: string | null
          patient_id?: string
          status?: Database["public"]["Enums"]["plan_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plans_clinic_patient_fkey"
            columns: ["clinic_id", "patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "treatment_plans_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_plans_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      treatments: {
        Row: {
          active: boolean
          clinic_id: string
          code: string
          created_at: string
          default_price: number
          description_ar: string | null
          description_en: string | null
          duration_minutes: number
          id: string
          name_ar: string | null
          name_en: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          clinic_id: string
          code: string
          created_at?: string
          default_price?: number
          description_ar?: string | null
          description_en?: string | null
          duration_minutes?: number
          id?: string
          name_ar?: string | null
          name_en: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          clinic_id?: string
          code?: string
          created_at?: string
          default_price?: number
          description_ar?: string | null
          description_en?: string | null
          duration_minutes?: number
          id?: string
          name_ar?: string | null
          name_en?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      provision_self_serve_clinic: {
        Args: {
          p_currency?: string
          p_clinic_name: string
          p_owner_name: string
          p_plan_code: string
          p_platform_subdomain?: string
          p_slug: string
          p_theme_key: string
          p_timezone?: string
          p_user_id: string
        }
        Returns: {
          clinic_id: string
          clinic_slug: string
          plan_code: string
          platform_subdomain: string
          theme_key: string
        }[]
      }
      convert_booking_request: {
        Args: { p_booking_request_id: string }
        Returns: Json
      }
      create_my_patient_profile: {
        Args: {
          p_address?: string
          p_clinic_id: string
          p_date_of_birth?: string
          p_email?: string
          p_first_name: string
          p_last_name: string
          p_phone?: string
          p_sex?: string
        }
        Returns: string
      }
      create_simple_invoice: {
        Args: {
          p_amount: number
          p_description: string
          p_due_at?: string
          p_patient_id: string
        }
        Returns: string
      }
      record_inventory_transaction: {
        Args: {
          p_appointment_id?: string
          p_inventory_item_id: string
          p_quantity: number
          p_transaction_type: string
        }
        Returns: string
      }
      record_invoice_payment: {
        Args: {
          p_amount: number
          p_invoice_id: string
          p_method: string
          p_reference?: string
        }
        Returns: string
      }
      search_patients: {
        Args: { p_clinic_id: string; p_query?: string }
        Returns: {
          address: string | null
          auth_user_id: string | null
          clinic_id: string
          created_at: string
          created_by: string | null
          date_of_birth: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string
          id: string
          last_name: string
          patient_no: string
          phone: string | null
          sex: string | null
          status: Database["public"]["Enums"]["patient_status"]
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "patients"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      set_appointment_status: {
        Args: {
          p_appointment_id: string
          p_status: Database["public"]["Enums"]["appointment_status"]
        }
        Returns: boolean
      }
      set_treatment_plan_status: {
        Args: {
          p_status: Database["public"]["Enums"]["plan_status"]
          p_treatment_plan_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "dentist" | "receptionist" | "accountant" | "patient"
      appointment_status:
        | "scheduled"
        | "confirmed"
        | "checked_in"
        | "in_treatment"
        | "completed"
        | "cancelled"
        | "no_show"
      booking_request_status: "new" | "contacted" | "converted" | "closed"
      chart_record_status: "existing" | "planned" | "completed"
      clinic_role: "clinic_owner" | "dentist" | "receptionist" | "accountant"
      clinic_status: "trialing" | "active" | "suspended" | "archived"
      invoice_status: "draft" | "issued" | "partially_paid" | "paid" | "void"
      patient_status: "active" | "inactive" | "archived"
      plan_item_status: "planned" | "in_progress" | "completed" | "cancelled"
      plan_status:
        | "draft"
        | "proposed"
        | "approved"
        | "in_progress"
        | "completed"
        | "cancelled"
      platform_role: "user" | "super_admin"
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "suspended"
      tooth_condition:
        | "healthy"
        | "caries"
        | "filling"
        | "crown"
        | "implant"
        | "missing"
        | "extraction"
        | "root_canal"
        | "bridge"
        | "veneer"
        | "fracture"
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
      app_role: ["admin", "dentist", "receptionist", "accountant", "patient"],
      appointment_status: [
        "scheduled",
        "confirmed",
        "checked_in",
        "in_treatment",
        "completed",
        "cancelled",
        "no_show",
      ],
      booking_request_status: ["new", "contacted", "converted", "closed"],
      chart_record_status: ["existing", "planned", "completed"],
      clinic_role: ["clinic_owner", "dentist", "receptionist", "accountant"],
      clinic_status: ["trialing", "active", "suspended", "archived"],
      invoice_status: ["draft", "issued", "partially_paid", "paid", "void"],
      patient_status: ["active", "inactive", "archived"],
      plan_item_status: ["planned", "in_progress", "completed", "cancelled"],
      plan_status: [
        "draft",
        "proposed",
        "approved",
        "in_progress",
        "completed",
        "cancelled",
      ],
      platform_role: ["user", "super_admin"],
      subscription_status: [
        "trialing",
        "active",
        "past_due",
        "canceled",
        "suspended",
      ],
      tooth_condition: [
        "healthy",
        "caries",
        "filling",
        "crown",
        "implant",
        "missing",
        "extraction",
        "root_canal",
        "bridge",
        "veneer",
        "fracture",
      ],
    },
  },
} as const
