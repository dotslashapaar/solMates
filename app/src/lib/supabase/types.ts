export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Gender type used throughout the app
export type GenderType = "male" | "female" | "non-binary" | "other";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          wallet_address: string;
          name: string;
          age: number;
          gender: GenderType;
          looking_for: GenderType[];
          bio: string;
          location: string | null;
          occupation: string | null;
          interests: string[];
          photos: string[];
          dm_price: number;
          asset_gate_mint: string | null;
          min_asset_amount: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          wallet_address: string;
          name: string;
          age: number;
          gender: GenderType;
          looking_for: GenderType[];
          bio: string;
          location?: string | null;
          occupation?: string | null;
          interests?: string[];
          photos?: string[];
          dm_price?: number;
          asset_gate_mint?: string | null;
          min_asset_amount?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          wallet_address?: string;
          name?: string;
          age?: number;
          gender?: GenderType;
          looking_for?: GenderType[];
          bio?: string;
          location?: string | null;
          occupation?: string | null;
          interests?: string[];
          photos?: string[];
          dm_price?: number;
          asset_gate_mint?: string | null;
          min_asset_amount?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          sender_wallet: string;
          recipient_wallet: string;
          content: string;
          escrow_amount: number;
          escrow_status: "pending" | "accepted" | "declined" | "refunded";
          escrow_tx_signature: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sender_wallet: string;
          recipient_wallet: string;
          content: string;
          escrow_amount: number;
          escrow_status?: "pending" | "accepted" | "declined" | "refunded";
          escrow_tx_signature?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sender_wallet?: string;
          recipient_wallet?: string;
          content?: string;
          escrow_amount?: number;
          escrow_status?: "pending" | "accepted" | "declined" | "refunded";
          escrow_tx_signature?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      auctions: {
        Row: {
          id: string;
          host_wallet: string;
          auction_id: number;
          title: string;
          description: string;
          start_price: number;
          current_bid: number;
          highest_bidder_wallet: string | null;
          end_time: string;
          status: "active" | "ended" | "claimed" | "cancelled";
          tx_signature: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          host_wallet: string;
          auction_id: number;
          title: string;
          description: string;
          start_price: number;
          current_bid?: number;
          highest_bidder_wallet?: string | null;
          end_time: string;
          status?: "active" | "ended" | "claimed" | "cancelled";
          tx_signature?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          host_wallet?: string;
          auction_id?: number;
          title?: string;
          description?: string;
          start_price?: number;
          current_bid?: number;
          highest_bidder_wallet?: string | null;
          end_time?: string;
          status?: "active" | "ended" | "claimed" | "cancelled";
          tx_signature?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      auction_bids: {
        Row: {
          id: string;
          auction_id: string;
          bidder_wallet: string;
          amount: number;
          tx_signature: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          auction_id: string;
          bidder_wallet: string;
          amount: number;
          tx_signature?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          auction_id?: string;
          bidder_wallet?: string;
          amount?: number;
          tx_signature?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      bounties: {
        Row: {
          id: string;
          issuer_wallet: string;
          description: string;
          preferences: string[];
          reward_amount: number;
          status: "open" | "filled" | "cancelled";
          matchmaker_wallet: string | null;
          matched_wallet: string | null;
          tx_signature: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          issuer_wallet: string;
          description: string;
          preferences?: string[];
          reward_amount: number;
          status?: "open" | "filled" | "cancelled";
          matchmaker_wallet?: string | null;
          matched_wallet?: string | null;
          tx_signature?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          issuer_wallet?: string;
          description?: string;
          preferences?: string[];
          reward_amount?: number;
          status?: "open" | "filled" | "cancelled";
          matchmaker_wallet?: string | null;
          matched_wallet?: string | null;
          tx_signature?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      bounty_submissions: {
        Row: {
          id: string;
          bounty_id: string;
          matchmaker_wallet: string;
          suggested_wallet: string;
          note: string | null;
          status: "pending" | "accepted" | "rejected";
          created_at: string;
        };
        Insert: {
          id?: string;
          bounty_id: string;
          matchmaker_wallet: string;
          suggested_wallet: string;
          note?: string | null;
          status?: "pending" | "accepted" | "rejected";
          created_at?: string;
        };
        Update: {
          id?: string;
          bounty_id?: string;
          matchmaker_wallet?: string;
          suggested_wallet?: string;
          note?: string | null;
          status?: "pending" | "accepted" | "rejected";
          created_at?: string;
        };
        Relationships: [];
      };
      likes: {
        Row: {
          id: string;
          liker_wallet: string;
          liked_wallet: string;
          is_super_like: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          liker_wallet: string;
          liked_wallet: string;
          is_super_like?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          liker_wallet?: string;
          liked_wallet?: string;
          is_super_like?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      matches: {
        Row: {
          id: string;
          wallet_a: string;
          wallet_b: string;
          matched_at: string;
        };
        Insert: {
          id?: string;
          wallet_a: string;
          wallet_b: string;
          matched_at?: string;
        };
        Update: {
          id?: string;
          wallet_a?: string;
          wallet_b?: string;
          matched_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      gender_type: "male" | "female" | "non-binary" | "other";
      escrow_status: "pending" | "accepted" | "declined" | "refunded";
      auction_status: "active" | "ended" | "claimed" | "cancelled";
      bounty_status: "open" | "filled" | "cancelled";
      submission_status: "pending" | "accepted" | "rejected";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Helper types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type MessageInsert = Database["public"]["Tables"]["messages"]["Insert"];

export type Auction = Database["public"]["Tables"]["auctions"]["Row"];
export type AuctionInsert = Database["public"]["Tables"]["auctions"]["Insert"];
export type AuctionBid = Database["public"]["Tables"]["auction_bids"]["Row"];

export type Bounty = Database["public"]["Tables"]["bounties"]["Row"];
export type BountyInsert = Database["public"]["Tables"]["bounties"]["Insert"];
export type BountySubmission = Database["public"]["Tables"]["bounty_submissions"]["Row"];

export type Like = Database["public"]["Tables"]["likes"]["Row"];
export type Match = Database["public"]["Tables"]["matches"]["Row"];
