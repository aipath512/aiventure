export async function onRequestPost({ request }) {

  let body = {};

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "INVALID_JSON" },
      { status: 400 }
    );
  }

  const transactionId =
    String(body.transaction_id || "").trim();

  const answer =
    String(body.answer ?? body.period ?? "").trim();

  const period =
    String(body.period ?? body.answer ?? "").trim();

  const employees =
    body.employees == null ? null : Number(body.employees);

  const sellerAgentId =
    String(body.seller_agent_id || "").trim();

  const sellerAgentName =
    String(body.seller_agent_name || "").trim();

  const sellerEndpointUrl =
    String(body.seller_endpoint_url || "").trim();


  if (!transactionId) {
    return Response.json(
      { error: "TRANSACTION_ID_REQUIRED" },
      { status: 400 }
    );
  }

  if (!answer) {
    return Response.json(
      { error: "SELLER_ANSWER_REQUIRED" },
      { status: 400 }
    );
  }

  if (!sellerAgentId) {
    return Response.json(
      { error: "SELLER_AGENT_ID_REQUIRED" },
      { status: 400 }
    );
  }

  if (!sellerEndpointUrl) {
    return Response.json(
      { error: "SELLER_ENDPOINT_REQUIRED" },
      { status: 400 }
    );
  }


  let sellerEndpoint;

  try {
    sellerEndpoint = new URL(sellerEndpointUrl);
  } catch {
    return Response.json(
      { error: "INVALID_SELLER_ENDPOINT" },
      { status: 400 }
    );
  }

  if (sellerEndpoint.protocol !== "https:") {
    return Response.json(
      { error: "SELLER_ENDPOINT_MUST_USE_HTTPS" },
      { status: 400 }
    );
  }


  /*
   * Layer 1:
   * Seller identity and endpoint originate from Broker discovery.
   *
   * THE EDGE MUST NEVER INVENT THE OFFER DURING A TRANSACTION.
   *
   * No payment or settlement is performed here.
   */

  const message = {

    jsonrpc: "2.0",

    id: crypto.randomUUID(),

    method: "service.answer",

    params: {
      transaction_id: transactionId,
      answer,
      // Backward-compatible field for Reference Seller #001 (ECBTAX Payroll).
      period,
      ...(Number.isFinite(employees) ? {employees} : {}),
      buyer: "AiVenture Buyer Agent",
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
        body: JSON.stringify(message)
      }
    );

  } catch {

    return Response.json(
      {
        event: "A2A_ANSWER_FAILED",
        seller_agent_id: sellerAgentId,
        seller_agent_name: sellerAgentName || sellerAgentId,
        seller_endpoint_url: sellerEndpoint.toString(),
        error: "SELLER_UNREACHABLE"
      },
      { status: 502 }
    );
  }


  const raw = await response.text();

  let sellerResponse = {};

  try {
    sellerResponse = JSON.parse(raw);
  } catch {
    sellerResponse = {
      error: "SELLER_NON_JSON_RESPONSE",
      raw
    };
  }


  return Response.json(
    {
      event: "A2A_ANSWER_COMPLETED",

      transaction_id: transactionId,

      seller_agent_id: sellerAgentId,

      seller_agent_name:
        sellerAgentName || sellerAgentId,

      seller_endpoint_url:
        sellerEndpoint.toString(),

      seller_http_status:
        response.status,

      seller_response:
        sellerResponse
    },
    {
      status: response.ok ? 200 : 502
    }
  );
}
