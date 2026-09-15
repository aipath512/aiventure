export async function onRequestPost(context) {
  let body = {};
  try { body = await context.request.json(); }
  catch (_) { return Response.json({error:"INVALID_JSON"},{status:400}); }
  const human_request = String(body.request || "").trim();
  if (!human_request) return Response.json({error:"REQUEST_REQUIRED"},{status:400});
  return Response.json({
    request_id:`REQ-${crypto.randomUUID()}`,
    event:"HUMAN_REQUEST_RECEIVED",
    status:"BUYER_ACTIVATED",
    timestamp:new Date().toISOString(),
    buyer_agent:"AiVenture Buyer Agent",
    human_request,
    human_approval_required:true,
    ai_disclosure:true,
    next_event:"SERVICE_DISCOVERY"
  }, {status:201});
}
