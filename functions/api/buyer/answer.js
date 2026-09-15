export async function onRequestPost({request}){
  let body={};
  try{ body=await request.json(); }
  catch{ return Response.json({error:"INVALID_JSON"},{status:400}); }

  const period=String(body.period||"").trim();
  const employees=Number(body.employees||5);

  if(!period) return Response.json({error:"PERIOD_REQUIRED"},{status:400});

  const message={
    jsonrpc:"2.0",
    id:crypto.randomUUID(),
    method:"service.answer",
    params:{
      buyer:"AiVenture Buyer Agent",
      service:"payroll",
      period,
      employees
    }
  };

  let r;
  try{
    r=await fetch("https://ecbtax.com/api/a2a",{
      method:"POST",
      headers:{"content-type":"application/json"},
      body:JSON.stringify(message)
    });
  }catch{
    return Response.json({
      event:"A2A_ANSWER_FAILED",
      error:"SELLER_UNREACHABLE"
    },{status:502});
  }

  const seller=await r.json().catch(()=>({}));

  return Response.json({
    event:"A2A_ANSWER_COMPLETED",
    seller_http_status:r.status,
    seller_response:seller
  },{status:r.ok?200:502});
}
