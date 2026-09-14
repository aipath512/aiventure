export async function onRequestPost(context) {
  let body = {};
  try { body = await context.request.json(); } catch (_) {}
  const method = body.method || body.action || "discover";
  const allowed = ["discover","compare","request","capabilities","status"];
  if (!allowed.includes(method)) {
    return Response.json({
      jsonrpc:"2.0",
      error:{code:-32601,message:"Method not allowed"},
      governance:"Capability != permission",
      rrvi:"required_for_sensitive_actions"
    }, {status:400});
  }
  return Response.json({
    jsonrpc:"2.0",
    result:{
      agent:"AiVenture Buyer Agent",
      method,
      session:"0003H",
      status:"READY",
      autonomy:"L1-L3 default",
      rules:["No rule -> no autonomy","Capability != permission"],
      service:"https://aiventure.ro/service.json",
      governance:"https://aiventure.ro/governance.json",
      rrvi:"https://aiventure.ro/rrvi.json"
    }
  });
}

export async function onRequestGet() {
  return Response.json({
    name:"AiVenture Buyer Agent",
    session:"0003H",
    protocol:"A2A",
    status:"READY",
    endpoint:"/api/a2a",
    methods:["discover","compare","request","capabilities","status"]
  });
}
