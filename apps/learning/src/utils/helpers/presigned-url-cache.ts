import { type IPresignedUrl } from '@repo/shared/contracts';
import { isPresignedUrlExpired } from '@repo/ui/lib';
import { StorageKey } from '../../enums';

/** The object's address without a signature, which is what the URL cache is keyed by. */
export const toAddress = (url: string): string => url.split('?')[0];

/** True for a URL that carries a signature that has not expired. */
export const isSignedAndLive = (url: string): boolean =>
  url.includes('X-Amz-Signature=') && !isPresignedUrlExpired(url);

/** Signed URLs by object address, kept for as long as each one stays valid. */
export const readPresignedUrlCache = (): Record<string, string> =>
  JSON.parse(localStorage.getItem(StorageKey.PRESIGNED_URLS) || '{}');

export const writePresignedUrlCache = (cache: Record<string, string>) =>
  localStorage.setItem(StorageKey.PRESIGNED_URLS, JSON.stringify(cache));

/**
 * Adds the URLs a public route signed to the cache. Called before the rows that reference them are
 * stored, so no image mounts and asks for a URL the response already carried.
 */
export const seedPresignedUrlCache = (presignedUrls: IPresignedUrl[]) => {
  if (!presignedUrls.length) return;
  const cache = readPresignedUrlCache();
  presignedUrls.forEach(({ key, url }) => (cache[toAddress(key)] = url));
  writePresignedUrlCache(cache);
};
