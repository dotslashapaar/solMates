"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Heart, User, MessageCircle, Gavel, Gift } from "lucide-react";
import { shortenAddress } from "@/lib/constants";

export function Navbar() {
  const { publicKey } = useWallet();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-[#2a2a4e]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" fill="white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-[#ff3366] to-[#ff6b9d] bg-clip-text text-transparent">
              SolMates
            </span>
          </Link>

          {/* Navigation Links */}
          {publicKey && (
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/discover"
                className="flex items-center gap-2 text-[#a1a1aa] hover:text-white transition-colors"
              >
                <Heart className="w-5 h-5" />
                <span>Discover</span>
              </Link>
              <Link
                href="/messages"
                className="flex items-center gap-2 text-[#a1a1aa] hover:text-white transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Messages</span>
              </Link>
              <Link
                href="/auctions"
                className="flex items-center gap-2 text-[#a1a1aa] hover:text-white transition-colors"
              >
                <Gavel className="w-5 h-5" />
                <span>Auctions</span>
              </Link>
              <Link
                href="/bounties"
                className="flex items-center gap-2 text-[#a1a1aa] hover:text-white transition-colors"
              >
                <Gift className="w-5 h-5" />
                <span>Bounties</span>
              </Link>
              <Link
                href="/profile"
                className="flex items-center gap-2 text-[#a1a1aa] hover:text-white transition-colors"
              >
                <User className="w-5 h-5" />
                <span>Profile</span>
              </Link>
            </div>
          )}

          {/* Wallet Button */}
          <div className="flex items-center gap-4">
            {publicKey && (
              <span className="hidden sm:block text-sm text-[#a1a1aa]">
                {shortenAddress(publicKey.toBase58())}
              </span>
            )}
            <WalletMultiButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
