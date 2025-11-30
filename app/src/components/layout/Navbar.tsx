"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";
import { Heart, User, MessageCircle, Gavel, Gift, Menu, X } from "lucide-react";
import { shortenAddress } from "@/lib/constants";

// Dynamically import wallet button to avoid SSR hydration issues
const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

export function Navbar() {
  const { publicKey } = useWallet();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile menu when clicking a link
  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      {/* Gradient border at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-rose-500/30 to-transparent" />
      
      <div className="bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-rose-500/20 to-orange-500/20 ring-1 ring-white/10 group-hover:ring-rose-500/30 transition-all duration-300">
                <Image
                  src="/logo.png"
                  alt="SolMates Logo"
                  fill
                  sizes="40px"
                  className="object-cover"
                  priority
                />
              </div>
              <span className="text-xl font-bold gradient-flame-text">
                SolMates
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            {publicKey && (
              <div className="hidden md:flex items-center bg-white/[0.03] rounded-full p-1 border border-white/[0.06]">
                <Link
                  href="/discover"
                  className="flex items-center gap-2 px-4 py-2 text-zinc-400 hover:text-white hover:bg-gradient-to-r hover:from-rose-500/20 hover:to-orange-500/20 rounded-full transition-all duration-200 text-sm font-medium"
                >
                  <Heart className="w-4 h-4" />
                  <span>Discover</span>
                </Link>
                <Link
                  href="/messages"
                  className="flex items-center gap-2 px-4 py-2 text-zinc-400 hover:text-white hover:bg-gradient-to-r hover:from-rose-500/20 hover:to-orange-500/20 rounded-full transition-all duration-200 relative text-sm font-medium"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Messages</span>
                  {/* Notification dot */}
                  <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                </Link>
                <Link
                  href="/auctions"
                  className="flex items-center gap-2 px-4 py-2 text-zinc-400 hover:text-white hover:bg-gradient-to-r hover:from-rose-500/20 hover:to-orange-500/20 rounded-full transition-all duration-200 text-sm font-medium"
                >
                  <Gavel className="w-4 h-4" />
                  <span>Auctions</span>
                </Link>
                <Link
                  href="/bounties"
                  className="flex items-center gap-2 px-4 py-2 text-zinc-400 hover:text-white hover:bg-gradient-to-r hover:from-rose-500/20 hover:to-orange-500/20 rounded-full transition-all duration-200 text-sm font-medium"
                >
                  <Gift className="w-4 h-4" />
                  <span>Bounties</span>
                </Link>
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-4 py-2 text-zinc-400 hover:text-white hover:bg-gradient-to-r hover:from-rose-500/20 hover:to-orange-500/20 rounded-full transition-all duration-200 text-sm font-medium"
                >
                  <User className="w-4 h-4" />
                  <span>Profile</span>
                </Link>
              </div>
            )}

            {/* Right side: Wallet Button & Mobile Menu */}
            <div className="flex items-center gap-3">
              {mounted && publicKey && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 rounded-full border border-rose-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm text-rose-400 font-mono">
                    {shortenAddress(publicKey.toBase58())}
                  </span>
                </div>
              )}
              {mounted && <WalletMultiButton />}
              
              {/* Mobile menu button */}
              {publicKey && (
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-colors"
                >
                  {mobileMenuOpen ? (
                    <X className="w-5 h-5 text-zinc-400" />
                  ) : (
                    <Menu className="w-5 h-5 text-zinc-400" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {publicKey && mobileMenuOpen && (
        <div className="md:hidden bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/[0.06]">
          <div className="px-4 py-4 space-y-1">
            <Link
              href="/discover"
              onClick={handleLinkClick}
              className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-white hover:bg-gradient-to-r hover:from-rose-500/10 hover:to-orange-500/10 rounded-lg transition-all duration-200"
            >
              <Heart className="w-5 h-5" />
              <span className="font-medium">Discover</span>
            </Link>
            <Link
              href="/messages"
              onClick={handleLinkClick}
              className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-white hover:bg-gradient-to-r hover:from-rose-500/10 hover:to-orange-500/10 rounded-lg transition-all duration-200"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium">Messages</span>
              <span className="ml-auto w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            </Link>
            <Link
              href="/auctions"
              onClick={handleLinkClick}
              className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-white hover:bg-gradient-to-r hover:from-rose-500/10 hover:to-orange-500/10 rounded-lg transition-all duration-200"
            >
              <Gavel className="w-5 h-5" />
              <span className="font-medium">Auctions</span>
            </Link>
            <Link
              href="/bounties"
              onClick={handleLinkClick}
              className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-white hover:bg-gradient-to-r hover:from-rose-500/10 hover:to-orange-500/10 rounded-lg transition-all duration-200"
            >
              <Gift className="w-5 h-5" />
              <span className="font-medium">Bounties</span>
            </Link>
            <Link
              href="/profile"
              onClick={handleLinkClick}
              className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-white hover:bg-gradient-to-r hover:from-rose-500/10 hover:to-orange-500/10 rounded-lg transition-all duration-200"
            >
              <User className="w-5 h-5" />
              <span className="font-medium">Profile</span>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
