'use strict';
/* Psyop · registro della sessione
   Ogni sessione produce un log che permette di ricostruire cosa ha fatto il giocatore, le sue scelte,
   i tempi di reazione e come la sua attività è cambiata in base agli avvenimenti.
   Con il consenso del giocatore il log viene inviato all'archivio (il Worker indicato in config.js).
   Non contiene foto della fotocamera, email o indirizzo IP. */

const LOG={id:null,code:null,consent:false,t0:0,ev:[],sent:false,meta:{},lastSnap:-1,scrollAcc:0,lastScrollLog:0,pending:{}};

function rid(n){const a='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='';const r=crypto.getRandomValues(new Uint8Array(n));for(const x of r)s+=a[x%a.length];return s}
function logOpen(consent){
  LOG.id=new Date().toISOString().replace(/[-:T]/g,'').slice(0,12)+'-'+rid(6);
  LOG.code='PSY-'+LOG.id.slice(-6);LOG.consent=!!consent;LOG.t0=Date.now();LOG.ev=[];LOG.sent=false;LOG.lastSnap=-1;LOG.pending={};
  const d=new Date();
  LOG.meta={
    started:d.toISOString(),localTime:d.toString().slice(0,24),tz:Intl.DateTimeFormat().resolvedOptions().timeZone,
    lang:navigator.language,device:/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)?'mobile':'desktop',
    screen:`${screen.width}x${screen.height}`,viewport:`${innerWidth}x${innerHeight}`,
    version:(typeof CFG!=='undefined'&&CFG.version)||'dev'
  };
}
/* registra un evento: ms = millisecondi reali dall'inizio, g = ora di gioco */
function L(type,data){
  if(!LOG.id)return;
  const d=Object.assign({},data||{});if('type' in d){d.atype=d.type;delete d.type}// il tipo di account non deve sovrascrivere il nome dell'evento
  const e=Object.assign({ms:Date.now()-LOG.t0,g:typeof S!=='undefined'&&S?S.t:null},d,{type});
  LOG.ev.push(e);
  if(LOG.ev.length>6000)LOG.ev.splice(1,500);// tetto di sicurezza
  try{if(LOG.ev.length%25===0)store.set('psyop.log.draft',logPayload(true))}catch(e){}
  return e;
}
/* stato del mondo in un momento */
function stateSnap(){
  if(!S)return null;const N=NARR();
  const top=N.map((n,k)=>[n.id,+(S.adopt[k]*100).toFixed(1),S.stage[k]]).sort((a,b)=>b[1]-a[1]).slice(0,4);
  return{chaos:+S.chaos.toFixed(1),sus:+S.sus.toFixed(1),cred:+S.cred.toFixed(1),noise:+(S.noise*100).toFixed(1),
    followers:Math.round(followers()),eur:+S.eur.toFixed(2),nero:+S.nero.toFixed(2),attention:+S.attention.toFixed(1),
    fear:+(S.pop.agg.fear*100).toFixed(1),trust:+(S.pop.agg.trust*100).toFixed(1),top,posts:S.posts};
}
function logSnapTick(){
  if(!S||!LOG.id)return;
  if(S.t-LOG.lastSnap>=3){LOG.lastSnap=S.t;L('state',{s:stateSnap()})}
  // scroll aggregato ogni 20 secondi
  const now=Date.now();if(now-LOG.lastScrollLog>20000){if(LOG.scrollAcc>0)L('scroll',{px:Math.round(LOG.scrollAcc)});LOG.scrollAcc=0;LOG.lastScrollLog=now}
}
/* tempi di reazione: segna quando qualcosa compare, misura quando il giocatore risponde */
function markSeen(key){LOG.pending[key]=Date.now()}
function since(key){return LOG.pending[key]?Date.now()-LOG.pending[key]:null}

function logPayload(partial){
  return{id:LOG.id,code:LOG.code,consent:LOG.consent,partial:!!partial,meta:Object.assign({},LOG.meta,{player:S?S.handle:null,
    durationMs:Date.now()-LOG.t0,trends:typeof TR!=='undefined'?{live:TR.live,src:TR.src,items:TR.items.map(i=>i.t)}:null}),events:LOG.ev};
}
async function logSend(partial){
  if(!LOG.id||!LOG.consent||(LOG.sent&&!partial))return false;
  const url=(typeof CFG!=='undefined'&&CFG.workerUrl)?CFG.workerUrl.replace(/\/$/,'')+'/log':null;
  const body=JSON.stringify(logPayload(partial));
  if(!url){store.set('psyop.log.last',JSON.parse(body));return false}
  try{
    if(partial&&navigator.sendBeacon){return navigator.sendBeacon(url,new Blob([body],{type:'text/plain'}))}
    const r=await fetch(url,{method:'POST',headers:{'content-type':'text/plain'},body,keepalive:body.length<60000});
    if(r.ok){LOG.sent=true;store.del('psyop.log.draft');return true}
  }catch(e){}
  store.set('psyop.log.unsent',JSON.parse(body));return false;
}
/* se l'ultima volta l'invio era fallito, riprova all'avvio */
async function logRetryUnsent(){
  const u=store.get('psyop.log.unsent');if(!u||typeof CFG==='undefined'||!CFG.workerUrl)return;
  try{const r=await fetch(CFG.workerUrl.replace(/\/$/,'')+'/log',{method:'POST',headers:{'content-type':'text/plain'},body:JSON.stringify(u)});if(r.ok)store.del('psyop.log.unsent')}catch(e){}
}
// chiusura della pagina a metà sessione: invia quello che c'è, marcato come parziale
addEventListener('pagehide',()=>{if(LOG.id&&!LOG.sent&&S&&!S.ended){L('page_closed');logSend(true)}});

/* ---------- schermata di consenso ---------- */
function consentScreen(onDone){
  const el=document.createElement('div');el.className='full consent';
  const C=TEXT.consent;
  el.innerHTML=`<div class="logo">psyop<i>.</i></div><h2 class="ctitle">${esc(C.title)}</h2>
   <p class="ctext">${esc(C.intro)}</p>
   <div class="cbox"><b>${esc(C.collectTitle)}</b><ul>${C.collect.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>
   <div class="cbox"><b>${esc(C.notTitle)}</b><ul>${C.not.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>
   <p class="ctext small">${esc(C.rights)}</p>
   <div class="stack"><button class="btn dark" id="cYes">${esc(C.yes)}</button><button class="btn ghost" id="cNo">${esc(C.no)}</button></div>`;
  $('#screen').append(el);
  $('#cYes').onclick=()=>{el.remove();onDone(true)};
  $('#cNo').onclick=()=>{el.remove();onDone(false)};
}
