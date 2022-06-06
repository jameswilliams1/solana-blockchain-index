use crate::*;
use anchor_lang::solana_program::native_token::LAMPORTS_PER_SOL;

/*
* Return the current value of the index in lamports (rounded half up).
*/
pub fn index_value_in_lamports(index_value_usd: IndexValue, sol_usd: Price) -> u64 {
    // NB assuming sol_usd.price is not negative
    // TODO handle this without floats
    let usd_per_sol = (sol_usd.price as f64) * 10_f64.powi(sol_usd.expo);
    let index_price = (index_value_usd.price as f64) * 10_f64.powi(index_value_usd.expo);
    (LAMPORTS_PER_SOL as f64 * index_price / usd_per_sol).round() as u64
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_index_value_in_lamports() {
        let index_value_usd = IndexValue {
            price: 633791672303,
            expo: -8,
            conf: 130788883,
            time: 0,
            bump: 0,
        };
        let sol_usd = Price {
            price: 4225000000,
            expo: -8,
            conf: 1000000,
        };

        let actual_price = index_value_in_lamports(index_value_usd, sol_usd);
        assert_eq!(actual_price, 150009863267); // rounded up to integer
    }
}
