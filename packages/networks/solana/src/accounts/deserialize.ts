import { SolanaPublicKey } from '@mindblox-wallet-adapter/base';
import type { MintInfo } from '@solana/spl-token';
import { AccountLayout, MintLayout, u64 } from '@solana/spl-token';

// TODO: expose in spl package
export const deserializeAccount = (data: Buffer) => {
    const accountInfo = AccountLayout.decode(data);
    accountInfo.mint = new SolanaPublicKey(accountInfo.mint);
    accountInfo.owner = new SolanaPublicKey(accountInfo.owner);
    accountInfo.amount = u64.fromBuffer(accountInfo.amount);

    if (accountInfo.delegateOption === 0) {
        accountInfo.delegate = null;
        accountInfo.delegatedAmount = new u64(0);
    } else {
        accountInfo.delegate = new SolanaPublicKey(accountInfo.delegate);
        accountInfo.delegatedAmount = u64.fromBuffer(accountInfo.delegatedAmount);
    }

    accountInfo.isInitialized = accountInfo.state !== 0;
    accountInfo.isFrozen = accountInfo.state === 2;

    if (accountInfo.isNativeOption === 1) {
        accountInfo.rentExemptReserve = u64.fromBuffer(accountInfo.isNative);
        accountInfo.isNative = true;
    } else {
        accountInfo.rentExemptReserve = null;
        accountInfo.isNative = false;
    }

    if (accountInfo.closeAuthorityOption === 0) {
        accountInfo.closeAuthority = null;
    } else {
        accountInfo.closeAuthority = new SolanaPublicKey(accountInfo.closeAuthority);
    }

    return accountInfo;
};

// TODO: expose in spl package
export const deserializeMint = (data: Buffer) => {
    if (data.length !== MintLayout.span) {
        throw new Error('Not a valid Mint');
    }

    const mintInfo = MintLayout.decode(data);

    if (mintInfo.mintAuthorityOption === 0) {
        mintInfo.mintAuthority = null;
    } else {
        mintInfo.mintAuthority = new SolanaPublicKey(mintInfo.mintAuthority);
    }

    mintInfo.supply = u64.fromBuffer(mintInfo.supply);
    mintInfo.isInitialized = mintInfo.isInitialized !== 0;

    if (mintInfo.freezeAuthorityOption === 0) {
        mintInfo.freezeAuthority = null;
    } else {
        mintInfo.freezeAuthority = new SolanaPublicKey(mintInfo.freezeAuthority);
    }

    return mintInfo as MintInfo;
};
