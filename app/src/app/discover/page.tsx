"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { useWallet } from "@solana/wallet-adapter-react";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { Button } from "@/components/ui/Button";
import { Heart, X, Star, Loader2, MessageCircle, DollarSign, Send } from "lucide-react";
import { useProfiles, useProfile } from "@/hooks/useProfiles";
import { useLikes, useLikeProfile } from "@/hooks/useMatching";
import { useSendMessage } from "@/hooks/useMessages";
import { shortenAddress, formatUsdc, parseUsdc, getGenderAvatar } from "@/lib/constants";
import { useSolmatesProgram } from "@/lib/anchor/hooks";
import { depositForDm } from "@/lib/anchor/program";
import type { Profile, GenderType } from "@/lib/supabase";

// Gradient colors for profile cards
const GRADIENT_COLORS = [
  "from-rose-500 to-orange-400",
  "from-violet-500 to-purple-400",
  "from-cyan-500 to-blue-500",
  "from-emerald-500 to-teal-400",
  "from-amber-500 to-yellow-400",
  "from-pink-500 to-rose-400",
];

function getGradient(index: number): string {
  return GRADIENT_COLORS[index % GRADIENT_COLORS.length];
}

export default function DiscoverPage() {
  const { connected, publicKey } = useWallet();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [passedWallets, setPassedWallets] = useState<string[]>([]);
  const [matchNotification, setMatchNotification] = useState<string | null>(null);
  const [showDmModal, setShowDmModal] = useState(false);
  const [dmMessage, setDmMessage] = useState("");
  const [sendingDm, setSendingDm] = useState(false);
  const [dmError, setDmError] = useState<string | null>(null);

  const walletAddress = publicKey?.toBase58();
  
  // Fetch current user's profile to get their preferences
  const { profile: myProfile, loading: myProfileLoading } = useProfile();
  
  // Fetch profiles excluding current user
  const { profiles, loading: profilesLoading, error: profilesError, refetch } = useProfiles({
    excludeWallet: walletAddress,
    limit: 50,
  });
  
  // Fetch user's existing likes
  const { likedProfiles, loading: likesLoading } = useLikes();
  
  // Like mutation hook
  const { likeProfile, loading: likingInProgress } = useLikeProfile();
  
  // DM hooks
  const { sendMessage } = useSendMessage();
  const program = useSolmatesProgram();

  // Filter out already liked, passed profiles, and apply gender preference matching
  const availableProfiles = profiles.filter((p) => {
    // Exclude already liked and passed
    if (likedProfiles.includes(p.wallet_address) || passedWallets.includes(p.wallet_address)) {
      return false;
    }
    
    // If user has preferences set, filter by them
    if (myProfile?.looking_for && myProfile.looking_for.length > 0) {
      // Check if profile's gender matches user's preferences
      if (!myProfile.looking_for.includes(p.gender)) {
        return false;
      }
    }
    
    // If the other person has preferences, check if our gender matches
    if (p.looking_for && p.looking_for.length > 0 && myProfile?.gender) {
      if (!p.looking_for.includes(myProfile.gender)) {
        return false;
      }
    }
    
    return true;
  });

  const currentProfile = availableProfiles[currentIndex];
  const isLoading = profilesLoading || likesLoading || myProfileLoading;

  const handleLike = useCallback(async (isSuperLike = false) => {
    if (!currentProfile || likingInProgress) return;

    const result = await likeProfile(currentProfile.wallet_address, isSuperLike);
    
    if (result.matched) {
      setMatchNotification(currentProfile.name);
      setTimeout(() => setMatchNotification(null), 3000);
    }

    if (currentIndex < availableProfiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentProfile, likeProfile, likingInProgress, currentIndex, availableProfiles.length]);

  const handlePass = useCallback(() => {
    if (!currentProfile) return;
    setPassedWallets((prev) => [...prev, currentProfile.wallet_address]);
    if (currentIndex < availableProfiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentProfile, currentIndex, availableProfiles.length]);

  const handleSendDm = useCallback(async () => {
    if (!currentProfile || !publicKey || !program || !dmMessage.trim()) return;
    
    setSendingDm(true);
    setDmError(null);
    
    try {
      // First, deposit on-chain
      const txSignature = await depositForDm(
        program,
        publicKey,
        new (await import("@solana/web3.js")).PublicKey(currentProfile.wallet_address),
        currentProfile.dm_price
      );
      
      // Then record in Supabase
      await sendMessage({
        sender_wallet: publicKey.toBase58(),
        recipient_wallet: currentProfile.wallet_address,
        content: dmMessage.trim(),
        escrow_amount: currentProfile.dm_price,
        escrow_status: "pending",
        escrow_tx_signature: txSignature,
      });
      
      setShowDmModal(false);
      setDmMessage("");
      
      // Move to next profile after sending
      if (currentIndex < availableProfiles.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    } catch (err: any) {
      console.error("Error sending DM:", err);
      setDmError(err.message || "Failed to send DM. Please try again.");
    } finally {
      setSendingDm(false);
    }
  }, [currentProfile, publicKey, program, dmMessage, sendMessage, currentIndex, availableProfiles.length]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePass();
      else if (e.key === "ArrowRight") handleLike(false);
      else if (e.key === "ArrowUp") handleLike(true);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleLike, handlePass]);

  // Refetch profiles when myProfile loads (handles fresh redirect from profile creation)
  useEffect(() => {
    if (myProfile && !myProfileLoading) {
      refetch();
    }
  }, [myProfile, myProfileLoading, refetch]);

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
          <h1 className="text-xl font-semibold text-white mb-3">Connect to Discover</h1>
          <p className="text-zinc-500 text-sm">
            Connect your wallet to start discovering your perfect match.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-rose-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-500 text-sm">Loading profiles...</p>
        </div>
      </div>
    );
  }

  if (profilesError) {
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
          <h1 className="text-xl font-semibold text-white mb-3">Error Loading Profiles</h1>
          <p className="text-zinc-500 text-sm mb-6">{profilesError}</p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (!currentProfile || currentIndex >= availableProfiles.length) {
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
          <h1 className="text-xl font-semibold text-white mb-3">You&apos;ve seen everyone!</h1>
          <p className="text-zinc-500 text-sm mb-8">
            Check back later for new profiles.
          </p>
          <Button onClick={() => {
            setCurrentIndex(0);
            setPassedWallets([]);
            refetch();
          }}>Start Over</Button>
        </div>
      </div>
    );
  }

  // Map Supabase profile to ProfileCard props
  const profileCardProps = {
    wallet: shortenAddress(currentProfile.wallet_address),
    name: currentProfile.name,
    age: currentProfile.age,
    gender: currentProfile.gender,
    bio: currentProfile.bio,
    location: currentProfile.location || undefined,
    dmPrice: currentProfile.dm_price,
    interests: currentProfile.interests,
    gradient: getGradient(currentIndex),
    photos: currentProfile.photos,
  };

  return (
    <div className="min-h-screen pt-20 pb-8 px-4">
      {/* Match notification */}
      {matchNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center animate-in fade-in zoom-in duration-300">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-white mb-2">It&apos;s a Match!</h2>
            <p className="text-zinc-400">You and {matchNotification} liked each other</p>
          </div>
        </div>
      )}

      {/* Subtle decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-rose-500/[0.03] rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-orange-500/[0.03] rounded-full blur-[80px]" />
      </div>

      <div className="relative max-w-sm mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-full overflow-hidden bg-zinc-900 ring-1 ring-white/10">
              <Image
                src="/logo.png"
                alt="SolMates Logo"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">Discover</h1>
              <p className="text-zinc-600 text-xs">
                {availableProfiles.length - currentIndex} profiles remaining
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] rounded-full border border-white/[0.06]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span className="text-xs text-zinc-400">{likedProfiles.length} likes</span>
          </div>
        </div>

        {/* Profile Card */}
        <ProfileCard
          {...profileCardProps}
          showActions={false}
        />

        {/* Action Buttons */}
        <div className="flex justify-center items-center gap-4 mt-6">
          <button
            onClick={handlePass}
            disabled={likingInProgress}
            className="w-14 h-14 rounded-full bg-zinc-900 border border-white/[0.06] flex items-center justify-center text-zinc-500 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-6 h-6" strokeWidth={2} />
          </button>
          
          <button
            onClick={() => setShowDmModal(true)}
            disabled={likingInProgress || sendingDm}
            className="w-12 h-12 rounded-full bg-zinc-900 border border-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-cyan-400 hover:border-cyan-500/30 hover:bg-cyan-500/10 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MessageCircle className="w-5 h-5" strokeWidth={2} />
          </button>
          
          <button
            onClick={() => handleLike(true)}
            disabled={likingInProgress}
            className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {likingInProgress ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Star className="w-5 h-5" fill="white" strokeWidth={2} />
            )}
          </button>
          
          <button
            onClick={() => handleLike(false)}
            disabled={likingInProgress}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/20 hover:shadow-rose-500/30 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {likingInProgress ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Heart className="w-6 h-6" fill="white" strokeWidth={2} />
            )}
          </button>
        </div>

        {/* Keyboard hints */}
        <div className="flex justify-center gap-6 mt-5 text-xs text-zinc-600">
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-zinc-900 rounded text-[10px] border border-white/[0.06]">←</kbd> Pass
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-zinc-900 rounded text-[10px] border border-white/[0.06]">↑</kbd> Super
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-zinc-900 rounded text-[10px] border border-white/[0.06]">→</kbd> Like
          </span>
        </div>
      </div>

      {/* Send DM Modal */}
      {showDmModal && currentProfile && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowDmModal(false)}
        >
          <div 
            className="bg-zinc-900 border border-white/[0.06] rounded-xl max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Header with profile info */}
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={currentProfile.photos?.[0] || getGenderAvatar(currentProfile.wallet_address, currentProfile.gender)}
                  alt={currentProfile.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-semibold text-white">
                    Message {currentProfile.name}
                  </h3>
                  <p className="text-zinc-500 text-sm flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    {formatUsdc(currentProfile.dm_price)} USDC
                  </p>
                </div>
              </div>

              <p className="text-zinc-400 text-sm mb-4">
                Send a paid message to get {currentProfile.name}&apos;s attention. 
                If they accept, you can start chatting!
              </p>

              {/* Message Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Your Message
                </label>
                <textarea
                  value={dmMessage}
                  onChange={(e) => setDmMessage(e.target.value)}
                  placeholder="Write something memorable..."
                  rows={4}
                  className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-rose-500/30 resize-none"
                  maxLength={500}
                />
                <p className="text-xs text-zinc-600 text-right mt-1">
                  {dmMessage.length}/500
                </p>
              </div>

              {/* Error */}
              {dmError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg mb-4">
                  <p className="text-red-400 text-xs">{dmError}</p>
                </div>
              )}

              {/* Cost breakdown */}
              <div className="p-3 bg-white/[0.03] rounded-lg border border-white/[0.06] mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">DM Cost</span>
                  <span className="text-white font-medium">{formatUsdc(currentProfile.dm_price)} USDC</span>
                </div>
                <p className="text-xs text-zinc-600 mt-1">
                  Held in escrow until accepted or expired (48h)
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button 
                  variant="ghost" 
                  className="flex-1"
                  onClick={() => setShowDmModal(false)}
                  disabled={sendingDm}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleSendDm}
                  disabled={!dmMessage.trim() || sendingDm}
                >
                  {sendingDm ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Send DM
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
