"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { Button } from "@/components/ui/Button";
import { Heart, X, Sparkles } from "lucide-react";

// Mock profiles for demo
const MOCK_PROFILES = [
  {
    wallet: "7xKX...9mNp",
    name: "CryptoQueen",
    age: 28,
    bio: "Solana maxi. Looking for someone who knows the difference between a rug pull and a bear market. Must love dogs and DeFi.",
    dmPrice: 25,
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=queen",
    interests: ["DeFi", "NFTs", "Coffee", "Travel"],
  },
  {
    wallet: "3aBC...xYz1",
    name: "NFT_Collector",
    age: 32,
    bio: "Art lover in the metaverse. Collector of rare pixels and rarer connections. Let's talk about your favorite on-chain art.",
    dmPrice: 50,
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=collector",
    interests: ["Art", "NFTs", "Gaming", "Music"],
  },
  {
    wallet: "9dEF...4gHi",
    name: "Degen4Life",
    age: 25,
    bio: "Full-time degen, part-time romantic. I believe in love at first airdrop. Warning: I might talk about your portfolio on our first date.",
    dmPrice: 15,
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=degen",
    interests: ["Trading", "Memes", "Gaming", "Anime"],
  },
];

export default function DiscoverPage() {
  const { connected } = useWallet();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [liked, setLiked] = useState<string[]>([]);
  const [passed, setPassed] = useState<string[]>([]);

  if (!connected) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto text-center">
          <div className="text-6xl mb-4">💫</div>
          <h1 className="text-2xl font-bold mb-4">Connect to Discover</h1>
          <p className="text-[#a1a1aa]">
            Connect your wallet to start discovering your perfect SolMate.
          </p>
        </div>
      </div>
    );
  }

  const currentProfile = MOCK_PROFILES[currentIndex];

  const handleLike = () => {
    setLiked([...liked, currentProfile.wallet]);
    nextProfile();
  };

  const handlePass = () => {
    setPassed([...passed, currentProfile.wallet]);
    nextProfile();
  };

  const handleSuperLike = () => {
    setLiked([...liked, currentProfile.wallet]);
    nextProfile();
  };

  const nextProfile = () => {
    if (currentIndex < MOCK_PROFILES.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  if (currentIndex >= MOCK_PROFILES.length) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold mb-4">You&apos;ve Seen Everyone!</h1>
          <p className="text-[#a1a1aa] mb-6">
            Check back later for new profiles or view your matches.
          </p>
          <Button onClick={() => setCurrentIndex(0)}>Start Over</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold font-space-grotesk">Discover</h1>
          <p className="text-[#a1a1aa] text-sm">
            {MOCK_PROFILES.length - currentIndex} profiles left
          </p>
        </div>

        <ProfileCard
          {...currentProfile}
          onLike={handleLike}
          onPass={handlePass}
          onSuperLike={handleSuperLike}
          showActions={true}
        />

        <div className="flex justify-center gap-4 mt-6">
          <Button
            variant="outline"
            size="lg"
            onClick={handlePass}
            className="w-16 h-16 rounded-full p-0 border-red-500/50 hover:bg-red-500/20"
          >
            <X className="w-8 h-8 text-red-500" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={handleSuperLike}
            className="w-16 h-16 rounded-full p-0 border-blue-500/50 hover:bg-blue-500/20"
          >
            <Sparkles className="w-8 h-8 text-blue-500" />
          </Button>
          <Button
            size="lg"
            onClick={handleLike}
            className="w-16 h-16 rounded-full p-0"
          >
            <Heart className="w-8 h-8" />
          </Button>
        </div>
      </div>
    </div>
  );
}
