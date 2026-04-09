import { z } from 'zod';

export const DnsProviderSchema = z.enum(['namecheap', 'cloudflare']);
export const DnsRecordTypeSchema = z.enum(['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'CAA']);

export const DnsRecordSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1),
  type: DnsRecordTypeSchema,
  value: z.string().trim().min(1),
  ttl: z.number().int().min(60).max(86400),
  proxied: z.boolean().optional(),
  priority: z.number().int().positive().optional(),
});

export const DnsRecordInputSchema = DnsRecordSchema.omit({ id: true });

export const DnsListRecordsSchema = z.object({
  provider: DnsProviderSchema,
  domain: z.string().trim().min(1),
});

export const DnsCreateRecordSchema = DnsListRecordsSchema.extend({
  record: DnsRecordInputSchema,
});

export const DnsUpdateRecordSchema = DnsListRecordsSchema.extend({
  recordId: z.string().trim().min(1),
  patch: DnsRecordInputSchema.partial().refine(
    (value) => Object.keys(value).length > 0,
    { message: 'At least one patch field is required.' },
  ),
});

export const DnsDeleteRecordSchema = DnsListRecordsSchema.extend({
  recordId: z.string().trim().min(1),
});
