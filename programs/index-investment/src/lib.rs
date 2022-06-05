use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount, Transfer},
};
use std::str;
mod contexts;
mod errors;
mod structs;

pub use contexts::*;
pub use errors::ErrorCode;
pub use structs::*;

declare_id!("DS1BDHCUZ4exfnuyu4eG5bkiVaU7V6B7KnfrxV5WQ4ov");

#[program]
pub mod index_investment {
    use super::*;

    /**
     * Create the program admin config and token mint authority PDAs.
     */
    pub fn initialise(ctx: Context<Initialise>) -> Result<()> {
        // setup admin account (first user becomes admin)
        let admin_config = &mut ctx.accounts.admin_config;
        admin_config.admin_user = ctx.accounts.user.key();
        admin_config.sol_wallet = ctx.accounts.sol_wallet.key();
        admin_config.index_account = ctx.accounts.index_account.key();
        admin_config.sol_price_account = ctx.accounts.sol_price_account.key();

        // store bump for each PDA
        admin_config.bump_admin_config = *ctx
            .bumps
            .get(str::from_utf8(SEED_ADMIN_CONFIG).unwrap())
            .unwrap();
        admin_config.bump_mint = *ctx.bumps.get(str::from_utf8(SEED_MINT).unwrap()).unwrap();

        Ok(())
    }

    pub fn buy_index_tokens(ctx: Context<BuyIndexTokens>, lamports: u64) -> Result<()> {
        // send payment for tokens
        msg!(
            "Sending {} lamports from {} to {}",
            lamports,
            ctx.accounts.user.key(),
            ctx.accounts.sol_wallet.key()
        );
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.user.key(),
            &ctx.accounts.admin_config.sol_wallet,
            lamports,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.user.to_account_info(),
                ctx.accounts.sol_wallet.to_account_info(),
            ],
        )?;

        // mint tokens based on index value

        Ok(())
    }
}
