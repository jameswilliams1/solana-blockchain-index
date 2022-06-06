use crate::*;
use pyth_sdk_solana::Price;

pub fn calculate_index_value(prices: &Vec<Price>) -> Price {
    let (normalised_prices, expo) = utils::normalise_prices(prices);
    let sum_price: i64 = normalised_prices.iter().map(|p| p.price).sum();
    let variance: u64 = normalised_prices.iter().map(|p| p.conf.pow(2)).sum();

    let price = sum_price / prices.len() as i64;
    // NB conf = square of summed variances for each price
    let conf = ((variance as f64).sqrt() / (prices.len() as f64)).round() as u64;
    Price { price, expo, conf }
}
