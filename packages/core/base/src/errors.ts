export class WalletError extends Error {
    public error: unknown;

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    constructor(msg?: string, error?: unknown) {
        super(msg);
        this.error = error;
    }
}

export class WalletNotReadyError extends WalletError {
    name = 'WalletNotReadyError';
}

export class WalletLoadError extends WalletError {
    name = 'WalletLoadError';
}

export class WalletActivationError extends WalletError {
    name = 'WalletActivationError';
}

export class WalletAdapterMountingError extends WalletError {
    name = 'WalletAdapterMountingError';
}

export class WalletConfigError extends WalletError {
    name = 'WalletConfigError';
}

export class WalletSelectionError extends WalletError {
    name = 'WalletSelectionError';
}

export class WalletConnectionError extends WalletError {
    name = 'WalletConnectionError';
}

export class WalletDisconnectedError extends WalletError {
    name = 'WalletDisconnectedError';
}

export class WalletDisconnectionError extends WalletError {
    name = 'WalletDisconnectionError';
}

export class WalletAccountError extends WalletError {
    name = 'WalletAccountError';
}

export class WalletPublicKeyError extends WalletError {
    name = 'WalletPublicKeyError';
}

export class WalletPrivateKeyError extends WalletError {
    name = 'WalletPrivateKeyError';
}

export class WalletKeypairError extends WalletError {
    name = 'WalletKeypairError';
}

export class WalletNotActivatedError extends WalletError {
    name = 'WalletNotActivatedError';
}

export class WalletAdapterNotMountedError extends WalletError {
    name = 'WalletAdapterNotMountedError';
}

export class WalletNotSelectedError extends WalletError {
    name = 'WalletSelectionError';
}

export class WalletNotConnectedError extends WalletError {
    name = 'WalletNotConnectedError';
}

export class WalletSendTransactionError extends WalletError {
    name = 'WalletSendTransactionError';
}

export class WalletSignMessageError extends WalletError {
    name = 'WalletSignMessageError';
}
export class WalletSignTransactionError extends WalletError {
    name = 'WalletSignTransactionError';
}

export class WalletTimeoutError extends WalletError {
    name = 'WalletTimeoutError';
}

export class WalletWindowBlockedError extends WalletError {
    name = 'WalletWindowBlockedError';
}

export class WalletWindowClosedError extends WalletError {
    name = 'WalletWindowClosedError';
}

export class WalletDatabaseError extends WalletError {
    name = 'WalletDatabaseError';
}

export const handleError = <T extends Error>(
    error: unknown,
    ErrorClass: new (msg?: string, error?: unknown) => T,
    message?: string
): never => {
    let msg = 'Unknown Error';
    if (error && typeof error === 'object' && 'msg' in error) {
        msg = `${message ? `${message}: ` : ''}${(error as { msg: string }).msg}`;
    }

    throw new ErrorClass(msg, error);
};

export const printError = <T extends Error>(
    error: unknown,
    ErrorClass: new (msg?: string, error?: unknown) => T,
    message?: string
): void => {
    let msg = 'Unknown Error';
    if (error && typeof error === 'object' && 'msg' in error) {
        msg = `${message ? `${message}: ` : ''}${(error as { msg: string }).msg}`;
    }
    console.error(new ErrorClass(msg));
};
