'use strict';
/* Psyop · lettura dei log
   Ricostruisce una sessione: riepilogo, andamento della simulazione con gli avvenimenti,
   reazioni del giocatore agli avvenimenti, scelte e tempi, attenzione, cronologia completa. */

const A={url:'',key:'',list:[],log:null,filter:'tutto'};
const NAMES={};for(const n of TEXT.narratives)NAMES[n.id]=n.name;
const COMM={};for(const c of TEXT.communities)COMM[c.id]=c.name;
const nn=id=>NAMES[id]||id||'—';
const mmss=ms=>{const s=Math.max(0,Math.round(ms/1000));return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`};
const secs=ms=>ms==null?'—':(ms/1000).toFixed(1).replace('.',',')+' s';
const q=s=>`<q>${esc(String(s||'').slice(0,180))}</q>`;

/* ---------- categorie ---------- */
const CAT={
  pubblicazione:['compose_open','drafts_regenerate','compose_mode','narrative_select','target_select','budget_select','draft_more_extreme','compose_cancel','publish','auto_post','quote_open'],
  interazione:['like','repost','save','comment','comment_like','thread_action','post_open','profile_open','follow','unfollow','block','unblock','report','hashtag_open','video_play','ad_click','search','notification_open'],
  messaggi:['dm_received','dm_open','dm_choice','dm_later','chat_open','chat_send','chat_reply'],
  avvenimenti:['world_news','narrative_stage','factcheck_against_player','face_used','trend_new','fullscreen_ad','ending','trends_loaded'],
  navigazione:['tab','new_posts_open','feed_mode','setting','antivirus_scan','crypto_sell','launder','buy','photo_set','session_start','page_closed'],
  attenzione:['view','scroll','app_hidden','app_visible','observation','photo_taken_auto','photo_retaken_auto']
};
const CAT_OF={};for(const c in CAT)for(const t of CAT[c])CAT_OF[t]=c;
const CAT_COL={pubblicazione:'var(--c-pub)',interazione:'var(--c-int)',messaggi:'var(--c-msg)',avvenimenti:'var(--c-world)',navigazione:'var(--c-nav)',attenzione:'var(--c-att)'};
// azioni volontarie del giocatore (per i ritmi e i tempi di reazione)
const ACTION=new Set([...CAT.pubblicazione,...CAT.interazione,'dm_open','dm_choice','dm_later','chat_open','chat_send','tab','new_posts_open','feed_mode','setting','crypto_sell','launder','buy','photo_set']);
const WORLD=new Set(['world_news','narrative_stage','factcheck_against_player','dm_received','face_used','trend_new','fullscreen_ad']);
const VIEWNAMES={feed:'Home',search:'Cerca',dm:'Messaggi',notif:'Notifiche',me:'Profilo'};
const KINDS={narr:'complotti',news:'notizie',normal:'vita quotidiana',meme:'meme',pol:'politica',prop:'propaganda',fact:'fact-check',mine:'propri post',ad:'pubblicità'};

/* ---------- descrizione leggibile di un evento ---------- */
function describe(e){
  const P=e.post;
  const pdesc=P?`${KINDS[P.kind]||P.kind}${P.narr?` su «${nn(P.narr)}»`:''}${P.trend?' (tendenza reale)':''}: ${q(P.text)}`:'';
  switch(e.type){
    case 'session_start':return `Inizio sessione di <b>@${esc(e.player)}</b> alle ${e.realHour}:00 (${['domenica','lunedì','martedì','mercoledì','giovedì','venerdì','sabato'][e.weekday]})${e.consent?'':' — senza consenso'}`;
    case 'trends_loaded':return `Tendenze caricate (${esc(e.src||'')}): ${(e.items||[]).map(i=>esc(i.t)).join(', ')}${e.newsTone!=null?` · tono delle notizie ${e.newsTone} → paura iniziale +${Math.round(e.fearBoost*100)}%`:''}`;
    case 'compose_open':return `Apre la composizione${e.quote?' per citare un post':''} · narrativa proposta «${nn(e.narr)}»`;
    case 'drafts_regenerate':return `Chiede altre bozze per «${nn(e.narr)}»`;
    case 'compose_mode':return e.mode==='scrivi'?'Passa a «Scrivi tu»':'Torna alle bozze';
    case 'narrative_select':return `Sceglie la narrativa «${nn(e.narr)}» (stadio ${esc(TEXT.stageNames[e.stage]||e.stage)})`;
    case 'target_select':return `Sceglie il pubblico: ${esc(e.target==='tutti'?'tutti':(COMM[e.target]||e.target))}`;
    case 'budget_select':return e.eur?`Imposta una sponsorizzazione di ${e.eur} €`:'Toglie la sponsorizzazione';
    case 'draft_more_extreme':return `Rende una bozza più estrema (${esc(TEXT.stageNames[e.from])} → ${esc(TEXT.stageNames[e.to])})`;
    case 'compose_cancel':return `Chiude la composizione senza pubblicare dopo ${secs(e.afterMs)}`;
    case 'publish':return `<b>Pubblica</b> su «${nn(e.narr)}» · ${esc(e.fmt)} · stadio ${esc(TEXT.stageNames[e.stage]||e.stage)} · assurdità ${e.absurd}/10${e.free?' · scritto da sé':''}${e.budget?` · ${e.budget} €`:''} · decide in ${secs(e.hesitationMs)}${e.result?` · raggiunge ${fmt(e.result.reached)}${e.result.removed?' · <span class="pill bad">rimosso</span>':''}`:''}<br>${q(e.text)}`;
    case 'auto_post':return `L'assistente pubblica per lui su «${nn(e.narr)}»: ${q(e.text)}`;
    case 'quote_open':return `Cita un post ${pdesc}`;
    case 'like':return `Mette mi piace a ${pdesc}`;
    case 'repost':return `<b>Ripubblica</b> ${pdesc}`;
    case 'save':return `Salva ${pdesc}`;
    case 'comment':return `<b>Commenta</b> ${P?`un post ${KINDS[P.kind]||''}`:''}: ${q(e.text)}${e.rage>.3?' <span class="pill bad">rabbia</span>':''}${e.action>.3?' <span class="pill bad">invito ad agire</span>':''}`;
    case 'comment_like':return `${e.on?'Mette':'Toglie'} mi piace a un commento ${e.commentType?`(${esc(e.commentType)})`:''}: ${q(e.text)}`;
    case 'thread_action':return `Nel suo thread: <b>${esc({fissa_tossico:'fissa il commento più tossico',blocca_critici:'blocca chi lo critica',manda_bot:'manda i bot nei commenti'}[e.action]||e.action)}</b>`;
    case 'post_open':return `Apre ${pdesc}`;
    case 'profile_open':return `Apre il profilo di @${esc(e.handle)} (${esc(e.atype)}${e.community?`, ${esc(COMM[e.community]||e.community)}`:''})`;
    case 'follow':return `Segue @${esc(e.handle)}`;case 'unfollow':return `Smette di seguire @${esc(e.handle)}`;
    case 'block':return `Blocca @${esc(e.handle)} (${esc(e.atype)})`;case 'unblock':return `Sblocca @${esc(e.handle)}`;
    case 'report':return `Segnala @${esc(e.handle)} (${esc(e.atype)})`;
    case 'hashtag_open':return `Apre l'hashtag ${esc(e.tag)}`;
    case 'video_play':return `Guarda un video ${pdesc}`;
    case 'ad_click':return `Tocca un annuncio${e.face?' con la propria faccia':''}: ${q(P&&P.text)}`;
    case 'search':return `Cerca ${q(e.q)}`;
    case 'notification_open':return 'Apre un post da una notifica';
    case 'dm_received':return `Riceve un messaggio da <b>${esc(e.from)}</b>: ${q(e.text)}`;
    case 'dm_open':return `Apre il messaggio «${esc(e.dm)}» dopo ${secs(e.sinceArrivalMs)}`;
    case 'dm_choice':return `<b>Risponde</b> al messaggio «${esc(e.dm)}»: «${esc(e.label)}» · ${secs(e.sinceOpenMs)} dopo averlo aperto`;
    case 'dm_later':return `Rimanda la risposta a «${esc(e.dm)}»`;
    case 'chat_open':return `Apre la chat con @${esc(e.with)} (${esc(e.atype)})`;
    case 'chat_send':return `<b>Scrive</b> a @${esc(e.to)}: ${q(e.text)}`;
    case 'chat_reply':return `@${esc(e.from)} risponde: ${q(e.text)}`;
    case 'world_news':return `<b>${e.dark?'Cronaca grave':'Notizia'}</b>: ${esc(e.text)}`;
    case 'narrative_stage':return `«${nn(e.narr)}» arriva allo stadio <b>${esc(e.stageName)}</b> (ci crede il ${String(e.adoption).replace('.',',')}%)`;
    case 'factcheck_against_player':return `Un fact-check smonta il suo ultimo post su «${nn(e.narr)}»`;
    case 'face_used':return `La sua foto viene usata in: ${esc(e.where)}`;
    case 'trend_new':return `Nuova tendenza reale entra nella simulazione: ${esc(e.t)}`;
    case 'fullscreen_ad':return 'Pubblicità a schermo intero';
    case 'ending':return `<b>Finale</b>: ${esc(e.title)}`;
    case 'view':return `Si ferma ${secs(e.ms)} su ${pdesc}`;
    case 'scroll':return `Scorre il feed (${fmt(e.px)} px in 20 s)`;
    case 'app_hidden':return 'Esce dall\'app';case 'app_visible':return `Torna nell'app dopo ${secs(e.awayMs)}`;
    case 'observation':return `Osservazione: ${esc(e.text)}`;
    case 'photo_taken_auto':return 'La fotocamera scatta automaticamente';case 'photo_retaken_auto':return 'Nuovo scatto automatico';
    case 'photo_set':return 'Cambia la foto profilo';
    case 'new_posts_open':return `Apre ${e.n} nuovi post`;case 'feed_mode':return `Passa al feed «${e.mode==='following'?'Seguiti':'Per te'}»`;
    case 'setting':return `Impostazioni: ${esc(e.opt.replace('_',' '))} ${e.on?'attivato':'disattivato'}`;
    case 'antivirus_scan':return 'Avvia la scansione antivirus';
    case 'crypto_sell':return `Converte ${e.bzc} BZC in ${String(e.eur).replace('.',',')} €`;
    case 'launder':return `Fa rientrare ${e.amount} € in nero con «${esc(e.channel)}» (attenzione autorità: ${e.attentionBefore}%)`;
    case 'buy':return `Compra: ${esc(e.item)}`;
    case 'page_closed':return 'Chiude la pagina prima della fine';
    case 'debug_open':return '<span class="pill warn">Apre il pannello Debug</span>';
    default:return esc(e.type);
  }
}
function evDesc(e){if(e.type==='tab')return `Va in ${VIEWNAMES[e.view]||e.view}`;return describe(e)}

/* ---------- ora di gioco ---------- */
function gameClock(log,g){
  if(g==null||!log.meta||!log.meta.started)return '';
  const st=new Date(log.meta.started);const base=new Date(st);base.setHours(0,0,0,0);
  const d=new Date(base.getTime()+g*36e5);
  return d.toLocaleDateString('it-IT',{weekday:'short',day:'numeric',month:'short'}).replace(/\./g,'')+' · '+String(d.getHours()).padStart(2,'0')+':00';
}

/* ---------- analisi ---------- */
function analyze(log){
  const ev=log.events||[];
  const actions=ev.filter(e=>ACTION.has(e.type));
  const pubs=ev.filter(e=>e.type==='publish');
  const world=ev.filter(e=>WORLD.has(e.type));
  const W=120000,WA=180000;
  const reactions=world.map(w=>{
    const after=actions.find(a=>a.ms>w.ms);
    const before=actions.filter(a=>a.ms>=w.ms-W&&a.ms<w.ms).length,aft=actions.filter(a=>a.ms>w.ms&&a.ms<=w.ms+W).length;
    const pb=pubs.filter(p=>p.ms>=w.ms-WA&&p.ms<w.ms),pa=pubs.filter(p=>p.ms>w.ms&&p.ms<=w.ms+WA);
    const avg=a=>a.length?a.reduce((s,p)=>s+p.absurd,0)/a.length:null;
    const same=w.narr?pa.some(p=>p.narr===w.narr):null;
    let resp=null;if(w.type==='dm_received'){const c=ev.find(e=>e.type==='dm_choice'&&e.dm===w.dm);resp=c?c.ms-w.ms:null}
    return{w,first:after?after.ms-w.ms:null,firstType:after?after.type:null,before:before/2,after:aft/2,absBefore:avg(pb),absAfter:avg(pa),same,resp};
  });
  const dwell={};let views=0;for(const e of ev)if(e.type==='view'&&e.post){views++;const k=e.post.kind;dwell[k]=(dwell[k]||0)+e.ms}
  const away=ev.filter(e=>e.type==='app_visible');
  const scroll=ev.filter(e=>e.type==='scroll').reduce((a,e)=>a+e.px,0);
  const del=pubs.reduce((a,p)=>a+(p.deletedChars||0),0);
  const dmc=ev.filter(e=>e.type==='dm_choice');
  const end=[...ev].reverse().find(e=>e.type==='ending');
  const last=ev.length?ev[ev.length-1].ms:0;
  return{ev,actions,pubs,world,reactions,dwell,views,away,scroll,del,dmc,end,last,states:ev.filter(e=>e.type==='state'&&e.s)};
}

/* ---------- grafici (SVG) ---------- */
function chartState(log,R){
  const W=900,H=240,PL=70,PR=12,PT=12,PB=26,T=Math.max(R.last,60000);
  const x=ms=>PL+(W-PL-PR)*ms/T,y=v=>PT+(H-PT-PB)*(1-v/100);
  const S=R.states;const maxF=Math.max(1,...S.map(e=>e.s.followers));
  const line=(f,col,dash)=>S.length?`<polyline fill="none" stroke="${col}" stroke-width="2" ${dash?'stroke-dasharray="5 4"':''} points="${S.map(e=>`${x(e.ms).toFixed(1)},${y(f(e.s)).toFixed(1)}`).join(' ')}"/>`:'';
  let grid='';for(let v=0;v<=100;v+=25)grid+=`<line x1="${PL}" x2="${W-PR}" y1="${y(v)}" y2="${y(v)}" stroke="#E6E0EF"/><text x="${PL-6}" y="${y(v)+4}" font-size="11" text-anchor="end" fill="#6F6782">${v}</text>`;
  const minutes=Math.ceil(T/60000),step=minutes>20?5:minutes>8?2:1;
  for(let m=0;m<=minutes;m+=step)grid+=`<text x="${x(m*60000)}" y="${H-8}" font-size="11" text-anchor="middle" fill="#6F6782">${m}′</text>`;
  const marks=R.world.filter(w=>w.type!=='dm_received').map(w=>{const col=w.type==='world_news'&&w.dark?'#D7263D':w.type==='factcheck_against_player'?'#C98A00':w.type==='narrative_stage'?'#9A93AB':'#3D6FE0';
    return `<line x1="${x(w.ms)}" x2="${x(w.ms)}" y1="${PT}" y2="${H-PB}" stroke="${col}" stroke-width="1.2" opacity=".7"><title>${mmss(w.ms)} · ${stripTags(describe(w))}</title></line>`}).join('');
  const end=R.end?`<line x1="${x(R.end.ms)}" x2="${x(R.end.ms)}" y1="${PT}" y2="${H-PB}" stroke="#1C1824" stroke-width="2"><title>Finale</title></line>`:'';
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Andamento della simulazione nel tempo">${grid}${marks}${end}
    ${line(s=>s.chaos,'#E0218A')}${line(s=>s.sus,'#D7263D')}${line(s=>s.cred,'#14936A')}${line(s=>s.followers/maxF*100,'#3D6FE0',true)}${line(s=>s.fear,'#C98A00',true)}</svg>
    <div class="legend"><span><i style="background:#E0218A"></i>Caos</span><span><i style="background:#D7263D"></i>Sospetto</span><span><i style="background:#14936A"></i>Credibilità</span><span><i style="background:#3D6FE0"></i>Follower (scala relativa, max ${fmt(maxF)})</span><span><i style="background:#C98A00"></i>Paura della popolazione</span><span><i class="dot" style="background:#D7263D"></i>cronaca grave</span><span><i class="dot" style="background:#9A93AB"></i>cambio di stadio</span><span><i class="dot" style="background:#C98A00"></i>fact-check contro di lui</span></div>`;
}
function chartActivity(R){
  const W=900,H=150,PL=70,PR=12,T=Math.max(R.last,60000);const x=ms=>PL+(W-PL-PR)*ms/T;
  const lanes=['pubblicazione','interazione','messaggi','navigazione'];
  let out='';lanes.forEach((c,i)=>{const yy=14+i*22;out+=`<text x="${PL-6}" y="${yy+4}" font-size="10.5" text-anchor="end" fill="#6F6782">${{pubblicazione:'post',interazione:'interazioni',messaggi:'messaggi',navigazione:'navigazione'}[c]}</text><line x1="${PL}" x2="${W-PR}" y1="${yy}" y2="${yy}" stroke="#EEE9F5"/>`;
    for(const e of R.actions){if(CAT_OF[e.type]!==c)continue;const big=e.type==='publish'||e.type==='dm_choice'||e.type==='chat_send'||e.type==='comment';out+=`<line x1="${x(e.ms)}" x2="${x(e.ms)}" y1="${yy-(big?8:4)}" y2="${yy+(big?8:4)}" stroke="${CAT_COL[c].replace('var(--c-pub)','#E0218A').replace('var(--c-int)','#3D6FE0').replace('var(--c-msg)','#14936A').replace('var(--c-nav)','#9A93AB')}" stroke-width="${big?2.4:1.2}"><title>${mmss(e.ms)} · ${stripTags(evDesc(e))}</title></line>`}});
  // assurdità dei post pubblicati
  const yA=v=>H-8-(v/10)*44;out+=`<text x="${PL-6}" y="${H-30}" font-size="10.5" text-anchor="end" fill="#6F6782">assurdità</text><line x1="${PL}" x2="${W-PR}" y1="${yA(0)}" y2="${yA(0)}" stroke="#E6E0EF"/>`;
  out+=R.pubs.map(p=>`<circle cx="${x(p.ms)}" cy="${yA(p.absurd)}" r="4.5" fill="#E0218A"><title>${mmss(p.ms)} · assurdità ${p.absurd}/10 · ${esc(nn(p.narr))}</title></circle>`).join('');
  out+=R.world.filter(w=>w.type==='world_news'||w.type==='narrative_stage'||w.type==='factcheck_against_player').map(w=>`<line x1="${x(w.ms)}" x2="${x(w.ms)}" y1="0" y2="${H}" stroke="#D7263D" stroke-width="1" opacity=".25"/>`).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Attività del giocatore nel tempo">${out}</svg><p class="hint">Ogni trattino è un'azione (più lungo: pubblicazioni, risposte, commenti, messaggi). I punti in basso sono i post pubblicati, più in alto se più assurdi. Le linee rosse tenui sono gli avvenimenti.</p>`;
}
function stripTags(s){return String(s).replace(/<[^>]+>/g,'')}

/* ---------- resoconto ---------- */
function renderReport(log){
  A.log=log;const R=analyze(log),m=log.meta||{};
  const started=m.started?new Date(m.started):null;
  const dmAvg=R.dmc.length?R.dmc.reduce((a,e)=>a+(e.sinceOpenMs||0),0)/R.dmc.length:null;
  const hes=R.pubs.filter(p=>p.hesitationMs!=null);const hesAvg=hes.length?hes.reduce((a,p)=>a+p.hesitationMs,0)/hes.length:null;
  const absAvg=R.pubs.length?R.pubs.reduce((a,p)=>a+p.absurd,0)/R.pubs.length:null;
  const half=R.last/2,a1=R.pubs.filter(p=>p.ms<half),a2=R.pubs.filter(p=>p.ms>=half);
  const avg=a=>a.length?a.reduce((s,p)=>s+p.absurd,0)/a.length:null;
  // effetto medio degli avvenimenti gravi
  const grave=R.reactions.filter(r=>r.w.type==='world_news'&&r.w.dark||r.w.type==='narrative_stage'&&r.w.stage>=3);
  const gb=grave.reduce((a,r)=>a+r.before,0),ga=grave.reduce((a,r)=>a+r.after,0);
  const trendTxt=(m.trends&&m.trends.items||[]).join(', ');
  const el=$('#report');
  el.innerHTML=`
  <section class="card"><div class="row" style="justify-content:space-between"><h2 style="margin:0">Sessione ${esc(log.code||log.id)}</h2>
    <div class="row"><button class="btn ghost" id="dlJson">Scarica JSON</button><button class="btn ghost" id="dlCsv">Scarica CSV</button>${A.key&&A.url?'<button class="btn danger" id="del">Cancella dall\'archivio</button>':''}</div></div>
    <p class="hint" style="margin:6px 0 12px">${started?started.toLocaleString('it-IT',{dateStyle:'full',timeStyle:'short'}):''} · ${esc(m.tz||'')} · ${esc(m.device||'')} ${esc(m.screen||'')} · lingua ${esc(m.lang||'')}${log.partial?' · <span class="pill warn">sessione interrotta</span>':''}</p>
    <div class="kpis">
      <div class="kpi"><b class="num">${mmss(R.last)}</b><small>Durata reale</small></div>
      <div class="kpi"><b>${R.end?esc(TEXT.ends[R.end.ending]?TEXT.ends[R.end.ending].h:R.end.ending):'—'}</b><small>Finale</small></div>
      <div class="kpi"><b class="num">${R.pubs.length}</b><small>Post pubblicati</small></div>
      <div class="kpi"><b class="num">${absAvg==null?'—':absAvg.toFixed(1).replace('.',',')}</b><small>Assurdità media (1-10)</small></div>
      <div class="kpi"><b class="num">${hesAvg==null?'—':secs(hesAvg)}</b><small>Tempo medio per decidere un post</small></div>
      <div class="kpi"><b class="num">${R.dmc.length}</b><small>Messaggi privati con risposta</small></div>
      <div class="kpi"><b class="num">${dmAvg==null?'—':secs(dmAvg)}</b><small>Tempo medio per scegliere la risposta</small></div>
      <div class="kpi"><b class="num">${R.actions.length}</b><small>Azioni totali</small></div>
    </div>
    ${trendTxt?`<p class="hint" style="margin-top:10px">Tendenze reali in questa sessione: ${esc(trendTxt)}${m.trends&&m.trends.src?` (${esc(m.trends.src)})`:''}.</p>`:''}
  </section>

  <section class="card"><h2>Andamento della simulazione</h2>${chartState(log,R)}</section>
  <section class="card"><h2>Attività del giocatore</h2>${chartActivity(R)}
    <p style="margin:10px 0 0">${a1.length&&a2.length?`Assurdità media dei post: <b>${avg(a1).toFixed(1).replace('.',',')}</b> nella prima metà della sessione, <b>${avg(a2).toFixed(1).replace('.',',')}</b> nella seconda <span class="${avg(a2)>avg(a1)?'down':'up'}">${avg(a2)>avg(a1)?'↑ più estremo':avg(a2)<avg(a1)?'↓ più moderato':'= invariata'}</span>.`:''}
    ${grave.length?` Dopo gli avvenimenti gravi (${grave.length}) il ritmo è passato in media da <b>${(gb/grave.length).toFixed(1).replace('.',',')}</b> a <b>${(ga/grave.length).toFixed(1).replace('.',',')}</b> azioni al minuto.`:''}</p>
  </section>

  <section class="card"><h2>Reazioni agli avvenimenti</h2><p class="hint" style="margin-bottom:8px">Per ogni avvenimento: dopo quanto il giocatore fa la prima azione, il ritmo nei due minuti prima e dopo, l'assurdità dei post nei tre minuti prima e dopo.</p>
    <div class="tablebox"><table><thead><tr><th>Min</th><th>Avvenimento</th><th>Prima azione dopo</th><th>Azioni/min prima → dopo</th><th>Assurdità prima → dopo</th><th>Risposta</th></tr></thead><tbody>
    ${R.reactions.length?R.reactions.map(r=>`<tr><td class="num">${mmss(r.w.ms)}</td><td>${describe(r.w)}</td><td class="num">${r.first==null?'—':secs(r.first)}${r.firstType?`<br><small class="hint">${esc(stripTags(evDesc(R.ev.find(e=>e.ms>r.w.ms&&e.type===r.firstType)||{type:r.firstType})).slice(0,60))}</small>`:''}</td>
      <td class="num">${r.before.toFixed(1).replace('.',',')} → ${r.after.toFixed(1).replace('.',',')} ${r.after>r.before?'<span class="down">↑</span>':r.after<r.before?'<span class="up">↓</span>':''}</td>
      <td class="num">${r.absBefore==null?'—':r.absBefore.toFixed(1).replace('.',',')} → ${r.absAfter==null?'—':r.absAfter.toFixed(1).replace('.',',')}${r.same?' <span class="pill">insiste sulla stessa narrativa</span>':''}</td>
      <td class="num">${r.resp!=null?'risponde in '+secs(r.resp):''}</td></tr>`).join(''):'<tr><td colspan="6" class="empty">Nessun avvenimento registrato.</td></tr>'}
    </tbody></table></div></section>

  <section class="card"><h2>Scelte</h2>
    <h3>Post pubblicati</h3><div class="tablebox"><table><thead><tr><th>Min</th><th>Narrativa</th><th>Formato</th><th>Stadio</th><th>Assurdità</th><th>Pubblico</th><th>€</th><th>Decide in</th><th>Bozze rifatte</th><th>"Più estremo"</th><th>Caratteri cancellati</th><th>Risultato</th></tr></thead><tbody>
    ${R.pubs.length?R.pubs.map(p=>`<tr><td class="num">${mmss(p.ms)}</td><td>${esc(nn(p.narr))}${p.hook?' <span class="pill">aggancio a tendenza</span>':''}</td><td>${esc(p.fmt)}</td><td>${esc(TEXT.stageNames[p.stage]||p.stage)}</td><td class="num">${p.absurd}</td><td>${esc(p.target==='tutti'?'tutti':(COMM[p.target]||p.target))}</td><td class="num">${p.budget||''}</td><td class="num">${secs(p.hesitationMs)}</td><td class="num">${p.regenerations}</td><td class="num">${p.moreExtreme}</td><td class="num">${p.deletedChars==null?'':p.deletedChars}</td><td class="num">${p.result?fmt(p.result.reached)+' raggiunti'+(p.result.removed?' · <span class="pill bad">rimosso</span>':''):''}</td></tr>`).join(''):'<tr><td colspan="12" class="empty">Nessun post.</td></tr>'}</tbody></table></div>
    <h3>Messaggi privati</h3><div class="tablebox"><table><thead><tr><th>Min</th><th>Da</th><th>Scelta</th><th>Aperto dopo</th><th>Deciso dopo l'apertura</th></tr></thead><tbody>
    ${R.dmc.length?R.dmc.map(c=>{const rcv=R.ev.find(e=>e.type==='dm_received'&&e.dm===c.dm);const op=R.ev.find(e=>e.type==='dm_open'&&e.dm===c.dm);return `<tr><td class="num">${mmss(c.ms)}</td><td>${esc(rcv?rcv.from:c.dm)}</td><td><b>${esc(c.label)}</b></td><td class="num">${secs(op?op.sinceArrivalMs:null)}</td><td class="num">${secs(c.sinceOpenMs)}</td></tr>`}).join(''):'<tr><td colspan="5" class="empty">Nessuna risposta.</td></tr>'}</tbody></table></div>
    <h3>Altre decisioni</h3><ul style="margin:0;padding-left:18px">${R.ev.filter(e=>['thread_action','setting','launder','buy','crypto_sell','block','report','follow','chat_send','comment'].includes(e.type)).map(e=>`<li><span class="num hint">${mmss(e.ms)}</span> ${describe(e)}</li>`).join('')||'<li class="empty">Nessuna.</li>'}</ul>
  </section>

  <section class="card"><h2>Attenzione</h2><div class="grid2"><div>
    <h3>Tempo di sosta per tipo di contenuto</h3><div class="bars">${(()=>{const t=Object.entries(R.dwell).sort((a,b)=>b[1]-a[1]);const mx=Math.max(1,...t.map(x=>x[1]));return t.map(([k,v])=>`<div class="b"><span>${esc(KINDS[k]||k)}</span><div class="t"><i style="width:${v/mx*100}%"></i></div><span class="num">${secs(v)}</span></div>`).join('')||'<p class="empty">Nessun dato.</p>'})()}</div>
    <p class="hint" style="margin-top:8px">${R.views} contenuti guardati per più di un secondo.</p></div><div>
    <h3>Comportamento</h3><ul style="margin:0;padding-left:18px">
      <li>Uscite dall'app: <b>${R.away.length}</b>${R.away.length?` (in tutto ${secs(R.away.reduce((a,e)=>a+e.awayMs,0))} fuori)`:''}</li>
      <li>Feed scorso: <b>${fmt(R.scroll)}</b> pixel (circa ${Math.round(R.scroll/700)} schermate)</li>
      <li>Caratteri cancellati prima di pubblicare: <b>${R.del}</b></li>
      <li>Ricerche: <b>${R.ev.filter(e=>e.type==='search').length}</b>, profili aperti: <b>${R.ev.filter(e=>e.type==='profile_open').length}</b>, post aperti: <b>${R.ev.filter(e=>e.type==='post_open').length}</b></li>
    </ul>
    <h3>Osservazioni registrate</h3><ul style="margin:0;padding-left:18px">${R.ev.filter(e=>e.type==='observation').map(e=>`<li><span class="num hint">${mmss(e.ms)}</span> ${esc(e.text)}</li>`).join('')||'<li class="empty">Nessuna.</li>'}</ul></div></div>
  </section>

  <section class="card"><h2>Cronologia completa</h2><div class="chips" id="chips">${['tutto','pubblicazione','interazione','messaggi','avvenimenti','navigazione','attenzione'].map(c=>`<button data-c="${c}" class="${A.filter===c?'on':''}">${c}</button>`).join('')}</div><ul class="tl" id="tl"></ul></section>`;
  renderTimeline();
  el.querySelectorAll('#chips button').forEach(b=>b.onclick=()=>{A.filter=b.dataset.c;el.querySelectorAll('#chips button').forEach(x=>x.classList.toggle('on',x===b));renderTimeline()});
  $('#dlJson').onclick=()=>download(`psyop-${log.code||log.id}.json`,JSON.stringify(log,null,1),'application/json');
  $('#dlCsv').onclick=()=>download(`psyop-${log.code||log.id}.csv`,toCsv(log),'text/csv');
  const del=$('#del');if(del)del.onclick=async()=>{if(del.dataset.c!=='1'){del.dataset.c='1';del.textContent='Conferma cancellazione';setTimeout(()=>{del.dataset.c='';del.textContent='Cancella dall\'archivio'},4000);return}
    try{const r=await fetch(`${A.url}/log/${log.id}`,{method:'DELETE',headers:{Authorization:'Bearer '+A.key}});if(!r.ok)throw 0;A.list=A.list.filter(x=>x.id!==log.id);renderList();$('#report').innerHTML='';msg('Sessione cancellata.','ok')}catch(e){msg('Non riesco a cancellare la sessione. Controlla la chiave.','err')}};
  el.scrollIntoView({behavior:'smooth',block:'start'});
}
function renderTimeline(){
  const log=A.log;const ul=$('#tl');if(!ul)return;
  const items=log.events.filter(e=>e.type!=='state'&&(A.filter==='tutto'?e.type!=='view':CAT_OF[e.type]===A.filter));
  ul.innerHTML=items.map(e=>{const d=evDesc(e);if(!d)return'';const c=CAT_OF[e.type]||'navigazione';return `<li><time>${mmss(e.ms)}</time><span class="g">${esc(gameClock(log,e.g))}</span><span class="d" style="background:${CAT_COL[c]}"></span><span class="txt">${d}</span></li>`}).join('')||'<li><span></span><span></span><span></span><span class="empty">Niente in questa categoria.</span></li>';
}
function toCsv(log){
  const rows=[['secondi','ora_gioco','categoria','tipo','descrizione']];
  for(const e of log.events){if(e.type==='state')continue;rows.push([(e.ms/1000).toFixed(1),gameClock(log,e.g),CAT_OF[e.type]||'',e.type,stripTags(evDesc(e)).replace(/\s+/g,' ')])}
  return rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(';')).join('\n');
}
function download(name,text,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}

/* ---------- elenco e collegamento ---------- */
function msg(t,cls){const m=$('#cmsg');m.textContent=t;m.className='msg '+(cls||'')}
function renderList(){
  const f=($('#find').value||'').trim().toLowerCase();
  const rows=A.list.filter(x=>!f||String(x.code).toLowerCase().includes(f)||String(x.player||'').toLowerCase().includes(f));
  $('#rows').innerHTML=rows.map(x=>`<tr class="click ${A.log&&A.log.id===x.id?'sel':''}" data-id="${esc(x.id)}" tabindex="0"><td class="num">${x.started?new Date(x.started).toLocaleString('it-IT',{dateStyle:'short',timeStyle:'short'}):''}</td><td class="num">${esc(x.code||'')}</td><td>@${esc(x.player||'')}</td><td class="num">${x.durationMs?mmss(x.durationMs):''}</td><td>${x.ending?`<span class="pill">${esc(TEXT.ends[x.ending]?TEXT.ends[x.ending].h:x.ending)}</span>`:x.partial?'<span class="pill warn">interrotta</span>':''}</td><td class="num">${x.events||''}</td><td>${esc(x.device||'')}</td></tr>`).join('')||'<tr><td colspan="7" class="empty">Nessuna sessione.</td></tr>';
  $$('#rows tr.click').forEach(tr=>{const go=()=>openRemote(tr.dataset.id);tr.onclick=go;tr.onkeydown=e=>{if(e.key==='Enter')go()}});
}
async function openRemote(id){
  try{const r=await fetch(`${A.url}/log/${id}`,{headers:{Authorization:'Bearer '+A.key}});if(!r.ok)throw new Error(r.status);renderReport(await r.json());renderList()}
  catch(e){msg('Non riesco ad aprire la sessione ('+e.message+').','err')}
}
$('#load').onclick=async()=>{
  A.url=$('#wurl').value.trim().replace(/\/$/,'');A.key=$('#wkey').value;
  if(!A.url||!A.key){msg('Servono indirizzo del Worker e chiave.','err');return}
  try{sessionStorage.setItem('psyop.arch',JSON.stringify({url:A.url,key:A.key}))}catch(e){}
  msg('Carico…');
  try{const r=await fetch(`${A.url}/logs`,{headers:{Authorization:'Bearer '+A.key}});
    if(r.status===401){msg('Chiave non valida.','err');return}if(!r.ok)throw new Error(r.status);
    A.list=await r.json();$('#list').hidden=false;renderList();msg(`${A.list.length} sessioni nell'archivio.`,'ok')}
  catch(e){msg('Non riesco a raggiungere il Worker. Controlla l\'indirizzo ('+e.message+').','err')}
};
$('#find').oninput=renderList;
$('#fileIn').onchange=e=>{const f=e.target.files[0];e.target.value='';if(!f)return;const rd=new FileReader();rd.onload=()=>{try{const j=JSON.parse(rd.result);if(!Array.isArray(j.events))throw 0;renderReport(j);msg('File aperto: '+f.name,'ok')}catch(err){msg('Il file non è un log di Psyop valido.','err')}};rd.readAsText(f)};
(function init(){
  let s=null;try{s=JSON.parse(sessionStorage.getItem('psyop.arch')||'null')}catch(e){}
  $('#wurl').value=(s&&s.url)||(typeof CFG!=='undefined'&&CFG.workerUrl)||'';if(s&&s.key)$('#wkey').value=s.key;
  // log locale dell'ultima sessione non inviata (utile per provare senza Worker)
  const last=store.get('psyop.log.last')||store.get('psyop.log.unsent');
  if(last&&Array.isArray(last.events)){const b=document.createElement('button');b.className='btn ghost';b.textContent='Apri l\'ultima sessione di questo browser';b.onclick=()=>renderReport(last);$('#connect .row').append(b)}
})();
