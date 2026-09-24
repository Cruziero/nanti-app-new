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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
          user_id?: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      assistant_eval_runs: {
        Row: {
          created_at: string
          critical_failures: string[]
          duration_ms: number | null
          environment: string
          failures: Json
          git_sha: string | null
          id: string
          model: string | null
          passed: number
          score: number
          suite: string
          total: number
        }
        Insert: {
          created_at?: string
          critical_failures?: string[]
          duration_ms?: number | null
          environment?: string
          failures?: Json
          git_sha?: string | null
          id?: string
          model?: string | null
          passed: number
          score: number
          suite: string
          total: number
        }
        Update: {
          created_at?: string
          critical_failures?: string[]
          duration_ms?: number | null
          environment?: string
          failures?: Json
          git_sha?: string | null
          id?: string
          model?: string | null
          passed?: number
          score?: number
          suite?: string
          total?: number
        }
        Relationships: []
      }
      automation_runtime: {
        Row: {
          endpoint_url: string | null
          key: string
          secret: string
          updated_at: string
        }
        Insert: {
          endpoint_url?: string | null
          key: string
          secret?: string
          updated_at?: string
        }
        Update: {
          endpoint_url?: string | null
          key?: string
          secret?: string
          updated_at?: string
        }
        Relationships: []
      }
      calendar_connections: {
        Row: {
          access_token: string
          calendar_id: string
          connected_at: string
          created_at: string
          id: string
          last_synced_at: string | null
          provider: string
          refresh_token: string | null
          status: string
          sync_enabled: boolean
          token_expiry: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          calendar_id?: string
          connected_at?: string
          created_at?: string
          id?: string
          last_synced_at?: string | null
          provider?: string
          refresh_token?: string | null
          status?: string
          sync_enabled?: boolean
          token_expiry: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          calendar_id?: string
          connected_at?: string
          created_at?: string
          id?: string
          last_synced_at?: string | null
          provider?: string
          refresh_token?: string | null
          status?: string
          sync_enabled?: boolean
          token_expiry?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          attendees: string[]
          created_at: string
          description: string
          end_date: string | null
          external_event_id: string
          id: string
          location: string
          provider: string
          raw_json: Json
          start_date: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attendees?: string[]
          created_at?: string
          description?: string
          end_date?: string | null
          external_event_id: string
          id?: string
          location?: string
          provider?: string
          raw_json?: Json
          start_date: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attendees?: string[]
          created_at?: string
          description?: string
          end_date?: string | null
          external_event_id?: string
          id?: string
          location?: string
          provider?: string
          raw_json?: Json
          start_date?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      calendar_oauth_states: {
        Row: {
          created_at: string
          expires_at: string
          state: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          state: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          state?: string
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string | null
          detected_at: string | null
          id: string
          message_text: string
          participant: string | null
          source: string
          source_external_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          detected_at?: string | null
          id?: string
          message_text: string
          participant?: string | null
          source?: string
          source_external_id?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string | null
          detected_at?: string | null
          id?: string
          message_text?: string
          participant?: string | null
          source?: string
          source_external_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      daily_briefings: {
        Row: {
          brief_date: string
          fingerprint: string | null
          generated_at: string
          greeting: string
          inbox: Json
          priorities: Json
          stats: Json
          summary: string
          user_id: string
          waiting: Json
        }
        Insert: {
          brief_date: string
          fingerprint?: string | null
          generated_at?: string
          greeting: string
          inbox?: Json
          priorities?: Json
          stats?: Json
          summary: string
          user_id: string
          waiting?: Json
        }
        Update: {
          brief_date?: string
          fingerprint?: string | null
          generated_at?: string
          greeting?: string
          inbox?: Json
          priorities?: Json
          stats?: Json
          summary?: string
          user_id?: string
          waiting?: Json
        }
        Relationships: []
      }
      entity_aliases: {
        Row: {
          active: boolean
          alias_key: string
          alias_text: string
          canonical_name: string
          confidence: number
          created_at: string
          entity_type: string
          evidence_count: number
          id: string
          last_seen_at: string
          metadata: Json
          person_id: string | null
          project_id: string | null
          source: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          alias_key: string
          alias_text: string
          canonical_name: string
          confidence?: number
          created_at?: string
          entity_type: string
          evidence_count?: number
          id?: string
          last_seen_at?: string
          metadata?: Json
          person_id?: string | null
          project_id?: string | null
          source?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          alias_key?: string
          alias_text?: string
          canonical_name?: string
          confidence?: number
          created_at?: string
          entity_type?: string
          evidence_count?: number
          id?: string
          last_seen_at?: string
          metadata?: Json
          person_id?: string | null
          project_id?: string | null
          source?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_aliases_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_aliases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      inbox_items: {
        Row: {
          clarification_question: string | null
          clarification_type: string | null
          conversation_text: string | null
          created_at: string | null
          due_date: string | null
          id: string
          person_name: string | null
          project_name: string | null
          semantic_context: Json
          source: string
          source_external_id: string | null
          source_type: string | null
          status: string
          task_id: string | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          clarification_question?: string | null
          clarification_type?: string | null
          conversation_text?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          person_name?: string | null
          project_name?: string | null
          semantic_context?: Json
          source?: string
          source_external_id?: string | null
          source_type?: string | null
          status?: string
          task_id?: string | null
          title: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          clarification_question?: string | null
          clarification_type?: string | null
          conversation_text?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          person_name?: string | null
          project_name?: string | null
          semantic_context?: Json
          source?: string
          source_external_id?: string | null
          source_type?: string | null
          status?: string
          task_id?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inbox_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          dedupe_key: string
          id: string
          item_id: string | null
          notification_type: string
          read_at: string | null
          status: string
          title: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          dedupe_key: string
          id?: string
          item_id?: string | null
          notification_type: string
          read_at?: string | null
          status?: string
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          dedupe_key?: string
          id?: string
          item_id?: string | null
          notification_type?: string
          read_at?: string | null
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      people: {
        Row: {
          company: string | null
          created_at: string | null
          id: string
          last_conversation_at: string | null
          name: string
          phone: string | null
          role: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          id?: string
          last_conversation_at?: string | null
          name: string
          phone?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          company?: string | null
          created_at?: string | null
          id?: string
          last_conversation_at?: string | null
          name?: string
          phone?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      person_activity: {
        Row: {
          conversation_id: string | null
          created_at: string
          dedupe_key: string | null
          event_type: string
          id: string
          item_id: string | null
          metadata: Json
          occurred_at: string
          person_id: string
          source: string | null
          summary: string
          user_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          dedupe_key?: string | null
          event_type: string
          id?: string
          item_id?: string | null
          metadata?: Json
          occurred_at?: string
          person_id: string
          source?: string | null
          summary: string
          user_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          dedupe_key?: string | null
          event_type?: string
          id?: string
          item_id?: string | null
          metadata?: Json
          occurred_at?: string
          person_id?: string
          source?: string | null
          summary?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "person_activity_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_activity_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      product_events: {
        Row: {
          created_at: string
          event_name: string
          id: string
          item_id: string | null
          properties: Json
          source: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_name: string
          id?: string
          item_id?: string | null
          properties?: Json
          source?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_name?: string
          id?: string
          item_id?: string | null
          properties?: Json
          source?: string | null
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          ai_note: string
          confidence: number
          conversation_id: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          last_reminded_at: string | null
          person_id: string | null
          person_name: string | null
          priority: string
          project_id: string | null
          project_name: string | null
          quote: string
          reminder_channels: string[]
          reminder_count: number
          reminder_enabled: boolean
          reminder_intensity: string | null
          reminder_time: string | null
          semantic_context: Json
          source: string
          source_external_id: string | null
          source_type: string | null
          status: string
          time: string | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_note?: string
          confidence?: number
          conversation_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          last_reminded_at?: string | null
          person_id?: string | null
          person_name?: string | null
          priority?: string
          project_id?: string | null
          project_name?: string | null
          quote?: string
          reminder_channels?: string[]
          reminder_count?: number
          reminder_enabled?: boolean
          reminder_intensity?: string | null
          reminder_time?: string | null
          semantic_context?: Json
          source?: string
          source_external_id?: string | null
          source_type?: string | null
          status?: string
          time?: string | null
          title: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          ai_note?: string
          confidence?: number
          conversation_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          last_reminded_at?: string | null
          person_id?: string | null
          person_name?: string | null
          priority?: string
          project_id?: string | null
          project_name?: string | null
          quote?: string
          reminder_channels?: string[]
          reminder_count?: number
          reminder_enabled?: boolean
          reminder_intensity?: string | null
          reminder_time?: string | null
          semantic_context?: Json
          source?: string
          source_external_id?: string | null
          source_type?: string | null
          status?: string
          time?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_language_memory: {
        Row: {
          active: boolean
          confidence: number
          created_at: string
          evidence_count: number
          example_text: string | null
          id: string
          last_used_at: string | null
          learned_value: Json
          memory_type: string
          pattern_key: string
          pattern_text: string
          source_item_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          confidence?: number
          created_at?: string
          evidence_count?: number
          example_text?: string | null
          id?: string
          last_used_at?: string | null
          learned_value?: Json
          memory_type: string
          pattern_key: string
          pattern_text: string
          source_item_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          confidence?: number
          created_at?: string
          evidence_count?: number
          example_text?: string | null
          id?: string
          last_used_at?: string | null
          learned_value?: Json
          memory_type?: string
          pattern_key?: string
          pattern_text?: string
          source_item_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_routines: {
        Row: {
          active: boolean
          confidence: number
          created_at: string
          evidence_count: number
          example_text: string | null
          id: string
          last_observed_at: string
          learned_value: Json
          routine_key: string
          routine_type: string
          source_item_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          confidence?: number
          created_at?: string
          evidence_count?: number
          example_text?: string | null
          id?: string
          last_observed_at?: string
          learned_value?: Json
          routine_key: string
          routine_type: string
          source_item_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          confidence?: number
          created_at?: string
          evidence_count?: number
          example_text?: string | null
          id?: string
          last_observed_at?: string
          learned_value?: Json
          routine_key?: string
          routine_type?: string
          source_item_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          settings: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          settings?: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          settings?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      waiting_items: {
        Row: {
          ai_note: string
          auto_follow_up_enabled: boolean
          confidence: number
          conversation_id: string | null
          created_at: string | null
          days_warning_threshold: number | null
          follow_up_at: string | null
          follow_up_count: number
          id: string
          last_followed_up_at: string | null
          person_id: string | null
          person_name: string | null
          project_id: string | null
          project_name: string | null
          quote: string
          semantic_context: Json
          source: string
          source_external_id: string | null
          source_type: string | null
          started_at: string | null
          status: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_note?: string
          auto_follow_up_enabled?: boolean
          confidence?: number
          conversation_id?: string | null
          created_at?: string | null
          days_warning_threshold?: number | null
          follow_up_at?: string | null
          follow_up_count?: number
          id?: string
          last_followed_up_at?: string | null
          person_id?: string | null
          person_name?: string | null
          project_id?: string | null
          project_name?: string | null
          quote?: string
          semantic_context?: Json
          source?: string
          source_external_id?: string | null
          source_type?: string | null
          started_at?: string | null
          status?: string
          title: string
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          ai_note?: string
          auto_follow_up_enabled?: boolean
          confidence?: number
          conversation_id?: string | null
          created_at?: string | null
          days_warning_threshold?: number | null
          follow_up_at?: string | null
          follow_up_count?: number
          id?: string
          last_followed_up_at?: string | null
          person_id?: string | null
          person_name?: string | null
          project_id?: string | null
          project_name?: string | null
          quote?: string
          semantic_context?: Json
          source?: string
          source_external_id?: string | null
          source_type?: string | null
          started_at?: string | null
          status?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waiting_items_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waiting_items_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waiting_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_configs: {
        Row: {
          access_token: string
          app_secret: string
          business_account_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          phone_number_id: string
          updated_at: string | null
          user_id: string
          verify_token: string
        }
        Insert: {
          access_token: string
          app_secret: string
          business_account_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          phone_number_id: string
          updated_at?: string | null
          user_id?: string
          verify_token: string
        }
        Update: {
          access_token?: string
          app_secret?: string
          business_account_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          phone_number_id?: string
          updated_at?: string | null
          user_id?: string
          verify_token?: string
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          content: string
          created_at: string
          direction: string
          error: string | null
          external_message_id: string
          from_number: string | null
          id: string
          message_type: string
          raw_payload: Json | null
          status: string
          to_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          direction: string
          error?: string | null
          external_message_id: string
          from_number?: string | null
          id?: string
          message_type?: string
          raw_payload?: Json | null
          status?: string
          to_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          direction?: string
          error?: string | null
          external_message_id?: string
          from_number?: string | null
          id?: string
          message_type?: string
          raw_payload?: Json | null
          status?: string
          to_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_user_links: {
        Row: {
          created_at: string
          id: string
          link_code: string | null
          link_expires_at: string | null
          pending_inbox_id: string | null
          phone_number: string | null
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          link_code?: string | null
          link_expires_at?: string | null
          pending_inbox_id?: string | null
          phone_number?: string | null
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          link_code?: string | null
          link_expires_at?: string | null
          pending_inbox_id?: string | null
          phone_number?: string | null
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_user_links_pending_inbox_id_fkey"
            columns: ["pending_inbox_id"]
            isOneToOne: false
            referencedRelation: "inbox_items"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      promote_inbox_item: {
        Args: {
          p_due_date?: string
          p_id: string
          p_person_name?: string
          p_title?: string
        }
        Returns: Json
      }
      record_entity_alias: {
        Args: {
          p_alias_text: string
          p_canonical_name: string
          p_confidence?: number
          p_entity_id: string
          p_entity_type: string
          p_metadata?: Json
          p_source?: string
        }
        Returns: {
          active: boolean
          alias_key: string
          alias_text: string
          canonical_name: string
          confidence: number
          created_at: string
          entity_type: string
          evidence_count: number
          id: string
          last_seen_at: string
          metadata: Json
          person_id: string | null
          project_id: string | null
          source: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "entity_aliases"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      record_language_memory: {
        Args: {
          p_confidence?: number
          p_example_text?: string
          p_learned_value?: Json
          p_memory_type: string
          p_pattern_key: string
          p_pattern_text: string
          p_source_item_id?: string
        }
        Returns: {
          active: boolean
          confidence: number
          created_at: string
          evidence_count: number
          example_text: string | null
          id: string
          last_used_at: string | null
          learned_value: Json
          memory_type: string
          pattern_key: string
          pattern_text: string
          source_item_id: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_language_memory"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      record_user_routine: {
        Args: {
          p_confidence?: number
          p_example_text?: string
          p_learned_value?: Json
          p_routine_key: string
          p_routine_type: string
          p_source_item_id?: string
          p_title: string
        }
        Returns: {
          active: boolean
          confidence: number
          created_at: string
          evidence_count: number
          example_text: string | null
          id: string
          last_observed_at: string
          learned_value: Json
          routine_key: string
          routine_type: string
          source_item_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_routines"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      resolve_person_memory: {
        Args: { p_company?: string; p_name: string }
        Returns: {
          company: string | null
          created_at: string | null
          id: string
          last_conversation_at: string | null
          name: string
          phone: string | null
          role: string | null
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "people"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      resolve_project_memory: {
        Args: { p_name: string }
        Returns: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "projects"
          isOneToOne: true
          isSetofReturn: false
        }
      }
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
    Enums: {},
  },
} as const
