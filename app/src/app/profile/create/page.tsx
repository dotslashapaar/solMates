"use client";

import Image from "next/image";
import { useWallet } from "@solana/wallet-adapter-react";
import { CreateProfileForm } from "@/components/profile/CreateProfileForm";

export default function CreateProfilePage() {
  const { connected } = useWallet();

  if (!connected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <div className="relative w-20 h-20 mx-auto mb-6 rounded-full overflow-hidden bg-zinc-900 ring-1 ring-white/10">
            <Image
              src="/logo.png"
              alt="SolMates Logo"
              fill
              sizes="80px"
              className="object-cover"
            />
          </div>
          <h1 className="text-xl font-semibold text-white mb-3">
            Connect Your Wallet
          </h1>
          <p className="text-zinc-500 text-sm">
            Please connect your wallet to create your SolMates profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Subtle decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-rose-500/[0.03] rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-orange-500/[0.03] rounded-full blur-[80px]" />
      </div>

      <div className="relative container mx-auto px-4 py-8">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-8">
            <div className="relative w-16 h-16 mx-auto mb-4 rounded-full overflow-hidden bg-zinc-900 ring-1 ring-white/10">
              <Image
                src="/logo.png"
                alt="SolMates Logo"
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
            <h1 className="text-2xl font-semibold mb-2">
              <span className="gradient-flame-text">Create Your Profile</span>
            </h1>
            <p className="text-zinc-500 text-sm">
              Set up your on-chain dating profile and start receiving matches
            </p>
          </div>

          <CreateProfileForm />
        </div>
      </div>
    </div>
  );
}
