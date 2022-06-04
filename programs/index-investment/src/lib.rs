use anchor_lang::prelude::*;

declare_id!("DS1BDHCUZ4exfnuyu4eG5bkiVaU7V6B7KnfrxV5WQ4ov");

#[program]
pub mod index_investment {
    use super::*;

    pub fn initialise(ctx: Context<Initialise>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialise {}
