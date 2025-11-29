use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};

use crate::events::BountyCreated;
use crate::states::{BountyStatus, BountyVault};

#[derive(Accounts)]
pub struct CreateBounty<'info> {
    #[account(mut)]
    pub issuer: Signer<'info>,

    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer = issuer,
        space = 8 + BountyVault::INIT_SPACE,
        seeds = [b"bounty", issuer.key().as_ref()],
        bump
    )]
    pub bounty: Account<'info, BountyVault>,

    #[account(
        init,
        payer = issuer,
        associated_token::mint = mint,
        associated_token::authority = bounty
    )]
    pub bounty_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = issuer
    )]
    pub issuer_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreateBounty>, reward_amount: u64) -> Result<()> {
    let bounty = &mut ctx.accounts.bounty;

    bounty.issuer = ctx.accounts.issuer.key();
    bounty.mint = ctx.accounts.mint.key();
    bounty.reward_amount = reward_amount;
    bounty.status = BountyStatus::Open;
    bounty.bump = ctx.bumps.bounty;

    // Transfer USDC from issuer to bounty vault
    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.issuer_token_account.to_account_info(),
            to: ctx.accounts.bounty_vault.to_account_info(),
            authority: ctx.accounts.issuer.to_account_info(),
        },
    );
    token::transfer(transfer_ctx, reward_amount)?;

    emit!(BountyCreated {
        issuer: bounty.issuer,
        reward_amount,
    });

    Ok(())
}
