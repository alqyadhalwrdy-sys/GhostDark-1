

let detector=null,stream=null,track=null,torch=false;
let lastResult="";

async function waitForApproval(id){
  const error=document.getElementById("error");
  for(let i=0;i<180;i++){
    await new Promise(resolve=>setTimeout(resolve,2000));
    try{
      const r=await fetch("/api/status?id="+encodeURIComponent(id));
      const d=await r.json();
      if(d.status==="approved"){
        localStorage.setItem("ghostActivationApproved","yes");
        error.textContent="تمت الموافقة! جارٍ فتح التطبيق...";
        document.getElementById("lock").style.display="none";
        document.getElementById("app").style.display="block";
        return;
      }
      if(d.status==="rejected"){
        localStorage.removeItem("ghostActivationRequest");
        error.textContent="تم رفض طلب التفعيل.";
        return;
      }
    }catch(e){}
  }
  error.textContent="انتهى انتظار الطلب. يمكنك طلب التفعيل مجدداً.";
}

async function requestActivation(){
  const error=document.getElementById("error");
  error.textContent="جارٍ إرسال طلب التفعيل...";
  try{
    const response=await fetch("/api/request",{method:"POST"});
    const data=await response.json();
    if(!response.ok)throw new Error(data.error||"تعذر إرسال الطلب");
    localStorage.setItem("ghostActivationRequest",data.request);
    error.textContent="وصل الطلب للمالك. انتظر الموافقة...";
    waitForApproval(data.request);
  }catch(e){
    error.textContent="تعذر الاتصال بخادم التفعيل. شغّل server.js أولاً.";
  }
}

function unlock(){
  if(localStorage.getItem("ghostActivationApproved")==="yes"){
    document.getElementById("lock").style.display="none";
    document.getElementById("app").style.display="block";
  }else{
    document.getElementById("error").textContent="لم تتم الموافقة على طلبك بعد.";
  }
}

if(localStorage.getItem("ghostActivationApproved")==="yes"){
  document.getElementById("lock").style.display="none";
  document.getElementById("app").style.display="block";
}
document.getElementById("pin").addEventListener("keydown",e=>{
  if(e.key==="Enter")unlock();
});

function menu(){
 let d=document.getElementById('drawer');
 d.style.display=d.style.display==="block"?"none":"block";
}
function home(){
 document.getElementById('home').hidden=false;
 document.getElementById('history').hidden=true;
 document.getElementById('networks').hidden=true;
}
function showNetworks(){
 stopScan();
 document.getElementById('home').hidden=true;
 document.getElementById('history').hidden=true;
 document.getElementById('networks').hidden=false;
 renderNetworks();
}
function getNetworks(){
 let saved=JSON.parse(localStorage.getItem('ghostNetworks')||'[]');
 if(saved.length)return saved;
 return [
  {name:'GhostDark_5G',password:'Demo12345'},
  {name:'Home_WiFi_Demo',password:'HomeDemo2026'},
  {name:'Ghost_Network',password:'GhostDemo123'}
 ];
}
function renderNetworks(){
 let list=document.getElementById('networkList');
 let data=getNetworks();
 list.innerHTML='';
 data.forEach((n,i)=>{
  let b=document.createElement('button');
  b.className='wifi-card';
  b.innerHTML='<span class="wifi-icon">⌁</span><span><span class="wifi-name"></span><span class="wifi-meta">شبكة تجريبية</span></span><span class="wifi-arrow">›</span>';
  b.querySelector('.wifi-name').textContent=n.name;
  b.onclick=()=>showNetworkQR(i);
  list.appendChild(b);
 });
}
function addNetwork(){
 let name=prompt('اسم شبكة Wi-Fi (SSID):');
 if(!name)return;
 let password=prompt('كلمة مرور الشبكة:');
 if(password===null)return;
 let data=getNetworks();
 data.push({name,password});
 localStorage.setItem('ghostNetworks',JSON.stringify(data));
 renderNetworks();
}
function editNetwork(){
 let i=window.currentGhostNetworkIndex;
 let data=getNetworks();
 if(!Number.isInteger(i)||!data[i]){
  alert('تعذر العثور على الشبكة');
  return;
 }
 let name=prompt('اسم الشبكة الجديد:',data[i].name);
 if(name===null||!name.trim())return;
 let password=prompt('كلمة المرور الجديدة:',data[i].password);
 if(password===null)return;
 data[i]={name:name.trim(),password:password};
 localStorage.setItem('ghostNetworks',JSON.stringify(data));
 window.currentGhostNetwork=data[i];
 renderNetworks();
 showNetworkQR(i);
 alert('تم تحديث الشبكة وإنشاء QR جديد');
}

function showNetworkQR(i){
 let data=getNetworks();
 let n=data[i];
 if(!n)return;
 window.currentGhostNetworkIndex=i;
 window.currentGhostNetwork=n;
 document.getElementById('networkListPage').style.display='none';
 document.getElementById('networkDetails').style.display='block';
 document.getElementById('detailNetworkName').textContent=n.name;
 window.ghostPasswordVisible=false;
 document.getElementById('networkPassword').textContent='••••••••••';
 let box=document.getElementById('networkQR');
 box.innerHTML='';
 box.style.display='flex';
 box.style.transform='scale(1)';
 let esc=v=>String(v).replace(/([\\;,:"])/g,'\\$1');
 let value='WIFI:T:WPA;S:'+esc(n.name)+';P:'+esc(n.password)+';;';
 if(!window.QRCode){
  alert('مكتبة QR غير متوفرة');
  return;
 }
 new QRCode(box,{
  text:value,
  width:200,
  height:200,
  colorDark:'#000000',
  colorLight:'#ffffff',
  correctLevel:QRCode.CorrectLevel.H
 });
}


function backToNetworkList(){
 document.getElementById('networkDetails').style.display='none';
 document.getElementById('networkListPage').style.display='block';
}
function toggleNetworkPassword(){
 let n=window.currentGhostNetwork;
 if(!n)return;
 window.ghostPasswordVisible=!window.ghostPasswordVisible;
 document.getElementById('networkPassword').textContent=window.ghostPasswordVisible?n.password:'••••••••••';
}
function copyNetworkPassword(){
 let n=window.currentGhostNetwork;
 if(!n)return;
 if(navigator.clipboard && navigator.clipboard.writeText){
  navigator.clipboard.writeText(n.password).then(()=>alert('تم نسخ كلمة المرور')).catch(()=>alert('تعذر النسخ من هذا المتصفح'));
 }else alert('النسخ غير مدعوم في هذا المتصفح');
}

function zoomNetworkQR(){
 let box=document.getElementById('networkQR');
 if(!box.innerHTML)return;
 let big=box.dataset.big!=='1';
 box.dataset.big=big?'1':'0';
 box.style.transform=big?'scale(1.25)':'scale(1)';
 box.style.transformOrigin='center';
 box.style.zIndex=big?'5':'1';
}
function hideNetworkQR(){
 let box=document.getElementById('networkQR');
 box.style.display='none';
 box.style.transform='scale(1)';
 box.dataset.big='0';
}
function saveNetworkQR(){
 let box=document.getElementById('networkQR');
 let canvas=box.querySelector('canvas');
 let img=box.querySelector('img');
 let url='';
 if(canvas)url=canvas.toDataURL('image/png');
 else if(img && img.src)url=img.src;
 if(!url){alert('اختر شبكة أولاً لإظهار رمز QR');return;}
 let a=document.createElement('a');
 a.href=url;
 a.download='GhostDark-WiFi-QR.png';
 document.body.appendChild(a);
 a.click();
 a.remove();
}
function showHistory(){
 menu();stopScan();
 document.getElementById('home').hidden=true;
 document.getElementById('history').hidden=false;
 let data=JSON.parse(localStorage.getItem('ghostHistory')||"[]");
 document.getElementById('saved').innerHTML=data.length?
 data.map((x,i)=>`<div id="item${i}" style="padding:12px;border-bottom:1px solid #246080;overflow-wrap:anywhere">${escapeHTML(x)}</div>`).join("")
 : "لا توجد قراءات محفوظة بعد";
}
function escapeHTML(s){
 return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function languages(){
 menu();
 let l=prompt("اختر اللغة: ar / en / tr / ru / it / de / ja");
 if(l)alert("سيتم إضافة الترجمة في الإصدار القادم: "+l);
}
function about(){
 menu();
 alert("الشبح المظلم\nتطوير: ابن الوردي لتعليم الهكر\nمنظمة الشبح المظلم\nحقوق التطبيق محفوظة");
}
function settings(){
 menu();alert("الإعدادات\n- الوضع الليلي\n- سجل القراءات\n- قفل التطبيق");
}
function contact(){
 menu();
 if(confirm("فتح محادثة المطور عبر تليجرام؟"))
  location.href="https://t.me/xomrate";
}
function report(){
 menu();location.href="mailto:alqyadhalwrdy@gmail.com?subject=بلاغ عن مشكلة";
}
async function setupDetector(){
 if(!('BarcodeDetector' in window)){
  alert("متصفحك لا يدعم قارئ الباركود المدمج. جرّب Chrome حديثًا.");
  return false;
 }
 let formats=await BarcodeDetector.getSupportedFormats();
 let wanted=['qr_code','ean_13','ean_8','code_128','code_39','upc_a','upc_e','pdf417','data_matrix'];
 let supported=wanted.filter(x=>formats.includes(x));
 detector=new BarcodeDetector({formats:supported});
 return true;
}
async function startScan(){
 try{
  if(!await setupDetector())return;
  stream=await navigator.mediaDevices.getUserMedia({
   video:{facingMode:{ideal:"environment"}},audio:false
  });
  let v=document.getElementById('video');
  v.srcObject=stream;v.style.display="block";
  track=stream.getVideoTracks()[0];
  scanLoop();
 }catch(e){alert("تعذر فتح الكاميرا. افتح الصفحة عبر HTTPS أو localhost واسمح بالكاميرا.");}
}
async function scanLoop(){
 if(!stream||!detector)return;
 try{
  let codes=await detector.detect(document.getElementById('video'));
  if(codes.length){
   showResult(codes[0].rawValue);
   stopScan();return;
  }
 }catch(e){}
 requestAnimationFrame(scanLoop);
}
async function readImage(e){
 let file=e.target.files[0];if(!file)return;
 try{
  if(!await setupDetector())return;
  let img=new Image(),url=URL.createObjectURL(file);
  img.onload=async()=>{
   try{
    let codes=await detector.detect(img);
    showResult(codes.length?codes[0].rawValue:"لم يتم العثور على باركود في الصورة");
   }catch(err){alert("تعذرت قراءة الصورة");}
   URL.revokeObjectURL(url);
  };
  img.src=url;
 }catch(err){alert("تعذرت قراءة الصورة");}
}
function showResult(value){
 lastResult=value;
 let wifi=value.match(/^WIFI:/i);
 let out=wifi?"تم العثور على رمز Wi-Fi:\n"+value:value;
 document.getElementById('result').textContent=out;
}
function saveResult(){
 if(!lastResult)return alert("لا توجد نتيجة لحفظها");
 let data=JSON.parse(localStorage.getItem('ghostHistory')||"[]");
 data.unshift(lastResult);
 localStorage.setItem('ghostHistory',JSON.stringify(data.slice(0,100)));
 alert("تم الحفظ على الجهاز");
}
async function copyResult(){
 if(!lastResult)return alert("لا توجد نتيجة");
 try{await navigator.clipboard.writeText(lastResult);alert("تم النسخ");}
 catch(e){alert("تعذر النسخ في هذا المتصفح");}
}
async function flash(){
 if(!track)return alert("شغّل الكاميرا أولاً");
 let caps=track.getCapabilities?.();
 if(!caps?.torch)return alert("الفلاش غير مدعوم في هذا الجهاز أو المتصفح");
 try{
  torch=!torch;
  await track.applyConstraints({advanced:[{torch}]});
 }catch(e){alert("تعذر تشغيل الفلاش");}
}
function stopScan(){
 if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}
 track=null;torch=false;
 document.getElementById('video').style.display="none";
}
