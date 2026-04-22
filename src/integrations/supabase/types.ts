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
      ads_2col: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          is_fixed: boolean
          link: string | null
          section_id: string
          show_border: boolean
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_fixed?: boolean
          link?: string | null
          section_id: string
          show_border?: boolean
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_fixed?: boolean
          link?: string | null
          section_id?: string
          show_border?: boolean
          sort_order?: number
        }
        Relationships: []
      }
      ads_3col: {
        Row: {
          created_at: string
          description: string | null
          heading: string | null
          id: string
          image_url: string | null
          is_fixed: boolean
          link: string | null
          section_id: string
          show_border: boolean
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          heading?: string | null
          id?: string
          image_url?: string | null
          is_fixed?: boolean
          link?: string | null
          section_id: string
          show_border?: boolean
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          heading?: string | null
          id?: string
          image_url?: string | null
          is_fixed?: boolean
          link?: string | null
          section_id?: string
          show_border?: boolean
          sort_order?: number
        }
        Relationships: []
      }
      categories: {
        Row: {
          bg_color: string
          created_at: string
          detail_description: string | null
          detail_heading: string | null
          icon_url: string | null
          id: string
          name: string
          section_id: string
          sort_order: number
          subcategories_tab_label: string | null
          updated_at: string
        }
        Insert: {
          bg_color?: string
          created_at?: string
          detail_description?: string | null
          detail_heading?: string | null
          icon_url?: string | null
          id?: string
          name: string
          section_id: string
          sort_order?: number
          subcategories_tab_label?: string | null
          updated_at?: string
        }
        Update: {
          bg_color?: string
          created_at?: string
          detail_description?: string | null
          detail_heading?: string | null
          icon_url?: string | null
          id?: string
          name?: string
          section_id?: string
          sort_order?: number
          subcategories_tab_label?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      category_downloads: {
        Row: {
          category_id: string
          created_at: string
          file_name: string
          file_type: string
          file_url: string
          id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          file_name: string
          file_type?: string
          file_url: string
          id?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          file_name?: string
          file_type?: string
          file_url?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_downloads_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      category_features: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          id: string
          sort_order: number
          title: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          title: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_features_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      category_sub_features: {
        Row: {
          created_at: string
          description: string | null
          feature_id: string
          id: string
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          feature_id: string
          id?: string
          sort_order?: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          feature_id?: string
          id?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_sub_features_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "category_features"
            referencedColumns: ["id"]
          },
        ]
      }
      featured_cards: {
        Row: {
          created_at: string
          description: string
          id: string
          is_fixed: boolean
          logo_url: string | null
          section_id: string
          show_border: boolean
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          is_fixed?: boolean
          logo_url?: string | null
          section_id: string
          show_border?: boolean
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_fixed?: boolean
          logo_url?: string | null
          section_id?: string
          show_border?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      category_buttons: {
        Row: {
          category_id: string
          created_at: string
          id: string
          is_visible: boolean
          label: string
          link: string | null
          sort_order: number
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          is_visible?: boolean
          label: string
          link?: string | null
          sort_order?: number
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          is_visible?: boolean
          label?: string
          link?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "category_buttons_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      hero_settings: {
        Row: {
          animated_words: string[]
          created_at: string
          id: string
          main_text: string
          updated_at: string
        }
        Insert: {
          animated_words?: string[]
          created_at?: string
          id?: string
          main_text?: string
          updated_at?: string
        }
        Update: {
          animated_words?: string[]
          created_at?: string
          id?: string
          main_text?: string
          updated_at?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          created_at: string
          description: string | null
          heading: string
          id: string
          image_url: string | null
          is_fixed: boolean
          link: string | null
          section_id: string
          show_border: boolean
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          heading: string
          id?: string
          image_url?: string | null
          is_fixed?: boolean
          link?: string | null
          section_id: string
          show_border?: boolean
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          heading?: string
          id?: string
          image_url?: string | null
          is_fixed?: boolean
          link?: string | null
          section_id?: string
          show_border?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      page_sections: {
        Row: {
          created_at: string
          description: string | null
          heading: string
          id: string
          is_locked: boolean
          is_visible: boolean
          name: string
          section_type: string
          show_heading: boolean
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          heading?: string
          id?: string
          is_locked?: boolean
          is_visible?: boolean
          name: string
          section_type: string
          show_heading?: boolean
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          heading?: string
          id?: string
          is_locked?: boolean
          is_visible?: boolean
          name?: string
          section_type?: string
          show_heading?: boolean
          sort_order?: number
        }
        Relationships: []
      }
      subcategories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          link: string | null
          name: string
          schedule_link: string | null
          show_schedule_in_separate_tab: boolean
          sort_order: number
          video_url?: string | null
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          link?: string | null
          name: string
          schedule_link?: string | null
          show_schedule_in_separate_tab?: boolean
          sort_order?: number
          video_url?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          link?: string | null
          name?: string
          schedule_link?: string | null
          show_schedule_in_separate_tab?: boolean
          sort_order?: number
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
