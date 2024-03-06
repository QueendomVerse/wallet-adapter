import { SolanaPublicKey } from '@mindblox-wallet-adapter/base';
import { AccountLayout, MintLayout } from '@solana/spl-token';
import { Numberu64 } from '@solana/spl-name-service';
import { emptyKey } from '../constants';

// TODO: expose in spl package
export const deserializeAccount = (data: Buffer) => {
    const accountInfo = AccountLayout.decode(data);
    accountInfo.mint = new SolanaPublicKey(accountInfo.mint);
    accountInfo.owner = new SolanaPublicKey(accountInfo.owner);
    accountInfo.amount = BigInt(Numberu64.fromBuffer(accountInfo.amount).toNumber());

    if (accountInfo.delegateOption === 0) {
        accountInfo.delegate = emptyKey;
        accountInfo.delegatedAmount = BigInt(0);
    } else {
        accountInfo.delegate = new SolanaPublicKey(accountInfo.delegate);
        // accountInfo.delegatedAmount = Numberu64.fromBuffer(accountInfo.delegatedAmount);
    }

    // accountInfo.isInitialized = accountInfo.state !== 0;
    // accountInfo.isFrozen = accountInfo.state === 2;

    if (accountInfo.isNativeOption === 1) {
        // accountInfo.rentExemptReserve = Numberu64.fromBuffer(accountInfo.isNative);
        accountInfo.isNative = BigInt(1);
    } else {
        // accountInfo.rentExemptReserve = null;
        accountInfo.isNative = BigInt(0);
    }

    if (accountInfo.closeAuthorityOption === 0) {
        accountInfo.closeAuthority = emptyKey;
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

    const mintAccount = MintLayout.decode(data);

    if (mintAccount.mintAuthorityOption === 0) {
        mintAccount.mintAuthority = emptyKey;
    } else {
        mintAccount.mintAuthority = new SolanaPublicKey(mintAccount.mintAuthority);
    }

    mintAccount.supply = BigInt(Numberu64.fromBuffer(mintAccount.supply).toNumber());

    if (mintAccount.freezeAuthorityOption === 0) {
        mintAccount.freezeAuthority = emptyKey;
    } else {
        mintAccount.freezeAuthority = new SolanaPublicKey(mintAccount.freezeAuthority);
    }

    return mintAccount;
};
