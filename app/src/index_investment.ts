#!/usr/bin/env node
/**
 * Operate the index-investment program on-chain.
 *
 * Must set env vars:
 *   ANCHOR_WALLET wallet path
 *   CLUSTER_URL e.g. https://api.devnet.solana.com
 */
import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { IndexInvestment } from "./idl/index_investment";
import * as spl from "@solana/spl-token";
import { Argument, program as commanderProgram } from "commander";
import { getPda, getAssociatedTokenWallet } from "./utils";

const clusterUrl = process.env.CLUSTER_URL;
console.log(clusterUrl);
const urlToDataAccounts = {
  "http://localhost:8899": {
    indexAccount: new PublicKey("A6TEiAdXTR81YjwKQ23v4m8gZShXgbE9r2j4s5i5R9u4"),
    solPriceAccount: new PublicKey(
      "H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG"
    ),
  },
  "https://api.devnet.solana.com": {},
};

async function main() {
  anchor.setProvider(
    anchor.AnchorProvider.local(clusterUrl, {
      commitment: "processed",
      preflightCommitment: "processed",
    })
  );
  const program = anchor.workspace.IndexInvestment as Program<IndexInvestment>;
  const provider = program.provider as anchor.AnchorProvider;

  const user = provider.wallet.publicKey;
  const { indexAccount, solPriceAccount } = urlToDataAccounts[clusterUrl];

  // program accounts/sysvars
  const systemProgram = anchor.web3.SystemProgram.programId;
  const tokenProgram = spl.TOKEN_PROGRAM_ID;
  const rent = anchor.web3.SYSVAR_RENT_PUBKEY;
  const associatedTokenProgram = spl.ASSOCIATED_TOKEN_PROGRAM_ID;

  // PDAs
  let [adminConfig, mint, tokenVault, solWallet] = await Promise.all(
    ["admin_config", "mint", "token_vault", "sol_wallet"].map((seed) =>
      getPda(seed, program.programId)
    )
  );
  const userTokenWallet = await getAssociatedTokenWallet(mint, user);

  // commands
  async function init() {
    const tx = await program.methods
      .initialise(indexAccount, solPriceAccount)
      .accounts({
        user,
        solWallet,
        adminConfig,
        mint,
        tokenVault,
        systemProgram,
        tokenProgram,
        rent,
      })
      .rpc();
    console.log(`Transaction id: ${tx}`);
  }
  async function invest(lamports: number) {
    console.log(`Investing ${lamports} lamports`);
    const tx = await program.methods
      .invest(new anchor.BN(lamports))
      .accounts({
        user,
        userTokenWallet,
        solWallet,
        indexAccount,
        solPriceAccount,
        adminConfig,
        mint,
        tokenVault,
        systemProgram,
        tokenProgram,
        associatedTokenProgram,
        rent,
      })
      .rpc();
    console.log(`Transaction id: ${tx}`);
    const userTokenWalletData = await spl.getAccount(
      provider.connection,
      userTokenWallet,
      "processed",
      tokenProgram
    );
    const tokens = userTokenWalletData.amount;
    console.log(`Received ${tokens} index tokens`);
  }
  async function withdraw(tokens: number) {
    const originalBalance = await provider.connection.getBalance(
      user,
      "processed"
    );
    const tx = await program.methods
      .withdraw(new anchor.BN(tokens))
      .accounts({
        user,
        userTokenWallet,
        solWallet,
        indexAccount,
        solPriceAccount,
        adminConfig,
        mint,
        tokenVault,
        systemProgram,
        tokenProgram,
        associatedTokenProgram,
        rent,
      })
      .rpc();
    console.log(`Transaction id: ${tx}`);
    const newBalance = await provider.connection.getBalance(user, "processed");
    const lamports = newBalance - originalBalance;
    const userTokenWalletData = await spl.getAccount(
      provider.connection,
      userTokenWallet,
      "processed",
      tokenProgram
    );
    const newTokens = userTokenWalletData.amount;
    console.log(`Received ${lamports} lamports`);
    console.log(`New index token balance is ${newTokens}`);
  }

  // CLI
  commanderProgram
    .command("init")
    .description("Initialise the on-chain program")
    .action(async () => {
      await init();
      process.exit(0);
    });
  commanderProgram
    .command("invest")
    .addArgument(new Argument("<lamports>").argRequired().argParser(parseInt))
    .description("Invest SOL into the index and receive tokens")
    .action(async (lamports: number) => {
      await invest(lamports);
      process.exit(0);
    });
  commanderProgram
    .command("withdraw")
    .addArgument(new Argument("<tokens>").argRequired().argParser(parseInt))
    .description("Withdraw SOL in exchange for tokens")
    .action(async (tokens: number) => {
      await withdraw(tokens);
      process.exit(0);
    });

  commanderProgram.parse(process.argv);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
