export class NearError extends Error {
    public error?: Error;

    constructor(message?: string, error?: Error) {
        super(message);
        this.error = error;
    }
}

export class ConnectionError extends NearError {
    name = 'ConnectionError';
}

export class UnknownError extends NearError {
    name = 'UnknownError';
}
