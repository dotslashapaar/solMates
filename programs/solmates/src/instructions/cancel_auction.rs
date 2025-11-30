use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::errors::SolmatesError;
use crate::events::AuctionCancelled;
use crate::states::DateAuction;

#[derive(Accounts)]
pub struct CancelAuction<'info> {
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

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<CancelAuction>) -> Result<()> {
    let auction = &ctx.accounts.auction;

    // Can only cancel if no bids have been placed (highest_bidder == host)
    require!(
        auction.highest_bidder == auction.host,
        SolmatesError::AuctionHasBids
    );

    emit!(AuctionCancelled {
        host: auction.host,
        auction_id: auction.auction_id,
    });

    // No funds to transfer since no bids were placed
    // Account will be closed, rent returned to host

    Ok(())
}
