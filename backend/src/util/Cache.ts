export abstract class CacheLayer<T> {
  public abstract get(key: string): Promise<T | null> | T | null;
  public abstract set(key: string, value: T, ttl?: number): Promise<void> | void;
  public abstract delete(key: string): Promise<void> | void;
  public abstract clear(): Promise<void> | void;
  public abstract close(): Promise<void> | void;
  public abstract clean(): Promise<void> | void;
}

export default class Cache<T> {
  private readonly layers: CacheLayer<T>[];
  private missListeners: ((key: string) => void)[] = [];
  private interval: number;

  constructor(...layers: CacheLayer<T>[]) {
    this.layers = layers;

    this.interval = setInterval(() => {
      for (const layer of this.layers) {
        layer.clean();
      }
    }, 1000)
  }

  public async get(key: string): Promise<T | null> {
    for (const layer of this.layers) {
      const value = await layer.get(key);

      if (value !== null) {
        return value;
      }
    }

    for (const listener of this.missListeners) {
      listener(key);
    }

    return null;
  }

  public async set(key: string, value: T, ttl?: number): Promise<void> {
    for (const layer of this.layers) {
      await layer.set(key, value, ttl);
    }
  }

  public async delete(key: string): Promise<void> {
    for (const layer of this.layers) {
      await layer.delete(key);
    }
  }

  public async clear(): Promise<void> {
    for (const layer of this.layers) {
      await layer.clear();
    }
  }

  public async close(): Promise<void> {
    for (const layer of this.layers) {
      await layer.close();
    }
  }

  public onMiss(listener: (key: string) => void) {
    this.missListeners.push(listener);
  }


  public async getElseSet(key: string, value: () => Promise<T | null | undefined>, ttl?: number): Promise<T | null> {
    const cached = await this.get(key);

    if (cached !== null) {
      return cached;
    }

    const result = await value();

    if (result == null) {
      return null;
    }

    await this.set(key, result, ttl);

    return result;
  }
}

export class MemoryCacheLayer<T> extends CacheLayer<T> {
  constructor(private ttl: number = 60 * 1000) {
    super();
  }

  private cache: Map<string, [number, T]> = new Map();

  private get now() {
    return Date.now();
  }

  public get(key: string): T | null {
    const value = this.cache.get(key);

    if (value === undefined) {
      return null;
    }

    const [expires, data] = value;

    if (expires < this.now) {
      this.cache.delete(key);
      return null;
    }

    return data;
  }

  public set(key: string, value: T, ttl?: number): void {
    this.cache.set(key, [this.now + (ttl || this.ttl), value]);
  }

  public delete(key: string): void {
    this.cache.delete(key);
  }

  public clear(): void {
    this.cache.clear();
  }

  public clean() {
    const now = this.now;

    for (const [key, [expires]] of this.cache.entries()) {
      if (expires < now) {
        this.cache.delete(key);
      }
    }
  }

  public close(): void {
    this.clear();
  }
}
