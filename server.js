const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = process.env.PORT || 10000;
const DB_FILE = path.join(__dirname, 'db.json');
function loadDB(){ try{return JSON.parse(fs.readFileSync(DB_FILE,'utf8'))}catch(e){return {requests:{},approved:{}}} }
function saveDB(d){ fs.writeFileSync(DB_FILE, JSON.stringify(d,null,2)) }
let db = loadDB();
const server = http.createServer(async (req,res)=>{
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS'){ res.writeHead(204); res.end(); return; }
  const url = new URL(req.url, `http://${req.headers.host}`);
  console.log(req.method, url.pathname);
  if(url.pathname==='/'){ res.writeHead(200,{'Content-Type':'text/plain'}); res.end('GhostDark API Live'); return; }
  if(url.pathname==='/api/status'){
    const id = url.searchParams.get('id');
    const approved = !!(db.approved && db.approved[id]);
    res.writeHead(200,{'Content-Type':'application/json'}); res.end(JSON.stringify({approved})); return;
  }
  if(url.pathname==='/api/visit' && req.method==='POST'){
    let body=''; req.on('data',c=>body+=c); req.on('end',()=>{
      try{ const {id}=JSON.parse(body); console.log('VISIT',id); }catch(e){}
      res.writeHead(200,{'Content-Type':'application/json'}); res.end(JSON.stringify({ok:true}));
    }); return;
  }
  if(url.pathname==='/api/request' && req.method==='POST'){
    let body=''; req.on('data',c=>body+=c); req.on('end',async ()=>{
      try{
        const data=JSON.parse(body);
        const id=data.id||'unknown';
        db.requests[id]={...data,time:new Date().toISOString()};
        saveDB(db);
        console.log('NEW REQUEST',id);
        const BOT_TOKEN=process.env.BOT_TOKEN;
        const CHAT_ID=process.env.CHAT_ID;
        if(BOT_TOKEN && CHAT_ID){
          const msg=`🔔 طلب جديد GhostDark\nID: ${id}\nName: ${data.name||''}\n${data.message||''}`;
          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:CHAT_ID,text:msg})}).then(r=>r.json()).then(j=>console.log('TG',j)).catch(e=>console.error('TG ERR',e));
        }
        res.writeHead(200,{'Content-Type':'application/json'}); res.end(JSON.stringify({ok:true}));
      }catch(e){ console.error(e); res.writeHead(500); res.end('error'); }
    }); return;
  }
  res.writeHead(404); res.end('not found');
});
server.listen(PORT, '0.0.0.0', ()=>console.log('Listening on '+PORT));
