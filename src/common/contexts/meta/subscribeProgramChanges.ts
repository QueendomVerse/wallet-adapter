import { Connection } from "@solana/web3.js";

import { notifyDisconnected, asyncEnsureRpcConnection } from "../..";
import { ProcessAccountsFunc } from ".";
import { toPublicKey, StringPublicKey } from "../../utils";
import { makeSetter } from "./loadAccounts";
import { onChangeAccount } from "./onChangeAccount";
import { getEmptyMetaState } from "./getEmptyMetaState";
import { MetaState, UpdateStateValueFunc } from "./types";

interface ProgramListener {
  programId: StringPublicKey;
  processAccount: ProcessAccountsFunc;
}

export const subscribeProgramChanges = async (
  connection: Connection,
  patchState: (state: Partial<MetaState>) => void,
  ...args: ProgramListener[]
) => {
  // console.warn('func: subscribeProgramChanges');
  if (!connection) notifyDisconnected();
  const updateStateValue: UpdateStateValueFunc = (prop, key, value) => {
    const state = getEmptyMetaState();
    makeSetter(state)(prop, key, value);
    patchState(state);
  };

  let listeners = args.map(({ programId, processAccount }) => {
    // console.dir(connection)
    const listenerId = connection.onProgramAccountChange(
      toPublicKey(programId),
      onChangeAccount(processAccount, updateStateValue)
    );

    console.info(
      `listening to program changes for ${programId} with listener ${listenerId}`
    );

    return listenerId;
  });

  return async () => {
    // listeners.forEach(subscriptionId => {
    listeners.forEach(async (subscriptionId) => {
      // connection.removeProgramAccountChangeListener(subscriptionId);
      await (
        await asyncEnsureRpcConnection(connection)
      ).removeProgramAccountChangeListener(subscriptionId);
    });

    listeners = [];

    console.info("All listeners closed", listeners.length);
  };
};
