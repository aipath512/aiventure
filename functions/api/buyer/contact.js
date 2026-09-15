export async function onRequestPost({request}){
  let body={};
  try{body=await request.json()}catch{return Response.json({error:"INVALID_JSON"},{status:400})}
  const humanRequest=String(body.request||"").trim();
  if(!humanRequest) return Response.json({error:"REQUEST_REQUIRED"},{status:400});

  const message={
    jsonrpc:"2.0",
    id:crypto.randomUUID(),
    method:"service.request",
    params:{request:humanRequest,buyer:"AiVenture Buyer Agent"}
  };

  let r;
  try{
    r=await fetch("https://ecbtax.com/api/a2a",{
      method:"POST",
      headers:{"content-type":"application/json"},
      body:JSON.stringify(message)
    });
  }catch{
    return Response.json({event:"A2A_REQUEST_FAILED",error:"SELLER_UNREACHABLE"},{status:502});
  }
  const seller=await r.json().catch(()=>({}));
  return Response.json({
    event:"A2A_REQUEST_COMPLETED",
    seller_http_status:r.status,
    seller_response:seller
  },{status:r.ok?200:502});
}
