import type { StringPublicKey } from '@/networks';

export class CacheClearEvent {
    static type = 'CacheDelete';
}

export class CacheUpdateEvent {
    static type = 'CacheUpdate';
    id: StringPublicKey;
    isNew: boolean;
    constructor(id: StringPublicKey, isNew: boolean) {
        this.id = id;
        this.isNew = isNew;
    }
}

export class CacheDeleteEvent {
    static type = 'CacheUpdate';
    id: StringPublicKey;
    constructor(id: StringPublicKey) {
        this.id = id;
    }
}
