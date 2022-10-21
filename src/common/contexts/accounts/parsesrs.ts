import { AccountInfo } from "@solana/web3.js";
import { TokenAccount } from "../../models";
import { ParsedAccountBase } from "./types";
import { deserializeMint, deserializeAccount } from "./deserialize";
import { StringPublicKey } from "../../utils";

export const MintParser = (
  pubKey: StringPublicKey,
  info: AccountInfo<Buffer>
) => {
  // console.warn('func: MintParser');

  // console.info('MintParser: pubKey')
  // console.dir(pubKey)
  // console.info('MintParser: info')
  // console.dir(info)
  const buffer = Buffer.from(info.data);

  const data = deserializeMint(buffer);

  const details = {
    pubkey: pubKey,
    account: {
      ...info,
    },
    info: data,
  } as ParsedAccountBase;

  return details;
};

export const TokenAccountParser = (
  pubKey: StringPublicKey,
  info: AccountInfo<Buffer>
) => {
  // Sometimes a wrapped sol account gets closed, goes to 0 length,
  // triggers an update over wss which triggers this guy to get called
  // since your UI already logged that pubkey as a token account. Check for length.
  // console.warn('func: TokenAccountParser')

  // console.info('TokenAccountParser: pubKey')
  // console.dir(pubKey)
  // console.info('TokenAccountParser: info')
  // console.dir(info)

  if (info.data.length > 0) {
    const buffer = Buffer.from(info.data);
    const data = deserializeAccount(buffer);

    const details = {
      pubkey: pubKey,
      account: {
        ...info,
      },
      info: data,
    } as TokenAccount;

    return details;
  }
};

export const GenericAccountParser = (
  pubKey: StringPublicKey,
  info: AccountInfo<Buffer>
) => {
  // console.warn('func: GenericAccountParser')
  console.debug("MintParser: pubKey", pubKey);
  console.debug("MintParser: info", info);
  const buffer = Buffer.from(info.data);

  const details = {
    pubkey: pubKey,
    account: {
      ...info,
    },
    info: buffer,
  } as ParsedAccountBase;

  return details;
};
