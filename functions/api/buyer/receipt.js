function reply(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "https://aiventure.ro",
      "Access-Control-Allow-Headers": "content-type",
      "Access-Control-Allow-Methods": "POST,OPTIONS"
    }
  });
}

export async function onRequestOptions() {
  return reply({ ok: true });
}

export async function onRequestPost({ request }) {

  let body = {};

  try {
    body = await request.json();
  } catch {
    return reply({ error: "INVALID_JSON" }, 400);
  }


  const orderId =
    String(body.order_id || "").trim();

  const jobId =
    String(body.job_id || "").trim();

  const resultId =
    String(body.result_id || "").trim();

  const deliveryEvidenceId =
    String(body.delivery_evidence_id || "").trim();

  const sellerAgentId =
    String(body.seller_agent_id || "").trim();

  const sellerAgentName =
    String(body.seller_agent_name || "").trim();

  const sellerEndpointUrl =
    String(body.seller_endpoint_url || "").trim();


  if (!orderId) {
    return reply({
      error: "ORDER_ID_REQUIRED"
    }, 400);
  }

  if (!jobId) {
    return reply({
      error: "JOB_ID_REQUIRED"
    }, 400);
  }

  if (!resultId) {
    return reply({
      error: "RESULT_ID_REQUIRED"
    }, 400);
  }

  if (!deliveryEvidenceId) {
    return reply({
      error: "DELIVERY_EVIDENCE_ID_REQUIRED"
    }, 400);
  }

  if (!sellerAgentId) {
    return reply({
      error: "SELLER_AGENT_ID_REQUIRED"
    }, 400);
  }

  if (!sellerEndpointUrl) {
    return reply({
      error: "SELLER_ENDPOINT_REQUIRED"
    }, 400);
  }


  let sellerEndpoint;

  try {
    sellerEndpoint = new URL(sellerEndpointUrl);
  } catch {
    return reply({
      error: "INVALID_SELLER_ENDPOINT"
    }, 400);
  }

  if (sellerEndpoint.protocol !== "https:") {
    return reply({
      error: "SELLER_ENDPOINT_MUST_USE_HTTPS"
    }, 400);
  }


  /*
   * Layer 1 transaction continuity:
   *
   * Seller identity and endpoint originate from Broker discovery.
   *
   * The receipt must close the SAME chain:
   *
   * quote
   * → transaction evidence
   * → order
   * → execution
   * → result
   * → delivery evidence
   * → receipt
   *
   * Human approval remains mandatory.
   *
   * THE EDGE MUST NEVER INVENT THE OFFER DURING A TRANSACTION.
   *
   * No payment or settlement is performed here.
   */


  const sellerRequest = {

    jsonrpc: "2.0",

    id: crypto.randomUUID(),

    method: "transaction.receipt",

    params: {
      order_id: orderId,
      job_id: jobId,
      result_id: resultId,
      delivery_evidence_id: deliveryEvidenceId,
      seller_agent_id: sellerAgentId
    }
  };


  let response;

  try {

    response = await fetch(
      sellerEndpoint.toString(),
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "accept": "application/json"
        },
        body: JSON.stringify(sellerRequest)
      }
    );

  } catch (error) {

    return reply({
      event: "TRANSACTION_RECEIPT_CONNECTION_FAILED",

      buyer: "AiVenture Buyer Agent",

      seller_agent_id:
        sellerAgentId,

      seller_agent_name:
        sellerAgentName || sellerAgentId,

      seller_endpoint_url:
        sellerEndpoint.toString(),

      error: String(error)
    }, 502);
  }


  const raw = await response.text();

  let sellerResponse = {};

  try {
    sellerResponse = JSON.parse(raw);
  } catch {

    return reply({
      event: "TRANSACTION_RECEIPT_FAILED",

      seller_agent_id:
        sellerAgentId,

      seller_agent_name:
        sellerAgentName || sellerAgentId,

      seller_endpoint_url:
        sellerEndpoint.toString(),

      error: "SELLER_NON_JSON_RESPONSE",

      seller_http_status:
        response.status,

      raw
    }, 502);
  }


  if (!response.ok) {

    return reply({
      event: "TRANSACTION_RECEIPT_FAILED",

      buyer: "AiVenture Buyer Agent",

      seller_agent_id:
        sellerAgentId,

      seller_agent_name:
        sellerAgentName || sellerAgentId,

      seller_endpoint_url:
        sellerEndpoint.toString(),

      seller_http_status:
        response.status,

      seller_response:
        sellerResponse
    }, 502);
  }


  const result =
    sellerResponse?.result;

  const audit =
    result?.audit_trail;


  const identityValid =
    result?.event === "TRANSACTION_RECEIPT_ISSUED" &&
    Boolean(result?.receipt_id) &&
    result?.order_id === orderId &&
    result?.job_id === jobId &&
    result?.result_id === resultId &&
    result?.delivery_evidence_id === deliveryEvidenceId &&
    Boolean(result?.quote_id) &&
    Boolean(result?.evidence_id);


  const stateValid =
    result?.human_approved === true &&
    result?.transaction_verified === true &&
    result?.delivery_verified === true &&
    result?.status === "COMPLETE" &&
    result?.audit_status === "VERIFIED";


  const auditValid =
    audit?.quote?.id === result?.quote_id &&
    audit?.quote?.status === "ACCEPTED" &&

    audit?.transaction_evidence?.id === result?.evidence_id &&
    audit?.transaction_evidence?.status === "VERIFIED" &&

    audit?.order?.id === orderId &&
    audit?.order?.status === "CONFIRMED" &&

    audit?.execution?.job_id === jobId &&
    audit?.execution?.status === "COMPLETED" &&

    audit?.result?.id === resultId &&
    audit?.result?.status === "COMPLETED" &&

    audit?.delivery?.evidence_id === deliveryEvidenceId &&
    audit?.delivery?.delivered === true &&
    audit?.delivery?.verified === true &&
    audit?.delivery?.status === "VERIFIED";


  if (!identityValid || !stateValid || !auditValid) {

    return reply({
      event: "TRANSACTION_RECEIPT_NOT_VERIFIED",

      buyer: "AiVenture Buyer Agent",

      seller_agent_id:
        sellerAgentId,

      seller_agent_name:
        sellerAgentName || sellerAgentId,

      seller_endpoint_url:
        sellerEndpoint.toString(),

      identity_valid:
        identityValid,

      state_valid:
        stateValid,

      audit_valid:
        auditValid,

      seller_response:
        sellerResponse
    }, 502);
  }


  return reply({

    event:
      "A2A_TRANSACTION_RECEIPT_VERIFIED",

    transaction_id:
      result.transaction_id,

    receipt_id:
      result.receipt_id,

    buyer:
      "AiVenture Buyer Agent",

    seller_agent_id:
      sellerAgentId,

    seller_agent_name:
      sellerAgentName || sellerAgentId,

    seller_endpoint_url:
      sellerEndpoint.toString(),

    quote_id:
      result.quote_id,

    evidence_id:
      result.evidence_id,

    order_id:
      result.order_id,

    job_id:
      result.job_id,

    result_id:
      result.result_id,

    delivery_evidence_id:
      result.delivery_evidence_id,

    service:
      result.service,

    period:
      result.period,

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

    delivery_verified:
      result.delivery_verified,

    identity_verified:
      true,

    audit_trail_verified:
      true,

    status:
      "COMPLETE",

    audit_status:
      "VERIFIED",

    receipt_status:
      "RECEIVED_AND_VERIFIED",

    issued_at:
      result.issued_at,

    audit_trail:
      result.audit_trail,

    next_event:
      "AUDIT_COMPLETE",

    seller_response:
      sellerResponse
  });
}
