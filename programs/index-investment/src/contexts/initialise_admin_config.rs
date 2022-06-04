use crate::*;

#[derive(Accounts)]
pub struct InitialiseAdminConfig<'info> {
    #[account(
        init,
        payer = user,
        space = AdminConfig::LEN,
        seeds = [b"admin_config"],
        bump,
    )]
    pub admin_config: Account<'info, AdminConfig>,

    // TODO should find a way to only allow the upgrade authority to do this
    // currently the first ever user becomes the admin user
    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}
