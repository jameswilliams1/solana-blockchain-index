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
  const user = provider.wallet.publicKey;
  const systemProgram = anchor.web3.SystemProgram.programId;
  const indexAccount = anchor.web3.Keypair.generate().publicKey;
  const solPriceAccount = anchor.web3.Keypair.generate().publicKey;
  const solWallet = anchor.web3.Keypair.generate().publicKey;

  // find all PDAs
  const [adminConfigPda, _] = await PublicKey.findProgramAddress(
    [anchor.utils.bytes.utf8.encode("admin_config")],
    program.programId
  );
  const [mintPda, __] = await PublicKey.findProgramAddress(
    [anchor.utils.bytes.utf8.encode("mint")],
    program.programId
  );

  describe("initialiseAdminConfig", async () => {
    it("Cannot be initialised using an incorrect address", async () => {
      const incorrectAdminPda = anchor.web3.Keypair.generate();
      assert.rejects(
        program.methods
          .initialise()
          .accounts({
            user,
            solWallet,
            indexAccount,
            solPriceAccount,
            adminConfig: incorrectAdminPda.publicKey,
            mint: mintPda,
            systemProgram,
            tokenProgram: spl.TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          })
          .rpc()
      );
    });

    it("Can be initialised once using the correct address", async () => {
      await program.methods
        .initialise()
        .accounts({
          user,
          solWallet,
          indexAccount,
          solPriceAccount,
          adminConfig: adminConfigPda,
          mint: mintPda,
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
      expect(adminConfig.adminUser.toBase58(), "adminUser").to.equal(
        user.toBase58()
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
            solWallet,
            indexAccount,
            solPriceAccount,
            adminConfig: adminConfigPda,
            mint: mintPda,
            systemProgram,
            tokenProgram: spl.TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          })
          .rpc()
      );
    });
  });
});
