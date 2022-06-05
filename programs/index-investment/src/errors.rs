use crate::*;

#[error_code]
pub enum ErrorCode {
    #[msg("You are not authorised to perform this action")]
    Unauthorised,

    #[msg("The wallet specified is incorrect")]
    WrongWalletAddress,

    #[msg("The index value account specified is incorrect")]
    WrongIndexAccount,

    #[msg("The Pyth SOL price account specified is incorrect")]
    WrongSolPriceAccount,
}
