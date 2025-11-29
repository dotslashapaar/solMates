use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

use crate::errors::SolmatesError;
use crate::events::AuctionCreated;
use crate::states::{DateAuction, UserProfile};

#[derive(Accounts)]
pub struct CreateAuction<'info> {
    #[account(mut)]
    pub host: Signer<'info>,

    #[account(
        mut,
        seeds = [b"profile", host.key().as_ref()],
        bump = host_profile.bump,
        constraint = host_profile.authority == host.key() @ SolmatesError::Unauthorized
    )]
    pub host_profile: Account<'info, UserProfile>,

    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer = host,
        space = 8 + DateAuction::INIT_SPACE,
        seeds = [b"auction", host.key().as_ref(), host_profile.auction_count.to_le_bytes().as_ref()],
        bump
    )]
    pub auction: Account<'info, DateAuction>,

    #[account(
        init,
        payer = host,
        associated_token::mint = mint,
        associated_token::authority = auction
    )]
    pub auction_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreateAuction>, start_price: u64, duration_secs: i64) -> Result<()> {
    let profile = &mut ctx.accounts.host_profile;
    let auction = &mut ctx.accounts.auction;

    auction.host = ctx.accounts.host.key();
    auction.auction_id = profile.auction_count;
    auction.mint = ctx.accounts.mint.key();
    auction.highest_bidder = ctx.accounts.host.key(); // Initially host
    auction.highest_bid = start_price;
    auction.end_time = Clock::get()?
        .unix_timestamp
        .checked_add(duration_secs)
        .unwrap();
    auction.bump = ctx.bumps.auction;

    // Increment auction count
    profile.auction_count = profile.auction_count.checked_add(1).unwrap();

    emit!(AuctionCreated {
        host: auction.host,
        auction_id: auction.auction_id,
        start_price,
        end_time: auction.end_time,
    });

    Ok(())
}
