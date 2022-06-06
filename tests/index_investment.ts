import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { expect } from "chai";
import { strict as assert } from "assert";
import { PublicKey } from "@solana/web3.js";
import { IndexInvestment } from "../target/types/index_investment";
import * as spl from "@solana/spl-token";

async function getPda(
  seed: string,
  systemProgram: PublicKey
): Promise<PublicKey> {
  const [pda, _] = await PublicKey.findProgramAddress(
    [anchor.utils.bytes.utf8.encode(seed)],
    systemProgram
  );
  return pda;
}

async function getAssociatedTokenWallet(
  mint: PublicKey,
  user: PublicKey
): Promise<PublicKey> {
  return await spl.getAssociatedTokenAddress(
    mint,
    user,
    false,
    spl.TOKEN_PROGRAM_ID,
    anchor.utils.token.ASSOCIATED_PROGRAM_ID
  );
}

describe("IndexInvestment", async () => {
  // configure the client to use the local cluster
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.IndexInvestment as Program<IndexInvestment>;
  const provider = program.provider as anchor.AnchorProvider;

  // user accounts
  const adminUser = provider.wallet.publicKey;
  const user = anchor.web3.Keypair.generate(); // investor

  // data accounts
  const indexAccount = new PublicKey( // see tests/data/index_account.json
    "A6TEiAdXTR81YjwKQ23v4m8gZShXgbE9r2j4s5i5R9u4"
  );
  // TODO use actual account
  const solPriceAccount = anchor.web3.Keypair.generate().publicKey;

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

  describe("initialise", async () => {
    it("Cannot be initialised using an incorrect address", async () => {
      const notTheAdminConfigPda = anchor.web3.Keypair.generate();
      assert.rejects(
        program.methods
          .initialise(indexAccount, solPriceAccount)
          .accounts({
            user: adminUser,
            solWallet,
            adminConfig: notTheAdminConfigPda.publicKey,
            mint,
            tokenVault,
            systemProgram,
            tokenProgram,
            rent,
          })
          .rpc()
      );
    });

    it("Can be initialised once using the correct address", async () => {
      await program.methods
        .initialise(indexAccount, solPriceAccount)
        .accounts({
          user: adminUser,
          solWallet,
          adminConfig,
          mint,
          tokenVault,
          systemProgram,
          tokenProgram,
          rent,
        })
        .rpc();

      const adminConfigData = await program.account.adminConfig.fetch(
        adminConfig
      );
      expect(adminConfigData.bumpAdminConfig).is.greaterThan(0);
      expect(adminConfigData.bumpMint).is.greaterThan(0);
      expect(adminConfigData.bumpTokenVault).is.greaterThan(0);
      expect(adminConfigData.bumpSolWallet).is.greaterThan(0);
      expect(adminConfigData.adminUser.toBase58(), "adminUser").to.equal(
        adminUser.toBase58()
      );
      expect(adminConfigData.indexAccount.toBase58(), "indexAccount").to.equal(
        indexAccount.toBase58()
      );
      expect(
        adminConfigData.solPriceAccount.toBase58(),
        "solPriceAccount"
      ).to.equal(solPriceAccount.toBase58());
    });

    it("Cannot be re-initialised by a malicious user", async () => {
      const maliciousUser = anchor.web3.Keypair.generate();
      assert.rejects(
        program.methods
          .initialise(indexAccount, solPriceAccount)
          .accounts({
            user: maliciousUser.publicKey,
            solWallet,
            adminConfig,
            mint,
            tokenVault,
            systemProgram,
            tokenProgram,
            rent,
          })
          .signers([maliciousUser])
          .rpc()
      );
    });
  });

  describe("invest", async () => {
    it("Exchanges user's SOL for newly minted index tokens", async () => {
      const lamports = new anchor.BN(anchor.web3.LAMPORTS_PER_SOL); // 1 SOL
      // fund user with some SOL
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(
          user.publicKey,
          5 * anchor.web3.LAMPORTS_PER_SOL
        ),
        "confirmed"
      );

      // token account should be created if it doesn't already exist
      const userTokenWallet = await getAssociatedTokenWallet(
        mint,
        user.publicKey
      );

      const solWalletBalance = await provider.connection.getBalance(
        solWallet,
        "confirmed"
      );
      const originalUserBalance = await provider.connection.getBalance(
        user.publicKey,
        "confirmed"
      );

      await program.methods
        .invest(lamports)
        .accounts({
          user: user.publicKey,
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
        .signers([user])
        .rpc();

      const newSolWalletBalance = await provider.connection.getBalance(
        solWallet
      );
      const newUserBalance = await provider.connection.getBalance(
        user.publicKey
      );
      const userTokenWalletData = await spl.getAccount(
        provider.connection,
        userTokenWallet,
        "processed",
        tokenProgram
      );
      const userTokenBalance = userTokenWalletData.amount;

      // SOL transferred to program
      expect(newSolWalletBalance.valueOf(), "newSolWalletBalance").to.equal(
        solWalletBalance + lamports.toNumber()
      );
      expect(newUserBalance, "newUserBalance").is.lessThan(originalUserBalance);
      // tokens minted to user
      expect(userTokenBalance, "userTokenBalance").to.equal(BigInt(100)); // TODO hardcoded
    });
  });

  describe("withdraw", async () => {
    it("Burns user's tokens in exchange for SOL", async () => {
      const userTokenWallet = await getAssociatedTokenWallet(
        mint,
        user.publicKey
      );
      const originalSolWalletBalance = await provider.connection.getBalance(
        solWallet,
        "processed"
      );
      const originalUserBalance = await provider.connection.getBalance(
        user.publicKey,
        "processed"
      );
      const originalUserTokenWalletData = await spl.getAccount(
        provider.connection,
        userTokenWallet,
        "processed",
        tokenProgram
      );
      const originalUserTokenBalance = originalUserTokenWalletData.amount;
      const originalMintData = await spl.getMint(
        provider.connection,
        mint,
        "processed",
        tokenProgram
      );
      const originalTokenSupply = originalMintData.supply;

      // TODO related to amount in last test
      const tokens = new anchor.BN(50); // number of tokens to withdraw

      await program.methods
        .withdraw(tokens)
        .accounts({
          user: user.publicKey,
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
        .signers([user])
        .rpc();

      const newUserTokenWalletData = await spl.getAccount(
        provider.connection,
        userTokenWallet,
        "processed",
        tokenProgram
      );
      const newUserTokenBalance = newUserTokenWalletData.amount;
      const newMintData = await spl.getMint(
        provider.connection,
        mint,
        "processed",
        tokenProgram
      );
      const newTokenSupply = newMintData.supply;
      const newSolWalletBalance = await provider.connection.getBalance(
        solWallet,
        "processed"
      );
      const newUserBalance = await provider.connection.getBalance(
        user.publicKey,
        "processed"
      );

      // tokens deducted from user and burned
      const tokensBurned = BigInt(tokens.toNumber());
      expect(
        originalUserTokenBalance - newUserTokenBalance,
        "tokenBalance"
      ).to.equal(tokensBurned);
      expect(originalTokenSupply - newTokenSupply, "tokenSupply").to.equal(
        tokensBurned
      );

      // payment sent to user's SOL wallet
      const paymentAmount = 100; // TODO hardcoded
      expect(newUserBalance - originalUserBalance, "newUserBalance").to.equal(
        paymentAmount
      );
      expect(
        originalSolWalletBalance - newSolWalletBalance,
        "newSolWalletBalance"
      ).to.equal(paymentAmount);
    });
  });
});
