import { EventEmitter as Emitter } from 'eventemitter3';

import type { SolanaPublicKey } from '@mindblox-wallet-adapter/base';

import { CacheClearEvent, CacheDeleteEvent, CacheUpdateEvent } from '../emitter';
import { publicKeyToAddress } from '../../utils';

export class AccountsEmitter {
    private readonly _emitter = new Emitter();

    onCache(callback: (args: CacheUpdateEvent) => void): () => void {
        this._emitter.on(CacheUpdateEvent.type, callback);

        return () => this._emitter.removeListener(CacheUpdateEvent.type, callback);
    }

    raiseCacheUpdated(id: SolanaPublicKey, isNew: boolean): void {
        this._emitter.emit(CacheUpdateEvent.type, new CacheUpdateEvent(publicKeyToAddress(id), isNew));
    }

    raiseCacheDeleted(id: SolanaPublicKey): void {
        this._emitter.emit(CacheDeleteEvent.type, new CacheDeleteEvent(publicKeyToAddress(id)));
    }

    raiseCacheCleared(): void {
        this._emitter.emit(CacheClearEvent.type, new CacheClearEvent());
    }
}
