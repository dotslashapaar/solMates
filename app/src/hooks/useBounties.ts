"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { getSupabase, getErrorMessage, Bounty, BountyInsert, BountySubmission } from "@/lib/supabase";

export function useBounties(options?: { status?: Bounty["status"]; issuerWallet?: string }) {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBounties = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();
      let query = supabase
        .from("bounties")
        .select("*")
        .order("reward_amount", { ascending: false });

      if (options?.status) {
        query = query.eq("status", options.status);
      }

      if (options?.issuerWallet) {
        query = query.eq("issuer_wallet", options.issuerWallet);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setBounties(data || []);
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err);
      console.error("Error fetching bounties:", errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [options?.status, options?.issuerWallet]);

  useEffect(() => {
    fetchBounties();
  }, [fetchBounties]);

  return { bounties, loading, error, refetch: fetchBounties };
}

export function useBountySubmissions(bountyId: string) {
  const [submissions, setSubmissions] = useState<BountySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async () => {
    if (!bountyId) {
      setSubmissions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();
      const { data, error: fetchError } = await supabase
        .from("bounty_submissions")
        .select("*")
        .eq("bounty_id", bountyId)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setSubmissions(data || []);
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err);
      console.error("Error fetching submissions:", errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [bountyId]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  return { submissions, loading, error, refetch: fetchSubmissions };
}

export function useCreateBounty() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBounty = async (data: BountyInsert): Promise<Bounty | null> => {
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();
      const { data: newBounty, error: insertError } = await supabase
        .from("bounties")
        .insert(data)
        .select()
        .single();

      if (insertError) throw insertError;

      return newBounty;
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err);
      console.error("Error creating bounty:", errorMsg);
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createBounty, loading, error };
}

export function useSubmitToBounty() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitMatch = async (
    bountyId: string,
    matchmakerWallet: string,
    suggestedWallet: string,
    note?: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();
      const { error: insertError } = await supabase.from("bounty_submissions").insert({
        bounty_id: bountyId,
        matchmaker_wallet: matchmakerWallet,
        suggested_wallet: suggestedWallet,
        note,
      });

      if (insertError) throw insertError;

      return true;
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err);
      console.error("Error submitting to bounty:", errorMsg);
      setError(errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { submitMatch, loading, error };
}

export function useAcceptSubmission() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptSubmission = async (
    submissionId: string,
    bountyId: string,
    matchmakerWallet: string,
    matchedWallet: string,
    txSignature?: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();

      // Update submission status
      const { error: submissionError } = await supabase
        .from("bounty_submissions")
        .update({ status: "accepted" })
        .eq("id", submissionId);

      if (submissionError) throw submissionError;

      // Update bounty status
      const { error: bountyError } = await supabase
        .from("bounties")
        .update({
          status: "filled",
          matchmaker_wallet: matchmakerWallet,
          matched_wallet: matchedWallet,
          tx_signature: txSignature,
        })
        .eq("id", bountyId);

      if (bountyError) throw bountyError;

      return true;
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err);
      console.error("Error accepting submission:", errorMsg);
      setError(errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { acceptSubmission, loading, error };
}
