use crate::*;

#[error_code]
pub enum ErrorCode {
    #[msg("You are not authorised to perform this action")]
    Unauthorised,

    #[msg("The index value account specified is incorrect")]
    WrongIndexAccount,

    #[msg("The Pyth SOL/USD price account specified is incorrect")]
    WrongSolPriceAccount,
}
