export async function onRequestPost(context) {
  let body={};
  try { body=await context.request.json(); }
  catch { return Response.json({error:"INVALID_JSON"},{status:400}); }

  const humanRequest=String(body.request||"").trim();
  if(!humanRequest){
    return Response.json({error:"REQUEST_REQUIRED"},{status:400});
  }

  const rpcRequest={
    jsonrpc:"2.0",
    id:crypto.randomUUID(),
    method:"message/send",
    params:{
      message:{
        data:{
          request:humanRequest,
          requires_api:body.requires_api ?? true,
          requires_a2a:body.requires_a2a ?? true
        }
      }
    }
  };

  let upstream;
  try{
    upstream=await fetch("https://b2b-ai-library.org/a2a",{
      method:"POST",
      headers:{
        "content-type":"application/json",
        "accept":"application/json"
      },
      body:JSON.stringify(rpcRequest)
    });
  }catch{
    return Response.json({
      event:"SERVICE_DISCOVERY",
      status:"BROKER_UNREACHABLE",
      query:humanRequest
    },{status:502});
  }

  const raw=await upstream.text();
  let data={};
  try{ data=JSON.parse(raw); }
  catch{
    return Response.json({
      event:"SERVICE_DISCOVERY",
      status:"BROKER_INVALID_RESPONSE",
      query:humanRequest,
      upstream_status:upstream.status
    },{status:502});
  }

  if(!upstream.ok){
    return Response.json({
      event:"SERVICE_DISCOVERY",
      status:"BROKER_REQUEST_FAILED",
      query:humanRequest,
      upstream_status:upstream.status,
      broker_response:data
    },{status:502});
  }

  return Response.json(data);
}
