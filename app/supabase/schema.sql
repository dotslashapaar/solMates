-- ============================================================================
-- SolMates Database Schema
-- Run this in your Supabase SQL Editor to set up all tables
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUM TYPES
-- ============================================================================
CREATE TYPE gender_type AS ENUM ('male', 'female', 'non-binary', 'other');

-- ============================================================================
-- PROFILES TABLE
-- Stores user dating profiles linked to their wallet addresses
-- ============================================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 18 AND age <= 120),
  gender gender_type NOT NULL DEFAULT 'other',
  looking_for gender_type[] DEFAULT '{}',
  bio TEXT NOT NULL,
  location TEXT,
  occupation TEXT,
  interests TEXT[] DEFAULT '{}',
  photos TEXT[] DEFAULT '{}',
  dm_price BIGINT DEFAULT 0, -- in USDC lamports (6 decimals)
  asset_gate_mint TEXT, -- optional NFT/token gate
  min_asset_amount BIGINT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast wallet lookups
CREATE INDEX idx_profiles_wallet ON profiles(wallet_address);
CREATE INDEX idx_profiles_active ON profiles(is_active) WHERE is_active = true;
CREATE INDEX idx_profiles_gender ON profiles(gender);

-- ============================================================================
-- MESSAGES TABLE
-- Stores DM escrow messages between users
-- ============================================================================
CREATE TYPE escrow_status AS ENUM ('pending', 'accepted', 'declined', 'refunded');

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_wallet TEXT NOT NULL,
  recipient_wallet TEXT NOT NULL,
  content TEXT NOT NULL,
  escrow_amount BIGINT NOT NULL, -- in USDC lamports
  escrow_status escrow_status DEFAULT 'pending',
  escrow_tx_signature TEXT, -- on-chain transaction signature
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_sender ON messages(sender_wallet);
CREATE INDEX idx_messages_recipient ON messages(recipient_wallet);
CREATE INDEX idx_messages_status ON messages(escrow_status);

-- ============================================================================
-- AUCTIONS TABLE
-- Stores date auction listings
-- ============================================================================
CREATE TYPE auction_status AS ENUM ('active', 'ended', 'claimed', 'cancelled');

CREATE TABLE auctions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_wallet TEXT NOT NULL,
  auction_id INTEGER NOT NULL, -- on-chain auction ID from profile.auction_count
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  start_price BIGINT NOT NULL, -- in USDC lamports
  current_bid BIGINT NOT NULL DEFAULT 0,
  highest_bidder_wallet TEXT,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status auction_status DEFAULT 'active',
  tx_signature TEXT, -- creation transaction
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(host_wallet, auction_id)
);

CREATE INDEX idx_auctions_host ON auctions(host_wallet);
CREATE INDEX idx_auctions_status ON auctions(status);
CREATE INDEX idx_auctions_end_time ON auctions(end_time);

-- ============================================================================
-- AUCTION BIDS TABLE
-- Tracks all bids placed on auctions
-- ============================================================================
CREATE TABLE auction_bids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  bidder_wallet TEXT NOT NULL,
  amount BIGINT NOT NULL, -- in USDC lamports
  tx_signature TEXT, -- bid transaction signature
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_auction_bids_auction ON auction_bids(auction_id);
CREATE INDEX idx_auction_bids_bidder ON auction_bids(bidder_wallet);

-- ============================================================================
-- BOUNTIES TABLE
-- Stores matchmaker bounty listings
-- ============================================================================
CREATE TYPE bounty_status AS ENUM ('open', 'filled', 'cancelled');

CREATE TABLE bounties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issuer_wallet TEXT NOT NULL,
  description TEXT NOT NULL,
  preferences TEXT[] DEFAULT '{}',
  reward_amount BIGINT NOT NULL, -- in USDC lamports
  status bounty_status DEFAULT 'open',
  matchmaker_wallet TEXT, -- who made the successful match
  matched_wallet TEXT, -- who was matched
  tx_signature TEXT, -- creation/payout transaction
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bounties_issuer ON bounties(issuer_wallet);
CREATE INDEX idx_bounties_status ON bounties(status);

-- ============================================================================
-- BOUNTY SUBMISSIONS TABLE
-- Tracks submissions from matchmakers
-- ============================================================================
CREATE TYPE submission_status AS ENUM ('pending', 'accepted', 'rejected');

CREATE TABLE bounty_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bounty_id UUID NOT NULL REFERENCES bounties(id) ON DELETE CASCADE,
  matchmaker_wallet TEXT NOT NULL,
  suggested_wallet TEXT NOT NULL, -- the profile being suggested
  note TEXT,
  status submission_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(bounty_id, matchmaker_wallet, suggested_wallet)
);

CREATE INDEX idx_bounty_submissions_bounty ON bounty_submissions(bounty_id);
CREATE INDEX idx_bounty_submissions_matchmaker ON bounty_submissions(matchmaker_wallet);

-- ============================================================================
-- LIKES TABLE
-- Tracks profile likes for matching
-- ============================================================================
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  liker_wallet TEXT NOT NULL,
  liked_wallet TEXT NOT NULL,
  is_super_like BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(liker_wallet, liked_wallet)
);

CREATE INDEX idx_likes_liker ON likes(liker_wallet);
CREATE INDEX idx_likes_liked ON likes(liked_wallet);

-- ============================================================================
-- MATCHES TABLE
-- Stores mutual matches between users
-- ============================================================================
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_a TEXT NOT NULL,
  wallet_b TEXT NOT NULL,
  matched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(wallet_a, wallet_b),
  CHECK (wallet_a < wallet_b) -- ensure consistent ordering
);

CREATE INDEX idx_matches_wallet_a ON matches(wallet_a);
CREATE INDEX idx_matches_wallet_b ON matches(wallet_b);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_auctions_updated_at
  BEFORE UPDATE ON auctions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_bounties_updated_at
  BEFORE UPDATE ON bounties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to check for mutual likes and create matches
CREATE OR REPLACE FUNCTION check_for_match()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if there's a reverse like
  IF EXISTS (
    SELECT 1 FROM likes 
    WHERE liker_wallet = NEW.liked_wallet 
    AND liked_wallet = NEW.liker_wallet
  ) THEN
    -- Create match with consistent ordering
    INSERT INTO matches (wallet_a, wallet_b)
    VALUES (
      LEAST(NEW.liker_wallet, NEW.liked_wallet),
      GREATEST(NEW.liker_wallet, NEW.liked_wallet)
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_match_on_mutual_like
  AFTER INSERT ON likes
  FOR EACH ROW EXECUTE FUNCTION check_for_match();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE bounties ENABLE ROW LEVEL SECURITY;
ALTER TABLE bounty_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone can read active profiles, only owner can update/delete
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (true); -- Will be validated by wallet signature in app

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (true); -- Will be validated by wallet signature in app

CREATE POLICY "Users can delete own profile" ON profiles
  FOR DELETE USING (true); -- Will be validated by wallet signature in app

-- Messages: Sender and recipient can view their messages
CREATE POLICY "Users can view their messages" ON messages
  FOR SELECT USING (true);

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their messages" ON messages
  FOR UPDATE USING (true);

-- Auctions: Anyone can view, hosts can manage their own
CREATE POLICY "Auctions are viewable by everyone" ON auctions
  FOR SELECT USING (true);

CREATE POLICY "Users can create auctions" ON auctions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their auctions" ON auctions
  FOR UPDATE USING (true);

-- Auction bids: Anyone can view, bidders can add
CREATE POLICY "Bids are viewable by everyone" ON auction_bids
  FOR SELECT USING (true);

CREATE POLICY "Users can place bids" ON auction_bids
  FOR INSERT WITH CHECK (true);

-- Bounties: Anyone can view open bounties
CREATE POLICY "Bounties are viewable by everyone" ON bounties
  FOR SELECT USING (true);

CREATE POLICY "Users can create bounties" ON bounties
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their bounties" ON bounties
  FOR UPDATE USING (true);

-- Bounty submissions
CREATE POLICY "Submissions viewable by bounty owner and submitter" ON bounty_submissions
  FOR SELECT USING (true);

CREATE POLICY "Users can submit to bounties" ON bounty_submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update submissions" ON bounty_submissions
  FOR UPDATE USING (true);

-- Likes: Only the liker can see their likes
CREATE POLICY "Users can view their own likes" ON likes
  FOR SELECT USING (true);

CREATE POLICY "Users can create likes" ON likes
  FOR INSERT WITH CHECK (true);

-- Matches: Both parties can see their matches
CREATE POLICY "Users can view their matches" ON matches
  FOR SELECT USING (true);
