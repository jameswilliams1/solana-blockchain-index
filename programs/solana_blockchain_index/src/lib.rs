use anchor_lang::prelude::*;

declare_id!("4NRxSxxnNA9xKHKrmj9RD16pmGRTDMvp3SkY4uB7ifdM");

#[program]
pub mod solana_blockchain_index {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
