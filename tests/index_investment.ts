import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { expect } from "chai";
import { strict as assert } from "assert";
import { PublicKey } from "@solana/web3.js";
import { IndexInvestment } from "../target/types/index_investment";
import * as spl from "@solana/spl-token";

describe("IndexInvestment", async () => {
  // configure the client to use the local cluster
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.IndexInvestment as Program<IndexInvestment>;
  const provider = program.provider as anchor.AnchorProvider;
  const systemProgram = anchor.web3.SystemProgram.programId;
  const indexAccount = new PublicKey(
    "A6TEiAdXTR81YjwKQ23v4m8gZShXgbE9r2j4s5i5R9u4"
  );
  const adminUser = provider.wallet.publicKey;
  const solWallet = anchor.web3.Keypair.generate().publicKey; // TODO should be PDA controlled
  const solPriceAccount = anchor.web3.Keypair.generate().publicKey; // TODO use actual account

  // find all PDAs
  const [adminConfigPda, _] = await PublicKey.findProgramAddress(
    [anchor.utils.bytes.utf8.encode("admin_config")],
    program.programId
  );
  const [mintPda, __] = await PublicKey.findProgramAddress(
    [anchor.utils.bytes.utf8.encode("mint")],
    program.programId
  );
  const [tokenVaultPda, ___] = await PublicKey.findProgramAddress(
    [anchor.utils.bytes.utf8.encode("token_vault")],
    program.programId
  );

  describe("initialiseAdminConfig", async () => {
    it("Cannot be initialised using an incorrect address", async () => {
      const incorrectAdminPda = anchor.web3.Keypair.generate();
      assert.rejects(
        program.methods
          .initialise()
          .accounts({
            user: adminUser,
            solWallet,
            indexAccount,
            solPriceAccount,
            adminConfig: incorrectAdminPda.publicKey,
            mint: mintPda,
            tokenVault: tokenVaultPda,
            systemProgram,
            tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          })
          .rpc()
      );
    });

    it("Can be initialised once using the correct address", async () => {
      await program.methods
        .initialise()
        .accounts({
          user: adminUser,
          solWallet,
          indexAccount,
          solPriceAccount,
          adminConfig: adminConfigPda,
          mint: mintPda,
          tokenVault: tokenVaultPda,
          systemProgram,
          tokenProgram: spl.TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      const adminConfig = await program.account.adminConfig.fetch(
        adminConfigPda
      );
      expect(adminConfig.bumpAdminConfig).is.not.null;
      expect(adminConfig.bumpMint).is.not.null;
      expect(adminConfig.bumpTokenVault).is.not.null;
      expect(adminConfig.adminUser.toBase58(), "adminUser").to.equal(
        adminUser.toBase58()
      );
      expect(adminConfig.solWallet.toBase58(), "solWallet").to.equal(
        solWallet.toBase58()
      );

      expect(adminConfig.indexAccount.toBase58(), "indexAccount").to.equal(
        indexAccount.toBase58()
      );
      expect(
        adminConfig.solPriceAccount.toBase58(),
        "solPriceAccount"
      ).to.equal(solPriceAccount.toBase58());
    });

    it("Cannot be re-initialised by a malicious user", async () => {
      const maliciousUser = anchor.web3.Keypair.generate();
      assert.rejects(
        program.methods
          .initialise()
          .accounts({
            user: maliciousUser.publicKey,
            solWallet: maliciousUser.publicKey,
            indexAccount,
            solPriceAccount,
            adminConfig: adminConfigPda,
            mint: mintPda,
            tokenVault: tokenVaultPda,
            systemProgram,
            tokenProgram: spl.TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          })
          .signers([maliciousUser])
          .rpc()
      );
    });
  });

  describe("invest", async () => {
    it("Exchanges user's SOL for newly minted index tokens", async () => {
      const lamports = new anchor.BN(anchor.web3.LAMPORTS_PER_SOL); // 1 SOL
      const user = anchor.web3.Keypair.generate();
      // fund user with some SOL
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(
          user.publicKey,
          5 * anchor.web3.LAMPORTS_PER_SOL
        ),
        "confirmed"
      );

      // token account should be created if it doesn't already exist
      let userTokenWalletAddress = await spl.getAssociatedTokenAddress(
        mintPda,
        user.publicKey,
        false,
        spl.TOKEN_PROGRAM_ID,
        anchor.utils.token.ASSOCIATED_PROGRAM_ID
      );

      const solWalletBalance = await provider.connection.getBalance(
        solWallet,
        "confirmed"
      );
      const userBalance = await provider.connection.getBalance(
        user.publicKey,
        "confirmed"
      );

      await program.methods
        .invest(lamports)
        .accounts({
          user: user.publicKey,
          userTokenWallet: userTokenWalletAddress,
          solWallet: solWallet,
          indexAccount,
          solPriceAccount,
          adminConfig: adminConfigPda,
          mint: mintPda,
          tokenVault: tokenVaultPda,
          systemProgram,
          tokenProgram: spl.TOKEN_PROGRAM_ID,
          associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([user])
        .rpc();

      const newSolWalletBalance = await provider.connection.getBalance(
        solWallet
      );
      const newUserBalance = await provider.connection.getBalance(
        user.publicKey
      );
      const userTokenWallet = await spl.getAccount(
        provider.connection,
        userTokenWalletAddress,
        "processed",
        spl.TOKEN_PROGRAM_ID
      );
      const userTokenBalance = userTokenWallet.amount;

      // SOL transferred to program
      expect(newSolWalletBalance.valueOf(), "newSolWalletBalance").to.equal(
        solWalletBalance + lamports.toNumber()
      );
      expect(newUserBalance.valueOf(), "newUserBalance").is.lessThan(
        userBalance.valueOf()
      );
      // tokens minted to user
      expect(userTokenBalance, "userTokenBalance").to.equal(BigInt(100)); // TODO hardcoded
    });
  });
});
