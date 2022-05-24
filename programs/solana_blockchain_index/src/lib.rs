use anchor_lang::prelude::*;
mod pyth_service;

declare_id!("4NRxSxxnNA9xKHKrmj9RD16pmGRTDMvp3SkY4uB7ifdM");

const DISCRIMINATOR_LENGTH: usize = 8;
const TIMESTAMP_LENGTH: usize = 8;
const VALUE_LENGTH: usize = 8;
const EXPO_LENGTH: usize = 4;
const CONF_LENGTH: usize = 8;

#[account]
#[derive(Debug)]
pub struct IndexValue {
    pub timestamp: i64,
    pub value: i64,
    pub expo: i32,
    pub conf: u64,
}

impl IndexValue {
    const LEN: usize = DISCRIMINATOR_LENGTH // added by Solana
        + TIMESTAMP_LENGTH // timestamp
        + VALUE_LENGTH // value
        + EXPO_LENGTH // exponent
        + CONF_LENGTH; // confidence
}

#[program]
pub mod solana_blockchain_index {
    use super::*;

    pub fn update_index_value(ctx: Context<UpdateIndexValue>) -> Result<()> {
        let index_value: &mut Account<IndexValue> = &mut ctx.accounts.index_value;
        let clock: Clock = Clock::get().unwrap();

        index_value.timestamp = clock.unix_timestamp;
        let btc_value = pyth_service::price_of_account(&ctx.accounts.btc_account);
        index_value.value = btc_value.price;
        index_value.conf = btc_value.conf;
        index_value.expo = btc_value.expo;

        msg!("New index value: {:?}", index_value);
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
    /// CHECK should be validated at read time
    pub btc_account: AccountInfo<'info>,
}
