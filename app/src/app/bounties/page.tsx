"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Users, Gift, Target, Plus, Check } from "lucide-react";

// Mock bounties for demo
const MOCK_BOUNTIES = [
  {
    id: "1",
    creator: "LonelyWhale",
    creatorWallet: "9xYZ...1aBc",
    description:
      "Looking for a fellow crypto enthusiast who loves hiking and has diamond hands. Must be into long-term HODLing (relationships too).",
    reward: 100,
    totalSubmissions: 5,
    status: "active",
    preferences: ["25-35 years", "Crypto native", "Outdoorsy"],
  },
  {
    id: "2",
    creator: "SolanaSam",
    creatorWallet: "2dEF...3gHi",
    description:
      "Help me find a co-founder for my life project. Must appreciate good code and bad puns. Validators preferred but not required.",
    reward: 250,
    totalSubmissions: 12,
    status: "active",
    preferences: ["Tech-savvy", "Sense of humor", "Ambitious"],
  },
  {
    id: "3",
    creator: "MetaverseMary",
    creatorWallet: "4jKL...5mNo",
    description:
      "Searching for someone who can handle me in both IRL and the metaverse. Must own at least one blue-chip NFT (jk... unless?)",
    reward: 75,
    totalSubmissions: 8,
    status: "active",
    preferences: ["NFT collector", "Creative", "Open-minded"],
  },
];

export default function BountiesPage() {
  const { connected } = useWallet();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newBounty, setNewBounty] = useState({
    description: "",
    reward: "",
    preferences: "",
  });

  const handleSubmitMatch = (bountyId: string) => {
    console.log(`Submitting match for bounty ${bountyId}`);
    // In real app, open modal to submit a match
  };

  const handleCreateBounty = () => {
    console.log("Creating bounty:", newBounty);
    setShowCreateForm(false);
    // In real app, call on-chain instruction
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold font-space-grotesk">
            Matchmaker Bounties
          </h1>
          <p className="text-[#a1a1aa]">
            Help others find love and earn rewards
          </p>
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
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create a Matchmaker Bounty</CardTitle>
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
            <div className="flex gap-4">
              <Button onClick={handleCreateBounty}>Create Bounty</Button>
              <Button variant="ghost" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bounties List */}
      <div className="space-y-6">
        {MOCK_BOUNTIES.map((bounty) => (
          <Card key={bounty.id}>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Left side - Bounty info */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{bounty.creator}</h3>
                      <p className="text-xs text-[#a1a1aa]">
                        {bounty.creatorWallet}
                      </p>
                    </div>
                  </div>

                  <p className="text-[#a1a1aa]">{bounty.description}</p>

                  <div className="flex flex-wrap gap-2">
                    {bounty.preferences.map((pref, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-[#1a1a2e] rounded-full text-xs"
                      >
                        {pref}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right side - Stats and action */}
                <div className="lg:w-64 space-y-4">
                  <div className="p-4 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Gift className="w-5 h-5 text-pink-500" />
                      <span className="text-2xl font-bold">${bounty.reward}</span>
                    </div>
                    <p className="text-sm text-[#a1a1aa]">Bounty Reward</p>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#a1a1aa]">Submissions</span>
                    <span className="flex items-center gap-1">
                      <Target className="w-4 h-4 text-purple-500" />
                      {bounty.totalSubmissions}
                    </span>
                  </div>

                  {connected ? (
                    <Button
                      className="w-full"
                      onClick={() => handleSubmitMatch(bounty.id)}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Submit a Match
                    </Button>
                  ) : (
                    <p className="text-center text-sm text-[#a1a1aa]">
                      Connect wallet to submit
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* How it works */}
      <Card className="mt-12 bg-gradient-to-br from-purple-500/10 to-transparent">
        <CardContent className="p-8">
          <h2 className="text-2xl font-bold mb-6 text-center font-space-grotesk">
            How Matchmaker Bounties Work
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-pink-500">1</span>
              </div>
              <h3 className="font-bold mb-2">Create a Bounty</h3>
              <p className="text-sm text-[#a1a1aa]">
                Describe your ideal match and set a reward amount in USDC.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-purple-500">2</span>
              </div>
              <h3 className="font-bold mb-2">Matchmakers Submit</h3>
              <p className="text-sm text-[#a1a1aa]">
                Friends and strangers submit potential matches for your
                consideration.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-indigo-500">3</span>
              </div>
              <h3 className="font-bold mb-2">Accept & Reward</h3>
              <p className="text-sm text-[#a1a1aa]">
                When you find a match you like, the matchmaker receives the
                reward automatically.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
