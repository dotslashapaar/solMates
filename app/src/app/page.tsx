"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Heart, MessageCircle, Gavel, Users, Sparkles, Shield, Zap } from "lucide-react";

export default function Home() {
  const { connected } = useWallet();

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-purple-500/5 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-pink-500/20 rounded-full blur-[150px]" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1a1a2e] rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-pink-500" />
              <span className="text-sm text-[#a1a1aa]">
                Now live on Solana Devnet
              </span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold mb-6 font-space-grotesk">
              Find Your{" "}
              <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                Perfect Match
              </span>{" "}
              On-Chain
            </h1>

            <p className="text-xl text-[#a1a1aa] mb-8 max-w-2xl mx-auto">
              SolMates revolutionizes dating with DM escrows, date auctions, and
              matchmaker bounties. Serious connections, powered by crypto.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {connected ? (
                <Link href="/discover">
                  <Button size="lg" className="text-lg px-8">
                    <Heart className="w-5 h-5 mr-2" />
                    Start Swiping
                  </Button>
                </Link>
              ) : (
                <Button size="lg" className="text-lg px-8" disabled>
                  Connect Wallet to Start
                </Button>
              )}
              <Link href="/auctions">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  <Gavel className="w-5 h-5 mr-2" />
                  View Auctions
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-[#0d0d12]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 font-space-grotesk">
              How It Works
            </h2>
            <p className="text-[#a1a1aa] max-w-2xl mx-auto">
              Three innovative features that make dating more intentional and
              rewarding
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* DM Escrow */}
            <Card className="bg-gradient-to-br from-pink-500/10 to-transparent hover:from-pink-500/20 transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-pink-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <MessageCircle className="w-8 h-8 text-pink-500" />
                </div>
                <h3 className="text-xl font-bold mb-3">DM Escrow</h3>
                <p className="text-[#a1a1aa]">
                  Set your price to receive DMs. USDC is escrowed and released
                  when you accept, or refunded if you decline. Filters out
                  time-wasters.
                </p>
              </CardContent>
            </Card>

            {/* Date Auctions */}
            <Card className="bg-gradient-to-br from-purple-500/10 to-transparent hover:from-purple-500/20 transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Gavel className="w-8 h-8 text-purple-500" />
                </div>
                <h3 className="text-xl font-bold mb-3">Date Auctions</h3>
                <p className="text-[#a1a1aa]">
                  Auction off dates to the highest bidder. Includes last-minute
                  snipe protection. All proceeds go directly to you.
                </p>
              </CardContent>
            </Card>

            {/* Matchmaker Bounties */}
            <Card className="bg-gradient-to-br from-indigo-500/10 to-transparent hover:from-indigo-500/20 transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 text-indigo-500" />
                </div>
                <h3 className="text-xl font-bold mb-3">Matchmaker Bounties</h3>
                <p className="text-[#a1a1aa]">
                  Create bounties for finding your perfect match. Friends earn
                  rewards for successful introductions. Real incentives, real
                  matches.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why SolMates */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-6 font-space-grotesk">
                Why{" "}
                <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                  SolMates?
                </span>
              </h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-pink-500" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Serious Intentions Only</h3>
                    <p className="text-[#a1a1aa]">
                      Financial commitment filters out bots and time-wasters.
                      Connect with people who mean business.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Zap className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Instant Settlements</h3>
                    <p className="text-[#a1a1aa]">
                      Powered by Solana - fast, cheap transactions. No waiting
                      days for payments to clear.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Heart className="w-6 h-6 text-indigo-500" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Community-Driven</h3>
                    <p className="text-[#a1a1aa]">
                      Earn rewards by being a matchmaker. Help your friends find
                      love and get paid for it.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/30 to-purple-500/30 rounded-3xl blur-3xl" />
              <Card className="relative overflow-hidden">
                <CardContent className="p-8">
                  <div className="text-center">
                    <div className="text-6xl mb-4">💘</div>
                    <h3 className="text-2xl font-bold mb-2">Ready to find your SolMate?</h3>
                    <p className="text-[#a1a1aa] mb-6">
                      Connect your wallet and create your profile to get
                      started.
                    </p>
                    {connected ? (
                      <Link href="/profile/create">
                        <Button className="w-full">Create Profile</Button>
                      </Link>
                    ) : (
                      <p className="text-pink-500 text-sm">
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
      <section className="py-20 bg-[#0d0d12]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent mb-2">
                1,000+
              </div>
              <p className="text-[#a1a1aa]">Profiles Created</p>
            </div>
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent mb-2">
                $50K+
              </div>
              <p className="text-[#a1a1aa]">DM Escrows</p>
            </div>
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent mb-2">
                150+
              </div>
              <p className="text-[#a1a1aa]">Date Auctions</p>
            </div>
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent mb-2">
                42
              </div>
              <p className="text-[#a1a1aa]">Matches Made</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
