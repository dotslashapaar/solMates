use anchor_lang::prelude::*;

pub mod errors;
pub mod events;
pub mod instructions;
pub mod states;

use instructions::*;

declare_id!("4G4MoTN3yYJbCWSHQtKoKK645xrbw2C3yDiy52n8rSrb");

// ============================================================================
// CONSTANTS
// ============================================================================

pub const ESCROW_DURATION: i64 = 172800; // 48 hours in seconds (48 * 60 * 60)
pub const SNIPE_THRESHOLD: i64 = 300; // 5 minutes in seconds (5 * 60)
pub const SNIPE_EXTENSION: i64 = 300; // 5 minutes extension (5 * 60)

// ============================================================================
// PROGRAM
// ============================================================================

#[program]
pub mod solmates {
    use super::*;

    // ------------------------------------------------------------------------
    // PROFILE INSTRUCTIONS
    // ------------------------------------------------------------------------

    pub fn create_profile(
        ctx: Context<CreateProfile>,
        dm_price: u64,
        asset_gate_mint: Option<Pubkey>,
        min_asset_amount: u64,
    ) -> Result<()> {
        instructions::create_profile::handler(ctx, dm_price, asset_gate_mint, min_asset_amount)
    }

    pub fn update_profile(
        ctx: Context<UpdateProfile>,
        dm_price: Option<u64>,
        asset_gate_mint: Option<Option<Pubkey>>,
        min_asset_amount: Option<u64>,
    ) -> Result<()> {
        instructions::update_profile::handler(ctx, dm_price, asset_gate_mint, min_asset_amount)
    }

    // ------------------------------------------------------------------------
    // ESCROW DM INSTRUCTIONS
    // ------------------------------------------------------------------------

    pub fn deposit_for_dm(ctx: Context<DepositForDm>, amount: u64) -> Result<()> {
        instructions::deposit_for_dm::handler(ctx, amount)
    }

    pub fn accept_dm(ctx: Context<AcceptDm>) -> Result<()> {
        instructions::accept_dm::handler(ctx)
    }

    pub fn refund_dm(ctx: Context<RefundDm>) -> Result<()> {
        instructions::refund_dm::handler(ctx)
    }

    // ------------------------------------------------------------------------
    // AUCTION INSTRUCTIONS
    // ------------------------------------------------------------------------

    pub fn create_auction(
        ctx: Context<CreateAuction>,
        start_price: u64,
        duration_secs: i64,
    ) -> Result<()> {
        instructions::create_auction::handler(ctx, start_price, duration_secs)
    }

    pub fn place_bid(ctx: Context<PlaceBid>, bid_amount: u64) -> Result<()> {
        instructions::place_bid::handler(ctx, bid_amount)
    }

    pub fn claim_auction(ctx: Context<ClaimAuction>) -> Result<()> {
        instructions::claim_auction::handler(ctx)
    }

    // ------------------------------------------------------------------------
    // BOUNTY INSTRUCTIONS
    // ------------------------------------------------------------------------

    pub fn create_bounty(ctx: Context<CreateBounty>, reward_amount: u64) -> Result<()> {
        instructions::create_bounty::handler(ctx, reward_amount)
    }

    pub fn update_bounty(ctx: Context<UpdateBounty>, new_amount: u64) -> Result<()> {
        instructions::update_bounty::handler(ctx, new_amount)
    }

    pub fn payout_referral(ctx: Context<PayoutReferral>) -> Result<()> {
        instructions::payout_referral::handler(ctx)
    }

    pub fn cancel_bounty(ctx: Context<CancelBounty>) -> Result<()> {
        instructions::cancel_bounty::handler(ctx)
    }
}
