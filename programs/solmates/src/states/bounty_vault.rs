use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct BountyVault {
    pub issuer: Pubkey,
    pub mint: Pubkey,
    pub reward_amount: u64,
    pub status: BountyStatus,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum BountyStatus {
    Open,
    Filled,
}
