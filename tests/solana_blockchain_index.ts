import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { expect } from "chai";
import { SolanaBlockchainIndex } from "../target/types/solana_blockchain_index";

describe("SolanaBlockchainIndex", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace
    .SolanaBlockchainIndex as Program<SolanaBlockchainIndex>;
  const programProvider = program.provider as anchor.AnchorProvider;

  it("Writes calculated index value and timestamp to account", async () => {
    const keypair = anchor.web3.Keypair.generate();

    // set off new index calculation
    const tx = await program.methods
      .updateIndexValue()
      .accounts({
        indexValue: keypair.publicKey,
        user: programProvider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([keypair])
      .rpc();
    console.log("Transaction signature", tx);

    // verify result
    const indexValue = await program.account.indexValue.fetch(
      keypair.publicKey
    );
    console.log(indexValue);
    expect(indexValue.value).to.equal(0.0);
    expect(indexValue.timestamp).is.instanceOf(anchor.BN);
  });
});
