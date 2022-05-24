use anchor_lang::prelude::*;

declare_id!("4NRxSxxnNA9xKHKrmj9RD16pmGRTDMvp3SkY4uB7ifdM");

const DISCRIMINATOR_LENGTH: usize = 8;
const TIMESTAMP_LENGTH: usize = 8;
const VALUE_LENGTH: usize = 8;

#[account]
#[derive(Debug)]
pub struct IndexValue {
    pub timestamp: i64,
    pub value: f64,
}

impl IndexValue {
    const LEN: usize = DISCRIMINATOR_LENGTH // added by Solana
        + TIMESTAMP_LENGTH // timestamp
        + VALUE_LENGTH; // value
}

#[program]
pub mod solana_blockchain_index {
    use super::*;

    pub fn update_index_value(ctx: Context<UpdateIndexValue>) -> Result<()> {
        let index_value: &mut Account<IndexValue> = &mut ctx.accounts.index_value;
        let clock: Clock = Clock::get().unwrap();

        index_value.timestamp = clock.unix_timestamp;
        // TODO get value from pyth here
        index_value.value = 0.0;

        msg!(
            "Index value at {} is {}",
            index_value.timestamp,
            index_value.value
        );
        Ok(())
    }
}

#[derive(Accounts)]
pub struct UpdateIndexValue<'info> {
    #[account(init, payer = user, space = IndexValue::LEN)]
    pub index_value: Account<'info, IndexValue>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}
