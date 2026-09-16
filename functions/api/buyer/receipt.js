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


  // =========================================================
  // STEP 12B — INPUT
  // =========================================================

  const orderId=String(body.order_id||"").trim();
  const jobId=String(body.job_id||"").trim();
  const resultId=String(body.result_id||"").trim();
  const deliveryEvidenceId=
    String(body.delivery_evidence_id||"").trim();


  // =========================================================
  // VERIFY BUYER REFERENCES
  // =========================================================

  if(orderId!=="ORD-1042"){
    return reply({
      error:"ORDER_NOT_VERIFIED"
    },400);
  }

  if(jobId!=="JOB-1042"){
    return reply({
      error:"JOB_NOT_VERIFIED"
    },400);
  }

  if(resultId!=="RES-1042"){
    return reply({
      error:"RESULT_NOT_VERIFIED"
    },400);
  }

  if(deliveryEvidenceId!=="DEL-EV-1042"){
    return reply({
      error:"DELIVERY_EVIDENCE_NOT_VERIFIED"
    },400);
  }


  // =========================================================
  // BUILD A2A RECEIPT REQUEST
  // =========================================================

  const sellerRequest={
    jsonrpc:"2.0",
    id:"RECEIPT-"+Date.now(),

    method:"transaction.receipt",

    params:{
      order_id:orderId,
      job_id:jobId,
      result_id:resultId,
      delivery_evidence_id:deliveryEvidenceId
    }
  };


  // =========================================================
  // REQUEST RECEIPT FROM ECBTAX SELLER AGENT
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
        event:"TRANSACTION_RECEIPT_FAILED",
        buyer:"AiVenture Buyer Agent",
        seller:"ECBTAX Seller Agent",
        seller_response:sellerResponse
      },502);
    }

  }catch(error){

    return reply({
      event:"TRANSACTION_RECEIPT_CONNECTION_FAILED",
      buyer:"AiVenture Buyer Agent",
      seller:"ECBTAX Seller Agent",
      error:String(error)
    },502);
  }


  // =========================================================
  // SELLER RECEIPT
  // =========================================================

  const result=sellerResponse?.result;
  const audit=result?.audit_trail;


  // =========================================================
  // VERIFY RECEIPT IDENTITY
  // =========================================================

  const identityValid=
    result?.event==="TRANSACTION_RECEIPT_ISSUED" &&
    result?.receipt_id==="RCP-1042" &&
    result?.quote_id==="Q-1042" &&
    result?.evidence_id==="EV-Q-1042" &&
    result?.order_id==="ORD-1042" &&
    result?.job_id==="JOB-1042" &&
    result?.result_id==="RES-1042" &&
    result?.delivery_evidence_id==="DEL-EV-1042";


  // =========================================================
  // VERIFY TRANSACTION STATES
  // =========================================================

  const stateValid=
    result?.human_approved===true &&
    result?.transaction_verified===true &&
    result?.delivery_verified===true &&
    result?.status==="COMPLETE" &&
    result?.audit_status==="VERIFIED";


  // =========================================================
  // VERIFY AUDIT TRAIL
  // =========================================================

  const auditValid=
    audit?.quote?.id==="Q-1042" &&
    audit?.quote?.status==="ACCEPTED" &&

    audit?.transaction_evidence?.id==="EV-Q-1042" &&
    audit?.transaction_evidence?.status==="VERIFIED" &&

    audit?.order?.id==="ORD-1042" &&
    audit?.order?.status==="CONFIRMED" &&

    audit?.execution?.job_id==="JOB-1042" &&
    audit?.execution?.status==="COMPLETED" &&

    audit?.result?.id==="RES-1042" &&
    audit?.result?.status==="COMPLETED" &&

    audit?.delivery?.evidence_id==="DEL-EV-1042" &&
    audit?.delivery?.delivered===true &&
    audit?.delivery?.verified===true &&
    audit?.delivery?.status==="VERIFIED";


  // =========================================================
  // REJECT INVALID RECEIPT
  // =========================================================

  if(!identityValid || !stateValid || !auditValid){

    return reply({
      event:"TRANSACTION_RECEIPT_NOT_VERIFIED",

      buyer:"AiVenture Buyer Agent",
      seller:"ECBTAX Seller Agent",

      identity_valid:identityValid,
      state_valid:stateValid,
      audit_valid:auditValid,

      seller_response:sellerResponse
    },502);
  }


  // =========================================================
  // STEP 12B — BUYER FINAL VERIFICATION
  // =========================================================

  return reply({
    event:"A2A_TRANSACTION_RECEIPT_VERIFIED",

    receipt_id:result.receipt_id,

    buyer:"AiVenture Buyer Agent",
    seller:"ECBTAX Seller Agent",

    quote_id:result.quote_id,
    evidence_id:result.evidence_id,
    order_id:result.order_id,
    job_id:result.job_id,
    result_id:result.result_id,
    delivery_evidence_id:result.delivery_evidence_id,

    service:result.service,
    period:result.period,
    employees:result.employees,

    currency:result.currency,
    price:result.price,
    billing_period:result.billing_period,

    human_approved:result.human_approved,
    transaction_verified:result.transaction_verified,
    delivery_verified:result.delivery_verified,

    identity_verified:true,
    audit_trail_verified:true,

    status:"COMPLETE",
    audit_status:"VERIFIED",

    receipt_status:"RECEIVED_AND_VERIFIED",

    issued_at:result.issued_at,

    audit_trail:result.audit_trail,

    next_event:"AUDIT_COMPLETE",

    seller_response:sellerResponse
  });
}
