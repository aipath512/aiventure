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
    return reply(
      { error: "INVALID_JSON" },
      400
    );
  }

  // =========================================================
  // BUYER → DISCOVERED SELLER
  // STEP 1 — CONTACT / SERVICE REQUEST
  // =========================================================

  const humanRequest =
    String(body.request || "").trim();

  const employees =
    body.employees == null ? null : Number(body.employees);

  const sellerAgentId =
    String(
      body.seller_agent_id ||
      body.agent_id ||
      ""
    ).trim();

  const sellerAgentName =
    String(
      body.seller_agent_name ||
      sellerAgentId
    ).trim();

  const sellerEndpointUrl =
    String(
      body.seller_endpoint_url ||
      body.endpoint_url ||
      ""
    ).trim();


  if (!humanRequest) {
    return reply(
      { error: "REQUEST_REQUIRED" },
      400
    );
  }

  if (!sellerAgentId) {
    return reply(
      { error: "SELLER_AGENT_ID_REQUIRED" },
      400
    );
  }

  if (!sellerEndpointUrl) {
    return reply(
      { error: "SELLER_ENDPOINT_REQUIRED" },
      400
    );
  }


  let sellerEndpoint;

  try {
    sellerEndpoint =
      new URL(sellerEndpointUrl);
  } catch {
    return reply(
      { error: "INVALID_SELLER_ENDPOINT" },
      400
    );
  }

  if (sellerEndpoint.protocol !== "https:") {
    return reply(
      {
        error:
          "SELLER_ENDPOINT_MUST_USE_HTTPS"
      },
      400
    );
  }


  /*
   * A2A LAYER 1
   *
   * Buyer Agent contacts the Seller Agent
   * discovered by the Broker.
   *
   * Seller identity and endpoint are dynamic.
   *
   * IMPORTANT:
   * THE EDGE MUST NEVER INVENT THE OFFER
   * DURING A TRANSACTION.
   *
   * This is SERVICE REQUEST only.
   *
   * No quote acceptance.
   * No order.
   * No execution.
   * No payment.
   * No settlement.
   */


  const sellerRequest = {
    jsonrpc: "2.0",

    id: crypto.randomUUID(),

    method: "service.request",

    params: {
      request: humanRequest,

      ...(Number.isFinite(employees) ? {employees} : {}),

      buyer:
        "AiVenture Buyer Agent",

      seller_agent_id:
        sellerAgentId
    }
  };


  let response;

  try {
    response = await fetch(
      sellerEndpoint.toString(),
      {
        method: "POST",

        headers: {
          "content-type":
            "application/json",

          "accept":
            "application/json"
        },

        body:
          JSON.stringify(sellerRequest)
      }
    );

  } catch (error) {

    return reply(
      {
        event:
          "A2A_REQUEST_FAILED",

        buyer:
          "AiVenture Buyer Agent",

        seller_agent_id:
          sellerAgentId,

        seller_agent_name:
          sellerAgentName,

        seller_endpoint_url:
          sellerEndpoint.toString(),

        error:
          "SELLER_UNREACHABLE",

        detail:
          String(error)
      },
      502
    );
  }


  const raw =
    await response.text();


  let sellerResponse = {};

  try {
    sellerResponse =
      JSON.parse(raw);

  } catch {

    return reply(
      {
        event:
          "A2A_REQUEST_FAILED",

        buyer:
          "AiVenture Buyer Agent",

        seller_agent_id:
          sellerAgentId,

        seller_agent_name:
          sellerAgentName,

        seller_endpoint_url:
          sellerEndpoint.toString(),

        seller_http_status:
          response.status,

        error:
          "SELLER_NON_JSON_RESPONSE",

        raw
      },
      502
    );
  }


  if (!response.ok) {

    return reply(
      {
        event:
          "A2A_REQUEST_FAILED",

        buyer:
          "AiVenture Buyer Agent",

        seller_agent_id:
          sellerAgentId,

        seller_agent_name:
          sellerAgentName,

        seller_endpoint_url:
          sellerEndpoint.toString(),

        seller_http_status:
          response.status,

        seller_response:
          sellerResponse
      },
      502
    );
  }


  // =========================================================
  // VERIFY STEP-1 SELLER RESPONSE
  // =========================================================

  const result =
    sellerResponse?.result;


  if (
    result?.event !==
      "A2A_SELLER_RESPONSE" ||

    !result?.transaction_id
  ) {

    return reply(
      {
        event:
          "A2A_RESPONSE_NOT_VERIFIED",

        buyer:
          "AiVenture Buyer Agent",

        seller_agent_id:
          sellerAgentId,

        seller_agent_name:
          sellerAgentName,

        seller_endpoint_url:
          sellerEndpoint.toString(),

        seller_response:
          sellerResponse
      },
      502
    );
  }


  // =========================================================
  // STEP 1 SUCCESS
  // =========================================================

  return reply({
    event:
      "A2A_REQUEST_COMPLETED",

    buyer:
      "AiVenture Buyer Agent",

    seller_agent_id:
      sellerAgentId,

    seller_agent_name:
      sellerAgentName,

    seller_endpoint_url:
      sellerEndpoint.toString(),

    transaction_id:
      result.transaction_id,

    seller:
      result.seller,

    provider:
      result.provider,

    service:
      result.service,

    country:
      result.country,

    status:
      result.status,

    question:
      result.question,

    next_event:
      result.next_event,

    seller_http_status:
      response.status,

    seller_response:
      sellerResponse
  });
}
