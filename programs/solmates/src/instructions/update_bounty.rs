use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::errors::SolmatesError;
use crate::events::BountyUpdated;
use crate::states::{BountyStatus, BountyVault};

#[derive(Accounts)]
pub struct UpdateBounty<'info> {
    #[account(mut)]
    pub issuer: Signer<'info>,

    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        seeds = [b"bounty", issuer.key().as_ref()],
        bump = bounty.bump,
        has_one = issuer,
        has_one = mint
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

pub fn handler(ctx: Context<UpdateBounty>, new_amount: u64) -> Result<()> {
    let bounty = &ctx.accounts.bounty;

    require!(
        bounty.status == BountyStatus::Open,
        SolmatesError::BountyNotOpen
    );

    let current_amount = bounty.reward_amount;
    let issuer_key = bounty.issuer;
    let bump = bounty.bump;

    if new_amount > current_amount {
        // Deposit difference
        let diff = new_amount.checked_sub(current_amount).unwrap();
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.issuer_token_account.to_account_info(),
                to: ctx.accounts.bounty_vault.to_account_info(),
                authority: ctx.accounts.issuer.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, diff)?;
    } else if new_amount < current_amount {
        // Withdraw difference
        let diff = current_amount.checked_sub(new_amount).unwrap();
        let seeds = &[b"bounty", issuer_key.as_ref(), &[bump]];
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
        token::transfer(transfer_ctx, diff)?;
    }

    // Update state after CPIs
    let bounty = &mut ctx.accounts.bounty;
    bounty.reward_amount = new_amount;

    emit!(BountyUpdated {
        issuer: issuer_key,
        new_amount,
    });

    Ok(())
}
