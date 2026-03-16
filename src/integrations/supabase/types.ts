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
          context: string | null
          description: string | null
          detected_ats_platform: string | null
          employee_range: string | null
          external_id: string | null
          headquarters: string | null
          id: string
          imported_at: string
          industry: string | null
          is_demo: boolean | null
          logo_url: string | null
          name: string
          slug: string | null
          website: string | null
        }
        Insert: {
          brand_color?: string | null
          careers_url?: string | null
          context?: string | null
          description?: string | null
          detected_ats_platform?: string | null
          employee_range?: string | null
          external_id?: string | null
          headquarters?: string | null
          id?: string
          imported_at?: string
          industry?: string | null
          is_demo?: boolean | null
          logo_url?: string | null
          name: string
          slug?: string | null
          website?: string | null
        }
        Update: {
          brand_color?: string | null
          careers_url?: string | null
          context?: string | null
          description?: string | null
          detected_ats_platform?: string | null
          employee_range?: string | null
          external_id?: string | null
          headquarters?: string | null
          id?: string
          imported_at?: string
          industry?: string | null
          is_demo?: boolean | null
          logo_url?: string | null
          name?: string
          slug?: string | null
          website?: string | null
        }
        Relationships: []
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
          experience_level: string | null
          human_value_add_score: number | null
          id: string
          job_title: string
          rounds_completed: number
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
          experience_level?: string | null
          human_value_add_score?: number | null
          id?: string
          job_title: string
          rounds_completed?: number
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
          experience_level?: string | null
          human_value_add_score?: number | null
          id?: string
          job_title?: string
          rounds_completed?: number
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
          company_id: string | null
          department: string | null
          description: string | null
          difficulty: number | null
          external_id: string | null
          id: string
          imported_at: string
          location: string | null
          new_skills_percent: number | null
          seniority: string | null
          slug: string | null
          source_url: string | null
          status: string | null
          title: string
        }
        Insert: {
          augmented_percent?: number | null
          automation_risk_percent?: number | null
          company_id?: string | null
          department?: string | null
          description?: string | null
          difficulty?: number | null
          external_id?: string | null
          id?: string
          imported_at?: string
          location?: string | null
          new_skills_percent?: number | null
          seniority?: string | null
          slug?: string | null
          source_url?: string | null
          status?: string | null
          title: string
        }
        Update: {
          augmented_percent?: number | null
          automation_risk_percent?: number | null
          company_id?: string | null
          department?: string | null
          description?: string | null
          difficulty?: number | null
          external_id?: string | null
          id?: string
          imported_at?: string
          location?: string | null
          new_skills_percent?: number | null
          seniority?: string | null
          slug?: string | null
          source_url?: string | null
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company: string | null
          created_at: string
          display_name: string | null
          id: string
          job_title: string | null
          onboarding_completed: boolean
        }
        Insert: {
          company?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          job_title?: string | null
          onboarding_completed?: boolean
        }
        Update: {
          company?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          job_title?: string | null
          onboarding_completed?: boolean
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
