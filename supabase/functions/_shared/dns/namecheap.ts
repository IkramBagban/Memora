import { DnsProviderError, ensureRecordType, normalizeDomain, type DnsProvider, type DnsRecord } from './types.ts';

interface NamecheapHostRecord {
  Name: string;
  Type: string;
  Address: string;
  TTL: number;
  MXPref?: number;
}

export class NamecheapProvider implements DnsProvider {
  readonly name = 'namecheap' as const;
  private readonly baseUrl = 'https://api.namecheap.com/xml.response';

  constructor(
    private readonly apiUser: string,
    private readonly apiKey: string,
    private readonly clientIp: string,
  ) {}

  private splitDomain(domain: string): { sld: string; tld: string } {
    const normalized = normalizeDomain(domain);
    const parts = normalized.split('.');

    if (parts.length < 2) {
      throw new DnsProviderError(`Invalid domain: ${domain}`, 400, 'INVALID_DOMAIN');
    }

    return {
      sld: parts.slice(0, -1).join('.'),
      tld: parts.slice(-1)[0],
    };
  }

  private parseXml(text: string): Document {
    const parsed = new DOMParser().parseFromString(text, 'application/xml');
    const parserError = parsed.querySelector('parsererror');
    if (parserError) {
      throw new DnsProviderError('Unable to parse Namecheap XML response', 500, 'NAMECHEAP_XML_ERROR');
    }
    return parsed;
  }

  private buildUrl(command: string, params: Record<string, string>): string {
    const url = new URL(this.baseUrl);
    url.searchParams.set('ApiUser', this.apiUser);
    url.searchParams.set('ApiKey', this.apiKey);
    url.searchParams.set('UserName', this.apiUser);
    url.searchParams.set('ClientIp', this.clientIp);
    url.searchParams.set('Command', command);

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    return url.toString();
  }

  private parseError(document: Document): string {
    const errorNode = document.querySelector('Errors > Error');
    return errorNode?.textContent?.trim() ?? 'Namecheap API request failed';
  }

  private extractHosts(document: Document): NamecheapHostRecord[] {
    const hosts = Array.from(document.querySelectorAll('host'));

    return hosts.map((host) => {
      const ttlRaw = host.getAttribute('TTL') ?? '1800';
      const mxPrefRaw = host.getAttribute('MXPref');

      return {
        Name: host.getAttribute('Name') ?? '@',
        Type: host.getAttribute('Type') ?? 'A',
        Address: host.getAttribute('Address') ?? '',
        TTL: Number(ttlRaw),
        MXPref: mxPrefRaw ? Number(mxPrefRaw) : undefined,
      };
    });
  }

  private async request(command: string, params: Record<string, string>): Promise<Document> {
    const response = await fetch(this.buildUrl(command, params));
    const responseText = await response.text();
    const parsed = this.parseXml(responseText);
    const apiResponse = parsed.querySelector('ApiResponse');

    const status = apiResponse?.getAttribute('Status');
    if (!response.ok || status !== 'OK') {
      throw new DnsProviderError(
        this.parseError(parsed),
        response.status || 500,
        'NAMECHEAP_API_ERROR',
      );
    }

    return parsed;
  }

  private mapHostToRecord(host: NamecheapHostRecord, index: number): DnsRecord {
    return {
      id: String(index),
      name: host.Name,
      type: ensureRecordType(host.Type),
      value: host.Address,
      ttl: host.TTL,
      priority: host.MXPref,
    };
  }

  private async setHosts(domain: string, records: Omit<DnsRecord, 'id'>[]): Promise<void> {
    const { sld, tld } = this.splitDomain(domain);
    const params: Record<string, string> = { SLD: sld, TLD: tld };

    records.forEach((record, index) => {
      const recordPosition = index + 1;
      params[`HostName${recordPosition}`] = record.name;
      params[`RecordType${recordPosition}`] = record.type;
      params[`Address${recordPosition}`] = record.value;
      params[`TTL${recordPosition}`] = String(record.ttl);
      if (record.priority) {
        params[`MXPref${recordPosition}`] = String(record.priority);
      }
    });

    await this.request('namecheap.domains.dns.setHosts', params);
  }

  async listRecords(domain: string): Promise<DnsRecord[]> {
    const { sld, tld } = this.splitDomain(domain);
    const document = await this.request('namecheap.domains.dns.getHosts', { SLD: sld, TLD: tld });
    const hosts = this.extractHosts(document);

    return hosts.map((host, index) => this.mapHostToRecord(host, index));
  }

  async getRecord(domain: string, recordId: string): Promise<DnsRecord> {
    const records = await this.listRecords(domain);
    const parsedIndex = Number(recordId);

    if (!Number.isInteger(parsedIndex) || parsedIndex < 0 || parsedIndex >= records.length) {
      throw new DnsProviderError(`Record ${recordId} not found`, 404, 'RECORD_NOT_FOUND');
    }

    return records[parsedIndex];
  }

  async createRecord(domain: string, record: Omit<DnsRecord, 'id'>): Promise<DnsRecord> {
    const existing = await this.listRecords(domain);
    const nextRecords: Omit<DnsRecord, 'id'>[] = existing.map((item) => ({
      name: item.name,
      type: item.type,
      value: item.value,
      ttl: item.ttl,
      priority: item.priority,
    }));

    nextRecords.push(record);
    await this.setHosts(domain, nextRecords);

    return { ...record, id: String(existing.length) };
  }

  async updateRecord(domain: string, recordId: string, patch: Partial<Omit<DnsRecord, 'id'>>): Promise<DnsRecord> {
    const existing = await this.listRecords(domain);
    const parsedIndex = Number(recordId);

    if (!Number.isInteger(parsedIndex) || parsedIndex < 0 || parsedIndex >= existing.length) {
      throw new DnsProviderError(`Record ${recordId} not found`, 404, 'RECORD_NOT_FOUND');
    }

    const mergedRecord: DnsRecord = {
      ...existing[parsedIndex],
      ...patch,
      id: existing[parsedIndex].id,
    };

    const nextRecords: Omit<DnsRecord, 'id'>[] = existing.map((item, index) => {
      const source = index === parsedIndex ? mergedRecord : item;
      return {
        name: source.name,
        type: source.type,
        value: source.value,
        ttl: source.ttl,
        priority: source.priority,
      };
    });

    await this.setHosts(domain, nextRecords);
    return mergedRecord;
  }

  async deleteRecord(domain: string, recordId: string): Promise<void> {
    const existing = await this.listRecords(domain);
    const parsedIndex = Number(recordId);

    if (!Number.isInteger(parsedIndex) || parsedIndex < 0 || parsedIndex >= existing.length) {
      throw new DnsProviderError(`Record ${recordId} not found`, 404, 'RECORD_NOT_FOUND');
    }

    const nextRecords: Omit<DnsRecord, 'id'>[] = existing
      .filter((_, index) => index !== parsedIndex)
      .map((item) => ({
        name: item.name,
        type: item.type,
        value: item.value,
        ttl: item.ttl,
        priority: item.priority,
      }));

    await this.setHosts(domain, nextRecords);
  }
}
