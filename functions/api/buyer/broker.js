export async function onRequestPost(context) {
  try {
    const input = await context.request.json();

    const request = input.request || null;
    const industry = input.industry || null;
    const activity = input.activity || null;
    const market = input.market || null;
    const max_price = input.max_price ?? null;
    const requires_api = input.requires_api ?? false;
    const requires_a2a = input.requires_a2a ?? false;

    const rpcRequest = {
      jsonrpc: "2.0",
      id: crypto.randomUUID(),
      method: "message/send",
      params: {
        message: {
          data: {
            request,
            industry,
            activity,
            market,
            max_price,
            requires_api,
            requires_a2a
          }
        }
      }
    };

    const brokerResponse = await fetch(
      "https://b2b-ai-library.org/a2a",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "accept": "application/json"
        },
        body: JSON.stringify(rpcRequest)
      }
    );

    const raw = await brokerResponse.text();

    let brokerData;

    try {
      brokerData = JSON.parse(raw);
    } catch {
      return Response.json(
        {
          ok: false,
          error: "B2B AI Broker Agent returned non-JSON.",
          upstream_status: brokerResponse.status
        },
        { status: 502 }
      );
    }

    if (!brokerResponse.ok) {
      return Response.json(
        {
          ok: false,
          error: "B2B AI Broker Agent request failed.",
          upstream_status: brokerResponse.status,
          broker_response: brokerData
        },
        { status: 502 }
      );
    }

    return Response.json(brokerData);

  } catch (error) {
    return Response.json(
      {
        ok: false,
        service: "AiVenture Buyer Agent → B2B AI Broker Gateway",
        error: String(error)
      },
      { status: 500 }
    );
  }
}
