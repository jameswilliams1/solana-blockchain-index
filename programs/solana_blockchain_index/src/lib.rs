use anchor_lang::prelude::*;
mod index_service;
mod pyth_service;

declare_id!("56yNRQWKqpJdPSMDum7TCr7evVLt1uzXZkrarBZowyXz");

const DISCRIMINATOR_LENGTH: usize = 8;
const TIME_LENGTH: usize = 8;
const PRICE_LENGTH: usize = 8;
const EXPO_LENGTH: usize = 4;
const CONF_LENGTH: usize = 8;
const BUMP_LENGTH: usize = 1;

#[account]
#[derive(Debug)]
pub struct IndexValue {
    pub price: i64, // integer price
    pub expo: i32,  // exponent (decimal_price = price x 10^expo)
    pub conf: u64,  // confidence (+-)
    pub time: i64,  // unix timestamp
    pub bump: u8,   // PDA bump (makes it easier to find the PDA later)
}

impl IndexValue {
    const LEN: usize = DISCRIMINATOR_LENGTH // added by Solana
        + TIME_LENGTH // timestamp
        + PRICE_LENGTH // price
        + EXPO_LENGTH // exponent
        + BUMP_LENGTH // bump
        + CONF_LENGTH; // confidence
}

#[program]
pub mod solana_blockchain_index {
    use super::*;

    /**
     * Create a new PDA for the current user to store the index value.
     */
    pub fn initialise(ctx: Context<Initialise>) -> Result<()> {
        let index_value: &mut Account<IndexValue> = &mut ctx.accounts.index_value;
        index_value.bump = *ctx.bumps.get("index_value").unwrap();
        Ok(())
    }

    pub fn update_index_value(ctx: Context<UpdateIndexValue>) -> Result<()> {
        let index_value: &mut Account<IndexValue> = &mut ctx.accounts.index_value;
        let clock: Clock = Clock::get().unwrap();

        let price_accounts = vec![
            &ctx.accounts.bnb_account,
            &ctx.accounts.btc_account,
            &ctx.accounts.doge_account,
            &ctx.accounts.eth_account,
            &ctx.accounts.ltc_account,
        ];

        let prices: Vec<_> = price_accounts
            .iter()
            .map(|pa| pyth_service::price_of_account(pa))
            .collect();
        let index_calculation = index_service::calculate_index_value(prices);

        index_value.price = index_calculation.price;
        index_value.expo = index_calculation.expo;
        index_value.conf = index_calculation.conf;
        index_value.time = clock.unix_timestamp;

        msg!("New index value: {:?}", index_value);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct UpdateIndexValue<'info> {
    #[account(
        mut,
        seeds = [b"index_value", user.key().as_ref()],
        bump = index_value.bump,
    )]
    pub index_value: Account<'info, IndexValue>,

    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,

    /// CHECK should be validated at read time
    pub bnb_account: AccountInfo<'info>,
    /// CHECK should be validated at read time
    pub btc_account: AccountInfo<'info>,
    /// CHECK should be validated at read time
    pub doge_account: AccountInfo<'info>,
    /// CHECK should be validated at read time
    pub eth_account: AccountInfo<'info>,
    /// CHECK should be validated at read time
    pub ltc_account: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct Initialise<'info> {
    #[account(
        init,
        payer = user,
        space = IndexValue::LEN,
        seeds = [b"index_value", user.key().as_ref()],
        bump,
    )]
    pub index_value: Account<'info, IndexValue>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}
