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
    console.log(
      `Requesting index calculation for new account: ${keypair.publicKey} owned by user ${programProvider.wallet.publicKey}`
    );
    // set off new index calculation
    const tx = await program.methods
      .updateIndexValue()
      .accounts({
        indexValue: keypair.publicKey,
        user: programProvider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        btcAccount: "GVXRSBjFk6e6J3NbVPXohDJetcTjaeeuykUpbQF8UoMU",
        ethAccount: "JBu1AL4obBcCMqKBBxhpWCNUt136ijcuMZLFvTP7iWdB",
      })
      .signers([keypair])
      .rpc();
    console.log(`Calculation finished. Transaction signature: ${tx}`);

    // verify result
    console.log(`Fetching account: ${keypair.publicKey}`);
    const indexValue = await program.account.indexValue.fetch(
      keypair.publicKey
    );
    console.log(
      `Account contents:\n\tprice: ${indexValue.price}\n\texpo: ${indexValue.expo}\n\tconf: ${indexValue.conf}\n\ttime: ${indexValue.time}`
    );
    expect(indexValue.time).is.instanceOf(anchor.BN);
    expect(indexValue.price.toNumber()).to.equal(1567878500000);
    expect(indexValue.conf.toNumber()).to.equal(512203289);
    expect(indexValue.expo).to.equal(-8);
  });
});
