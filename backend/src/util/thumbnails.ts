export interface ThumbnailCache {
  url: string;
  expires: number;
}

export function isThumbnailExpired(cache: ThumbnailCache | undefined): boolean {
  return !cache || cache.expires < Date.now();
}

export function getThumbnail(cache: ThumbnailCache | undefined, refresh: () => Promise<ThumbnailCache>): Promise<ThumbnailCache> | ThumbnailCache {
  if (!cache || cache.expires < Date.now()) {
    return refresh();
  }

  return cache;
}
