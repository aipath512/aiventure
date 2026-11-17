// AiVenture — butoane flotante de contact (WhatsApp + Apel) pe TOATE paginile aiventure.ro
// v1.0 · 2026-11-17 · număr standard AiVenture: +40 737 123 540
// Se adaugă automat la fiecare pagină HTML, inclusiv paginile noi; restul fișierelor trec neatinse.

const WIDGET = `
<style>
#aiv-contact-float{position:fixed;left:18px;bottom:18px;z-index:9997;display:flex;flex-direction:column;gap:10px}
#aiv-contact-float a{display:flex;align-items:center;justify-content:center;min-width:130px;padding:11px 18px;border-radius:4px;font:600 14px/1.2 Arial,sans-serif;text-decoration:none;letter-spacing:.02em;box-shadow:0 4px 14px rgba(0,0,0,.45)}
#aiv-contact-float .aiv-wa{background:#0f1a14;color:#4ee08a;border:1px solid rgba(78,224,138,.35)}
#aiv-contact-float .aiv-tel{background:#f5c518;color:#111;border:1px solid #f5c518}
#aiv-contact-float a:hover{filter:brightness(1.12)}
@media (max-width:600px){#aiv-contact-float{left:10px;bottom:10px;gap:7px}#aiv-contact-float a{min-width:104px;padding:9px 12px;font-size:13px}}
@media print{#aiv-contact-float{display:none}}
</style>
<div id="aiv-contact-float" aria-label="Contact AiVenture">
  <a class="aiv-wa" href="https://wa.me/40737123540" target="_blank" rel="noopener">WhatsApp</a>
  <a class="aiv-tel" href="tel:+40737123540">Apel</a>
</div>`;

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
