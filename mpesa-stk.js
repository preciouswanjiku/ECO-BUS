
const M = require("./_mpesa");

module.exports = async (req, res) => {
  M.cors(res);
  if(req.method === "OPTIONS") return res.status(204).end();
  if(req.method !== "POST") return M.json(res, 405, { ok:false, error:"POST only" });

  try{
    const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});

    let msisdn = String(b.phone || "").replace(/\D/g, "");
    if(msisdn.length === 10 && msisdn.startsWith("0")) msisdn = "254" + msisdn.slice(1);
    if(!/^254(7|1)\d{8}$/.test(msisdn)){
      return M.json(res, 400, { ok:false, error:"Enter a valid Safaricom number for M-Pesa, e.g. 07XX XXX XXX." });
    }

    const pax = Math.max(1, Math.min(6, parseInt(b.pax, 10) || 1));
    const price = M.kesAmount(String(b.route || ""), b.cls === "business" ? "business" : "economy", pax);
    if(price.error) return M.json(res, 400, { ok:false, error: price.error });

    const ts = M.timestamp();
    const r = await fetch(M.BASE + "/mpesa/stkpush/v1/processrequest", {
      method: "POST",
      headers: { Authorization: "Bearer " + (await M.token()), "Content-Type": "application/json" },
      body: JSON.stringify({
        BusinessShortCode: M.SHORT_CODE,
        Password: M.password(ts),
        Timestamp: ts,
        TransactionType: "CustomerPayBillOnline",
        Amount: price.amount,
        PartyId: M.SHORT_CODE,
        PhoneNumber: msisdn,
        CallBackURL: M.CALLBACK_URL,
        AccountReference: "ECOBUS",
        TransactionDesc: "Eco Bus " + String(b.route || "").replace(">", "-") + (b.date ? " " + b.date : "")
      })
    });
    const d = await r.json().catch(() => ({}));

    if(d.ResponseCode !== "0"){
      let msg = d.CustomerMessage || d.errorMessage || d.ResponseDescription || "Safaricom rejected the request.";
      if(/Invalid PartyA/i.test(msg) && /sandbox/.test(M.BASE)){
        msg += " — in sandbox only the test MSISDNs on your Daraja portal (app → Test Credentials) get prompts; use one of those numbers.";
      }
      return M.json(res, 502, { ok:false, error: msg });
    }
    return M.json(res, 200, {
      ok:true,
      checkoutRequestID: d.CheckoutRequestID,
      merchantRequestID: d.MerchantRequestID,
      amount: price.amount,
      phone: msisdn,
      message: d.CustomerMessage
    });
  }catch(err){
    return M.json(res, 502, { ok:false, error: err.message || "M-Pesa request failed." });
  }
};