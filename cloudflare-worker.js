// Cloudflare Worker. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID as secrets/variables.
// Set ALLOWED_ORIGIN to your GitHub Pages site origin, e.g. https://username.github.io
export default {
 async fetch(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = env.ALLOWED_ORIGIN || '';
  const headers = {'Content-Type':'application/json','Access-Control-Allow-Origin':allowed,'Vary':'Origin','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type'};
  const respond=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
  if (!allowed || origin !== allowed) return respond({error:'Origin not allowed'},403);
  if (request.method === 'OPTIONS') return new Response(null,{status:204,headers});
  if (request.method !== 'POST') return respond({error:'Method not allowed'},405);
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return respond({error:'Server is not configured'},503);
  if (Number(request.headers.get('content-length')||0)>2048) return respond({error:'Too large'},413);
  let data;try{data=await request.json()}catch{return respond({error:'Invalid JSON'},400)}
  if (data.website) return respond({ok:true}); // honeypot
  const name=String(data.name||'').trim().slice(0,80);
  const phone=String(data.phone||'').trim().slice(0,24);
  if (name.length<2 || !/^[+0-9() .-]{9,24}$/.test(phone)) return respond({error:'Invalid name or phone'},400);
  const msg=`Нове замовлення\nТовар: Лазерний пристрій для носа\nЦіна: 469 грн\nКількість: 1\nІм’я: ${name}\nТелефон: ${phone}`;
  try {
   const r=await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:env.TELEGRAM_CHAT_ID,text:msg})});
   const result=await r.json();if(!r.ok||!result.ok)return respond({error:'Telegram delivery failed'},502);
   return respond({ok:true});
  } catch {return respond({error:'Telegram unavailable'},502)}
 }
};
