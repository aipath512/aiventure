/**
 * /api/contact v2.0 (2026-11-27) — validat / salvat (lead_id) / notificat, UTM în câmpuri separate.
 * Preia formularul de contact fără serviciu terț.
 *
 * Scrie lead-ul în D1 (tabela `lead`) și, dacă este configurat un
 * MailChannels / Resend, trimite și notificarea pe email.
 *
 * Nu depinde de niciun cont extern ca să funcționeze: dacă D1 este legat,
 * lead-ul este salvat. Emailul este opțional, best-effort.
 *
 * Variabile opționale (Cloudflare Pages → Settings → Environment variables):
 *   LEAD_TO      — adresa unde vrei notificarea (ex. contact@5thelement.ai)
 *   LEAD_FROM    — adresa expeditor de pe domeniul tău (ex. site@aiventure.ro)
 *   RESEND_KEY   — dacă folosești Resend; fără ea se încearcă MailChannels
 */

const ok = (msg) => new Response(
  JSON.stringify({ ok: true, message: msg }),
  { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' } });

const fail = (msg, status = 400) => new Response(
  JSON.stringify({ ok: false, error: msg }),
  { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });

function clean(v, max = 500) {
  return String(v == null ? '' : v).trim().slice(0, max);
}

function validEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
}

async function notify(env, lead) {
  const to = env.LEAD_TO;
  const from = env.LEAD_FROM || 'site@aiventure.ro';
  if (!to) return false;

  const subject = `Lead nou AiVenture — ${lead.website || lead.email}`;
  const text = [
    `Website:   ${lead.website}`,
    `Email:     ${lead.email}`,
    `Tip firmă: ${lead.tip}`,
    `Obiectiv:  ${lead.obiectiv}`,
    `Mesaj:     ${lead.mesaj || '—'}`,
    `Sursa:     ${[lead.utm_source, lead.utm_medium, lead.utm_campaign].filter(Boolean).join(' / ') || '—'}`,
    `Pagina:    ${lead.landing_page || '—'}`,
    `Lead ID:   ${lead.lead_uid || '—'}`,
    ``,
    `Primit:    ${lead.ts}`,
  ].join('\n');

  try {
    if (env.RESEND_KEY) {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to: [to], subject, text }),
      });
      return r.ok;
    } else {
      // MailChannels — disponibil din Workers fără cont separat
      const r = await fetch('https://api.mailchannels.net/tx/v1/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: from, name: 'AiVenture' },
          subject,
          content: [{ type: 'text/plain', value: text }],
        }),
      });
      return r.ok;
    }
  } catch (_) { /* notificarea nu blochează salvarea lead-ului */ }
  return false;
}

export async function onRequestPost({ request, env }) {
  let data;
  try {
    const ct = request.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      data = await request.json();
    } else {
      const fd = await request.formData();
      data = Object.fromEntries(fd.entries());
      const obs = fd.getAll('obiectiv');
      if (obs.length) data.obiectiv = obs.join(', ');
    }
  } catch (_) {
    return fail('Nu am putut citi formularul.');
  }

  // honeypot — botii completează câmpul ascuns
  if (clean(data.companie_website)) return new Response(JSON.stringify({ ok: true, message: 'Mulțumim.', validated: false, saved: false, notified: false }), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' } });

  const lead = {
    website:  clean(data.website, 200),
    email:    clean(data.email, 200),
    tip:      clean(data.tip, 120),
    obiectiv: clean(data.obiectiv, 300),
    mesaj:    clean(data.mesaj, 2000),
    ts:       new Date().toISOString(),
    lead_uid: crypto.randomUUID(),
    utm_source:   clean(data.utm_source, 100),
    utm_medium:   clean(data.utm_medium, 100),
    utm_campaign: clean(data.utm_campaign, 150),
    utm_content:  clean(data.utm_content, 150),
    utm_term:     clean(data.utm_term, 150),
    landing_page: clean(data.landing_page, 200),
  };

  // Cererea de demo (15 minute) poate veni doar cu telefon, fără e-mail.
  const telefon = clean(data.telefon, 40);
  const demoCuTelefon = lead.tip === 'demo-15-minute' && telefon.replace(/\D/g, '').length >= 9;
  if (!validEmail(lead.email) && !demoCuTelefon) return fail('Adresa de e-mail nu pare validă.');
  if (!lead.website) return fail('Completează website-ul firmei.');

  let stored = false;

  if (env.DB) {
    try {
      await env.DB.prepare(
        `CREATE TABLE IF NOT EXISTS lead (
           id INTEGER PRIMARY KEY, website TEXT, email TEXT, tip TEXT,
           obiectiv TEXT, mesaj TEXT, ua TEXT, country TEXT,
           ts TEXT NOT NULL DEFAULT (datetime('now')))`).run();
      await env.DB.prepare(
        `INSERT INTO lead (website, email, tip, obiectiv, mesaj, ua, country, ts,
           lead_uid, utm_source, utm_medium, utm_campaign, utm_content, utm_term, landing_page)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
        .bind(lead.website, lead.email, lead.tip, lead.obiectiv, lead.mesaj,
              clean(request.headers.get('user-agent'), 300),
              request.headers.get('cf-ipcountry') || '',
              lead.ts, lead.lead_uid, lead.utm_source, lead.utm_medium, lead.utm_campaign,
              lead.utm_content, lead.utm_term, lead.landing_page).run();
      stored = true;
    } catch (err) {
      stored = false;
    }
  }

  const notified = await notify(env, lead);

  if (stored && env.DB) {
    try { await env.DB.prepare('UPDATE lead SET notified = ? WHERE lead_uid = ?').bind(notified ? 1 : 0, lead.lead_uid).run(); } catch (_) {}
  }

  // Dacă nu am putut nici salva, nici notifica — NU pretindem că am primit mesajul.
  if (!stored && !notified) {
    return fail(
      'Nu am putut înregistra mesajul. Scrie-ne direct pe WhatsApp la 40737123540 — răspundem repede.',
      503);
  }

  // Trei stări separate: validat / salvat (cu lead_id) / notificat.
  return new Response(JSON.stringify({
    ok: true, message: 'Am primit mesajul tău. Revenim în cel mai scurt timp.',
    validated: true, saved: stored, lead_id: stored ? lead.lead_uid : null, notified,
  }), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}

export async function onRequestGet() {
  return fail('Metodă neacceptată.', 405);
}
