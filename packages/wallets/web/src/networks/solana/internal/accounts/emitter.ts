import type { PublicKey } from '@solana/web3.js';
import { EventEmitter as Emitter } from 'eventemitter3';

import { CacheClearEvent, CacheDeleteEvent, CacheUpdateEvent } from '../emitter';
import { publicKeyToAddress } from '../../utils';

export class AccountsEmitter {
    private readonly _emitter = new Emitter();

    onCache(callback: (args: CacheUpdateEvent) => void): () => void {
        this._emitter.on(CacheUpdateEvent.type, callback);

        return () => this._emitter.removeListener(CacheUpdateEvent.type, callback);
    }

    raiseCacheUpdated(id: PublicKey, isNew: boolean): void {
        this._emitter.emit(CacheUpdateEvent.type, new CacheUpdateEvent(publicKeyToAddress(id), isNew));
    }

    raiseCacheDeleted(id: PublicKey): void {
        this._emitter.emit(CacheDeleteEvent.type, new CacheDeleteEvent(publicKeyToAddress(id)));
    }

    raiseCacheCleared(): void {
        this._emitter.emit(CacheClearEvent.type, new CacheClearEvent());
    }
}
