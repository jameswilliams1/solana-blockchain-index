import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { expect } from "chai";
import { strict as assert } from "assert";
import { PublicKey } from "@solana/web3.js";
import { SolanaBlockchainIndex } from "../target/types/solana_blockchain_index";

describe("SolanaBlockchainIndex", async () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace
    .SolanaBlockchainIndex as Program<SolanaBlockchainIndex>;
  const provider = program.provider as anchor.AnchorProvider;

  const [indexValuePda, _] = await PublicKey.findProgramAddress(
    [
      anchor.utils.bytes.utf8.encode("index_value"),
      provider.wallet.publicKey.toBuffer(),
    ],
    program.programId
  );

  describe("initialise", async () => {
    it("Does not initialise PDA using incorrect address", async () => {
      const keypair = anchor.web3.Keypair.generate();
      assert.rejects(
        program.methods
          .initialise()
          .accounts({
            indexValue: keypair.publicKey, // does not match PDA
            user: provider.wallet.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .rpc()
      );
    });

    it("Initialises PDA using correct address", async () => {
      await program.methods
        .initialise()
        .accounts({
          indexValue: indexValuePda, // fixed value derived from programId and user.key()
          user: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      const indexValue = await program.account.indexValue.fetch(indexValuePda);
      expect(indexValue.bump).is.not.null; // should be initialised to use when updating later
    });
  });

  describe("updateIndexValue", async () => {
    it("Writes calculated index value and timestamp to account", async () => {
      console.log(
        `Requesting index calculation for existing account: ${indexValuePda} owned by user ${provider.wallet.publicKey}`
      );
      // set off new index calculation
      const tx = await program.methods
        .updateIndexValue()
        .accounts({
          indexValue: indexValuePda,
          user: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
          bnbAccount: "4CkQJBxhU8EZ2UjhigbtdaPbpTe6mqf811fipYBFbSYN",
          btcAccount: "GVXRSBjFk6e6J3NbVPXohDJetcTjaeeuykUpbQF8UoMU",
          dogeAccount: "FsSM3s38PX9K7Dn6eGzuE29S2Dsk1Sss1baytTQdCaQj",
          ethAccount: "JBu1AL4obBcCMqKBBxhpWCNUt136ijcuMZLFvTP7iWdB",
          ltcAccount: "8RMnV1eD55iqUFJLMguPkYBkq8DCtx81XcmAja93LvRR",
        })
        .rpc();
      console.log(`Calculation finished. Transaction signature: ${tx}`);

      // verify result
      console.log(`Fetching account: ${indexValuePda}`);
      const indexValue = await program.account.indexValue.fetch(indexValuePda);
      console.log(
        `Account contents:\n\tprice: ${indexValue.price}\n\texpo: ${indexValue.expo}\n\tconf: ${indexValue.conf}\n\ttime: ${indexValue.time}`
      );
      expect(indexValue.time).is.instanceOf(anchor.BN);
      expect(indexValue.price.toNumber()).to.equal(634453012372);
      expect(indexValue.conf.toNumber()).to.equal(204991922);
      expect(indexValue.expo).to.equal(-8);
    });
  });
});
