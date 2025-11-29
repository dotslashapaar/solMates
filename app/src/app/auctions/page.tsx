"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Gavel, Clock, Trophy, Plus } from "lucide-react";

// Mock auctions for demo
const MOCK_AUCTIONS = [
  {
    id: "1",
    creator: "CryptoQueen",
    creatorWallet: "7xKX...9mNp",
    description: "Coffee date at the best cafe in town. Let's talk crypto!",
    currentBid: 50,
    topBidder: "DeFiChad",
    endsAt: new Date(Date.now() + 3600000 * 2), // 2 hours
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=queen",
  },
  {
    id: "2",
    creator: "NFT_Collector",
    creatorWallet: "3aBC...xYz1",
    description: "Gallery tour + dinner. I'll show you my favorite NFT exhibits.",
    currentBid: 120,
    topBidder: "ArtLover99",
    endsAt: new Date(Date.now() + 3600000 * 5), // 5 hours
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=collector",
  },
  {
    id: "3",
    creator: "DeFi_Diva",
    creatorWallet: "5mNO...pQrS",
    description: "Yacht day in Miami. Bring sunscreen and good vibes only.",
    currentBid: 500,
    topBidder: "WhaleAlert",
    endsAt: new Date(Date.now() + 3600000 * 12), // 12 hours
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=diva",
  },
];

function formatTimeLeft(endDate: Date): string {
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  
  if (diff <= 0) return "Ended";
  
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  }
  return `${minutes}m left`;
}

export default function AuctionsPage() {
  const { connected } = useWallet();
  const [bidAmounts, setBidAmounts] = useState<Record<string, string>>({});

  const handleBid = (auctionId: string) => {
    const amount = bidAmounts[auctionId];
    console.log(`Bidding ${amount} on auction ${auctionId}`);
    // In real app, call on-chain instruction
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold font-space-grotesk">Date Auctions</h1>
          <p className="text-[#a1a1aa]">Bid on unique date experiences</p>
        </div>
        {connected && (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Auction
          </Button>
        )}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_AUCTIONS.map((auction) => (
          <Card key={auction.id} className="overflow-hidden">
            <div className="relative">
              <div className="aspect-video bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center">
                <img
                  src={auction.imageUrl}
                  alt={auction.creator}
                  className="w-24 h-24"
                />
              </div>
              <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
                <Clock className="w-3 h-3 text-pink-500" />
                <span className="text-xs">{formatTimeLeft(auction.endsAt)}</span>
              </div>
            </div>

            <CardContent className="p-4 space-y-4">
              <div>
                <h3 className="font-bold text-lg">{auction.creator}</h3>
                <p className="text-sm text-[#a1a1aa] line-clamp-2">
                  {auction.description}
                </p>
              </div>

              <div className="flex justify-between items-center p-3 bg-[#1a1a2e] rounded-xl">
                <div>
                  <p className="text-xs text-[#a1a1aa]">Current Bid</p>
                  <p className="text-xl font-bold text-pink-500">
                    ${auction.currentBid}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#a1a1aa]">Top Bidder</p>
                  <div className="flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-yellow-500" />
                    <span className="text-sm">{auction.topBidder}</span>
                  </div>
                </div>
              </div>

              {connected ? (
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder={`Min: $${auction.currentBid + 1}`}
                    value={bidAmounts[auction.id] || ""}
                    onChange={(e) =>
                      setBidAmounts({
                        ...bidAmounts,
                        [auction.id]: e.target.value,
                      })
                    }
                    className="flex-1"
                  />
                  <Button onClick={() => handleBid(auction.id)}>
                    <Gavel className="w-4 h-4 mr-1" />
                    Bid
                  </Button>
                </div>
              ) : (
                <p className="text-center text-sm text-[#a1a1aa]">
                  Connect wallet to bid
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
