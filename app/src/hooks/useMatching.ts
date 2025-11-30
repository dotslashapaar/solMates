"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { getSupabase, getErrorMessage, Like, Match, Profile } from "@/lib/supabase";

export function useLikes() {
  const { publicKey } = useWallet();
  const [likedProfiles, setLikedProfiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const walletAddress = publicKey?.toBase58();

  const fetchLikes = useCallback(async () => {
    if (!walletAddress) {
      setLikedProfiles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();
      const { data, error: fetchError } = await supabase
        .from("likes")
        .select("liked_wallet")
        .eq("liker_wallet", walletAddress);

      if (fetchError) throw fetchError;

      setLikedProfiles(data?.map((l) => l.liked_wallet) || []);
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err);
      console.error("Error fetching likes:", errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchLikes();
  }, [fetchLikes]);

  return { likedProfiles, loading, error, refetch: fetchLikes };
}

export function useLikeProfile() {
  const { publicKey } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const likeProfile = async (
    likedWallet: string,
    isSuperLike = false
  ): Promise<{ liked: boolean; matched: boolean }> => {
    const walletAddress = publicKey?.toBase58();
    
    if (!walletAddress) {
      setError("Wallet not connected");
      return { liked: false, matched: false };
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();

      // Insert like
      const { error: insertError } = await supabase.from("likes").insert({
        liker_wallet: walletAddress,
        liked_wallet: likedWallet,
        is_super_like: isSuperLike,
      });

      if (insertError) throw insertError;

      // Check if it's a match (the trigger will create the match, but we check for UI)
      const { data: matchData } = await supabase
        .from("matches")
        .select("*")
        .or(
          `and(wallet_a.eq.${walletAddress},wallet_b.eq.${likedWallet}),and(wallet_a.eq.${likedWallet},wallet_b.eq.${walletAddress})`
        )
        .single();

      return { liked: true, matched: !!matchData };
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err);
      console.error("Error liking profile:", errorMsg);
      setError(errorMsg);
      return { liked: false, matched: false };
    } finally {
      setLoading(false);
    }
  };

  return { likeProfile, loading, error };
}

export function useMatches() {
  const { publicKey } = useWallet();
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchedProfiles, setMatchedProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const walletAddress = publicKey?.toBase58();

  const fetchMatches = useCallback(async () => {
    if (!walletAddress) {
      setMatches([]);
      setMatchedProfiles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();

      // Fetch matches
      const { data: matchData, error: matchError } = await supabase
        .from("matches")
        .select("*")
        .or(`wallet_a.eq.${walletAddress},wallet_b.eq.${walletAddress}`)
        .order("matched_at", { ascending: false });

      if (matchError) throw matchError;

      setMatches(matchData || []);

      // Get matched wallet addresses
      const matchedWallets = (matchData || []).map((m) =>
        m.wallet_a === walletAddress ? m.wallet_b : m.wallet_a
      );

      if (matchedWallets.length > 0) {
        // Fetch profiles of matched users
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .in("wallet_address", matchedWallets);

        if (profileError) throw profileError;

        setMatchedProfiles(profileData || []);
      } else {
        setMatchedProfiles([]);
      }
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err);
      console.error("Error fetching matches:", errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!walletAddress) return;

    const supabase = getSupabase();
    
    const channel = supabase
      .channel("matches")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "matches",
        },
        (payload) => {
          const match = payload.new as Match;
          if (match.wallet_a === walletAddress || match.wallet_b === walletAddress) {
            fetchMatches();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [walletAddress, fetchMatches]);

  return { matches, matchedProfiles, loading, error, refetch: fetchMatches };
}
