import type { DnsRecord } from './types.ts';

const ipv4Regex = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

export const validateDnsRecord = (record: Partial<Omit<DnsRecord, 'id'>>): string | null => {
  if (record.type === 'MX' && (!record.priority || record.priority <= 0)) {
    return 'MX records require a positive priority value.';
  }

  if (record.type === 'CNAME' && record.name === '@') {
    return 'CNAME record cannot target the root (@).';
  }

  if (record.type === 'A' && record.value && !ipv4Regex.test(record.value)) {
    return `A record value must be a valid IPv4 address: ${record.value}`;
  }

  return null;
};
