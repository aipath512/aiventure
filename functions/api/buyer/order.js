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

  const quoteId=
    String(body.quote_id||"").trim();

  const evidenceId=
    String(body.evidence_id||"").trim();


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


  const sellerRequest={
    jsonrpc:"2.0",
    id:crypto.randomUUID(),
    method:"order.create",
    params:{
      quote_id:quoteId,
      evidence_id:evidenceId
    }
  };


  let response;

  try{

    response=await fetch(
      "https://ecbtax.com/api/a2a",
      {
        method:"POST",
        headers:{
          "content-type":"application/json",
          "accept":"application/json"
        },
        body:JSON.stringify(sellerRequest)
      }
    );

  }catch(error){

    return reply({
      event:"ORDER_CONNECTION_FAILED",
      buyer:"AiVenture Buyer Agent",
      seller:"ECBTAX Seller Agent",
      error:String(error)
    },502);
  }


  const raw=await response.text();

  let sellerResponse={};

  try{
    sellerResponse=JSON.parse(raw);
  }catch{
    return reply({
      event:"ORDER_FAILED",
      error:"SELLER_NON_JSON_RESPONSE",
      seller_http_status:response.status,
      raw
    },502);
  }


  if(!response.ok){

    return reply({
      event:"ORDER_FAILED",
      buyer:"AiVenture Buyer Agent",
      seller:"ECBTAX Seller Agent",
      seller_http_status:response.status,
      seller_response:sellerResponse
    },502);
  }


  const result=sellerResponse?.result;


  if(
    !result ||
    result.event!=="ORDER_CONFIRMED" ||
    !result.order_id
  ){

    return reply({
      event:"ORDER_NOT_CONFIRMED",
      buyer:"AiVenture Buyer Agent",
      seller:"ECBTAX Seller Agent",
      seller_response:sellerResponse
    },502);
  }


  if(
    result.quote_id!==quoteId ||
    result.evidence_id!==evidenceId
  ){

    return reply({
      event:"ORDER_EVIDENCE_MISMATCH",
      expected:{
        quote_id:quoteId,
        evidence_id:evidenceId
      },
      received:{
        quote_id:result.quote_id,
        evidence_id:result.evidence_id
      }
    },502);
  }


  return reply({

    event:"A2A_ORDER_CONFIRMED",

    buyer:"AiVenture Buyer Agent",
    seller:"ECBTAX Seller Agent",

    transaction_id:
      result.transaction_id,

    order_id:
      result.order_id,

    quote_id:
      result.quote_id,

    evidence_id:
      result.evidence_id,

    service:
      result.service,

    employees:
      result.employees,

    currency:
      result.currency,

    price:
      result.price,

    billing_period:
      result.billing_period,

    human_approved:
      result.human_approved,

    transaction_verified:
      result.transaction_verified,

    status:
      result.status,

    execution_status:
      result.execution_status,

    created_at:
      result.created_at,

    next_event:
      result.next_event,

    seller_response:
      sellerResponse
  });
}
