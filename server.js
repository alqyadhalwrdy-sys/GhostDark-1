const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = process.env.ADMIN_ID;
app.use(cors({origin:'*'}));
app.use(express.json());
let requests = {}; let users = {}; let banned = new Set();

app.get('/', (req,res)=>res.send('GhostDark Online 👻'));
app.get('/health', (req,res)=>res.json({status:'ok', time: Date.now()})); // هذا عشان ما ينام

app.post('/api/request', async (req,res)=>{
  const id = req.body.id.toString().toUpperCase().slice(0,20);
  if(banned.has(id)) return res.json({status:'banned'});
  requests[id] = {status:'pending', time:new Date().toISOString()};
  users[id] = {id, status:'pending'};
  try{ await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({chat_id:ADMIN_ID, text:`🔔 طلب جديد: ${id}\n/approve ${id}`})}); }catch(e){}
  res.json({ok:true, id, status:'pending'});
});
app.get('/api/status',(req,res)=>{
  const id=(req.query.id||'').toUpperCase();
  if(banned.has(id)) return res.json({status:'banned'});
  res.json(requests[id]||{status:'unknown'});
});
app.post(`/webhook/${BOT_TOKEN}`, async (req,res)=>{
  res.sendStatus(200);
  const t=req.body.message?.text||''; const chat=req.body.message?.chat?.id?.toString();
  if(chat!==ADMIN_ID?.toString()) return;
  const send = async (m)=>{ await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({chat_id:ADMIN_ID, text:m})}); };
  if(t.startsWith('/approve')){ const id=t.split(' ')[1]?.toUpperCase(); if(id){ requests[id]={status:'approved'}; await send(`✅ وافقت على ${id}`); } }
  else if(t.startsWith('/reject')){ const id=t.split(' ')[1]?.toUpperCase(); if(id){ requests[id]={status:'rejected'}; await send(`❌ رفضت ${id}`); } }
  else if(t.startsWith('/help')||t.startsWith('/start')||t.startsWith('/stats')){ await send(`👻 لوحة GhostDark\n/approve ID\n/reject ID\n/stats\n/users\n/ban ID\n/unban ID`); }
  else if(t.startsWith('/users')||t=='/list'){ await send(`المستخدمين: ${Object.keys(users).length}\nالطلبات: ${Object.entries(requests).map(([k,v])=>k+':'+v.status).join('\n').slice(0,3000)}`); }
});
app.listen(process.env.PORT||3000);
