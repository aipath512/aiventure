// AiVenture — buton flotant WhatsApp + asistentul AI cu avatarul EVA (GIF animat) pe TOATE paginile aiventure.ro
// v1.3 · 2026-11-17 · număr standard AiVenture: +40 737 123 540
// v1.3: asistentul AI apare pe toate paginile (nu doar pe homepage), cu imaginea EVA de pe 6920.inweb.ro.
// v1.2: butonul de apel (telefon) eliminat — rămâne doar WhatsApp.
// v1.1: butoane rotunde mici (iconițe), stau în marginea din stânga și nu mai acoperă textul.
// Se adaugă automat la fiecare pagină HTML, inclusiv paginile noi; restul fișierelor trec neatinse.

const WIDGET = `
<style>
#aiv-contact-float{position:fixed;left:16px;bottom:18px;z-index:9997;display:flex;flex-direction:column;gap:10px}
#aiv-contact-float a{width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;text-decoration:none;box-shadow:0 4px 14px rgba(0,0,0,.5);transition:transform .15s}
#aiv-contact-float a:hover{transform:scale(1.08)}
#aiv-contact-float .aiv-wa{background:#25d366}
#aiv-contact-float svg{width:26px;height:26px}
@media (max-width:600px){#aiv-contact-float{left:10px;bottom:12px;gap:8px}#aiv-contact-float a{width:46px;height:46px}#aiv-contact-float svg{width:23px;height:23px}}
@media print{#aiv-contact-float{display:none}}
</style>
<div id="aiv-contact-float" aria-label="Contact AiVenture">
  <a class="aiv-wa" href="https://wa.me/40737123540" target="_blank" rel="noopener" aria-label="WhatsApp +40 737 123 540" title="WhatsApp +40 737 123 540">
    <svg viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.8 14.03c-.25.69-1.45 1.32-2 1.4-.51.08-1.16.11-1.87-.12-.43-.14-.98-.32-1.69-.62-2.98-1.29-4.92-4.29-5.07-4.49-.15-.2-1.21-1.61-1.21-3.07 0-1.46.77-2.18 1.04-2.48.27-.3.6-.37.8-.37h.57c.18 0 .43-.07.67.51.25.6.84 2.06.92 2.21.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.31.39-.45.52-.15.15-.3.31-.13.61.17.3.77 1.27 1.65 2.06 1.14 1.01 2.1 1.33 2.4 1.48.3.15.47.12.65-.07.17-.2.75-.87.95-1.17.2-.3.4-.25.67-.15.27.1 1.73.82 2.03.97.3.15.5.22.57.35.08.12.08.72-.17 1.41z"/></svg>
  </a>
</div>
<script defer src="/assets/assistant-widget.js?v=1.3" data-company="AiVenture" data-avatar="/assets/eva-avatar_v1.0_2026-11-17.gif" data-contact="/contact/" data-accent="#d5ae37"></script>`;

export async function onRequest(context) {
  const response = await context.next();
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html")) return response;

  return new HTMLRewriter()
    .on("body", {
      element(el) {
        el.append(WIDGET, { html: true });
      },
    })
    .transform(response);
}
