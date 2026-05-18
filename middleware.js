import { next } from '@vercel/edge';

// Runs on every request to the page itself — server-side, so the visit is
// logged even when client-side analytics is blocked by ad blockers or iOS.
export const config = { matcher: '/' };

// Google Apps Script web app that writes to the Creek View Sheet.
// Override per environment by setting the SHEETS_WEBHOOK_URL env var in Vercel.
const DEFAULT_WEBHOOK =
  'https://script.google.com/macros/s/AKfycbycwnYI0UKHzuWFfEqyPKC_j0x5ewds-r1cv-OqPjjeqENPGuXCHZqnGswwnTUtro85rg/exec';

function readCookie(header, name) {
  const m = (header || '').match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return m ? m[1] : '';
}

export default function middleware(request, context) {
  const res = next();

  let rid = readCookie(request.headers.get('cookie'), 'rid');
  if (!rid) {
    rid = crypto.randomUUID();
    res.headers.append(
      'set-cookie',
      `rid=${rid}; Path=/; Max-Age=31536000; SameSite=Lax; Secure; HttpOnly`
    );
  }

  const webhook = process.env.SHEETS_WEBHOOK_URL || DEFAULT_WEBHOOK;
  if (webhook) {
    const visit = {
      type: 'visit',
      rid: rid,
      ip: (request.headers.get('x-forwarded-for') || '').split(',')[0].trim(),
      user_agent: request.headers.get('user-agent') || '',
      referer: request.headers.get('referer') || '',
      country: request.headers.get('x-vercel-ip-country') || '',
      ts: new Date().toISOString()
    };
    context.waitUntil(
      fetch(webhook, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(visit)
      }).catch(() => {})
    );
  }

  return res;
}
