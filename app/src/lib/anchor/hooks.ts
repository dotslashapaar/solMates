"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  getProgram,
  getReadOnlyProgram,
  fetchUserProfile,
  fetchMessageEscrow,
  fetchDateAuction,
  fetchBountyVault,
  fetchAllUserProfiles,
  fetchAllAuctions,
  fetchAllBounties,
  fetchAllEscrows,
  createProfile as createProfileIx,
  updateProfile as updateProfileIx,
  depositForDm as depositForDmIx,
  acceptDm as acceptDmIx,
  refundDm as refundDmIx,
  createAuction as createAuctionIx,
  placeBid as placeBidIx,
  claimAuction as claimAuctionIx,
  createBounty as createBountyIx,
  updateBounty as updateBountyIx,
  payoutReferral as payoutReferralIx,
  cancelBounty as cancelBountyIx,
  SolmatesProgram,
} from "../anchor";
import type {
  UserProfile,
  MessageEscrow,
  DateAuction,
  BountyVault,
} from "../anchor";
import { USDC_MINT } from "../constants";

// Hook for getting the program instance
export function useSolmatesProgram(): SolmatesProgram | null {
  const { connection } = useConnection();
  const wallet = useWallet();

  return useMemo(() => {
    if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) {
      return null;
    }

    const anchorWallet: AnchorWallet = {
      publicKey: wallet.publicKey,
      signTransaction: wallet.signTransaction,
      signAllTransactions: wallet.signAllTransactions,
    };

    return getProgram(anchorWallet, connection);
  }, [wallet.publicKey, wallet.signTransaction, wallet.signAllTransactions, connection]);
}

// Hook for read-only program access (no wallet needed)
export function useReadOnlyProgram(): SolmatesProgram {
  const { connection } = useConnection();
  return useMemo(() => getReadOnlyProgram(connection), [connection]);
}

// ============================================
// Profile Hooks
// ============================================

export function useUserProfile(authority?: PublicKey | null) {
  const program = useReadOnlyProgram();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!authority) {
      setProfile(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchUserProfile(program, authority);
      setProfile(data);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to fetch profile"));
    } finally {
      setLoading(false);
    }
  }, [program, authority]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { profile, loading, error, refetch };
}

export function useMyProfile() {
  const wallet = useWallet();
  return useUserProfile(wallet.publicKey);
}

export function useAllProfiles() {
  const program = useReadOnlyProgram();
  const [profiles, setProfiles] = useState<{ publicKey: PublicKey; account: UserProfile }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllUserProfiles(program);
      setProfiles(data);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to fetch profiles"));
    } finally {
      setLoading(false);
    }
  }, [program]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { profiles, loading, error, refetch };
}

// ============================================
// Profile Mutations
// ============================================

export function useCreateProfile() {
  const program = useSolmatesProgram();
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createProfile = useCallback(
    async (
      dmPrice: number,
      assetGateMint: PublicKey | null = null,
      minAssetAmount: number = 0
    ) => {
      if (!program || !wallet.publicKey) {
        throw new Error("Wallet not connected");
      }

      setLoading(true);
      setError(null);
      try {
        const txSig = await createProfileIx(
          program,
          wallet.publicKey,
          dmPrice,
          assetGateMint,
          minAssetAmount
        );
        return txSig;
      } catch (e) {
        const err = e instanceof Error ? e : new Error("Failed to create profile");
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [program, wallet.publicKey]
  );

  return { createProfile, loading, error };
}

export function useUpdateProfile() {
  const program = useSolmatesProgram();
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateProfile = useCallback(
    async (
      dmPrice: number | null = null,
      assetGateMint: PublicKey | null | undefined = undefined,
      minAssetAmount: number | null = null
    ) => {
      if (!program || !wallet.publicKey) {
        throw new Error("Wallet not connected");
      }

      setLoading(true);
      setError(null);
      try {
        const txSig = await updateProfileIx(
          program,
          wallet.publicKey,
          dmPrice,
          assetGateMint,
          minAssetAmount
        );
        return txSig;
      } catch (e) {
        const err = e instanceof Error ? e : new Error("Failed to update profile");
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [program, wallet.publicKey]
  );

  return { updateProfile, loading, error };
}

// ============================================
// Escrow Hooks
// ============================================

export function useMessageEscrow(sender?: PublicKey | null, recipient?: PublicKey | null) {
  const program = useReadOnlyProgram();
  const [escrow, setEscrow] = useState<MessageEscrow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!sender || !recipient) {
      setEscrow(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchMessageEscrow(program, sender, recipient);
      setEscrow(data);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to fetch escrow"));
    } finally {
      setLoading(false);
    }
  }, [program, sender, recipient]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { escrow, loading, error, refetch };
}

export function useAllEscrows() {
  const program = useReadOnlyProgram();
  const [escrows, setEscrows] = useState<{ publicKey: PublicKey; account: MessageEscrow }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllEscrows(program);
      setEscrows(data);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to fetch escrows"));
    } finally {
      setLoading(false);
    }
  }, [program]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { escrows, loading, error, refetch };
}

// ============================================
// Escrow Mutations
// ============================================

export function useDepositForDm() {
  const program = useSolmatesProgram();
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const depositForDm = useCallback(
    async (
      recipient: PublicKey,
      amount: number,
      mint: PublicKey = USDC_MINT,
      senderGateTokenAccount?: PublicKey
    ) => {
      if (!program || !wallet.publicKey) {
        throw new Error("Wallet not connected");
      }

      setLoading(true);
      setError(null);
      try {
        const txSig = await depositForDmIx(
          program,
          wallet.publicKey,
          recipient,
          amount,
          mint,
          senderGateTokenAccount
        );
        return txSig;
      } catch (e) {
        const err = e instanceof Error ? e : new Error("Failed to deposit for DM");
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [program, wallet.publicKey]
  );

  return { depositForDm, loading, error };
}

export function useAcceptDm() {
  const program = useSolmatesProgram();
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const acceptDm = useCallback(
    async (sender: PublicKey, mint: PublicKey = USDC_MINT) => {
      if (!program || !wallet.publicKey) {
        throw new Error("Wallet not connected");
      }

      setLoading(true);
      setError(null);
      try {
        const txSig = await acceptDmIx(program, sender, wallet.publicKey, mint);
        return txSig;
      } catch (e) {
        const err = e instanceof Error ? e : new Error("Failed to accept DM");
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [program, wallet.publicKey]
  );

  return { acceptDm, loading, error };
}

export function useRefundDm() {
  const program = useSolmatesProgram();
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refundDm = useCallback(
    async (recipient: PublicKey, mint: PublicKey = USDC_MINT) => {
      if (!program || !wallet.publicKey) {
        throw new Error("Wallet not connected");
      }

      setLoading(true);
      setError(null);
      try {
        const txSig = await refundDmIx(program, wallet.publicKey, recipient, mint);
        return txSig;
      } catch (e) {
        const err = e instanceof Error ? e : new Error("Failed to refund DM");
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [program, wallet.publicKey]
  );

  return { refundDm, loading, error };
}

// ============================================
// Auction Hooks
// ============================================

export function useDateAuction(host?: PublicKey | null, auctionId?: number) {
  const program = useReadOnlyProgram();
  const [auction, setAuction] = useState<DateAuction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!host || auctionId === undefined) {
      setAuction(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchDateAuction(program, host, auctionId);
      setAuction(data);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to fetch auction"));
    } finally {
      setLoading(false);
    }
  }, [program, host, auctionId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { auction, loading, error, refetch };
}

export function useAllAuctions() {
  const program = useReadOnlyProgram();
  const [auctions, setAuctions] = useState<{ publicKey: PublicKey; account: DateAuction }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllAuctions(program);
      setAuctions(data);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to fetch auctions"));
    } finally {
      setLoading(false);
    }
  }, [program]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { auctions, loading, error, refetch };
}

// ============================================
// Auction Mutations
// ============================================

export function useCreateAuction() {
  const program = useSolmatesProgram();
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createAuction = useCallback(
    async (startPrice: number, durationSecs: number, mint: PublicKey = USDC_MINT) => {
      if (!program || !wallet.publicKey) {
        throw new Error("Wallet not connected");
      }

      setLoading(true);
      setError(null);
      try {
        const txSig = await createAuctionIx(program, wallet.publicKey, startPrice, durationSecs, mint);
        return txSig;
      } catch (e) {
        const err = e instanceof Error ? e : new Error("Failed to create auction");
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [program, wallet.publicKey]
  );

  return { createAuction, loading, error };
}

export function usePlaceBid() {
  const program = useSolmatesProgram();
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const placeBid = useCallback(
    async (
      host: PublicKey,
      auctionId: number,
      bidAmount: number,
      previousBidder: PublicKey,
      mint: PublicKey = USDC_MINT
    ) => {
      if (!program || !wallet.publicKey) {
        throw new Error("Wallet not connected");
      }

      setLoading(true);
      setError(null);
      try {
        const txSig = await placeBidIx(
          program,
          wallet.publicKey,
          host,
          auctionId,
          bidAmount,
          previousBidder,
          mint
        );
        return txSig;
      } catch (e) {
        const err = e instanceof Error ? e : new Error("Failed to place bid");
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [program, wallet.publicKey]
  );

  return { placeBid, loading, error };
}

export function useClaimAuction() {
  const program = useSolmatesProgram();
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const claimAuction = useCallback(
    async (auctionId: number, mint: PublicKey = USDC_MINT) => {
      if (!program || !wallet.publicKey) {
        throw new Error("Wallet not connected");
      }

      setLoading(true);
      setError(null);
      try {
        const txSig = await claimAuctionIx(program, wallet.publicKey, auctionId, mint);
        return txSig;
      } catch (e) {
        const err = e instanceof Error ? e : new Error("Failed to claim auction");
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [program, wallet.publicKey]
  );

  return { claimAuction, loading, error };
}

// ============================================
// Bounty Hooks
// ============================================

export function useBountyVault(issuer?: PublicKey | null) {
  const program = useReadOnlyProgram();
  const [bounty, setBounty] = useState<BountyVault | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!issuer) {
      setBounty(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchBountyVault(program, issuer);
      setBounty(data);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to fetch bounty"));
    } finally {
      setLoading(false);
    }
  }, [program, issuer]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { bounty, loading, error, refetch };
}

export function useAllBounties() {
  const program = useReadOnlyProgram();
  const [bounties, setBounties] = useState<{ publicKey: PublicKey; account: BountyVault }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllBounties(program);
      setBounties(data);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to fetch bounties"));
    } finally {
      setLoading(false);
    }
  }, [program]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { bounties, loading, error, refetch };
}

// ============================================
// Bounty Mutations
// ============================================

export function useCreateBounty() {
  const program = useSolmatesProgram();
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createBounty = useCallback(
    async (rewardAmount: number, mint: PublicKey = USDC_MINT) => {
      if (!program || !wallet.publicKey) {
        throw new Error("Wallet not connected");
      }

      setLoading(true);
      setError(null);
      try {
        const txSig = await createBountyIx(program, wallet.publicKey, rewardAmount, mint);
        return txSig;
      } catch (e) {
        const err = e instanceof Error ? e : new Error("Failed to create bounty");
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [program, wallet.publicKey]
  );

  return { createBounty, loading, error };
}

export function useUpdateBounty() {
  const program = useSolmatesProgram();
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateBounty = useCallback(
    async (newAmount: number, mint: PublicKey = USDC_MINT) => {
      if (!program || !wallet.publicKey) {
        throw new Error("Wallet not connected");
      }

      setLoading(true);
      setError(null);
      try {
        const txSig = await updateBountyIx(program, wallet.publicKey, newAmount, mint);
        return txSig;
      } catch (e) {
        const err = e instanceof Error ? e : new Error("Failed to update bounty");
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [program, wallet.publicKey]
  );

  return { updateBounty, loading, error };
}

export function usePayoutReferral() {
  const program = useSolmatesProgram();
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const payoutReferral = useCallback(
    async (matchmaker: PublicKey, mint: PublicKey = USDC_MINT) => {
      if (!program || !wallet.publicKey) {
        throw new Error("Wallet not connected");
      }

      setLoading(true);
      setError(null);
      try {
        const txSig = await payoutReferralIx(program, wallet.publicKey, matchmaker, mint);
        return txSig;
      } catch (e) {
        const err = e instanceof Error ? e : new Error("Failed to payout referral");
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [program, wallet.publicKey]
  );

  return { payoutReferral, loading, error };
}

export function useCancelBounty() {
  const program = useSolmatesProgram();
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const cancelBounty = useCallback(
    async (mint: PublicKey = USDC_MINT) => {
      if (!program || !wallet.publicKey) {
        throw new Error("Wallet not connected");
      }

      setLoading(true);
      setError(null);
      try {
        const txSig = await cancelBountyIx(program, wallet.publicKey, mint);
        return txSig;
      } catch (e) {
        const err = e instanceof Error ? e : new Error("Failed to cancel bounty");
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [program, wallet.publicKey]
  );

  return { cancelBounty, loading, error };
}
