import { createBrowserClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  return Boolean(
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes("your-project") &&
    !SUPABASE_ANON_KEY.includes("your-anon-key")
  );
}

export function createClient() {
  if (!isSupabaseConfigured()) {
    console.warn(
      "⚠️ Supabase is not configured. Please update your .env.local file with valid credentials.\n" +
      "Get your credentials from: https://supabase.com/dashboard\n" +
      "Required environment variables:\n" +
      "  - NEXT_PUBLIC_SUPABASE_URL\n" +
      "  - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }
  
  return createSupabaseClient<Database>(
    SUPABASE_URL || "https://placeholder.supabase.co",
    SUPABASE_ANON_KEY || "placeholder-key"
  );
}

// Singleton instance for client-side usage
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (!supabaseInstance) {
    supabaseInstance = createClient();
  }
  return supabaseInstance;
}

// Custom error class for better error messages
export class SupabaseError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message);
    this.name = "SupabaseError";
  }
}

// Helper to extract meaningful error message
export function getErrorMessage(error: unknown): string {
  if (!isSupabaseConfigured()) {
    return "Supabase is not configured. Please set up your .env.local file with valid credentials.";
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === "object" && error !== null) {
    const err = error as Record<string, unknown>;
    if (err.message) return String(err.message);
    if (err.error_description) return String(err.error_description);
    if (err.details) return String(err.details);
  }
  
  return "An unknown error occurred";
}
