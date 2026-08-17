/* AiVenture.ro v2.0 — shared script */
(function () {
  'use strict';

  /* ---- live clock in status bar ---- */
  function initClock() {
    var el = document.querySelector('.statusbar .clock');
    if (!el) return;
    function tick() {
      var d = new Date();
      function p(n) { return String(n).padStart(2, '0'); }
      el.textContent = p(d.getDate()) + '.' + p(d.getMonth() + 1) + '.' + d.getFullYear()
                     + ' · ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ---- mobile nav ---- */
  function initNav() {
    var t = document.querySelector('.navtoggle'), n = document.querySelector('nav');
    if (!t || !n) return;
    t.addEventListener('click', function () {
      var open = n.classList.toggle('open');
      t.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* ---- AI LENS: motorul real este AUDIT-AI (eu-ai-audit.eu) ----
     Modifică o singură linie mai jos ca să schimbi destinația.
     LENS_MODE:
       'handoff'  = trimite domeniul către motorul existent (implicit)
       'inline'   = apel fetch către LENS_API și randare în pagină
       'contact'  = fallback: colectează lead-ul pe /contact/            */
  var LENS_MODE = 'handoff';
  var LENS_BASE = 'https://eu-ai-audit.eu/';
  var LENS_API  = 'https://eu-ai-audit.eu/audit';
  /* Motorul poate aștepta alt nume de parametru. Le trimitem pe toate cele uzuale —
     cel corect este citit, restul sunt ignorate. Când confirmi care este, poți
     reduce lista la unul singur. */
  var LENS_PARAMS = ['domain', 'url', 'site', 'q'];

  function lensURL(domain) {
    var qs = LENS_PARAMS.map(function (k) {
      return k + '=' + encodeURIComponent(domain);
    }).join('&');
    return LENS_BASE + '?' + qs;
  }

  function initLens() {
    document.querySelectorAll('form[data-lens]').forEach(function (f) {
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var v = ((f.querySelector('input') || {}).value || '').trim()
                  .replace(/^https?:\/\//i, '').replace(/\/+$/, '');
        if (!v) return;
        if (LENS_MODE === 'contact') {
          window.location.href = '/contact/?site=' + encodeURIComponent(v);
        } else if (LENS_MODE === 'inline') {
          runInline(f, v);
        } else {
          window.location.href = lensURL(v);
        }
      });
    });
  }

  /* Randare inline — activează doar după ce confirmi contractul API
     al motorului (numele câmpurilor din răspuns). */
  function runInline(form, domain) {
    var out = document.querySelector('#lens-result');
    if (out) out.innerHTML = '<p class="muted">Se scanează ' + domain + '…</p>';
    fetch(LENS_API + '?domain=' + encodeURIComponent(domain), { headers: { 'Accept': 'application/json' } })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!out) return;
        var rows = (d.scores || d.dimensions || []);
        out.innerHTML = rows.length
          ? rows.map(function (s) {
              return '<div class="scorerow"><span>' + (s.label || s.name) + '</span><b>' + (s.value || s.score) + '</b></div>';
            }).join('')
          : '<p class="muted">Rezultatul complet este disponibil pe motorul AUDIT-AI.</p>';
      })
      .catch(function () {
        window.location.href = lensURL(domain);
      });
  }

  /* ---- prefill contact form from ?site= ---- */
  function initPrefill() {
    var i = document.querySelector('#site-input');
    if (!i) return;
    var v = new URLSearchParams(window.location.search).get('site');
    if (v) i.value = v;
  }

  /* ---- căutare în banca de cunoștințe (1900 Q&A + 199 use cases) ---- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function renderKB(box, data, kind) {
    if (!data.results || !data.results.length) {
      box.innerHTML = '<p class="muted">Niciun rezultat. Încearcă alți termeni sau '
        + '<a href="/contact/" class="gold">întreabă-ne direct</a>.</p>';
      return;
    }
    box.innerHTML = '<p class="muted small" style="font-family:var(--mono)">'
      + data.count + ' rezultate</p>'
      + data.results.map(function (r) {
          return kind === 'usecase'
            ? '<div class="card" style="margin-top:14px"><h3>' + esc(r.title) + '</h3>'
              + '<p class="muted small">' + esc(r.industry) + '</p>'
              + '<p class="muted" style="margin-top:10px">' + esc(r.situation) + '</p>'
              + (r.outcome ? '<p class="q">' + esc(r.outcome) + '</p>' : '') + '</div>'
            : '<details open style="margin-top:12px"><summary><h3>' + esc(r.question)
              + '</h3></summary><p>' + esc(r.answer) + '</p></details>';
        }).join('');
  }

  function initKB() {
    document.querySelectorAll('form[data-kb]').forEach(function (f) {
      var kind = f.getAttribute('data-kind') || 'qa';
      var box = document.querySelector('#kb-results');
      function run(q) {
        if (!box) return;
        box.innerHTML = '<p class="muted">Se caută…</p>';
        fetch('/api/kb?kind=' + kind + '&q=' + encodeURIComponent(q))
          .then(function (r) { return r.json(); })
          .then(function (d) { renderKB(box, d, kind); })
          .catch(function () {
            box.innerHTML = '<p class="muted">Căutarea nu este disponibilă momentan. '
              + 'Întrebările principale sunt vizibile mai jos în pagină.</p>';
          });
      }
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var v = ((f.querySelector('input') || {}).value || '').trim();
        if (v) run(v);
      });
      // preîncarcă din ?c= sau ?i=
      var p = new URLSearchParams(window.location.search);
      var seed = p.get('c') || p.get('i') || p.get('q');
      if (seed) {
        var inp = f.querySelector('input');
        if (inp) inp.value = seed.replace(/-/g, ' ');
        run(seed.replace(/-/g, ' '));
      }
    });
  }

  /* ---- formular de contact: trimite fără să părăsească pagina ---- */
  function initContact() {
    var f = document.getElementById('contact-form');
    if (!f) return;
    var st = document.getElementById('form-status');
    var btn = f.querySelector('button[type=submit]');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (st) { st.textContent = 'Se trimite…'; st.style.color = ''; }
      if (btn) btn.disabled = true;
      fetch('/api/contact', { method: 'POST', body: new FormData(f) })
        .then(function (r) { return r.json().catch(function () { return { ok: r.ok }; }); })
        .then(function (d) {
          if (d.ok) {
            f.innerHTML = '<div class="card" style="border-color:var(--gold)">'
              + '<h3 class="gold">Mulțumim.</h3><p class="muted">'
              + (d.message || 'Am primit mesajul tău.')
              + '</p><p style="margin-top:14px"><a class="btn btn-ghost btn-sm" href="/verifica/">'
              + 'Între timp, verifică firma →</a></p></div>';
          } else {
            if (st) { st.textContent = d.error || 'Nu am putut trimite. Încearcă din nou.'; st.style.color = '#C0392B'; }
            if (btn) btn.disabled = false;
          }
        })
        .catch(function () {
          if (st) {
            st.innerHTML = 'Trimiterea a eșuat. Scrie-ne direct pe '
              + '<a href="https://api.whatsapp.com/send/?phone=40737123540" class="gold">WhatsApp</a>.';
            st.style.color = '#C0392B';
          }
          if (btn) btn.disabled = false;
        });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initClock(); initNav(); initLens(); initPrefill(); initKB(); initContact();
  });
})();
