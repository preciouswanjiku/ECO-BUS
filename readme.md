api/
  _mpesa.js          shared config: sandbox credentials, fares, OAuth token cache
  mpesa-stk.js       POST /api/mpesa-stk        → sends the prompt (STK push)
  mpesa-status.js    GET  /api/mpesa-status     → polls the result (no callback URL needed)
  mpesa-callback.js  POST /api/mpesa-callback   → acknowledges Safaricom's webhook (logged)
test-stk.js          one-command live push + status check (node test-stk.js 2547…)# ECO-BUS
