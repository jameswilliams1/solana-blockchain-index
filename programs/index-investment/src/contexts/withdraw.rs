use crate::*;

#[derive(Accounts)]
pub struct Withdraw<'info> {
    /// The person withdrawing.
    #[account(mut)]
    pub user: Signer<'info>,

    /// Associated token wallet.
    #[account( // TODO
        mut,
        associated_token::mint = mint,
        associated_token::authority = user,
    )]
    pub user_token_wallet: Account<'info, TokenAccount>,

    /// CHECK validated by admin config
    #[account(mut, constraint=sol_wallet.key() == admin_config.sol_wallet @ ErrorCode::WrongWalletAddress)]
    pub sol_wallet: AccountInfo<'info>,
    /// CHECK validated by admin config
    #[account(constraint=index_account.key() == admin_config.index_account @ ErrorCode::WrongIndexAccount)]
    pub index_account: AccountInfo<'info>,
    /// CHECK validated by admin config
    #[account(constraint=sol_price_account.key() == admin_config.sol_price_account @ ErrorCode::WrongSolPriceAccount)]
    pub sol_price_account: AccountInfo<'info>,

    /// Stores admin settings.
    #[account(seeds = [SEED_ADMIN_CONFIG], bump=admin_config.bump_admin_config)]
    pub admin_config: Account<'info, AdminConfig>,

    /// Stores token metadata (supply etc.).
    #[account(mut, seeds = [SEED_MINT], bump = admin_config.bump_mint)]
    pub mint: Account<'info, Mint>,

    /// Account used to mint or burn tokens.
    #[account(seeds = [SEED_TOKEN_VAULT], bump = admin_config.bump_token_vault)]
    pub token_vault: Box<Account<'info, TokenAccount>>,

    // required by anchor to mint/send tokens.
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}
