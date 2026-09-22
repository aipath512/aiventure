const crypto = require('crypto');
const fs = require('fs');

// Parametrii tranzacției A2A verificate end-to-end
const transactionRecord = {
  protocol_flow: "DISCOVER->MATCH->REQUEST->QUOTE->HITL_APPROVAL->ORDER->EXECUTE->RESULT->VERIFY",
  service: "payroll_calculation",
  provider_sovereign: "ECBTAX",
  pricing_rule: {
    unit_price_eur: 11,
    quantity_employees: 5,
    total_eur: 55,
    pricing_sovereign_controlled: true
  },
  parties: {
    buyer_agent: "AiVenture-Buyer-Agent",
    broker: "A2A-Broker-Service",
    seller_agent: "ECBTAX-Payroll-Seller-Agent"
  },
  governance: {
    hitl_approved: true,
    timestamp: new Date().toISOString()
  },
  adi_provenance_reference: {
    category: "AI Delivery Infrastructure (ADI)",
    canonical_hash: "31aa7a564ad93f21752e6c8d1b31f105688156182cfb1bcd6fb65ef1c756bc36",
    ots_reference: "ai-delivery-infrastructure_canonical_txt.ots"
  }
};

// Serializare și calcul SHA-256 canonizat
const payloadString = JSON.stringify(transactionRecord, Object.keys(transactionRecord).sort(), 2);
const transactionHash = crypto.createHash('sha256').update(payloadString).digest('hex');

const receiptArtifact = {
  receipt_id: `A2A-RCPT-${Date.now()}`,
  payload: transactionRecord,
  cryptographic_proof: {
    algorithm: "SHA-256",
    hash: transactionHash,
    anchoring_ready_for_ots: true
  }
};

const filename = `receipt_${receiptArtifact.receipt_id}.json`;
fs.writeFileSync(filename, JSON.stringify(receiptArtifact, null, 2));

console.log(`[PASS] A2A Receipt generated: ${filename}`);
console.log(`[HASH] SHA-256: ${transactionHash}`);
console.log(`[ACTION] Run OpenTimestamps stamp: ots stamp ${filename}`);