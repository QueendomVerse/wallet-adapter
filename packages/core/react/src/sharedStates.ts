import { useState } from 'react';

export const useShareableWalletConnectedState = () => {
    const [isWalletConnected, setIsWalletConnected] = useState<boolean>(false);
    console.debug(`>>> Setting wallet connection state: ${isWalletConnected}`);
    return {
        isWalletConnected,
        setIsWalletConnected,
    };
};
