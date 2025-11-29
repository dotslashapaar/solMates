use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};

use crate::errors::SolmatesError;
use crate::events::EscrowCreated;
use crate::states::{EscrowStatus, MessageEscrow, UserProfile};
use crate::ESCROW_DURATION;

#[derive(Accounts)]
pub struct DepositForDm<'info> {
    #[account(mut)]
    pub sender: Signer<'info>,

    /// CHECK: Recipient wallet address
    pub recipient: UncheckedAccount<'info>,

    #[account(
        seeds = [b"profile", recipient.key().as_ref()],
        bump = recipient_profile.bump
    )]
    pub recipient_profile: Account<'info, UserProfile>,

    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = sender
    )]
    pub sender_token_account: Account<'info, TokenAccount>,

    /// Optional: sender's token account for the asset gate mint (if required)
    pub sender_gate_token_account: Option<Account<'info, TokenAccount>>,

    #[account(
        init,
        payer = sender,
        space = 8 + MessageEscrow::INIT_SPACE,
        seeds = [b"escrow", sender.key().as_ref(), recipient.key().as_ref()],
        bump
    )]
    pub escrow: Account<'info, MessageEscrow>,

    #[account(
        init,
        payer = sender,
        associated_token::mint = mint,
        associated_token::authority = escrow
    )]
    pub escrow_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<DepositForDm>, amount: u64) -> Result<()> {
    let recipient_profile = &ctx.accounts.recipient_profile;

    // Check amount meets recipient's dm_price
    require!(
        amount >= recipient_profile.dm_price,
        SolmatesError::InsufficientDmDeposit
    );

    // Asset gate check - if recipient has set a gate, verify sender holds the required token
    if let Some(gate_mint) = recipient_profile.asset_gate_mint {
        let sender_gate_ata = ctx
            .accounts
            .sender_gate_token_account
            .as_ref()
            .ok_or(SolmatesError::AssetGateRequired)?;

        require!(
            sender_gate_ata.mint == gate_mint,
            SolmatesError::InvalidAssetGate
        );
        require!(
            sender_gate_ata.amount >= recipient_profile.min_asset_amount,
            SolmatesError::InsufficientAssetBalance
        );
    }

    // Initialize escrow
    let escrow = &mut ctx.accounts.escrow;
    escrow.sender = ctx.accounts.sender.key();
    escrow.recipient = ctx.accounts.recipient.key();
    escrow.mint = ctx.accounts.mint.key();
    escrow.amount = amount;
    escrow.expiry = Clock::get()?
        .unix_timestamp
        .checked_add(ESCROW_DURATION)
        .unwrap();
    escrow.status = EscrowStatus::Pending;
    escrow.bump = ctx.bumps.escrow;

    // Transfer USDC from sender to escrow vault
    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.sender_token_account.to_account_info(),
            to: ctx.accounts.escrow_vault.to_account_info(),
            authority: ctx.accounts.sender.to_account_info(),
        },
    );
    token::transfer(transfer_ctx, amount)?;

    emit!(EscrowCreated {
        sender: escrow.sender,
        recipient: escrow.recipient,
        amount,
        expiry: escrow.expiry,
    });

    Ok(())
}
