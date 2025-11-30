"use client";

import { useState } from "react";
import Image from "next/image";
import { useWallet } from "@solana/wallet-adapter-react";
import toast from "react-hot-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Users, Gift, Target, Plus, Check, Loader2, X, Eye } from "lucide-react";
import { useBounties, useCreateBounty, useSubmitToBounty, useBountySubmissions, useAcceptSubmission } from "@/hooks/useBounties";
import { useProfile, useProfiles } from "@/hooks/useProfiles";
import { shortenAddress, formatUsdc, parseUsdc, getGenderAvatar } from "@/lib/constants";
import { useSolmatesProgram } from "@/lib/anchor/hooks";
import { createBounty as onChainCreateBounty, cancelBounty as onChainCancelBounty, payoutReferral as onChainPayoutReferral } from "@/lib/anchor/program";
import type { Bounty, Profile, BountySubmission } from "@/lib/supabase";

export default function BountiesPage() {
  const { connected, publicKey } = useWallet();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedBounty, setSelectedBounty] = useState<Bounty | null>(null);
  const [viewSubmissionsBounty, setViewSubmissionsBounty] = useState<Bounty | null>(null);
  const [selectedMatchProfile, setSelectedMatchProfile] = useState<string>("");
  const [submissionNote, setSubmissionNote] = useState("");
  const [cancellingBounty, setCancellingBounty] = useState<string | null>(null);
  const [acceptingSubmission, setAcceptingSubmission] = useState<string | null>(null);
  const [newBounty, setNewBounty] = useState({
    description: "",
    reward: "",
    preferences: "",
  });

  const { bounties, loading, error, refetch } = useBounties({ status: "open" });
  const { createBounty, loading: creating } = useCreateBounty();
  const { submitMatch, loading: submitting } = useSubmitToBounty();
  const { acceptSubmission } = useAcceptSubmission();
  const { profiles } = useProfiles();
  const program = useSolmatesProgram();

  const handleCancelBounty = async (bounty: Bounty) => {
    if (!publicKey || !program) return;
    
    setCancellingBounty(bounty.id);
    try {
      toast.loading("Cancelling bounty...", { id: "cancel-bounty" });
      const txSignature = await onChainCancelBounty(program, publicKey);
      toast.success(`Bounty cancelled! ${formatUsdc(bounty.reward_amount)} USDC refunded.`, { id: "cancel-bounty" });
      
      // Update bounty status in Supabase
      const supabase = (await import("@/lib/supabase")).getSupabase();
      await supabase
        .from("bounties")
        .update({ status: "cancelled", tx_signature: txSignature })
        .eq("id", bounty.id);
      
      refetch();
    } catch (err: any) {
      console.error("Error cancelling bounty:", err);
      toast.error("Failed to cancel bounty", { id: "cancel-bounty" });
    }
    setCancellingBounty(null);
  };

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
      toast.success("Match submitted!");
      setSelectedBounty(null);
      setSelectedMatchProfile("");
      setSubmissionNote("");
    }
  };

  const handleAcceptSubmission = async (submission: BountySubmission, bounty: Bounty) => {
    if (!publicKey || !program) return;
    
    setAcceptingSubmission(submission.id);
    try {
      toast.loading("Accepting match and paying reward...", { id: "accept-submission" });
      
      // Call on-chain payout
      const matchmakerPubkey = new (await import("@solana/web3.js")).PublicKey(submission.matchmaker_wallet);
      const txSignature = await onChainPayoutReferral(program, publicKey, matchmakerPubkey);
      
      // Update Supabase
      await acceptSubmission(
        submission.id,
        bounty.id,
        submission.matchmaker_wallet,
        submission.suggested_wallet,
        txSignature
      );
      
      toast.success(`Match accepted! ${formatUsdc(bounty.reward_amount)} USDC sent to matchmaker (1% fee to platform)`, { id: "accept-submission" });
      setViewSubmissionsBounty(null);
      refetch();
    } catch (err: any) {
      console.error("Error accepting submission:", err);
      toast.error("Failed to accept submission", { id: "accept-submission" });
    }
    setAcceptingSubmission(null);
  };

  const handleCreateBounty = async () => {
    if (!publicKey || !newBounty.description || !newBounty.reward) return;
    
    const preferences = newBounty.preferences
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    const rewardAmount = parseUsdc(newBounty.reward);
    let txSignature: string | undefined;

    // Call on-chain createBounty first
    if (program) {
      try {
        toast.loading("Creating on-chain bounty...", { id: "create-bounty" });
        txSignature = await onChainCreateBounty(program, publicKey, rewardAmount);
        toast.success("On-chain bounty created!", { id: "create-bounty" });
      } catch (err: any) {
        console.error("On-chain bounty creation failed:", err);
        toast.error("On-chain creation failed, saving to database only", { id: "create-bounty" });
        // Continue with Supabase-only for demo
      }
    }

    // Record in Supabase
    const result = await createBounty({
      issuer_wallet: publicKey.toBase58(),
      description: newBounty.description,
      preferences,
      reward_amount: rewardAmount,
      tx_signature: txSignature,
    });
    
    if (result) {
      toast.success("Bounty created successfully!");
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
                onCancel={() => handleCancelBounty(bounty)}
                onViewSubmissions={() => setViewSubmissionsBounty(bounty)}
                connected={connected}
                cancelling={cancellingBounty === bounty.id}
                isIssuer={bounty.issuer_wallet === publicKey?.toBase58()}
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

        {/* View Submissions Modal */}
        {viewSubmissionsBounty && (
          <ViewSubmissionsModal
            bounty={viewSubmissionsBounty}
            profiles={profiles}
            onClose={() => setViewSubmissionsBounty(null)}
            onAccept={handleAcceptSubmission}
            acceptingSubmission={acceptingSubmission}
          />
        )}
      </div>
    </div>
  );
}

function BountyCard({
  bounty,
  onSubmitMatch,
  onCancel,
  onViewSubmissions,
  connected,
  cancelling,
  isIssuer,
}: {
  bounty: Bounty;
  onSubmitMatch: () => void;
  onCancel: () => void;
  onViewSubmissions: () => void;
  connected: boolean;
  cancelling: boolean;
  isIssuer: boolean;
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
              isIssuer ? (
                <div className="space-y-2">
                  <Button 
                    className="w-full bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/[0.06]" 
                    onClick={onViewSubmissions}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Submissions
                  </Button>
                  <Button 
                    className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20" 
                    onClick={onCancel}
                    disabled={cancelling}
                  >
                    {cancelling ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <X className="w-4 h-4 mr-2" />
                    )}
                    Cancel Bounty
                  </Button>
                </div>
              ) : (
                <Button className="w-full" onClick={onSubmitMatch}>
                  <Check className="w-4 h-4 mr-2" />
                  Submit a Match
                </Button>
              )
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

function ViewSubmissionsModal({
  bounty,
  profiles,
  onClose,
  onAccept,
  acceptingSubmission,
}: {
  bounty: Bounty;
  profiles: Profile[];
  onClose: () => void;
  onAccept: (submission: BountySubmission, bounty: Bounty) => void;
  acceptingSubmission: string | null;
}) {
  const { submissions, loading } = useBountySubmissions(bounty.id);
  
  const getProfileForWallet = (wallet: string) => 
    profiles.find(p => p.wallet_address === wallet);
  
  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-zinc-900 border border-white/[0.06] rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              Submissions for Your Bounty
            </h3>
            <button onClick={onClose} className="text-zinc-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-3 bg-white/[0.03] rounded-lg border border-white/[0.06] mb-4">
            <p className="text-xs text-zinc-500 mb-1">Your bounty:</p>
            <p className="text-sm text-zinc-300">{bounty.description}</p>
            <p className="text-xs text-rose-400 mt-2">Reward: ${formatUsdc(bounty.reward_amount)} USDC</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
              <p className="text-zinc-500 text-sm">No submissions yet</p>
              <p className="text-zinc-600 text-xs mt-1">Matchmakers will submit profiles here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.filter(s => s.status === "pending").map((submission) => {
                const suggestedProfile = getProfileForWallet(submission.suggested_wallet);
                const matchmakerProfile = getProfileForWallet(submission.matchmaker_wallet);
                
                return (
                  <div key={submission.id} className="p-4 bg-white/[0.03] rounded-lg border border-white/[0.06]">
                    <div className="flex items-start gap-3">
                      <img
                        src={suggestedProfile?.photos?.[0] || getGenderAvatar(submission.suggested_wallet, suggestedProfile?.gender)}
                        alt="Suggested match"
                        className="w-14 h-14 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white">
                          {suggestedProfile?.name || shortenAddress(submission.suggested_wallet)}
                          {suggestedProfile?.age && <span className="text-zinc-400">, {suggestedProfile.age}</span>}
                        </h4>
                        {suggestedProfile?.location && (
                          <p className="text-xs text-zinc-500">{suggestedProfile.location}</p>
                        )}
                        {suggestedProfile?.bio && (
                          <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{suggestedProfile.bio}</p>
                        )}
                        {submission.note && (
                          <div className="mt-2 p-2 bg-white/[0.03] rounded border border-white/[0.06]">
                            <p className="text-[10px] text-zinc-600">Matchmaker's note:</p>
                            <p className="text-xs text-zinc-400 italic">"{submission.note}"</p>
                          </div>
                        )}
                        <p className="text-[10px] text-zinc-600 mt-2">
                          Submitted by: {matchmakerProfile?.name || shortenAddress(submission.matchmaker_wallet)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => onAccept(submission, bounty)}
                        disabled={acceptingSubmission === submission.id}
                      >
                        {acceptingSubmission === submission.id ? (
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5 mr-1.5" />
                        )}
                        Accept & Pay Reward
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
