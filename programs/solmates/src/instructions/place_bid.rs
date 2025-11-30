use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::errors::SolmatesError;
use crate::events::BidPlaced;
use crate::states::DateAuction;
use crate::{SNIPE_EXTENSION, SNIPE_THRESHOLD, MAX_SNIPE_EXTENSIONS, MIN_BID_INCREMENT_BPS};

#[derive(Accounts)]
pub struct PlaceBid<'info> {
    #[account(mut)]
    pub bidder: Signer<'info>,

    /// CHECK: Previous highest bidder - receives refund
    #[account(mut)]
    pub previous_bidder: UncheckedAccount<'info>,

    /// CHECK: Auction host
    pub host: UncheckedAccount<'info>,

    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        seeds = [b"auction", host.key().as_ref(), auction.auction_id.to_le_bytes().as_ref()],
        bump = auction.bump,
        has_one = host,
        has_one = mint,
        constraint = auction.highest_bidder == previous_bidder.key() @ SolmatesError::InvalidPreviousBidder
    )]
    pub auction: Account<'info, DateAuction>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = auction
    )]
    pub auction_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = bidder
    )]
    pub bidder_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = previous_bidder
    )]
    pub previous_bidder_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<PlaceBid>, bid_amount: u64) -> Result<()> {
    let auction = &mut ctx.accounts.auction;
    let current_time = Clock::get()?.unix_timestamp;

    // Check auction is still active
    require!(current_time < auction.end_time, SolmatesError::AuctionEnded);

    // Check bid is higher than current
    require!(bid_amount > auction.highest_bid, SolmatesError::BidTooLow);

    // Check minimum bid increment (5% higher than current bid)
    let min_increment = auction.highest_bid
        .checked_mul(MIN_BID_INCREMENT_BPS).unwrap()
        .checked_div(10000).unwrap();
    let min_bid = auction.highest_bid.checked_add(min_increment).unwrap();
    require!(bid_amount >= min_bid, SolmatesError::BidIncrementTooSmall);

    // Copy values before CPI to avoid borrow conflicts
    let host_key = auction.host;
    let auction_id = auction.auction_id;
    let auction_id_bytes = auction_id.to_le_bytes();
    let bump = auction.bump;
    let previous_bid_amount = auction.highest_bid;
    let previous_bidder = auction.highest_bidder;
    let is_first_bid = previous_bidder == host_key;
    let original_end_time = auction.end_time;
    let total_extended = auction.total_extended;

    let seeds = &[
        b"auction",
        host_key.as_ref(),
        auction_id_bytes.as_ref(),
        &[bump],
    ];
    let signer_seeds = &[&seeds[..]];

    // Step 1: Refund previous bidder (if not the host)
    if !is_first_bid {
        let refund_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.auction_vault.to_account_info(),
                to: ctx.accounts.previous_bidder_token_account.to_account_info(),
                authority: ctx.accounts.auction.to_account_info(),
            },
            signer_seeds,
        );
        token::transfer(refund_ctx, previous_bid_amount)?;
    }

    // Step 2: Deposit new bid
    let deposit_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.bidder_token_account.to_account_info(),
            to: ctx.accounts.auction_vault.to_account_info(),
            authority: ctx.accounts.bidder.to_account_info(),
        },
    );
    token::transfer(deposit_ctx, bid_amount)?;

    // Step 3: Update auction state
    let auction = &mut ctx.accounts.auction;
    auction.highest_bidder = ctx.accounts.bidder.key();
    auction.highest_bid = bid_amount;

    // Step 4: Snipe protection - extend if within last 5 minutes (with cap at 1 hour total)
    let time_remaining = original_end_time.checked_sub(current_time).unwrap_or(0);
    if time_remaining < SNIPE_THRESHOLD && total_extended < MAX_SNIPE_EXTENSIONS {
        let remaining_extension = MAX_SNIPE_EXTENSIONS.checked_sub(total_extended).unwrap();
        let extension = SNIPE_EXTENSION.min(remaining_extension);
        auction.end_time = original_end_time.checked_add(extension).unwrap();
        auction.total_extended = total_extended.checked_add(extension).unwrap();
    }

    emit!(BidPlaced {
        auction_id,
        bidder: ctx.accounts.bidder.key(),
        amount: bid_amount,
        previous_bidder,
        new_end_time: auction.end_time,
    });

    Ok(())
}
