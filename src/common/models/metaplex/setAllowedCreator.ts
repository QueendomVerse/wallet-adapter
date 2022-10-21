import { SYSVAR_RENT_PUBKEY, TransactionInstruction } from "@solana/web3.js";
import { serialize } from "borsh";

import { getAllowedCreator, SCHEMA, SetAllowedCreatorArgs } from ".";
import { emptyKey } from "../../constants";
import { programIds, StringPublicKey, toPublicKey } from "../../utils";

export async function setAllowedCreator(
  creator: StringPublicKey,
  activated: boolean,
  admin: StringPublicKey,
  payer: StringPublicKey,
  instructions: TransactionInstruction[]
) {
  const PROGRAM_IDS = programIds();
  const store = PROGRAM_IDS.store;
  if (!store) {
    throw new Error("Store not initialized");
  }

  const allowedCreatorPDAKey = await getAllowedCreator(creator);

  const value = new SetAllowedCreatorArgs({ activated });
  const data = Buffer.from(serialize(SCHEMA, value));

  const keys = [
    {
      pubkey: allowedCreatorPDAKey
        ? toPublicKey(allowedCreatorPDAKey)
        : emptyKey,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: toPublicKey(admin),
      isSigner: true,
      isWritable: false,
    },
    {
      pubkey: toPublicKey(payer),
      isSigner: true,
      isWritable: false,
    },
    {
      pubkey: toPublicKey(creator),
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: store,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: PROGRAM_IDS.system,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
  ];

  instructions.push(
    new TransactionInstruction({
      keys,
      programId: toPublicKey(PROGRAM_IDS.metaplex),
      data,
    })
  );
}
