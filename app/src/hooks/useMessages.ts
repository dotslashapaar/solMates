"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { getSupabase, getErrorMessage, Message, MessageInsert } from "@/lib/supabase";

export function useMessages() {
  const { publicKey } = useWallet();
  const [incomingMessages, setIncomingMessages] = useState<Message[]>([]);
  const [sentMessages, setSentMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const walletAddress = publicKey?.toBase58();

  const fetchMessages = useCallback(async () => {
    if (!walletAddress) {
      setIncomingMessages([]);
      setSentMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();

      // Fetch incoming messages
      const { data: incoming, error: incomingError } = await supabase
        .from("messages")
        .select("*")
        .eq("recipient_wallet", walletAddress)
        .order("created_at", { ascending: false });

      if (incomingError) throw incomingError;

      // Fetch sent messages
      const { data: sent, error: sentError } = await supabase
        .from("messages")
        .select("*")
        .eq("sender_wallet", walletAddress)
        .order("created_at", { ascending: false });

      if (sentError) throw sentError;

      setIncomingMessages(incoming || []);
      setSentMessages(sent || []);
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err);
      console.error("Error fetching messages:", errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!walletAddress) return;

    const supabase = getSupabase();
    
    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `recipient_wallet=eq.${walletAddress}`,
        },
        () => {
          fetchMessages();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `sender_wallet=eq.${walletAddress}`,
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [walletAddress, fetchMessages]);

  return { incomingMessages, sentMessages, loading, error, refetch: fetchMessages };
}

export function useSendMessage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (data: MessageInsert): Promise<Message | null> => {
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();
      const { data: newMessage, error: insertError } = await supabase
        .from("messages")
        .insert(data)
        .select()
        .single();

      if (insertError) throw insertError;

      return newMessage;
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err);
      console.error("Error sending message:", errorMsg);
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { sendMessage, loading, error };
}

export function useUpdateMessageStatus() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = async (
    messageId: string,
    status: Message["escrow_status"],
    txSignature?: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();
      const { error: updateError } = await supabase
        .from("messages")
        .update({ 
          escrow_status: status,
          ...(txSignature && { escrow_tx_signature: txSignature })
        })
        .eq("id", messageId);

      if (updateError) throw updateError;

      return true;
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err);
      console.error("Error updating message status:", errorMsg);
      setError(errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { updateStatus, loading, error };
}
