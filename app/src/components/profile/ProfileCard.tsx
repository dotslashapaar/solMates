"use client";

import Image from "next/image";
import { Heart, MessageCircle, X, MapPin, Briefcase } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatUsdc, shortenAddress } from "@/lib/constants";

export interface ProfileCardProps {
  wallet?: string;
  address?: string;
  name: string;
  age: number;
  bio: string;
  location?: string;
  occupation?: string;
  imageUrl?: string;
  dmPrice: number;
  interests?: string[];
  showActions?: boolean;
  onLike?: () => void;
  onPass?: () => void;
  onMessage?: () => void;
  onSuperLike?: () => void;
}

export function ProfileCard({
  wallet,
  address,
  name,
  age,
  bio,
  location,
  occupation,
  imageUrl,
  dmPrice,
  interests,
  showActions = true,
  onLike,
  onPass,
  onMessage,
  onSuperLike,
}: ProfileCardProps) {
  const displayAddress = wallet || address || "";
  return (
    <Card className="overflow-hidden max-w-sm mx-auto">
      {/* Profile Image */}
      <div className="relative h-96 -m-6 mb-4">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#ff3366] to-[#6366f1] flex items-center justify-center">
            <span className="text-6xl font-bold text-white">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
        
        {/* Info overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <h2 className="text-2xl font-bold text-white">
            {name}, {age}
          </h2>
          {location && (
            <div className="flex items-center gap-1 text-[#a1a1aa] mt-1">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{location}</span>
            </div>
          )}
          {occupation && (
            <div className="flex items-center gap-1 text-[#a1a1aa]">
              <Briefcase className="w-4 h-4" />
              <span className="text-sm">{occupation}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bio */}
      <p className="text-[#a1a1aa] text-sm mb-4 line-clamp-3">{bio}</p>

      {/* DM Price */}
      <div className="flex items-center justify-between mb-4 p-3 bg-[#0a0a0a] rounded-xl">
        <span className="text-[#a1a1aa] text-sm">DM Price</span>
        <span className="text-[#ff3366] font-bold">
          {formatUsdc(dmPrice)} USDC
        </span>
      </div>

      {/* Wallet Address */}
      {displayAddress && (
        <p className="text-xs text-[#666] mb-4 font-mono">
          {shortenAddress(displayAddress, 8)}
        </p>
      )}

      {/* Interests */}
      {interests && interests.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {interests.map((interest, i) => (
            <span
              key={i}
              className="px-3 py-1 bg-[#1a1a2e] rounded-full text-xs text-[#a1a1aa]"
            >
              {interest}
            </span>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-4">
        {onPass && (
          <button
            onClick={onPass}
            className="w-14 h-14 rounded-full border-2 border-[#2a2a4e] flex items-center justify-center text-[#a1a1aa] hover:border-red-500 hover:text-red-500 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        )}
        {onMessage && (
          <button
            onClick={onMessage}
            className="w-16 h-16 rounded-full gradient-secondary flex items-center justify-center text-white glow-secondary"
          >
            <MessageCircle className="w-7 h-7" />
          </button>
        )}
        {onLike && (
          <button
            onClick={onLike}
            className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center text-white glow-primary"
          >
            <Heart className="w-6 h-6" />
          </button>
        )}
      </div>
    </Card>
  );
}
