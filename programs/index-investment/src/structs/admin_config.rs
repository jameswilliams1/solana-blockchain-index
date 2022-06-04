use crate::*;

const DISCRIMINATOR_LENGTH: usize = 8; // Size of Solana data added for each account
const BUMP_LENGTH: usize = 1; // Size of curve bump for PDAs
const PUBKEY_LENGTH: usize = 32; // Size of public key

#[account]
#[derive(Debug)]
pub struct AdminConfig {
    pub bump: u8,                   // PDA bump (makes it easier to find the PDA later)
    pub admin_user: Pubkey,         // Admin user's public key
    pub sol_wallet_address: Pubkey, // Address which receives SOL from users in exchange for tokens
}

impl AdminConfig {
    pub const LEN: usize = DISCRIMINATOR_LENGTH + BUMP_LENGTH + PUBKEY_LENGTH * 2;
}
