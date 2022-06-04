/**
 * Update the index value on the Solana DevNet.
 *
 * Must set env var ANCHOR_WALLET to wallet path before calling.
 */
import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { SolanaBlockchainIndex } from "./idl/solana_blockchain_index";

const main = async () => {
  anchor.setProvider(
    anchor.AnchorProvider.local("https://api.devnet.solana.com")
  );

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

  // PDA should be initialised already
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
      // devnet addresses
      bnbAccount: "GwzBgrXb4PG59zjce24SF2b9JXbLEjJJTBkmytuEZj1b",
      btcAccount: "HovQMDrbAgAYPCmHVSrezcSmkMtXSSUsLDFANExrZh2J",
      dogeAccount: "4L6YhY8VvUgmqG5MvJkUJATtzB2rFqdrJwQCmFLv4Jzy",
      ethAccount: "EdVCmQ9FSPcVe5YySXDPCRmc8aDQLKJ9xvYBMZPie1Vw",
      ltcAccount: "BLArYBCUYhdWiY8PCUTpvFE21iaJq85dvxLk9bYMobcU",
    })
    .rpc();
  console.log(`Calculation finished. Transaction signature: ${tx}`);
  console.log(`Fetching account: ${indexValuePda}`);
  const indexValue = await program.account.indexValue.fetch(indexValuePda);
  console.log(
    `Account contents:\n\tprice: ${indexValue.price}\n\texpo: ${indexValue.expo}\n\tconf: ${indexValue.conf}\n\ttime: ${indexValue.time}`
  );
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
