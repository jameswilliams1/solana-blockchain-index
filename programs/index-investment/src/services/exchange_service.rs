use crate::*;

/*
* Return the current value of the index in lamports (rounded half up).
*/
pub fn index_value_in_lamports(index_value_usd: &IndexValue, sol_usd: &Price) -> u64 {
    // TODO this wrongly assumes expo for both args is -8
    let value_in_lamports = (LAMPORTS_PER_SOL as f64 * index_value_usd.price as f64
        / sol_usd.price as f64)
        .round() as u64;
    msg!("Index value in lamports is {}", value_in_lamports);
    value_in_lamports
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
            price: 4366200000,
            expo: -8,
            conf: 3070000,
        };

        let actual_price = index_value_in_lamports(&index_value_usd, &sol_usd);
        assert_eq!(actual_price, 145158644199); // rounded up to integer
    }
}
