use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};

use crate::errors::SolmatesError;
use crate::events::AuctionClaimed;
use crate::states::DateAuction;
use crate::{PLATFORM_FEE_BPS, TREASURY};

#[derive(Accounts)]
pub struct ClaimAuction<'info> {
    #[account(mut)]
    pub host: Signer<'info>,

    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        seeds = [b"auction", host.key().as_ref(), auction.auction_id.to_le_bytes().as_ref()],
        bump = auction.bump,
        has_one = host,
        has_one = mint,
        close = host
    )]
    pub auction: Account<'info, DateAuction>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = auction
    )]
    pub auction_vault: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = host,
        associated_token::mint = mint,
        associated_token::authority = host
    )]
    pub host_token_account: Account<'info, TokenAccount>,

    /// CHECK: Platform treasury for fees - validated against constant
    #[account(
        mut,
        constraint = treasury.key() == TREASURY @ SolmatesError::InvalidTreasury
    )]
    pub treasury: UncheckedAccount<'info>,

    #[account(
        init_if_needed,
        payer = host,
        associated_token::mint = mint,
        associated_token::authority = treasury
    )]
    pub treasury_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<ClaimAuction>) -> Result<()> {
    let auction = &ctx.accounts.auction;
    let current_time = Clock::get()?.unix_timestamp;

    // Check auction has ended
    require!(
        current_time > auction.end_time,
        SolmatesError::AuctionNotEnded
    );

    // Check there was at least one bid (highest_bidder != host)
    require!(
        auction.highest_bidder != auction.host,
        SolmatesError::NoBidsPlaced
    );

    // Calculate platform fee (1%)
    let fee = auction.highest_bid.checked_mul(PLATFORM_FEE_BPS).unwrap().checked_div(10000).unwrap();
    let host_amount = auction.highest_bid.checked_sub(fee).unwrap();

    // Transfer USDC from auction vault to host
    let host_key = auction.host;
    let auction_id_bytes = auction.auction_id.to_le_bytes();
    let seeds = &[
        b"auction",
        host_key.as_ref(),
        auction_id_bytes.as_ref(),
        &[auction.bump],
    ];
    let signer_seeds = &[&seeds[..]];

    let transfer_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.auction_vault.to_account_info(),
            to: ctx.accounts.host_token_account.to_account_info(),
            authority: ctx.accounts.auction.to_account_info(),
        },
        signer_seeds,
    );
    token::transfer(transfer_ctx, host_amount)?;

    // Transfer fee to treasury
    if fee > 0 {
        let fee_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.auction_vault.to_account_info(),
                to: ctx.accounts.treasury_token_account.to_account_info(),
                authority: ctx.accounts.auction.to_account_info(),
            },
            signer_seeds,
        );
        token::transfer(fee_ctx, fee)?;
    }

    emit!(AuctionClaimed {
        auction_id: auction.auction_id,
        host: auction.host,
        winner: auction.highest_bidder,
        amount: host_amount,
        fee,
    });

    // Account will be closed, rent returned to host

    Ok(())
}
