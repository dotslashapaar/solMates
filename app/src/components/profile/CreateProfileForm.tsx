"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Sparkles, Heart, DollarSign, Check, AlertCircle, Loader2, Plus, X, MapPin, Briefcase, User, Users } from "lucide-react";
import { useCreateProfile, useProfile } from "@/hooks/useProfiles";
import { parseUsdc } from "@/lib/constants";
import { useSolmatesProgram } from "@/lib/anchor/hooks";
import { createProfile as createOnChainProfile } from "@/lib/anchor/program";
import type { GenderType } from "@/lib/supabase/types";

const GENDER_OPTIONS: { value: GenderType; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "non-binary", label: "Non-binary" },
  { value: "other", label: "Other" },
];

export function CreateProfileForm() {
  const { publicKey } = useWallet();
  const router = useRouter();
  const { profile, loading: profileLoading } = useProfile();
  const { createProfile, loading, error: createError } = useCreateProfile();
  const program = useSolmatesProgram();
  
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "" as GenderType | "",
    bio: "",
    location: "",
    occupation: "",
    dmPrice: "10",
  });
  const [lookingFor, setLookingFor] = useState<GenderType[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Redirect if user already has a profile
  useEffect(() => {
    if (!profileLoading && profile) {
      router.push("/profile");
    }
  }, [profile, profileLoading, router]);

  const handleAddInterest = () => {
    if (newInterest.trim() && interests.length < 10) {
      setInterests([...interests, newInterest.trim()]);
      setNewInterest("");
    }
  };

  const handleRemoveInterest = (index: number) => {
    setInterests(interests.filter((_, i) => i !== index));
  };

  const handleCreateProfile = async () => {
    if (!publicKey) {
      setError("Please connect your wallet");
      return;
    }

    // Validate
    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }
    if (!formData.age || parseInt(formData.age) < 18) {
      setError("You must be at least 18 years old");
      return;
    }
    if (!formData.gender) {
      setError("Please select your gender");
      return;
    }
    if (lookingFor.length === 0) {
      setError("Please select who you're interested in");
      return;
    }
    if (!formData.bio.trim()) {
      setError("Bio is required");
      return;
    }

    setError("");
    setSuccess(false);

    try {
      // Step 1: Create on-chain profile (if program is available)
      if (program) {
        toast.loading("Creating on-chain profile...", { id: "create-profile" });
        const dmPriceUsdc = parseUsdc(formData.dmPrice || "10");
        try {
          await createOnChainProfile(
            program,
            publicKey,
            dmPriceUsdc,
            null, // no asset gate
            0
          );
          toast.success("On-chain profile created!", { id: "create-profile" });
        } catch (onChainError: any) {
          // Check for specific error types
          if (onChainError.message?.includes("User rejected") || 
              onChainError.message?.includes("rejected")) {
            throw new Error("Transaction was rejected by wallet");
          }
          if (onChainError.message?.includes("insufficient") || 
              onChainError.message?.includes("0x1") ||
              onChainError.message?.includes("lamports")) {
            throw new Error("Insufficient SOL for transaction fees. Get devnet SOL from faucet.solana.com");
          }
          // Profile already exists on-chain - that's OK, just continue with Supabase
          if (onChainError.message?.includes("already in use") ||
              onChainError.message?.includes("already been processed") ||
              onChainError.logs?.some((log: string) => log.includes("already in use"))) {
            console.log("On-chain profile already exists, continuing with database profile...");
            toast.success("On-chain profile exists!", { id: "create-profile" });
            // Don't throw - continue to create Supabase profile
          } else {
            if (onChainError.logs) {
              console.error("Transaction logs:", onChainError.logs);
            }
            // Re-throw with better message
            throw new Error(onChainError.message || "Failed to create on-chain profile. Check console for details.");
          }
        }
      }

      // Step 2: Create Supabase profile
      const ageValue = parseInt(formData.age, 10);
      
      if (isNaN(ageValue) || ageValue < 18 || ageValue > 120) {
        throw new Error(`Invalid age value: ${formData.age} (parsed: ${ageValue})`);
      }
      
      const result = await createProfile({
        wallet_address: publicKey.toBase58(),
        name: formData.name.trim(),
        age: ageValue,
        gender: formData.gender as GenderType,
        looking_for: lookingFor,
        bio: formData.bio.trim(),
        location: formData.location.trim() || null,
        occupation: formData.occupation.trim() || null,
        interests: interests,
        photos: [],
        // Convert USDC to lamports for database storage
        dm_price: parseUsdc(formData.dmPrice) || parseUsdc(10),
      });

      if (result) {
        setSuccess(true);
        toast.success("Profile created! Redirecting...", { id: "create-profile" });
        // Small delay to ensure database write is committed, then force refresh + redirect
        await new Promise(resolve => setTimeout(resolve, 500));
        router.refresh(); // Clear Next.js cache
        router.replace("/discover");
      } else {
        // If result is null, throw an error to be caught
        throw new Error("Failed to save profile to database");
      }
    } catch (err: any) {
      console.error("Error creating profile:", err);
      setError(err.message || "Failed to create profile");
      toast.error(err.message || "Failed to create profile", { id: "create-profile" });
    }
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  return (
    <Card className="rounded-xl bg-zinc-900 border-white/[0.06]">
      <CardHeader className="text-center pb-2">
        <div className="w-12 h-12 bg-rose-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
          <Heart className="w-6 h-6 text-rose-400" />
        </div>
        <CardTitle className="text-lg">
          <span className="gradient-flame-text">Profile Details</span>
        </CardTitle>
        <p className="text-zinc-500 text-sm mt-1">
          Set your vibe and start connecting
        </p>
      </CardHeader>
      <CardContent className="space-y-5 pt-4">
        {/* Name */}
        <Input
          label="Name *"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Your name"
        />

        {/* Age */}
        <Input
          label="Age *"
          type="number"
          min="18"
          max="120"
          value={formData.age}
          onChange={(e) => setFormData({ ...formData, age: e.target.value })}
          placeholder="Your age"
        />

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            <User className="w-4 h-4 inline mr-1" />
            I am *
          </label>
          <div className="grid grid-cols-2 gap-2">
            {GENDER_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFormData({ ...formData, gender: option.value })}
                className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                  formData.gender === option.value
                    ? "bg-rose-500/20 border-rose-500 text-rose-400"
                    : "bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:border-white/[0.15]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Looking For */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            <Users className="w-4 h-4 inline mr-1" />
            Interested in * <span className="text-zinc-500 font-normal">(select all that apply)</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {GENDER_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  if (lookingFor.includes(option.value)) {
                    setLookingFor(lookingFor.filter((g) => g !== option.value));
                  } else {
                    setLookingFor([...lookingFor, option.value]);
                  }
                }}
                className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                  lookingFor.includes(option.value)
                    ? "bg-rose-500/20 border-rose-500 text-rose-400"
                    : "bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:border-white/[0.15]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Bio *</label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="Tell others about yourself..."
            className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none"
            rows={3}
          />
        </div>

        {/* Location */}
        <div className="relative">
          <Input
            label="Location"
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="City, Country"
          />
          <MapPin className="absolute right-3 top-[34px] w-4 h-4 text-zinc-600" />
        </div>

        {/* Occupation */}
        <div className="relative">
          <Input
            label="Occupation"
            type="text"
            value={formData.occupation}
            onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
            placeholder="What do you do?"
          />
          <Briefcase className="absolute right-3 top-[34px] w-4 h-4 text-zinc-600" />
        </div>

        {/* Interests */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Interests</label>
          <div className="flex gap-2 mb-2">
            <Input
              type="text"
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              placeholder="Add an interest"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddInterest())}
            />
            <Button type="button" onClick={handleAddInterest} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {interests.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {interests.map((interest, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-rose-500/10 border border-rose-500/20 rounded-md text-xs text-rose-400 flex items-center gap-1"
                >
                  {interest}
                  <button onClick={() => handleRemoveInterest(index)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* DM Price */}
        <div className="relative">
          <Input
            label="DM Price (USDC)"
            type="number"
            min="0"
            step="0.01"
            value={formData.dmPrice}
            onChange={(e) => setFormData({ ...formData, dmPrice: e.target.value })}
            placeholder="10.00"
          />
          <div className="absolute right-3 top-[34px] flex items-center gap-1 text-zinc-600">
            <DollarSign className="w-3.5 h-3.5" />
            <span className="text-xs">USDC</span>
          </div>
        </div>

        <div className="p-3 bg-white/[0.02] rounded-lg border border-white/[0.06]">
          <p className="text-xs text-zinc-500 leading-relaxed">
            Set the minimum USDC required for someone to slide into your DMs. 
            This amount is escrowed and you&apos;ll receive it when you accept 
            their message. <span className="text-rose-400">Filter the noise.</span>
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-xs">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-start gap-2">
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="text-emerald-400 text-xs">
              Profile created successfully! Redirecting to discover...
            </p>
          </div>
        )}

        <Button
          onClick={handleCreateProfile}
          disabled={loading || !publicKey}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Create Profile
            </>
          )}
        </Button>

        {!publicKey && (
          <p className="text-center text-xs text-zinc-600">
            Connect your wallet to create a profile
          </p>
        )}
      </CardContent>
    </Card>
  );
}
