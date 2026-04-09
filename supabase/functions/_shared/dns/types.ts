import type { DnsProviderName, DnsRecord, DnsRecordType } from '../../../../packages/shared/types/dns.types.ts';

export type { DnsProviderName, DnsRecord, DnsRecordType };

export interface DnsProvider {
  readonly name: DnsProviderName;
  listRecords(domain: string): Promise<DnsRecord[]>;
  getRecord(domain: string, recordId: string): Promise<DnsRecord>;
  createRecord(domain: string, record: Omit<DnsRecord, 'id'>): Promise<DnsRecord>;
  updateRecord(domain: string, recordId: string, patch: Partial<Omit<DnsRecord, 'id'>>): Promise<DnsRecord>;
  deleteRecord(domain: string, recordId: string): Promise<void>;
}

export class DnsProviderError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 500, code = 'DNS_PROVIDER_ERROR') {
    super(message);
    this.name = 'DnsProviderError';
    this.status = status;
    this.code = code;
  }
}

export const normalizeDomain = (domain: string): string => domain.trim().toLowerCase().replace(/\.$/, '');

export const toFqdn = (recordName: string, domain: string): string => {
  const trimmedName = recordName.trim();

  if (trimmedName === '@') {
    return domain;
  }

  if (trimmedName.endsWith(`.${domain}`)) {
    return trimmedName;
  }

  return `${trimmedName}.${domain}`;
};

export const fromFqdn = (fqdn: string, domain: string): string => {
  if (fqdn === domain) {
    return '@';
  }

  if (fqdn.endsWith(`.${domain}`)) {
    return fqdn.slice(0, -(domain.length + 1));
  }

  return fqdn;
};

export const ensureRecordType = (value: string): DnsRecordType => {
  const type = value.toUpperCase();

  const validTypes: DnsRecordType[] = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'CAA'];
  if (!validTypes.includes(type as DnsRecordType)) {
    throw new DnsProviderError(`Unsupported DNS record type: ${value}`, 400, 'UNSUPPORTED_RECORD_TYPE');
  }

  return type as DnsRecordType;
};
