use anchor_lang::prelude::*;
use pyth_sdk_solana::Price;

pub fn calculate_index_value(prices: Vec<Price>) -> Price {
    let expo: i32 = prices.iter().map(|p| p.expo).min().unwrap(); // lowest exponent
    msg!("Lowest exponent is {}", expo);

    let mut sum_price: i64 = 0;
    let mut variance: u64 = 0;

    for current_price in prices.iter() {
        msg!("Normalising {:?} to expo: {}", current_price, expo);
        // NB expo > current_price.expo so this should always be positive
        let exp_delta: u32 = (current_price.expo - expo).try_into().unwrap();
        let multiplier = 10_u64.pow(exp_delta);
        let new_price = current_price.price * multiplier as i64;
        msg!("New price is {} x10^{}", new_price, expo);
        sum_price += new_price;

        let new_conf = current_price.conf * multiplier;
        msg!("New conf is {}", new_conf);
        variance += new_conf.pow(2);
    }

    let price = sum_price / prices.len() as i64;
    // NB conf = square of summed variances for each price
    let conf = ((variance as f64).sqrt() / (prices.len() as f64)).round() as u64;
    Price { price, expo, conf }
}
