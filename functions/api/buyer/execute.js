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

  const orderId=String(body.order_id||"").trim();
  const quoteId=String(body.quote_id||"").trim();
  const evidenceId=String(body.evidence_id||"").trim();


  // =========================================================
  // VERIFY ORDER
  // =========================================================

  if(orderId!=="ORD-1042"){
    return reply({
      error:"ORDER_NOT_CONFIRMED"
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


  // =========================================================
  // BUILD A2A SERVICE EXECUTION REQUEST
  // =========================================================

  const sellerRequest={
    jsonrpc:"2.0",
    id:"EXECUTE-"+Date.now(),

    method:"service.execute",

    params:{
      order_id:orderId,
      quote_id:quoteId,
      evidence_id:evidenceId
    }
  };


  // =========================================================
  // SEND TO ECBTAX SELLER AGENT
  // =========================================================

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
        event:"EXECUTION_FAILED",
        buyer:"AiVenture Buyer Agent",
        seller:"ECBTAX Seller Agent",
        seller_response:sellerResponse
      },502);
    }

  }catch(error){

    return reply({
      event:"EXECUTION_CONNECTION_FAILED",
      buyer:"AiVenture Buyer Agent",
      seller:"ECBTAX Seller Agent",
      error:String(error)
    },502);
  }


  // =========================================================
  // VERIFY SELLER RESPONSE
  // =========================================================

  const result=sellerResponse?.result;

  if(
    !result ||
    result.event!=="EXECUTION_STARTED" ||
    result.job_id!=="JOB-1042" ||
    result.order_id!=="ORD-1042"
  ){
    return reply({
      event:"EXECUTION_NOT_STARTED",
      buyer:"AiVenture Buyer Agent",
      seller:"ECBTAX Seller Agent",
      seller_response:sellerResponse
    },502);
  }


  // =========================================================
  // BUYER CONFIRMATION
  // =========================================================

  return reply({
    event:"A2A_EXECUTION_STARTED",

    buyer:"AiVenture Buyer Agent",
    seller:"ECBTAX Seller Agent",

    job_id:result.job_id,
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

    order_status:result.order_status,
    execution_status:result.execution_status,

    started_at:result.started_at,

    status:result.status,

    next_event:result.next_event,

    seller_response:sellerResponse
  });
}
