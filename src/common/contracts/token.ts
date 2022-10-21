import {
  Connection,
  PublicKey,
  Transaction,
  Account,
  SystemProgram,
} from "@solana/web3.js";
import { MintLayout, AccountLayout, Token } from "@solana/spl-token";

import { notifyDisconnected, WalletPublicKeyError, WalletSigner } from "..";

import { asyncEnsureRpcConnection } from "../utils";

export const mintNFT = async (
  connection: Connection,
  walletSigner: WalletSigner,
  // SOL account
  owner: PublicKey
) => {
  if (!connection) notifyDisconnected();

  if (!walletSigner.publicKey)
    throw new WalletPublicKeyError("Wallet Public Keys Not Defined!");

  const TOKEN_PROGRAM_ID = new PublicKey(
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
  );
  //const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new PublicKey(
  //  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
  //);
  const mintAccount = new Account();
  const tokenAccount = new Account();

  // Allocate memory for the account
  const mintRent = await (
    await asyncEnsureRpcConnection(connection)
  ).getMinimumBalanceForRentExemption(MintLayout.span);

  const accountRent = await (
    await asyncEnsureRpcConnection(connection)
  ).getMinimumBalanceForRentExemption(AccountLayout.span);

  const transaction = new Transaction();
  const signers = [mintAccount, tokenAccount];
  transaction.recentBlockhash = (
    await (await asyncEnsureRpcConnection(connection)).getLatestBlockhash("max")
  ).blockhash;

  transaction.add(
    SystemProgram.createAccount({
      fromPubkey: walletSigner.publicKey,
      newAccountPubkey: mintAccount.publicKey,
      lamports: mintRent,
      space: MintLayout.span,
      programId: TOKEN_PROGRAM_ID,
    })
  );

  transaction.add(
    SystemProgram.createAccount({
      fromPubkey: walletSigner.publicKey,
      newAccountPubkey: tokenAccount.publicKey,
      lamports: accountRent,
      space: AccountLayout.span,
      programId: TOKEN_PROGRAM_ID,
    })
  );

  transaction.add(
    Token.createInitMintInstruction(
      TOKEN_PROGRAM_ID,
      mintAccount.publicKey,
      0,
      walletSigner.publicKey,
      walletSigner.publicKey
    )
  );
  transaction.add(
    Token.createInitAccountInstruction(
      TOKEN_PROGRAM_ID,
      mintAccount.publicKey,
      tokenAccount.publicKey,
      owner
    )
  );
  transaction.add(
    Token.createMintToInstruction(
      TOKEN_PROGRAM_ID,
      mintAccount.publicKey,
      tokenAccount.publicKey,
      walletSigner.publicKey,
      [],
      1
    )
  );
  transaction.add(
    Token.createSetAuthorityInstruction(
      TOKEN_PROGRAM_ID,
      mintAccount.publicKey,
      null,
      "MintTokens",
      walletSigner.publicKey,
      []
    )
  );

  transaction.setSigners(
    walletSigner.publicKey,
    ...signers.map((s) => s.publicKey)
  );
  if (signers.length > 0) {
    transaction.partialSign(...signers);
  }
  const signature = await walletSigner.sendTransaction(transaction, connection);
  console.info(`Transaction signature: ${signature}`);
  const isVerifiedSignature = transaction.verifySignatures();
  console.info(`The signatures were verifed: ${isVerifiedSignature}`);
  const rawTransaction = transaction.serialize();
  const options = {
    skipPreflight: true,
    commitment: "singleGossip",
  };

  // const txid = await (await asyncEnsureRpcConnection(connection)).sendRawTransaction(rawTransaction, options);
  const txid = "dummy";

  return { txid, mint: mintAccount.publicKey, account: tokenAccount.publicKey };
};
