use pyth_sdk_solana::{load_price_feed_from_account, Price};
use solana_client::rpc_client::RpcClient;
use solana_program::pubkey::Pubkey;
use std::option::Option;
use std::str::FromStr;
use solana_program::account_info::AccountInfo;
use solana_program::pubkey::Pubkey;

extern crate chrono;
use chrono::prelude::DateTime;
use chrono::Utc;
use std::time::{Duration, UNIX_EPOCH};

pub fn read_price_on_chain(program_id: &Pubkey, accounts: &[AccountInfo]) -> f64 {

    let price_account_info: AccountInfo = ...;
    et price_feed: PriceFeed = load_price_feed_from_account_info( &price_account_info ).unwrap();
    let current_price: Price = price_feed.get_current_price().unwrap();



    let price_key = Pubkey::from_str(key).unwrap();

    let mut price_account = clnt.get_account(&price_key).unwrap();
    let price_feed = load_price_feed_from_account(&price_key, &mut price_account).unwrap();
    let current_price: Option<Price> = price_feed.get_current_price();

    if current_price.is_none() {
        return -0.0001;
    }

    let expo = current_price.unwrap().expo;
    let base: f64 = 10.0;
    let multipled_price: f64 = current_price.unwrap().price as f64;

    let price: f64 = multipled_price * base.powi(expo);

    price
}

fn read_price(key: &str, url: &str) -> f64 {
    let clnt = RpcClient::new(url.to_string());
    let price_key = Pubkey::from_str(key).unwrap();

    let mut price_account = clnt.get_account(&price_key).unwrap();
    let price_feed = load_price_feed_from_account(&price_key, &mut price_account).unwrap();
    let current_price: Option<Price> = price_feed.get_current_price();

    if current_price.is_none() {
        return -0.0001;
    }

    let expo = current_price.unwrap().expo;
    let base: f64 = 10.0;
    let multipled_price: f64 = current_price.unwrap().price as f64;

    let price: f64 = multipled_price * base.powi(expo);

    price
}

fn average(numbers: &[f64]) -> f64 {
    let sum: f64 = numbers.iter().sum();
    let count = numbers.len() as f64;
    sum / count
}


fn consume_price() {
    let url = String::from("http://api.mainnet-beta.solana.com");
    let btc_key = String::from("GVXRSBjFk6e6J3NbVPXohDJetcTjaeeuykUpbQF8UoMU");
    let eth_key = String::from("JBu1AL4obBcCMqKBBxhpWCNUt136ijcuMZLFvTP7iWdB");
    let usdt_key = String::from("3vxLXJqLqF3JG5TCbYycbKWRBbCJQLxQmBGCkyqEEefL");
    let bnb_key = String::from("4CkQJBxhU8EZ2UjhigbtdaPbpTe6mqf811fipYBFbSYN");
    let usdc_key = String::from("Gnt27xtC473ZT2Mw5u8wZ68Z3gULkSTb5DuxJy7eJotD");
    let hxro_key = String::from("B47CC1ULLw1jKTSsr1N1198zrUHp3LPduzepJyzgLn2g");
    let ada_key = String::from("3pyn4svBbxJ9Wnn3RVeafyLWfzie6yC5eTig2S62v9SC");
    let sol_key = String::from("H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG");
    let doge_key = String::from("FsSM3s38PX9K7Dn6eGzuE29S2Dsk1Sss1baytTQdCaQj");
    let dot_key = String::from("EcV1X1gY2yb4KXxjVQtTHTbioum2gvmPnFk4zYAt7zne");

    
    let mut price_array: [f64; 10] = [0.0; 10];

    let btc_price = read_price(&btc_key, &url);
    let eth_price = read_price(&eth_key, &url);
    let usdt_price = read_price(&usdt_key, &url);
    let bnb_price = read_price(&bnb_key, &url);
    let usdc_price = read_price(&usdc_key, &url);
    let hxro_price = read_price(&hxro_key, &url);
    let ada_price = read_price(&ada_key, &url);
    let sol_price = read_price(&sol_key, &url);
    let doge_price = read_price(&doge_key, &url);
    let dot_price = read_price(&dot_key, &url);
    price_array[0] = btc_price;
    price_array[1] = eth_price;
    price_array[2] = usdt_price;
    price_array[3] = bnb_price;
    price_array[4] = usdc_price;
    price_array[5] = hxro_price;
    price_array[6] = ada_price;
    price_array[7] = sol_price;
    price_array[8] = doge_price;
    price_array[9] = dot_price;

    let avg_price: f64 = average(&price_array);
    
    msg!("Current Top10 Crypto Avg Price: {}", avg_price);
    
}

