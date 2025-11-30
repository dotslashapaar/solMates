import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

// Program ID deployed on devnet
export const PROGRAM_ID = new PublicKey(
  "4G4MoTN3yYJbCWSHQtKoKK645xrbw2C3yDiy52n8rSrb"
);

// Devnet USDC mint (for testing, we use a custom mint)
// In production, use: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
export const USDC_MINT = new PublicKey(
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
);

// Platform treasury for 1% fees
export const TREASURY = new PublicKey(
  "2CquYcQoBGv8MiiMfP3Lgut79oLCtDbCTrB6fnQm1WeG"
);

// RPC endpoint from environment variable, with fallback to devnet
export const RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl("devnet");

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

// Get USDC balance for a wallet
export async function getUsdcBalance(
  connection: Connection,
  wallet: PublicKey
): Promise<number> {
  try {
    const ata = getAssociatedTokenAddressSync(USDC_MINT, wallet);
    const account = await connection.getTokenAccountBalance(ata);
    return parseInt(account.value.amount);
  } catch {
    return 0;
  }
}

// Gender-based avatar URL using DiceBear avataaars with gender-appropriate options
export type GenderForAvatar = "male" | "female" | "non-binary" | "other" | undefined;

// Hair styles categorized by typical gender presentation (DiceBear v9.x avataaars)
// Male-presenting: shorter styles
const MALE_HAIR_STYLES = [
  "shaggy",         // Shaggy short hair
  "shaggyMullet",   // Mullet style
  "frizzle",        // Frizzle style  
  "dreads01",       // Short dreads
  "dreads02",       // Short dreads variant
  "fro",            // Afro
  "froBand",        // Afro with headband
  "hat",            // Wearing a hat
];

// Female-presenting: longer styles  
const FEMALE_HAIR_STYLES = [
  "bigHair",           // Big voluminous hair
  "bob",               // Bob cut
  "bun",               // Hair bun
  "curly",             // Curly long hair
  "curvy",             // Curvy/wavy hair
  "dreads",            // Long dreads
  "frida",             // Frida Kahlo style
  "longButNotTooLong", // Medium length
  "miaWallace",        // Mia Wallace bob
  "hijab",             // Hijab
];

// Neutral: mix of versatile styles
const NEUTRAL_HAIR_STYLES = [
  "shaggy",
  "bob",
  "curly", 
  "curvy",
  "longButNotTooLong",
  "fro",
  "froBand",
  "dreads",
];

// Clothing options
const MALE_CLOTHING = [
  "blazerAndShirt",
  "blazerAndSweater",
  "collarAndSweater",
  "hoodie",
  "shirtCrewNeck",
  "shirtScoopNeck",
  "shirtVNeck",
];

const FEMALE_CLOTHING = [
  "blazerAndShirt",
  "blazerAndSweater",
  "collarAndSweater",
  "hoodie",
  "overall",
  "shirtCrewNeck",
  "shirtScoopNeck",
  "shirtVNeck",
];

// Simple hash function to get deterministic index from seed
function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Pick item from array based on seed
function pickFromSeed<T>(arr: T[], seed: string, offset = 0): T {
  const hash = hashSeed(seed + offset.toString());
  return arr[hash % arr.length];
}

export function getGenderAvatar(seed: string, gender?: GenderForAvatar): string {
  const encodedSeed = encodeURIComponent(seed);
  const hash = hashSeed(seed);
  
  // Base URL with common parameters
  const baseUrl = "https://api.dicebear.com/9.x/avataaars/svg";
  const params = new URLSearchParams();
  params.set("seed", encodedSeed);
  
  // Gender-specific configurations
  switch (gender) {
    case "male": {
      // Male: short hair, possible facial hair, masculine presentation
      const hairStyle = pickFromSeed(MALE_HAIR_STYLES, seed, 1);
      const clothing = pickFromSeed(MALE_CLOTHING, seed, 2);
      
      params.set("top", hairStyle);
      params.set("clothing", clothing);
      params.set("facialHairProbability", "40");
      params.set("accessoriesProbability", "20");
      params.set("backgroundColor", "b6e3f4"); // Light blue
      break;
    }
    
    case "female": {
      // Female: long hair, no facial hair, feminine presentation
      const hairStyle = pickFromSeed(FEMALE_HAIR_STYLES, seed, 1);
      const clothing = pickFromSeed(FEMALE_CLOTHING, seed, 2);
      
      params.set("top", hairStyle);
      params.set("clothing", clothing);
      params.set("facialHairProbability", "0");
      params.set("accessoriesProbability", "30");
      params.set("backgroundColor", "ffd5dc"); // Light pink
      break;
    }
    
    case "non-binary": {
      // Non-binary: mix of styles, low facial hair probability
      const hairStyle = pickFromSeed(NEUTRAL_HAIR_STYLES, seed, 1);
      const clothing = pickFromSeed([...MALE_CLOTHING, ...FEMALE_CLOTHING], seed, 2);
      
      params.set("top", hairStyle);
      params.set("clothing", clothing);
      params.set("facialHairProbability", "15");
      params.set("accessoriesProbability", "25");
      params.set("backgroundColor", "c0aede"); // Light purple
      break;
    }
    
    case "other":
    default: {
      // Other/default: variety of styles
      const allHair = [...MALE_HAIR_STYLES, ...FEMALE_HAIR_STYLES];
      const hairStyle = pickFromSeed(allHair, seed, 1);
      const clothing = pickFromSeed([...MALE_CLOTHING, ...FEMALE_CLOTHING], seed, 2);
      
      params.set("top", hairStyle);
      params.set("clothing", clothing);
      params.set("facialHairProbability", "20");
      params.set("accessoriesProbability", "25");
      params.set("backgroundColor", "d1d4f9"); // Light lavender
      break;
    }
  }
  
  return `${baseUrl}?${params.toString()}`;
}
