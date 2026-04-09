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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      academy_lessons: {
        Row: {
          content: Json
          created_at: string
          id: string
          lesson_type: string
          module_id: string
          sort_order: number
          title: string
          xp_reward: number
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          lesson_type?: string
          module_id: string
          sort_order?: number
          title: string
          xp_reward?: number
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          lesson_type?: string
          module_id?: string
          sort_order?: number
          title?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "academy_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "academy_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_modules: {
        Row: {
          created_at: string
          description: string | null
          icon_emoji: string | null
          id: string
          pass_threshold: number
          phase: string
          prerequisite_module_id: string | null
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon_emoji?: string | null
          id: string
          pass_threshold?: number
          phase?: string
          prerequisite_module_id?: string | null
          sort_order?: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon_emoji?: string | null
          id?: string
          pass_threshold?: number
          phase?: string
          prerequisite_module_id?: string | null
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_modules_prerequisite_module_id_fkey"
            columns: ["prerequisite_module_id"]
            isOneToOne: false
            referencedRelation: "academy_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
          view_context: Json | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
          view_context?: Json | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
          view_context?: Json | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          brand_color: string | null
          careers_url: string | null
          company_type: string | null
          context: string | null
          description: string | null
          detected_ats_platform: string | null
          employee_range: string | null
          enriched_at: string | null
          enrichment_confidence: string | null
          estimated_arr: string | null
          estimated_employees: string | null
          estimated_funding: string | null
          external_id: string | null
          founded_year: number | null
          funding_stage: string | null
          funding_total: string | null
          headquarters: string | null
          id: string
          imported_at: string
          industry: string | null
          logo_url: string | null
          manual_careers_url: string | null
          name: string
          slug: string | null
          website: string | null
        }
        Insert: {
          brand_color?: string | null
          careers_url?: string | null
          company_type?: string | null
          context?: string | null
          description?: string | null
          detected_ats_platform?: string | null
          employee_range?: string | null
          enriched_at?: string | null
          enrichment_confidence?: string | null
          estimated_arr?: string | null
          estimated_employees?: string | null
          estimated_funding?: string | null
          external_id?: string | null
          founded_year?: number | null
          funding_stage?: string | null
          funding_total?: string | null
          headquarters?: string | null
          id?: string
          imported_at?: string
          industry?: string | null
          logo_url?: string | null
          manual_careers_url?: string | null
          name: string
          slug?: string | null
          website?: string | null
        }
        Update: {
          brand_color?: string | null
          careers_url?: string | null
          company_type?: string | null
          context?: string | null
          description?: string | null
          detected_ats_platform?: string | null
          employee_range?: string | null
          enriched_at?: string | null
          enrichment_confidence?: string | null
          estimated_arr?: string | null
          estimated_employees?: string | null
          estimated_funding?: string | null
          external_id?: string | null
          founded_year?: number | null
          funding_stage?: string | null
          funding_total?: string | null
          headquarters?: string | null
          id?: string
          imported_at?: string
          industry?: string | null
          logo_url?: string | null
          manual_careers_url?: string | null
          name?: string
          slug?: string | null
          website?: string | null
        }
        Relationships: []
      }
      credit_costs: {
        Row: {
          action: string
          cost: number
          description: string | null
          label: string | null
        }
        Insert: {
          action: string
          cost?: number
          description?: string | null
          label?: string | null
        }
        Update: {
          action?: string
          cost?: number
          description?: string | null
          label?: string | null
        }
        Relationships: []
      }
      credit_ledger: {
        Row: {
          created_at: string
          delta: number
          id: string
          metadata: Json | null
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delta: number
          id?: string
          metadata?: Json | null
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string
          delta?: number
          id?: string
          metadata?: Json | null
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      discovered_garages: {
        Row: {
          address: string | null
          business_status: string | null
          capacity: number | null
          capacity_source: string | null
          city: string | null
          country: string | null
          created_at: string
          id: string
          lat: number
          lng: number
          name: string
          operator_guess: string | null
          phone: string | null
          photo_reference: string | null
          place_id: string
          price_level: number | null
          rating: number | null
          reviews_count: number | null
          scan_zone: string | null
          state: string | null
          total_ratings: number | null
          types: string[] | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          business_status?: string | null
          capacity?: number | null
          capacity_source?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          lat: number
          lng: number
          name: string
          operator_guess?: string | null
          phone?: string | null
          photo_reference?: string | null
          place_id: string
          price_level?: number | null
          rating?: number | null
          reviews_count?: number | null
          scan_zone?: string | null
          state?: string | null
          total_ratings?: number | null
          types?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          business_status?: string | null
          capacity?: number | null
          capacity_source?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          lat?: number
          lng?: number
          name?: string
          operator_guess?: string | null
          phone?: string | null
          photo_reference?: string | null
          place_id?: string
          price_level?: number | null
          rating?: number | null
          reviews_count?: number | null
          scan_zone?: string | null
          state?: string | null
          total_ratings?: number | null
          types?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      draft_emails: {
        Row: {
          body: string
          created_at: string
          id: string
          lead_id: string | null
          recipient_email: string
          subject: string
          updated_at: string
          user_id: string
          workspace_key: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          lead_id?: string | null
          recipient_email: string
          subject?: string
          updated_at?: string
          user_id: string
          workspace_key?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          lead_id?: string | null
          recipient_email?: string
          subject?: string
          updated_at?: string
          user_id?: string
          workspace_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "draft_emails_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "saved_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          description: string | null
          enabled: boolean
          key: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          enabled?: boolean
          key: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          enabled?: boolean
          key?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      federal_tax_liens: {
        Row: {
          county: string | null
          created_at: string
          date_of_assessment: string | null
          filing_date: string | null
          id: string
          identifying_number: string | null
          kind_of_tax: string | null
          last_day_for_refiling: string | null
          lien_unit: string | null
          notes: string | null
          place_of_filing: string | null
          release_date: string | null
          revenue_officer_name: string | null
          revenue_officer_title: string | null
          serial_number: string | null
          state_filed: string | null
          status: string
          tax_period_ending: string | null
          taxpayer_address: string | null
          taxpayer_city: string | null
          taxpayer_name: string
          taxpayer_ssn_or_ein: string | null
          taxpayer_state: string | null
          taxpayer_zip: string | null
          total_amount_due: number | null
          unpaid_balance: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          county?: string | null
          created_at?: string
          date_of_assessment?: string | null
          filing_date?: string | null
          id?: string
          identifying_number?: string | null
          kind_of_tax?: string | null
          last_day_for_refiling?: string | null
          lien_unit?: string | null
          notes?: string | null
          place_of_filing?: string | null
          release_date?: string | null
          revenue_officer_name?: string | null
          revenue_officer_title?: string | null
          serial_number?: string | null
          state_filed?: string | null
          status?: string
          tax_period_ending?: string | null
          taxpayer_address?: string | null
          taxpayer_city?: string | null
          taxpayer_name: string
          taxpayer_ssn_or_ein?: string | null
          taxpayer_state?: string | null
          taxpayer_zip?: string | null
          total_amount_due?: number | null
          unpaid_balance?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          county?: string | null
          created_at?: string
          date_of_assessment?: string | null
          filing_date?: string | null
          id?: string
          identifying_number?: string | null
          kind_of_tax?: string | null
          last_day_for_refiling?: string | null
          lien_unit?: string | null
          notes?: string | null
          place_of_filing?: string | null
          release_date?: string | null
          revenue_officer_name?: string | null
          revenue_officer_title?: string | null
          serial_number?: string | null
          state_filed?: string | null
          status?: string
          tax_period_ending?: string | null
          taxpayer_address?: string | null
          taxpayer_city?: string | null
          taxpayer_name?: string
          taxpayer_ssn_or_ein?: string | null
          taxpayer_state?: string | null
          taxpayer_zip?: string | null
          total_amount_due?: number | null
          unpaid_balance?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lead_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          lead_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          lead_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          lead_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "saved_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leadgen_niches: {
        Row: {
          created_at: string
          description: string | null
          icp_criteria: Json | null
          id: string
          label: string
          lead_count: number
          niche_type: string
          parent_label: string | null
          status: string
          user_id: string
          workspace_key: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icp_criteria?: Json | null
          id?: string
          label: string
          lead_count?: number
          niche_type?: string
          parent_label?: string | null
          status?: string
          user_id: string
          workspace_key?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icp_criteria?: Json | null
          id?: string
          label?: string
          lead_count?: number
          niche_type?: string
          parent_label?: string | null
          status?: string
          user_id?: string
          workspace_key?: string
        }
        Relationships: []
      }
      leadhunter_cache: {
        Row: {
          company_data: Json
          created_at: string
          expires_at: string
          id: string
          step_results: Json
          tree_data: Json
          website_key: string
        }
        Insert: {
          company_data?: Json
          created_at?: string
          expires_at?: string
          id?: string
          step_results?: Json
          tree_data?: Json
          website_key: string
        }
        Update: {
          company_data?: Json
          created_at?: string
          expires_at?: string
          id?: string
          step_results?: Json
          tree_data?: Json
          website_key?: string
        }
        Relationships: []
      }
      outreach_log: {
        Row: {
          body: string | null
          channel: string
          id: string
          lead_id: string
          sent_at: string
          status: string
          subject: string | null
          user_id: string
        }
        Insert: {
          body?: string | null
          channel?: string
          id?: string
          lead_id: string
          sent_at?: string
          status?: string
          subject?: string | null
          user_id: string
        }
        Update: {
          body?: string | null
          channel?: string
          id?: string
          lead_id?: string
          sent_at?: string
          status?: string
          subject?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outreach_log_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "saved_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_config: {
        Row: {
          description: string | null
          key: string
          label: string | null
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          description?: string | null
          key: string
          label?: string | null
          updated_at?: string
          updated_by?: string | null
          value: string
        }
        Update: {
          description?: string | null
          key?: string
          label?: string | null
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_id: string | null
          career_stage: string | null
          city: string | null
          company: string | null
          created_at: string
          cv_url: string | null
          degree_type: string | null
          display_name: string | null
          graduation_year: number | null
          id: string
          job_title: string | null
          linkedin_url: string | null
          onboarding_completed: boolean
          play_mode: string
          program_name: string | null
          referral_code: string | null
          school_name: string | null
          target_roles: Json | null
          username: string | null
        }
        Insert: {
          avatar_id?: string | null
          career_stage?: string | null
          city?: string | null
          company?: string | null
          created_at?: string
          cv_url?: string | null
          degree_type?: string | null
          display_name?: string | null
          graduation_year?: number | null
          id: string
          job_title?: string | null
          linkedin_url?: string | null
          onboarding_completed?: boolean
          play_mode?: string
          program_name?: string | null
          referral_code?: string | null
          school_name?: string | null
          target_roles?: Json | null
          username?: string | null
        }
        Update: {
          avatar_id?: string | null
          career_stage?: string | null
          city?: string | null
          company?: string | null
          created_at?: string
          cv_url?: string | null
          degree_type?: string | null
          display_name?: string | null
          graduation_year?: number | null
          id?: string
          job_title?: string | null
          linkedin_url?: string | null
          onboarding_completed?: boolean
          play_mode?: string
          program_name?: string | null
          referral_code?: string | null
          school_name?: string | null
          target_roles?: Json | null
          username?: string | null
        }
        Relationships: []
      }
      saved_leads: {
        Row: {
          address: string | null
          company: string | null
          created_at: string
          email: string | null
          email_confidence: string | null
          google_maps_url: string | null
          id: string
          lead_type: string
          linkedin: string | null
          name: string
          niche_tag: string | null
          phone: string | null
          photo_url: string | null
          rating: number | null
          reason: string | null
          reviews_count: number | null
          source: string | null
          status: Database["public"]["Enums"]["lead_status"]
          summary: string | null
          title: string | null
          updated_at: string
          user_id: string
          website: string | null
          workspace_key: string
        }
        Insert: {
          address?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          email_confidence?: string | null
          google_maps_url?: string | null
          id?: string
          lead_type?: string
          linkedin?: string | null
          name: string
          niche_tag?: string | null
          phone?: string | null
          photo_url?: string | null
          rating?: number | null
          reason?: string | null
          reviews_count?: number | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          summary?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
          workspace_key?: string
        }
        Update: {
          address?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          email_confidence?: string | null
          google_maps_url?: string | null
          id?: string
          lead_type?: string
          linkedin?: string | null
          name?: string
          niche_tag?: string | null
          phone?: string | null
          photo_url?: string | null
          rating?: number | null
          reason?: string | null
          reviews_count?: number | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          summary?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
          workspace_key?: string
        }
        Relationships: []
      }
      scan_corridors: {
        Row: {
          city: string
          created_at: string
          enabled: boolean
          id: string
          label: string
          lat_end: number
          lat_start: number
          lng_end: number
          lng_start: number
          priority: number
          region_key: string
          step: number
          updated_at: string
        }
        Insert: {
          city: string
          created_at?: string
          enabled?: boolean
          id?: string
          label: string
          lat_end: number
          lat_start: number
          lng_end: number
          lng_start: number
          priority?: number
          region_key: string
          step?: number
          updated_at?: string
        }
        Update: {
          city?: string
          created_at?: string
          enabled?: boolean
          id?: string
          label?: string
          lat_end?: number
          lat_start?: number
          lng_end?: number
          lng_start?: number
          priority?: number
          region_key?: string
          step?: number
          updated_at?: string
        }
        Relationships: []
      }
      scan_progress: {
        Row: {
          completed_at: string | null
          corridor_id: string
          garages_found: number
          id: string
          last_zone_index: number
          started_at: string | null
          status: string
          total_zones: number
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          corridor_id: string
          garages_found?: number
          id?: string
          last_zone_index?: number
          started_at?: string | null
          status?: string
          total_zones?: number
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          corridor_id?: string
          garages_found?: number
          id?: string
          last_zone_index?: number
          started_at?: string | null
          status?: string
          total_zones?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scan_progress_corridor_id_fkey"
            columns: ["corridor_id"]
            isOneToOne: true
            referencedRelation: "scan_corridors"
            referencedColumns: ["id"]
          },
        ]
      }
      school_courses: {
        Row: {
          ai_content_flag: boolean | null
          created_at: string
          curriculum_id: string
          degree_type: string | null
          department: string | null
          description: string | null
          id: string
          industry_sectors: Json | null
          learning_outcomes: Json | null
          program_name: string
          school_id: string
          skill_categories: Json | null
          skills_extracted: Json | null
          source_url: string | null
          tools_taught: Json | null
        }
        Insert: {
          ai_content_flag?: boolean | null
          created_at?: string
          curriculum_id: string
          degree_type?: string | null
          department?: string | null
          description?: string | null
          id?: string
          industry_sectors?: Json | null
          learning_outcomes?: Json | null
          program_name: string
          school_id: string
          skill_categories?: Json | null
          skills_extracted?: Json | null
          source_url?: string | null
          tools_taught?: Json | null
        }
        Update: {
          ai_content_flag?: boolean | null
          created_at?: string
          curriculum_id?: string
          degree_type?: string | null
          department?: string | null
          description?: string | null
          id?: string
          industry_sectors?: Json | null
          learning_outcomes?: Json | null
          program_name?: string
          school_id?: string
          skill_categories?: Json | null
          skills_extracted?: Json | null
          source_url?: string | null
          tools_taught?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "school_courses_curriculum_id_fkey"
            columns: ["curriculum_id"]
            isOneToOne: false
            referencedRelation: "school_curricula"
            referencedColumns: ["id"]
          },
        ]
      }
      school_curricula: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          initiated_by: string | null
          programs_found: number
          programs_parsed: number
          school_id: string
          source_url: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          initiated_by?: string | null
          programs_found?: number
          programs_parsed?: number
          school_id: string
          source_url: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          initiated_by?: string | null
          programs_found?: number
          programs_parsed?: number
          school_id?: string
          source_url?: string
          status?: string
        }
        Relationships: []
      }
      school_seats: {
        Row: {
          activated_at: string | null
          id: string
          invite_email: string | null
          provisioned_at: string
          school_id: string
          status: string
          user_id: string | null
        }
        Insert: {
          activated_at?: string | null
          id?: string
          invite_email?: string | null
          provisioned_at?: string
          school_id: string
          status?: string
          user_id?: string | null
        }
        Update: {
          activated_at?: string | null
          id?: string
          invite_email?: string | null
          provisioned_at?: string
          school_id?: string
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      sim_checkpoints: {
        Row: {
          company: string | null
          created_at: string
          id: string
          job_title: string
          level: number
          messages: Json
          mode: string
          objective_fail_counts: Json
          objective_status: Json
          round_count: number
          scaffolding_tiers: Json
          session_data: Json
          status: string
          task_name: string
          turn_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          id?: string
          job_title: string
          level?: number
          messages?: Json
          mode?: string
          objective_fail_counts?: Json
          objective_status?: Json
          round_count?: number
          scaffolding_tiers?: Json
          session_data?: Json
          status?: string
          task_name: string
          turn_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string
          id?: string
          job_title?: string
          level?: number
          messages?: Json
          mode?: string
          objective_fail_counts?: Json
          objective_status?: Json
          round_count?: number
          scaffolding_tiers?: Json
          session_data?: Json
          status?: string
          task_name?: string
          turn_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      simulation_queue: {
        Row: {
          attempt_number: number
          coaching_tip: string | null
          completed_at: string | null
          created_at: string
          department: string | null
          id: string
          job_title: string
          max_attempts: number
          source_simulation_id: string | null
          status: string
          task_name: string
          threshold: number
          user_id: string
          weak_category: string
          weak_score: number
        }
        Insert: {
          attempt_number?: number
          coaching_tip?: string | null
          completed_at?: string | null
          created_at?: string
          department?: string | null
          id?: string
          job_title: string
          max_attempts?: number
          source_simulation_id?: string | null
          status?: string
          task_name: string
          threshold?: number
          user_id: string
          weak_category: string
          weak_score: number
        }
        Update: {
          attempt_number?: number
          coaching_tip?: string | null
          completed_at?: string | null
          created_at?: string
          department?: string | null
          id?: string
          job_title?: string
          max_attempts?: number
          source_simulation_id?: string | null
          status?: string
          task_name?: string
          threshold?: number
          user_id?: string
          weak_category?: string
          weak_score?: number
        }
        Relationships: []
      }
      skill_discovery_suggestions: {
        Row: {
          action: string
          ai_analysis: Json
          avg_exposure: number
          avg_impact: number
          category: string
          demand_count: number
          discovered_at: string
          id: string
          job_count: number
          merge_target_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          skill_name: string
          skill_name_lower: string | null
          status: string
        }
        Insert: {
          action?: string
          ai_analysis?: Json
          avg_exposure?: number
          avg_impact?: number
          category: string
          demand_count?: number
          discovered_at?: string
          id?: string
          job_count?: number
          merge_target_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          skill_name: string
          skill_name_lower?: string | null
          status?: string
        }
        Update: {
          action?: string
          ai_analysis?: Json
          avg_exposure?: number
          avg_impact?: number
          category?: string
          demand_count?: number
          discovered_at?: string
          id?: string
          job_count?: number
          merge_target_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          skill_name?: string
          skill_name_lower?: string | null
          status?: string
        }
        Relationships: []
      }
      skill_drop_events: {
        Row: {
          banner_emoji: string | null
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          id: string
          rarity: string
          skill_id: string | null
          starts_at: string | null
          status: string
          tier_1_label: string
          tier_1_threshold: number
          tier_2_label: string
          tier_2_threshold: number
          tier_3_label: string
          tier_3_perfect_required: boolean
          tier_3_threshold: number
          title: string
          updated_at: string
        }
        Insert: {
          banner_emoji?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          rarity?: string
          skill_id?: string | null
          starts_at?: string | null
          status?: string
          tier_1_label?: string
          tier_1_threshold?: number
          tier_2_label?: string
          tier_2_threshold?: number
          tier_3_label?: string
          tier_3_perfect_required?: boolean
          tier_3_threshold?: number
          title: string
          updated_at?: string
        }
        Update: {
          banner_emoji?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          rarity?: string
          skill_id?: string | null
          starts_at?: string | null
          status?: string
          tier_1_label?: string
          tier_1_threshold?: number
          tier_2_label?: string
          tier_2_threshold?: number
          tier_3_label?: string
          tier_3_perfect_required?: boolean
          tier_3_threshold?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_drop_events_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_drop_participations: {
        Row: {
          best_score: number
          event_id: string
          id: string
          joined_at: string
          sims_completed: number
          tier_earned: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          best_score?: number
          event_id: string
          id?: string
          joined_at?: string
          sims_completed?: number
          tier_earned?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          best_score?: number
          event_id?: string
          id?: string
          joined_at?: string
          sims_completed?: number
          tier_earned?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_drop_participations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "skill_drop_events"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          ai_exposure: number
          category: string
          created_at: string
          description: string | null
          drop_expires_at: string | null
          human_edge: string | null
          icon_emoji: string | null
          id: string
          is_default: boolean
          keywords: string[]
          name: string
          rarity: string
          unlock_requirement: Json | null
          unlock_type: string
        }
        Insert: {
          ai_exposure?: number
          category: string
          created_at?: string
          description?: string | null
          drop_expires_at?: string | null
          human_edge?: string | null
          icon_emoji?: string | null
          id: string
          is_default?: boolean
          keywords?: string[]
          name: string
          rarity?: string
          unlock_requirement?: Json | null
          unlock_type?: string
        }
        Update: {
          ai_exposure?: number
          category?: string
          created_at?: string
          description?: string | null
          drop_expires_at?: string | null
          human_edge?: string | null
          icon_emoji?: string | null
          id?: string
          is_default?: boolean
          keywords?: string[]
          name?: string
          rarity?: string
          unlock_requirement?: Json | null
          unlock_type?: string
        }
        Relationships: []
      }
      sponsored_credits: {
        Row: {
          credits_granted: number
          granted_at: string
          id: string
          sponsorship_id: string
          user_id: string
        }
        Insert: {
          credits_granted?: number
          granted_at?: string
          id?: string
          sponsorship_id: string
          user_id: string
        }
        Update: {
          credits_granted?: number
          granted_at?: string
          id?: string
          sponsorship_id?: string
          user_id?: string
        }
        Relationships: []
      }
      subvertical_agent_scores: {
        Row: {
          agent_play: string | null
          agent_score: number
          agent_verdict: string | null
          automatable_workflows: Json | null
          id: string
          scored_at: string
          sub_vertical: string
          vertical_id: number
          vertical_name: string
          workflow_types: string[] | null
        }
        Insert: {
          agent_play?: string | null
          agent_score?: number
          agent_verdict?: string | null
          automatable_workflows?: Json | null
          id?: string
          scored_at?: string
          sub_vertical: string
          vertical_id: number
          vertical_name: string
          workflow_types?: string[] | null
        }
        Update: {
          agent_play?: string | null
          agent_score?: number
          agent_verdict?: string | null
          automatable_workflows?: Json | null
          id?: string
          scored_at?: string
          sub_vertical?: string
          vertical_id?: number
          vertical_name?: string
          workflow_types?: string[] | null
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      task_future_predictions: {
        Row: {
          cluster_name: string
          created_at: string
          expires_at: string
          id: string
          job_id: string | null
          prediction: Json
        }
        Insert: {
          cluster_name: string
          created_at?: string
          expires_at?: string
          id?: string
          job_id?: string | null
          prediction: Json
        }
        Update: {
          cluster_name?: string
          created_at?: string
          expires_at?: string
          id?: string
          job_id?: string | null
          prediction?: Json
        }
        Relationships: []
      }
      ticker_headlines: {
        Row: {
          created_at: string
          date: string
          id: string
          text: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          text: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          text?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_emoji: string | null
          badge_key: string
          badge_label: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_emoji?: string | null
          badge_key: string
          badge_label: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_emoji?: string | null
          badge_key?: string
          badge_label?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_lesson_progress: {
        Row: {
          attempts: number
          completed_at: string | null
          created_at: string
          id: string
          judgment_score: number | null
          lesson_id: string
          module_id: string
          override_score: number | null
          score: number | null
          speed_score: number | null
          status: string
          tool_score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          judgment_score?: number | null
          lesson_id: string
          module_id: string
          override_score?: number | null
          score?: number | null
          speed_score?: number | null
          status?: string
          tool_score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          judgment_score?: number | null
          lesson_id?: string
          module_id?: string
          override_score?: number | null
          score?: number | null
          speed_score?: number | null
          status?: string
          tool_score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "academy_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lesson_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "academy_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_presence: {
        Row: {
          current_activity: string | null
          is_online: boolean
          last_seen_at: string
          user_id: string
        }
        Insert: {
          current_activity?: string | null
          is_online?: boolean
          last_seen_at?: string
          user_id: string
        }
        Update: {
          current_activity?: string | null
          is_online?: boolean
          last_seen_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_skill_unlocks: {
        Row: {
          id: string
          skill_id: string
          unlock_method: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          id?: string
          skill_id: string
          unlock_method?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          id?: string
          skill_id?: string
          unlock_method?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_skill_unlocks_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      user_streaks: {
        Row: {
          current_streak: number
          freeze_remaining: number
          last_activity_date: string
          longest_streak: number
          streak_multiplier: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_streak?: number
          freeze_remaining?: number
          last_activity_date?: string
          longest_streak?: number
          streak_multiplier?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_streak?: number
          freeze_remaining?: number
          last_activity_date?: string
          longest_streak?: number
          streak_multiplier?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          created_by: string | null
          ends_at: string | null
          id: string
          metadata: Json | null
          plan: string
          source: string
          starts_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          metadata?: Json | null
          plan?: string
          source?: string
          starts_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          metadata?: Json | null
          plan?: string
          source?: string
          starts_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_usage: {
        Row: {
          analyses_used: number
          id: string
          period_start: string
          simulations_used: number
          updated_at: string
          user_id: string
        }
        Insert: {
          analyses_used?: number
          id?: string
          period_start?: string
          simulations_used?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          analyses_used?: number
          id?: string
          period_start?: string
          simulations_used?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_use_case_interests: {
        Row: {
          created_at: string
          id: string
          use_case: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          use_case: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          use_case?: string
          user_id?: string
        }
        Relationships: []
      }
      user_workspaces: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          last_accessed_at: string
          logo_url: string | null
          user_id: string
          website_key: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          last_accessed_at?: string
          logo_url?: string | null
          user_id: string
          website_key: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          last_accessed_at?: string
          logo_url?: string | null
          user_id?: string
          website_key?: string
        }
        Relationships: []
      }
      vertical_agent_scores: {
        Row: {
          agent_score: number
          agent_verdict: string | null
          key_opportunities: string[] | null
          scored_at: string
          vertical_id: number
          vertical_name: string
          workflow_types: string[] | null
        }
        Insert: {
          agent_score?: number
          agent_verdict?: string | null
          key_opportunities?: string[] | null
          scored_at?: string
          vertical_id: number
          vertical_name: string
          workflow_types?: string[] | null
        }
        Update: {
          agent_score?: number
          agent_verdict?: string | null
          key_opportunities?: string[] | null
          scored_at?: string
          vertical_id?: number
          vertical_name?: string
          workflow_types?: string[] | null
        }
        Relationships: []
      }
      workspace_members: {
        Row: {
          id: string
          joined_at: string
          role: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: []
      }
      xp_ledger: {
        Row: {
          created_at: string
          delta: number
          id: string
          lesson_id: string | null
          metadata: Json | null
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delta: number
          id?: string
          lesson_id?: string | null
          metadata?: Json | null
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string
          delta?: number
          id?: string
          lesson_id?: string | null
          metadata?: Json | null
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "xp_ledger_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "academy_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_usage_limit: {
        Args: { _type: string; _user_id: string }
        Returns: Json
      }
      deduct_credits: {
        Args: {
          _amount: number
          _metadata?: Json
          _reason: string
          _user_id: string
        }
        Returns: boolean
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_admin_user_stats: {
        Args: never
        Returns: {
          career_stage: string
          company: string
          created_at: string
          display_name: string
          email: string
          job_title: string
          last_active: string
          onboarding_completed: boolean
          school_name: string
          total_analyses: number
          total_sims: number
          total_xp: number
          user_id: string
        }[]
      }
      get_coaching_tip: {
        Args: { category: string; score: number }
        Returns: string
      }
      get_company_stats: {
        Args: never
        Returns: {
          analyzed_count: number
          company_id: string
          job_count: number
          task_cluster_count: number
        }[]
      }
      get_credit_balance: { Args: { _user_id: string }; Returns: number }
      get_friend_activity: {
        Args: { _limit?: number; _user_id: string }
        Returns: {
          activity_type: string
          avatar_id: string
          completed_at: string
          display_name: string
          job_title: string
          skills_earned: Json
          task_name: string
          total_xp: number
          user_id: string
          username: string
        }[]
      }
      get_friends_last_sims: {
        Args: { _user_id: string }
        Returns: {
          company: string
          completed_at: string
          friend_id: string
          job_title: string
          task_name: string
        }[]
      }
      get_future_skill_demand: {
        Args: { top_n?: number }
        Returns: {
          avg_exposure: number
          avg_impact: number
          category: string
          demand_count: number
          job_count: number
          skill_name: string
        }[]
      }
      get_kingdom_populations: {
        Args: never
        Returns: {
          job_title: string
          player_count: number
        }[]
      }
      get_leaderboard: {
        Args: never
        Returns: {
          display_name: string
          skills_unlocked: number
          tasks_completed: number
          total_xp: number
          user_id: string
        }[]
      }
      get_market_skill_demand: {
        Args: { top_n?: number }
        Returns: {
          avg_exposure: number
          avg_impact: number
          demand_count: number
          high_priority_count: number
          skill_name: string
        }[]
      }
      get_public_profile: { Args: { _username: string }; Returns: Json }
      get_school_analytics: {
        Args: { _school_id: string }
        Returns: {
          avg_score: number
          display_name: string
          total_sims: number
          total_xp: number
          user_id: string
        }[]
      }
      get_school_dashboard_stats: {
        Args: never
        Returns: {
          carnegie_class: string
          carnegie_count: number
          pipeline_count: number
          pipeline_stage: string
          state: string
          state_count: number
          total_customers: number
          total_enrollment: number
          total_hbcus: number
          total_schools: number
          total_scraped: number
        }[]
      }
      get_school_students: {
        Args: { _school_id: string }
        Returns: {
          activated_at: string
          display_name: string
          email: string
          invite_email: string
          provisioned_at: string
          seat_id: string
          status: string
          user_id: string
        }[]
      }
      get_skill_drop_matches: {
        Args: { _limit?: number; _skill_id: string }
        Returns: {
          ai_exposure_score: number
          cluster_name: string
          company_name: string
          job_id: string
          job_title: string
          matched_keywords: string[]
          skill_names: string[]
        }[]
      }
      get_undercovered_skills: {
        Args: { min_analyzed?: number }
        Returns: {
          analyzed_count: number
          category: string
          description: string
          gap: number
          skill_id: string
          skill_name: string
        }[]
      }
      get_user_level: { Args: { _user_id: string }; Returns: number }
      get_user_xp: { Args: { _user_id: string }; Returns: number }
      get_workspace_progress: {
        Args: { p_workspace_id: string }
        Returns: {
          adaptive_thinking_score: number
          completed_at: string
          correct_answers: number
          department: string
          display_name: string
          domain_judgment_score: number
          human_value_add_score: number
          job_title: string
          sim_job_title: string
          task_name: string
          tool_awareness_score: number
          total_questions: number
          user_id: string
        }[]
      }
      grant_credits: {
        Args: {
          _amount: number
          _metadata?: Json
          _reason: string
          _user_id: string
        }
        Returns: undefined
      }
      has_active_grant: { Args: { _user_id: string }; Returns: boolean }
      has_school_seat: { Args: { _user_id: string }; Returns: boolean }
      increment_usage: {
        Args: { _type: string; _user_id: string }
        Returns: Json
      }
      is_school_admin: {
        Args: { _school_id: string; _user_id: string }
        Returns: boolean
      }
      is_superadmin: { Args: { _user_id: string }; Returns: boolean }
      is_workspace_admin: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
      is_workspace_member: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      process_referral: {
        Args: { _referral_code: string; _referred_user_id: string }
        Returns: Json
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      lead_status: "new" | "contacted" | "replied" | "won" | "lost"
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
      lead_status: ["new", "contacted", "replied", "won", "lost"],
    },
  },
} as const
