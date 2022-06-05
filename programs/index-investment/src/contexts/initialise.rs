use crate::*;

pub static SEED_ADMIN_CONFIG: &[u8; 12] = b"admin_config";
pub static SEED_MINT: &[u8; 4] = b"mint";

#[derive(Accounts)]
pub struct Initialise<'info> {
    // TODO should find a way to only allow the upgrade authority to do this
    // currently the first ever user becomes the admin user
    #[account(mut)]
    pub user: Signer<'info>,

    /// CHECK no data is read from this account
    pub sol_wallet: AccountInfo<'info>,
    /// CHECK no data is read from this account
    pub index_account: AccountInfo<'info>,
    /// CHECK no data is read from this account
    pub sol_price_account: AccountInfo<'info>,

    #[account(
        init,
        payer = user,
        space = AdminConfig::LEN,
        seeds = [SEED_ADMIN_CONFIG],
        bump,
    )]
    pub admin_config: Account<'info, AdminConfig>,

    #[account(
        init,
        payer = user,
        seeds = [SEED_MINT],
        bump,
        mint::decimals = 0,
        mint::authority = crate::ID,
    )]
    pub mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    rent: Sysvar<'info, Rent>,
}
