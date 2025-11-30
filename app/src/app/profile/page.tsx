"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  User,
  Users,
  MapPin,
  Briefcase,
  DollarSign,
  Edit2,
  Save,
  X,
  Heart,
  Loader2,
  Plus,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { useProfile, useUpdateProfile, useDeleteProfile } from "@/hooks/useProfiles";
import { shortenAddress, formatUsdc, parseUsdc, getGenderAvatar } from "@/lib/constants";
import type { GenderType } from "@/lib/supabase/types";

const GENDER_OPTIONS: { value: GenderType; label: string }[] = [
  { value: "male", label: "Man" },
  { value: "female", label: "Woman" },
  { value: "non-binary", label: "Non-binary" },
  { value: "other", label: "Other" },
];

function formatGender(gender: GenderType): string {
  return GENDER_OPTIONS.find(o => o.value === gender)?.label || gender;
}

export default function ProfilePage() {
  const { connected, publicKey } = useWallet();
  const { profile, loading, error, refetch } = useProfile();
  const { updateProfile, loading: updating, error: updateError } = useUpdateProfile();
  const { deleteProfile, loading: deleting, error: deleteError } = useDeleteProfile();
  
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "" as GenderType | "",
    bio: "",
    location: "",
    occupation: "",
    dmPrice: "",
  });
  const [lookingFor, setLookingFor] = useState<GenderType[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState("");
  const [saveError, setSaveError] = useState("");

  // Load profile data into form when profile is fetched
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name,
        age: profile.age.toString(),
        gender: profile.gender || "",
        bio: profile.bio,
        location: profile.location || "",
        occupation: profile.occupation || "",
        // dm_price is stored in lamports, convert to USDC for display
        dmPrice: formatUsdc(profile.dm_price),
      });
      setLookingFor(profile.looking_for || []);
      setInterests(profile.interests || []);
    }
  }, [profile]);

  const handleAddInterest = () => {
    if (newInterest.trim() && interests.length < 10) {
      setInterests([...interests, newInterest.trim()]);
      setNewInterest("");
    }
  };

  const handleRemoveInterest = (index: number) => {
    setInterests(interests.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!profile) return;
    
    setSaveError("");
    
    const success = await updateProfile(profile.wallet_address, {
      name: formData.name.trim(),
      age: parseInt(formData.age),
      gender: formData.gender as GenderType,
      looking_for: lookingFor,
      bio: formData.bio.trim(),
      location: formData.location.trim() || null,
      occupation: formData.occupation.trim() || null,
      interests: interests,
      // Convert USDC to lamports for database storage
      dm_price: parseUsdc(formData.dmPrice) || parseUsdc(10),
    });

    if (success) {
      setIsEditing(false);
      refetch();
    } else if (updateError) {
      setSaveError(updateError);
    }
  };

  const handleCancel = () => {
    // Reset form to current profile data
    if (profile) {
      setFormData({
        name: profile.name,
        age: profile.age.toString(),
        gender: profile.gender || "",
        bio: profile.bio,
        location: profile.location || "",
        occupation: profile.occupation || "",
        // dm_price is stored in lamports, convert to USDC for display
        dmPrice: formatUsdc(profile.dm_price),
      });
      setLookingFor(profile.looking_for || []);
      setInterests(profile.interests || []);
    }
    setIsEditing(false);
    setSaveError("");
  };

  const handleDelete = async () => {
    if (!profile) return;
    
    const success = await deleteProfile(profile.wallet_address);
    if (success) {
      // Redirect to home or create profile page
      window.location.href = "/";
    }
  };

  if (!connected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <div className="relative w-20 h-20 mx-auto mb-6 rounded-full overflow-hidden bg-zinc-900 ring-1 ring-white/10">
            <Image
              src="/logo.png"
              alt="SolMates Logo"
              fill
              className="object-cover"
            />
          </div>
          <h1 className="text-xl font-semibold text-white mb-3">
            Connect to View Profile
          </h1>
          <p className="text-zinc-500 text-sm">
            Connect your wallet to view and edit your profile.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <div className="w-16 h-16 bg-rose-500/10 rounded-xl flex items-center justify-center mx-auto mb-6">
            <Heart className="w-8 h-8 text-rose-400" />
          </div>
          <h1 className="text-xl font-semibold text-white mb-3">
            No Profile Yet
          </h1>
          <p className="text-zinc-500 text-sm mb-6">
            Create your profile to start matching with other SolMates.
          </p>
          <Link href="/profile/create">
            <Button variant="hot">
              <Plus className="w-4 h-4 mr-2" />
              Create Profile
            </Button>
          </Link>
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
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
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
                  <span className="gradient-flame-text">Your Profile</span>
                </h1>
                <p className="text-zinc-500 text-sm">
                  {shortenAddress(publicKey?.toBase58() || "")}
                </p>
              </div>
            </div>
            {!isEditing && (
              <div className="flex items-center gap-2">
                <Button onClick={() => setIsEditing(true)} variant="ghost" size="sm">
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button 
                  onClick={() => setShowDeleteConfirm(true)} 
                  variant="ghost" 
                  size="sm"
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          <Card className="rounded-xl bg-zinc-900 border-white/[0.06]">
            <CardContent className="p-6">
              {/* Profile Photo */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <img
                    src={
                      profile.photos?.[0] ||
                      getGenderAvatar(profile.wallet_address, profile.gender)
                    }
                    alt={profile.name}
                    className="w-24 h-24 rounded-full bg-zinc-800 ring-2 ring-rose-500/20"
                  />
                  {profile.is_active && (
                    <div className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-zinc-900" />
                  )}
                </div>
              </div>

              {isEditing ? (
                // Edit Mode
                <div className="space-y-5">
                  <Input
                    label="Name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />

                  <Input
                    label="Age"
                    type="number"
                    min="18"
                    max="120"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  />

                  {/* Gender */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      <User className="w-4 h-4 inline mr-1" />
                      I am
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
                      Interested in
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

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Bio</label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none"
                      rows={3}
                    />
                  </div>

                  <Input
                    label="Location"
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="City, Country"
                  />

                  <Input
                    label="Occupation"
                    type="text"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                  />

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

                  <div className="relative">
                    <Input
                      label="DM Price (USDC)"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.dmPrice}
                      onChange={(e) => setFormData({ ...formData, dmPrice: e.target.value })}
                    />
                    <div className="absolute right-3 top-[34px] flex items-center gap-1 text-zinc-600">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span className="text-xs">USDC</span>
                    </div>
                  </div>

                  {saveError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-red-400 text-xs">{saveError}</p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button onClick={handleCancel} variant="ghost" className="flex-1">
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={updating} className="flex-1">
                      {updating ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="space-y-4">
                  <div className="text-center">
                    <h2 className="text-xl font-semibold text-white mb-1">
                      {profile.name}, {profile.age}
                    </h2>
                    {profile.gender && (
                      <p className="text-zinc-400 text-sm mb-1">{formatGender(profile.gender)}</p>
                    )}
                    <p className="text-zinc-500 text-sm">{profile.bio}</p>
                  </div>

                  {/* Gender & Looking For */}
                  {profile.looking_for && profile.looking_for.length > 0 && (
                    <div className="pt-4 border-t border-white/[0.06]">
                      <p className="text-xs text-zinc-500 mb-2">Interested in</p>
                      <div className="flex flex-wrap gap-2">
                        {profile.looking_for.map((g, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-violet-500/10 border border-violet-500/20 rounded-md text-xs text-violet-400"
                          >
                            {formatGender(g)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/[0.06]">
                    {profile.location && (
                      <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <MapPin className="w-4 h-4 text-rose-400" />
                        {profile.location}
                      </div>
                    )}
                    {profile.occupation && (
                      <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <Briefcase className="w-4 h-4 text-rose-400" />
                        {profile.occupation}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-zinc-400 col-span-2">
                      <DollarSign className="w-4 h-4 text-rose-400" />
                      DM Price: {formatUsdc(profile.dm_price)} USDC
                    </div>
                  </div>

                  {profile.interests && profile.interests.length > 0 && (
                    <div className="pt-4 border-t border-white/[0.06]">
                      <p className="text-xs text-zinc-500 mb-2">Interests</p>
                      <div className="flex flex-wrap gap-2">
                        {profile.interests.map((interest, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-rose-500/10 border border-rose-500/20 rounded-md text-xs text-rose-400"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/[0.06] rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-center w-12 h-12 bg-red-500/10 rounded-full mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-white text-center mb-2">
              Delete Profile?
            </h3>
            <p className="text-zinc-400 text-sm text-center mb-6">
              This action cannot be undone. Your profile, matches, and messages will be permanently deleted.
            </p>
            {deleteError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg mb-4">
                <p className="text-red-400 text-xs text-center">{deleteError}</p>
              </div>
            )}
            <div className="flex gap-3">
              <Button 
                onClick={() => setShowDeleteConfirm(false)} 
                variant="ghost" 
                className="flex-1"
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleDelete} 
                disabled={deleting}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
