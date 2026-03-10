export type DnsProviderName = 'namecheap' | 'cloudflare';

export type DnsRecordType = 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS' | 'SRV' | 'CAA';

export interface DnsRecord {
  id: string;
  name: string;
  type: DnsRecordType;
  value: string;
  ttl: number;
  proxied?: boolean;
  priority?: number;
}

export interface DnsListRecordsPayload {
  provider: DnsProviderName;
  domain: string;
}

export interface DnsCreateRecordPayload extends DnsListRecordsPayload {
  record: Omit<DnsRecord, 'id'>;
}

export interface DnsUpdateRecordPayload extends DnsListRecordsPayload {
  recordId: string;
  patch: Partial<Omit<DnsRecord, 'id'>>;
}

export interface DnsDeleteRecordPayload extends DnsListRecordsPayload {
  recordId: string;
}
