use crate::*;

#[derive(Accounts)]
pub struct BuyIndexTokens<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = mint,
        associated_token::authority = user,
    )]
    user_token_wallet: Account<'info, TokenAccount>,

    /// CHECK validated by admin config
    #[account(constraint=sol_wallet.key() == admin_config.sol_wallet)]
    pub sol_wallet: AccountInfo<'info>,
    /// CHECK validated by admin config
    #[account(constraint=index_account.key() == admin_config.index_account)]
    pub index_account: AccountInfo<'info>,
    /// CHECK validated by admin config
    #[account(constraint=sol_price_account.key() == admin_config.sol_price_account)]
    pub sol_price_account: AccountInfo<'info>,

    #[account(seeds = [SEED_ADMIN_CONFIG], bump=admin_config.bump_admin_config)]
    pub admin_config: Account<'info, AdminConfig>,

    #[account(seeds = [SEED_MINT], bump = admin_config.bump_mint)]
    pub mint: Account<'info, Mint>,

    // application level accounts
    system_program: Program<'info, System>,
    token_program: Program<'info, Token>,
    associated_token_program: Program<'info, AssociatedToken>,
    rent: Sysvar<'info, Rent>,
}
