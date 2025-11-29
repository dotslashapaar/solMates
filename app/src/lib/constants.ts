import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";

// Program ID deployed on devnet
export const PROGRAM_ID = new PublicKey(
  "4G4MoTN3yYJbCWSHQtKoKK645xrbw2C3yDiy52n8rSrb"
);

// Devnet USDC mint (for testing, we use a custom mint)
// In production, use: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
export const USDC_MINT = new PublicKey(
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
);

// QuickNode RPC endpoint
export const RPC_ENDPOINT =
  "https://maximum-still-log.solana-devnet.quiknode.pro/e0716206b9d90e6686d589a0431c14adfcd066f7/";

// Create connection
export const connection = new Connection(RPC_ENDPOINT, "confirmed");

// PDA seeds
export const PROFILE_SEED = "profile";
export const ESCROW_SEED = "escrow";
export const AUCTION_SEED = "auction";
export const BOUNTY_SEED = "bounty";

// Derive PDAs
export function getProfilePda(authority: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(PROFILE_SEED), authority.toBuffer()],
    PROGRAM_ID
  );
}

export function getEscrowPda(
  sender: PublicKey,
  recipient: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(ESCROW_SEED), sender.toBuffer(), recipient.toBuffer()],
    PROGRAM_ID
  );
}

export function getAuctionPda(
  host: PublicKey,
  auctionId: number
): [PublicKey, number] {
  const idBuffer = Buffer.alloc(8);
  idBuffer.writeBigUInt64LE(BigInt(auctionId));
  return PublicKey.findProgramAddressSync(
    [Buffer.from(AUCTION_SEED), host.toBuffer(), idBuffer],
    PROGRAM_ID
  );
}

export function getBountyPda(issuer: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(BOUNTY_SEED), issuer.toBuffer()],
    PROGRAM_ID
  );
}

// Format USDC amount (6 decimals)
export function formatUsdc(amount: number | bigint): string {
  const num = typeof amount === "bigint" ? Number(amount) : amount;
  return (num / 1_000_000).toFixed(2);
}

// Parse USDC amount to lamports
export function parseUsdc(amount: string | number): number {
  return Math.floor(Number(amount) * 1_000_000);
}

// Shorten address
export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
