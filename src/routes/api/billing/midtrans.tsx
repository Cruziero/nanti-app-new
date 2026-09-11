import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
export const Route=createFileRoute('/api/billing/midtrans')({server:{handlers:{POST:async({request})=>{
 const key=process.env['MIDTRANS_SERVER_KEY'];if(!key||process.env['NANTI_PAYMENTS_ENABLED']!=='true')return new Response('Unavailable',{status:503});
 try{const raw=await request.text();if(raw.length>20000)return new Response('Too large',{status:413});const body=z.object({order_id:z.string().max(50),status_code:z.string(),gross_amount:z.string(),signature_key:z.string()}).parse(JSON.parse(raw));const {validNotification,adminDb}=await import('@/lib/launch.server');if(!validNotification(body,key))return new Response('Unauthorized',{status:401});
 const db=adminDb();const {data:order,error}=await db.from('launch_orders').select('*').eq('id',body.order_id).single();if(error||!order)return new Response('Not found',{status:404});
 // Reconcile with provider, not browser callbacks or unverified notification fields.
 const host=process.env['MIDTRANS_IS_PRODUCTION']==='true'?'https://api.midtrans.com':'https://api.sandbox.midtrans.com';const res=await fetch(`${host}/v2/${encodeURIComponent(body.order_id)}/status`,{headers:{Authorization:`Basic ${Buffer.from(key+':').toString('base64')}`},signal:AbortSignal.timeout(12000)});if(!res.ok)return new Response('Retry',{status:503});const status=await res.json();if(status.order_id!==order.id||Number(status.gross_amount)!==order.amount||status.currency!=='IDR')return new Response('Amount mismatch',{status:400});
 if(status.transaction_status==='settlement'||(status.transaction_status==='capture'&&status.fraud_status==='accept')){const applied=await db.rpc('launch_apply_payment',{p_order:order.id});if(applied.error)throw applied.error;}else if(!order.applied_at){const update=await db.from('launch_orders').update({status:status.transaction_status}).eq('id',order.id).is('applied_at',null);if(update.error)throw update.error;}
 return Response.json({ok:true});
 }catch{return new Response('Unable to process. Retry later.',{status:500});}
}}}});
