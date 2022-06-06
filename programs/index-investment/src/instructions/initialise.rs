use crate::*;

pub static SEED_ADMIN_CONFIG: &[u8; 12] = b"admin_config";
pub static SEED_MINT: &[u8; 4] = b"mint";
pub static SEED_TOKEN_VAULT: &[u8; 11] = b"token_vault";
pub static SEED_SOL_WALLET: &[u8; 10] = b"sol_wallet";

#[derive(Accounts)]
pub struct Initialise<'info> {
    // TODO should find a way to only allow the upgrade authority to do this
    /// The fee-paying user who will become the admin.
    #[account(mut)]
    pub user: Signer<'info>,

    /// Stores admin settings such as SOL payment address and data accounts used.
    #[account(
        init,
        payer = user,
        seeds = [SEED_ADMIN_CONFIG],
        bump,
        space = AdminConfig::LEN,
    )]
    pub admin_config: Box<Account<'info, AdminConfig>>,

    /// Account used to store token metadata (supply etc.).
    #[account(
        init,
        payer = user,
        seeds = [SEED_MINT],
        bump,
        mint::decimals = 0,
        mint::authority = token_vault,
    )]
    pub mint: Box<Account<'info, Mint>>,

    /// Account used to mint or burn tokens.
    #[account(
        init,
        payer = user,
        seeds = [SEED_TOKEN_VAULT],
        bump,
        token::mint = mint,
        token::authority = token_vault,
    )]
    pub token_vault: Box<Account<'info, TokenAccount>>,

    /// Wallet used to store invested SOL.
    /// CHECK no data is read from this account
    #[account(
        init,
        payer = user, // NB no fee is actually charged here, wallets are free
        seeds = [SEED_SOL_WALLET],
        bump,
        space = 0, // wallets do not store data
    )]
    pub sol_wallet: AccountInfo<'info>,

    // required by anchor to initialise accounts
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    rent: Sysvar<'info, Rent>,
}
