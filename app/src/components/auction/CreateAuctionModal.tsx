"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import toast from "react-hot-toast";
import { X, Gavel, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useCreateAuction } from "@/hooks/useAuctions";
import { useSolmatesProgram } from "@/lib/anchor/hooks";
import { createAuction as onChainCreateAuction, fetchUserProfile } from "@/lib/anchor/program";
import { parseUsdc } from "@/lib/constants";

interface CreateAuctionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateAuctionModal({ isOpen, onClose, onSuccess }: CreateAuctionModalProps) {
  const { publicKey } = useWallet();
  const { createAuction, loading } = useCreateAuction();
  const program = useSolmatesProgram();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startPrice: "50",
    durationHours: "24",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!publicKey) {
      setError("Please connect your wallet");
      return;
    }
    
    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }
    
    if (!formData.description.trim()) {
      setError("Description is required");
      return;
    }
    
    const startPrice = parseUsdc(formData.startPrice);
    const durationHours = parseInt(formData.durationHours);
    
    if (startPrice < 1_000_000) {
      setError("Minimum start price is $1");
      return;
    }
    
    if (durationHours < 1 || durationHours > 168) {
      setError("Duration must be between 1 and 168 hours");
      return;
    }
    
    setError("");
    
    try {
      const endTime = new Date(Date.now() + durationHours * 3600000);
      
      let txSignature: string | undefined;
      let auctionId: number;
      
      // Call on-chain first if program is available
      if (program) {
        try {
          toast.loading("Creating on-chain auction...", { id: "create-auction" });
          const durationSeconds = durationHours * 3600;
          
          // Fetch current profile to get auction_count BEFORE creating
          const profileBefore = await fetchUserProfile(program, publicKey);
          auctionId = profileBefore ? profileBefore.auctionCount.toNumber() : 0;
          
          txSignature = await onChainCreateAuction(
            program,
            publicKey,
            startPrice,
            durationSeconds
          );
          toast.success("On-chain auction created!", { id: "create-auction" });
        } catch (err: any) {
          console.error("On-chain auction creation failed:", err);
          toast.dismiss("create-auction");
          // Fallback to timestamp-based ID for demo
          auctionId = Math.floor(Date.now() / 1000);
        }
      } else {
        // No program available, use timestamp as fallback
        auctionId = Math.floor(Date.now() / 1000);
      }
      
      // Create in Supabase
      const success = await createAuction({
        host_wallet: publicKey.toBase58(),
        auction_id: auctionId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        start_price: startPrice,
        current_bid: startPrice,
        end_time: endTime.toISOString(),
        tx_signature: txSignature,
      });
      
      if (success) {
        toast.success("Auction created successfully!");
        setFormData({
          title: "",
          description: "",
          startPrice: "50",
          durationHours: "24",
        });
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      console.error("Error creating auction:", err);
      toast.error(err.message || "Failed to create auction");
      setError(err.message || "Failed to create auction");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-zinc-900 rounded-xl border border-white/[0.06] shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-rose-500/10 rounded-lg flex items-center justify-center">
              <Gavel className="w-4 h-4 text-rose-400" />
            </div>
            <h2 className="text-lg font-semibold">
              <span className="gradient-flame-text">Create Auction</span>
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/[0.04] transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <Input
            label="Auction Title"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Coffee date at Solana Beach"
          />
          
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the date experience..."
              className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Price (USDC)"
              type="number"
              min="1"
              step="1"
              value={formData.startPrice}
              onChange={(e) => setFormData({ ...formData, startPrice: e.target.value })}
            />
            
            <Input
              label="Duration (hours)"
              type="number"
              min="1"
              max="168"
              value={formData.durationHours}
              onChange={(e) => setFormData({ ...formData, durationHours: e.target.value })}
            />
          </div>
          
          <div className="p-3 bg-white/[0.02] rounded-lg border border-white/[0.06]">
            <p className="text-xs text-zinc-500 leading-relaxed">
              Once created, your auction will be visible to all users. 
              The highest bidder at the end wins. 
              <span className="text-rose-400"> You receive 100% of the winning bid.</span>
            </p>
          </div>
          
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}
          
          <div className="flex gap-3 pt-2">
            <Button 
              type="button" 
              onClick={onClose} 
              variant="ghost" 
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading} 
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Gavel className="w-4 h-4 mr-2" />
                  Create Auction
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
