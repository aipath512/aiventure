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


  const jobId =
    String(body.job_id || "").trim();

  const orderId =
    String(body.order_id || "").trim();

  const evidenceId =
    String(body.evidence_id || "").trim();

  const sellerAgentId =
    String(body.seller_agent_id || "").trim();

  const sellerAgentName =
    String(body.seller_agent_name || "").trim();

  const sellerEndpointUrl =
    String(body.seller_endpoint_url || "").trim();


  if (!jobId) {
    return reply({
      error: "JOB_ID_REQUIRED"
    }, 400);
  }

  if (!orderId) {
    return reply({
      error: "ORDER_ID_REQUIRED"
    }, 400);
  }

  if (!evidenceId) {
    return reply({
      error: "EVIDENCE_ID_REQUIRED"
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
   * job_id + order_id + evidence_id must remain bound
   * to the same transaction.
   *
   * Delivery evidence must be returned and verified.
   *
   * THE EDGE MUST NEVER INVENT THE OFFER DURING A TRANSACTION.
   *
   * No payment or settlement is performed here.
   */


  const sellerRequest = {

    jsonrpc: "2.0",

    id: crypto.randomUUID(),

    method: "service.result",

    params: {
      job_id: jobId,
      order_id: orderId,
      evidence_id: evidenceId,
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
      event: "SERVICE_RESULT_CONNECTION_FAILED",

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
      event: "SERVICE_RESULT_FAILED",

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
      event: "SERVICE_RESULT_FAILED",

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

  const serviceResult =
    result?.result;

  const deliveryEvidence =
    result?.delivery_evidence;


  if (
    !result ||
    result.event !== "SERVICE_RESULT" ||
    result.job_id !== jobId ||
    result.order_id !== orderId ||
    result.evidence_id !== evidenceId ||
    result.status !== "COMPLETED"
  ) {

    return reply({
      event: "DELIVERY_NOT_VERIFIED",

      reason:
        "TRANSACTION_REFERENCE_MISMATCH",

      buyer:
        "AiVenture Buyer Agent",

      seller_agent_id:
        sellerAgentId,

      seller_agent_name:
        sellerAgentName || sellerAgentId,

      seller_endpoint_url:
        sellerEndpoint.toString(),

      seller_response:
        sellerResponse
    }, 502);
  }


  if (
    !serviceResult?.result_id ||
    !deliveryEvidence?.delivery_evidence_id ||
    deliveryEvidence.job_id !== jobId ||
    deliveryEvidence.order_id !== orderId ||
    deliveryEvidence.result_id !== serviceResult.result_id ||
    deliveryEvidence.delivered !== true ||
    deliveryEvidence.verified !== true ||
    deliveryEvidence.status !== "VERIFIED"
  ) {

    return reply({
      event: "DELIVERY_NOT_VERIFIED",

      reason:
        "DELIVERY_EVIDENCE_INVALID",

      buyer:
        "AiVenture Buyer Agent",

      seller_agent_id:
        sellerAgentId,

      seller_agent_name:
        sellerAgentName || sellerAgentId,

      seller_endpoint_url:
        sellerEndpoint.toString(),

      seller_response:
        sellerResponse
    }, 502);
  }


  return reply({

    event:
      "A2A_SERVICE_RESULT_RECEIVED",

    buyer:
      "AiVenture Buyer Agent",

    seller_agent_id:
      sellerAgentId,

    seller_agent_name:
      sellerAgentName || sellerAgentId,

    seller_endpoint_url:
      sellerEndpoint.toString(),

    transaction_id:
      result.transaction_id,

    job_id:
      result.job_id,

    order_id:
      result.order_id,

    quote_id:
      result.quote_id,

    evidence_id:
      result.evidence_id,

    result_id:
      serviceResult.result_id,

    result_type:
      serviceResult.type,

    description:
      serviceResult.description,

    period:
      serviceResult.period,

    employees:
      serviceResult.employees,

    deliverable:
      serviceResult.deliverable,

    delivery_evidence_id:
      deliveryEvidence.delivery_evidence_id,

    delivered:
      deliveryEvidence.delivered,

    delivery_verified:
      deliveryEvidence.verified,

    status:
      result.status,

    execution_status:
      result.execution_status,

    completed_at:
      result.completed_at,

    receipt_status:
      "RECEIVED_AND_VERIFIED",

    next_event:
      result.next_event || "BUYER_RECEIPT",

    seller_response:
      sellerResponse
  });
}
