import React from 'react';
import { Typography } from 'antd';
import { shortenSolanaAddress } from '@web';
import type { PublicKey } from '@solana/web3.js';

export const ExplorerLink = (props: { address: string | PublicKey; type: string; code?: boolean; length?: number }) => {
    const { type, code } = props;

    const address = typeof props.address === 'string' ? props.address : props.address?.toBase58();

    if (!address) {
        return null;
    }

    const length = props.length ?? 9;

    return (
        <a
            href={`https://explorer.solana.com/${type}/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            title={address}
        >
            {code ? (
                <Typography.Text code>{shortenSolanaAddress(address, length)}</Typography.Text>
            ) : (
                shortenSolanaAddress(address, length)
            )}
        </a>
    );
};
