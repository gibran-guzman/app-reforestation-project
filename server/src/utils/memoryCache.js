class MemoryCache {
  constructor(ttlMs = 300000) {
    this.store = new Map();
    this.ttlMs = ttlMs;
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key, value) {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  invalidate(key) {
    this.store.delete(key);
  }

  invalidateAll() {
    this.store.clear();
  }
}

module.exports = MemoryCache;
