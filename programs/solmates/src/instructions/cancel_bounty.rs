use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::errors::SolmatesError;
use crate::events::BountyCancelled;
use crate::states::{BountyStatus, BountyVault};

#[derive(Accounts)]
pub struct CancelBounty<'info> {
    #[account(mut)]
    pub issuer: Signer<'info>,

    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        seeds = [b"bounty", issuer.key().as_ref()],
        bump = bounty.bump,
        has_one = issuer,
        has_one = mint,
        close = issuer
    )]
    pub bounty: Account<'info, BountyVault>,

    #[account(
        mut,
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
}

pub fn handler(ctx: Context<CancelBounty>) -> Result<()> {
    let bounty = &ctx.accounts.bounty;

    require!(
        bounty.status == BountyStatus::Open,
        SolmatesError::BountyNotOpen
    );

    // Transfer USDC from bounty vault back to issuer
    let issuer_key = bounty.issuer;
    let seeds = &[b"bounty", issuer_key.as_ref(), &[bounty.bump]];
    let signer_seeds = &[&seeds[..]];

    let transfer_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.bounty_vault.to_account_info(),
            to: ctx.accounts.issuer_token_account.to_account_info(),
            authority: ctx.accounts.bounty.to_account_info(),
        },
        signer_seeds,
    );
    token::transfer(transfer_ctx, bounty.reward_amount)?;

    emit!(BountyCancelled {
        issuer: bounty.issuer,
        amount: bounty.reward_amount,
    });

    // Account will be closed, rent returned to issuer

    Ok(())
}
