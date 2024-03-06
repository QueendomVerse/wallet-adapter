import { MintLayout, AccountLayout } from '@solana/spl-token';
import { SystemProgram, Keypair } from '@solana/web3.js';

export type WalletSigner = Pick<
    SolanaAdapter,
    'publicKey' | 'sendTransaction'
>;

import type { SolanaConnection  } from '@mindblox-wallet-adapter/base';
import { SolanaPublicKey, SolanaTransaction, WalletNotConnectedError } from '@mindblox-wallet-adapter/base';
import type { SolanaAdapter } from '../providers';
import { AuthorityType,
    createInitializeAccountInstruction,
    createInitializeMintInstruction,
    createMintToInstruction,
    createSetAuthorityInstruction
} from '@solana/spl-token';


export const mintNFT = async (
    connection: SolanaConnection,
    wallet: WalletSigner,
    // SOL account
    owner: SolanaPublicKey
) => {
    if (!wallet.publicKey) throw new WalletNotConnectedError();

    const TOKEN_PROGRAM_ID = new SolanaPublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
    //const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new SolanaPublicKey(
    //  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
    //);
    const mintAccount = new Keypair();
    const tokenAccount = new Keypair();

    // Allocate memory for the account
    const mintRent = await connection.getMinimumBalanceForRentExemption(MintLayout.span);

    const accountRent = await connection.getMinimumBalanceForRentExemption(AccountLayout.span);

    const transaction = new SolanaTransaction();
    const signers = [mintAccount, tokenAccount];
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    transaction.add(
        SystemProgram.createAccount({
            fromPubkey: wallet.publicKey,
            newAccountPubkey: mintAccount.publicKey,
            lamports: mintRent,
            space: MintLayout.span,
            programId: TOKEN_PROGRAM_ID,
        })
    );

    transaction.add(
        SystemProgram.createAccount({
            fromPubkey: wallet.publicKey,
            newAccountPubkey: tokenAccount.publicKey,
            lamports: accountRent,
            space: AccountLayout.span,
            programId: TOKEN_PROGRAM_ID,
        })
    );

    transaction.add(
        createInitializeMintInstruction(mintAccount.publicKey, 0, wallet.publicKey, wallet.publicKey, TOKEN_PROGRAM_ID)
    );
    transaction.add(
        createInitializeAccountInstruction(mintAccount.publicKey, tokenAccount.publicKey, owner, TOKEN_PROGRAM_ID)
    );
    transaction.add(
        createMintToInstruction(
            mintAccount.publicKey,
            tokenAccount.publicKey,
            wallet.publicKey,
            1,
            [],
            TOKEN_PROGRAM_ID,
        )
    );
    transaction.add(
        createSetAuthorityInstruction(
            mintAccount.publicKey,
            wallet.publicKey,
            AuthorityType.MintTokens,
            null,
            [],
            TOKEN_PROGRAM_ID,
        )
    );

    transaction.feePayer = wallet.publicKey;
    if (signers.length > 0) {
        transaction.partialSign(...signers);
    }
    const signature = await wallet.sendTransaction(transaction, connection);
    console.log(`SolanaTransaction signature: ${signature}`);
    const isVerifiedSignature = transaction.verifySignatures();
    console.log(`The signatures were verifed: ${isVerifiedSignature}`);
    const rawTransaction = transaction.serialize();
    const options = {
        skipPreflight: true,
        commitment: 'singleGossip',
    };

    const txid = await connection.sendRawTransaction(rawTransaction, options);

    return { txid, mint: mintAccount.publicKey, account: tokenAccount.publicKey };
};
