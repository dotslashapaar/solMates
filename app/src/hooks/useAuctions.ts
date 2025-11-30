"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { getSupabase, getErrorMessage, Auction, AuctionInsert, AuctionBid } from "@/lib/supabase";

export function useAuctions(options?: { status?: Auction["status"]; hostWallet?: string }) {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAuctions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();
      let query = supabase
        .from("auctions")
        .select("*")
        .order("end_time", { ascending: true });

      if (options?.status) {
        query = query.eq("status", options.status);
      }

      if (options?.hostWallet) {
        query = query.eq("host_wallet", options.hostWallet);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setAuctions(data || []);
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err);
      console.error("Error fetching auctions:", errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [options?.status, options?.hostWallet]);

  useEffect(() => {
    fetchAuctions();
  }, [fetchAuctions]);

  // Subscribe to realtime updates
  useEffect(() => {
    const supabase = getSupabase();
    
    const channel = supabase
      .channel("auctions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "auctions",
        },
        () => {
          fetchAuctions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAuctions]);

  return { auctions, loading, error, refetch: fetchAuctions };
}

export function useAuction(auctionId: string) {
  const [auction, setAuction] = useState<Auction | null>(null);
  const [bids, setBids] = useState<AuctionBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAuction = useCallback(async () => {
    if (!auctionId) {
      setAuction(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();

      // Fetch auction
      const { data: auctionData, error: auctionError } = await supabase
        .from("auctions")
        .select("*")
        .eq("id", auctionId)
        .single();

      if (auctionError) throw auctionError;

      // Fetch bids
      const { data: bidsData, error: bidsError } = await supabase
        .from("auction_bids")
        .select("*")
        .eq("auction_id", auctionId)
        .order("amount", { ascending: false });

      if (bidsError) throw bidsError;

      setAuction(auctionData);
      setBids(bidsData || []);
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err);
      console.error("Error fetching auction:", errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [auctionId]);

  useEffect(() => {
    fetchAuction();
  }, [fetchAuction]);

  return { auction, bids, loading, error, refetch: fetchAuction };
}

export function useCreateAuction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAuction = async (data: AuctionInsert): Promise<Auction | null> => {
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();
      const { data: newAuction, error: insertError } = await supabase
        .from("auctions")
        .insert(data)
        .select()
        .single();

      if (insertError) throw insertError;

      return newAuction;
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err);
      console.error("Error creating auction:", errorMsg);
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createAuction, loading, error };
}

export function usePlaceBid() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const placeBid = async (
    auctionId: string,
    bidderWallet: string,
    amount: number,
    txSignature?: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();

      // Insert bid record
      const { error: bidError } = await supabase.from("auction_bids").insert({
        auction_id: auctionId,
        bidder_wallet: bidderWallet,
        amount,
        tx_signature: txSignature,
      });

      if (bidError) throw bidError;

      // Update auction with new highest bid
      const { error: updateError } = await supabase
        .from("auctions")
        .update({
          current_bid: amount,
          highest_bidder_wallet: bidderWallet,
        })
        .eq("id", auctionId);

      if (updateError) throw updateError;

      return true;
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err);
      console.error("Error placing bid:", errorMsg);
      setError(errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { placeBid, loading, error };
}
