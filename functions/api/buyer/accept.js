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


  if (body.human_approved !== true) {
    return Response.json(
      { error: "HUMAN_APPROVAL_REQUIRED" },
      { status: 403 }
    );
  }


  const quoteId =
    String(body.quote_id || "").trim();

  const sellerAgentId =
    String(body.seller_agent_id || "").trim();

  const sellerAgentName =
    String(body.seller_agent_name || "").trim();

  const sellerEndpointUrl =
    String(body.seller_endpoint_url || "").trim();


  if (!quoteId) {
    return Response.json(
      { error: "QUOTE_ID_REQUIRED" },
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
   * Layer 1 invariant:
   *
   * Human approval is mandatory before quote acceptance.
   *
   * Seller identity and endpoint originate from Broker discovery.
   *
   * THE EDGE MUST NEVER INVENT THE OFFER DURING A TRANSACTION.
   *
   * No payment or settlement is performed here.
   */


  const message = {

    jsonrpc: "2.0",

    id: crypto.randomUUID(),

    method: "quote.accept",

    params: {
      quote_id: quoteId,
      buyer: "AiVenture Buyer Agent",
      seller_agent_id: sellerAgentId,
      human_approved: true,
      approved_at: new Date().toISOString()
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
        event: "A2A_ACCEPTANCE_FAILED",

        quote_id: quoteId,

        seller_agent_id: sellerAgentId,

        seller_agent_name:
          sellerAgentName || sellerAgentId,

        seller_endpoint_url:
          sellerEndpoint.toString(),

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

    return Response.json(
      {
        event: "A2A_ACCEPTANCE_FAILED",

        quote_id: quoteId,

        seller_agent_id: sellerAgentId,

        seller_agent_name:
          sellerAgentName || sellerAgentId,

        seller_endpoint_url:
          sellerEndpoint.toString(),

        error: "SELLER_NON_JSON_RESPONSE",

        seller_http_status:
          response.status,

        raw
      },
      { status: 502 }
    );
  }


  if (!response.ok) {

    return Response.json(
      {
        event: "A2A_ACCEPTANCE_FAILED",

        quote_id: quoteId,

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
      { status: 502 }
    );
  }


  return Response.json({

    event: "A2A_ACCEPTANCE_COMPLETED",

    quote_id: quoteId,

    human_approved: true,

    seller_agent_id:
      sellerAgentId,

    seller_agent_name:
      sellerAgentName || sellerAgentId,

    seller_endpoint_url:
      sellerEndpoint.toString(),

    seller_http_status:
      response.status,

    seller_response:
      sellerResponse,

    next_event:
      "TRANSACTION_EVIDENCE"
  });
}
