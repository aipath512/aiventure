/* AiVenture Assistant UI — shared look for existing and globally injected panels.
 * Visual controls only. Does not claim or simulate a live conversational AI.
 */
(() => {
  'use strict';
  if (window.__aivAssistantSkinApplied) return;
  window.__aivAssistantSkinApplied = true;

  function init() {
    const existing = document.getElementById('chat-panel');
    const panel = existing || document.getElementById('aiv-global-help-panel');
    if (!panel || panel.dataset.aivSkin === '1') return;
    panel.dataset.aivSkin = '1';
    const root = existing ? panel : document.getElementById('aiv-global-help');
    if (!root) return;

    const css = document.createElement('style');
    css.id = 'aiv-assistant-skin';
    css.textContent = `
      #chat-panel.aiv-assistant-box,#aiv-global-help-panel.aiv-assistant-box{
        --chat-bg:#111820;--chat-fg:#f2f7fa;--chat-secondary:#c2cbd4;
        --chat-in:#253340;--chat-out:#25D366;--chat-border:#455564;
        --chat-accent:#25D366;--chat-out-text:#062d1a;
        background:var(--chat-bg)!important;color:var(--chat-fg)!important;
        border:1px solid var(--chat-border)!important;
        font:16px/1.5 system-ui,-apple-system,Segoe UI,Arial,sans-serif!important;
        width:min(390px,calc(100vw - 26px))!important;
        max-height:min(76vh,700px)!important;
        min-width:280px;min-height:270px;
        resize:both;overflow:auto;
        box-shadow:0 18px 58px #0009!important;
      }
      #chat-panel.aiv-assistant-box[data-aiv-theme="light"],#aiv-global-help-panel.aiv-assistant-box[data-aiv-theme="light"]{
        --chat-bg:#f8fbfc;--chat-fg:#18232c;--chat-secondary:#475766;
        --chat-in:#e6eef2;--chat-out:#25D366;--chat-border:#b5c6cf;
      }
      .aiv-assistant-box .aiv-assistant-toolbar{display:flex;justify-content:space-between;align-items:center;gap:10px;margin:-2px 0 16px;padding-bottom:12px;border-bottom:1px solid var(--chat-border)}
      .aiv-assistant-box .aiv-assistant-heading{font-size:15px;font-weight:800;color:var(--chat-accent);letter-spacing:.01em}
      .aiv-assistant-box .aiv-assistant-tools{display:flex;gap:7px}
      .aiv-assistant-box .aiv-assistant-tools button{color:var(--chat-fg);background:transparent;border:1px solid var(--chat-border);border-radius:8px;min-width:36px;min-height:36px;cursor:pointer;font-size:16px;padding:5px 9px}
      .aiv-assistant-box .aiv-assistant-tools button:hover,.aiv-assistant-box .aiv-assistant-tools button:focus-visible{background:var(--chat-in)}
      .aiv-assistant-box h2{color:var(--chat-fg)!important;font-size:20px!important;line-height:1.25!important}
      .aiv-assistant-box p{background:var(--chat-in)!important;border-radius:15px 15px 15px 4px!important;padding:12px 13px!important;color:var(--chat-fg)!important;font-size:16px!important;line-height:1.5!important}
      .aiv-assistant-box a{display:block!important;background:var(--chat-out)!important;border:1px solid var(--chat-accent)!important;border-radius:15px 15px 4px 15px!important;color:var(--chat-out-text)!important;font-size:16px!important;font-weight:650!important;line-height:1.4!important;margin:9px 0 0 28px!important;padding:12px!important;text-decoration:none!important}
      .aiv-assistant-box a:hover,.aiv-assistant-box a:focus-visible{filter:brightness(1.13);outline-offset:2px}
      .aiv-assistant-box small{display:block!important;color:var(--chat-secondary)!important;font-size:13px!important;line-height:1.4!important;margin-top:16px!important}

      .aiv-assistant-box .aiv-guidance{margin:8px 0 17px;padding:13px;border:1px solid var(--chat-border);border-radius:13px;background:var(--chat-in);color:var(--chat-fg)}
      .aiv-assistant-box .aiv-guidance strong{display:block;margin-bottom:8px;font-size:15px;color:var(--chat-accent)}
      .aiv-assistant-box .aiv-guide-choices{display:grid;grid-template-columns:1fr 1fr;gap:7px}
      .aiv-assistant-box .aiv-guide-choices button{border:1px solid var(--chat-border);border-radius:9px;background:var(--chat-bg);color:var(--chat-fg);padding:9px 7px;font:600 14px/1.3 system-ui,sans-serif;cursor:pointer;text-align:left}
      .aiv-assistant-box .aiv-guide-choices button[aria-pressed="true"]{border-color:var(--chat-accent);box-shadow:inset 0 0 0 1px var(--chat-accent)}
      .aiv-assistant-box .aiv-guide-answer{margin-top:12px;padding:11px;background:var(--chat-bg);border-radius:10px;font-size:15px;line-height:1.5;white-space:pre-line}
      .aiv-assistant-box .aiv-guide-answer a{margin:10px 0 0!important;text-align:center}
      @media(max-width:600px){
        #chat-panel.aiv-assistant-box,#aiv-global-help-panel.aiv-assistant-box{
          resize:none!important;width:calc(100vw - 26px)!important;
          min-width:0!important;max-height:min(70dvh,640px)!important;
          right:13px!important;left:auto!important;
        }
      }
    `;
    document.head.appendChild(css);
    panel.classList.add('aiv-assistant-box');

    const toolbar = document.createElement('div');
    toolbar.className = 'aiv-assistant-toolbar';
    const label = document.createElement('span');
    label.className = 'aiv-assistant-heading';
    label.textContent = 'AiVenture · Asistent';
    const controls = document.createElement('div');
    controls.className = 'aiv-assistant-tools';
    const theme = document.createElement('button');
    theme.type = 'button';
    theme.title = 'Comută Dark / Light';
    theme.setAttribute('aria-label', 'Comută tema asistentului');
    const close = document.createElement('button');
    close.type = 'button';
    close.textContent = '×';
    close.title = 'Închide asistentul';
    close.setAttribute('aria-label', 'Închide asistentul');
    controls.append(theme,close);
    toolbar.append(label,controls);
    panel.prepend(toolbar);

    // Ghid determinist: toate răspunsurile sunt trasee editoriale validate, nu AI generativ.
    const guide = document.createElement('section');
    guide.className = 'aiv-guidance';
    guide.setAttribute('aria-label', 'Ghidul de parcurs AiVenture');
    const heading = document.createElement('strong');
    heading.textContent = 'Cum continuăm? · SCARA v2.1';
    const choices = document.createElement('div');
    choices.className = 'aiv-guide-choices';
    const answer = document.createElement('div');
    answer.className = 'aiv-guide-answer';
    answer.setAttribute('role', 'status');
    answer.setAttribute('aria-live', 'polite');
    answer.textContent = 'Alege ce ai nevoie. Îți arăt următorul pas, fără promisiuni automate.';
    const paths = [
      {label:'Vreau să fiu găsit',copy:'Începem prin verificarea vizibilității și a mesajului firmei în raport cu nevoile clienților.',href:'/#verifica',cta:'Verifică firma'},
      {label:'Cum funcționează SCARA?',copy:'SCARA este proiectat să memoreze semnalele pieței, să anticipeze cererea și să alinieze oferta, paginile și asistentul AI. Implementarea completă este în dezvoltare.',href:'/arhitectura/#memorie',cta:'Vezi arhitectura'},
      {label:'Vreau o ofertă',copy:'Putem continua cu o solicitare de ofertă. Prețul, disponibilitatea și condițiile concrete trebuie confirmate de AiVenture.',href:'/contact/',cta:'Contactează AiVenture'},
      {label:'Ce urmează după contact?',copy:'Parcursul urmărit este: nevoie → descoperire → clarificare → dovezi → ofertă → tranzacție → livrare. Clientul decide liber fiecare pas.',href:'/arhitectura/#parcurs',cta:'Vezi parcursul complet'}
    ];
    paths.forEach((path,index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = path.label;
      button.setAttribute('aria-pressed','false');
      button.addEventListener('click', () => {
        choices.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed',String(b===button)));
        answer.replaceChildren();
        const msg = document.createElement('span');
        msg.textContent = path.copy;
        const link = document.createElement('a');
        link.href = path.href;
        link.textContent = path.cta;
        answer.append(msg,link);
      });
      choices.appendChild(button);
    });
    guide.append(heading,choices,answer);
    toolbar.after(guide);


    let mode = 'dark';
    try { mode = localStorage.getItem('aiv-assistant-theme') === 'light' ? 'light' : 'dark'; } catch (_) {}
    function applyTheme() { panel.dataset.aivTheme = mode; theme.textContent = mode === 'dark' ? '☀' : '☾'; theme.setAttribute('aria-pressed', String(mode === 'light')); }
    applyTheme();
    theme.addEventListener('click', () => {
      mode = mode === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('aiv-assistant-theme', mode); } catch (_) {}
      applyTheme();
    });
    close.addEventListener('click', () => {
      panel.classList.remove('open');
      panel.setAttribute('aria-hidden', 'true');
      const button = document.getElementById(existing ? 'chat-launcher' : 'aiv-global-help-button');
      if (button) button.setAttribute('aria-expanded', 'false');
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
