use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{mint_to, Mint, MintTo, Token, TokenAccount},
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
        // setup admin account
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
        admin_config.bump_token_vault = *ctx
            .bumps
            .get(str::from_utf8(SEED_TOKEN_VAULT).unwrap())
            .unwrap();

        Ok(())
    }

    pub fn invest(ctx: Context<BuyIndexTokens>, lamports: u64) -> Result<()> {
        // send SOL payment for tokens
        msg!(
            "Sending {} lamports from {} to {}",
            lamports,
            ctx.accounts.user.key(),
            ctx.accounts.sol_wallet.key()
        );
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.user.key(),
            &ctx.accounts.sol_wallet.key(),
            lamports,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.user.to_account_info(),
                ctx.accounts.sol_wallet.to_account_info(),
            ],
        )?;

        // mint new tokens to users wallet
        let mint_instruction = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.user_token_wallet.to_account_info(),
            authority: ctx.accounts.token_vault.to_account_info(),
        };
        let bump_token_vault = ctx.accounts.admin_config.bump_token_vault.to_le_bytes();
        let seeds = vec![SEED_TOKEN_VAULT.as_ref(), bump_token_vault.as_ref()];
        let signer = vec![seeds.as_slice()];
        let token_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            mint_instruction,
            signer.as_slice(),
        );
        mint_to(token_ctx, 100)?; // TODO mint tokens to user based on index value

        Ok(())
    }
}
