import { CloudflareProvider } from './cloudflare.ts';
import { NamecheapProvider } from './namecheap.ts';
import { DnsProviderError, normalizeDomain, type DnsProvider, type DnsProviderName } from './types.ts';

const parseZoneMap = (raw: string | undefined): Record<string, string> => {
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return Object.fromEntries(
      Object.entries(parsed).map(([domain, zoneId]) => [normalizeDomain(domain), zoneId]),
    );
  } catch {
    throw new DnsProviderError('Invalid CLOUDFLARE_ZONE_MAP JSON', 500, 'INVALID_ENV');
  }
};

const requireEnv = (key: string): string => {
  const value = Deno.env.get(key);
  if (!value) {
    throw new DnsProviderError(`Missing required environment variable: ${key}`, 500, 'MISSING_ENV');
  }

  return value;
};

export const getDnsProvider = (provider: DnsProviderName): DnsProvider => {
  if (provider === 'namecheap') {
    return new NamecheapProvider(
      requireEnv('NAMECHEAP_API_USER'),
      requireEnv('NAMECHEAP_API_KEY'),
      requireEnv('NAMECHEAP_CLIENT_IP'),
    );
  }

  return new CloudflareProvider(
    requireEnv('CLOUDFLARE_API_TOKEN'),
    parseZoneMap(Deno.env.get('CLOUDFLARE_ZONE_MAP')),
  );
};

export * from './types.ts';
