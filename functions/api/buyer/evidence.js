function canonical(v){
  if(Array.isArray(v)) return "["+v.map(canonical).join(",")+"]";
  if(v && typeof v==="object"){
    return "{"+Object.keys(v).sort().map(k=>JSON.stringify(k)+":"+canonical(v[k])).join(",")+"}";
  }
  return JSON.stringify(v);
}
async function sha256(text){
  const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(text));
  return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("");
}

export async function onRequestPost({request}){
  let body={};
  try{ body=await request.json(); }
  catch{ return Response.json({error:"INVALID_JSON"},{status:400}); }

  const sellerResult=body?.seller_response?.result || body?.seller_result || {};
  const acceptedEvent=String(sellerResult.event||"");
  const acceptedStatus=String(sellerResult.status||"");

  if(
    acceptedEvent!=="QUOTE_ACCEPTED" ||
    !["ACCEPTED","QUOTE_ACCEPTED"].includes(acceptedStatus)
  ){
    return Response.json({error:"CONFIRMED_ACCEPTANCE_REQUIRED"},{status:400});
  }

  const seller=
    sellerResult.seller_agent_name ||
    sellerResult.seller ||
    sellerResult.provider ||
    body.seller_agent_name ||
    body.seller_agent_id ||
    null;

  if(!seller){
    return Response.json({error:"SELLER_IDENTITY_REQUIRED"},{status:400});
  }

  const evidence={
    schema:"aiventure.a2a.transaction-evidence.v1",
    transaction_id:sellerResult.transaction_id || body.transaction_id || ("TX-"+crypto.randomUUID()),
    quote_id:sellerResult.quote_id || body.quote_id || null,
    buyer:"AiVenture Buyer Agent",
    seller,
    seller_agent_id:sellerResult.seller_agent_id || body.seller_agent_id || null,
    human_approved:sellerResult.human_approved===true,
    seller_status:acceptedStatus,
    seller_accepted_at:sellerResult.accepted_at || null,
    evidence_created_at:new Date().toISOString()
  };

  const evidence_sha256=await sha256(canonical(evidence));

  return Response.json({
    event:"TRANSACTION_EVIDENCE_CREATED",
    verification:"VERIFIED",
    evidence,
    evidence_sha256
  });
}
