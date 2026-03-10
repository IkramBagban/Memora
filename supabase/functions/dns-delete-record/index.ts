import { DnsDeleteRecordSchema } from '../../../packages/shared/validators/dns.validators.ts';
import { verifyAuth } from '../_shared/auth.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getDnsProvider, normalizeDomain } from '../_shared/dns/index.ts';
import { error, success, toHttpError } from '../_shared/response.ts';
import { validateBody } from '../_shared/validate.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    await verifyAuth(req);
    const body = await validateBody(req, DnsDeleteRecordSchema);
    const provider = getDnsProvider(body.provider);
    const domain = normalizeDomain(body.domain);

    await provider.deleteRecord(domain, body.recordId);

    return success({
      provider: body.provider,
      domain,
      recordId: body.recordId,
      deleted: true,
    });
  } catch (caughtError: unknown) {
    const parsedError = toHttpError(caughtError);
    return error(parsedError.code, parsedError.message, parsedError.status);
  }
});
