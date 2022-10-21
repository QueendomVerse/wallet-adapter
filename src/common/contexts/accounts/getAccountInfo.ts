import { AccountInfo, Connection, PublicKey } from "@solana/web3.js";

import { notify, asyncEnsureRpcConnection } from "../..";

import { StringPublicKey } from "../../utils/ids";

export const getAccountInfo = async (
  connection: Connection,
  key: StringPublicKey
) => {
  try {
    const account = await (
      await asyncEnsureRpcConnection(connection)
    ).getAccountInfo(new PublicKey(key));
    if (!account) {
      return null;
    }
    const { data, ...rest } = account;

    return {
      ...rest,
      data,
    } as AccountInfo<Buffer>;
  } catch (error) {
    console.error(error);
    notify({
      message: "Network",
      description: "Failed connecting to Chain",
      type: "error",
    });
  }
};
