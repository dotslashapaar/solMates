"use client";

import { MapPin, MessageCircle, User } from "lucide-react";
import { formatUsdc, shortenAddress, getGenderAvatar } from "@/lib/constants";
import type { GenderType } from "@/lib/supabase/types";

// Helper to format gender for display
function formatGender(gender: GenderType): string {
  switch (gender) {
    case "male": return "Man";
    case "female": return "Woman";
    case "non-binary": return "Non-binary";
    case "other": return "Other";
    default: return gender;
  }
}

export interface ProfileCardProps {
  wallet?: string;
  address?: string;
  name: string;
  age: number;
  gender?: GenderType;
  bio: string;
  location?: string;
  occupation?: string;
  imageUrl?: string;
  dmPrice: number;
  interests?: string[];
  gradient?: string;
  showActions?: boolean;
  onLike?: () => void;
  onPass?: () => void;
  onMessage?: () => void;
  onSuperLike?: () => void;
  photos?: string[];
}

export function ProfileCard({
  wallet,
  address,
  name,
  age,
  gender,
  bio,
  location,
  dmPrice,
  interests,
  photos,
  gradient = "from-rose-500 to-pink-600",
  showActions = true,
  onMessage,
}: ProfileCardProps) {
  const displayAddress = wallet || address || "";
  
  // Get avatar URL - use photo if available, otherwise gender-based avatar
  const avatarUrl = photos && photos.length > 0 
    ? photos[0] 
    : getGenderAvatar(displayAddress || name, gender);
  
  return (
    <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-white/[0.06] shadow-xl">
      {/* Profile Image Area */}
      <div className={`relative aspect-[3/4] bg-gradient-to-br ${gradient}`}>
        {/* Gender-based avatar image */}
        <img 
          src={avatarUrl} 
          alt={name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Bottom gradient - smooth fade to card background */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-zinc-900 from-10% via-zinc-900/60 via-50% to-transparent" />
        
        {/* Info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h2 className="text-2xl font-semibold text-white mb-1">
            {name}, {age}
          </h2>
          <div className="flex items-center gap-3">
            {gender && (
              <div className="flex items-center gap-1.5 text-white/60">
                <User className="w-3.5 h-3.5" />
                <span className="text-sm">{formatGender(gender)}</span>
              </div>
            )}
            {location && (
              <div className="flex items-center gap-1.5 text-white/60">
                <MapPin className="w-3.5 h-3.5" />
                <span className="text-sm">{location}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Bio */}
        <p className="text-zinc-400 text-sm leading-relaxed">{bio}</p>

        {/* Interests */}
        {interests && interests.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {interests.map((interest, i) => (
              <span
                key={i}
                className="px-2.5 py-1 bg-white/[0.04] border border-white/[0.06] rounded-md text-xs text-zinc-400"
              >
                {interest}
              </span>
            ))}
          </div>
        )}

        {/* DM Price */}
        <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
          <div>
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-0.5">DM Price</p>
            <p className="text-lg font-semibold text-white">
              {formatUsdc(dmPrice)} <span className="text-zinc-500 text-sm font-normal">USDC</span>
            </p>
          </div>
          
          {onMessage && (
            <button
              onClick={onMessage}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-rose-500/20"
            >
              <MessageCircle className="w-4 h-4" />
              Send DM
            </button>
          )}
        </div>

        {/* Wallet */}
        {displayAddress && (
          <p className="text-[10px] text-zinc-700 font-mono">
            {shortenAddress(displayAddress, 8)}
          </p>
        )}
      </div>
    </div>
  );
}
