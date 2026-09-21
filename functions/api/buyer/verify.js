export async function onRequestPost({request}){
  let body={};
  try{ body=await request.json(); }
  catch{ return Response.json({error:"INVALID_JSON"},{status:400}); }

  const quote=body.quote||{};

  const checks={
    quote_id:Boolean(String(quote.quote_id||"").trim()),
    seller_identity:Boolean(String(
      quote.seller_agent_id||quote.provider||quote.seller||body.seller_agent_id||""
    ).trim()),
    service_identity:Boolean(String(
      quote.service_id||quote.service||quote.offer_id||""
    ).trim()),
    available:["AVAILABLE","QUOTED","QUOTE_ISSUED"].includes(
      String(quote.status||"AVAILABLE").toUpperCase()
    ),
    price_supplied:
      typeof quote.price==="number" &&
      Number.isFinite(quote.price) &&
      quote.price>=0
  };

  const coreVerified =
    checks.quote_id &&
    checks.seller_identity &&
    checks.service_identity &&
    checks.available;

  return Response.json({
    event:"BUYER_QUOTE_VERIFICATION",
    quote_id:quote.quote_id||null,
    checks,
    verification_status:
      coreVerified
        ? (checks.price_supplied ? "VERIFIED" : "PARTIAL_PRICE_REQUIRED")
        : "FAILED",
    human_approval_required:true,
    next_event:coreVerified ? "HUMAN_REVIEW" : null
  });
}
