// Receives a Register-interest submission and appends it to the Google Sheet.

// Override per environment by setting SHEETS_WEBHOOK_URL in Vercel.
const DEFAULT_WEBHOOK =
  'https://script.google.com/macros/s/AKfycbycwnYI0UKHzuWFfEqyPKC_j0x5ewds-r1cv-OqPjjeqENPGuXCHZqnGswwnTUtro85rg/exec';
function readCookie(header, name) {
  const m = (header || '').match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return m ? m[1] : '';
}

function clean(value) {
  return (value == null ? '' : String(value)).trim().slice(0, 500);
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
  body = body || {};

  const lead = {
    type: 'lead',
    rid: readCookie(req.headers.cookie, 'rid'),
    full_name: clean(body.fullName),
    email: clean(body.email),
    phone: clean(body.phone),
    whatsapp: body.whatsapp ? 'yes' : 'no',
    unit_type: clean(body.unitType),
    purpose: clean(body.purpose),
    contact_time: clean(body.contactTime),
    ts: new Date().toISOString()
  };

  if (!lead.full_name || !lead.email || !lead.phone) {
    res.status(400).json({ ok: false, error: 'missing required fields' });
    return;
  }

  const webhook = process.env.SHEETS_WEBHOOK_URL || DEFAULT_WEBHOOK;

  try {
    const r = await fetch(webhook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(lead)
    });
    if (!r.ok) throw new Error('sheet webhook returned ' + r.status);
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(502).json({ ok: false, error: 'could not record lead' });
  }
}
