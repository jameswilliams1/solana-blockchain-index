use anchor_lang::prelude::*;
use anchor_lang::solana_program::native_token::LAMPORTS_PER_SOL;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{burn, mint_to, Burn, Mint, MintTo, Token, TokenAccount},
};
use pyth_sdk_solana::Price;
use solana_blockchain_index::IndexValue;
use std::str;
mod errors;
mod instructions;
mod services;
mod state;

pub use errors::ErrorCode;
pub use instructions::*;
pub use services::*;
pub use state::*;

declare_id!("DS1BDHCUZ4exfnuyu4eG5bkiVaU7V6B7KnfrxV5WQ4ov");

#[program]
pub mod index_investment {
    use super::*;

    /**
     * Create the program admin config and token mint authority PDAs.
     */
    pub fn initialise(
        ctx: Context<Initialise>,
        index_account: Pubkey,
        sol_price_account: Pubkey,
    ) -> Result<()> {
        // setup admin account
        let admin_config = &mut ctx.accounts.admin_config;
        admin_config.admin_user = ctx.accounts.user.key();
        admin_config.index_account = index_account;
        admin_config.sol_price_account = sol_price_account;

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
        admin_config.bump_sol_wallet = *ctx
            .bumps
            .get(str::from_utf8(SEED_SOL_WALLET).unwrap())
            .unwrap();

        Ok(())
    }

    pub fn invest(ctx: Context<Invest>, lamports: u64) -> Result<()> {
        // send SOL payment for tokens
        msg!(
            "Sending {} lamports from {} to {}",
            lamports,
            ctx.accounts.user.key(),
            ctx.accounts.sol_wallet.key(),
        );
        let transfer_instruction = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.user.key(),
            &ctx.accounts.sol_wallet.key(),
            lamports,
        );
        anchor_lang::solana_program::program::invoke(
            &transfer_instruction,
            &[
                ctx.accounts.user.to_account_info(),
                ctx.accounts.sol_wallet.to_account_info(),
            ],
        )?;

        // mint new tokens to users wallet
        let sol_usd = solana_blockchain_index::pyth_service::price_of_account(
            &ctx.accounts.sol_price_account,
        );
        let index_value_usd = &ctx.accounts.index_account;
        let tokens = ((lamports * LAMPORTS_PER_SOL) as f64
            / index_value_in_lamports(index_value_usd, &sol_usd) as f64)
            .round() as u64;

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
        msg!(
            "Minting {} tokens to {}",
            tokens,
            ctx.accounts.user_token_wallet.key()
        );
        mint_to(token_ctx, tokens)?;

        Ok(())
    }

    pub fn withdraw(ctx: Context<Invest>, tokens: u64) -> Result<()> {
        // burn tokens from user token wallet
        msg!(
            "Burning {} tokens from token wallet {}",
            tokens,
            ctx.accounts.user_token_wallet.key(),
        );
        let burn_instruction = Burn {
            mint: ctx.accounts.mint.to_account_info(),
            from: ctx.accounts.user_token_wallet.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let token_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            burn_instruction,
        );
        burn(token_ctx, tokens)?;

        // send SOL payment for user's tokens
        let sol_usd = solana_blockchain_index::pyth_service::price_of_account(
            &ctx.accounts.sol_price_account,
        );
        let index_value_usd = &ctx.accounts.index_account;
        let lamports = ((tokens * index_value_in_lamports(index_value_usd, &sol_usd)) as f64
            / LAMPORTS_PER_SOL as f64)
            .round() as u64;

        msg!(
            "Sending {} lamports from {} to {}",
            lamports,
            ctx.accounts.sol_wallet.key(),
            ctx.accounts.user.key(),
        );
        **ctx.accounts.sol_wallet.try_borrow_mut_lamports()? -= lamports;
        **ctx.accounts.user.try_borrow_mut_lamports()? += lamports;

        Ok(())
    }
}
