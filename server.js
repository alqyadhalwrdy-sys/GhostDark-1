const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = process.env.ADMIN_ID;
app.use(cors({origin:'*'}));
app.use(express.json());
let requests = {};

app.get('/', (req,res)=>res.send('OK'));
app.post('/api/request', async (req,res)=>{
  const id = req.body.id.toString().toUpperCase().slice(0,20);
  requests[id] = {status:'pending'}; // يبقى معلق لحد ما توافق انت
  try{
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,{
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({chat_id:ADMIN_ID, text:`🔔 طلب جديد:\n${id}\n\nوافق: /approve ${id}\nارفض: /reject ${id}`})
    });
  }catch(e){}
  res.json({ok:true, id, status:'pending'});
});
app.get('/api/status',(req,res)=>{
  const id=(req.query.id||'').toUpperCase();
  res.json(requests[id]||{status:'unknown'});
});
app.post(`/webhook/${BOT_TOKEN}`, async (req,res)=>{
  res.sendStatus(200);
  const t=req.body.message?.text||''; const chat=req.body.message?.chat?.id;
  if(chat?.toString()!==ADMIN_ID?.toString()) return;
  if(t.startsWith('/approve')){
    const id=t.split(' ')[1]?.toUpperCase(); if(id){requests[id]={status:'approved'};
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({chat_id:ADMIN_ID, text:`✅ وافقت على ${id}`})});
    }
  } else if(t.startsWith('/reject')){
    const id=t.split(' ')[1]?.toUpperCase(); if(id){requests[id]={status:'rejected'};
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({chat_id:ADMIN_ID, text:`❌ رفضت ${id}`})});
    }
  } else if(t.startsWith('/help')||t.startsWith('/start')){
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({chat_id:ADMIN_ID, text:`/approve CODE\n/reject CODE\n/list`})});
  } else if(t.startsWith('/list')){
    let l=Object.keys(requests).map(k=>`${k}:${requests[k].status}`).join('\n')||'فارغ';
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({chat_id:ADMIN_ID, text:l})});
  }
});
app.listen(process.env.PORT||3000);
