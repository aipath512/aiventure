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

  const quoteId =
    String(body.quote_id || "").trim();

  const evidenceId =
    String(body.evidence_id || "").trim();

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

  if (!quoteId) {
    return reply({
      error: "QUOTE_ID_REQUIRED"
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
   * order_id + quote_id + evidence_id must remain bound
   * to the same transaction.
   *
   * THE EDGE MUST NEVER INVENT THE OFFER DURING A TRANSACTION.
   *
   * No payment or settlement is performed here.
   */


  const sellerRequest = {

    jsonrpc: "2.0",

    id: crypto.randomUUID(),

    method: "service.execute",

    params: {
      order_id: orderId,
      quote_id: quoteId,
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
      event: "EXECUTION_CONNECTION_FAILED",

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
      event: "EXECUTION_FAILED",

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
      event: "EXECUTION_FAILED",

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


  if (
    !result ||
    result.event !== "EXECUTION_STARTED" ||
    !result.job_id
  ) {

    return reply({
      event: "EXECUTION_NOT_STARTED",

      buyer: "AiVenture Buyer Agent",

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
    result.order_id !== orderId ||
    result.quote_id !== quoteId ||
    result.evidence_id !== evidenceId
  ) {

    return reply({
      event: "EXECUTION_EVIDENCE_MISMATCH",

      seller_agent_id:
        sellerAgentId,

      expected: {
        order_id: orderId,
        quote_id: quoteId,
        evidence_id: evidenceId
      },

      received: {
        order_id: result.order_id,
        quote_id: result.quote_id,
        evidence_id: result.evidence_id
      }
    }, 502);
  }


  return reply({

    event: "A2A_EXECUTION_STARTED",

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

    order_status:
      result.order_status,

    execution_status:
      result.execution_status,

    started_at:
      result.started_at,

    status:
      result.status,

    next_event:
      result.next_event,

    seller_response:
      sellerResponse
  });
}
