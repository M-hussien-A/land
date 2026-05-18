// Logs a funnel event (scrolled_50, clicked_cta, submitted_form) server-side,
// correlated to the visit via the rid cookie set by middleware.
const ALLOWED = ['scrolled_50', 'clicked_cta', 'submitted_form'];

function readCookie(header, name) {
  const m = (header || '').match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return m ? m[1] : '';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  const eventType = body && typeof body.event_type === 'string' ? body.event_type : '';
  if (!ALLOWED.includes(eventType)) {
    res.status(400).json({ ok: false, error: 'unknown event_type' });
    return;
  }

  const webhook = process.env.SHEETS_WEBHOOK_URL;
  if (webhook) {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        type: 'event',
        rid: readCookie(req.headers.cookie, 'rid'),
        event_type: eventType,
        ts: new Date().toISOString()
      })
    }).catch(() => {});
  }

  res.status(200).json({ ok: true });
}
