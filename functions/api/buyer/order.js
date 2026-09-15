function reply(data,status=200){
  return Response.json(data,{
    status,
    headers:{
      "Access-Control-Allow-Origin":"https://aiventure.ro",
      "Access-Control-Allow-Headers":"content-type",
      "Access-Control-Allow-Methods":"POST,OPTIONS"
    }
  });
}

export async function onRequestOptions(){
  return reply({ok:true});
}

export async function onRequestPost({request}){
  let body={};

  try{
    body=await request.json();
  }catch{
    return reply({error:"INVALID_JSON"},400);
  }

  const quoteId=String(body.quote_id||"").trim();
  const evidenceId=String(body.evidence_id||"").trim();

  if(!quoteId){
    return reply({
      error:"QUOTE_ID_REQUIRED"
    },400);
  }

  if(!evidenceId){
    return reply({
      error:"EVIDENCE_ID_REQUIRED"
    },400);
  }

  if(quoteId!=="Q-1042"){
    return reply({
      error:"QUOTE_NOT_VERIFIED"
    },400);
  }

  if(evidenceId!=="EV-Q-1042"){
    return reply({
      error:"EVIDENCE_NOT_VERIFIED"
    },400);
  }

  const sellerRequest={
    jsonrpc:"2.0",
    id:"ORDER-"+Date.now(),
    method:"order.create",
    params:{
      quote_id:quoteId,
      evidence_id:evidenceId
    }
  };

  let sellerResponse;

  try{
    const response=await fetch(
      "https://ecbtax.com/api/a2a",
      {
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify(sellerRequest)
      }
    );

    sellerResponse=await response.json();

    if(!response.ok){
      return reply({
        event:"ORDER_FAILED",
        buyer:"AiVenture Buyer Agent",
        seller:"ECBTAX Seller Agent",
        seller_response:sellerResponse
      },502);
    }

  }catch(error){
    return reply({
      event:"ORDER_CONNECTION_FAILED",
      buyer:"AiVenture Buyer Agent",
      seller:"ECBTAX Seller Agent",
      error:String(error)
    },502);
  }

  const result=sellerResponse?.result;

  if(
    !result ||
    result.event!=="ORDER_CONFIRMED" ||
    result.order_id!=="ORD-1042"
  ){
    return reply({
      event:"ORDER_NOT_CONFIRMED",
      buyer:"AiVenture Buyer Agent",
      seller:"ECBTAX Seller Agent",
      seller_response:sellerResponse
    },502);
  }

  return reply({
    event:"A2A_ORDER_CONFIRMED",

    buyer:"AiVenture Buyer Agent",
    seller:"ECBTAX Seller Agent",

    order_id:result.order_id,
    quote_id:result.quote_id,
    evidence_id:result.evidence_id,

    service:result.service,
    employees:result.employees,

    currency:result.currency,
    price:result.price,
    billing_period:result.billing_period,

    human_approved:result.human_approved,
    transaction_verified:result.transaction_verified,

    status:result.status,
    execution_status:result.execution_status,

    created_at:result.created_at,

    next_event:result.next_event,

    seller_response:sellerResponse
  });
}
