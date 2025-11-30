"use client";

import { useState } from "react";
import Image from "next/image";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Gavel, Clock, Trophy, Plus, Flame, Loader2 } from "lucide-react";
import { useAuctions, usePlaceBid } from "@/hooks/useAuctions";
import { useProfile } from "@/hooks/useProfiles";
import { shortenAddress, formatUsdc, parseUsdc, getGenderAvatar } from "@/lib/constants";
import type { Auction } from "@/lib/supabase";
import { useSolmatesProgram } from "@/lib/anchor/hooks";
import { placeBid as onChainPlaceBid } from "@/lib/anchor/program";
import { CreateAuctionModal } from "@/components/auction/CreateAuctionModal";

function formatTimeLeft(endDate: string): string {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end.getTime() - now.getTime();
  
  if (diff <= 0) return "Ended";
  
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h left`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  }
  return `${minutes}m left`;
}

function isHotAuction(auction: Auction): boolean {
  const end = new Date(auction.end_time);
  const now = new Date();
  const hoursLeft = (end.getTime() - now.getTime()) / 3600000;
  return hoursLeft < 3 && auction.current_bid > 100_000_000; // Less than 3 hours and > 100 USDC
}

export default function AuctionsPage() {
  const { connected, publicKey } = useWallet();
  const [bidAmounts, setBidAmounts] = useState<Record<string, string>>({});
  const [processingAuction, setProcessingAuction] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const { auctions, loading, error, refetch } = useAuctions({ status: "active" });
  const { placeBid, loading: bidding } = usePlaceBid();
  const program = useSolmatesProgram();

  const handleBid = async (auction: Auction) => {
    if (!publicKey || !program) return;
    
    const amountStr = bidAmounts[auction.id];
    if (!amountStr) return;
    
    const amount = parseUsdc(amountStr);
    const minBid = auction.current_bid + 1_000_000; // Minimum 1 USDC over current
    
    if (amount < minBid) {
      alert(`Minimum bid is $${formatUsdc(minBid)}`);
      return;
    }
    
    setProcessingAuction(auction.id);
    
    try {
      // Call on-chain placeBid instruction
      const hostPubkey = new PublicKey(auction.host_wallet);
      // Get previous bidder (or use host as placeholder if no previous bid)
      const previousBidder = auction.highest_bidder_wallet 
        ? new PublicKey(auction.highest_bidder_wallet)
        : hostPubkey;
        
      const txSignature = await onChainPlaceBid(
        program,
        publicKey,
        hostPubkey,
        auction.auction_id,
        amount,
        previousBidder
      );
      
      // Record bid in Supabase with tx signature
      const success = await placeBid(
        auction.id,
        publicKey.toBase58(),
        amount,
        txSignature
      );
      
      if (success) {
        setBidAmounts({ ...bidAmounts, [auction.id]: "" });
        refetch();
      }
    } catch (err: any) {
      console.error("Error placing bid:", err);
      // Fallback: record in Supabase only
      await placeBid(auction.id, publicKey.toBase58(), amount);
      refetch();
    } finally {
      setProcessingAuction(null);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Subtle decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-rose-500/[0.03] rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-orange-500/[0.03] rounded-full blur-[80px]" />
      </div>

      <div className="relative container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
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
                <span className="gradient-flame-text">Date Auctions</span>
              </h1>
              <p className="text-zinc-500 text-sm">Bid on exclusive date experiences</p>
            </div>
          </div>
          {connected && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Auction
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">{error}</p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </div>
        ) : auctions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-500 mb-4">No active auctions at the moment</p>
            {connected && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create the first auction
              </Button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {auctions.map((auction) => (
              <AuctionCard
                key={auction.id}
                auction={auction}
                bidAmount={bidAmounts[auction.id] || ""}
                onBidAmountChange={(value) => 
                  setBidAmounts({ ...bidAmounts, [auction.id]: value })
                }
                onBid={() => handleBid(auction)}
                connected={connected}
                bidding={bidding}
              />
            ))}
          </div>
        )}

        {/* How it works section */}
        <div className="mt-12">
          <Card className="rounded-xl p-6 bg-zinc-900 border-white/[0.06]">
            <h2 className="text-lg font-semibold text-center mb-6">
              <span className="gradient-flame-text">How Auctions Work</span>
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-10 h-10 bg-rose-500/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-sm font-semibold text-rose-400">1</span>
                </div>
                <h3 className="font-medium text-white text-sm mb-1">Create Your Auction</h3>
                <p className="text-xs text-zinc-500">
                  Describe your ideal date and set a starting bid.
                </p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-sm font-semibold text-orange-400">2</span>
                </div>
                <h3 className="font-medium text-white text-sm mb-1">Receive Bids</h3>
                <p className="text-xs text-zinc-500">
                  Watch as interested parties compete for your time.
                </p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-rose-500/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-sm font-semibold text-rose-400">3</span>
                </div>
                <h3 className="font-medium text-white text-sm mb-1">Go On Your Date</h3>
                <p className="text-xs text-zinc-500">
                  Meet the winner and have an unforgettable experience.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      {/* Create Auction Modal */}
      <CreateAuctionModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}

function AuctionCard({
  auction,
  bidAmount,
  onBidAmountChange,
  onBid,
  connected,
  bidding,
}: {
  auction: Auction;
  bidAmount: string;
  onBidAmountChange: (value: string) => void;
  onBid: () => void;
  connected: boolean;
  bidding: boolean;
}) {
  const { profile } = useProfile(auction.host_wallet);
  const hot = isHotAuction(auction);
  
  const displayName = profile?.name || shortenAddress(auction.host_wallet);
  const minBid = formatUsdc(auction.current_bid + 1_000_000);
  
  return (
    <div className="group relative">
      <Card className="relative overflow-hidden rounded-xl bg-zinc-900 border-white/[0.06]">
        <div className="relative">
          <div className="aspect-video bg-gradient-to-br from-rose-500/10 via-orange-400/5 to-rose-500/10 flex items-center justify-center">
            {profile?.photos?.[0] ? (
              <img
                src={profile.photos[0]}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={getGenderAvatar(auction.host_wallet, profile?.gender)}
                alt={displayName}
                className="w-24 h-24"
              />
            )}
          </div>
          
          {/* Time badge */}
          <div className="absolute top-3 right-3 bg-zinc-900/90 px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-white/[0.06]">
            <Clock className="w-3 h-3 text-rose-400" />
            <span className="text-xs text-white">{formatTimeLeft(auction.end_time)}</span>
          </div>
          
          {/* Hot badge */}
          {hot && (
            <div className="absolute top-3 left-3 bg-gradient-to-r from-rose-500 to-orange-500 px-2.5 py-1 rounded-md flex items-center gap-1">
              <Flame className="w-3 h-3 text-white" />
              <span className="text-xs font-semibold text-white">HOT</span>
            </div>
          )}
        </div>

        <CardContent className="p-4 space-y-4">
          <div>
            <h3 className="font-semibold text-lg text-white">{auction.title || displayName}</h3>
            <p className="text-sm text-zinc-500 line-clamp-2 mt-1">
              {auction.description}
            </p>
          </div>

          <div className="flex justify-between items-center p-3 bg-white/[0.03] rounded-lg border border-white/[0.06]">
            <div>
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Current Bid</p>
              <p className="text-xl font-semibold gradient-flame-text">
                ${formatUsdc(auction.current_bid)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Top Bidder</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-sm text-white">
                  {auction.highest_bidder_wallet 
                    ? shortenAddress(auction.highest_bidder_wallet)
                    : "No bids yet"
                  }
                </span>
              </div>
            </div>
          </div>

          {connected ? (
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder={`Min: $${minBid}`}
                value={bidAmount}
                onChange={(e) => onBidAmountChange(e.target.value)}
                className="flex-1"
              />
              <Button onClick={onBid} disabled={bidding || !bidAmount}>
                {bidding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Gavel className="w-4 h-4 mr-1.5" />
                    Bid
                  </>
                )}
              </Button>
            </div>
          ) : (
            <p className="text-center text-xs text-zinc-600 py-2">
              Connect wallet to place a bid
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export { CreateAuctionModal };
