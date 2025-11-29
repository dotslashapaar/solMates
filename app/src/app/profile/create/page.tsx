"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { CreateProfileForm } from "@/components/profile/CreateProfileForm";

export default function CreateProfilePage() {
  const { connected } = useWallet();

  if (!connected) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-[#a1a1aa]">
            Please connect your wallet to create your SolMates profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 font-space-grotesk">
            Create Your Profile
          </h1>
          <p className="text-[#a1a1aa]">
            Set up your on-chain dating profile and start receiving matches
          </p>
        </div>

        <CreateProfileForm />
      </div>
    </div>
  );
}
