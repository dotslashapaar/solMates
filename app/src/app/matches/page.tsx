"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Heart,
  MessageCircle,
  Loader2,
  Sparkles,
  MapPin,
  Calendar,
  User,
} from "lucide-react";
import { useMatches } from "@/hooks/useMatching";
import { getGenderAvatar, shortenAddress, formatUsdc } from "@/lib/constants";
import type { Profile, GenderType } from "@/lib/supabase";

function formatGender(gender: GenderType): string {
  switch (gender) {
    case "male": return "Man";
    case "female": return "Woman";
    case "non-binary": return "Non-binary";
    case "other": return "Other";
    default: return gender;
  }
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(hours / 24);

  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function MatchesPage() {
  const { connected, publicKey } = useWallet();
  const { matches, matchedProfiles, loading, error, refetch } = useMatches();
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  // Build a map of match times by wallet
  const matchTimeMap: Record<string, string> = {};
  matches.forEach((m) => {
    const otherWallet = m.wallet_a === publicKey?.toBase58() ? m.wallet_b : m.wallet_a;
    matchTimeMap[otherWallet] = m.matched_at;
  });

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
            Connect to View Matches
          </h1>
          <p className="text-zinc-500 text-sm">
            Connect your wallet to see your matches and start conversations.
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
        <div className="max-w-sm text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <Heart className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">
            Error Loading Matches
          </h1>
          <p className="text-zinc-500 text-sm mb-4">{error}</p>
          <Button onClick={() => refetch()} variant="ghost" size="sm">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Subtle decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-rose-500/[0.03] rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-violet-500/[0.03] rounded-full blur-[80px]" />
      </div>

      <div className="relative container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
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
              <span className="gradient-flame-text">Your Matches</span>
            </h1>
            <p className="text-zinc-500 text-sm">
              {matchedProfiles.length} {matchedProfiles.length === 1 ? "match" : "matches"}
            </p>
          </div>
        </div>

        {matchedProfiles.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-rose-500/20 to-violet-500/20 flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-rose-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              No Matches Yet
            </h2>
            <p className="text-zinc-500 text-sm text-center max-w-xs mb-6">
              Keep swiping on the Discover page to find your perfect match!
            </p>
            <Link href="/discover">
              <Button variant="hot">
                <Heart className="w-4 h-4 mr-2" />
                Start Discovering
              </Button>
            </Link>
          </div>
        ) : (
          // Matches Grid
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {matchedProfiles.map((profile) => (
              <div
                key={profile.wallet_address}
                className="group relative overflow-hidden rounded-xl bg-zinc-900 border border-white/[0.06] hover:border-rose-500/20 transition-all cursor-pointer"
                onClick={() => setSelectedProfile(profile)}
              >
                <CardContent className="p-0">
                  {/* Profile Image */}
                  <div className="relative aspect-[4/3] bg-gradient-to-br from-rose-500/10 to-violet-500/10">
                    <img
                      src={
                        profile.photos?.[0] ||
                        getGenderAvatar(profile.wallet_address, profile.gender)
                      }
                      alt={profile.name}
                      className="w-full h-full object-cover"
                    />
                    {/* Match badge */}
                    <div className="absolute top-3 left-3 px-2.5 py-1 bg-gradient-to-r from-rose-500 to-violet-500 rounded-full flex items-center gap-1">
                      <Heart className="w-3 h-3 text-white fill-white" />
                      <span className="text-xs font-medium text-white">Match</span>
                    </div>
                    {/* Gradient overlay */}
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-zinc-900 to-transparent" />
                  </div>

                  {/* Profile Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg text-white">
                          {profile.name}, {profile.age}
                        </h3>
                        {profile.gender && (
                          <p className="text-zinc-500 text-sm flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {formatGender(profile.gender)}
                          </p>
                        )}
                      </div>
                      {matchTimeMap[profile.wallet_address] && (
                        <span className="text-xs text-zinc-600 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatTimeAgo(matchTimeMap[profile.wallet_address])}
                        </span>
                      )}
                    </div>

                    {profile.location && (
                      <p className="text-zinc-500 text-sm flex items-center gap-1 mb-2">
                        <MapPin className="w-3 h-3" />
                        {profile.location}
                      </p>
                    )}

                    <p className="text-zinc-400 text-sm line-clamp-2 mb-3">
                      {profile.bio}
                    </p>

                    {/* Interests */}
                    {profile.interests && profile.interests.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {profile.interests.slice(0, 3).map((interest, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-white/[0.04] border border-white/[0.06] rounded text-xs text-zinc-400"
                          >
                            {interest}
                          </span>
                        ))}
                        {profile.interests.length > 3 && (
                          <span className="px-2 py-0.5 text-xs text-zinc-600">
                            +{profile.interests.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* DM Price & Action */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                      <div>
                        <p className="text-[10px] text-zinc-600 uppercase tracking-wider">DM Price</p>
                        <p className="text-sm font-medium text-white">
                          {formatUsdc(profile.dm_price)} <span className="text-zinc-500 text-xs">USDC</span>
                        </p>
                      </div>
                      <Link href={`/messages?to=${profile.wallet_address}`}>
                        <Button size="sm" className="gap-1.5">
                          <MessageCircle className="w-3.5 h-3.5" />
                          Message
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </div>
            ))}
          </div>
        )}

        {/* Profile Detail Modal */}
        {selectedProfile && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedProfile(null)}
          >
            <div 
              className="bg-zinc-900 border border-white/[0.06] rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header Image */}
              <div className="relative aspect-square">
                <img
                  src={
                    selectedProfile.photos?.[0] ||
                    getGenderAvatar(selectedProfile.wallet_address, selectedProfile.gender)
                  }
                  alt={selectedProfile.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-zinc-900 to-transparent" />
                <button
                  onClick={() => setSelectedProfile(null)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                >
                  ×
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 -mt-16 relative">
                <div className="mb-4">
                  <h2 className="text-2xl font-semibold text-white">
                    {selectedProfile.name}, {selectedProfile.age}
                  </h2>
                  <div className="flex items-center gap-3 mt-1">
                    {selectedProfile.gender && (
                      <span className="text-zinc-400 text-sm flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {formatGender(selectedProfile.gender)}
                      </span>
                    )}
                    {selectedProfile.location && (
                      <span className="text-zinc-400 text-sm flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {selectedProfile.location}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-zinc-300 text-sm mb-4">{selectedProfile.bio}</p>

                {selectedProfile.occupation && (
                  <p className="text-zinc-500 text-sm mb-4">
                    💼 {selectedProfile.occupation}
                  </p>
                )}

                {/* Interests */}
                {selectedProfile.interests && selectedProfile.interests.length > 0 && (
                  <div className="mb-6">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Interests</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedProfile.interests.map((interest, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 rounded-md text-xs text-rose-400"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => setSelectedProfile(null)}
                    variant="ghost"
                    className="flex-1"
                  >
                    Close
                  </Button>
                  <Link href={`/messages?to=${selectedProfile.wallet_address}`} className="flex-1">
                    <Button className="w-full gap-2">
                      <MessageCircle className="w-4 h-4" />
                      Send Message
                    </Button>
                  </Link>
                </div>

                {/* Wallet Address */}
                <p className="text-[10px] text-zinc-700 font-mono text-center mt-4">
                  {shortenAddress(selectedProfile.wallet_address, 8)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
