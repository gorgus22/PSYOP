'use strict';
/* Psyop · tendenze reali
   Ordine delle fonti a ogni partita:
   1. database del gioco (documento trends/latest), aggiornato ogni giorno da un'attività programmata
      con Google Trends Italia, titoli ANSA e Wikipedia;
   2. lettura diretta di Wikipedia dal browser (funziona quando il gioco è aperto come file sul computer);
   3. esempi generici di riserva (TEXT.trends.fallback).
   A ogni partita si sceglie a caso un sottoinsieme di argomenti; Claude scrive post, propaganda, annunci
   e notizie che li integrano. Se Claude non è disponibile, si usano i modelli di TEXT.trends. */

const TR={items:[],date:null,src:'esempi',live:false,gen:null,used:{}};

/* ---------- filtro: niente persone reali, niente fatti tragici ---------- */
function trendOk(it){
  if(!it||!it.t)return false;
  const T=TEXT.trends,txt=(it.t+' '+(it.d||'')+' '+(it.h||'')).toLowerCase();
  if(it.t.length<2||it.t.length>60)return false;
  if(/^(pagina principale|speciale:|wikipedia:|file:|categoria:|aiuto:|portale:)/i.test(it.t))return false;
  if((T.block||[]).some(w=>txt.includes(w)))return false;
  if(it.k==='persona')return false;
  const d=(it.d||'').toLowerCase();
  if(d&&(T.people||[]).some(w=>d.includes(w)))return false;
  // estratto di Wikipedia che comincia come una biografia: "Nome (Città, 12 marzo 1990) è ..."
  if(it.x&&/^[^.]{0,80}\([^)]*\b(1[89]|20)\d\d\b[^)]*\)\s*(è|era|fu)\b/.test(it.x))return false;
  return true;
}
function cleanTitle(t){return String(t).replace(/_/g,' ').replace(/\s*\(.*?\)\s*$/,'').trim()}

/* ---------- fonti ---------- */
async function trendsFromDb(){
  await capsReady;if(!dbNs)return null;
  try{
    const snap=await dbNs.doc('trends/latest').get();if(!snap.exists)return null;
    const d=snap.data()||{};if(!Array.isArray(d.items)||!d.items.length)return null;
    const age=(Date.now()-new Date(d.updated||d.date||0).getTime())/864e5;
    if(!(age<4))return null;// più vecchi di 4 giorni: meglio provare altro
    return{items:d.items,date:d.date,src:(d.sources||['database']).join(' · ')};
  }catch(e){return null}
}
async function trendsFromWikipedia(){
  // pageviews di ieri su it.wikipedia; serve CORS, quindi va solo fuori da claude.ai
  const y=new Date(Date.now()-864e5),p=n=>String(n).padStart(2,'0');
  const url=`https://wikimedia.org/api/rest_v1/metrics/pageviews/top/it.wikipedia/all-access/${y.getFullYear()}/${p(y.getMonth()+1)}/${p(y.getDate())}`;
  const ctl=new AbortController();const to=setTimeout(()=>ctl.abort(),4000);
  try{
    const r=await fetch(url,{signal:ctl.signal});if(!r.ok)return null;
    const j=await r.json();const arts=(j.items&&j.items[0]&&j.items[0].articles||[]).filter(a=>!/[:]|Pagina_principale/.test(a.article)).slice(0,24);
    const out=[];
    await Promise.all(arts.map(async a=>{
      try{const s=await fetch(`https://it.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(a.article)}`,{signal:ctl.signal}).then(r=>r.ok?r.json():null);
        if(s){const im=s.thumbnail;out.push({t:cleanTitle(s.title||a.article),d:s.description||'',x:(s.extract||'').slice(0,200),k:'wiki',src:'Wikipedia',v:a.views,checked:true,img:im&&im.width/im.height>=1.05?im.source.replace(/\/\d+px-/,'/640px-'):null})}}catch(e){}
    }));
    out.sort((a,b)=>b.v-a.v);
    return out.length?{items:out,date:`${y.getFullYear()}-${p(y.getMonth()+1)}-${p(y.getDate())}`,src:'Wikipedia (voci più lette di ieri)'}:null;
  }catch(e){return null}finally{clearTimeout(to)}
}

/* ---------- fonti dal vivo (versione GitHub Pages) ---------- */
async function getJSON(url,ms=5000){
  const ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),ms);
  try{const r=await fetch(url,{signal:ctl.signal});if(!r.ok)return null;return await r.json()}catch(e){return null}finally{clearTimeout(to)}
}
// il Worker restituisce Google Trends Italia già filtrato e l'umore delle notizie (GDELT)
async function trendsFromWorker(){
  if(typeof CFG==='undefined'||!CFG.workerUrl)return null;
  const j=await getJSON(CFG.workerUrl.replace(/\/$/,'')+'/trends',6000);
  if(!j||!Array.isArray(j.items))return null;
  if(typeof j.tone==='number')TR.tone=j.tone;
  return{items:j.items.map(i=>Object.assign({src:'Google Trends'},i)),date:j.date,src:'Google Trends Italia'};
}
// hashtag di tendenza su un'istanza Mastodon italiana (API pubblica)
async function trendsFromMastodon(){
  if(typeof CFG==='undefined'||!CFG.mastodon)return null;
  const j=await getJSON(CFG.mastodon.replace(/\/$/,'')+'/api/v1/trends/tags?limit=20',5000);
  if(!Array.isArray(j))return null;
  const items=j.map(t=>{const uses=(t.history||[]).slice(0,2).reduce((a,h)=>a+(+h.uses||0),0);
    const name=String(t.name||'').replace(/([a-zà-ù])([A-Z])/g,'$1 $2');return{t:name,k:'tema',src:'Mastodon',v:uses}}).filter(i=>i.t.length>2);
  return items.length?{items,src:'Mastodon'}:null;
}
// controllo con Wikipedia: scarta le voci su persone e prende l'immagine (solo orizzontale)
async function wikiCheck(it){
  const j=await getJSON(`https://it.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(it.t)}`,4000);
  if(!j||j.type==='disambiguation')return it;
  it.d=it.d||j.description||'';it.x=it.x||(j.extract||'').slice(0,200);
  const im=j.thumbnail;if(im&&im.width/im.height>=1.05&&!it.img)it.img=im.source.replace(/\/\d+px-/,'/640px-');
  return it;
}

/* ---------- scelta semicasuale per questa partita ---------- */
function pickForGame(list){
  const ok=list.filter(trendOk);
  // mescola con un po' di peso verso le prime posizioni (le più cercate)
  const w=ok.map((it,i)=>[it,Math.random()*(1+2/(1+i*.4))]).sort((a,b)=>b[1]-a[1]).map(x=>x[0]);
  return w.slice(0,ri(6,9));
}
function mergeLists(lists){
  // Google Trends prima, poi Wikipedia e Mastodon alternati; niente doppioni
  const seen=new Set(),out=[];const L=lists.filter(Boolean).map(x=>x.items.slice());
  let added=true;while(added){added=false;for(const l of L){const it=l.shift();if(!it)continue;added=true;const key=it.t.toLowerCase().replace(/\s+/g,'');if(seen.has(key))continue;seen.add(key);out.push(it)}}
  return out;
}
async function loadTrends(){
  TR.gen=null;TR.used={};TR.tone=null;
  let got=await trendsFromDb();// solo su claude.ai
  if(!got){
    const [w,wk,m]=await Promise.all([trendsFromWorker(),trendsFromWikipedia(),trendsFromMastodon()]);
    const all=mergeLists([w,wk,m]);
    if(all.length){
      // controllo persone e immagini per i candidati che non arrivano già verificati
      const cand=all.slice(0,24);await Promise.all(cand.filter(i=>!i.checked).map(wikiCheck));
      got={items:cand,date:(w&&w.date)||(wk&&wk.date)||new Date().toISOString().slice(0,10),src:[w,wk,m].filter(Boolean).map(x=>x.src).join(' · ')};
    }
  }
  if(got){const items=pickForGame(got.items);if(items.length>=3){Object.assign(TR,{items,date:got.date,src:got.src,live:true,pool:got.items.filter(trendOk)});return TR}}
  Object.assign(TR,{items:pickForGame(TEXT.trends.fallback||[]),date:null,src:TEXT.trends.fallbackLabel,live:false,pool:[]});
  return TR;
}
/* durante la sessione: ricarica le tendenze e fa entrare quelle nuove */
async function refreshTrends(){
  if(!S||S.ended||!TR.live)return;
  const before=new Set(TR.items.map(i=>i.t.toLowerCase()));
  const [w,m]=await Promise.all([trendsFromWorker(),trendsFromMastodon()]);
  const fresh=mergeLists([w,m]).filter(i=>!before.has(i.t.toLowerCase())).slice(0,6);
  await Promise.all(fresh.map(wikiCheck));
  const ok=fresh.filter(trendOk).slice(0,2);
  for(const it of ok){
    TR.items.push(it);if(TR.items.length>12)TR.items.shift();
    if(it.img&&typeof WEB!=='undefined')WEB.trend[it.t]=({kind:'real',type:'image',url:it.img,credit:`Immagine della voce «${it.t}» · Wikipedia`});
    L('trend_new',{t:it.t,src:it.src});
    const tx=fillTrend(pick(TEXT.trends.news)).replace(/«[^»]*»/,`«${it.t}»`);
    if(typeof cronaca==='function')cronaca(tx,false);
  }
}
setInterval(()=>{refreshTrends()},((typeof CFG!=='undefined'&&CFG.refreshMin)||10)*60000);

/* ---------- uso nei testi ---------- */
function trendTerm(exclude){
  if(!TR.items.length)return'la notizia del giorno';
  // preferisce gli argomenti usati meno, così in una partita girano tutti
  const pool=TR.items.filter(i=>i.t!==exclude).sort((a,b)=>(TR.used[a.t]||0)-(TR.used[b.t]||0)+(Math.random()-.5)*1.2);
  const it=pool[0]||TR.items[0];TR.used[it.t]=(TR.used[it.t]||0)+1;return it.t;
}
function fillTrend(s){let first=null;return String(s).replace(/\{trend\}/g,()=>first=trendTerm()).replace(/\{trend2\}/g,()=>trendTerm(first))}
function hashOf(t){return'#'+cleanTitle(t).replace(/[«»"'’.,:;!?()\-]/g,' ').split(/\s+/).filter(Boolean).slice(0,3).map(w=>w[0].toUpperCase()+w.slice(1)).join('')}
function trendLine(type){
  const T=TEXT.trends,gen=TR.gen&&TR.gen[type];
  if(gen&&gen.length&&chance(.6)){const l=gen[Math.floor(Math.random()*gen.length)];return typeof l==='string'?l:l}
  const tp=T[type];if(!tp||!tp.length)return null;
  const l=pick(tp);return Array.isArray(l)?l.map(fillTrend):fillTrend(l);
}
function trendHash(){return TR.items.length?hashOf(trendTerm()):null}

/* ---------- Claude scrive i contenuti del giorno ---------- */
async function generateTrendContent(){
  await capsReady;if(!sampleNs||!TR.items.length)return;
  const list=TR.items.map(i=>`- ${i.t}${i.d?` (${i.d})`:''}`).join('\n');
  const prompt=`Sei lo scrittore dei contenuti di Psyop, un gioco satirico e didattico sulla disinformazione, ambientato in un social network italiano immaginario.
Questi sono argomenti reali di tendenza oggi in Italia:
${list}

Scrivi contenuti del feed che usano questi argomenti come sfondo e come esca dell'attenzione. Regole:
- ogni testo contiene alla lettera almeno uno degli argomenti della lista, scritto tra « »;
- tono da social italiano realistico, frasi brevi, niente emoji in eccesso;
- non fare affermazioni su persone reali, non attribuire colpe, reati o malattie a nessuno, non inventare fatti specifici: l'argomento è solo il tema di cui "tutti parlano";
- niente tragedie, violenza o contenuti sessuali.
Rispondi solo con un oggetto JSON con queste chiavi, ognuna una lista di stringhe:
"normal" (5 post di utenti comuni), "meme" (3 meme ironici, anche su due righe con \\n), "prop" (4 messaggi di propaganda morbida di un dipartimento istituzionale che invita a pensare solo a quell'argomento), "hook" (4 frasi di apertura in cui un complottista dice che quell'argomento è una distrazione, da mettere prima di un altro post), "news" (3 titoli di cronaca leggera sul fatto che se ne parla tanto), "ad" (4 annunci pubblicitari, ognuno come lista [nome del prodotto, prezzo]).`;
  try{
    const out=await sampleNs.json(prompt,{modelTier:'quick'});
    if(!out||typeof out!=='object')return;
    const terms=TR.items.map(i=>i.t.toLowerCase()),blk=TEXT.trends.block||[];
    const good=s=>{const l=String(s).toLowerCase();return l.length<240&&terms.some(t=>l.includes(t))&&!blk.some(w=>l.includes(w))};
    const g={};
    for(const k of['normal','meme','prop','hook','news']){if(Array.isArray(out[k]))g[k]=out[k].filter(x=>typeof x==='string'&&good(x))}
    if(Array.isArray(out.ad))g.ad=out.ad.filter(a=>Array.isArray(a)&&a.length>=2&&good(a[0])).map(a=>[String(a[0]).slice(0,80),String(a[1]).slice(0,24)]);
    TR.gen=g;
  }catch(e){if(e&&e.code==='not_granted')sampleNs=null}
}

/* ---------- pannello in Cerca ---------- */
function trendsCard(){
  if(!TR.items.length)return'';
  const T=TEXT.trends,when=TR.date?new Date(TR.date).toLocaleDateString('it-IT',{day:'numeric',month:'long'}):'';
  return `<div class="card mx"><h5>${esc(TR.live?T.label:T.fallbackLabel)}</h5><ul class="trends">${TR.items.map(i=>`<li><button class="tag" data-tag="${esc(hashOf(i.t))}">${esc(i.t)}</button><span>${fmt((TR.used[i.t]||0)*1800+ri(400,2400))} post</span></li>`).join('')}</ul><p class="empty" style="margin-top:8px">${TR.live?`Fonte: ${esc(TR.src)}${when?` · aggiornato al ${when}`:''}. Persone reali e fatti tragici sono esclusi.`:'Non sono riuscito a leggere le tendenze di oggi: questi sono esempi.'}${TR.gen?' Post scritti da Claude a partire da questi argomenti.':''}</p></div>`;
}
