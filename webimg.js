'use strict';
/* Psyop · immagini dal web
   A ogni partita il browser cerca foto su Wikimedia Commons (licenze libere, con autore e licenza
   mostrati sull'immagine) usando parole chiave per ogni narrativa, per le notizie e per gli annunci,
   più le immagini delle voci Wikipedia legate alle tendenze del giorno.
   Funziona quando il gioco è aperto come file nel browser del computer. Nella pagina pubblicata su
   claude.ai il browser blocca le immagini di altri siti: lì il gioco usa la libreria media (Debug → Editor),
   dove si possono incollare o trascinare immagini prese dal web. */

const WEB={pool:{},trend:{},ok:null,tried:false};
const COMMONS='https://commons.wikimedia.org/w/api.php';

function stripHtml(s){const d=document.createElement('div');d.innerHTML=String(s||'');return(d.textContent||'').trim()}
async function commonsSearch(q,n=12,signal){
  const u=`${COMMONS}?action=query&format=json&origin=*&generator=search&gsrnamespace=6&gsrlimit=${n}&gsrsearch=${encodeURIComponent('filetype:bitmap '+q)}&prop=imageinfo&iiprop=url|extmetadata|size&iiurlwidth=640`;
  const r=await fetch(u,{signal});if(!r.ok)throw new Error('http '+r.status);
  const j=await r.json(),pages=j.query&&j.query.pages?Object.values(j.query.pages):[];
  return pages.map(p=>{const ii=p.imageinfo&&p.imageinfo[0];if(!ii||!ii.thumburl)return null;
    const m=ii.extmetadata||{},lic=(m.LicenseShortName&&m.LicenseShortName.value)||'',art=stripHtml(m.Artist&&m.Artist.value).slice(0,40);
    if(ii.width&&ii.height&&(ii.width/ii.height<1.1||ii.width<500))return null;// solo orizzontali e abbastanza grandi
    if(/fair use|non-free/i.test(lic))return null;
    return{kind:'real',type:'image',url:ii.thumburl,credit:`${art||'Autore sconosciuto'} · ${lic||'licenza libera'} · Wikimedia Commons`,page:ii.descriptionurl}}).filter(Boolean);
}
async function wikiThumb(title,signal){
  const r=await fetch(`https://it.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,{signal});if(!r.ok)return null;
  const j=await r.json();const t=j.originalimage||j.thumbnail;if(!t||!t.source)return null;
  // niente ritratti: le voci su persone sono già escluse dalle tendenze, qui si scartano anche le immagini verticali
  if(t.width&&t.height&&t.width/t.height<1.05)return null;
  const src=j.thumbnail&&j.thumbnail.source||t.source;
  return{kind:'real',type:'image',url:src.replace(/\/\d+px-/,'/640px-'),credit:`Immagine della voce «${j.title}» · Wikipedia`};
}

/* carica il pool di questa partita, in parallelo e con un tempo massimo */
async function loadWebImages(){
  WEB.pool={};WEB.trend={};WEB.tried=true;
  const Q=TEXT.webimg||{},ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),8000);
  try{
    // prova veloce: se il browser blocca il sito (pagina pubblicata), si smette subito
    await commonsSearch('Italy street',3,ctl.signal);WEB.ok=true;
  }catch(e){WEB.ok=false;clearTimeout(to);return}
  const jobs=[];
  const add=(key,q)=>jobs.push(commonsSearch(q,10,ctl.signal).then(r=>{(WEB.pool[key]=WEB.pool[key]||[]).push(...r)}).catch(()=>{}));
  for(const n of NARR()){const qs=(Q.queries&&Q.queries[n.id])||[];shuffleInPlace(qs.slice()).slice(0,2).forEach(q=>add(n.id,q))}
  shuffleInPlace((Q.news||[]).slice()).slice(0,2).forEach(q=>add('_news',q));
  shuffleInPlace((Q.ads||[]).slice()).slice(0,2).forEach(q=>add('_ads',q));
  for(const it of (TR.items||[])){if(it.img){WEB.trend[it.t]={kind:'real',type:'image',url:it.img,credit:`Immagine della voce «${it.t}» · Wikipedia`};continue}jobs.push(wikiThumb(it.t,ctl.signal).then(m=>{if(m)WEB.trend[it.t]=m}).catch(()=>{}))}
  await Promise.all(jobs);clearTimeout(to);
  for(const k in WEB.pool)WEB.pool[k]=shuffleInPlace(WEB.pool[k]);
}
function shuffleInPlace(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function webMedia(key){const a=WEB.pool[key];if(!a||!a.length)return null;return Object.assign({},a[Math.floor(Math.random()*a.length)])}
function webTrendMedia(text){
  const t=Object.keys(WEB.trend).find(k=>String(text).includes(k));return t?Object.assign({},WEB.trend[t]):null;
}
function webCount(){return Object.values(WEB.pool).reduce((a,b)=>a+b.length,0)+Object.keys(WEB.trend).length}
