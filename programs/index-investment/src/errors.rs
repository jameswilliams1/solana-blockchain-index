use crate::*;

#[error_code]
pub enum ErrorCode {
    #[msg("You are not authorised to perform this action.")]
    Unauthorised,

    #[msg("Account already initialised")]
    Initialised,

    #[msg("Account not yet initialised")]
    Uninitialised,
}
