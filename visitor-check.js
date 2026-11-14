
(async()=>{
  let id=localStorage.getItem('ghostVisitorId');
  if(!id){
    const bytes=new Uint8Array(16);
    crypto.getRandomValues(bytes);
    id=Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('').toUpperCase();
    localStorage.setItem('ghostVisitorId',id);
  }
  try{
    const r=await fetch('/api/visit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})});
    const d=await r.json();
    if(d.status==='banned'||d.status==='restricted'){
      document.body.innerHTML='<main style="font-family:sans-serif;text-align:center;padding:40px;direction:rtl"><h2>تعذر الدخول إلى GhostDark</h2><p>'+(d.status==='banned'?'تم حظر هذا المستخدم.':'حسابك مقيّد مؤقتاً.')+'</p></main>';
    }
  }catch(e){console.log('Visitor tracking unavailable',e);}
})();
