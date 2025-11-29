"use client";

import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  PROGRAM_ID,
  getProfilePda,
  parseUsdc,
} from "@/lib/constants";

export function CreateProfileForm() {
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const [dmPrice, setDmPrice] = useState("10");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleCreateProfile = async () => {
    if (!publicKey || !signTransaction) {
      setError("Please connect your wallet");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      // For now, just show success - actual on-chain interaction would use Anchor
      // This is a placeholder for the MVP frontend demo
      console.log("Creating profile with DM price:", parseUsdc(dmPrice));
      
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSuccess(true);
    } catch (err: any) {
      console.error("Error creating profile:", err);
      setError(err.message || "Failed to create profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create Your Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          label="DM Price (USDC)"
          type="number"
          min="0"
          step="0.01"
          value={dmPrice}
          onChange={(e) => setDmPrice(e.target.value)}
          placeholder="10.00"
        />

        <p className="text-sm text-[#a1a1aa]">
          Set the minimum USDC required for someone to send you a DM. This
          amount will be escrowed and you&apos;ll receive it when you accept the
          message.
        </p>

        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-500/20 border border-green-500/50 rounded-xl">
            <p className="text-green-400 text-sm">
              Profile created successfully! 🎉
            </p>
          </div>
        )}

        <Button
          onClick={handleCreateProfile}
          disabled={loading || !publicKey}
          className="w-full"
        >
          {loading ? "Creating..." : "Create Profile"}
        </Button>
      </CardContent>
    </Card>
  );
}
