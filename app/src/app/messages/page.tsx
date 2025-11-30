"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  MessageCircle,
  Check,
  X,
  Clock,
  DollarSign,
  Send,
  Loader2,
} from "lucide-react";
import { useMessages, useUpdateMessageStatus } from "@/hooks/useMessages";
import { useProfiles } from "@/hooks/useProfiles";
import type { Message, Profile } from "@/lib/supabase";
import { useSolmatesProgram } from "@/lib/anchor/hooks";
import { acceptDm, refundDm } from "@/lib/anchor/program";
import { getGenderAvatar } from "@/lib/constants";

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / 3600000);

  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function shortenWallet(wallet: string): string {
  if (wallet.length <= 10) return wallet;
  return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
}

export default function MessagesPage() {
  const { connected, publicKey } = useWallet();
  const [activeTab, setActiveTab] = useState<"incoming" | "sent">("incoming");
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Fetch messages from Supabase
  const { incomingMessages, sentMessages, loading, error, refetch } = useMessages();
  const { updateStatus, loading: statusLoading } = useUpdateMessageStatus();
  const program = useSolmatesProgram();
  
  // Fetch profiles to display sender/recipient info
  const { profiles } = useProfiles();
  
  // Build a map of wallet -> profile for quick lookup
  const [profileMap, setProfileMap] = useState<Record<string, Profile>>({});
  
  useEffect(() => {
    if (profiles.length > 0) {
      const map: Record<string, Profile> = {};
      profiles.forEach((p) => {
        map[p.wallet_address] = p;
      });
      setProfileMap(map);
    }
  }, [profiles]);

  const handleAccept = async (message: Message) => {
    if (!publicKey || !program) return;
    
    setProcessingId(message.id);
    try {
      // Call on-chain acceptDm instruction
      const senderPubkey = new PublicKey(message.sender_wallet);
      const txSignature = await acceptDm(program, senderPubkey, publicKey);
      
      // Update Supabase status with tx signature
      const success = await updateStatus(message.id, "accepted", txSignature);
      if (success) {
        refetch();
      }
    } catch (err: any) {
      console.error("Error accepting DM:", err);
      // Still update Supabase if on-chain fails (for demo purposes)
      await updateStatus(message.id, "accepted");
      refetch();
    }
    setProcessingId(null);
  };

  const handleDecline = async (message: Message) => {
    if (!publicKey || !program) return;
    
    setProcessingId(message.id);
    try {
      // Call on-chain refundDm instruction (sender gets refund)
      const senderPubkey = new PublicKey(message.sender_wallet);
      const txSignature = await refundDm(program, senderPubkey, publicKey);
      
      // Update Supabase status with tx signature
      const success = await updateStatus(message.id, "declined", txSignature);
      if (success) {
        refetch();
      }
    } catch (err: any) {
      console.error("Error declining DM:", err);
      // Still update Supabase if on-chain fails (for demo purposes)
      await updateStatus(message.id, "declined");
      refetch();
    }
    setProcessingId(null);
  };
  
  // Get profile image or generate avatar based on gender
  const getProfileImage = (wallet: string) => {
    const profile = profileMap[wallet];
    if (profile?.photos && profile.photos.length > 0) {
      return profile.photos[0];
    }
    return getGenderAvatar(wallet, profile?.gender);
  };
  
  // Get profile name or shortened wallet
  const getProfileName = (wallet: string) => {
    const profile = profileMap[wallet];
    return profile?.name || shortenWallet(wallet);
  };

  if (!connected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <div className="relative w-20 h-20 mx-auto mb-6 rounded-full overflow-hidden bg-zinc-900 ring-1 ring-white/10">
            <Image
              src="/logo.png"
              alt="SolMates Logo"
              fill
              className="object-cover"
            />
          </div>
          <h1 className="text-xl font-semibold text-white mb-3">
            Connect to View Messages
          </h1>
          <p className="text-zinc-500 text-sm">
            Connect your wallet to see your incoming and sent messages.
          </p>
        </div>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error loading messages: {error}</p>
          <Button onClick={refetch}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Subtle decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-rose-500/[0.03] rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-orange-500/[0.03] rounded-full blur-[80px]" />
      </div>

      <div className="relative container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-zinc-900 ring-1 ring-white/10">
              <Image
                src="/logo.png"
                alt="SolMates Logo"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">
                <span className="gradient-flame-text">Messages</span>
              </h1>
              <p className="text-zinc-500 text-sm">
                Manage your DM escrows
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab("incoming")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === "incoming"
                  ? "bg-rose-500 text-white"
                  : "bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] border border-white/[0.06]"
              }`}
            >
              Incoming ({incomingMessages.length})
            </button>
            <button
              onClick={() => setActiveTab("sent")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === "sent"
                  ? "bg-rose-500 text-white"
                  : "bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] border border-white/[0.06]"
              }`}
            >
              Sent ({sentMessages.length})
            </button>
          </div>

          {/* Messages List */}
          <div className="space-y-3">
            {activeTab === "incoming" ? (
              incomingMessages.length > 0 ? (
                incomingMessages.map((msg) => (
                  <Card key={msg.id} className="rounded-xl bg-zinc-900 border-white/[0.06]">
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <img
                          src={getProfileImage(msg.sender_wallet)}
                          alt={getProfileName(msg.sender_wallet)}
                          className="w-12 h-12 rounded-lg bg-zinc-800"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-medium text-white">{getProfileName(msg.sender_wallet)}</h3>
                            <span className="text-[10px] text-zinc-600">
                              {formatTimeAgo(msg.created_at)}
                            </span>
                          </div>
                          <p className="text-sm text-zinc-500 truncate mb-3">
                            {msg.content}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/10 rounded-md border border-rose-500/20">
                              <DollarSign className="w-3.5 h-3.5 text-rose-400" />
                              <span className="text-sm font-medium text-rose-400">{msg.escrow_amount} USDC</span>
                            </div>
                            {msg.escrow_status === "pending" ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleDecline(msg)}
                                  disabled={processingId === msg.id}
                                  className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-zinc-500 hover:border-red-500/30 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 flex items-center gap-1 text-xs font-medium disabled:opacity-50"
                                >
                                  {processingId === msg.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <X className="w-3.5 h-3.5" />
                                  )}
                                  Decline
                                </button>
                                <Button
                                  size="sm"
                                  onClick={() => handleAccept(msg)}
                                  disabled={processingId === msg.id}
                                >
                                  {processingId === msg.id ? (
                                    <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                                  ) : (
                                    <Check className="w-3.5 h-3.5 mr-1" />
                                  )}
                                  Accept
                                </Button>
                              </div>
                            ) : (
                              <div
                                className={`px-2.5 py-1 rounded-md text-xs flex items-center gap-1 font-medium ${
                                  msg.escrow_status === "accepted"
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                    : msg.escrow_status === "declined"
                                    ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                }`}
                              >
                                {msg.escrow_status === "accepted" ? (
                                  <Check className="w-3.5 h-3.5" />
                                ) : msg.escrow_status === "declined" ? (
                                  <X className="w-3.5 h-3.5" />
                                ) : (
                                  <Clock className="w-3.5 h-3.5" />
                                )}
                                {msg.escrow_status.charAt(0).toUpperCase() + msg.escrow_status.slice(1)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <MessageCircle className="w-12 h-12 text-zinc-800 mx-auto mb-3" />
                  <p className="text-zinc-600 text-sm">No incoming messages yet</p>
                </div>
              )
            ) : sentMessages.length > 0 ? (
              sentMessages.map((msg) => (
                <Card key={msg.id} className="rounded-xl bg-zinc-900 border-white/[0.06]">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <img
                        src={getProfileImage(msg.recipient_wallet)}
                        alt={getProfileName(msg.recipient_wallet)}
                        className="w-12 h-12 rounded-lg bg-zinc-800"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-white">{getProfileName(msg.recipient_wallet)}</h3>
                          <span className="text-[10px] text-zinc-600">
                            {formatTimeAgo(msg.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-500 truncate mb-3">
                          {msg.content}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/10 rounded-md border border-rose-500/20">
                            <DollarSign className="w-3.5 h-3.5 text-rose-400" />
                            <span className="text-sm font-medium text-rose-400">{msg.escrow_amount} USDC</span>
                          </div>
                          <div
                            className={`px-2.5 py-1 rounded-md text-xs flex items-center gap-1 font-medium ${
                              msg.escrow_status === "accepted"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : msg.escrow_status === "declined"
                                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}
                          >
                            {msg.escrow_status === "accepted" ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : msg.escrow_status === "declined" ? (
                              <X className="w-3.5 h-3.5" />
                            ) : (
                              <Clock className="w-3.5 h-3.5" />
                            )}
                            {msg.escrow_status.charAt(0).toUpperCase() + msg.escrow_status.slice(1)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <Send className="w-12 h-12 text-zinc-800 mx-auto mb-3" />
                <p className="text-zinc-600 text-sm">No sent messages yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
