"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { getSupabase, getErrorMessage, isSupabaseConfigured, Profile, ProfileInsert, ProfileUpdate } from "@/lib/supabase";

export function useProfile(walletAddress?: string) {
  const { publicKey } = useWallet();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const address = walletAddress || publicKey?.toBase58();

  const fetchProfile = useCallback(async () => {
    if (!address) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();
      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("wallet_address", address)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
      }

      setProfile(data || null);
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err);
      console.error("Error fetching profile:", errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, error, refetch: fetchProfile };
}

export function useProfiles(options?: { limit?: number; excludeWallet?: string }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();
      let query = supabase
        .from("profiles")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (options?.excludeWallet) {
        query = query.neq("wallet_address", options.excludeWallet);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setProfiles(data || []);
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err);
      console.error("Error fetching profiles:", errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [options?.limit, options?.excludeWallet]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  return { profiles, loading, error, refetch: fetchProfiles };
}

export function useCreateProfile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProfile = async (data: ProfileInsert): Promise<Profile | null> => {
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();
      const { data: newProfile, error: insertError } = await supabase
        .from("profiles")
        .insert(data)
        .select()
        .single();

      if (insertError) throw insertError;

      return newProfile;
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err);
      console.error("Error creating profile:", errorMsg);
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createProfile, loading, error };
}

export function useUpdateProfile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = async (
    walletAddress: string,
    data: ProfileUpdate
  ): Promise<Profile | null> => {
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();
      const { data: updatedProfile, error: updateError } = await supabase
        .from("profiles")
        .update(data)
        .eq("wallet_address", walletAddress)
        .select()
        .single();

      if (updateError) throw updateError;

      return updatedProfile;
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err);
      console.error("Error updating profile:", errorMsg);
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { updateProfile, loading, error };
}
