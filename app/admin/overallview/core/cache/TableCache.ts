// /core/cache/TableCache.ts
export class TableCache {
    private cache: Map<string, CacheEntry> = new Map();
    private maxAge: number = 5 * 60 * 1000; // 5 minutes

    async get(key: string): Promise<any | null> {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (Date.now() - entry.timestamp > this.maxAge) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    set(key: string, data: any): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    invalidate(key: string): void {
        this.cache.delete(key);
    }

    invalidatePattern(pattern: RegExp): void {
        for (const key of this.cache.keys()) {
            if (pattern.test(key)) {
                this.cache.delete(key);
            }
        }
    }
}

// Initialize cache instance
export const tableCache = new TableCache();