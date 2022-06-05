use crate::*;

const DISCRIMINATOR_LENGTH: usize = 8; // Size of Solana data added for each account
const BUMP_LENGTH: usize = 1; // Size of curve bump for PDAs
const PUBKEY_LENGTH: usize = 32; // Size of public key

#[account]
#[derive(Debug)]
pub struct AdminConfig {
    // PDA bumps (makes it easier to find the PDA later)
    pub bump_admin_config: u8,
    pub bump_mint: u8,

    pub admin_user: Pubkey, // Admin user's public key

    // settings
    pub sol_wallet: Pubkey, // Address which receives SOL from users in exchange for tokens
    pub index_account: Pubkey, // Address of the index value account (USD)
    pub sol_price_account: Pubkey, // Address of the Pyth SOL/USD price account
}

impl AdminConfig {
    pub const LEN: usize = DISCRIMINATOR_LENGTH + BUMP_LENGTH * 2 + PUBKEY_LENGTH * 4;
}
