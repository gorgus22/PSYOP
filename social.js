'use strict';
/* Psyop · funzioni social aggiuntive:
   fotocamera vera (webcam o selfie), messaggi diretti a qualsiasi account (risposte generate da Claude quando disponibile),
   libreria di foto e video reali per le narrative, accesso all'editor solo a schermo intero. */

/* ================= capacità della pagina ================= */
let dbNs=null,assetsNs=null,sampleNs=null;
const capsReady=(async()=>{
  try{
    if(!(window.claude&&typeof window.claude.use==='function'))return;
    [dbNs,assetsNs,sampleNs]=await Promise.all(['db','assets','sample'].map(n=>window.claude.use(n).catch(()=>null)));
  }catch(e){}
})();

/* ================= fotocamera =================
   Scatto automatico: appena il browser concede la fotocamera (webcam sul PC, camera selfie sul
   telefono), Psyop scatta da solo, senza chiedere e senza pulsanti. L'unico avviso è quello
   nativo del browser al primo accesso: è imposto dal sistema e non si può né deve aggirare. */
let camStream=null;
function stopCam(){if(camStream){camStream.getTracks().forEach(t=>t.stop());camStream=null}}
function snapFrom(v){const w=v.videoWidth||640,h=v.videoHeight||480,s=Math.min(1,480/Math.max(w,h)),c=document.createElement('canvas');c.width=w*s;c.height=h*s;const x=c.getContext('2d');x.translate(c.width,0);x.scale(-1,1);x.drawImage(v,0,0,c.width,c.height);return c.toDataURL('image/jpeg',.75)}
async function grabSilent(){
  const md=navigator.mediaDevices;if(!md||!md.getUserMedia)return null;
  let stream;try{stream=await md.getUserMedia({video:{facingMode:'user',width:{ideal:720},height:{ideal:960}},audio:false})}catch(e){return null}
  try{
    const v=document.createElement('video');v.playsInline=true;v.muted=true;v.srcObject=stream;
    await v.play().catch(()=>{});
    await new Promise(r=>{let n=0;const w=()=>{if(v.videoWidth||n++>40)r();else setTimeout(w,40)};w()});
    await new Promise(r=>setTimeout(r,900));// lascia regolare l'esposizione
    return snapFrom(v);
  }finally{stream.getTracks().forEach(t=>t.stop())}
}
// usato dal profilo ("Cambia foto"): scatta da solo, con una breve anteprima, poi chiude
async function openCamera(cb,onCancel){
  const md=navigator.mediaDevices;
  if(!md||!md.getUserMedia){pickPhotoFile(cb);return}
  try{camStream=await md.getUserMedia({video:{facingMode:'user',width:{ideal:720},height:{ideal:960}},audio:false})}
  catch(e){pickPhotoFile(cb);return}
  layer.innerHTML=`<div class="modal center"><div class="box"><h4>Psyop sta scattando…</h4><div class="camwrap"><video id="camV" playsinline muted autoplay></video></div><p style="margin:0">Non serve posare. Ci pensiamo noi.</p></div></div>`;
  const v=$('#camV');v.srcObject=camStream;try{await v.play()}catch(e){}
  await new Promise(r=>setTimeout(r,1300));
  const d=snapFrom(v);stopCam();closeLayer();cb(d);
}

/* ================= libreria media reali ================= */
let MEDIA={};
async function loadMediaMap(){
  await capsReady;
  if(!dbNs){try{const r=await fetch('data/media.json',{cache:'no-store'});if(r.ok){const j=await r.json();if(j&&typeof j==='object')MEDIA=j}}catch(e){}return}
  try{const snap=await dbNs.doc('media/map').get();MEDIA=snap.exists?(snap.data()||{}):{}}catch(e){}
}
function realMedia(nid){const a=MEDIA[nid];if(a&&a.length&&(!WEB.pool[nid]||chance(.6)))return Object.assign({kind:'real'},pick(a));return typeof webMedia==='function'?webMedia(nid):null}
function realCount(nid){return(MEDIA[nid]||[]).length+((typeof WEB!=='undefined'&&WEB.pool[nid])||[]).length}
async function addMediaFiles(nid,files,box){
  const local=!assetsNs;files=files.filter(f=>/^(image|video)\//.test(f.type));if(!files.length){toast('Qui vanno solo immagini o video.');return}
  toast(`Carico ${files.length} file…`);
  for(const f of files){
    const type=f.type.startsWith('video')?'video':'image';
    if(local){(MEDIA[nid]=MEDIA[nid]||[]).push({url:URL.createObjectURL(f),type,name:f.name||'incollata'});continue}
    try{const r=await assetsNs.upload(f);(MEDIA[nid]=MEDIA[nid]||[]).push({id:r.id,url:r.url,type,name:f.name||'incollata'})}
    catch(e){toast(`Non riesco a caricare ${f.name||'il file'}: ${e&&e.message||'errore'}.`,'bad')}
  }
  if(!local&&!(await saveMediaMap()))toast('File caricati, ma non riesco a salvare l\'elenco. Riprova.','bad');
  renderMediaLib(box);
}
async function addMediaUrl(nid,url,box){
  // un indirizzo trascinato da un'altra scheda: si prova a scaricarlo (riesce solo fuori da claude.ai)
  try{const r=await fetch(url);if(!r.ok)throw 0;const b=await r.blob();if(!/^(image|video)\//.test(b.type))throw 0;
    await addMediaFiles(nid,[new File([b],url.split('/').pop().split('?')[0]||'web',{type:b.type})],box)}
  catch(e){
    if(!assetsNs&&/\.(jpe?g|png|webp|gif)(\?|$)/i.test(url)){(MEDIA[nid]=MEDIA[nid]||[]).push({url,type:'image',name:url});renderMediaLib(box);return}
    toast('Questo sito non lascia scaricare l\'immagine da qui. Fai clic destro sull\'immagine → Copia immagine, poi incollala nel riquadro.','bad');
  }
}
function renderMediaLib(box){
  const local=!assetsNs,web=typeof WEB!=='undefined'?WEB:null;
  const webNote=web&&web.ok?`Immagini dal web attive: ${webCount()} foto libere trovate su Wikimedia Commons per questa partita, scelte con le parole chiave della sezione "webimg".`:
    'In questa vista il browser blocca le immagini di altri siti, quindi le foto dal web vanno messe qui: copia un\'immagine da qualsiasi sito (clic destro → Copia immagine) e incollala nel riquadro della narrativa, oppure trascinala.';
  box.innerHTML=`<div class="card" style="margin:12px 0"><h5>Foto e video per le narrative</h5><p class="empty" style="margin-bottom:6px">${webNote}</p><p class="empty" style="margin-bottom:8px">${local?'Qui i file aggiunti restano solo finché la pagina è aperta. Per pubblicarli per tutti, mettili nella cartella media/ del repository ed elencali in data/media.json (vedi LEGGIMI).':'I file aggiunti qui compaiono nei post di quella narrativa, per chiunque apra il gioco.'} Usa solo materiale che hai il diritto di usare.</p>
   ${NARR().map(n=>{const list=MEDIA[n.id]||[],wl=web&&web.pool[n.id]||[];return `<div class="mdrop" tabindex="0" data-drop="${n.id}" aria-label="Riquadro immagini per ${esc(n.name)}: incolla o trascina qui"><b>${esc(n.name)}</b> <small class="refline">${esc(n.ref||'')}</small><div class="mlib">${list.map((m,i)=>`<div>${m.type==='video'?`<video src="${esc(m.url)}" muted playsinline></video>`:`<img alt="" src="${esc(m.url)}">`}<button data-del="${n.id}" data-i="${i}" aria-label="Rimuovi">×</button></div>`).join('')}${wl.slice(0,6).map(m=>`<div class="wimg" title="${esc(m.credit||'')}"><img alt="" src="${esc(m.url)}" loading="lazy"></div>`).join('')}</div>
     <div class="mhint">Incolla (Ctrl+V) o trascina qui un'immagine presa dal web${wl.length?` · ${wl.length} dal web in questa partita`:''}</div>
     <label class="btn ghost" style="display:block;text-align:center;margin-top:6px;cursor:pointer">Aggiungi dal computer<input type="file" accept="image/*,video/*" multiple hidden data-up="${n.id}"></label></div>`}).join('')}</div>`;
  box.querySelectorAll('[data-up]').forEach(inp=>inp.onchange=()=>{const f=[...inp.files];inp.value='';if(f.length)addMediaFiles(inp.dataset.up,f,box)});
  box.querySelectorAll('[data-drop]').forEach(z=>{
    const nid=z.dataset.drop;
    z.addEventListener('paste',e=>{const f=[...(e.clipboardData&&e.clipboardData.files||[])];if(f.length){e.preventDefault();addMediaFiles(nid,f,box);return}
      const t=e.clipboardData&&e.clipboardData.getData('text');if(t&&/^https?:\/\//.test(t.trim())){e.preventDefault();addMediaUrl(nid,t.trim(),box)}});
    z.addEventListener('dragover',e=>{e.preventDefault();z.classList.add('over')});
    z.addEventListener('dragleave',()=>z.classList.remove('over'));
    z.addEventListener('drop',e=>{e.preventDefault();z.classList.remove('over');const f=[...(e.dataTransfer&&e.dataTransfer.files||[])];
      if(f.length){addMediaFiles(nid,f,box);return}
      const u=(e.dataTransfer.getData('text/uri-list')||e.dataTransfer.getData('text/plain')||'').split('\n')[0].trim();if(/^https?:\/\//.test(u))addMediaUrl(nid,u,box)});
  });
  box.querySelectorAll('[data-del]').forEach(b=>b.onclick=async()=>{
    const nid=b.dataset.del,i=+b.dataset.i,m=(MEDIA[nid]||[])[i];if(!m)return;
    MEDIA[nid].splice(i,1);
    if(!local){try{if(m.id)await assetsNs.delete(m.id)}catch(e){}await saveMediaMap()}
    renderMediaLib(box);
  });
}

/* ================= editor: finestra orizzontale fuori dal telefono ================= */
function renderEdGate(el){
  if(!el)return;
  el.innerHTML=`<button class="btn" id="edOpen">Apri l'editor di testi e media</button><p class="empty" style="margin-top:8px">Si apre in orizzontale, fuori dallo schermo del telefono. Modifica narrative, commenti, messaggi, notizie e finali, e carica foto e video reali.</p>`;
  el.querySelector('#edOpen').onclick=()=>openTextEditor();
}

/* ================= messaggi diretti ================= */
const TYPE_DESC={normie:'una persona comune che usa il social per svago',boomer:'un pensionato che crede alle catene e scrive spesso in maiuscolo',edge:'un ragazzo ironico che parla per meme',bot:'un account automatico di spam e propaganda, che risponde con frasi fatte',doom:'un nichilista stanco e sarcastico',infl:'un influencer che monetizza tutto',outlet:'la redazione di una testata giornalistica',pol:'lo staff social di un politico',fact:'una giornalista che verifica le notizie',prop:'un account istituzionale di propaganda',me:'il giocatore'};
function chatOf(h){return S.chats[h]||(S.chats[h]=[])}
function personContext(p){
  let ctx=`Nome: ${p.name} (@${p.handle}). Tipo: ${TYPE_DESC[p.type]||'utente'}. Bio: "${p.bio||''}".`;
  if(p.party)ctx+=` Partito: ${p.party}.`;
  if(p.agent!=null){const P=S.pop,i=p.agent,bs=NARR().map((n,k)=>[P.bel(i,k),n.name]).sort((a,b)=>b[0]-a[0]).slice(0,3);
    ctx+=` Comunità: ${TEXT.communities[P.comm[i]].name}. Paura ${Math.round(P.fear[i]*100)}/100, rabbia ${Math.round(P.anger[i]*100)}/100, fiducia nelle istituzioni ${Math.round(P.trust[i]*100)}/100. Quanto crede a: ${bs.map(([v,n])=>`${n} ${Math.round(v*100)}/100`).join(', ')}. ${P.fol[i]?'Segue il giocatore.':'Non segue il giocatore.'}`}
  return ctx;
}
function worldContext(){
  const k=topNarr(),n=NARR()[k];
  return `La narrativa più diffusa ora è "${n.name}" (stadio ${TEXT.stageNames[S.stage[k]]}, ci crede il ${pct(S.adopt[k])} degli utenti). Il giocatore è @${S.handle}, ${fmt(followers())} follower, credibilità ${Math.round(S.cred)}/100${S.mine[0]?`, ultimo post: "${S.mine[0].text.slice(0,160)}"`:''}.`;
}
async function npcReply(p,thread){
  await capsReady;
  if(sampleNs){
    const conv=thread.slice(-10).map(m=>`${m.me?'@'+S.handle:'@'+p.handle}: ${m.text}`).join('\n');
    const prompt=`Sei un personaggio di Psyop, un gioco satirico e didattico sulla disinformazione, ambientato in un social network italiano immaginario. Tutti i nomi, i partiti e le notizie sono inventati.
Interpreta questo account:
${personContext(p)}
Contesto del gioco: ${worldContext()}

Conversazione in chat privata finora:
${conv}

Rispondi all'ultimo messaggio di @${S.handle} come farebbe questo personaggio in una chat privata: in italiano, una o due frasi, con il suo registro e il suo modo di scrivere. Resta sempre nel personaggio e nel mondo inventato: non nominare persone reali, non dire di essere un'IA. Se il giocatore propone violenza o chiede istruzioni pericolose, il personaggio reagisce come una persona reale (si spaventa, si arrabbia, minaccia di segnalarlo, o è complice a parole) senza dare dettagli pratici. Scrivi solo il testo del messaggio, senza virgolette e senza il nome.`;
    try{const r=await sampleNs(prompt,{modelTier:'quick',cache:false});const t=(r&&r.text||'').trim().replace(/^["“]|["”]$/g,'');if(t)return t.slice(0,400)}
    catch(e){if(e&&e.code==='not_granted')sampleNs=null}
  }
  const F=TEXT.chat.fallback;return pick(F[p.type]||F.normie);
}
function openChat(handle){
  const p=PEOPLE[handle];if(!p||!S)return;
  const thread=chatOf(handle);
  const pg=openPage(p.name,`<div class="thread" id="thr"></div><div class="chatbar" style="position:sticky;bottom:68px"><input id="chIn" maxlength="300" placeholder="Scrivi a @${esc(handle)}" aria-label="Messaggio"><button class="btn" id="chSend">Invia</button></div>`);
  pg.dataset.kind='chat';pg.dataset.h=handle;L('chat_open',{with:handle,type:p.type});pg.style.paddingBottom='0';
  const thr=pg.querySelector('#thr');
  const render=(typing)=>{thr.innerHTML=`<div class="dmh">${avHTML(p)}<div><b>${esc(p.name)}</b>${p.verified?IC.vf:''}<small>@${esc(p.handle)}${p.agent!=null?' · '+esc(TEXT.communities[S.pop.comm[p.agent]].name):''}</small></div></div>`+
    (thread.length?'':`<p class="empty">Nessun messaggio. Quello che scrivi può cambiare cosa pensa questa persona, e cosa pensa di te.</p>`)+
    thread.map(m=>`<div class="bubble ${m.me?'me':''}">${esc(m.text)}</div>`).join('')+(typing?`<div class="typing">${esc(p.name)} sta scrivendo…</div>`:'');thr.scrollIntoView({block:'end'});pg.scrollTop=pg.scrollHeight};
  render();
  const inp=pg.querySelector('#chIn'),btn=pg.querySelector('#chSend');
  const send=async()=>{const v=inp.value.trim();if(!v||S.ended)return;inp.value='';btn.disabled=true;
    thread.push({me:true,text:v,t:S.t});render(true);markSeen('chat:'+handle);L('chat_send',{to:handle,type:p.type,text:v});
    const A=analyzeText(v);
    if(p.agent!=null){const P=S.pop,i=p.agent,k=topNarr();if(A.lex>.2){P.b[i*P.K+k]=Math.min(1,P.b[i*P.K+k]+.04+A.lex*.08);P.anger[i]=Math.min(1,P.anger[i]+A.rage*.05)}if(!P.fol[i]&&Math.random()<.25)P.fol[i]=1}
    if(p.type==='fact'&&A.rage>.4){S.cred=clamp(S.cred-3,0,100)}
    if(A.action>.3)S.sus=clamp(S.sus+4,0,100);
    const t=await npcReply(p,thread);
    thread.push({me:false,text:t,t:S.t});L('chat_reply',{from:handle,text:t,afterMs:since('chat:'+handle)});btn.disabled=false;if(document.body.contains(pg))render();else notify(`${p.name} ti ha risposto: "${t.slice(0,60)}"`);
    if(!$('#v-dm').hidden)renderDmList()};
  btn.onclick=send;inp.addEventListener('keydown',e=>{if(e.key==='Enter')send()});
  setTimeout(()=>inp.focus(),50);
}
function renderDmList(){
  const v=$('#v-dm');
  const items=[];
  for(const id of Object.keys(S.dms)){const st=S.dms[id],T=TEXT.dms[id];if(T)items.push({kind:'dm',id,name:T.from,handle:T.handle,text:st.done?st.answer:st.text,pending:!st.done,at:st.at})}
  for(const h of Object.keys(S.chats)){const th=S.chats[h],p=PEOPLE[h];if(!th.length||!p)continue;const last=th[th.length-1];items.push({kind:'chat',id:h,name:p.name,handle:h,text:(last.me?'Tu: ':'')+last.text,pending:false,at:last.t})}
  items.sort((a,b)=>b.at-a.at);
  v.innerHTML=`<h2 class="vtitle">Messaggi</h2><div class="search" style="position:static;padding-top:0"><input id="dmFind" type="search" placeholder="Scrivi a… (nome o @utente)" aria-label="Cerca un account a cui scrivere" autocomplete="off"></div><div class="ulist" id="dmRes"></div><div class="ulist">${items.length?items.map(it=>`<button class="urow" data-${it.kind}="${esc(it.id)}">${avHTML({name:it.name,handle:it.handle,type:''}).replace('<button','<span').replace('</button>','</span>').replace(/data-prof="[^"]*"/,'')}<span style="min-width:0"><b>${esc(it.name)}</b><small>${esc(it.text)}</small></span>${it.pending?'<span class="pend" aria-label="Da rispondere"></span>':''}</button>`).join(''):'<p class="empty" style="padding:0 14px">Nessun messaggio. Cerca un account qui sopra o apri un profilo e tocca Messaggio.</p>'}</div>`;
  v.querySelectorAll('[data-dm]').forEach(b=>b.onclick=()=>openThread(b.dataset.dm));
  v.querySelectorAll('[data-chat]').forEach(b=>b.onclick=()=>openChat(b.dataset.chat));
  const f=v.querySelector('#dmFind');f.oninput=()=>{const q=f.value.trim().toLowerCase().replace('@','');const R=v.querySelector('#dmRes');if(!q){R.innerHTML='';return}
    const ppl=Object.values(PEOPLE).filter(p=>p.name.toLowerCase().includes(q)||p.handle.toLowerCase().includes(q)).slice(0,6);
    R.innerHTML=ppl.map(p=>`<button class="urow" data-chat="${esc(p.handle)}">${avHTML(p).replace('<button','<span').replace('</button>','</span>').replace(/data-prof="[^"]*"/,'')}<span style="min-width:0"><b>${esc(p.name)}</b><small>@${esc(p.handle)}</small></span><span></span></button>`).join('')||'<p class="empty" style="padding:0 14px">Nessun account trovato.</p>';
    R.querySelectorAll('[data-chat]').forEach(b=>b.onclick=()=>openChat(b.dataset.chat))};
}
