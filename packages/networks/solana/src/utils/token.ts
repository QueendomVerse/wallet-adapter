import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

import { SolanaPublicKey } from '@mindblox-wallet-adapter/base';

const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID: SolanaPublicKey = new SolanaPublicKey(
    'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'
);

export const findAssociatedTokenAddress = async (
    walletAddress: SolanaPublicKey,
    tokenMintAddress: SolanaPublicKey
): Promise<SolanaPublicKey | undefined> => {
    try {
        const result = await SolanaPublicKey.findProgramAddress(
            [walletAddress.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), tokenMintAddress.toBuffer()],
            SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
        );
        return result?.[0];
    } catch (error) {
        console.error('Error finding associated token address:', error);
    }
};
