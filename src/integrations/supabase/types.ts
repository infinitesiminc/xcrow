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
      analysis_history: {
        Row: {
          analyzed_at: string
          augmented_percent: number
          automation_risk_percent: number
          company: string | null
          id: string
          job_title: string
          tasks_count: number
          user_id: string
        }
        Insert: {
          analyzed_at?: string
          augmented_percent?: number
          automation_risk_percent?: number
          company?: string | null
          id?: string
          job_title: string
          tasks_count?: number
          user_id: string
        }
        Update: {
          analyzed_at?: string
          augmented_percent?: number
          automation_risk_percent?: number
          company?: string | null
          id?: string
          job_title?: string
          tasks_count?: number
          user_id?: string
        }
        Relationships: []
      }
      bookmarked_roles: {
        Row: {
          augmented_percent: number | null
          automation_risk_percent: number | null
          bookmarked_at: string
          company: string | null
          id: string
          job_title: string
          new_skills_percent: number | null
          user_id: string
        }
        Insert: {
          augmented_percent?: number | null
          automation_risk_percent?: number | null
          bookmarked_at?: string
          company?: string | null
          id?: string
          job_title: string
          new_skills_percent?: number | null
          user_id: string
        }
        Update: {
          augmented_percent?: number | null
          automation_risk_percent?: number | null
          bookmarked_at?: string
          company?: string | null
          id?: string
          job_title?: string
          new_skills_percent?: number | null
          user_id?: string
        }
        Relationships: []
      }
      cached_analyses: {
        Row: {
          company_lower: string
          created_at: string
          id: string
          job_title_lower: string
          result: Json
        }
        Insert: {
          company_lower?: string
          created_at?: string
          id?: string
          job_title_lower: string
          result: Json
        }
        Update: {
          company_lower?: string
          created_at?: string
          id?: string
          job_title_lower?: string
          result?: Json
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
          external_id: string | null
          founded_year: number | null
          funding_stage: string | null
          funding_total: string | null
          headquarters: string | null
          id: string
          imported_at: string
          industry: string | null
          is_demo: boolean | null
          logo_url: string | null
          manual_careers_url: string | null
          name: string
          slug: string | null
          website: string | null
          workspace_id: string | null
        }
        Insert: {
          brand_color?: string | null
          careers_url?: string | null
          company_type?: string | null
          context?: string | null
          description?: string | null
          detected_ats_platform?: string | null
          employee_range?: string | null
          external_id?: string | null
          founded_year?: number | null
          funding_stage?: string | null
          funding_total?: string | null
          headquarters?: string | null
          id?: string
          imported_at?: string
          industry?: string | null
          is_demo?: boolean | null
          logo_url?: string | null
          manual_careers_url?: string | null
          name: string
          slug?: string | null
          website?: string | null
          workspace_id?: string | null
        }
        Update: {
          brand_color?: string | null
          careers_url?: string | null
          company_type?: string | null
          context?: string | null
          description?: string | null
          detected_ats_platform?: string | null
          employee_range?: string | null
          external_id?: string | null
          founded_year?: number | null
          funding_stage?: string | null
          funding_total?: string | null
          headquarters?: string | null
          id?: string
          imported_at?: string
          industry?: string | null
          is_demo?: boolean | null
          logo_url?: string | null
          manual_careers_url?: string | null
          name?: string
          slug?: string | null
          website?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "company_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      company_workspaces: {
        Row: {
          created_at: string
          created_by: string
          id: string
          join_code: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          join_code: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          join_code?: string
          name?: string
        }
        Relationships: []
      }
      completed_simulations: {
        Row: {
          adaptive_thinking_score: number | null
          company: string | null
          completed_at: string
          correct_answers: number
          department: string | null
          domain_judgment_score: number | null
          elevation_narrative: Json | null
          experience_level: string | null
          human_value_add_score: number | null
          id: string
          job_title: string
          rounds_completed: number
          skills_earned: Json | null
          task_name: string
          tool_awareness_score: number | null
          total_questions: number
          user_id: string
        }
        Insert: {
          adaptive_thinking_score?: number | null
          company?: string | null
          completed_at?: string
          correct_answers?: number
          department?: string | null
          domain_judgment_score?: number | null
          elevation_narrative?: Json | null
          experience_level?: string | null
          human_value_add_score?: number | null
          id?: string
          job_title: string
          rounds_completed?: number
          skills_earned?: Json | null
          task_name: string
          tool_awareness_score?: number | null
          total_questions?: number
          user_id: string
        }
        Update: {
          adaptive_thinking_score?: number | null
          company?: string | null
          completed_at?: string
          correct_answers?: number
          department?: string | null
          domain_judgment_score?: number | null
          elevation_narrative?: Json | null
          experience_level?: string | null
          human_value_add_score?: number | null
          id?: string
          job_title?: string
          rounds_completed?: number
          skills_earned?: Json | null
          task_name?: string
          tool_awareness_score?: number | null
          total_questions?: number
          user_id?: string
        }
        Relationships: []
      }
      custom_simulations: {
        Row: {
          ai_state: string | null
          ai_trend: string | null
          company: string | null
          created_at: string
          id: string
          impact_level: string | null
          job_title: string
          priority: string | null
          recommended_template: string
          sim_duration: number | null
          source_document_text: string | null
          source_prompt: string | null
          source_type: string
          task_name: string
          user_id: string
        }
        Insert: {
          ai_state?: string | null
          ai_trend?: string | null
          company?: string | null
          created_at?: string
          id?: string
          impact_level?: string | null
          job_title: string
          priority?: string | null
          recommended_template?: string
          sim_duration?: number | null
          source_document_text?: string | null
          source_prompt?: string | null
          source_type?: string
          task_name: string
          user_id: string
        }
        Update: {
          ai_state?: string | null
          ai_trend?: string | null
          company?: string | null
          created_at?: string
          id?: string
          impact_level?: string | null
          job_title?: string
          priority?: string | null
          recommended_template?: string
          sim_duration?: number | null
          source_document_text?: string | null
          source_prompt?: string | null
          source_type?: string
          task_name?: string
          user_id?: string
        }
        Relationships: []
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
      import_flags: {
        Row: {
          company_id: string | null
          company_name: string | null
          created_at: string
          details: Json
          flag_type: string
          id: string
          import_log_id: string | null
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string
          suggested_action: string | null
        }
        Insert: {
          company_id?: string | null
          company_name?: string | null
          created_at?: string
          details?: Json
          flag_type: string
          id?: string
          import_log_id?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          suggested_action?: string | null
        }
        Update: {
          company_id?: string | null
          company_name?: string | null
          created_at?: string
          details?: Json
          flag_type?: string
          id?: string
          import_log_id?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          suggested_action?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "import_flags_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_flags_import_log_id_fkey"
            columns: ["import_log_id"]
            isOneToOne: false
            referencedRelation: "import_log"
            referencedColumns: ["id"]
          },
        ]
      }
      import_log: {
        Row: {
          action: string
          ats_platform: string | null
          created_at: string
          duration_ms: number | null
          error_message: string | null
          flags_raised: number
          id: string
          initiated_by: string | null
          items_created: number
          items_processed: number
          items_skipped: number
          items_updated: number
          metadata: Json | null
          result_status: string
          source: string
          target_company_id: string | null
          target_company_name: string | null
        }
        Insert: {
          action: string
          ats_platform?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          flags_raised?: number
          id?: string
          initiated_by?: string | null
          items_created?: number
          items_processed?: number
          items_skipped?: number
          items_updated?: number
          metadata?: Json | null
          result_status?: string
          source: string
          target_company_id?: string | null
          target_company_name?: string | null
        }
        Update: {
          action?: string
          ats_platform?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          flags_raised?: number
          id?: string
          initiated_by?: string | null
          items_created?: number
          items_processed?: number
          items_skipped?: number
          items_updated?: number
          metadata?: Json | null
          result_status?: string
          source?: string
          target_company_id?: string | null
          target_company_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "import_log_target_company_id_fkey"
            columns: ["target_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      job_future_skills: {
        Row: {
          category: string
          cluster_name: string
          created_at: string
          description: string | null
          icon_emoji: string | null
          id: string
          job_id: string | null
          skill_id: string
          skill_name: string
        }
        Insert: {
          category: string
          cluster_name: string
          created_at?: string
          description?: string | null
          icon_emoji?: string | null
          id?: string
          job_id?: string | null
          skill_id: string
          skill_name: string
        }
        Update: {
          category?: string
          cluster_name?: string
          created_at?: string
          description?: string | null
          icon_emoji?: string | null
          id?: string
          job_id?: string | null
          skill_id?: string
          skill_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_future_skills_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_skills: {
        Row: {
          category: string | null
          description: string | null
          external_id: string | null
          id: string
          job_id: string
          name: string
          priority: string | null
        }
        Insert: {
          category?: string | null
          description?: string | null
          external_id?: string | null
          id?: string
          job_id: string
          name: string
          priority?: string | null
        }
        Update: {
          category?: string | null
          description?: string | null
          external_id?: string | null
          id?: string
          job_id?: string
          name?: string
          priority?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_skills_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_task_clusters: {
        Row: {
          ai_exposure_score: number | null
          ai_state: string | null
          ai_trend: string | null
          cluster_name: string
          description: string | null
          external_id: string | null
          id: string
          impact_level: string | null
          job_id: string
          job_impact_score: number | null
          outcome: string | null
          priority: string | null
          skill_names: string[] | null
          sort_order: number | null
        }
        Insert: {
          ai_exposure_score?: number | null
          ai_state?: string | null
          ai_trend?: string | null
          cluster_name: string
          description?: string | null
          external_id?: string | null
          id?: string
          impact_level?: string | null
          job_id: string
          job_impact_score?: number | null
          outcome?: string | null
          priority?: string | null
          skill_names?: string[] | null
          sort_order?: number | null
        }
        Update: {
          ai_exposure_score?: number | null
          ai_state?: string | null
          ai_trend?: string | null
          cluster_name?: string
          description?: string | null
          external_id?: string | null
          id?: string
          impact_level?: string | null
          job_id?: string
          job_impact_score?: number | null
          outcome?: string | null
          priority?: string | null
          skill_names?: string[] | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "job_task_clusters_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          augmented_percent: number | null
          automation_risk_percent: number | null
          city: string | null
          company_id: string | null
          country: string | null
          department: string | null
          description: string | null
          difficulty: number | null
          equity_text: string | null
          external_id: string | null
          id: string
          imported_at: string
          location: string | null
          new_skills_percent: number | null
          role_summary: string | null
          salary_currency: string | null
          salary_max: number | null
          salary_min: number | null
          salary_period: string | null
          seniority: string | null
          slug: string | null
          source_url: string | null
          status: string | null
          title: string
          work_mode: string | null
          workspace_id: string | null
        }
        Insert: {
          augmented_percent?: number | null
          automation_risk_percent?: number | null
          city?: string | null
          company_id?: string | null
          country?: string | null
          department?: string | null
          description?: string | null
          difficulty?: number | null
          equity_text?: string | null
          external_id?: string | null
          id?: string
          imported_at?: string
          location?: string | null
          new_skills_percent?: number | null
          role_summary?: string | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          salary_period?: string | null
          seniority?: string | null
          slug?: string | null
          source_url?: string | null
          status?: string | null
          title: string
          work_mode?: string | null
          workspace_id?: string | null
        }
        Update: {
          augmented_percent?: number | null
          automation_risk_percent?: number | null
          city?: string | null
          company_id?: string | null
          country?: string | null
          department?: string | null
          description?: string | null
          difficulty?: number | null
          equity_text?: string | null
          external_id?: string | null
          id?: string
          imported_at?: string
          location?: string | null
          new_skills_percent?: number | null
          role_summary?: string | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          salary_period?: string | null
          seniority?: string | null
          slug?: string | null
          source_url?: string | null
          status?: string | null
          title?: string
          work_mode?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "company_workspaces"
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
          career_stage: string | null
          company: string | null
          created_at: string
          cv_url: string | null
          display_name: string | null
          id: string
          job_title: string | null
          linkedin_url: string | null
          onboarding_completed: boolean
          program_name: string | null
          referral_code: string | null
          school_name: string | null
          target_roles: Json | null
        }
        Insert: {
          career_stage?: string | null
          company?: string | null
          created_at?: string
          cv_url?: string | null
          display_name?: string | null
          id: string
          job_title?: string | null
          linkedin_url?: string | null
          onboarding_completed?: boolean
          program_name?: string | null
          referral_code?: string | null
          school_name?: string | null
          target_roles?: Json | null
        }
        Update: {
          career_stage?: string | null
          company?: string | null
          created_at?: string
          cv_url?: string | null
          display_name?: string | null
          id?: string
          job_title?: string | null
          linkedin_url?: string | null
          onboarding_completed?: boolean
          program_name?: string | null
          referral_code?: string | null
          school_name?: string | null
          target_roles?: Json | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          credited: boolean
          id: string
          referral_code: string
          referred_user_id: string
          referrer_id: string
        }
        Insert: {
          created_at?: string
          credited?: boolean
          id?: string
          referral_code: string
          referred_user_id: string
          referrer_id: string
        }
        Update: {
          created_at?: string
          credited?: boolean
          id?: string
          referral_code?: string
          referred_user_id?: string
          referrer_id?: string
        }
        Relationships: []
      }
      scenarios: {
        Row: {
          description: string | null
          difficulty: number | null
          external_id: string | null
          id: string
          job_id: string | null
          slug: string | null
          title: string
        }
        Insert: {
          description?: string | null
          difficulty?: number | null
          external_id?: string | null
          id?: string
          job_id?: string | null
          slug?: string | null
          title: string
        }
        Update: {
          description?: string | null
          difficulty?: number | null
          external_id?: string | null
          id?: string
          job_id?: string | null
          slug?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenarios_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      school_accounts: {
        Row: {
          billing_interval: string
          carnegie_class: string | null
          catalog_url: string | null
          city: string | null
          contact_email: string | null
          created_at: string
          created_by: string | null
          domain: string | null
          enrollment: number | null
          expires_at: string | null
          id: string
          institution_type: string | null
          ipeds_id: string | null
          is_hbcu: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          pipeline_stage: string | null
          plan_status: string
          price_per_seat_cents: number
          short_name: string | null
          state: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          total_seats: number
          used_seats: number
          website: string | null
        }
        Insert: {
          billing_interval?: string
          carnegie_class?: string | null
          catalog_url?: string | null
          city?: string | null
          contact_email?: string | null
          created_at?: string
          created_by?: string | null
          domain?: string | null
          enrollment?: number | null
          expires_at?: string | null
          id?: string
          institution_type?: string | null
          ipeds_id?: string | null
          is_hbcu?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          pipeline_stage?: string | null
          plan_status?: string
          price_per_seat_cents?: number
          short_name?: string | null
          state?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          total_seats?: number
          used_seats?: number
          website?: string | null
        }
        Update: {
          billing_interval?: string
          carnegie_class?: string | null
          catalog_url?: string | null
          city?: string | null
          contact_email?: string | null
          created_at?: string
          created_by?: string | null
          domain?: string | null
          enrollment?: number | null
          expires_at?: string | null
          id?: string
          institution_type?: string | null
          ipeds_id?: string | null
          is_hbcu?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          pipeline_stage?: string | null
          plan_status?: string
          price_per_seat_cents?: number
          short_name?: string | null
          state?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          total_seats?: number
          used_seats?: number
          website?: string | null
        }
        Relationships: []
      }
      school_admins: {
        Row: {
          added_at: string
          id: string
          role: string
          school_id: string
          user_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          role?: string
          school_id: string
          user_id: string
        }
        Update: {
          added_at?: string
          id?: string
          role?: string
          school_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_admins_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      school_course_items: {
        Row: {
          competency_level: string | null
          course_code: string | null
          course_id: string
          course_name: string
          created_at: string | null
          description: string | null
          id: string
          is_ai_related: boolean | null
          school_id: string
          skills: Json | null
          tools: Json | null
        }
        Insert: {
          competency_level?: string | null
          course_code?: string | null
          course_id: string
          course_name: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_ai_related?: boolean | null
          school_id: string
          skills?: Json | null
          tools?: Json | null
        }
        Update: {
          competency_level?: string | null
          course_code?: string | null
          course_id?: string
          course_name?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_ai_related?: boolean | null
          school_id?: string
          skills?: Json | null
          tools?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "school_course_items_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "school_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_course_items_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school_accounts"
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
          {
            foreignKeyName: "school_courses_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school_accounts"
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
        Relationships: [
          {
            foreignKeyName: "school_curricula_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school_accounts"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "school_seats_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school_accounts"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "task_future_predictions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "company_workspaces"
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
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
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
      [_ in never]: never
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
    Enums: {},
  },
} as const
