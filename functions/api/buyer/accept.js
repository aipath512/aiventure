export async function onRequestPost({request}){
  let body={};
  try{body=await request.json()}catch{return Response.json({error:"INVALID_JSON"},{status:400})}

  if(body.human_approved!==true)
    return Response.json({error:"HUMAN_APPROVAL_REQUIRED"},{status:403});

  const quoteId=String(body.quote_id||"").trim();
  if(!quoteId) return Response.json({error:"QUOTE_ID_REQUIRED"},{status:400});

  const msg={
    jsonrpc:"2.0",
    id:crypto.randomUUID(),
    method:"quote.accept",
    params:{
      quote_id:quoteId,
      buyer:"AiVenture Buyer Agent",
      human_approved:true,
      approved_at:new Date().toISOString()
    }
  };

  let r;
  try{
    r=await fetch("https://ecbtax.com/api/a2a",{
      method:"POST",
      headers:{"content-type":"application/json"},
      body:JSON.stringify(msg)
    });
  }catch{
    return Response.json({event:"A2A_ACCEPTANCE_FAILED",error:"SELLER_UNREACHABLE"},{status:502});
  }

  const seller=await r.json().catch(()=>({}));
  return Response.json({
    event:"A2A_ACCEPTANCE_COMPLETED",
    quote_id:quoteId,
    human_approved:true,
    seller_http_status:r.status,
    seller_response:seller,
    next_event:r.ok?"TRANSACTION_EVIDENCE":null
  },{status:r.ok?200:502});
}
