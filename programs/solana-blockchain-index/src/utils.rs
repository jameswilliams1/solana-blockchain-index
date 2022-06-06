use crate::*;
use pyth_sdk_solana::Price;

/*
* Normalise a vector of prices to the lowest exponent.
*/
pub fn normalise_prices(prices: &Vec<Price>) -> (Vec<Price>, i32) {
    let expo: i32 = prices.iter().map(|p| p.expo).min().unwrap(); // lowest exponent
    msg!("Lowest exponent is {}", expo);

    let mut new_prices: Vec<Price> = vec![];
    for current_price in prices.iter() {
        msg!("Normalising {:?} to expo: {}", current_price, expo);
        // NB expo > current_price.expo so this should always be positive
        let exp_delta: u32 = (current_price.expo - expo).try_into().unwrap();
        let multiplier = 10_u64.pow(exp_delta);
        let new_price = current_price.price * multiplier as i64;
        let new_conf = current_price.conf * multiplier;
        msg!("New price is {} += {} x10^{}", new_price, new_conf, expo);

        new_prices.push(Price {
            price: new_price,
            expo: expo,
            conf: new_conf,
        });
    }

    (new_prices, expo)
}
