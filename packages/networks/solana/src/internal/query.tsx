import React from 'react';
import { SailProvider } from '@saberhq/sail';
import { QueryClient, QueryClientProvider } from 'react-query';

const queryClient = new QueryClient();
const onTxSend = undefined;
const onSailError = undefined;

export const Query: React.FC = () => (
    <QueryClientProvider client={queryClient}>
        <SailProvider initialState={{ onTxSend, onSailError }}>{/* stuff */}</SailProvider>
    </QueryClientProvider>
);
