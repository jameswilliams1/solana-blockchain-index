use anchor_lang::prelude::*;

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
     * Create the PDA for the program admin config account.
     */
    pub fn initialise_admin_config(
        ctx: Context<InitialiseAdminConfig>,
        sol_wallet_address: Pubkey,
    ) -> Result<()> {
        let admin_config: &mut Account<AdminConfig> = &mut ctx.accounts.admin_config;
        admin_config.bump = *ctx.bumps.get("admin_config").unwrap();
        // first user becomes the admin user
        admin_config.admin_user = ctx.accounts.user.key();
        admin_config.sol_wallet_address = sol_wallet_address;
        Ok(())
    }
}
