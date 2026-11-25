
const path = require("path");
const stk = require(path.join(__dirname, "api", "mpesa-stk.js"));
const status = require(path.join(__dirname, "api", "mpesa-status.js"));

function fakeReq(method, body, query){ return { method, body, query: query || {} }; }
function fakeRes(){
  const r = { statusCode: 0, body: null, headers: {} };
  r.setHeader = (k, v) => { r.headers[k] = v; };
  r.status = c => { r.statusCode = c; return r; };
  r.json = b => { r.body = b; return r; };
  r.end = () => { r.ended = true; return r; };
  return r;
}
const call = async (h, req) => { const res = fakeRes(); await h(req, res); return res; };

(async () => {
  const phone = process.argv[2];
  const route = process.argv[3] || "nairobi>juba";
  const pax = parseInt(process.argv[4], 10) || 1;
  if(!phone){ console.error("Usage: node test-stk.js <phone 2547…> [route] [pax]"); process.exit(1); }

  console.log("→ sending STK push:", phone, route, "pax" + pax);
  const p = await call(stk, fakeReq("POST", { phone, route, cls: "economy", pax, date: "test" }));
  console.log("← push:", p.statusCode, JSON.stringify(p.body));
  if(!p.body.ok) process.exit(1);
  console.log("   📲 ask the holder of that phone to enter their M-Pesa PIN…");

  for(let i = 1; i <= 30; i++){
    await new Promise(r => setTimeout(r, 4000));
    const s = await call(status, fakeReq("GET", null, { checkoutRequestID: p.body.checkoutRequestID }));
    console.log(`   poll #${i}:`, JSON.stringify(s.body));
    if(s.body.status !== "pending") break;
  }
})();