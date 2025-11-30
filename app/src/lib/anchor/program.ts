/* eslint-disable @typescript-eslint/no-explicit-any */
import { Program, AnchorProvider, BN, Idl } from "@coral-xyz/anchor";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import {
  connection as defaultConnection,
  USDC_MINT,
  getProfilePda,
  getEscrowPda,
  getAuctionPda,
  getBountyPda,
} from "../constants";
import type {
  UserProfile,
  MessageEscrow,
  DateAuction,
  BountyVault,
} from "./types";

// Import IDL
import idlJson from "./idl.json";

// Type assertion for IDL
const IDL = idlJson as Idl;

export type SolmatesProgram = Program<Idl>;

// Create program instance
export function getProgram(
  wallet: AnchorWallet,
  connection: Connection = defaultConnection
): SolmatesProgram {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  return new Program(IDL, provider);
}

// Get provider without full wallet (for read-only operations)
export function getReadOnlyProgram(
  connection: Connection = defaultConnection
): SolmatesProgram {
  // Create a minimal provider for read-only access
  const provider = {
    connection,
    publicKey: null,
  } as unknown as AnchorProvider;
  return new Program(IDL, provider);
}

// ============================================
// Account Fetching
// ============================================

export async function fetchUserProfile(
  program: SolmatesProgram,
  authority: PublicKey
): Promise<UserProfile | null> {
  const [profilePda] = getProfilePda(authority);
  try {
    const account = await (program.account as any).userProfile.fetch(profilePda);
    return account as UserProfile;
  } catch {
    return null;
  }
}

export async function fetchMessageEscrow(
  program: SolmatesProgram,
  sender: PublicKey,
  recipient: PublicKey
): Promise<MessageEscrow | null> {
  const [escrowPda] = getEscrowPda(sender, recipient);
  try {
    const account = await (program.account as any).messageEscrow.fetch(escrowPda);
    return account as MessageEscrow;
  } catch {
    return null;
  }
}

export async function fetchDateAuction(
  program: SolmatesProgram,
  host: PublicKey,
  auctionId: number
): Promise<DateAuction | null> {
  const [auctionPda] = getAuctionPda(host, auctionId);
  try {
    const account = await (program.account as any).dateAuction.fetch(auctionPda);
    return account as DateAuction;
  } catch {
    return null;
  }
}

export async function fetchBountyVault(
  program: SolmatesProgram,
  issuer: PublicKey
): Promise<BountyVault | null> {
  const [bountyPda] = getBountyPda(issuer);
  try {
    const account = await (program.account as any).bountyVault.fetch(bountyPda);
    return account as BountyVault;
  } catch {
    return null;
  }
}

// Fetch all accounts of a type
export async function fetchAllUserProfiles(
  program: SolmatesProgram
): Promise<{ publicKey: PublicKey; account: UserProfile }[]> {
  const accounts = await (program.account as any).userProfile.all();
  return accounts.map((a: any) => ({
    publicKey: a.publicKey,
    account: a.account as UserProfile,
  }));
}

export async function fetchAllAuctions(
  program: SolmatesProgram
): Promise<{ publicKey: PublicKey; account: DateAuction }[]> {
  const accounts = await (program.account as any).dateAuction.all();
  return accounts.map((a: any) => ({
    publicKey: a.publicKey,
    account: a.account as DateAuction,
  }));
}

export async function fetchAllBounties(
  program: SolmatesProgram
): Promise<{ publicKey: PublicKey; account: BountyVault }[]> {
  const accounts = await (program.account as any).bountyVault.all();
  return accounts.map((a: any) => ({
    publicKey: a.publicKey,
    account: a.account as BountyVault,
  }));
}

export async function fetchAllEscrows(
  program: SolmatesProgram
): Promise<{ publicKey: PublicKey; account: MessageEscrow }[]> {
  const accounts = await (program.account as any).messageEscrow.all();
  return accounts.map((a: any) => ({
    publicKey: a.publicKey,
    account: a.account as MessageEscrow,
  }));
}

// ============================================
// Profile Instructions
// ============================================

export async function createProfile(
  program: SolmatesProgram,
  authority: PublicKey,
  dmPrice: number,
  assetGateMint: PublicKey | null = null,
  minAssetAmount: number = 0
): Promise<string> {
  const [profilePda] = getProfilePda(authority);

  try {
    const tx = await (program.methods as any)
      .createProfile(new BN(dmPrice), assetGateMint, new BN(minAssetAmount))
      .accounts({
        authority,
        profile: profilePda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  } catch (error: any) {
    // Log full error for debugging
    console.error("createProfile error:", {
      message: error.message,
      logs: error.logs,
      error: error,
    });
    throw error;
  }
}

export async function updateProfile(
  program: SolmatesProgram,
  authority: PublicKey,
  dmPrice: number | null = null,
  assetGateMint: PublicKey | null | undefined = undefined,
  minAssetAmount: number | null = null
): Promise<string> {
  const [profilePda] = getProfilePda(authority);

  const tx = await (program.methods as any)
    .updateProfile(
      dmPrice !== null ? new BN(dmPrice) : null,
      assetGateMint !== undefined ? assetGateMint : null,
      minAssetAmount !== null ? new BN(minAssetAmount) : null
    )
    .accounts({
      authority,
      profile: profilePda,
    })
    .rpc();

  return tx;
}

// ============================================
// DM Escrow Instructions
// ============================================

export async function depositForDm(
  program: SolmatesProgram,
  sender: PublicKey,
  recipient: PublicKey,
  amount: number,
  mint: PublicKey = USDC_MINT,
  senderGateTokenAccount?: PublicKey
): Promise<string> {
  const [recipientProfile] = getProfilePda(recipient);
  const [escrowPda] = getEscrowPda(sender, recipient);

  const senderTokenAccount = getAssociatedTokenAddressSync(mint, sender);
  const escrowVault = getAssociatedTokenAddressSync(mint, escrowPda, true);

  const tx = await (program.methods as any)
    .depositForDm(new BN(amount))
    .accounts({
      sender,
      recipient,
      recipientProfile,
      mint,
      senderTokenAccount,
      senderGateTokenAccount: senderGateTokenAccount || null,
      escrow: escrowPda,
      escrowVault,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return tx;
}

export async function acceptDm(
  program: SolmatesProgram,
  sender: PublicKey,
  recipient: PublicKey,
  mint: PublicKey = USDC_MINT
): Promise<string> {
  const [escrowPda] = getEscrowPda(sender, recipient);
  const escrowVault = getAssociatedTokenAddressSync(mint, escrowPda, true);
  const recipientTokenAccount = getAssociatedTokenAddressSync(mint, recipient);

  const tx = await (program.methods as any)
    .acceptDm()
    .accounts({
      sender,
      recipient,
      mint,
      escrow: escrowPda,
      escrowVault,
      recipientTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return tx;
}

export async function refundDm(
  program: SolmatesProgram,
  sender: PublicKey,
  recipient: PublicKey,
  mint: PublicKey = USDC_MINT
): Promise<string> {
  const [escrowPda] = getEscrowPda(sender, recipient);
  const escrowVault = getAssociatedTokenAddressSync(mint, escrowPda, true);
  const senderTokenAccount = getAssociatedTokenAddressSync(mint, sender);

  const tx = await (program.methods as any)
    .refundDm()
    .accounts({
      sender,
      recipient,
      mint,
      escrow: escrowPda,
      escrowVault,
      senderTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();

  return tx;
}

// ============================================
// Auction Instructions
// ============================================

export async function createAuction(
  program: SolmatesProgram,
  host: PublicKey,
  startPrice: number,
  durationSecs: number,
  mint: PublicKey = USDC_MINT
): Promise<string> {
  const [hostProfile] = getProfilePda(host);

  // Need to fetch the current auction count to derive the correct PDA
  const profile = await fetchUserProfile(program, host);
  const auctionId = profile ? profile.auctionCount.toNumber() : 0;
  const [auctionPda] = getAuctionPda(host, auctionId);
  const auctionVault = getAssociatedTokenAddressSync(mint, auctionPda, true);

  const tx = await (program.methods as any)
    .createAuction(new BN(startPrice), new BN(durationSecs))
    .accounts({
      host,
      hostProfile,
      mint,
      auction: auctionPda,
      auctionVault,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return tx;
}

export async function placeBid(
  program: SolmatesProgram,
  bidder: PublicKey,
  host: PublicKey,
  auctionId: number,
  bidAmount: number,
  previousBidder: PublicKey,
  mint: PublicKey = USDC_MINT
): Promise<string> {
  const [auctionPda] = getAuctionPda(host, auctionId);
  const auctionVault = getAssociatedTokenAddressSync(mint, auctionPda, true);
  const bidderTokenAccount = getAssociatedTokenAddressSync(mint, bidder);
  const previousBidderTokenAccount = getAssociatedTokenAddressSync(
    mint,
    previousBidder
  );

  const tx = await (program.methods as any)
    .placeBid(new BN(bidAmount))
    .accounts({
      bidder,
      previousBidder,
      host,
      mint,
      auction: auctionPda,
      auctionVault,
      bidderTokenAccount,
      previousBidderTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();

  return tx;
}

export async function claimAuction(
  program: SolmatesProgram,
  host: PublicKey,
  auctionId: number,
  mint: PublicKey = USDC_MINT
): Promise<string> {
  const [auctionPda] = getAuctionPda(host, auctionId);
  const auctionVault = getAssociatedTokenAddressSync(mint, auctionPda, true);
  const hostTokenAccount = getAssociatedTokenAddressSync(mint, host);

  const tx = await (program.methods as any)
    .claimAuction()
    .accounts({
      host,
      mint,
      auction: auctionPda,
      auctionVault,
      hostTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return tx;
}

// ============================================
// Bounty Instructions
// ============================================

export async function createBounty(
  program: SolmatesProgram,
  issuer: PublicKey,
  rewardAmount: number,
  mint: PublicKey = USDC_MINT
): Promise<string> {
  const [bountyPda] = getBountyPda(issuer);
  const bountyVault = getAssociatedTokenAddressSync(mint, bountyPda, true);
  const issuerTokenAccount = getAssociatedTokenAddressSync(mint, issuer);

  const tx = await (program.methods as any)
    .createBounty(new BN(rewardAmount))
    .accounts({
      issuer,
      mint,
      bounty: bountyPda,
      bountyVault,
      issuerTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return tx;
}

export async function updateBounty(
  program: SolmatesProgram,
  issuer: PublicKey,
  newAmount: number,
  mint: PublicKey = USDC_MINT
): Promise<string> {
  const [bountyPda] = getBountyPda(issuer);
  const bountyVault = getAssociatedTokenAddressSync(mint, bountyPda, true);
  const issuerTokenAccount = getAssociatedTokenAddressSync(mint, issuer);

  const tx = await (program.methods as any)
    .updateBounty(new BN(newAmount))
    .accounts({
      issuer,
      mint,
      bounty: bountyPda,
      bountyVault,
      issuerTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();

  return tx;
}

export async function payoutReferral(
  program: SolmatesProgram,
  issuer: PublicKey,
  matchmaker: PublicKey,
  mint: PublicKey = USDC_MINT
): Promise<string> {
  const [bountyPda] = getBountyPda(issuer);
  const bountyVault = getAssociatedTokenAddressSync(mint, bountyPda, true);
  const matchmakerTokenAccount = getAssociatedTokenAddressSync(mint, matchmaker);

  const tx = await (program.methods as any)
    .payoutReferral()
    .accounts({
      issuer,
      matchmaker,
      mint,
      bounty: bountyPda,
      bountyVault,
      matchmakerTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return tx;
}

export async function cancelBounty(
  program: SolmatesProgram,
  issuer: PublicKey,
  mint: PublicKey = USDC_MINT
): Promise<string> {
  const [bountyPda] = getBountyPda(issuer);
  const bountyVault = getAssociatedTokenAddressSync(mint, bountyPda, true);
  const issuerTokenAccount = getAssociatedTokenAddressSync(mint, issuer);

  const tx = await (program.methods as any)
    .cancelBounty()
    .accounts({
      issuer,
      mint,
      bounty: bountyPda,
      bountyVault,
      issuerTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();

  return tx;
}
