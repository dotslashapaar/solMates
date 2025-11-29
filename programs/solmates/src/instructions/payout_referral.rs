use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};

use crate::errors::SolmatesError;
use crate::events::BountyPaid;
use crate::states::{BountyStatus, BountyVault};

#[derive(Accounts)]
pub struct PayoutReferral<'info> {
    #[account(mut)]
    pub issuer: Signer<'info>,

    /// CHECK: Matchmaker wallet - receives payout
    pub matchmaker: UncheckedAccount<'info>,

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
        init_if_needed,
        payer = issuer,
        associated_token::mint = mint,
        associated_token::authority = matchmaker
    )]
    pub matchmaker_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<PayoutReferral>) -> Result<()> {
    let bounty = &ctx.accounts.bounty;

    require!(
        bounty.status == BountyStatus::Open,
        SolmatesError::BountyNotOpen
    );

    // Copy values before CPI
    let issuer_key = bounty.issuer;
    let bump = bounty.bump;
    let amount = bounty.reward_amount;

    // Transfer USDC from bounty vault to matchmaker
    let seeds = &[b"bounty", issuer_key.as_ref(), &[bump]];
    let signer_seeds = &[&seeds[..]];

    let transfer_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.bounty_vault.to_account_info(),
            to: ctx.accounts.matchmaker_token_account.to_account_info(),
            authority: ctx.accounts.bounty.to_account_info(),
        },
        signer_seeds,
    );
    token::transfer(transfer_ctx, amount)?;

    // Update state after CPI
    let bounty = &mut ctx.accounts.bounty;
    bounty.status = BountyStatus::Filled;

    emit!(BountyPaid {
        issuer: issuer_key,
        matchmaker: ctx.accounts.matchmaker.key(),
        amount,
    });

    // Account will be closed, rent returned to issuer

    Ok(())
}
