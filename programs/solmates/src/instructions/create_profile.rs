use anchor_lang::prelude::*;

use crate::events::ProfileCreated;
use crate::states::UserProfile;

#[derive(Accounts)]
pub struct CreateProfile<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + UserProfile::INIT_SPACE,
        seeds = [b"profile", authority.key().as_ref()],
        bump
    )]
    pub profile: Account<'info, UserProfile>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateProfile>,
    dm_price: u64,
    asset_gate_mint: Option<Pubkey>,
    min_asset_amount: u64,
) -> Result<()> {
    let profile = &mut ctx.accounts.profile;
    profile.authority = ctx.accounts.authority.key();
    profile.dm_price = dm_price;
    profile.asset_gate_mint = asset_gate_mint;
    profile.min_asset_amount = min_asset_amount;
    profile.auction_count = 0;
    profile.bump = ctx.bumps.profile;

    emit!(ProfileCreated {
        authority: profile.authority,
        dm_price,
    });

    Ok(())
}
