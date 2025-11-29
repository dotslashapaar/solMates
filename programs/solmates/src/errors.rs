use anchor_lang::prelude::*;

#[error_code]
pub enum SolmatesError {
    #[msg("Bid amount must be higher than current highest bid")]
    BidTooLow,

    #[msg("Auction has ended")]
    AuctionEnded,

    #[msg("Auction has not ended yet")]
    AuctionNotEnded,

    #[msg("No bids were placed on this auction")]
    NoBidsPlaced,

    #[msg("Escrow has not expired yet")]
    EscrowNotExpired,

    #[msg("Escrow is not in pending status")]
    EscrowNotPending,

    #[msg("Unauthorized")]
    Unauthorized,

    #[msg("Insufficient token balance for asset gate")]
    InsufficientAssetBalance,

    #[msg("Invalid asset gate mint")]
    InvalidAssetGate,

    #[msg("Asset gate token account required")]
    AssetGateRequired,

    #[msg("DM deposit amount is below recipient's required price")]
    InsufficientDmDeposit,

    #[msg("Bounty is not open")]
    BountyNotOpen,

    #[msg("Invalid previous bidder account")]
    InvalidPreviousBidder,
}
