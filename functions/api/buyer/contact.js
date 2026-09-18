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

  const humanRequest = String(body.request || "").trim();
  const agentId = String(body.agent_id || "").trim();
  const endpointUrl = String(body.endpoint_url || "").trim();

  if (!humanRequest) {
    return Response.json(
      { error: "REQUEST_REQUIRED" },
      { status: 400 }
    );
  }

  if (!agentId) {
    return Response.json(
      { error: "AGENT_ID_REQUIRED" },
      { status: 400 }
    );
  }

  if (!endpointUrl) {
    return Response.json(
      { error: "SELLER_ENDPOINT_REQUIRED" },
      { status: 400 }
    );
  }

  let sellerEndpoint;

  try {
    sellerEndpoint = new URL(endpointUrl);
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
   * Layer 1 invariant:
   * The Buyer contacts only the Seller Agent endpoint discovered
   * through the B2B AI Broker Agent / registry.
   *
   * THE EDGE MUST NEVER INVENT THE OFFER DURING A TRANSACTION.
   *
   * This endpoint performs CONTACT only.
   * No purchase, payment or settlement is authorized here.
   */

  const message = {
    jsonrpc: "2.0",
    id: crypto.randomUUID(),
    method: "service.request",
    params: {
      request: humanRequest,
      buyer: "AiVenture Buyer Agent",
      seller_agent_id: agentId
    }
  };

  let response;

  try {
    response = await fetch(sellerEndpoint.toString(), {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(message)
    });
  } catch {
    return Response.json(
      {
        event: "A2A_REQUEST_FAILED",
        agent_id: agentId,
        endpoint_url: sellerEndpoint.toString(),
        error: "SELLER_UNREACHABLE"
      },
      { status: 502 }
    );
  }

  const sellerResponse = await response.json().catch(() => ({}));

  return Response.json(
    {
      event: "A2A_REQUEST_COMPLETED",
      agent_id: agentId,
      endpoint_url: sellerEndpoint.toString(),
      seller_http_status: response.status,
      seller_response: sellerResponse
    },
    {
      status: response.ok ? 200 : 502
    }
  );
}
