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
      articles: {
        Row: {
          author: string
          category: string
          content: string
          created_at: string
          id: string
          image_url: string | null
          is_breaking: boolean
          is_trending: boolean
          published_at: string
          section: string
          slug: string | null
          source_id: string | null
          source_name: string
          source_url: string | null
          summary: string
          tags: string[]
          title: string
          trend_score: number
          video_url: string | null
          views: number
        }
        Insert: {
          author?: string
          category?: string
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_breaking?: boolean
          is_trending?: boolean
          published_at?: string
          section?: string
          slug?: string | null
          source_id?: string | null
          source_name?: string
          source_url?: string | null
          summary?: string
          tags?: string[]
          title: string
          trend_score?: number
          video_url?: string | null
          views?: number
        }
        Update: {
          author?: string
          category?: string
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_breaking?: boolean
          is_trending?: boolean
          published_at?: string
          section?: string
          slug?: string | null
          source_id?: string | null
          source_name?: string
          source_url?: string | null
          summary?: string
          tags?: string[]
          title?: string
          trend_score?: number
          video_url?: string | null
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "articles_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      page_views: {
        Row: {
          article_id: string | null
          country: string | null
          created_at: string
          id: string
          path: string
          referrer: string | null
          session_id: string
          station_id: number | null
          user_agent: string | null
          view_type: string
        }
        Insert: {
          article_id?: string | null
          country?: string | null
          created_at?: string
          id?: string
          path?: string
          referrer?: string | null
          session_id: string
          station_id?: number | null
          user_agent?: string | null
          view_type?: string
        }
        Update: {
          article_id?: string | null
          country?: string | null
          created_at?: string
          id?: string
          path?: string
          referrer?: string | null
          session_id?: string
          station_id?: number | null
          user_agent?: string | null
          view_type?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      sources: {
        Row: {
          alt_source_name: string | null
          alt_source_url: string | null
          assigned_category: string | null
          created_at: string
          fetch_interval: number
          fetch_method: string
          hide_source: boolean
          id: string
          is_active: boolean
          last_fetch: string | null
          name: string
          section: string
          url: string
        }
        Insert: {
          alt_source_name?: string | null
          alt_source_url?: string | null
          assigned_category?: string | null
          created_at?: string
          fetch_interval?: number
          fetch_method?: string
          hide_source?: boolean
          id?: string
          is_active?: boolean
          last_fetch?: string | null
          name: string
          section?: string
          url: string
        }
        Update: {
          alt_source_name?: string | null
          alt_source_url?: string | null
          assigned_category?: string | null
          created_at?: string
          fetch_interval?: number
          fetch_method?: string
          hide_source?: boolean
          id?: string
          is_active?: boolean
          last_fetch?: string | null
          name?: string
          section?: string
          url?: string
        }
        Relationships: []
      }
      sponsors: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          link_url: string | null
          logo_url: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          link_url?: string | null
          logo_url: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          link_url?: string | null
          logo_url?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      analytics_countries: {
        Args: { p_hours?: number; p_limit?: number }
        Returns: {
          country: string
          visits: number
        }[]
      }
      analytics_hourly: {
        Args: never
        Returns: {
          hour: string
          visits: number
        }[]
      }
      analytics_overview: { Args: never; Returns: Json }
      analytics_top_articles: {
        Args: { p_hours?: number; p_limit?: number }
        Returns: {
          article_id: string
          slug: string
          title: string
          views: number
        }[]
      }
      analytics_top_radio: {
        Args: { p_limit?: number }
        Returns: {
          listeners: number
          station_id: number
        }[]
      }
      articles_count: {
        Args: { p_category?: string; p_search?: string; p_section?: string }
        Returns: number
      }
      bulk_delete_articles: { Args: { ids: string[] }; Returns: number }
      generate_slug: { Args: { title: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      recategorize_articles: { Args: never; Returns: number }
      search_articles: {
        Args: { p_limit?: number; p_query: string; p_section?: string }
        Returns: {
          author: string
          category: string
          content: string
          id: string
          image_url: string
          is_breaking: boolean
          is_trending: boolean
          published_at: string
          rank: number
          section: string
          slug: string
          source_name: string
          source_url: string
          summary: string
          tags: string[]
          title: string
          trend_score: number
          video_url: string
          views: number
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      app_role: "admin" | "editor" | "user"
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
      app_role: ["admin", "editor", "user"],
    },
  },
} as const
