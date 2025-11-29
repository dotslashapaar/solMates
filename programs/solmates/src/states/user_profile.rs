use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct UserProfile {
    pub authority: Pubkey,
    pub dm_price: u64,
    pub asset_gate_mint: Option<Pubkey>,
    pub min_asset_amount: u64,
    pub auction_count: u64,
    pub bump: u8,
}
