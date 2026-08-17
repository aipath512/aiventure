/**
 * /api/contact — preia formularul de contact fără serviciu terț.
 *
 * Scrie lead-ul în D1 (tabela `lead`) și, dacă este configurat un
 * MailChannels / Resend, trimite și notificarea pe email.
 *
 * Nu depinde de niciun cont extern ca să funcționeze: dacă D1 este legat,
 * lead-ul este salvat. Emailul este opțional, best-effort.
 *
 * Variabile opționale (Cloudflare Pages → Settings → Environment variables):
 *   LEAD_TO      — adresa unde vrei notificarea (ex. contact@aiventure.ro)
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
  if (!to) return;

  const subject = `Lead nou AiVenture — ${lead.website || lead.email}`;
  const text = [
    `Website:   ${lead.website}`,
    `Email:     ${lead.email}`,
    `Tip firmă: ${lead.tip}`,
    `Obiectiv:  ${lead.obiectiv}`,
    `Mesaj:     ${lead.mesaj || '—'}`,
    ``,
    `Primit:    ${lead.ts}`,
  ].join('\n');

  try {
    if (env.RESEND_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to: [to], subject, text }),
      });
    } else {
      // MailChannels — disponibil din Workers fără cont separat
      await fetch('https://api.mailchannels.net/tx/v1/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: from, name: 'AiVenture' },
          subject,
          content: [{ type: 'text/plain', value: text }],
        }),
      });
    }
  } catch (_) { /* notificarea nu blochează salvarea lead-ului */ }
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
  if (clean(data.companie_website)) return ok('Mulțumim.');

  const lead = {
    website:  clean(data.website, 200),
    email:    clean(data.email, 200),
    tip:      clean(data.tip, 120),
    obiectiv: clean(data.obiectiv, 300),
    mesaj:    clean(data.mesaj, 2000),
    ts:       new Date().toISOString(),
  };

  if (!validEmail(lead.email)) return fail('Adresa de email nu pare validă.');
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
        `INSERT INTO lead (website, email, tip, obiectiv, mesaj, ua, country, ts)
         VALUES (?,?,?,?,?,?,?,?)`)
        .bind(lead.website, lead.email, lead.tip, lead.obiectiv, lead.mesaj,
              clean(request.headers.get('user-agent'), 300),
              request.headers.get('cf-ipcountry') || '',
              lead.ts).run();
      stored = true;
    } catch (err) {
      stored = false;
    }
  }

  await notify(env, lead);

  // Dacă nu am putut nici salva, nici notifica — NU pretindem că am primit mesajul.
  if (!stored && !env.LEAD_TO) {
    return fail(
      'Nu am putut înregistra mesajul. Scrie-ne direct pe WhatsApp la 40737123540 — răspundem repede.',
      503);
  }

  return ok('Am primit mesajul tău. Revenim în cel mai scurt timp.');
}

export async function onRequestGet() {
  return fail('Metodă neacceptată.', 405);
}
