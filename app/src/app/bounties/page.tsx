"use client";

import { useState } from "react";
import Image from "next/image";
import { useWallet } from "@solana/wallet-adapter-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Users, Gift, Target, Plus, Check, Loader2 } from "lucide-react";
import { useBounties, useCreateBounty, useSubmitToBounty } from "@/hooks/useBounties";
import { useProfile, useProfiles } from "@/hooks/useProfiles";
import { shortenAddress, formatUsdc, parseUsdc, getGenderAvatar } from "@/lib/constants";
import type { Bounty, Profile } from "@/lib/supabase";

export default function BountiesPage() {
  const { connected, publicKey } = useWallet();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedBounty, setSelectedBounty] = useState<Bounty | null>(null);
  const [selectedMatchProfile, setSelectedMatchProfile] = useState<string>("");
  const [submissionNote, setSubmissionNote] = useState("");
  const [newBounty, setNewBounty] = useState({
    description: "",
    reward: "",
    preferences: "",
  });

  const { bounties, loading, error, refetch } = useBounties({ status: "open" });
  const { createBounty, loading: creating } = useCreateBounty();
  const { submitMatch, loading: submitting } = useSubmitToBounty();
  const { profiles } = useProfiles();

  const handleSubmitMatch = (bounty: Bounty) => {
    setSelectedBounty(bounty);
    setSelectedMatchProfile("");
    setSubmissionNote("");
  };

  const handleConfirmSubmission = async () => {
    if (!publicKey || !selectedBounty || !selectedMatchProfile) return;
    
    const success = await submitMatch(
      selectedBounty.id,
      publicKey.toBase58(),
      selectedMatchProfile,
      submissionNote || undefined
    );
    
    if (success) {
      setSelectedBounty(null);
      setSelectedMatchProfile("");
      setSubmissionNote("");
    }
  };

  const handleCreateBounty = async () => {
    if (!publicKey || !newBounty.description || !newBounty.reward) return;
    
    const preferences = newBounty.preferences
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    // TODO: Call on-chain createBounty first, then record in Supabase
    const result = await createBounty({
      issuer_wallet: publicKey.toBase58(),
      description: newBounty.description,
      preferences,
      reward_amount: parseUsdc(newBounty.reward),
    });
    
    if (result) {
      setShowCreateForm(false);
      setNewBounty({ description: "", reward: "", preferences: "" });
      refetch();
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
                <span className="gradient-flame-text">Matchmaker Bounties</span>
              </h1>
              <p className="text-zinc-500 text-sm">
                Help others find love and earn rewards
              </p>
            </div>
          </div>
          {connected && (
            <Button onClick={() => setShowCreateForm(!showCreateForm)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Bounty
            </Button>
          )}
        </div>

        {/* Create Bounty Form */}
        {showCreateForm && (
          <Card className="mb-8 rounded-xl bg-zinc-900 border-white/[0.06]">
            <CardHeader>
              <CardTitle className="gradient-flame-text">
                Create a Matchmaker Bounty
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                label="Describe your ideal match"
                value={newBounty.description}
                onChange={(e) =>
                  setNewBounty({ ...newBounty, description: e.target.value })
                }
                placeholder="Tell matchmakers what you're looking for..."
                rows={4}
              />
              <Input
                label="Reward Amount (USDC)"
                type="number"
                value={newBounty.reward}
                onChange={(e) =>
                  setNewBounty({ ...newBounty, reward: e.target.value })
                }
                placeholder="100"
              />
              <Input
                label="Preferences (comma-separated)"
                value={newBounty.preferences}
                onChange={(e) =>
                  setNewBounty({ ...newBounty, preferences: e.target.value })
                }
                placeholder="Age range, interests, location..."
              />
              <div className="flex gap-3 pt-2">
                <Button onClick={handleCreateBounty} disabled={creating}>
                  {creating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Create Bounty
                </Button>
                <Button variant="ghost" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bounties List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">{error}</p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </div>
        ) : bounties.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-500 mb-4">No active bounties at the moment</p>
            {connected && (
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create the first bounty
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {bounties.map((bounty) => (
              <BountyCard
                key={bounty.id}
                bounty={bounty}
                onSubmitMatch={() => handleSubmitMatch(bounty)}
                connected={connected}
              />
            ))}
          </div>
        )}

        {/* How it works */}
        <div className="mt-12">
          <Card className="rounded-xl bg-zinc-900 border-white/[0.06]">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-6 text-center">
                <span className="gradient-flame-text">How Matchmaker Bounties Work</span>
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-10 h-10 bg-rose-500/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <span className="text-sm font-semibold text-rose-400">1</span>
                  </div>
                  <h3 className="font-medium text-white text-sm mb-1">Create a Bounty</h3>
                  <p className="text-xs text-zinc-500">
                    Describe your ideal match and set a reward amount in USDC.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <span className="text-sm font-semibold text-orange-400">2</span>
                  </div>
                  <h3 className="font-medium text-white text-sm mb-1">Matchmakers Submit</h3>
                  <p className="text-xs text-zinc-500">
                    Friends and strangers submit potential matches for your
                    consideration.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-rose-500/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <span className="text-sm font-semibold text-rose-400">3</span>
                  </div>
                  <h3 className="font-medium text-white text-sm mb-1">Accept & Reward</h3>
                  <p className="text-xs text-zinc-500">
                    When you find a match you like, the matchmaker receives the
                    reward automatically.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submission Modal */}
        {selectedBounty && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedBounty(null)}
          >
            <div 
              className="bg-zinc-900 border border-white/[0.06] rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Submit a Match
                </h3>
                <p className="text-zinc-500 text-sm mb-6">
                  Suggest someone for this bounty. If they accept, you earn ${formatUsdc(selectedBounty.reward_amount)} USDC!
                </p>

                {/* Bounty description */}
                <div className="p-3 bg-white/[0.03] rounded-lg border border-white/[0.06] mb-4">
                  <p className="text-xs text-zinc-500 mb-1">Looking for:</p>
                  <p className="text-sm text-zinc-300">{selectedBounty.description}</p>
                </div>

                {/* Select Profile */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Select a Profile to Suggest
                  </label>
                  <div className="max-h-48 overflow-y-auto space-y-2 border border-white/[0.06] rounded-lg p-2">
                    {profiles
                      .filter(p => p.wallet_address !== selectedBounty.issuer_wallet && p.wallet_address !== publicKey?.toBase58())
                      .map((profile) => (
                        <button
                          key={profile.wallet_address}
                          onClick={() => setSelectedMatchProfile(profile.wallet_address)}
                          className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all ${
                            selectedMatchProfile === profile.wallet_address
                              ? "bg-rose-500/20 border border-rose-500/30"
                              : "bg-white/[0.03] border border-transparent hover:border-white/[0.1]"
                          }`}
                        >
                          <img
                            src={profile.photos?.[0] || getGenderAvatar(profile.wallet_address, profile.gender)}
                            alt={profile.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div className="text-left">
                            <p className="text-sm font-medium text-white">{profile.name}, {profile.age}</p>
                            <p className="text-xs text-zinc-500">{profile.location || shortenAddress(profile.wallet_address)}</p>
                          </div>
                          {selectedMatchProfile === profile.wallet_address && (
                            <Check className="w-4 h-4 text-rose-400 ml-auto" />
                          )}
                        </button>
                      ))}
                    {profiles.filter(p => p.wallet_address !== selectedBounty.issuer_wallet && p.wallet_address !== publicKey?.toBase58()).length === 0 && (
                      <p className="text-center text-zinc-500 text-sm py-4">No profiles available to suggest</p>
                    )}
                  </div>
                </div>

                {/* Optional Note */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Add a Note (Optional)
                  </label>
                  <textarea
                    value={submissionNote}
                    onChange={(e) => setSubmissionNote(e.target.value)}
                    placeholder="Why do you think they'd be a great match?"
                    rows={3}
                    className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-rose-500/30"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button 
                    variant="ghost" 
                    className="flex-1"
                    onClick={() => setSelectedBounty(null)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={handleConfirmSubmission}
                    disabled={!selectedMatchProfile || submitting}
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    Submit Match
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BountyCard({
  bounty,
  onSubmitMatch,
  connected,
}: {
  bounty: Bounty;
  onSubmitMatch: () => void;
  connected: boolean;
}) {
  const { profile } = useProfile(bounty.issuer_wallet);
  const displayName = profile?.name || shortenAddress(bounty.issuer_wallet);

  return (
    <Card className="rounded-xl bg-zinc-900 border-white/[0.06]">
      <CardContent className="p-5">
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Left side - Bounty info */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-500/10 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{displayName}</h3>
                <p className="text-[10px] text-zinc-600 font-mono">
                  {shortenAddress(bounty.issuer_wallet)}
                </p>
              </div>
            </div>

            <p className="text-zinc-400 text-sm leading-relaxed">{bounty.description}</p>

            <div className="flex flex-wrap gap-1.5">
              {bounty.preferences.map((pref, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-white/[0.04] border border-white/[0.06] rounded-md text-xs text-zinc-400"
                >
                  {pref}
                </span>
              ))}
            </div>
          </div>

          {/* Right side - Stats and action */}
          <div className="lg:w-56 space-y-3">
            <div className="p-4 bg-white/[0.03] rounded-lg text-center border border-white/[0.06]">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Gift className="w-5 h-5 text-rose-400" />
                <span className="text-2xl font-semibold gradient-flame-text">
                  ${formatUsdc(bounty.reward_amount)}
                </span>
              </div>
              <p className="text-xs text-zinc-500">Bounty Reward</p>
            </div>

            <div className="flex items-center justify-between text-xs px-1">
              <span className="text-zinc-600">Status</span>
              <span className="flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-white capitalize">{bounty.status}</span>
              </span>
            </div>

            {connected ? (
              <Button className="w-full" onClick={onSubmitMatch}>
                <Check className="w-4 h-4 mr-2" />
                Submit a Match
              </Button>
            ) : (
              <p className="text-center text-xs text-zinc-600 py-2">
                Connect wallet to submit
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
