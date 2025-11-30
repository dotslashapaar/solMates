"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Heart, MessageCircle, Gavel, Users, Shield, Zap, Sparkles } from "lucide-react";
import { useProfiles, useProfile } from "@/hooks/useProfiles";
import { useAuctions } from "@/hooks/useAuctions";
import { useMatches } from "@/hooks/useMatching";

export default function Home() {
  const { connected } = useWallet();
  const { profile } = useProfile();
  const { profiles } = useProfiles();
  const { auctions } = useAuctions();
  const { matches } = useMatches();
  
  // Calculate stats from real data
  const profileCount = profiles.length;
  const auctionCount = auctions.length;
  const matchCount = matches.length;
  // Estimate escrow value from average DM price
  const avgDmPrice = profiles.length > 0 
    ? profiles.reduce((sum, p) => sum + (p.dm_price || 10), 0) / profiles.length 
    : 10;
  const estimatedEscrowVolume = profileCount * avgDmPrice * 2; // Rough estimate

  return (
    <div className="relative min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 lg:py-40">
        {/* Subtle decorative elements */}
        <div className="absolute top-40 left-1/4 w-[500px] h-[500px] bg-rose-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-orange-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/[0.06] rounded-full mb-8">
              <Sparkles className="w-4 h-4 text-rose-400" />
              <span className="text-sm text-zinc-400">
                Now live on Solana Devnet
              </span>
            </div>

            {/* Main Logo */}
            <div className="flex justify-center mb-8">
              <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-rose-500/20 to-orange-500/20 ring-1 ring-white/10 shadow-2xl shadow-rose-500/10 animate-float group">
                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Image
                  src="/logo.png"
                  alt="SolMates Logo"
                  fill
                  sizes="96px"
                  className="object-cover"
                  priority
                />
              </div>
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold mb-6">
              Find Your{" "}
              <span className="gradient-flame-text">
                SolMate
              </span>
            </h1>

            <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              The <span className="text-white font-medium">sultry side</span> of Solana. 
              <span className="text-zinc-300"> DM escrows</span>, 
              <span className="text-zinc-300"> date auctions</span>, and 
              <span className="text-zinc-300"> matchmaker bounties</span>.
              <br />
              <span className="gradient-flame-text font-semibold">Serious connections only.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {connected ? (
                <Link href="/discover">
                  <Button size="lg" variant="hot" className="text-lg px-10">
                    <Heart className="w-5 h-5" />
                    Start Matching
                  </Button>
                </Link>
              ) : (
                <Button size="lg" variant="hot" className="text-lg px-10" disabled>
                  Connect Wallet to Start
                </Button>
              )}
              <Link href="/auctions">
                <Button size="lg" variant="electric" className="text-lg px-10">
                  <Gavel className="w-5 h-5" />
                  View Auctions
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-rose-500/[0.02] to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-4">
              How It <span className="gradient-flame-text">Works</span>
            </h2>
            <p className="text-zinc-500 max-w-2xl mx-auto text-lg">
              Three features that make dating intentional, rewarding, and electric
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* DM Escrow */}
            <Card variant="glass" className="group hover:border-rose-500/20 transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-14 h-14 bg-rose-500/10 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <MessageCircle className="w-7 h-7 text-rose-400" />
                </div>
                <h3 className="text-lg font-semibold mb-3 text-white">DM Escrow</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  Set your price to receive DMs. USDC is escrowed and released
                  when you accept, or refunded if you decline.
                </p>
              </CardContent>
            </Card>

            {/* Date Auctions */}
            <Card variant="glass" className="group hover:border-rose-500/20 transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-14 h-14 bg-orange-500/10 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <Gavel className="w-7 h-7 text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold mb-3 text-white">Date Auctions</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  Auction off dates to the highest bidder. Includes snipe protection.
                  All proceeds go directly to you.
                </p>
              </CardContent>
            </Card>

            {/* Matchmaker Bounties */}
            <Card variant="glass" className="group hover:border-rose-500/20 transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-14 h-14 bg-violet-500/10 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <Users className="w-7 h-7 text-violet-400" />
                </div>
                <h3 className="text-lg font-semibold mb-3 text-white">Matchmaker Bounties</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  Create bounties for finding your match. Friends earn rewards
                  for successful introductions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why SolMates */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl lg:text-5xl font-bold mb-8">
                Why{" "}
                <span className="gradient-flame-text">
                  SolMates?
                </span>
              </h2>
              <div className="space-y-6">
                <div className="flex gap-4 group">
                  <div className="w-12 h-12 bg-rose-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-rose-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Serious Intentions Only</h3>
                    <p className="text-zinc-500 text-sm">
                      Financial commitment filters out bots and time-wasters.
                      Connect with people who mean business.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 group">
                  <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Zap className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Lightning Fast</h3>
                    <p className="text-zinc-500 text-sm">
                      Powered by Solana — instant transactions, minimal fees.
                      No waiting days for payments to clear.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 group">
                  <div className="w-12 h-12 bg-rose-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Heart className="w-6 h-6 text-rose-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Earn While You Help</h3>
                    <p className="text-zinc-500 text-sm">
                      Play matchmaker and earn rewards. Help friends find love
                      and get paid for it.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <Card variant="gradient-border" className="relative overflow-hidden bg-zinc-900/80">
                <CardContent className="p-10">
                  <div className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-6 rounded-xl overflow-hidden bg-gradient-to-br from-rose-500/20 to-orange-500/20 ring-1 ring-white/10">
                      <Image
                        src="/logo.png"
                        alt="SolMates Logo"
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">Ready to ignite?</h3>
                    <p className="text-zinc-500 text-sm mb-8">
                      Connect your wallet and create your profile to start
                      your journey.
                    </p>
                    {connected ? (
                      profile ? (
                        <Link href="/discover">
                          <Button variant="hot" className="w-full">Start Matching</Button>
                        </Link>
                      ) : (
                        <Link href="/profile/create">
                          <Button variant="hot" className="w-full">Create Profile</Button>
                        </Link>
                      )
                    ) : (
                      <p className="text-rose-400 text-sm">
                        Connect wallet above to continue
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6">
              <div className="text-4xl lg:text-5xl font-bold gradient-flame-text mb-2">
                {profileCount > 0 ? profileCount.toLocaleString() : "—"}
              </div>
              <p className="text-zinc-600">Profiles Created</p>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl lg:text-5xl font-bold gradient-flame-text mb-2">
                ${estimatedEscrowVolume > 0 ? (estimatedEscrowVolume > 1000 ? `${(estimatedEscrowVolume / 1000).toFixed(0)}K+` : estimatedEscrowVolume.toFixed(0)) : "—"}
              </div>
              <p className="text-zinc-600">DM Escrows</p>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl lg:text-5xl font-bold gradient-flame-text mb-2">
                {auctionCount > 0 ? auctionCount.toLocaleString() : "—"}
              </div>
              <p className="text-zinc-600">Date Auctions</p>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl lg:text-5xl font-bold gradient-flame-text mb-2">
                {matchCount > 0 ? matchCount.toLocaleString() : "—"}
              </div>
              <p className="text-zinc-600">Matches Made</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
