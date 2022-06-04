import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { expect } from "chai";
import { strict as assert } from "assert";
import { PublicKey } from "@solana/web3.js";
import { IndexInvestment } from "../target/types/index_investment";

describe("IndexInvestment", async () => {
  // configure the client to use the local cluster
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.IndexInvestment as Program<IndexInvestment>;
  const provider = program.provider as anchor.AnchorProvider;

  // find the global admin config account address
  const [adminConfigPda, _] = await PublicKey.findProgramAddress(
    [anchor.utils.bytes.utf8.encode("admin_config")],
    program.programId
  );

  describe("initialiseAdminConfig", async () => {
    it("Cannot be initialised using an incorrect address", async () => {
      const incorrectAdminPda = anchor.web3.Keypair.generate();
      assert.rejects(
        program.methods
          .initialiseAdminConfig(provider.wallet.publicKey) // solWalletAddress
          .accounts({
            adminConfig: incorrectAdminPda.publicKey,
            user: provider.wallet.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .rpc()
      );
    });

    it("Can be initialised once using the correct address", async () => {
      const solWalletAddress = provider.wallet.publicKey;
      await program.methods
        .initialiseAdminConfig(solWalletAddress)
        .accounts({
          adminConfig: adminConfigPda,
          user: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      const adminConfig = await program.account.adminConfig.fetch(
        adminConfigPda
      );
      expect(adminConfig.bump).is.not.null;
      expect(adminConfig.solWalletAddress.toBase58()).equals(
        solWalletAddress.toBase58()
      );
    });

    it("Cannot be re-initialised by a malicious user", async () => {
      const maliciousUser = anchor.web3.Keypair.generate();
      assert.rejects(
        program.methods
          .initialiseAdminConfig(maliciousUser.publicKey)
          .accounts({
            adminConfig: adminConfigPda,
            user: maliciousUser.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .rpc()
      );
    });
  });
});
