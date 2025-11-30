use anchor_lang::prelude::*;

#[event]
pub struct ProfileCreated {
    pub authority: Pubkey,
    pub dm_price: u64,
}

#[event]
pub struct ProfileUpdated {
    pub authority: Pubkey,
    pub dm_price: u64,
}

#[event]
pub struct EscrowCreated {
    pub sender: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub expiry: i64,
}

#[event]
pub struct EscrowAccepted {
    pub sender: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub fee: u64,
}

#[event]
pub struct EscrowRefunded {
    pub sender: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
}

#[event]
pub struct AuctionCreated {
    pub host: Pubkey,
    pub auction_id: u64,
    pub start_price: u64,
    pub end_time: i64,
}

#[event]
pub struct BidPlaced {
    pub auction_id: u64,
    pub bidder: Pubkey,
    pub amount: u64,
    pub previous_bidder: Pubkey,
    pub new_end_time: i64,
}

#[event]
pub struct AuctionCancelled {
    pub host: Pubkey,
    pub auction_id: u64,
}

#[event]
pub struct AuctionClaimed {
    pub auction_id: u64,
    pub host: Pubkey,
    pub winner: Pubkey,
    pub amount: u64,
    pub fee: u64,
}

#[event]
pub struct BountyCreated {
    pub issuer: Pubkey,
    pub reward_amount: u64,
}

#[event]
pub struct BountyUpdated {
    pub issuer: Pubkey,
    pub new_amount: u64,
}

#[event]
pub struct BountyPaid {
    pub issuer: Pubkey,
    pub matchmaker: Pubkey,
    pub amount: u64,
    pub fee: u64,
}

#[event]
pub struct BountyCancelled {
    pub issuer: Pubkey,
    pub amount: u64,
}
