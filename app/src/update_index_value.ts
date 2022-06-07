/**
 * Update the index value on the Blockchain.
 *
 * Must set env vars:
 *   ANCHOR_WALLET wallet path
 *   CLUSTER_URL e.g. https://api.devnet.solana.com
 *
 * Args:
 *   --init also initialise the index account for the first time
 */
import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { SolanaBlockchainIndex } from "./idl/solana_blockchain_index";

const urlToAccounts = {
  "http://localhost:8899": {
    bnbAccount: "4CkQJBxhU8EZ2UjhigbtdaPbpTe6mqf811fipYBFbSYN",
    btcAccount: "GVXRSBjFk6e6J3NbVPXohDJetcTjaeeuykUpbQF8UoMU",
    dogeAccount: "FsSM3s38PX9K7Dn6eGzuE29S2Dsk1Sss1baytTQdCaQj",
    ethAccount: "JBu1AL4obBcCMqKBBxhpWCNUt136ijcuMZLFvTP7iWdB",
    ltcAccount: "8RMnV1eD55iqUFJLMguPkYBkq8DCtx81XcmAja93LvRR",
  },
  "https://api.devnet.solana.com": {
    bnbAccount: "GwzBgrXb4PG59zjce24SF2b9JXbLEjJJTBkmytuEZj1b",
    btcAccount: "HovQMDrbAgAYPCmHVSrezcSmkMtXSSUsLDFANExrZh2J",
    dogeAccount: "4L6YhY8VvUgmqG5MvJkUJATtzB2rFqdrJwQCmFLv4Jzy",
    ethAccount: "EdVCmQ9FSPcVe5YySXDPCRmc8aDQLKJ9xvYBMZPie1Vw",
    ltcAccount: "BLArYBCUYhdWiY8PCUTpvFE21iaJq85dvxLk9bYMobcU",
  },
};

async function main() {
  const clusterUrl = process.env.CLUSTER_URL;
  anchor.setProvider(anchor.AnchorProvider.local(clusterUrl));
  const priceAccounts = urlToAccounts[clusterUrl];

  const program = anchor.workspace
    .SolanaBlockchainIndex as Program<SolanaBlockchainIndex>;
  const provider = program.provider as anchor.AnchorProvider;

  const user = provider.wallet.publicKey;
  const systemProgram = anchor.web3.SystemProgram.programId;
  const [indexValue, _] = await PublicKey.findProgramAddress(
    [anchor.utils.bytes.utf8.encode("index_value"), user.toBuffer()],
    program.programId
  );

  // init index account
  if (process.argv.includes("--init")) {
    console.log(`Creating new index account ${indexValue}`);
    const tx = await program.methods
      .initialise()
      .accounts({
        indexValue,
        user,
        systemProgram,
      })
      .rpc();
    console.log(`Transaction signature: ${tx}`);
  }

  // actual index update
  console.log(
    `Performing index calculation for account ${indexValue} owned by user ${user}`
  );
  // set off new index calculation
  const tx = await program.methods
    .updateIndexValue()
    .accounts({
      indexValue,
      user,
      systemProgram,
      ...priceAccounts,
    })
    .rpc();
  console.log(`Transaction signature: ${tx}`);
  const indexValueData = await program.account.indexValue.fetch(indexValue);
  console.log(
    `Contents of account ${indexValue}:
    \tprice: ${indexValueData.price}
    \texpo: ${indexValueData.expo}
    \tconf: ${indexValueData.conf}
    \ttime: ${indexValueData.time}`
  );
  console.log("SUCCESS\n");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
