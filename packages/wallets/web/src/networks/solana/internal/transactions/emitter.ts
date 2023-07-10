import { EventEmitter as Emitter } from 'eventemitter3';

import { CacheClearEvent, CacheDeleteEvent, CacheUpdateEvent } from '../emitter';

export class TransactionsEmitter {
    private readonly _emitter = new Emitter();

    onCache(callback: (args: CacheUpdateEvent) => void): () => void {
        this._emitter.on(CacheUpdateEvent.type, callback);

        return () => this._emitter.removeListener(CacheUpdateEvent.type, callback);
    }

    raiseCacheUpdated(id: string, isNew: boolean): void {
        this._emitter.emit(CacheUpdateEvent.type, new CacheUpdateEvent(id, isNew));
    }

    raiseCacheDeleted(id: string): void {
        this._emitter.emit(CacheDeleteEvent.type, new CacheDeleteEvent(id));
    }

    raiseCacheCleared(): void {
        this._emitter.emit(CacheClearEvent.type, new CacheClearEvent());
    }
}
