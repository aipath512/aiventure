const SELLERS = [
  {
    seller_id: "ecbtax-payroll-ro",
    provider: "ECBTAX",
    agent: "ECBTAX Seller Agent",
    service: "payroll",
    service_label: "Calcul salarial",
    country: "RO",
    agent_ready: true,
    endpoint: "https://ecbtax.com/api/a2a",
    agent_card: "https://ecbtax.com/.well-known/agent-card.json",
    evidence_status: "DISCOVERED_NOT_YET_VERIFIED"
  }
];

function normalize(s="") {
  return s.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"");
}

export async function onRequestPost(context) {
  let body={};
  try { body=await context.request.json(); }
  catch (_) { return Response.json({error:"INVALID_JSON"},{status:400}); }

  const human_request=String(body.request||"").trim();
  if (!human_request) return Response.json({error:"REQUEST_REQUIRED"},{status:400});

  const q=normalize(human_request);
  const payrollIntent =
    q.includes("salari") || q.includes("payroll") || q.includes("salar");

  const matches = payrollIntent ? SELLERS : [];

  return Response.json({
    event:"SERVICE_DISCOVERY",
    timestamp:new Date().toISOString(),
    query:human_request,
    status:matches.length ? "SELLER_DISCOVERED" : "NO_SELLER_FOUND",
    matches,
    next_event:matches.length ? "A2A_REQUEST" : null
  });
}
