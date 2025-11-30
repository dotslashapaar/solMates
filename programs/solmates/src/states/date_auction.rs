use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct DateAuction {
    pub host: Pubkey,
    pub auction_id: u64,
    pub mint: Pubkey,
    pub highest_bidder: Pubkey,
    pub highest_bid: u64,
    pub end_time: i64,
    pub total_extended: i64,  // Track total extension time for snipe protection cap
    pub bump: u8,
}
