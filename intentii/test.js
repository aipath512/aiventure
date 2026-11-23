// /intentii/ — chat de test: intenție sau cuvânt cheie + firmă + site (v1.0, 2026-11-23)
(function () {
  const P = ['Toate', 'ChatGPT', 'Claude', 'Gemini', 'Perplexity', 'Google', 'Site-ul'];
  const tabs = document.getElementById('tabs'), msgs = document.getElementById('msgs'), form = document.getElementById('composer');
  const q = document.getElementById('q'), n = document.getElementById('n'), u = document.getElementById('u'), send = document.getElementById('send');
  let active = 'Toate';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  P.forEach(p => {
    const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'tab'); b.dataset.p = p;
    b.innerHTML = esc(p) + '<span class="st"></span>'; b.setAttribute('aria-selected', p === active ? 'true' : 'false');
    b.addEventListener('click', () => { active = p; tabs.querySelectorAll('button').forEach(x => x.setAttribute('aria-selected', x.dataset.p === p ? 'true' : 'false')); filter(); });
    tabs.appendChild(b);
  });
  function mark(p, s) { const b = tabs.querySelector('[data-p="' + p + '"] .st'); if (b) b.textContent = s; }
  function filter() { msgs.querySelectorAll('.bubble').forEach(m => { m.hidden = !(active === 'Toate' || !m.dataset.p || m.dataset.p === active); }); }
  function bubble(html, who, p) {
    const d = document.createElement('div'); d.className = 'bubble ' + (who || 'ai'); if (p) d.dataset.p = p; d.innerHTML = html;
    msgs.appendChild(d); filter(); msgs.scrollTop = msgs.scrollHeight; return d;
  }
  const head = (p, sub) => '<b>' + esc(p) + '</b>' + (sub ? ' <small>' + esc(sub) + '</small>' : '') + '<br>';

  document.getElementById('examples').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    q.value = b.dataset.q; n.value = b.dataset.n; u.value = b.dataset.u; q.focus();
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const query = q.value.trim(), name = n.value.trim(), url = u.value.trim();
    if (query.length < 3) { bubble('Scrie întrebarea clientului sau un cuvânt cheie.'); return; }
    if (!name && !url) { bubble('Scrie numele firmei sau adresa site-ului.'); return; }
    send.disabled = true; P.forEach(p => mark(p, ''));
    const isKw = query.split(/\s+/).length <= 3 && !/[?]/.test(query);
    bubble(esc(query) + '<br><small style="color:#3a2a0c">' + esc(name || '') + (url ? ' · ' + esc(url) : '') + '</small>', 'me');
    bubble(isKw ? 'Ai scris un <b>cuvânt cheie</b>. Asistenții AI îl tratează ca pe o întrebare vagă; încearcă după aceea și o întrebare întreagă, cu situația clientului.' : 'Ai scris o <b>intenție</b>: întrebarea întreagă a clientului. Întreb acum asistenții AI. Durează aproximativ un minut.');
    const g = 'https://www.google.com/search?q=' + encodeURIComponent(query) + '&hl=ro&gl=ro';
    bubble(head('Google') + 'Google nu oferă gratuit rezultatele prin API, așa că le vezi direct: <a href="' + g + '" target="_blank" rel="noopener">deschide căutarea în Google</a>. Uită-te dacă firma apare în listă și dacă sus apare un răspuns AI Overview.', 'ai', 'Google');
    mark('Google', ' ↗');
    const pending = {}; let measured = 0, present = 0;
    try {
      const r = await fetch('/api/intentii-test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query, name, url }) });
      if (!r.ok || !r.body) { const j = await r.json().catch(() => ({})); bubble(esc(j.error || 'Testul nu a putut porni acum.')); send.disabled = false; return; }
      const reader = r.body.getReader(), dec = new TextDecoder(); let buf = '';
      for (;;) {
        const { value, done } = await reader.read(); if (done) break;
        buf += dec.decode(value, { stream: true }); let i;
        while ((i = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1); if (!line) continue;
          let j; try { j = JSON.parse(line); } catch { continue; }
          if (j.type === 'site_check') siteCheck(j);
          else if (j.type === 'market_provider_start') { pending[j.provider] = bubble(head(j.provider) + '<small>caută pe web…</small>', 'ai', j.provider); mark(j.provider, ' …'); }
          else if (j.type === 'market_candidates') { const res = candidates(j, name || url); if (res !== null) { measured++; if (res) present++; } }
          else if (j.type === 'market_comparison' && j.comparison) { const b = pending[j.provider]; if (b) { b.insertAdjacentHTML('beforeend', '<br><small>Comparație:</small> ' + esc(j.comparison)); } }
          else if (j.type === 'ai_error') bubble(esc(j.error));
          else if (j.type === 'end') {
            bubble(measured ? '<b>Rezumat:</b> ' + (present ? 'firma este recomandată de ' + present + ' din ' + measured : 'firma nu este recomandată de niciunul din cei ' + measured) + ' asistenți AI care au putut fi măsurați acum. ' + (present < measured ? 'Unde lipsește, întrebarea nu are încă un răspuns clar pe site sau în alte surse. <a href="/#verifica">Verifică-ți firma gratuit</a>.' : '') : 'Asistenții AI nu au putut fi măsurați acum. Încearcă din nou mai târziu.');
          }
        }
      }
    } catch (err) { bubble('Conexiunea s-a întrerupt. Încearcă din nou.'); }
    send.disabled = false;
  });

  function siteCheck(j) {
    if (j.status === 'NO_URL') return;
    if (j.status !== 'OK') { bubble(head('Site-ul') + '<span class="tag na">NU AM PUTUT CITI SITE-UL</span><br>Site-ul nu a răspuns sau blochează citirea automată. Dacă îl blochează și pentru roboții AI, AI-ul nu îl poate cita.', 'ai', 'Site-ul'); mark('Site-ul', ' ?'); return; }
    const t = { FOUND: ['yes', 'ARE RĂSPUNS', '✓'], PARTIAL: ['na', 'RĂSPUNS PARȚIAL', '~'], MISSING: ['no', 'NU ARE RĂSPUNS CLAR', '✗'] }[j.verdict];
    let h = head('Site-ul', j.pages_checked.length + ' pagini verificate') + '<span class="tag ' + t[0] + '">' + t[1] + '</span>';
    if (j.best && j.best.length) h += '<br>Cele mai apropiate pasaje:<ol>' + j.best.map(b => '<li>„' + esc(b.text) + '” <small><a href="' + esc(b.url) + '" target="_blank" rel="noopener">sursa</a></small></li>').join('') + '</ol>';
    else h += '<br>Nu am găsit pe site cuvintele întrebării.';
    h += '<small>Verificare simplă, după cuvinte; nu înlocuiește verificarea completă.</small>';
    bubble(h, 'ai', 'Site-ul'); mark('Site-ul', ' ' + t[2]);
  }

  function candidates(j, target) {
    const bub = pendingBubble(j.provider);
    if (j.status !== 'OK') {
      const why = j.status === 'PARSE_FAILED' ? 'Răspunsul a venit într-un format pe care testul nu l-a putut citi.' : /quota|rate|limit/i.test(j.error || '') ? 'Cheia API a atins limita de utilizare.' : 'Nu a răspuns la timp.';
      bub.innerHTML = head(j.provider) + '<span class="tag na">NU A PUTUT FI MĂSURAT</span><br>' + esc(why); mark(j.provider, ' –'); return null;
    }
    const tl = String(target || '').toLowerCase();
    let h = head(j.provider) + (j.target_present ? '<span class="tag yes">RECOMANDĂ FIRMA' + (j.target_position ? ', LOCUL ' + j.target_position : '') + '</span>' : '<span class="tag no">NU RECOMANDĂ FIRMA</span>');
    if (j.candidates && j.candidates.length) h += '<ol>' + j.candidates.map(c => { const me = tl && String(c.name || '').toLowerCase().includes(tl.split(/[ .]/)[0]); return '<li><span class="' + (me ? 'me-target' : '') + '">' + esc(c.name) + '</span> <small>' + esc(c.why || '') + '</small></li>'; }).join('') + '</ol>';
    if (j.target_note) h += '<small>' + esc(j.target_note) + '</small>';
    bub.innerHTML = h; mark(j.provider, j.target_present ? ' ✓' : ' ✗');
    return !!j.target_present;
  }
  function pendingBubble(p) {
    const all = msgs.querySelectorAll('.bubble[data-p="' + p + '"]'); const last = all[all.length - 1];
    return last && /caută pe web/.test(last.innerHTML) ? last : bubble(head(p), 'ai', p);
  }
})();
