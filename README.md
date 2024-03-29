# Solana Blockchain Index
A proof-of-concept crypto index and investment contract running on the [Solana blockchain](https://solana.com/) using [the Pyth Network](https://pyth.network/) for market data.

# Overview
## index-investment program
Allows a user to invest in an index through buying and selling fungible tokens.
### initialise
- Stores admin settings in a PDA (price accounts used for exchange rates etc.)
- First user to call function becomes the admin, no other users can call this function afterwards

### invest
- Transfers specified number of lamports from user (investor) to the programs wallet
- Index tokens are minted to the users associated token wallet rounded to the nearest integer

$$tokensReceived=\frac{lamportsPerSol \times lamportsInvested}{indexValueInLamports}$$

### withdraw
- Burns specified number of index tokens from user's associated token wallet
- Transfers lamports back to user
$$lamportsWithdrawn=\frac{tokensBurned \times indexValueInLamports}{lamportsPerSol}$$

## solana-blockchain-index program
- Uses the provided Pyth network public keys to read data from price accounts, writing to a PDA owned by the requesting user. The same PDA is used to update the value for each re-run.

# Developer Setup
## First Time Setup
ℹ️ If you are using Windows, consider installing [Windows Subsystem for Linux 2](https://docs.microsoft.com/en-us/windows/wsl/install#install-wsl-command) - the following instructions are much easier to follow in a Linux environment where `apt` and `bash` are available (there is no official Rust installer for Windows).

### Rust
Used for the deployed Solana program.

- [Install rustup](https://www.rust-lang.org/tools/install) (use the stable build and default profile).
- If using VSCode, the `rust-lang.rust` extension will be useful. For PyCharm/IntelliJ try [the JetBrains Rust plugin](https://www.jetbrains.com/rust/).
- Run `cargo install cargo-edit`. This will enable adding dependencies using `cargo add` ([see cargo-edit docs here](https://github.com/killercup/cargo-edit)).
- [Install the Solana Tool Suite](https://docs.solana.com/cli/install-solana-cli-tools): `sh -c "$(curl -sSfL https://release.solana.com/stable/install)"`.
- Install required build tools: `sudo apt update && sudo apt install -y pkg-config libudev-dev`.

### NodeJS
Used for the program client and testing.
- Install NVM: `curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash`.
- Set up the project Node: `nvm install` (installs Node version from .nvmrc).
- [Install Anchor CLI](https://project-serum.github.io/anchor/getting-started/installation.html)
- Install dependencies: `yarn install`.

## Development
### Rust
Run formatting on rust files:
```sh
cargo fmt --all
```

Run clippy (bug checker) on rust files:
```sh
cargo clippy --no-deps --fix
```

### Solana
Start a local cluster (will run until terminal exits with ctrl-c):
```sh
solana-test-validator
```

Build and deploy the program (in a new terminal):
```sh
anchor build
anchor deploy
```
