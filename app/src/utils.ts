import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import * as spl from "@solana/spl-token";
export async function getPda(
  seed: string,
  systemProgram: PublicKey
): Promise<PublicKey> {
  const [pda, _] = await PublicKey.findProgramAddress(
    [anchor.utils.bytes.utf8.encode(seed)],
    systemProgram
  );
  return pda;
}

export async function getAssociatedTokenWallet(
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
