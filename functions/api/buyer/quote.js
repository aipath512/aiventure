export async function onRequestPost({request}){
  let body={};
  try{ body=await request.json(); }
  catch{ return Response.json({error:"INVALID_JSON"},{status:400}); }

  const sellerEndpoint=String(
    body.seller_endpoint_url ||
    body.endpoint_url ||
    body.endpoint ||
    ""
  ).trim();

  const sellerAgentId=String(
    body.seller_agent_id ||
    body.seller_id ||
    ""
  ).trim();

  if(!sellerEndpoint){
    return Response.json({error:"SELLER_ENDPOINT_REQUIRED"},{status:400});
  }

  const answer=String(body.answer ?? body.period ?? "").trim();
  if(!answer){
    return Response.json({error:"SELLER_ANSWER_REQUIRED"},{status:400});
  }

  const params={
    buyer:"AiVenture Buyer Agent",
    seller_agent_id:sellerAgentId || undefined,
    transaction_id:body.transaction_id || undefined,
    answer,
    ...(body.period ? {period:body.period} : {}),
    ...(body.employees != null ? {employees:Number(body.employees)} : {})
  };

  const msg={
    jsonrpc:"2.0",
    id:crypto.randomUUID(),
    method:"service.answer",
    params
  };

  let r;
  try{
    r=await fetch(sellerEndpoint,{
      method:"POST",
      headers:{"content-type":"application/json","accept":"application/json"},
      body:JSON.stringify(msg)
    });
  }catch{
    return Response.json({
      event:"QUOTE_REQUEST_FAILED",
      error:"SELLER_UNREACHABLE"
    },{status:502});
  }

  const seller=await r.json().catch(()=>({}));
  if(!r.ok){
    return Response.json({
      event:"QUOTE_REQUEST_FAILED",
      seller_response:seller
    },{status:502});
  }

  return Response.json({
    event:"QUOTE_RECEIVED",
    timestamp:new Date().toISOString(),
    seller_agent_id:sellerAgentId || null,
    seller_endpoint_url:sellerEndpoint,
    seller_response:seller,
    next_event:"BUYER_QUOTE_VERIFICATION"
  });
}
