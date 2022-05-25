use anchor_lang::prelude::*;
use pyth_sdk_solana::{load_price_feed_from_account_info, Price, PriceFeed};

pub fn price_of_account<'a>(price_account_info: &'a AccountInfo) -> Price {
    let price_feed: PriceFeed = load_price_feed_from_account_info(price_account_info).unwrap();
    let current_price: Price = price_feed.get_current_price().unwrap();

    msg!("{:?}", price_feed);
    msg!(
        "Price for {} at {} is ({} +- {}) x 10^{}",
        price_feed.product_id,
        price_feed.publish_time,
        current_price.price,
        current_price.conf,
        current_price.expo,
    );
    current_price
}
