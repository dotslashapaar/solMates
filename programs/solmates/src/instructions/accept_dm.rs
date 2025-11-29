use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};

use crate::errors::SolmatesError;
use crate::events::EscrowAccepted;
use crate::states::{EscrowStatus, MessageEscrow};

#[derive(Accounts)]
pub struct AcceptDm<'info> {
    /// CHECK: Sender wallet - receives rent refund
    #[account(mut)]
    pub sender: UncheckedAccount<'info>,

    #[account(mut)]
    pub recipient: Signer<'info>,

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
        init_if_needed,
        payer = recipient,
        associated_token::mint = mint,
        associated_token::authority = recipient
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<AcceptDm>) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow;

    require!(
        escrow.status == EscrowStatus::Pending,
        SolmatesError::EscrowNotPending
    );

    escrow.status = EscrowStatus::Accepted;

    // Copy values before CPI to avoid borrow conflicts
    let amount = escrow.amount;
    let sender = escrow.sender;
    let recipient = escrow.recipient;
    let bump = escrow.bump;

    // Transfer USDC from escrow vault to recipient
    let sender_key = ctx.accounts.sender.key();
    let recipient_key = ctx.accounts.recipient.key();
    let seeds = &[
        b"escrow",
        sender_key.as_ref(),
        recipient_key.as_ref(),
        &[bump],
    ];
    let signer_seeds = &[&seeds[..]];

    let transfer_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.escrow_vault.to_account_info(),
            to: ctx.accounts.recipient_token_account.to_account_info(),
            authority: ctx.accounts.escrow.to_account_info(),
        },
        signer_seeds,
    );
    token::transfer(transfer_ctx, amount)?;

    emit!(EscrowAccepted {
        sender,
        recipient,
        amount,
    });

    // Account will be closed, rent returned to sender

    Ok(())
}
