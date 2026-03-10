import { DnsProviderError, ensureRecordType, fromFqdn, normalizeDomain, toFqdn, type DnsProvider, type DnsRecord } from './types.ts';

interface CloudflareResponse<T> {
  success: boolean;
  errors: Array<{ message: string }>;
  result: T;
}

interface CloudflareDnsRecordResponse {
  id: string;
  name: string;
  type: string;
  content: string;
  ttl: number;
  proxied?: boolean;
  priority?: number;
}

export class CloudflareProvider implements DnsProvider {
  readonly name = 'cloudflare' as const;
  private readonly baseUrl = 'https://api.cloudflare.com/client/v4';

  constructor(private readonly apiToken: string, private readonly zoneMap: Record<string, string>) {}

  private headers(): HeadersInit {
    return {
      Authorization: `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json',
    };
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    const payload = (await response.json()) as CloudflareResponse<T>;

    if (!response.ok || !payload.success) {
      const message = payload.errors[0]?.message ?? 'Cloudflare request failed';
      throw new DnsProviderError(message, response.status || 500, 'CLOUDFLARE_API_ERROR');
    }

    return payload.result;
  }

  private async getZoneId(domain: string): Promise<string> {
    const normalizedDomain = normalizeDomain(domain);
    if (this.zoneMap[normalizedDomain]) {
      return this.zoneMap[normalizedDomain];
    }

    const response = await fetch(`${this.baseUrl}/zones?name=${normalizedDomain}`, {
      headers: this.headers(),
    });

    const zones = await this.parseResponse<Array<{ id: string }>>(response);
    const zone = zones[0];

    if (!zone) {
      throw new DnsProviderError(`No Cloudflare zone found for ${normalizedDomain}`, 404, 'ZONE_NOT_FOUND');
    }

    return zone.id;
  }

  private toRecord(record: CloudflareDnsRecordResponse, domain: string): DnsRecord {
    return {
      id: record.id,
      name: fromFqdn(record.name, normalizeDomain(domain)),
      type: ensureRecordType(record.type),
      value: record.content,
      ttl: record.ttl,
      proxied: record.proxied,
      priority: record.priority,
    };
  }

  async listRecords(domain: string): Promise<DnsRecord[]> {
    const zoneId = await this.getZoneId(domain);
    const response = await fetch(`${this.baseUrl}/zones/${zoneId}/dns_records`, {
      headers: this.headers(),
    });
    const result = await this.parseResponse<CloudflareDnsRecordResponse[]>(response);
    return result.map((record) => this.toRecord(record, domain));
  }

  async getRecord(domain: string, recordId: string): Promise<DnsRecord> {
    const zoneId = await this.getZoneId(domain);
    const response = await fetch(`${this.baseUrl}/zones/${zoneId}/dns_records/${recordId}`, {
      headers: this.headers(),
    });

    const record = await this.parseResponse<CloudflareDnsRecordResponse>(response);
    return this.toRecord(record, domain);
  }

  async createRecord(domain: string, record: Omit<DnsRecord, 'id'>): Promise<DnsRecord> {
    const zoneId = await this.getZoneId(domain);
    const response = await fetch(`${this.baseUrl}/zones/${zoneId}/dns_records`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        name: toFqdn(record.name, normalizeDomain(domain)),
        type: record.type,
        content: record.value,
        ttl: record.ttl,
        proxied: record.proxied,
        priority: record.priority,
      }),
    });

    const created = await this.parseResponse<CloudflareDnsRecordResponse>(response);
    return this.toRecord(created, domain);
  }

  async updateRecord(domain: string, recordId: string, patch: Partial<Omit<DnsRecord, 'id'>>): Promise<DnsRecord> {
    const zoneId = await this.getZoneId(domain);

    const response = await fetch(`${this.baseUrl}/zones/${zoneId}/dns_records/${recordId}`, {
      method: 'PATCH',
      headers: this.headers(),
      body: JSON.stringify({
        ...(patch.name ? { name: toFqdn(patch.name, normalizeDomain(domain)) } : {}),
        ...(patch.type ? { type: patch.type } : {}),
        ...(patch.value ? { content: patch.value } : {}),
        ...(patch.ttl ? { ttl: patch.ttl } : {}),
        ...(patch.proxied !== undefined ? { proxied: patch.proxied } : {}),
        ...(patch.priority ? { priority: patch.priority } : {}),
      }),
    });

    const updated = await this.parseResponse<CloudflareDnsRecordResponse>(response);
    return this.toRecord(updated, domain);
  }

  async deleteRecord(domain: string, recordId: string): Promise<void> {
    const zoneId = await this.getZoneId(domain);
    const response = await fetch(`${this.baseUrl}/zones/${zoneId}/dns_records/${recordId}`, {
      method: 'DELETE',
      headers: this.headers(),
    });

    await this.parseResponse<{ id: string }>(response);
  }
}
