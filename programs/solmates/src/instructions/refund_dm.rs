use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::errors::SolmatesError;
use crate::events::EscrowRefunded;
use crate::states::{EscrowStatus, MessageEscrow};

#[derive(Accounts)]
pub struct RefundDm<'info> {
    #[account(mut)]
    pub sender: Signer<'info>,

    /// CHECK: Recipient wallet address
    pub recipient: UncheckedAccount<'info>,

    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        seeds = [b"escrow", sender.key().as_ref(), recipient.key().as_ref()],
        bump = escrow.bump,
        has_one = sender,
        has_one = recipient,
        has_one = mint,
        close = sender
    )]
    pub escrow: Account<'info, MessageEscrow>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = escrow
    )]
    pub escrow_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = sender
    )]
    pub sender_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<RefundDm>) -> Result<()> {
    let escrow = &ctx.accounts.escrow;

    require!(
        escrow.status == EscrowStatus::Pending,
        SolmatesError::EscrowNotPending
    );

    let current_time = Clock::get()?.unix_timestamp;
    require!(
        current_time > escrow.expiry,
        SolmatesError::EscrowNotExpired
    );

    // Transfer USDC from escrow vault back to sender
    let sender_key = ctx.accounts.sender.key();
    let recipient_key = ctx.accounts.recipient.key();
    let seeds = &[
        b"escrow",
        sender_key.as_ref(),
        recipient_key.as_ref(),
        &[escrow.bump],
    ];
    let signer_seeds = &[&seeds[..]];

    let transfer_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.escrow_vault.to_account_info(),
            to: ctx.accounts.sender_token_account.to_account_info(),
            authority: ctx.accounts.escrow.to_account_info(),
        },
        signer_seeds,
    );
    token::transfer(transfer_ctx, escrow.amount)?;

    emit!(EscrowRefunded {
        sender: escrow.sender,
        recipient: escrow.recipient,
        amount: escrow.amount,
    });

    // Account will be closed, rent returned to sender

    Ok(())
}
