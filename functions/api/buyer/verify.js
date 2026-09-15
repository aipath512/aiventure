export async function onRequestPost({request}){
  let body={};
  try{body=await request.json()}catch{return Response.json({error:"INVALID_JSON"},{status:400})}

  const quote=body.quote||{};
  const checks={
    provider: quote.provider==="ECBTAX",
    service: quote.service==="Calcul salarial",
    country: quote.country==="RO",
    employees: Number(quote.employees)===5,
    period: Boolean(String(quote.period||"").trim()),
    available: quote.status==="AVAILABLE",
    price_supplied: typeof quote.price==="number" && quote.price>=0
  };

  const coreVerified = checks.provider && checks.service && checks.country &&
    checks.employees && checks.period && checks.available;

  return Response.json({
    event:"BUYER_QUOTE_VERIFICATION",
    quote_id:quote.quote_id||null,
    checks,
    verification_status: coreVerified ? (checks.price_supplied ? "VERIFIED" : "PARTIAL_PRICE_REQUIRED") : "FAILED",
    human_approval_required:true,
    next_event: coreVerified ? "HUMAN_REVIEW" : null
  });
}
