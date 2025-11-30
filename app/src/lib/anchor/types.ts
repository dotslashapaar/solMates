import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

// On-chain account types
export interface UserProfile {
  authority: PublicKey;
  dmPrice: BN;
  assetGateMint: PublicKey | null;
  minAssetAmount: BN;
  auctionCount: BN;
  bump: number;
}

export interface MessageEscrow {
  sender: PublicKey;
  recipient: PublicKey;
  mint: PublicKey;
  amount: BN;
  expiry: BN;
  status: EscrowStatus;
  bump: number;
}

export interface DateAuction {
  host: PublicKey;
  auctionId: BN;
  mint: PublicKey;
  highestBidder: PublicKey;
  highestBid: BN;
  endTime: BN;
  bump: number;
}

export interface BountyVault {
  issuer: PublicKey;
  mint: PublicKey;
  rewardAmount: BN;
  status: BountyStatus;
  bump: number;
}

// Enum types
export type EscrowStatus =
  | { pending: Record<string, never> }
  | { accepted: Record<string, never> }
  | { refunded: Record<string, never> };

export type BountyStatus =
  | { open: Record<string, never> }
  | { filled: Record<string, never> };

// Helper functions for status checks
export function isEscrowPending(status: EscrowStatus): boolean {
  return "pending" in status;
}

export function isEscrowAccepted(status: EscrowStatus): boolean {
  return "accepted" in status;
}

export function isEscrowRefunded(status: EscrowStatus): boolean {
  return "refunded" in status;
}

export function isBountyOpen(status: BountyStatus): boolean {
  return "open" in status;
}

export function isBountyFilled(status: BountyStatus): boolean {
  return "filled" in status;
}

// IDL type for Anchor
export type SolmatesIDL = {
  address: string;
  metadata: {
    name: string;
    version: string;
    spec: string;
    description: string;
  };
  instructions: unknown[];
  accounts: unknown[];
  types: unknown[];
  errors: unknown[];
};
