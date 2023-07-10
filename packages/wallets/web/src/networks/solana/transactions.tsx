import React from 'react';
import type {
    Keypair,
    Commitment,
    Connection,
    RpcResponseAndContext,
    SignatureStatus,
    SimulatedTransactionResponse,
    TransactionInstruction,
    TransactionSignature,
    Blockhash,
} from '@solana/web3.js';
import {
    Transaction,
    SendTransactionError,
    // FeeCalculator
} from '@solana/web3.js';

import {
    WalletError,
    WalletPublicKeyError,
    WalletNotActivatedError,
    WalletSignTransactionError,
} from '@mindblox-wallet-adapter/base';
import type { WalletContextState } from './hooks';

import { getTransactionInstructionError, isTransactionInstructionError } from './errors';

import { chunks, sleep } from './utils';
import { notify } from '@mindblox-wallet-adapter/react';
import { ExplorerLink } from '@mindblox-wallet-adapter/react';
import { asyncEnsureRpcConnection } from '@/utils';

interface BlockhashAndFeeCalculator {
    blockhash: Blockhash;
    // feeCalculator: FeeCalculator;
}

export const getErrorForTransaction = async (connection: Connection, txid: string) => {
    // wait for all confirmation before geting transaction
    // await (await asyncEnsureRpcConnection(connection)).confirmTransaction(txid, 'max');
    // const tx = await (await asyncEnsureRpcConnection(connection)).getParsedConfirmedTransaction(txid);
    const tx = await (await asyncEnsureRpcConnection(connection)).getParsedTransaction(txid);
    if (!tx) {
        throw new SendTransactionError('Transaction Id not returned!');
    }
    const sigs = tx.transaction.signatures;
    if (sigs.length < 1) {
        throw new SendTransactionError('No signatures found!');
    }
    const sig = sigs[0] as TransactionSignature;
    console.info(`tx: ${txid} sig: ${sig}`);

    const latestBlockHash = await (await asyncEnsureRpcConnection(connection)).getLatestBlockhash();
    await (
        await asyncEnsureRpcConnection(connection)
    ).confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: sig,
    });

    const errors: string[] = [];
    if (tx?.meta && tx.meta.logMessages) {
        tx.meta.logMessages.forEach((log) => {
            const regex = /Error: (.*)/gm;
            let m;
            while ((m = regex.exec(log)) !== null) {
                // This is necessary to avoid infinite loops with zero-width matches
                if (m.index === regex.lastIndex) {
                    regex.lastIndex++;
                }

                if (m.length > 1) {
                    errors.push(m[1]);
                }
            }
        });
    }

    return errors;
};

export enum SequenceType {
    Sequential,
    Parallel,
    StopOnFailure,
}

export const sendTransactionsWithManualRetry = async (
    connection: Connection,
    wallet: WalletContextState,
    instructions: TransactionInstruction[][],
    signers: Keypair[][]
) => {
    let stopPoint = 0;
    let tries = 0;
    let lastInstructionsLength: number | null = null;
    const toRemoveSigners: Record<number, boolean> = {};
    instructions = instructions.filter((instr, i) => {
        if (instr.length > 0) {
            return true;
        } else {
            toRemoveSigners[i] = true;
            return false;
        }
    });
    let filteredSigners = signers.filter((_, i) => !toRemoveSigners[i]);

    while (stopPoint < instructions.length && tries < 3) {
        instructions = instructions.slice(stopPoint, instructions.length);
        filteredSigners = filteredSigners.slice(stopPoint, filteredSigners.length);

        if (instructions.length === lastInstructionsLength) tries = tries + 1;
        else tries = 0;

        try {
            if (instructions.length === 1) {
                await sendTransactionWithRetry({
                    connection,
                    wallet,
                    instructions: instructions[0],
                    signers: filteredSigners[0],
                    commitment: 'single',
                });
                stopPoint = 1;
            } else {
                stopPoint = await sendTransactions(
                    connection,
                    wallet,
                    instructions,
                    filteredSigners,
                    SequenceType.StopOnFailure,
                    'single'
                );
            }
        } catch (error) {
            if (error instanceof Error) {
                console.error(error);
                throw new WalletError(error.message);
            } else {
                console.error(error);
                throw new WalletError(`Unknown error ${error}!`);
            }
        }
        console.warn(
            'Died on ',
            stopPoint,
            'retrying from instruction',
            instructions[stopPoint],
            'instructions length is',
            instructions.length
        );
        lastInstructionsLength = instructions.length;
    }
};

export const sendTransactionsInChunks = async (
    connection: Connection,
    wallet: WalletContextState,
    instructionSet: TransactionInstruction[][],
    signersSet: Keypair[][],
    sequenceType: SequenceType = SequenceType.Parallel,
    commitment: Commitment = 'singleGossip',
    timeout = 120000,
    batchSize: number
): Promise<number> => {
    if (!wallet.publicKey) throw new WalletPublicKeyError('Wallet Public Keys Not Defined!');
    let instructionsChunk: TransactionInstruction[][][] = [instructionSet];
    let signersChunk: Keypair[][][] = [signersSet];

    instructionsChunk = chunks(instructionSet, batchSize);
    signersChunk = chunks(signersSet, batchSize);

    for (let c = 0; c < instructionsChunk.length; c++) {
        const unsignedTxns: Transaction[] = [];

        for (let i = 0; i < instructionsChunk[c].length; i++) {
            const instructions = instructionsChunk[c][i];
            const signers = signersChunk[c][i];
            if (instructions.length === 0) {
                continue;
            }
            const transaction = new Transaction();
            const block = await (await asyncEnsureRpcConnection(connection)).getLatestBlockhash(commitment);

            instructions.forEach((instruction) => transaction.add(instruction));
            transaction.recentBlockhash = block.blockhash;

            transaction.feePayer = wallet.publicKey;
            if (signers.length > 0) {
                transaction.partialSign(...signers);
            }
            unsignedTxns.push(transaction);
        }

        if (!wallet.signAllTransactions) return -1;
        const signedTxns = await wallet.signAllTransactions(unsignedTxns);

        const breakEarlyObject = { breakEarly: false, i: 0 };
        console.info('Signed txns length', signedTxns.length, 'vs handed in length', instructionSet.length);
        for (let i = 0; i < signedTxns.length; i++) {
            const signedTxnPromise = sendSignedTransaction({
                connection,
                signedTransaction: signedTxns[i],
                timeout,
            });
            signedTxnPromise.catch((response) => {
                console.info(response);
                if (sequenceType === SequenceType.StopOnFailure) {
                    breakEarlyObject.breakEarly = true;
                    breakEarlyObject.i = i;
                }
            });

            try {
                await signedTxnPromise;
            } catch (e) {
                console.error('Caught failure', e);
                if (breakEarlyObject.breakEarly) {
                    // console.error('Died on ', breakEarlyObject.i);
                    // return breakEarlyObject.i; // Return the txn we failed on by index
                    throw new WalletError(`Died on: '${breakEarlyObject.i}'`);
                }
            }
        }
    }

    return instructionSet.length;
};

export const sendTransactions = async (
    connection: Connection,
    wallet: WalletContextState,
    instructionSet: TransactionInstruction[][],
    signersSet: Keypair[][],
    sequenceType: SequenceType = SequenceType.Parallel,
    commitment: Commitment = 'singleGossip',
    successCallback: (txid: string, ind: number) => void = (/*txid, ind*/) => {
        /* no-op */
    },
    failCallback: (reason: string, ind: number) => boolean = (/*txid, ind*/) => false,
    block?: BlockhashAndFeeCalculator
): Promise<number> => {
    if (!wallet.publicKey) throw new WalletPublicKeyError('Wallet Public Keys Not Defined!');

    const unsignedTxns: Transaction[] = [];

    if (!block) {
        block = await (await asyncEnsureRpcConnection(connection)).getLatestBlockhash(commitment);
    }

    for (let i = 0; i < instructionSet.length; i++) {
        const instructions = instructionSet[i];
        const signers = signersSet[i];

        if (instructions.length === 0) {
            continue;
        }

        const transaction = new Transaction();
        instructions.forEach((instruction) => transaction.add(instruction));
        transaction.recentBlockhash = block.blockhash;

        transaction.feePayer = wallet.publicKey;
        if (signers.length > 0) {
            transaction.partialSign(...signers);
        }

        unsignedTxns.push(transaction);
    }

    if (!wallet.signAllTransactions) return -1;
    const signedTxns = await wallet.signAllTransactions(unsignedTxns);

    const pendingTxns: Promise<{ txid: string; slot: number }>[] = [];

    const breakEarlyObject = { breakEarly: false, i: 0 };
    console.info('Signed txns length', signedTxns.length, 'vs handed in length', instructionSet.length);
    for (let i = 0; i < signedTxns.length; i++) {
        console.info(`signedTransaction ${i}: ${signedTxns[i]}`);
        const signedTxnPromise = sendSignedTransaction({
            connection,
            signedTransaction: signedTxns[i],
        });

        signedTxnPromise
            .then(({ txid /*slot*/ }) => {
                successCallback(txid, i);
            })
            .catch((response) => {
                console.warn(response);
                failCallback(String(signedTxns[i]), i);
                if (sequenceType === SequenceType.StopOnFailure) {
                    breakEarlyObject.breakEarly = true;
                    breakEarlyObject.i = i;
                }
            });

        if (sequenceType !== SequenceType.Parallel) {
            try {
                await signedTxnPromise;
            } catch (e) {
                console.error('Caught failure', e);
                if (breakEarlyObject.breakEarly) {
                    // console.error('Died on ', breakEarlyObject.i);
                    // return breakEarlyObject.i; // Return the txn we failed on by index
                    throw new WalletError(`Died on: '${breakEarlyObject.i}'`);
                }
            }
        } else {
            pendingTxns.push(signedTxnPromise);
        }
    }

    if (sequenceType !== SequenceType.Parallel) {
        await Promise.all(pendingTxns);
    }

    return signedTxns.length;
};

export const sendTransactionsWithRecentBlock = async (
    connection: Connection,
    wallet: WalletContextState,
    instructionSet: TransactionInstruction[][],
    signersSet: Keypair[][],
    commitment: Commitment = 'singleGossip'
): Promise<number> => {
    if (!wallet.publicKey) throw new WalletPublicKeyError('Wallet Public Keys Not Defined!');

    const unsignedTxns: Transaction[] = [];
    for (let i = 0; i < instructionSet.length; i++) {
        const instructions = instructionSet[i];
        const signers = signersSet[i];

        if (instructions.length === 0) {
            continue;
        }

        const block = await (await asyncEnsureRpcConnection(connection)).getLatestBlockhash(commitment);
        await sleep(1200);

        const transaction = new Transaction();
        instructions.forEach((instruction) => transaction.add(instruction));
        transaction.recentBlockhash = block.blockhash;

        transaction.feePayer = wallet.publicKey;
        if (signers.length > 0) {
            transaction.partialSign(...signers);
        }

        unsignedTxns.push(transaction);
    }
    if (!wallet.signAllTransactions) return -1;
    const signedTxns = await wallet.signAllTransactions(unsignedTxns);

    const breakEarlyObject = { breakEarly: false, i: 0 };
    console.info('Signed txns length', signedTxns.length, 'vs handed in length', instructionSet.length);
    for (let i = 0; i < signedTxns.length; i++) {
        const signedTxnPromise = sendSignedTransaction({
            connection,
            signedTransaction: signedTxns[i],
        });

        signedTxnPromise.catch(() => {
            breakEarlyObject.breakEarly = true;
            breakEarlyObject.i = i;
        });

        try {
            await signedTxnPromise;
        } catch (e) {
            console.error('Caught failure', e);
            if (breakEarlyObject.breakEarly) {
                // console.error('Died on ', breakEarlyObject.i);
                // return breakEarlyObject.i; // Return the txn we failed on by index
                throw new WalletError(`Died on: '${breakEarlyObject.i}'`);
            }
        }
    }

    return signedTxns.length;
};

export const sendTransaction = async (
    connection: Connection,
    wallet: WalletContextState,
    instructions: TransactionInstruction[],
    signers: Keypair[],
    awaitConfirmation = true,
    commitment: Commitment = 'singleGossip',
    includesFeePayer = false,
    block?: BlockhashAndFeeCalculator
) => {
    if (!wallet.publicKey) throw new WalletPublicKeyError('Wallet Public Keys Not Defined!');

    let transaction = new Transaction();
    instructions.forEach((instruction) => transaction.add(instruction));
    transaction.recentBlockhash = (
        block || (await (await asyncEnsureRpcConnection(connection)).getLatestBlockhash(commitment))
    ).blockhash;

    // if (includesFeePayer) {
    //   transaction.setSigners(...signers.map(s => s.publicKey));
    // } else {
    //   transaction.setSigners(
    //     // fee payed by the wallet owner
    //     wallet.publicKey,
    //     ...signers.map(s => s.publicKey),
    //   );
    // }
    // const feePayer = signers.map(s => s.public)
    // transaction.feePayer = (includesFeePayer) ? signers[0].publicKey : wallet.publicKey;
    //@ TODO: what are we doing here?
    console.info(
        'includesFeePayer?',
        includesFeePayer,
        signers.map((s) => s.publicKey)
    );
    transaction.feePayer = wallet.publicKey;
    if (signers.length > 0) {
        transaction.partialSign(...signers);
    }
    if (!includesFeePayer) {
        if (!wallet.signTransaction) {
            throw new WalletSignTransactionError('Unable to sign Transaction!');
        }
        transaction = await wallet.signTransaction(transaction);
    }

    const rawTransaction = transaction.serialize();
    const options = {
        skipPreflight: true,
        commitment,
    };

    // const txid = 'dummy';
    const txid = await (await asyncEnsureRpcConnection(connection)).sendRawTransaction(rawTransaction, options);
    let slot = 0;

    if (awaitConfirmation) {
        const confirmation = await awaitTransactionSignatureConfirmation(txid, DEFAULT_TIMEOUT, connection, commitment);
        console.info(`confirmation -->>> : ${confirmation}`);

        if (!confirmation) throw new WalletError('Timed out awaiting confirmation on transaction');
        slot = confirmation?.slot || 0;

        if (confirmation?.err) {
            const errors = await getErrorForTransaction(connection, txid);
            notify({
                message: 'Transaction failed...',
                description: (
                    <>
                        {errors.map((err) => (
                            <div key={err}>{err}</div>
                        ))}
                        <ExplorerLink address={txid} type="transaction" />
                    </>
                ),
                type: 'error',
            });

            throw new WalletError(`Raw transaction ${txid} failed (${JSON.stringify(status)})`);
        }
    }

    return { txid, slot };
};

export const sendTransactionWithRetry = async ({
    connection,
    wallet,
    instructions,
    signers,
    commitment = 'singleGossip',
    includesFeePayer = false,
    block,
    beforeSend,
}: {
    connection: Connection;
    wallet: WalletContextState;
    instructions: TransactionInstruction[];
    signers: Keypair[];
    commitment?: Commitment;
    includesFeePayer?: boolean;
    block?: BlockhashAndFeeCalculator;
    beforeSend?: (reason: string) => boolean;
}) => {
    if (!wallet) throw new WalletNotActivatedError('Wallet not connected!');
    if (!wallet.publicKey) throw new WalletPublicKeyError('Wallet Public Keys Not Defined!');

    console.debug(`signers: ${signers}`);

    console.debug(`sendTransactionWithRetry; wallet: ${wallet.publicKey}`);
    console.debug(`sendTransactionWithRetry; instructions: ${instructions}`);
    console.debug(`sendTransactionWithRetry; signers: ${signers.flat}`);
    console.debug(`sendTransactionWithRetry; commitment: ${commitment}`);
    console.debug(`sendTransactionWithRetry; includesFeePayer: ${includesFeePayer}`);

    let transaction = new Transaction({ feePayer: wallet.publicKey });
    instructions.forEach((instruction) => transaction.add(instruction));

    transaction.recentBlockhash = (
        block || (await (await asyncEnsureRpcConnection(connection)).getLatestBlockhash(commitment))
    ).blockhash;

    console.debug(`signedTransaction2; feePayer: ${transaction.feePayer}`);
    console.debug(`signedTransaction2; instructions:`, transaction.instructions);
    console.debug(`signedTransaction2; nonceInfo: ${transaction.nonceInfo}`);
    console.debug(`signedTransaction2; recentBlockhash: ${transaction.recentBlockhash}`);
    console.debug(`signedTransaction2; signature: ${transaction.signature}`);

    // if (includesFeePayer) {
    //   transaction.setSigners(...signers.map(s => s.publicKey));
    // } else {
    //   transaction.setSigners(
    //     // fee payed by the wallet owner
    //     wallet.publicKey,
    //     ...signers.map(s => s.publicKey),
    //   );
    // }
    //@TODO what are we doing here?
    console.info(
        'includesFeePayer?',
        includesFeePayer,
        signers.map((s) => s.publicKey)
    );
    transaction.feePayer = wallet.publicKey;
    if (signers.length > 0) {
        console.info('before partialSign', signers);
        signers.forEach((s) => console.info(s.publicKey.toBase58()));
        transaction.partialSign(...signers);
        console.info('after partialSign');
    }

    if (!includesFeePayer) {
        // console.info(`store paying for transaction?: ${wallet.publicKey}`);
        // transaction.feePayer = wallet.publicKey;
        if (!wallet.signTransaction) {
            throw new WalletSignTransactionError('Unable to sign Transaction!');
        }
        transaction = await wallet.signTransaction(transaction);
        console.info(`Transaction signature: ${transaction.signature?.toString()}`);
        console.info(transaction.signatures);

        const isVerifiedSignature = transaction.verifySignatures();
        console.info(`The signatures were verifed: ${isVerifiedSignature}`);

        console.info(`sendTransactionWithRetry; post-sign`);
    }

    console.info(`sendTransactionWithRetry; pre-beforeSend`);
    if (beforeSend) {
        console.info(`sendTransactionWithRetry; pre-beforeSend`);
        beforeSend(`sendTransactionWithRetry; pre-beforeSend`);
    }

    // if(!trx.signature) return;
    // let sgn = await (await asyncEnsureRpcConnection(connection)).sendRawTransaction(trx.serialize());
    // const res =  await (await asyncEnsureRpcConnection(connection)).confirmTransaction(sgn);
    const { txid, slot } = await sendSignedTransaction({
        connection,
        signedTransaction: transaction,
    });

    return { txid, slot };
};

export const getUnixTs = () => {
    return new Date().getTime() / 1000;
};

const DEFAULT_TIMEOUT = 60000; // default: 15000
// const DEFAULT_TIMEOUT = 16000; // default: 15000

export const sendSignedTransaction = async ({
    signedTransaction,
    connection,
    timeout = DEFAULT_TIMEOUT,
}: {
    signedTransaction: Transaction;
    connection: Connection;
    sendingMessage?: string;
    sentMessage?: string;
    successMessage?: string;
    timeout?: number;
}): Promise<{ txid: string; slot: number }> => {
    console.debug(`sendSignedTransaction; feePayer: ${signedTransaction.feePayer}`);
    console.debug(`sendSignedTransaction; instructions: ${signedTransaction.instructions}`);
    console.debug(`sendSignedTransaction; nonceInfo: ${signedTransaction.nonceInfo}`);
    console.debug(`sendSignedTransaction; recentBlockhash: ${signedTransaction.recentBlockhash}`);
    console.debug(`sendSignedTransaction; signature: ${signedTransaction.signature}`);

    const rawTransaction = signedTransaction.serialize();
    const startTime = getUnixTs();
    let slot = 0;
    // const txid = 'dummy';
    const txid: TransactionSignature = await (
        await asyncEnsureRpcConnection(connection)
    ).sendRawTransaction(rawTransaction, {
        skipPreflight: true,
    });

    console.debug(`Started awaiting confirmation for: '${txid}'`);

    let done = false;
    const startSendRawTransaction = async () => {
        // done = true;
        while (!done && getUnixTs() - startTime < timeout) {
            (await asyncEnsureRpcConnection(connection)).sendRawTransaction(rawTransaction, {
                skipPreflight: true,
            });
            await sleep(500);
        }
    };
    startSendRawTransaction();

    try {
        const confirmation = await awaitTransactionSignatureConfirmation(txid, timeout, connection, 'recent', true);

        console.info(`confirmation(${txid}:`, confirmation);
        if (!confirmation) throw new WalletError('Timed out awaiting confirmation on transaction');

        if (confirmation.err) {
            console.error(confirmation.err);
            throw new WalletError('Transaction failed: Custom instruction error');
        }

        slot = confirmation?.slot || 0;
    } catch (err) {
        if (!err) throw new WalletError('Timed out awaiting confirmation on transaction');
        console.error('Timeout Error caught', err);
        if (isTransactionInstructionError(err)) {
            throw new WalletError(`InstructionError: ${getTransactionInstructionError(err)}`);
        }
        if (typeof err === 'object' && 'timeout' in err) {
            throw new WalletError('Timed out awaiting confirmation on transaction');
        }
        let simulateResult: SimulatedTransactionResponse | null = null;
        try {
            simulateResult = (await simulateTransaction(connection, signedTransaction, 'single')).value;
        } catch (e) {
            throw new WalletError(`SimulateTransactionError: ${e}`);
        }
        if (simulateResult && simulateResult.err) {
            if (simulateResult.logs) {
                for (let i = simulateResult.logs.length - 1; i >= 0; --i) {
                    const line = simulateResult.logs[i];
                    if (line.startsWith('Program log: ')) {
                        throw new WalletError('Transaction failed: ' + line.slice('Program log: '.length));
                    }
                }
            }
            throw new WalletError(JSON.stringify(simulateResult.err));
        }
        // throw new WalletError('Transaction failed');
    } finally {
        done = true;
        console.debug(`Stopped sending transaction confirmation for: '${txid}'`);
    }

    console.info('Latency', txid, getUnixTs() - startTime);
    return { txid, slot };
};

const simulateTransaction = async (
    connection: Connection,
    transaction: Transaction,
    commitment: Commitment
): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> => {
    await (
        await asyncEnsureRpcConnection(connection)
    )
        .getLatestBlockhash()
        .then((response) => {
            transaction.recentBlockhash = response.blockhash;
        })
        .catch((error) => {
            throw new WalletError('failed to simulate transaction: ' + error.message);
        });

    // transaction.recentBlockhash = await (await asyncEnsureRpcConnection(connection))._recentBlockhash(

    //   (await asyncEnsureRpcConnection(connection))._disableBlockhashCaching,
    // );

    const signData = transaction.serializeMessage();
    // @ts-ignore
    const wireTransaction = transaction._serialize(signData);
    const encodedTransaction = wireTransaction.toString('base64');
    const config: any = { encoding: 'base64', commitment };
    const args = [encodedTransaction, config];

    // @ts-ignore
    const res = await (await asyncEnsureRpcConnection(connection))._rpcRequest('simulateTransaction', args);
    if (res.error) {
        throw new WalletError('failed to simulate transaction: ' + res.error.message);
    }
    return res.result;
};

const awaitTransactionSignatureConfirmation = async (
    txid: TransactionSignature,
    timeout: number,
    connection: Connection,
    commitment: Commitment = 'recent',
    queryStatus = false,
    delay = 5000
): Promise<SignatureStatus | null | void> => {
    let done = false;
    let status: SignatureStatus | null | void = {
        slot: 0,
        confirmations: 0,
        err: null,
    };
    let subId = 0;
    // eslint-disable-next-line no-async-promise-executor
    status = await new Promise(async (resolve, reject) => {
        try {
            subId = (await asyncEnsureRpcConnection(connection)).onSignature(
                txid,
                (result, context) => {
                    done = true;
                    status = {
                        err: result.err,
                        slot: context.slot,
                        confirmations: 0,
                    };
                    if (result.err) {
                        console.error('Rejected via websocket', result.err);
                        const msg = getTransactionInstructionError(result.err);
                        console.error('Chain Error: ', msg);
                        // reject(msg.message);
                        //@TODO what's going on here?
                        reject(`Transaction failed!: ${result.err?.toString()}`);
                    } else {
                        console.debug('Resolved via websocket', result);
                        resolve(status);
                    }
                },
                commitment
            );
        } catch (e) {
            done = true;
            // console.error('WS error in setup', txid, e);
            reject(`WS error in setup, ${txid}, ${e}`);
        }

        let attemptIter = 0;
        const attemptIterStop = timeout / delay;
        while (!done && queryStatus) {
            // eslint-disable-next-line no-loop-func
            (async () => {
                try {
                    const signatureStatuses = await (
                        await asyncEnsureRpcConnection(connection)
                    ).getSignatureStatuses([txid]);
                    // done = true;
                    // resolve(status);
                    //@ts-ignore
                    status = signatureStatuses && signatureStatuses.value[0];
                    if (!done) {
                        if (attemptIter > attemptIterStop) {
                            const errMsg = `'Timed out waiting for REST confirmations on, ${txid}, ${status}`;
                            console.error(errMsg);
                            done = true;
                            reject(errMsg);
                        } else if (!status) {
                            console.debug(
                                `REST null result for(${attemptIter}/${attemptIterStop}), ${txid}, ${status}`
                            );
                            attemptIter += 1;
                        } else if (status.err) {
                            console.error('REST error for', txid, status);
                            done = true;
                            reject(status.err);
                        } else if (!status.confirmations) {
                            console.warn('REST no confirmations for', txid, status);
                            resolve(status);
                            // reject(`REST no confirmations for: ${txid}, ${status}`);
                        } else {
                            console.info('REST confirmation for', txid, status);
                            done = true;
                            resolve(status);
                        }
                    }
                } catch (e) {
                    if (!done) {
                        // console.error('REST connection error: txid', txid, e);
                        reject(`REST connection error: txid, ${txid}, ${e}`);
                    }
                }
            })();
            console.debug(`delaying for ${delay} ms ...`);
            await sleep(delay);
        }
    });

    if (
        // @ts-ignore
        (await asyncEnsureRpcConnection(connection))._signatureSubscriptions &&
        // @ts-ignore
        (await asyncEnsureRpcConnection(connection))._signatureSubscriptions[subId]
    ) {
        (await asyncEnsureRpcConnection(connection)).removeSignatureListener(subId);
    }
    done = true;
    console.info('Returning status ', status);
    return status;
};
