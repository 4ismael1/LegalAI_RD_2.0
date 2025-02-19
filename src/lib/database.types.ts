export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          address: string | null
          email_notifications: boolean
          weekly_summary: boolean
          dark_mode: boolean
          updated_at: string
          created_at: string
          avatar_url: string | null
          role: 'user' | 'admin'
        }
        Insert: {
          id: string
          full_name?: string | null
          phone?: string | null
          address?: string | null
          email_notifications?: boolean
          weekly_summary?: boolean
          dark_mode?: boolean
          updated_at?: string
          created_at?: string
          avatar_url?: string | null
          role?: 'user' | 'admin'
        }
        Update: {
          id?: string
          full_name?: string | null
          phone?: string | null
          address?: string | null
          email_notifications?: boolean
          weekly_summary?: boolean
          dark_mode?: boolean
          updated_at?: string
          created_at?: string
          avatar_url?: string | null
          role?: 'user' | 'admin'
        }
      }
      chat_sessions: {
        Row: {
          id: string
          user_id: string
          title: string
          created_at: string
          updated_at: string
          thread_id: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          created_at?: string
          updated_at?: string
          thread_id: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          created_at?: string
          updated_at?: string
          thread_id?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          session_id: string
          role: 'user' | 'assistant'
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          role: 'user' | 'assistant'
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          role?: 'user' | 'assistant'
          content?: string
          created_at?: string
        }
      }
      advisories: {
        Row: {
          id: string
          user_id: string
          full_name: string
          email: string
          subject: string
          description: string
          status: 'pending' | 'reviewed'
          response: string | null
          responded_at: string | null
          responded_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name: string
          email: string
          subject: string
          description: string
          status?: 'pending' | 'reviewed'
          response?: string | null
          responded_at?: string | null
          responded_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string
          email?: string
          subject?: string
          description?: string
          status?: 'pending' | 'reviewed'
          response?: string | null
          responded_at?: string | null
          responded_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}