// import { createClient } from '@supabase/supabase-js';

// const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
// const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
// const WEBHOOK_SECRET = Deno.env.get('PAYMENT_WEBHOOK_SECRET')!;

// Deno.serve(async (req) => {
//   if (req.method !== 'POST') {
//     return new Response('Method not allowed', { status: 405 });
//   }

//   const signature = req.headers.get('x-webhook-signature') || '';
//   const rawBody = await req.text();
//   const expected = await hmacSha512Hex(WEBHOOK_SECRET, rawBody);

//   if (!constantTimeEqual(signature, expected)) {
//     return new Response('Invalid signature', { status: 401 });
//   }

//   let payload: any;
//   try {
//     payload = JSON.parse(rawBody);
//   } catch {
//     return new Response('Invalid JSON', { status: 400 });
//   }

//   const reference: string | undefined =
//     payload?.data?.reference ?? payload?.reference;
//   const paidAmount: number | undefined =
//     payload?.data?.amount ?? payload?.amount;
//   const providerStatus: string | undefined =
//     payload?.data?.status ?? payload?.status;

//   if (!reference) {
//     return new Response('Missing reference', { status: 400 });
//   }

//   if (
//     providerStatus &&
//     !['success', 'successful', 'paid', 'succeeded'].includes(providerStatus)
//   ) {
//     return new Response('Ignored non-success status', { status: 200 });
//   }

//   const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
//     auth: { persistSession: false },
//   });

//   const { data: tx, error: lookupErr } = await admin
//     .from('transactions')
//     .select('id, amount_paid, coins_received, status')
//     .eq('reference', reference)
//     .single();

//   if (lookupErr || !tx) {
//     return new Response('Transaction not found', { status: 404 });
//   }

//   if (typeof paidAmount === 'number' && paidAmount > 0) {
//     const expectedMinor = Math.round(tx.amount_paid * 100);
//     if (paidAmount < expectedMinor) {
//       return new Response('Amount mismatch', { status: 400 });
//     }
//   }

//   const { data: result, error: rpcErr } = await admin.rpc('credit_coins', {
//     p_transaction_id: tx.id,
//     p_provider_reference: reference,
//   });

//   if (rpcErr) {
//     console.error('credit_coins failed', rpcErr);
//     return new Response('RPC error', { status: 500 });
//   }

//   return new Response(JSON.stringify(result), {
//     status: 200,
//     headers: { 'content-type': 'application/json' },
//   });
// });

// async function hmacSha512Hex(key: string, body: string): Promise<string> {
//   const enc = new TextEncoder();
//   const cryptoKey = await crypto.subtle.importKey(
//     'raw',
//     enc.encode(key),
//     { name: 'HMAC', hash: 'SHA-512' },
//     false,
//     ['sign']
//   );
//   const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(body));
//   return [...new Uint8Array(sig)]
//     .map((b) => b.toString(16).padStart(2, '0'))
//     .join('');
// }

// function constantTimeEqual(a: string, b: string): boolean {
//   if (a.length !== b.length) return false;
//   let diff = 0;
//   for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
//   return diff === 0;
// }