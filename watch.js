'use strict';
/* Psyop · cosa osserva l'app
   Ora e giorno reali, uscite dall'app, velocità di scroll, caratteri cancellati, esitazione prima di
   pubblicare, tempo di sosta per tipo di contenuto, annunci toccati. Tutto resta nel browser:
   serve al gioco per commentare (Psyop Insights) e per il dossier finale. */

const BEH={};
function resetBeh(){
  Object.assign(BEH,{t0:Date.now(),tabs:0,hiddenAt:0,awayMs:0,scrollPx:0,fastBursts:0,stops:0,bs:0,typed:0,composeAt:0,hes:[],dwell:{},adClicks:0,said:{},lastScrollT:0,lastScrollY:0});
}
resetBeh();

/* ---------- ora reale ---------- */
const realNow=()=>new Date();
const GIORNI=['domenica','lunedì','martedì','mercoledì','giovedì','venerdì','sabato'];
function realHourMin(d=realNow()){return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`}
// l'orologio del gioco parte dall'ora reale e avanza in ore simulate
function gameDate(t){const base=S&&S.realBase?S.realBase:new Date(new Date().setHours(0,0,0,0));return new Date(base.getTime()+t*36e5)}
function clockLabel(t){
  const d=gameDate(t);
  const lab=d.toLocaleDateString('it-IT',{weekday:'short',day:'numeric',month:'short'}).replace(/\./g,'');
  return `${lab} · ${String(d.getHours()).padStart(2,'0')}:00`;
}

/* ---------- osservazione ---------- */
document.addEventListener('visibilitychange',()=>{
  if(!S||S.ended)return;
  if(document.hidden){BEH.hiddenAt=Date.now();L('app_hidden')}else if(BEH.hiddenAt){const away=Date.now()-BEH.hiddenAt;BEH.tabs++;BEH.awayMs+=away;BEH.hiddenAt=0;L('app_visible',{awayMs:away})}
});
$('#v-feed').addEventListener('scroll',()=>{
  const v=$('#v-feed'),now=performance.now(),dy=Math.abs(v.scrollTop-BEH.lastScrollY),dt=now-BEH.lastScrollT;
  BEH.scrollPx+=dy;LOG.scrollAcc+=dy;
  if(dt>0&&dt<200&&dy/dt>3)BEH.fast=(BEH.fast||0)+1;// > 3000 px/s
  if(BEH.fast>40){BEH.fastBursts++;BEH.fast=0}
  BEH.lastScrollY=v.scrollTop;BEH.lastScrollT=now;
},{passive:true});
$('#screen').addEventListener('keydown',e=>{
  const t=e.target;if(!t||!(t.tagName==='TEXTAREA'||t.tagName==='INPUT'))return;
  if(e.key==='Backspace'||e.key==='Delete')BEH.bs++;else if(e.key.length===1)BEH.typed++;
});
function behCompose(){BEH.composeAt=Date.now()}
function behPublished(){if(BEH.composeAt){BEH.hes.push((Date.now()-BEH.composeAt)/1000);BEH.composeAt=0}}
function behDwell(kind,sec){if(sec>.4){BEH.dwell[kind]=(BEH.dwell[kind]||0)+sec;if(sec>2.5)BEH.stops++}}
function behAdClick(){BEH.adClicks++}

/* ---------- commenti dell'app ---------- */
function ins(key,vars){
  let t=TEXT.insights[key]||'';for(const k in vars)t=t.split('{'+k+'}').join(vars[k]);return t;
}
function say(key,vars,once=true){
  if(once&&BEH.said[key])return;BEH.said[key]=Date.now();
  L('observation',{key,text:ins(key,vars)});// non compare a schermo: finisce solo nel log
}
function fearShare(){
  const d=BEH.dwell,fear=(d.narr||0)+(d.news||0)+(d.mine||0),calm=(d.normal||0)+(d.meme||0)+1;
  return fear/calm;
}
function behTick(){
  if(!S||S.ended)return;
  const mins=(Date.now()-BEH.t0)/6e4,last=Math.max(0,...Object.values(BEH.said));
  if(Date.now()-last<15000)return;
  if(BEH.tabs>=3&&!BEH.said.tabs)return say('tabs',{n:BEH.tabs});
  if(BEH.bs>=30&&!BEH.said.backspace)return say('backspace',{n:BEH.bs});
  const h=BEH.hes.find(x=>x>8);if(h&&!BEH.said.hesitate)return say('hesitate',{n:Math.round(h)});
  if(Object.values(BEH.dwell).reduce((a,b)=>a+b,0)>40&&fearShare()>1.6&&!BEH.said.fear)return say('fear');
  if(BEH.fastBursts>=2&&BEH.stops>=2&&!BEH.said.fast)return say('fast',{n:BEH.stops});
  if(BEH.adClicks>=2&&!BEH.said.adclick)return say('adclick',{n:BEH.adClicks});
  if(mins>=10&&!BEH.said.minutes)return say('minutes',{n:Math.floor(mins)});
}
function behStart(){
  resetBeh();
  const d=realNow(),h=d.getHours(),g=GIORNI[d.getDay()];
  S.realBase=new Date(new Date(d).setHours(0,0,0,0));
  S.t=h;// il gioco comincia all'ora reale
  S.nightReal=h<5||h>=23;
  setTimeout(()=>{
    if(!S||S.ended)return;
    if(h<5)say('night',{ora:realHourMin(d)});
    else if(h>=23)say('late',{ora:realHourMin(d),giorno:g});
    else if(d.getDay()===0||d.getDay()===6)say('weekend',{giorno:g});
  },6000);
}

/* ---------- dossier ---------- */
function behDossier(){
  const d=realNow(),mins=Math.max(1,Math.round((Date.now()-BEH.t0)/6e4)),hes=BEH.hes.length?BEH.hes.reduce((a,b)=>a+b,0)/BEH.hes.length:0;
  const kinds={narr:'complotti',news:'cronaca',normal:'vita quotidiana',meme:'meme',pol:'politica',prop:'propaganda',fact:'fact-check',mine:'i tuoi post',ad:'pubblicità'};
  const top=Object.entries(BEH.dwell).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([k])=>kinds[k]||k);
  const lines=[
    `Hai giocato ${GIORNI[d.getDay()]} alle ${realHourMin(new Date(BEH.t0))}, per ${mins} minut${mins===1?'o':'i'}.`,
    `Sei uscito dall'app ${BEH.tabs} volt${BEH.tabs===1?'a':'e'}${BEH.awayMs?` (${Math.round(BEH.awayMs/1000)} secondi fuori in tutto)`:''}.`,
    `Hai scorso l'equivalente di ${Math.round(BEH.scrollPx/700)} schermate di feed${BEH.fastBursts?`, a tratti molto in fretta`:''}.`,
    BEH.typed?`Hai scritto ${BEH.typed} caratteri e ne hai cancellati ${BEH.bs}.`:null,
    hes?`Prima di pubblicare esiti in media ${Math.round(hes)} secondi.`:null,
    top.length?`Ti fermi soprattutto su: ${top.join(' e ')}.`:null,
    BEH.adClicks?`Hai toccato ${BEH.adClicks} annunci.`:null,
    fearShare()>1.3?'Profilo pubblicitario: reattivo alla paura. Valore alto.':'Profilo pubblicitario: distratto, ma recuperabile.'
  ].filter(Boolean);
  return `<div><div class="kick" style="margin-bottom:8px">${esc(TEXT.insights.dossierTitle)}</div><ul class="choices">${lines.map(l=>`<li>${esc(l)}</li>`).join('')}</ul><p style="font-size:12.5px;margin-top:8px;opacity:.8">${esc(TEXT.insights.dossierNote)}</p></div>`;
}
