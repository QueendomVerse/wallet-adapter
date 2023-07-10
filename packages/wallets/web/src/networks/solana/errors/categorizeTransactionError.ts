export enum TransactionErrorType {
    NotConfirmed = 'not-confirmed',
    Cancelled = 'cancelled',
    NodeBehind = 'node-behind',
    SignatureRequestDenied = 'signature-request-denied',
    InsufficientSOL = 'insufficient-sol',
    BlockhashNotFound = 'blockhash-not-found',
}

export const categorizeTransactionError = (msg: string): TransactionErrorType | null => {
    const error = [
        ['Transaction was not confirmed in', TransactionErrorType.NotConfirmed],
        ['Transaction cancelled', TransactionErrorType.Cancelled],
        ['failed to send transaction: Node is behind by', TransactionErrorType.NodeBehind],
        ['Signature request denied', TransactionErrorType.SignatureRequestDenied],
        ['Insufficient SOL balance', TransactionErrorType.InsufficientSOL],
        ['Blockhash not found', TransactionErrorType.BlockhashNotFound],
    ].find(([e]) => msg.startsWith(e as string) || msg === e || msg.endsWith(e as string));

    return error ? (error[1] as TransactionErrorType) : null;
};
