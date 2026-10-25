// Vercel function: the contact form → an email to Matan (via Resend). Env: RESEND_API_KEY, CONTACT_TO, CONTACT_FROM
const esc = s => String(s || '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'})[c]);
export default async function handler(req, res){
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  if (b.website) return res.status(200).json({ ok: true });   // honeypot: bots fill it, people never see it
  const name = String(b.name || '').trim().slice(0, 200), email = String(b.email || '').trim().slice(0, 200), msg = String(b.msg || '').slice(0, 5000), budget = String(b.budget || '').slice(0, 50), need = (Array.isArray(b.need) ? b.need : []).map(String).slice(0, 6).join(', ');
  if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ ok: false, error: 'name and a valid email are required' });
  const key = process.env.RESEND_API_KEY; if (!key) return res.status(500).json({ ok: false, error: 'not configured' });
  const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM || 'Streetlight site <onboarding@resend.dev>',
      to: [process.env.CONTACT_TO || 'matan@studiostreetlight.com'],
      reply_to: email,
      subject: `New message from ${name}${need ? ' · ' + need : ''}${budget ? ' · ' + budget : ''}`,
      text: `${name} <${email}>\nLooking for: ${need || '—'}\nBudget: ${budget || '—'}\n\n${msg}`,
      html: `<p><b>${esc(name)}</b> &lt;${esc(email)}&gt;<br>Looking for: ${esc(need) || '—'}<br>Budget: ${esc(budget) || '—'}</p><p style="white-space:pre-wrap">${esc(msg)}</p>`,
    }) });
  if (!r.ok) return res.status(502).json({ ok: false, error: await r.text() });
  return res.status(200).json({ ok: true });
}
