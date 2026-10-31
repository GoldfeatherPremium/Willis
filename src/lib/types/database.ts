/**
 * Supabase database types for HomeAtlas.
 *
 * This file is the contract between the SQL migrations (supabase/migrations/)
 * and the application. Keep it in sync with the migrations. The PostgreSQL
 * schema is the source of truth; this file mirrors it for type safety.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PlanId = "explorer" | "personal" | "family" | "collector";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "unpaid" | "incomplete";
export type ScanStatus = "pending" | "validated" | "processing" | "completed" | "failed" | "canceled";
export type JobStatus = "queued" | "running" | "completed" | "failed" | "canceled";
export type ObservationVerification = "unverified" | "confirmed" | "corrected";
export type SpatialEntityType = "zone" | "furniture" | "container" | "object" | "room";
export type SpatialRelationshipType = "contains" | "in" | "located_in" | "near" | "part_of";
export type ActivityType =
  | "home_created"
  | "room_created"
  | "scan_started"
  | "scan_completed"
  | "scan_failed"
  | "object_created"
  | "object_updated"
  | "object_verified"
  | "object_location_changed"
  | "report_generated"
  | "member_added"
  | "subscription_changed";
export type HomeType = "house" | "apartment" | "studio" | "loft" | "townhouse" | "other";
export type RoomType =
  | "living_room"
  | "kitchen"
  | "bedroom"
  | "bathroom"
  | "study"
  | "storage"
  | "hallway"
  | "garage"
  | "balcony"
  | "other";
export type ObjectCategory =
  | "furniture"
  | "electronics"
  | "appliance"
  | "book"
  | "accessory"
  | "clothing"
  | "collectible"
  | "storage_container"
  | "document"
  | "other";
export type ScanCaptureType = "photos" | "video" | "mixed";
export type AssetKind = "image" | "video" | "audio";
export type DocumentKind = "receipt" | "manual" | "warranty" | "other";
export type NotificationType = "scan_completed" | "scan_failed" | "object_verified" | "family_invite" | "subscription" | "system";
export type MemberRole = "owner" | "admin" | "member" | "viewer";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: PlanId;
          status: SubscriptionStatus;
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          price_cents: number;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan?: PlanId;
          status?: SubscriptionStatus;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          price_cents: number;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan?: PlanId;
          status?: SubscriptionStatus;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          price_cents?: number;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      homes: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          home_type: HomeType;
          address: string | null;
          currency: string;
          thumbnail_url: string | null;
          is_demo: boolean;
          created_at: string;
          updated_at: string;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          home_type?: HomeType;
          address?: string | null;
          currency?: string;
          thumbnail_url?: string | null;
          is_demo?: boolean;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          home_type?: HomeType;
          address?: string | null;
          currency?: string;
          thumbnail_url?: string | null;
          is_demo?: boolean;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "homes_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      home_members: {
        Row: {
          id: string;
          home_id: string;
          user_id: string;
          role: MemberRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          home_id: string;
          user_id: string;
          role?: MemberRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          home_id?: string;
          user_id?: string;
          role?: MemberRole;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "home_members_home_id_fkey";
            columns: ["home_id"];
            isOneToOne: false;
            referencedRelation: "homes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "home_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      rooms: {
        Row: {
          id: string;
          home_id: string;
          name: string;
          room_type: RoomType;
          floor: number;
          position: Json | null;
          width: number;
          length: number;
          height: number;
          thumbnail_url: string | null;
          is_demo: boolean;
          created_at: string;
          updated_at: string;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          home_id: string;
          name: string;
          room_type?: RoomType;
          floor?: number;
          position?: Json | null;
          width?: number;
          length?: number;
          height?: number;
          thumbnail_url?: string | null;
          is_demo?: boolean;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Update: {
          id?: string;
          home_id?: string;
          name?: string;
          room_type?: RoomType;
          floor?: number;
          position?: Json | null;
          width?: number;
          length?: number;
          height?: number;
          thumbnail_url?: string | null;
          is_demo?: boolean;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "rooms_home_id_fkey";
            columns: ["home_id"];
            isOneToOne: false;
            referencedRelation: "homes";
            referencedColumns: ["id"];
          }
        ];
      };
      scans: {
        Row: {
          id: string;
          room_id: string;
          home_id: string;
          status: ScanStatus;
          provider: string;
          provider_job_id: string | null;
          capture_type: ScanCaptureType;
          quality_score: number | null;
          error: string | null;
          is_simulated: boolean;
          raw_payload: Json | null;
          created_at: string;
          updated_at: string;
          started_at: string | null;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          room_id: string;
          home_id: string;
          status?: ScanStatus;
          provider: string;
          provider_job_id?: string | null;
          capture_type?: ScanCaptureType;
          quality_score?: number | null;
          error?: string | null;
          is_simulated?: boolean;
          raw_payload?: Json | null;
          created_at?: string;
          updated_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          room_id?: string;
          home_id?: string;
          status?: ScanStatus;
          provider?: string;
          provider_job_id?: string | null;
          capture_type?: ScanCaptureType;
          quality_score?: number | null;
          error?: string | null;
          is_simulated?: boolean;
          raw_payload?: Json | null;
          created_at?: string;
          updated_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "scans_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "scans_home_id_fkey";
            columns: ["home_id"];
            isOneToOne: false;
            referencedRelation: "homes";
            referencedColumns: ["id"];
          }
        ];
      };
      scan_assets: {
        Row: {
          id: string;
          scan_id: string;
          kind: AssetKind;
          storage_path: string;
          mime_type: string | null;
          size_bytes: number | null;
          width: number | null;
          height: number | null;
          duration_ms: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          scan_id: string;
          kind: AssetKind;
          storage_path: string;
          mime_type?: string | null;
          size_bytes?: number | null;
          width?: number | null;
          height?: number | null;
          duration_ms?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          scan_id?: string;
          kind?: AssetKind;
          storage_path?: string;
          mime_type?: string | null;
          size_bytes?: number | null;
          width?: number | null;
          height?: number | null;
          duration_ms?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "scan_assets_scan_id_fkey";
            columns: ["scan_id"];
            isOneToOne: false;
            referencedRelation: "scans";
            referencedColumns: ["id"];
          }
        ];
      };
      reconstruction_jobs: {
        Row: {
          id: string;
          scan_id: string;
          home_id: string;
          room_id: string;
          provider: string;
          provider_job_id: string | null;
          status: JobStatus;
          attempt: number;
          progress: number;
          result_uri: string | null;
          result_type: string | null;
          error: string | null;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          scan_id: string;
          home_id: string;
          room_id: string;
          provider: string;
          provider_job_id?: string | null;
          status?: JobStatus;
          attempt?: number;
          progress?: number;
          result_uri?: string | null;
          result_type?: string | null;
          error?: string | null;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          scan_id?: string;
          home_id?: string;
          room_id?: string;
          provider?: string;
          provider_job_id?: string | null;
          status?: JobStatus;
          attempt?: number;
          progress?: number;
          result_uri?: string | null;
          result_type?: string | null;
          error?: string | null;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "reconstruction_jobs_scan_id_fkey";
            columns: ["scan_id"];
            isOneToOne: false;
            referencedRelation: "scans";
            referencedColumns: ["id"];
          }
        ];
      };
      objects: {
        Row: {
          id: string;
          home_id: string;
          room_id: string | null;
          name: string;
          category: ObjectCategory;
          description: string | null;
          brand: string | null;
          model: string | null;
          serial_number: string | null;
          condition: string | null;
          value_cents: number | null;
          thumbnail_url: string | null;
          image_storage_path: string | null;
          created_by: string;
          source_scan_id: string | null;
          ai_extracted: Json | null;
          is_demo: boolean;
          created_at: string;
          updated_at: string;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          home_id: string;
          room_id?: string | null;
          name: string;
          category?: ObjectCategory;
          description?: string | null;
          brand?: string | null;
          model?: string | null;
          serial_number?: string | null;
          condition?: string | null;
          value_cents?: number | null;
          thumbnail_url?: string | null;
          image_storage_path?: string | null;
          created_by: string;
          source_scan_id?: string | null;
          ai_extracted?: Json | null;
          is_demo?: boolean;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Update: {
          id?: string;
          home_id?: string;
          room_id?: string | null;
          name?: string;
          category?: ObjectCategory;
          description?: string | null;
          brand?: string | null;
          model?: string | null;
          serial_number?: string | null;
          condition?: string | null;
          value_cents?: number | null;
          thumbnail_url?: string | null;
          image_storage_path?: string | null;
          created_by?: string;
          source_scan_id?: string | null;
          ai_extracted?: Json | null;
          is_demo?: boolean;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "objects_home_id_fkey";
            columns: ["home_id"];
            isOneToOne: false;
            referencedRelation: "homes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "objects_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "objects_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      object_observations: {
        Row: {
          id: string;
          object_id: string;
          scan_id: string | null;
          room_id: string | null;
          container_object_id: string | null;
          position: Json | null;
          coordinate_frame: string;
          observed_at: string;
          confidence: number;
          source: string;
          verification_status: ObservationVerification;
          created_at: string;
        };
        Insert: {
          id?: string;
          object_id: string;
          scan_id?: string | null;
          room_id?: string | null;
          container_object_id?: string | null;
          position?: Json | null;
          coordinate_frame?: string;
          observed_at?: string;
          confidence?: number;
          source?: string;
          verification_status?: ObservationVerification;
          created_at?: string;
        };
        Update: {
          id?: string;
          object_id?: string;
          scan_id?: string | null;
          room_id?: string | null;
          container_object_id?: string | null;
          position?: Json | null;
          coordinate_frame?: string;
          observed_at?: string;
          confidence?: number;
          source?: string;
          verification_status?: ObservationVerification;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "object_observations_object_id_fkey";
            columns: ["object_id"];
            isOneToOne: false;
            referencedRelation: "objects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "object_observations_scan_id_fkey";
            columns: ["scan_id"];
            isOneToOne: false;
            referencedRelation: "scans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "object_observations_container_object_id_fkey";
            columns: ["container_object_id"];
            isOneToOne: false;
            referencedRelation: "objects";
            referencedColumns: ["id"];
          }
        ];
      };
      object_locations: {
        Row: {
          id: string;
          object_id: string;
          home_id: string;
          room_id: string | null;
          container_object_id: string | null;
          position: Json | null;
          coordinate_frame: string;
          observed_at: string;
          source: string;
          confidence: number;
          verification_status: ObservationVerification;
          is_current: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          object_id: string;
          home_id: string;
          room_id?: string | null;
          container_object_id?: string | null;
          position?: Json | null;
          coordinate_frame?: string;
          observed_at?: string;
          source?: string;
          confidence?: number;
          verification_status?: ObservationVerification;
          is_current?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          object_id?: string;
          home_id?: string;
          room_id?: string | null;
          container_object_id?: string | null;
          position?: Json | null;
          coordinate_frame?: string;
          observed_at?: string;
          source?: string;
          confidence?: number;
          verification_status?: ObservationVerification;
          is_current?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "object_locations_object_id_fkey";
            columns: ["object_id"];
            isOneToOne: false;
            referencedRelation: "objects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "object_locations_home_id_fkey";
            columns: ["home_id"];
            isOneToOne: false;
            referencedRelation: "homes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "object_locations_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          }
        ];
      };
      spatial_nodes: {
        Row: {
          id: string;
          home_id: string;
          entity_type: SpatialEntityType;
          entity_id: string;
          parent_node_id: string | null;
          label: string | null;
          position: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          home_id: string;
          entity_type: SpatialEntityType;
          entity_id: string;
          parent_node_id?: string | null;
          label?: string | null;
          position?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          home_id?: string;
          entity_type?: SpatialEntityType;
          entity_id?: string;
          parent_node_id?: string | null;
          label?: string | null;
          position?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "spatial_nodes_home_id_fkey";
            columns: ["home_id"];
            isOneToOne: false;
            referencedRelation: "homes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "spatial_nodes_parent_node_id_fkey";
            columns: ["parent_node_id"];
            isOneToOne: false;
            referencedRelation: "spatial_nodes";
            referencedColumns: ["id"];
          }
        ];
      };
      spatial_relationships: {
        Row: {
          id: string;
          home_id: string;
          source_node_id: string;
          target_node_id: string;
          relationship_type: SpatialRelationshipType;
          strength: number;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          home_id: string;
          source_node_id: string;
          target_node_id: string;
          relationship_type: SpatialRelationshipType;
          strength?: number;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          home_id?: string;
          source_node_id?: string;
          target_node_id?: string;
          relationship_type?: SpatialRelationshipType;
          strength?: number;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "spatial_relationships_home_id_fkey";
            columns: ["home_id"];
            isOneToOne: false;
            referencedRelation: "homes";
            referencedColumns: ["id"];
          }
        ];
      };
      object_documents: {
        Row: {
          id: string;
          object_id: string;
          home_id: string;
          kind: DocumentKind;
          storage_path: string;
          filename: string;
          mime_type: string | null;
          size_bytes: number | null;
          uploaded_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          object_id: string;
          home_id: string;
          kind: DocumentKind;
          storage_path: string;
          filename: string;
          mime_type?: string | null;
          size_bytes?: number | null;
          uploaded_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          object_id?: string;
          home_id?: string;
          kind?: DocumentKind;
          storage_path?: string;
          filename?: string;
          mime_type?: string | null;
          size_bytes?: number | null;
          uploaded_by?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "object_documents_object_id_fkey";
            columns: ["object_id"];
            isOneToOne: false;
            referencedRelation: "objects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "object_documents_home_id_fkey";
            columns: ["home_id"];
            isOneToOne: false;
            referencedRelation: "homes";
            referencedColumns: ["id"];
          }
        ];
      };
      object_embeddings: {
        Row: {
          id: string;
          object_id: string;
          embedding: string;
          model: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          object_id: string;
          embedding: string;
          model: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          object_id?: string;
          embedding?: string;
          model?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "object_embeddings_object_id_fkey";
            columns: ["object_id"];
            isOneToOne: true;
            referencedRelation: "objects";
            referencedColumns: ["id"];
          }
        ];
      };
      conversations: {
        Row: {
          id: string;
          home_id: string | null;
          user_id: string;
          title: string;
          is_demo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          home_id?: string | null;
          user_id: string;
          title?: string;
          is_demo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          home_id?: string | null;
          user_id?: string;
          title?: string;
          is_demo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "conversations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversations_home_id_fkey";
            columns: ["home_id"];
            isOneToOne: false;
            referencedRelation: "homes";
            referencedColumns: ["id"];
          }
        ];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: string;
          content: string;
          tool_calls: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: string;
          content: string;
          tool_calls?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          role?: string;
          content?: string;
          tool_calls?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          }
        ];
      };
      activity_events: {
        Row: {
          id: string;
          home_id: string | null;
          actor_id: string | null;
          type: ActivityType;
          payload: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          home_id?: string | null;
          actor_id?: string | null;
          type: ActivityType;
          payload?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          home_id?: string | null;
          actor_id?: string | null;
          type?: ActivityType;
          payload?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activity_events_home_id_fkey";
            columns: ["home_id"];
            isOneToOne: false;
            referencedRelation: "homes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activity_events_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          home_id: string | null;
          type: NotificationType;
          title: string;
          body: string | null;
          link: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          home_id?: string | null;
          type: NotificationType;
          title: string;
          body?: string | null;
          link?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          home_id?: string | null;
          type?: NotificationType;
          title?: string;
          body?: string | null;
          link?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      processing_usage: {
        Row: {
          id: string;
          user_id: string;
          event_type: string;
          units: number;
          metered_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_type: string;
          units?: number;
          metered_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          event_type?: string;
          units?: number;
          metered_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "processing_usage_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      user_homes: {
        Row: {
          home_id: string;
          name: string;
          home_type: HomeType;
          owner_id: string;
          member_role: MemberRole;
          is_demo: boolean;
          created_at: string;
          room_count: number;
          object_count: number;
          last_scan_at: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      get_my_home_ids: {
        Args: Record<PropertyKey, never>;
        Returns: string[];
      };
      is_home_member: {
        Args: { home_id: string };
        Returns: boolean;
      };
      create_demo_home: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      calculate_current_month_captures: {
        Args: { user_id: string };
        Returns: number;
      };
    };
    Enums: {
      plan_id: PlanId;
      subscription_status: SubscriptionStatus;
      scan_status: ScanStatus;
      job_status: JobStatus;
      observation_verification: ObservationVerification;
      spatial_entity_type: SpatialEntityType;
      spatial_relationship_type: SpatialRelationshipType;
      activity_type: ActivityType;
      home_type: HomeType;
      room_type: RoomType;
      object_category: ObjectCategory;
      scan_capture_type: ScanCaptureType;
      asset_kind: AssetKind;
      document_kind: DocumentKind;
      notification_type: NotificationType;
      member_role: MemberRole;
    };
    CompositeTypes: {
      [key: string]: unknown;
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type Profile = Tables<"profiles">;
export type Subscription = Tables<"subscriptions">;
export type Home = Tables<"homes">;
export type HomeMember = Tables<"home_members">;
export type Room = Tables<"rooms">;
export type Scan = Tables<"scans">;
export type ScanAsset = Tables<"scan_assets">;
export type ReconstructionJob = Tables<"reconstruction_jobs">;
export type Object = Tables<"objects">;
export type ObjectObservation = Tables<"object_observations">;
export type ObjectLocation = Tables<"object_locations">;
export type SpatialNode = Tables<"spatial_nodes">;
export type SpatialRelationship = Tables<"spatial_relationships">;
export type ObjectDocument = Tables<"object_documents">;
export type ObjectEmbedding = Tables<"object_embeddings">;
export type Conversation = Tables<"conversations">;
export type Message = Tables<"messages">;
export type ActivityEvent = Tables<"activity_events">;
export type Notification = Tables<"notifications">;
export type ProcessingUsage = Tables<"processing_usage">;
export type UserHome = Database["public"]["Views"]["user_homes"]["Row"];
