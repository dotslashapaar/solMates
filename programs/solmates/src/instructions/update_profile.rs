use anchor_lang::prelude::*;

use crate::events::ProfileUpdated;
use crate::states::UserProfile;

#[derive(Accounts)]
pub struct UpdateProfile<'info> {
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"profile", authority.key().as_ref()],
        bump = profile.bump,
        has_one = authority
    )]
    pub profile: Account<'info, UserProfile>,
}

pub fn handler(
    ctx: Context<UpdateProfile>,
    dm_price: Option<u64>,
    asset_gate_mint: Option<Option<Pubkey>>,
    min_asset_amount: Option<u64>,
) -> Result<()> {
    let profile = &mut ctx.accounts.profile;

    if let Some(price) = dm_price {
        profile.dm_price = price;
    }
    if let Some(gate) = asset_gate_mint {
        profile.asset_gate_mint = gate;
    }
    if let Some(amount) = min_asset_amount {
        profile.min_asset_amount = amount;
    }

    emit!(ProfileUpdated {
        authority: profile.authority,
        dm_price: profile.dm_price,
    });

    Ok(())
}
