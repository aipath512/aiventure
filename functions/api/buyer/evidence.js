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
  try{body=await request.json()}catch{return Response.json({error:"INVALID_JSON"},{status:400})}

  const sellerResult=body?.seller_response?.result || body?.seller_result || {};
  if(sellerResult.event!=="QUOTE_ACCEPTED" || sellerResult.status!=="ACCEPTED")
    return Response.json({error:"CONFIRMED_ACCEPTANCE_REQUIRED"},{status:400});

  const evidence={
    schema:"aiventure.a2a.transaction-evidence.v1",
    transaction_id:"TX-"+crypto.randomUUID(),
    quote_id:sellerResult.quote_id,
    buyer:"AiVenture Buyer Agent",
    seller:"ECBTAX Seller Agent",
    human_approved:sellerResult.human_approved===true,
    seller_status:sellerResult.status,
    seller_accepted_at:sellerResult.accepted_at,
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
