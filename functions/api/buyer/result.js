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

  const jobId=String(body.job_id||"").trim();
  const orderId=String(body.order_id||"").trim();
  const evidenceId=String(body.evidence_id||"").trim();


  // =========================================================
  // VERIFY EXECUTION REFERENCES
  // =========================================================

  if(jobId!=="JOB-1042"){
    return reply({
      error:"JOB_NOT_VERIFIED"
    },400);
  }

  if(orderId!=="ORD-1042"){
    return reply({
      error:"ORDER_NOT_VERIFIED"
    },400);
  }

  if(evidenceId!=="EV-Q-1042"){
    return reply({
      error:"EVIDENCE_NOT_VERIFIED"
    },400);
  }


  // =========================================================
  // BUILD A2A SERVICE RESULT REQUEST
  // =========================================================

  const sellerRequest={
    jsonrpc:"2.0",
    id:"RESULT-"+Date.now(),

    method:"service.result",

    params:{
      job_id:jobId,
      order_id:orderId,
      evidence_id:evidenceId
    }
  };


  // =========================================================
  // ASK ECBTAX SELLER AGENT FOR RESULT
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
        event:"SERVICE_RESULT_FAILED",
        buyer:"AiVenture Buyer Agent",
        seller:"ECBTAX Seller Agent",
        seller_response:sellerResponse
      },502);
    }

  }catch(error){
    return reply({
      event:"SERVICE_RESULT_CONNECTION_FAILED",
      buyer:"AiVenture Buyer Agent",
      seller:"ECBTAX Seller Agent",
      error:String(error)
    },502);
  }


  // =========================================================
  // VERIFY SELLER DELIVERY
  // =========================================================

  const result=sellerResponse?.result;
  const serviceResult=result?.result;
  const deliveryEvidence=result?.delivery_evidence;

  const valid=
    result?.event==="SERVICE_RESULT" &&
    result?.job_id==="JOB-1042" &&
    result?.order_id==="ORD-1042" &&
    result?.status==="COMPLETED" &&
    serviceResult?.result_id==="RES-1042" &&
    deliveryEvidence?.delivery_evidence_id==="DEL-EV-1042" &&
    deliveryEvidence?.delivered===true &&
    deliveryEvidence?.verified===true &&
    deliveryEvidence?.status==="VERIFIED";

  if(!valid){
    return reply({
      event:"DELIVERY_NOT_VERIFIED",
      buyer:"AiVenture Buyer Agent",
      seller:"ECBTAX Seller Agent",
      seller_response:sellerResponse
    },502);
  }


  // =========================================================
  // BUYER RECEIPT
  // =========================================================

  return reply({
    event:"A2A_SERVICE_RESULT_RECEIVED",

    buyer:"AiVenture Buyer Agent",
    seller:"ECBTAX Seller Agent",

    job_id:result.job_id,
    order_id:result.order_id,
    quote_id:result.quote_id,
    evidence_id:result.evidence_id,

    result_id:serviceResult.result_id,
    result_type:serviceResult.type,
    description:serviceResult.description,

    period:serviceResult.period,
    employees:serviceResult.employees,

    deliverable:serviceResult.deliverable,

    delivery_evidence_id:
      deliveryEvidence.delivery_evidence_id,

    delivered:deliveryEvidence.delivered,
    delivery_verified:deliveryEvidence.verified,

    status:result.status,
    execution_status:result.execution_status,

    completed_at:result.completed_at,

    receipt_status:"RECEIVED_AND_VERIFIED",

    next_event:"TRANSACTION_COMPLETE",

    seller_response:sellerResponse
  });
}
