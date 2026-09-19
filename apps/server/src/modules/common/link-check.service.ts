import { type ILinkCheck } from '@repo/shared/contracts';
import { Injectable } from '@nestjs/common';
import { isIP } from 'node:net';

/** How long one address may take before it is reported unreachable. */
const TIMEOUT_MS = 8000;
/** How many addresses are looked up at once. */
const CONCURRENCY = 6;
const USER_AGENT = 'Mozilla/5.0 (compatible; AcadimicLinkCheck/1.0)';

const YOUTUBE_PATTERN =
  /^(https?:\/\/)?(www\.|m\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/;

/**
 * Whether the address points at something on the public internet.
 *
 * The server fetches whatever it is given, so a private address would let a client probe the
 * network the server sits in. Hostnames that are IP literals in private ranges, loopback and
 * link-local are refused; a DNS name is accepted because resolving it here would double the cost
 * of every check.
 */
/** [first octet, second octet from, second octet to] of the ranges that never leave a network. */
const PRIVATE_V4: [number, number, number][] = [
  [10, 0, 255],
  [127, 0, 255],
  [0, 0, 255],
  [172, 16, 31],
  [192, 168, 168],
  [169, 254, 254],
];
const PRIVATE_V6 = ['::1', 'fc', 'fd', 'fe80'];

const isPublicHost = (hostname: string): boolean => {
  const host = hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) return false;
  const version = isIP(host);
  if (version === 4) {
    const [a, b] = host.split('.').map(Number);
    return !PRIVATE_V4.some(([first, from, to]) => a === first && b >= from && b <= to);
  }
  if (version === 6) return !PRIVATE_V6.some((prefix) => host.startsWith(prefix));
  return true;
};

/** Looks up addresses so an import can drop the ones a model invented or that have since gone. */
@Injectable()
export class LinkCheckService {
  async verify(urls: string[]): Promise<ILinkCheck[]> {
    const unique = [...new Set(urls)];
    const results = new Map<string, ILinkCheck>();
    // A small worker pool: sixty sequential eight-second timeouts would be eight minutes.
    const queue = [...unique];
    const worker = async () => {
      for (let url = queue.shift(); url !== undefined; url = queue.shift()) {
        results.set(url, await this.check(url));
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, unique.length) }, worker));
    return urls.map((url) => results.get(url) ?? { url, ok: false, error: 'not checked' });
  }

  private async check(url: string): Promise<ILinkCheck> {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return { url, ok: false, error: 'not a valid address' };
    }
    if (!['http:', 'https:'].includes(parsed.protocol)) return { url, ok: false, error: 'only http(s) is checked' };
    if (!isPublicHost(parsed.hostname)) return { url, ok: false, error: 'not a public address' };
    // YouTube answers 200 for any watch address, missing videos included; oEmbed says whether
    // the video exists and is public.
    if (YOUTUBE_PATTERN.test(url)) return this.checkYouTube(url);
    return this.checkPage(url);
  }

  private async checkYouTube(url: string): Promise<ILinkCheck> {
    const oembed = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    try {
      const response = await fetch(oembed, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { 'user-agent': USER_AGENT },
      });
      return { url, ok: response.ok, status: response.status, contentType: 'video/youtube' };
    } catch (error) {
      return { url, ok: false, error: error instanceof Error ? error.message : 'request failed' };
    }
  }

  /** HEAD first; some hosts refuse HEAD, so a refusal is retried as a GET whose body is not read. */
  private async checkPage(url: string): Promise<ILinkCheck> {
    try {
      let response = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { 'user-agent': USER_AGENT },
      });
      if (response.status === 405 || response.status === 403 || response.status === 404) {
        response = await fetch(url, {
          method: 'GET',
          redirect: 'follow',
          signal: AbortSignal.timeout(TIMEOUT_MS),
          headers: { 'user-agent': USER_AGENT, range: 'bytes=0-0' },
        });
        await response.body?.cancel();
      }
      const contentType = response.headers.get('content-type')?.split(';')[0].trim() ?? undefined;
      return { url, ok: response.ok, status: response.status, contentType };
    } catch (error) {
      return { url, ok: false, error: error instanceof Error ? error.message : 'request failed' };
    }
  }
}
