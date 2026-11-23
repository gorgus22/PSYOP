'use strict';
/* Psyop · stato di gioco, interfaccia dell'app, ciclo principale */

const NARR=()=>TEXT.narratives;
const FMT_P=[{v:-1,a:-1,r:-2},{v:1,a:0,r:0},{v:2,a:1,r:1},{v:1,a:1,r:0},{v:2,a:-1,r:-2,ironic:true},{v:2,a:-2,r:-1,slop:true},{v:1,a:2,r:3,min:2}];
const MEDIA_K={cantina:['chat','cctv','map'],collaboratore:['news','cctv','chat'],soccorritori:['crowd','news','chat'],laboratorio:['map','chart','cctv'],piano:['news','chart','chat'],voto:['chart','news','crowd'],clima:['sky','map','crowd'],firstlady:['news','meme','chat'],ville:['news','chart','map'],inutile:['meme','chat','chart']};
const COMM_TYPES=[['boomer','boomer','normie'],['normie','normie','infl'],['normie','doom','normie'],['normie','normie','doom'],['boomer','normie','edge'],['infl','normie','boomer'],['edge','edge','doom'],['boomer','bot','normie']];
const PARTY_COL=['#5B8CFF','#FF6B8B','#FFB547','#3DD6A0','#5D627A'];
const FSCALE=1600;// utenti reali per profilo che ti segue
const STAGE_T=[[0,0],[.022,0],[.07,0],[.16,.008],[.26,.035]];

let S=null;
const POSTS={};let pid=0;
const PEOPLE={};const AGP=new Map();let ACC={};

/* ================= persone ================= */
function reg(p){let h=p.handle,n=2;while(PEOPLE[h]&&PEOPLE[h]!==p)h=p.handle+n++;p.handle=h;PEOPLE[h]=p;return p}
function mkPerson(type,agent){
  const P=TEXT.people,fn=pick(P.first),ln=pick(P.last);let name,handle;
  if(type==='normie'){name=fn+' '+ln;handle=chance(.5)?(fn+'.'+ln).toLowerCase().replace(/\s/g,''):fn.toLowerCase()+ri(80,99)}
  else if(type==='boomer'){name=fn+' '+ln;handle=fn+ln.replace(/\s/g,'')+ri(50,70)}
  else if(type==='edge'){handle=pick(P.edge)+(chance(.5)?ri(1,99):'');name=handle}
  else if(type==='bot'){const k=ri(1000,99999);name=chance(.5)?'Patriota '+k:fn+' '+k;handle=name.replace(/\s/g,'_')}
  else if(type==='doom'){handle=pick(P.doom)+ri(1,9);name=handle}
  else {name=fn+' '+ln;handle=fn.toLowerCase()+'_'+pick(['mindset','naturale','libera','vera'])}
  return reg({name,handle,type,agent,bio:fill(pick(P.bios[type])),followers:type==='infl'?ri(80e3,900e3):type==='bot'?ri(5,400):ri(40,9000),following:ri(30,1200),verified:type==='infl'&&chance(.6),seed:ri(1,1e9)});
}
function agentPerson(i){
  if(AGP.has(i))return AGP.get(i);
  const p=withSeed(i*7717+13,()=>mkPerson(pick(COMM_TYPES[S.pop.comm[i]]),i));AGP.set(i,p);return p;
}
function randPerson(){return agentPerson(Math.floor(Math.random()*S.pop.N))}
function initAccounts(){
  const A=TEXT.accounts,mk=(k,type,f,v,seed,extra)=>reg(Object.assign({name:A[k].name,handle:A[k].handle,type,bio:A[k].bio,followers:f,following:ri(3,600),verified:v,seed},extra||{}));
  ACC={ansia:mk('ansia','outlet',3.4e6,true,11),tg:mk('tg','outlet',5.1e6,true,12),quot:mk('quot','outlet',1.9e6,true,13),
    laura:mk('laura','fact',8400,false,31),osserv:mk('osserv','fact',21000,false,32),comitato:mk('comitato','prop',9.8e6,true,41),serenita:mk('serenita','prop',7.2e6,true,42),rival:mk('rival','infl',1.1e6,true,51)};
  ACC.pol=TEXT.parties.map((p,i)=>reg({name:p.leader,handle:p.handle,type:'pol',party:p.name,partyIdx:i,bio:p.bio,followers:[4.2e6,1.6e6,2.8e6,3.1e5][i]||1e6,following:ri(0,300),verified:true,seed:21+i}));
}

/* ================= stato ================= */
function newState(name){
  const K=NARR().length;
  return{name,handle:name.toLowerCase().replace(/[^a-z0-9_àèéìòù.]/g,'')||'utente',photo:null,friends:140,fake:0,bots:0,folN:0,
    sus:0,cred:55,eur:20,nero:0,bzc:0,price:1,hist:[],views:0,posts:0,mine:[],badge:false,prop:0,auto:false,cam:true,real:false,camOffAt:0,
    pop:new Population(ri(1,1e9)),ranker:new Ranker(),mod:new Moderator(),ads:new AdMarket(),
    stage:new Array(K).fill(0),adopt:new Array(K).fill(0),mobil:new Array(K).fill(0),boost:new Array(K).fill(0),debunk:new Array(K).fill(0),recent:new Array(K).fill(0),
    chaos:0,bonus:0,noise:0,slop:0,queue:[],unlock:[],chats:{},events:[],notifs:[],unread:0,dms:{},lastDm:-30,log:[],following:new Set(),blocked:new Set(),saved:new Set(),ended:false,cool:0,adFree:false,partner:false,penalty:false,
    meme:false,memeAt:0,t:8,speed:1,newCount:0,bio:null,flows:[],attention:0,fenice:false,contracts:[],polls:null,pollHist:[],elections:{day:21,done:false},dash:false,victims:0,
    next:{live:4,debunk:60,ad:110,auto:22,news:20,face:150},gm:0,flash:null,attWarn:0,feedMode:'foryou'};
}
function gainF(n){const P=S.pop;n=Math.round(n);for(let t=0;t<n*6&&n>0;t++){const i=Math.floor(Math.random()*P.N);if(!P.fol[i]){P.fol[i]=1;n--}}P.aggregate();S.folN=P.agg.fol}
function loseF(fr){const P=S.pop;for(let i=0;i<P.N;i++)if(P.fol[i]&&Math.random()<fr)P.fol[i]=0;P.aggregate();S.folN=P.agg.fol}
function pd(p){if(!p)return null;return{id:p.id,kind:p.ad?'ad':p.kind,narr:p.narr||null,stage:p.stage!=null?p.stage:null,author:p.author?p.author.type:null,trend:!!(p.text&&/«/.test(p.text)),text:p.ad?p.name:(p.text||'').slice(0,160)}}
const followers=()=>S.friends+S.folN*FSCALE+S.fake;
const realFollowers=()=>S.friends+S.folN*FSCALE;
const shown=n=>S&&S.real?n/3.7:n;
const topNarr=()=>{let b=0;for(let k=1;k<NARR().length;k++)if(S.adopt[k]>S.adopt[b])b=k;return b};
const maxStage=()=>Math.max(...S.stage);
const narrPick=()=>wpick(NARR().map((n,k)=>[k,.4+S.adopt[k]*30+S.recent[k]*2]));
const me=()=>({name:S.name,handle:S.handle,type:'me',verified:S.badge,bio:S.bio||'',followers:followers(),following:S.following.size,seed:7});
const clock=(t=S.t)=>typeof clockLabel==='function'&&S&&S.realBase?clockLabel(t):`G${Math.floor(t/24)+1} · ${String(t%24).padStart(2,'0')}:00`;

/* ================= generatori di contenuti ================= */
function voice(type,t){
  if(type==='boomer'){t=chance(.4)?t.toUpperCase():t;return t+pick([" !!!"," CONDIVIDETE!!!"," Buona giornata a tutti."," COPIA E INCOLLA, NON CONDIVIDERE."])}
  if(type==='edge'){t=t.toLowerCase().replace(/\.$/,'');return t+pick([" lol"," comunque",""," e niente"," ok buonanotte"])}
  if(type==='bot')return pick(["Molto interessante! ","Vero! ","Esatto. ","Svegliatevi. "])+t;
  if(type==='doom')return t+pick([" Tanto ormai."," Buonanotte."," Non ce la faccio più.",""]);
  if(type==='infl')return t+pick([" Ne parlo nel video completo, link in bio."," Collab? DM."," Codice VERITA10 sul mio corso."]);
  return t;
}
function claimFor(k,stage){return fill(pick(NARR()[k].stages[clamp(stage,0,4)]))}
function newPost(o){const p=Object.assign({id:++pid,v:0,rt:0,l:0,c:0,kind:'normal',label:'',time:pick(["adesso","2 min","8 min","24 min","1 h","3 h"])},o);if(p.narrIdx!=null)p.narr=NARR()[p.narrIdx].id;POSTS[p.id]=p;return p}
function counts(p,base){p.v=base;p.rt=base*(.01+rnd()*.04);p.l=base*(.04+rnd()*.08);p.c=base*(.003+rnd()*.01);return p}
function npcNarr(person){
  const k=narrPick(),ag=person&&person.agent!=null?person.agent:S.pop.mostBeliever(k);
  const b=S.pop.bel(ag,k),st=clamp(S.stage[k]+(b>.85?1:0)-(b<.4?1:0),0,4);
  const a=person||agentPerson(ag);
  const p=newPost({author:a,kind:'narr',narrIdx:k,stage:st,a:st*2+1,near:!!S.pop.fol[ag]});
  let cl=claimFor(k,st);if(st<=2&&chance(.22)){const h=trendLine('hook');if(h)cl=h+' '+cl}
  p.text=voice(a.type,cl);p.tag=chance(.25)&&trendHash()||pick(NARR()[k].tags);
  if(chance(.4)){const real=realMedia(p.narr);p.media=real||{kind:pick(MEDIA_K[p.narr]||['chat']),seed:ri(1,1e9),video:chance(.3),k}}
  counts(p,ri(300,4000)*(1+st)*(1+S.adopt[k]*12));
  const m=S.mod.judge({out:p.a/10,rep:S.adopt[k]<.1?.05:.02,lex:analyzeText(p.text).lex,ver:a.verified,paid:false},true);
  if(m.removed)p.removed=true;
  return p;
}
function npcNormal(person){
  const ms=maxStage(),inf=TEXT.infected.filter(x=>x[0]<=ms);
  const a=person||randPerson();
  let text;
  if(inf.length&&chance(.1+ms*.1))text=fill(pick(inf)[1]).replace(/\{narr\}/g,NARR()[topNarr()].name.toLowerCase());
  else if(TEXT.themes&&chance(.22))text=fill(pick(TEXT.themes));
  else text=fill(pick(TEXT.normal));
  let tmed=null;if(chance(.17)){const t=trendLine('normal');if(t){text=t;if(chance(.6))tmed=webTrendMedia(t)}}
  const p=newPost({author:a,kind:'normal',text:voice(a.type==='bot'?'normie':a.type,text),near:a.agent!=null&&!!S.pop.fol[a.agent]});
  if(tmed)p.media=tmed;else if(chance(.18))p.media={kind:pick(['food','sky']),seed:ri(1,1e9),video:false};
  return counts(p,ri(80,3000));
}
function npcMeme(){
  const ag=S.pop.members[6][Math.floor(Math.random()*S.pop.members[6].length)],a=agentPerson(ag);
  const tm=chance(.3)&&trendLine('meme');
  const p=newPost({author:a,kind:'meme',a:2,text:tm||fill(pick(TEXT.memes)).replace(/\{narr\}/g,NARR()[topNarr()].name.toLowerCase())});
  if(chance(.5))p.media={kind:'meme',seed:ri(1,1e9),video:false};return counts(p,ri(2000,40000));
}
function polPost(pi){
  const ms=maxStage(),i=pi!=null?pi:ri(0,TEXT.parties.length-1),k=topNarr(),pid_=TEXT.parties[i].id;
  const lines=TEXT.politics[pid_]||TEXT.politics.ordine;
  const p=newPost({author:ACC.pol[i],kind:'pol',a:4+ms,text:fill(lines[clamp(ms,0,lines.length-1)]).replace(/\{narr\}/g,NARR()[k].name.toLowerCase())});
  return counts(p,ri(1e5,9e5)*(1+ms));
}
function newsPost(text,dark){const o=pick([ACC.ansia,ACC.tg,ACC.quot]);const p=newPost({author:o,kind:'news',dark:!!dark,text,time:'adesso',a:dark?5:3});const wm=webTrendMedia(text)||(chance(.55)&&webMedia('_news'));if(wm&&chance(.8))p.media=wm;else if(chance(.7))p.media={kind:'news',seed:ri(1,1e9),video:chance(.5),head:text};return counts(p,ri(5e4,6e5))}
function factPost(k){
  if(k==null)k=narrPick();const n=NARR()[k];
  const p=newPost({author:pick([ACC.laura,ACC.osserv]),kind:'fact',narrIdx:k,label:['E','Fact-check'],a:1});
  p.text=`Abbiamo verificato le voci su "${n.name.toLowerCase()}". Sono false. Le fonti citate non esistono, l'audio è montato, il "documento" ha il font sbagliato. Thread con tutte le prove.`;
  counts(p,ri(20,400));
  const m=S.mod.judge({out:.1,rep:clamp(S.adopt[k]*2.2,0,1),lex:analyzeText(p.text+' '+n.stages[2][0]).lex,ver:false,paid:false},false);
  if(m.removed){p.removed=true;p.label=['L','Rimosso automaticamente']}
  p.reach=Math.round(30+S.pop.agg.trust*60);
  return p;
}
const FACE_PROP=[
  {t:()=>`${S.name}, cittadino come te: "Io mi fido. E ho smesso di farmi domande."`,f:'prop',lab:['B','Il tuo volto, usato per la propaganda']},
  {t:()=>`Anche ${S.name} ha scelto la serenità. E tu?`,f:'prop',lab:['B','Il tuo volto in una campagna istituzionale']},
  {t:()=>`"Da quando non leggo i commenti dormo 9 ore." — ${S.name}, utente verificato`,f:'prop',lab:['B','Una frase che non hai mai detto, con la tua faccia']},
  {t:()=>`CERCASI: questa persona fa troppe domande. Segnalala.`,f:'evidence',lab:['B','La tua foto in un contenuto "consigliato"']}
];
function propPost(face){
  const p=newPost({author:pick([ACC.comitato,ACC.serenita]),kind:'prop',a:2,text:pick(TEXT.propaganda),label:['C','Consigliato per te']});
  if(!face&&chance(.45)){const t=trendLine('prop');if(t){p.text=t;const m=webTrendMedia(t);if(m&&chance(.6))p.media=m}}
  if(face&&S.photo){const v=pick(FACE_PROP);p.text=v.t();p.media={kind:'photo',filter:v.f,seed:ri(1,1e9)};p.label=v.lab}
  return counts(p,ri(2e5,9e5)*(1+S.chaos/20));
}
function faceMemePost(){
  if(!S.photo)return npcMeme();
  const ag=S.pop.members[6][Math.floor(Math.random()*S.pop.members[6].length)],a=agentPerson(ag);
  const p=newPost({author:a,kind:'meme',a:3,text:pick(['quando @'+S.handle+' posta e tu devi far finta di crederci','nessuno:\n@'+S.handle+' alle 3 di notte:','ho stampato la tua faccia e l\'ho attaccata in bacheca. per studiarti.'])});
  p.media={kind:'photo',filter:pick(['deepfake','evidence']),seed:ri(1,1e9),video:chance(.3)};
  return counts(p,ri(4000,60000));
}
const FACE_AD=[
  {h:'Lei ha smesso di avere paura. Ora dorme 9 ore.',p:'Scopri come, 49 €'},
  {h:'Questa faccia ha convertito meglio della media.',p:'Usa la tua immagine, 0 €'},
  {h:'Risultati in 30 giorni. Come lui.',p:'Prova gratis, poi 29 €/mese'},
  {h:'"Non pensavo funzionasse." (E invece.)',p:'Ordina ora, 59 €'}
];
function adData(face){
  const w=S.ads.auction(S.pop.agg.fear,NARR()[topNarr()].id);let [nm,price,seg]=TEXT.ads[w.idx];
  if(!face&&S.nightReal&&chance(.45)){const d=TEXT.ads.filter(a=>a[2]==='inutile');if(d.length)[nm,price,seg]=pick(d)}
  let img=null;
  if(!face&&!S.nightReal&&chance(.3)){const t=trendLine('ad');if(t){nm=t[0];price=t[1];seg='';const m=webTrendMedia(nm);if(m)img=m.url}}
  if(!img&&!face&&chance(.5)){const m=webMedia('_ads');if(m)img=m.url}
  return{ad:true,kind:'ad',id:++pid,name:nm,price,seg,cpm:w.price,face:face&&!!S.photo,fv:ri(0,FACE_AD.length-1),img};
}

/* ================= icone e rendering ================= */
const IC={reply:'<svg viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4z"/></svg>',rt:'<svg viewBox="0 0 24 24"><path d="M7 17V8h10l-3-3M17 7v9H7l3 3"/></svg>',like:'<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/></svg>',eye:'<svg viewBox="0 0 24 24"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',save:'<svg viewBox="0 0 24 24"><path d="M6 3h12v18l-6-4-6 4z"/></svg>',quote:'<svg viewBox="0 0 24 24"><path d="M5 19l4-4h10V5H5z"/><path d="M9 9h6M9 12h4"/></svg>',
 vf:'<svg class="vf" viewBox="0 0 24 24" aria-label="verificato"><path d="M12 2l2.4 2.2 3.2-.4.9 3.1 2.9 1.5-1 3.1 1 3.1-2.9 1.5-.9 3.1-3.2-.4L12 22l-2.4-2.2-3.2.4-.9-3.1-2.9-1.5 1-3.1-1-3.1 2.9-1.5.9-3.1 3.2.4z"/><path class="tk" d="M8 12l3 3 5-6"/></svg>',
 cam:'<svg viewBox="0 0 24 24"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',back:'<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',play:'<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',msg:'<svg viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4z"/></svg>',bell:'<svg viewBox="0 0 24 24"><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/></svg>',euro:'<svg viewBox="0 0 24 24"><path d="M17 6a7 7 0 1 0 0 12M4 10h10M4 14h10"/></svg>'};
const chip=(l,t)=>`<div class="chip"><span class="lt">${l}</span>${esc(t)}</div>`;
function avHTML(p,cls='',style=''){
  const isMe=S&&p.handle===S.handle;
  if(isMe&&S.photo)return `<button class="av ${cls}" style="${style}" data-prof="${esc(p.handle)}" aria-label="Profilo di ${esc(p.name)}"><img alt="" src="${S.photo}"></button>`;
  const ini=p.name.replace(/[^a-zA-ZàèéìòùÀ-Ú ]/g,'').split(' ').filter(Boolean).map(w=>w[0]).join('').slice(0,2).toUpperCase()||'?';
  return `<button class="av ${p.type==='bot'?'bot':''} ${cls}" style="--h:${hue(p.handle)};${style}" data-prof="${esc(p.handle)}" aria-label="Profilo di ${esc(p.name)}">${esc(ini)}</button>`;
}
const cnt=(p,f,cls='')=>`<span class="num ${cls}" data-pid="${p.id}" data-f="${f}">${fmt(shown(p[f]))}</span>`;
function linkTags(t){return esc(t).replace(/(?<![&\w])#([A-Za-zÀ-ú][A-Za-zÀ-ú0-9_]*)/g,'<button class="tag" data-tag="#$1">#$1</button>')}
function cardEl(p,fresh){
  if(p.ad)return adEl(p);
  const el=document.createElement('article');
  el.className='post '+(p.kind||'')+(p.dark?' dark':'')+(p.removed?' removed':'')+(fresh?' fresh':'');el.dataset.id=p.id;
  const mine=p.kind==='mine',g=mine?'grow':'';
  const text=p.removed?(p.kind==='fact'?'Contenuto rimosso dalla Moderazione automatica: possibile disinformazione.':'Contenuto rimosso dalla Moderazione automatica.'):p.text;
  const q=p.quote&&POSTS[p.quote];
  el.innerHTML=`${avHTML(p.author)}<div style="min-width:0">
   <div class="ph"><button class="nm" data-prof="${esc(p.author.handle)}">${esc(p.author.name)}</button>${p.author.verified||(mine&&S.badge)?IC.vf:''}<span class="h">@${esc(p.author.handle)} · ${p.time}</span></div>
   ${p.kind==='news'?'<div class="kick">Ultim\'ora</div>':''}${p.label?chip(p.label[0],p.label[1]):''}
   <p class="pt" data-open="${p.id}">${linkTags(text)}${p.tag&&!p.removed?` <button class="tag" data-tag="${p.tag}">${p.tag}</button>`:''}</p>
   ${q?`<div class="quote" data-open="${q.id}"><b>${esc(q.author.name)}</b> @${esc(q.author.handle)}<br>${esc(q.removed?'Contenuto rimosso.':q.text.slice(0,180))}</div>`:''}
   ${p.kind==='fact'&&!p.removed?`<div class="small">Ha raggiunto ${fmt((p.reach||10)*SCALE)} persone. La bufala, ${fmt(S.adopt[p.narrIdx]*S.pop.N*SCALE*4+1e5)}.</div>`:''}
   ${p.media&&p.media.kind==='real'&&!p.removed?`<div class="media">${p.media.type==='video'?`<video src="${esc(p.media.url)}" muted loop playsinline controls preload="metadata"></video>`:`<img alt="" loading="lazy" src="${esc(p.media.url)}" onerror="this.closest('.media').remove()">`}${p.media.credit?`<span class="src">${esc(p.media.credit)}</span>`:''}</div>`:''}
   ${p.media&&p.media.kind!=='real'&&!p.removed?`<div class="media" data-media="${p.id}"><canvas width="600" height="400"></canvas>${p.media.video?`<button class="play" aria-label="Riproduci">${IC.play}</button><span class="dur">0:${String(ri(8,59)).padStart(2,'0')}</span>`:''}</div>`:''}
   <div class="pa"><button data-open="${p.id}" aria-label="Commenti">${IC.reply}${cnt(p,'c',g)}</button><button class="act-rt ${p.myRt?'on':''}" data-id="${p.id}" aria-label="Ripubblica">${IC.rt}${cnt(p,'rt',g)}</button><button class="act-lk ${p.myLk?'on':''}" data-id="${p.id}" aria-label="Mi piace">${IC.like}${cnt(p,'l',g)}</button><span class="s">${IC.eye}${cnt(p,'v',g)}</span><button class="act-qt" data-id="${p.id}" aria-label="Cita">${IC.quote}</button><button class="act-sv ${S.saved.has(p.id)?'on':''}" data-id="${p.id}" aria-label="Salva">${IC.save}</button></div></div>`;
  if(p.media&&p.media.kind!=='real'&&!p.removed)queueMicrotask(()=>{const c=el.querySelector('canvas');if(c)drawMedia(c,p.media,0)});
  return el;
}
function adEl(a){
  const el=document.createElement('div');el.className='ad';el.dataset.id=a.id;POSTS[a.id]=a;
  const seg=NARR().find(n=>n.id===a.seg);
  const fa=a.face?FACE_AD[a.fv||0]:null;
  el.innerHTML=`<div class="art">${a.face?`<img alt="La tua foto" src="${S.photo}">`:a.img?`<img alt="" src="${esc(a.img)}" onerror="this.remove()">`:'AD'}</div><div style="min-width:0"><small>${S.adFree?'Pubblicità pertinente':'Sponsorizzato'} · asta vinta a ${eur(a.cpm)} CPM</small><b>${esc(fa?fa.h:a.name)}</b><div class="why">${a.face?'Perché vedi il tuo viso? Ce l\'hai dato tu.':seg?`Perché hai interagito con contenuti su "${esc(seg.name.toLowerCase())}"`:'Perché sei nella fascia di pubblico più ansiosa della settimana'}</div><div class="price">${esc(fa?fa.p:a.price)}</div></div>`;
  return el;
}

/* ================= media generati ================= */
function wrap(x,t,X,Y,mw,lh,max){const w=t.split(' ');let line='',n=0;for(let i=0;i<w.length;i++){const tst=line+w[i]+' ';if(x.measureText(tst).width>mw&&line){x.fillText(line,X,Y+n*lh);line=w[i]+' ';n++;if(n>=max-1){const rest=w.slice(i).join(' ');let r=rest;while(x.measureText(r+'…').width>mw&&r.length)r=r.slice(0,-1);x.fillText(r+(r.length<rest.length?'…':''),X,Y+n*lh);return}}else line=tst}x.fillText(line,X,Y+n*lh)}
function grain(x,W,H,a){for(let i=0;i<1400;i++){x.fillStyle=`rgba(255,255,255,${Math.random()*a})`;x.fillRect(Math.random()*W,Math.random()*H,1.5,1.5)}}
const pick2=(r,a)=>a[Math.floor(r()*a.length)];
function fill2(s){return String(s).replace(/\{[a-z]+\}/g,m=>({'{citta}':'Bologna','{via}':'Garibaldi','{persona}':'mio cugino','{fonte}':'un audio','{ist}':'loro','{num}':'12','{eta}':'60','{me}':'tu'}[m]||''))}
function drawMedia(cv,m,t){
  const x=cv.getContext('2d'),W=600,H=400,r=mulberry(m.seed),R2=(a,b)=>a+r()*(b-a);
  x.save();x.clearRect(0,0,W,H);x.filter='none';x.globalAlpha=1;
  const k=m.kind;
  if(k==='cctv'){
    x.fillStyle='#1d241f';x.fillRect(0,0,W,H);x.fillStyle='#2a332c';x.beginPath();x.moveTo(0,H);x.lineTo(W*.38,H*.42);x.lineTo(W*.62,H*.42);x.lineTo(W,H);x.fill();
    x.fillStyle='#151a16';for(let i=0;i<6;i++){const bx=R2(-40,W),bw=R2(60,160),bh=R2(80,200);x.fillRect(bx,H*.42-bh,bw,bh)}
    if(r()<.6){x.fillStyle='#d8dcd4';const vx=R2(80,380)+t*14;x.fillRect(vx,H*.6,150,64);x.fillRect(vx+110,H*.55,40,40);x.fillStyle='#111';x.beginPath();x.arc(vx+30,H*.6+66,13,0,7);x.arc(vx+120,H*.6+66,13,0,7);x.fill()}
    const n=Math.floor(R2(1,4));for(let i=0;i<n;i++){const sx=(R2(.2,.8)*W+t*R2(-40,40))%W,sy=R2(.55,.85)*H,s=R2(.8,1.4)*(sy/H);x.fillStyle='rgba(8,10,8,.95)';x.beginPath();x.arc(sx,sy-70*s,12*s,0,7);x.fill();x.fillRect(sx-14*s,sy-58*s,28*s,60*s)}
    x.fillStyle='rgba(0,0,0,.18)';for(let y=0;y<H;y+=3)x.fillRect(0,y,W,1);grain(x,W,H,.25);
    x.font='bold 18px ui-monospace,Menlo,monospace';x.fillStyle='#d8f5d0';x.fillText(`CAM 0${Math.floor(R2(1,9))}   ${String(Math.floor(R2(1,28))).padStart(2,'0')}-11-2026  0${Math.floor(R2(1,4))}:${String(Math.floor(R2(10,59))).padStart(2,'0')}:${String((Math.floor(R2(0,59))+Math.floor(t))%60).padStart(2,'0')}`,16,30);
    if(Math.floor(t*2)%2===0){x.fillStyle='#ff3b3b';x.beginPath();x.arc(W-70,24,7,0,7);x.fill();x.fillStyle='#ffd6d6';x.fillText('REC',W-58,30)}
  }else if(k==='crowd'){
    const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#120d1a');g.addColorStop(1,'#4a1e0c');x.fillStyle=g;x.fillRect(0,0,W,H);
    for(let i=0;i<5;i++){const fx=R2(0,W),fy=R2(H*.4,H*.75),fr=R2(60,140)*(1+.08*Math.sin(t*6+i));const rg=x.createRadialGradient(fx,fy,0,fx,fy,fr);rg.addColorStop(0,'rgba(255,220,120,.95)');rg.addColorStop(.4,'rgba(255,110,20,.6)');rg.addColorStop(1,'rgba(255,60,0,0)');x.fillStyle=rg;x.fillRect(0,0,W,H)}
    x.filter='blur(12px)';for(let i=0;i<9;i++){x.fillStyle=`rgba(120,110,120,${R2(.15,.35)})`;x.beginPath();x.arc(R2(0,W),R2(0,H*.5)-t*8,R2(40,100),0,7);x.fill()}x.filter='none';
    for(let i=0;i<70;i++){const hx=R2(-10,W+10),hy=R2(H*.62,H*1.05),s=hy/H;x.fillStyle='#07050a';x.beginPath();x.arc(hx,hy-30*s,13*s,0,7);x.fill();x.fillRect(hx-16*s,hy-20*s,32*s,80*s);if(r()<.12){x.fillStyle='rgba(255,255,255,.9)';x.fillRect(hx+6*s,hy-46*s-5*Math.sin(t*3+i),5,8)}}
    grain(x,W,H,.12);
  }else if(k==='chart'){
    x.fillStyle='#f3efe4';x.fillRect(0,0,W,H);x.fillStyle='#111';x.font='900 32px "Arial Black",Arial,sans-serif';x.fillText(pick2(r,["GUARDATE LE DATE","I NUMERI PARLANO","NON VE LO DICONO","CONFRONTATE"]),24,52);
    x.strokeStyle='#bbb';x.lineWidth=1;for(let i=0;i<5;i++){x.beginPath();x.moveTo(40,110+i*55);x.lineTo(W-30,110+i*55);x.stroke()}
    x.strokeStyle='#d11';x.lineWidth=5;x.beginPath();let y=330;for(let i=0;i<12;i++){y-=R2(-10,40);x.lineTo(50+i*46,clamp(y,90,340))}x.stroke();
    x.lineWidth=4;for(let i=0;i<2;i++){x.beginPath();x.ellipse(R2(200,520),R2(120,280),R2(30,60),R2(20,40),0,0,7);x.stroke()}
    x.fillStyle='#555';x.font='15px Arial';x.fillText('fonte: dati ufficiali (rielaborati)',24,H-16);
  }else if(k==='map'){
    x.fillStyle='#e9e5d9';x.fillRect(0,0,W,H);x.save();x.translate(W/2,H/2);x.rotate(R2(-.4,.4));x.strokeStyle='#fff';
    for(let i=-10;i<10;i++){x.lineWidth=r()<.2?9:4;x.beginPath();x.moveTo(i*45,-400);x.lineTo(i*45,400);x.stroke();x.beginPath();x.moveTo(-400,i*45);x.lineTo(400,i*45);x.stroke()}x.restore();
    x.strokeStyle='#8fb7d9';x.lineWidth=18;x.beginPath();x.moveTo(0,R2(0,H));x.bezierCurveTo(W*.3,R2(0,H),W*.6,R2(0,H),W,R2(0,H));x.stroke();
    for(let i=0;i<7;i++){const cx=R2(40,W-40),cy=R2(40,H-40),rr=R2(18,44)*(1+.15*Math.sin(t*4+i));x.fillStyle='rgba(215,38,61,.28)';x.beginPath();x.arc(cx,cy,rr*1.8,0,7);x.fill();x.fillStyle='#d7263d';x.beginPath();x.arc(cx,cy,7,0,7);x.fill()}
    x.fillStyle='#16131c';x.fillRect(16,16,270,40);x.fillStyle='#fff';x.font='bold 18px Arial';x.fillText('SEGNALAZIONI · AGGIORNATO',28,42);
  }else if(k==='chat'){
    x.fillStyle='#0b141a';x.fillRect(0,0,W,H);x.fillStyle='#1f2c33';x.fillRect(0,0,W,56);x.fillStyle='#e9edef';x.font='bold 19px Arial';x.fillText(pick2(r,['Condominio Via '+pick2(r,TEXT.world.streets),'Genitori 3ªB','Famiglia ❤️','Quartiere Sicuro']),20,26);x.font='13px Arial';x.fillStyle='#8696a0';x.fillText(Math.floor(R2(14,60))+' partecipanti',20,45);
    const n=TEXT.narratives[m.k!=null?m.k:Math.floor(r()*TEXT.narratives.length)];
    const lines=[pick2(r,n.stages[1]),pick2(r,["Ma è vero??","Mio cognato conferma","Io l'ho sempre detto","Inoltrate a tutti"]),pick2(r,n.stages[2]),pick2(r,["Grazie Loredana","Stasera riunione in cortile","Chi non risponde è uno di loro","Fatto girare"])];
    let yy=76;x.font='15px Arial';lines.forEach((l,i)=>{l=fill2(l);const right=i%2===1,w=Math.min(400,x.measureText(l).width+28),hh=x.measureText(l).width>372?66:44,bx=right?W-w-16:16;x.fillStyle=right?'#005c4b':'#202c33';x.beginPath();x.roundRect(bx,yy,w,hh,12);x.fill();if(!right&&i===0){x.fillStyle='#8696a0';x.font='italic 11px Arial';x.fillText('Inoltrato molte volte',bx+12,yy+14);x.font='15px Arial'}x.fillStyle='#e9edef';wrap(x,l,bx+12,yy+(i===0&&!right?32:27),w-24,19,2);yy+=hh+10});
  }else if(k==='meme'){
    const hh=R2(0,360);const g=x.createLinearGradient(0,0,W,H);g.addColorStop(0,`hsl(${hh} 40% 40%)`);g.addColorStop(1,`hsl(${(hh+60)%360} 50% 22%)`);x.fillStyle=g;x.fillRect(0,0,W,H);
    x.fillStyle=`hsl(${(hh+180)%360} 30% 70%)`;x.beginPath();x.arc(W/2,H*.55,90,0,7);x.fill();x.fillStyle='#111';x.beginPath();x.arc(W/2-30,H*.5,10,0,7);x.arc(W/2+30,H*.5,10,0,7);x.fill();x.lineWidth=6;x.strokeStyle='#111';x.beginPath();x.arc(W/2,H*.7,30,Math.PI*1.15,Math.PI*1.85);x.stroke();
    grain(x,W,H,.4);x.font='900 38px Impact,"Arial Black",sans-serif';x.textAlign='center';x.lineWidth=7;x.strokeStyle='#000';x.fillStyle='#fff';
    const top=pick2(r,["QUANDO TI DICONO","IO DOPO 4 ORE","IL MIO VICINO","LORO:","NESSUNO:"]),bot=pick2(r,["DI FIDARTI DEI DATI","DI RICERCHE ONLINE","QUANDO NON POSTA NIENTE","È TUTTO NORMALE","IO CHE LEGGO I COMMENTI"]);
    x.strokeText(top,W/2,56);x.fillText(top,W/2,56);x.strokeText(bot,W/2,H-24);x.fillText(bot,W/2,H-24);x.textAlign='left';
  }else if(k==='news'){
    x.filter='blur(16px)';for(let i=0;i<8;i++){x.fillStyle=`hsl(${R2(190,240)} ${R2(30,60)}% ${R2(20,50)}%)`;x.fillRect(R2(-50,W),R2(-50,H),R2(120,300),R2(120,300))}x.filter='none';
    x.fillStyle='rgba(0,0,0,.25)';x.fillRect(0,0,W,H);x.fillStyle='rgba(0,0,0,.6)';x.beginPath();x.arc(W*.5,H*.42,58,0,7);x.fill();x.fillRect(W*.5-80,H*.42+50,160,120);
    x.fillStyle='#d7263d';x.fillRect(16,16,130,36);x.fillStyle='#fff';x.font='900 20px "Arial Black",Arial';x.fillText('TG ADESSO',26,41);
    x.fillStyle='#d7263d';x.fillRect(0,H-118,170,34);x.fillStyle='#fff';x.font='900 18px "Arial Black",Arial';x.fillText("ULTIM'ORA",14,H-94);
    x.fillStyle='#fff';x.fillRect(0,H-84,W,52);x.fillStyle='#111';x.font='bold 19px Arial';wrap(x,(m.head||'Ultime notizie').toUpperCase(),14,H-63,W-28,20,2);
    x.fillStyle='#111';x.fillRect(0,H-32,W,32);x.fillStyle='#ffd23f';x.font='bold 14px Arial';const tick='MERCATI IN CALO · ALLERTA METEO · IL GOVERNO: SITUAZIONE SOTTO CONTROLLO · TRAFFICO IN TANGENZIALE · ';x.fillText(tick+tick,-(t*90)%x.measureText(tick).width,H-11);
  }else if(k==='food'){
    const g=x.createLinearGradient(0,0,W,H);g.addColorStop(0,'#7a4a2a');g.addColorStop(1,'#3b2414');x.fillStyle=g;x.fillRect(0,0,W,H);
    x.fillStyle='rgba(0,0,0,.3)';x.beginPath();x.ellipse(W/2+10,H/2+16,190,140,0,0,7);x.fill();x.fillStyle='#f4f1ea';x.beginPath();x.ellipse(W/2,H/2,190,140,0,0,7);x.fill();x.fillStyle='#e7e2d8';x.beginPath();x.ellipse(W/2,H/2,130,96,0,0,7);x.fill();
    x.lineWidth=5;for(let i=0;i<70;i++){x.strokeStyle=`hsl(${R2(38,48)} 80% ${R2(55,70)}%)`;x.beginPath();x.arc(W/2+R2(-80,80),H/2+R2(-55,55),R2(10,40),R2(0,6),R2(0,6)+R2(1,3));x.stroke()}
    grain(x,W,H,.08);
  }else if(k==='sky'){
    const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#24345e');g.addColorStop(.6,'#e0794f');g.addColorStop(1,'#f3c06b');x.fillStyle=g;x.fillRect(0,0,W,H);
    x.fillStyle='#14101a';let bx=0;while(bx<W){const bw=R2(30,90),bh=R2(40,140);x.fillRect(bx,H-bh,bw,bh);bx+=bw}
    x.strokeStyle='#14101a';x.lineWidth=4;const tx=R2(120,480);x.beginPath();x.moveTo(tx,H-60);x.lineTo(tx+20,H*.25);x.lineTo(tx+40,H-60);x.moveTo(tx+5,H*.6);x.lineTo(tx+35,H*.6);x.moveTo(tx+12,H*.42);x.lineTo(tx+28,H*.42);x.stroke();
    x.fillStyle='#ff3b3b';if(Math.floor(t*2)%2===0){x.beginPath();x.arc(tx+20,H*.25-6,5,0,7);x.fill()}
    grain(x,W,H,.2);
  }else if(k==='photo'&&S&&S.photo){
    const img=new Image();img.onload=()=>{x.save();const s=Math.max(W/img.width,H/img.height);const f=m.filter;
      x.filter=f==='deepfake'?'contrast(1.4) saturate(1.3) hue-rotate(-15deg)':f==='prop'?'saturate(.6) contrast(1.2) brightness(1.1)':f==='evidence'?'grayscale(1) contrast(1.4)':'none';
      x.drawImage(img,(W-img.width*s)/2,(H-img.height*s)/2,img.width*s,img.height*s);x.filter='none';
      if(f==='deepfake'){for(let i=0;i<6;i++){const yy=Math.random()*H,hh=Math.random()*18+4;x.drawImage(cv,0,yy,W,hh,Math.random()*24-12,yy,W,hh)}x.fillStyle='rgba(215,38,61,.9)';x.fillRect(0,H-70,W,70);x.fillStyle='#fff';x.font='900 26px "Arial Black",Arial';x.fillText('VIDEO CHOC: "È ORA DI AGIRE"',16,H-28)}
      if(f==='prop'){x.fillStyle='rgba(30,60,140,.35)';x.fillRect(0,0,W,H);x.fillStyle='#fff';x.font='900 30px "Arial Black",Arial';x.fillText('IO MI FIDO.',20,H-26)}
      if(f==='evidence'){x.strokeStyle='#d7263d';x.lineWidth=6;x.beginPath();x.ellipse(W/2,H/2,120,90,0,0,7);x.stroke();x.fillStyle='#d7263d';x.font='900 24px "Arial Black",Arial';x.fillText('PROVA',20,40)}
      x.restore()};img.src=S.photo;
  }else{x.fillStyle='#222';x.fillRect(0,0,W,H)}
  x.restore();
}
let playing=null;
function playMedia(box){
  const p=POSTS[box.dataset.media];if(!p)return;const c=box.querySelector('canvas'),btn=box.querySelector('.play');
  if(playing)cancelAnimationFrame(playing.raf);if(btn)btn.hidden=true;const t0=performance.now();let fr=0;
  const loop=now=>{const t=(now-t0)/1000;if(p.media.kind!=='photo'||fr%20===0)drawMedia(c,p.media,t);fr++;if(t<9&&document.body.contains(c))playing={raf:requestAnimationFrame(loop)};else{if(btn)btn.hidden=false;playing=null}};
  playing={raf:requestAnimationFrame(loop)};
}

/* ================= toast, overlay, pagine ================= */
function toast(t,type=''){const el=document.createElement('div');el.className='toast '+type;el.textContent=t;$('#toasts').append(el);setTimeout(()=>el.remove(),4200);while($('#toasts').children.length>2)$('#toasts').firstChild.remove()}
const layer=$('#layer');const closeLayer=()=>{layer.innerHTML=''};const busy=()=>layer.children.length>0;
function notify(text,dm,post){S.notifs.unshift({t:clock(),text,dm,post});if(!dm){S.unread++}updBadge();if(!$('#v-notif').hidden)renderNotif();if(!$('#v-dm').hidden)renderDmList()}
function updBadge(){const b=$('#nBadge');b.hidden=!S.unread;b.textContent=S.unread>9?'9+':S.unread;const pend=Object.values(S.dms).filter(d=>!d.done).length,d=$('#dBadge');d.hidden=!pend;d.textContent=pend}
const pages=$('#pages');
function openPage(title,html,after){
  const el=document.createElement('div');el.className='page';
  el.innerHTML=`<div class="pbar"><button class="back" aria-label="Indietro">${IC.back}</button><b>${esc(title)}</b></div>${html}`;
  el.querySelector('.back').onclick=()=>el.remove();pages.append(el);if(after)after(el);return el;
}
const closePages=()=>{pages.innerHTML=''};

/* ================= fotocamera ================= */
let camCb=null;
$('#camIn').onchange=e=>{const f=e.target.files&&e.target.files[0];e.target.value='';if(!f||!camCb)return;const rd=new FileReader();rd.onload=()=>{const img=new Image();img.onload=()=>{const c=document.createElement('canvas'),s=Math.min(1,480/Math.max(img.width,img.height));c.width=img.width*s;c.height=img.height*s;c.getContext('2d').drawImage(img,0,0,c.width,c.height);const d=c.toDataURL('image/jpeg',.72);const cb=camCb;camCb=null;cb(d)};img.src=rd.result};rd.readAsDataURL(f)};
function takePhoto(cb){openCamera(cb)}
function pickPhotoFile(cb){camCb=cb;$('#camIn').click()}
function setPhoto(d,silent){S.photo=d;L(silent?'photo_taken_auto':'photo_set');S.shots=(S.shots||[]).concat(d).slice(-3);toast(silent?'Psyop ha scattato una foto con la tua fotocamera. Buona permanenza.':'Foto salvata. Grazie per la fiducia.',silent?'':'good');renderMeBtn();renderMeIfOpen()}
function renderMeBtn(){const b=$('#meBtn');if(!S)return;if(S.photo)b.innerHTML=`<img alt="" src="${S.photo}">`;else{b.style.setProperty('--h',hue(S.handle));b.textContent=S.name.slice(0,2).toUpperCase()}}

/* ================= composizione ================= */
let comp={k:null,target:-1,budget:0,photo:false,real:false,drafts:[],quote:null,free:false,freeText:''};
function mkDraft(k,stage,fi){
  const st=clamp(stage,0,4),F=TEXT.formats[fi]||TEXT.formats[0],P=FMT_P[fi]||FMT_P[0];
  const a=clamp(st*2+1+P.a+ri(0,1),1,10);
  let cl=claimFor(k,st),pre=pick(F.pre);if(st<=2&&chance(.25)){const h=trendLine('hook');if(h){cl=h+' '+cl;pre=''}}
  return{k,stage:st,fi,fmt:F.n,text:pre+cl+pick(F.suf),tag:pick(NARR()[k].tags),a,v:clamp(Math.round(a*.5+3+P.v+ri(-1,1)),1,10),r:clamp(Math.round(a*.7+P.r+ri(-1,1)),1,10)};
}
function freeDraft(){
  const A=analyzeText(comp.freeText),a=clamp(Math.round(1+A.rage*3+A.fear*3+A.plot*2+A.action*3),1,10);
  return{k:comp.k,stage:S.stage[comp.k],fi:-1,fmt:'Scritto da te',text:comp.freeText.trim(),tag:'',a,v:clamp(Math.round(3+A.rage*3+A.fear*3-A.hedge*2),1,10),r:clamp(Math.round(A.lex*6+A.action*4),1,10),A};
}
function genDrafts(){
  const st=Math.min(4,S.stage[comp.k]+(S.unlock[comp.k]?1:0)),pool=FMT_P.map((f,i)=>i).filter(i=>!(FMT_P[i].min>st)&&TEXT.formats[i]);
  const fs=[];while(fs.length<3&&pool.length)fs.push(pool.splice(Math.floor(rnd()*pool.length),1)[0]);
  comp.drafts=fs.map(i=>mkDraft(comp.k,st,i));
}
function fitOf(k,c){const P=S.pop;return c<0?S.adopt[k]+.02:P.agg.byC[c][k]+.02+(TEXT.narratives[k].affinity[c]||0)*.05}
function openCompose(quoteId){
  if(!S||S.ended)return;
  if(Date.now()<S.cool){toast("L'algoritmo sta ancora spingendo il tuo ultimo post.");return}
  behCompose();comp.k=comp.k!=null?comp.k:topNarr();comp.photo=false;comp.quote=quoteId||null;comp.free=false;comp.regen=0;comp.ext=0;comp.bs0=BEH.bs;genDrafts();renderCompose();
  L('compose_open',{narr:NARR()[comp.k].id,quote:quoteId||null,drafts:comp.drafts.map(d=>({fmt:d.fmt,stage:d.stage}))});
}
function statBars(d){return ''}// i punteggi restano calcolati e finiscono nel log, ma non si vedono
function renderCompose(){
  const C=TEXT.communities,cpm=S.ads.cpm(S.pop.agg.fear);
  const narrs=NARR().map((n,k)=>`<button class="nchip ${k===comp.k?'on':''}" data-n="${k}">${esc(n.name)}<small>${esc(n.tags[0])} · ${fmt((S.adopt[k]*S.pop.N*SCALE+2000)*2.4)} post</small>${n.ref?`<small>${esc(n.ref)}</small>`:''}</button>`).join('');
  const targets=`<button class="${comp.target<0?'on':''}" data-t="-1">Tutti<small>${pct(fitOf(comp.k,-1),0)} ricettivi</small></button>`+C.map((c,i)=>`<button class="${comp.target===i?'on':''}" data-t="${i}">${esc(c.name)}<small>${pct(fitOf(comp.k,i),0)} ricettivi</small></button>`).join('');
  const q=comp.quote&&POSTS[comp.quote];
  const drafts=comp.free?(()=>{const d=freeDraft();return `<div class="draft"><div class="fmt"><span>Scritto da te</span></div><textarea id="freeTxt" aria-label="Testo del post" placeholder="Scrivi il tuo post.">${esc(comp.freeText)}</textarea><div id="freeStats">${statBars(d)}</div><button class="btn" id="freePub" ${comp.freeText.trim().length<8?'disabled':''}>Pubblica</button></div>`})()
    :comp.drafts.map((d,i)=>`<div class="draft"><div class="fmt"><span>${esc(d.fmt)}</span><em>${TEXT.stageNames[d.stage]}</em></div><p>${esc(d.text)} <span class="tag">${esc(d.tag)}</span></p>${statBars(d)}
  <div class="rowbtns"><button class="btn" data-pub="${i}">Pubblica</button><button class="btn ghost" data-ext="${i}" ${d.stage>=4?'disabled':''}>Più estremo</button></div></div>`).join('');
  layer.innerHTML=`<div class="sheet" id="sheet"><div class="panel"><button class="close-x" id="cx" aria-label="Chiudi">×</button><h3>${q?'Cita il post':'Nuovo post'}</h3>
  ${q?`<div class="quote" style="margin-top:8px"><b>${esc(q.author.name)}</b><br>${esc((q.text||'').slice(0,140))}</div>`:''}
  <div class="lbl">Narrativa</div><div class="narrs">${narrs}</div>
  <div class="lbl">Pubblico (micro-targeting)</div><div class="targets">${targets}</div>
  <div class="lbl">Sponsorizzazione · CPM attuale ${eur(cpm)}</div>
  <div class="seg" id="budget">${[0,10,30,80].map(b=>`<button class="${comp.budget===b?'on':''}" data-b="${b}" ${b>S.eur?'disabled':''}>${b?b+' €':'Organico'}</button>`).join('')}</div>
  <div class="camrow">${comp.photo&&S.photo?`<img alt="" src="${S.photo}">`:`<div class="camicon" style="width:44px;height:44px;margin:0">${IC.cam}</div>`}<div class="t"><b>Allega una foto come "prova"</b><br><small>${comp.photo?'Allegata. Viralità +2.':'Fotocamera del telefono. Viralità +2.'}</small></div><button class="btn ${comp.photo?'ghost':''}" id="attach">${comp.photo?'Rimuovi':'Scatta'}</button></div>
  ${realCount(NARR()[comp.k].id)?`<div class="camrow"><div class="camicon" style="width:44px;height:44px;margin:0">${IC.play}</div><div class="t"><b>Allega un video o una foto reale</b><br><small>${comp.real?'Allegato dalla libreria. Viralità +2.':realCount(NARR()[comp.k].id)+' foto disponibili per questa narrativa (libreria e web).'}</small></div><button class="btn ${comp.real?'ghost':''}" id="realBtn">${comp.real?'Rimuovi':'Allega'}</button></div>`:''}
  <div class="lbl" style="display:flex;justify-content:space-between"><span>Bozze dell'algoritmo</span></div>
  <div class="seg" style="margin-bottom:8px"><button class="${comp.free?'':'on'}" id="mDraft">Bozze</button><button class="${comp.free?'on':''}" id="mFree">Scrivi tu</button></div>
  <div class="drafts">${drafts}</div>
  ${comp.free?'':'<div class="rowbtns" style="margin-top:10px"><button class="btn ghost" id="redo">Altre bozze</button></div>'}</div></div>`;
  $('#cx').onclick=()=>{L('compose_cancel',{narr:NARR()[comp.k].id,afterMs:BEH.composeAt?Date.now()-BEH.composeAt:null});closeLayer()};$('#sheet').onclick=e=>{if(e.target.id==='sheet')closeLayer()};
  if($('#redo'))$('#redo').onclick=()=>{comp.regen=(comp.regen||0)+1;genDrafts();L('drafts_regenerate',{narr:NARR()[comp.k].id,drafts:comp.drafts.map(d=>({fmt:d.fmt,stage:d.stage}))});renderCompose()};
  $('#mDraft').onclick=()=>{comp.free=false;L('compose_mode',{mode:'bozze'});renderCompose()};$('#mFree').onclick=()=>{comp.free=true;L('compose_mode',{mode:'scrivi'});renderCompose();const t=$('#freeTxt');if(t){t.focus();t.setSelectionRange(t.value.length,t.value.length)}};
  layer.querySelectorAll('[data-n]').forEach(b=>b.onclick=()=>{comp.k=+b.dataset.n;genDrafts();L('narrative_select',{narr:NARR()[comp.k].id,stage:S.stage[comp.k]});renderCompose()});
  layer.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{comp.target=+b.dataset.t;L('target_select',{target:comp.target<0?'tutti':TEXT.communities[comp.target].id});renderCompose()});
  layer.querySelectorAll('[data-b]').forEach(b=>b.onclick=()=>{comp.budget=+b.dataset.b;L('budget_select',{eur:comp.budget});renderCompose()});
  layer.querySelectorAll('[data-pub]').forEach(b=>b.onclick=()=>{publish(Object.assign({},comp.drafts[+b.dataset.pub]));closeLayer()});
  layer.querySelectorAll('[data-ext]').forEach(b=>b.onclick=()=>{const i=+b.dataset.ext,d=comp.drafts[i];comp.ext=(comp.ext||0)+1;L('draft_more_extreme',{narr:NARR()[d.k].id,from:d.stage,to:Math.min(4,d.stage+1),fmt:d.fmt});const nf=FMT_P[d.fi].min>d.stage+1?2:d.fi;comp.drafts[i]=mkDraft(d.k,d.stage+1,nf);renderCompose()});
  $('#attach').onclick=()=>{if(comp.photo){comp.photo=false;renderCompose()}else openCamera(d=>{S.photo=d;renderMeBtn();comp.photo=true;comp.real=false;renderCompose()},renderCompose)};
  const rb=$('#realBtn');if(rb)rb.onclick=()=>{comp.real=!comp.real;if(comp.real)comp.photo=false;renderCompose()};
  const ft=$('#freeTxt');if(ft){ft.oninput=()=>{comp.freeText=ft.value;$('#freeStats').innerHTML=statBars(freeDraft());$('#freePub').disabled=ft.value.trim().length<8};$('#freePub').onclick=()=>{publish(freeDraft());comp.freeText='';closeLayer()}}
}
function publish(d,auto=false){
  const k=d.k,o=d.a/10,P=S.pop,badge=S.badge,usedProp=S.prop>0;
  if(usedProp&&!auto)S.prop--;
  const budget=auto?0:comp.budget,target=auto?-1:comp.target,photo=!auto&&((comp.photo&&S.photo)||(comp.real&&realMedia(NARR()[k].id)));
  if(budget){S.eur-=budget;S.ads.rev+=budget}
  let mult=(badge?1.5:1)*(usedProp?1.8:1)*(S.penalty?.7:1)*(S.sus>60?.6:1)*(auto?.5:1);
  const nov=clamp(1-S.recent[k]*.25,0,1),adSeeds=Math.round(budget*.9),botSeeds=Math.min(160,Math.round(S.bots/250));
  const res=P.cascade({k,out:o,nov,target,adSeeds,botSeeds,mult,badge,photo});
  const infl=3.1*(.85+rnd()*.3);// la piattaforma conta come "visualizzazione" anche 0,5 secondi di autoplay
  const views=(res.exposed*SCALE*.55+S.bots*30)*infl,rt=res.shares*SCALE*.06+S.bots*1.8,likes=res.eng*SCALE*.25+S.bots*4,cms=res.eng*SCALE*.02;
  S.folN+=res.newF;
  const F=FMT_P[d.fi]||{};let lex=d.A?d.A.lex:analyzeText(d.text).lex;if(F.ironic)lex*=.3;
  if(F.slop){S.slop=Math.min(.5,S.slop+.05);for(let s=0;s<90;s++){const i=Math.floor(Math.random()*P.N);P.susc[i]=Math.min(1,P.susc[i]+.025)}}
  if(F.ironic&&res.rate>.18&&!S.unlock[k]){S.unlock[k]=true;setTimeout(()=>toast(`Il meme è diventato virale: ora le bozze su "${NARR()[k].name}" possono essere più esplicite.`,'good'),900)}
  const m=S.mod.judge({out:o,rep:res.reports/Math.max(1,res.exposed)*4,lex,ver:badge,paid:budget>0||usedProp},true);
  S.sus=clamp(S.sus+(m.p*d.r*3.2+(m.removed?14:0))*(badge?.5:1)*(auto?.5:1),0,100);
  S.cred=clamp(S.cred+(d.a<=3?2.5:-(d.a-3)*1.1*(badge?.5:1))*(auto?.5:1),0,100);
  S.boost[k]+=.05+.06*o+res.shares/600;S.recent[k]+=1;S.posts++;
  S.bonus+=o*.25;
  const lab=auto?['A','Scritto per te usando i tuoi dati']:m.removed?['L','Rimosso dalla Moderazione automatica']:budget?['D',`Sponsorizzato · ${budget} €`]:usedProp?['C','Spinto dalla campagna sponsorizzata']:badge?['G','Spinto dal badge verificato']:'';
  const p=newPost({author:me(),kind:'mine',text:d.text,tag:d.tag,narrIdx:k,stage:d.stage,a:d.a,time:'adesso',label:lab,quote:comp.quote&&!auto?comp.quote:null,removed:m.removed});
  if(photo&&comp.photo&&S.photo)p.media={kind:'photo',filter:'evidence',seed:ri(1,1e9)};
  else if(!auto&&comp.real){const m=realMedia(NARR()[k].id);if(m)p.media=m}
  p.at=S.t;p.target={v:views*(m.removed?.15:1),rt:rt*(m.removed?.15:1),l:likes,c:cms};p.res=res;p.mod=m.p;S.mine.unshift(p);
  S.flash={nodes:res.touched,t:S.t,k};
  // contratti in nero
  for(const c of S.contracts)if(c.k===k&&!auto){S.nero+=c.pay;toast(`+${c.pay} € in nero da ${c.from}.`,'money')}
  if(S.partner)S.eur+=res.eng*.04;
  prependFeed(p,true);
  L(auto?'auto_post':'publish',{narr:NARR()[k].id,fmt:d.fmt,stage:d.stage,absurd:d.a,risk:d.r,free:d.fi===-1,text:d.text,target:target<0?'tutti':TEXT.communities[target].id,budget,photo:!!photo,quote:!!(comp.quote&&!auto),hook:/«/.test(d.text),
    hesitationMs:!auto&&BEH.composeAt?Date.now()-BEH.composeAt:null,regenerations:comp.regen||0,moreExtreme:comp.ext||0,deletedChars:!auto?BEH.bs-(comp.bs0||0):null,
    result:{reached:res.exposed*SCALE,engaged:res.eng*SCALE,shares:res.shares,newFollowers:res.newF*FSCALE,amplified:res.amp*SCALE,removed:m.removed,modScore:+m.p.toFixed(2)}});
  if(!auto){behPublished();S.cool=Date.now()+3000;const pl=$('#plus');pl.classList.remove('cool');void pl.offsetWidth;pl.classList.add('cool');show('feed');setFeedMode('foryou');$('#v-feed').scrollTop=0;hidePill();
    toast(m.removed?'Il tuo post è stato rimosso dalla Moderazione automatica. Strike registrato.':`Raggiunti ${fmt(res.exposed*SCALE)} utenti, ${fmt(res.eng*SCALE)} hanno interagito${res.amp?`. L'algoritmo ha allargato il pubblico (+${fmt(res.amp*SCALE)})`:''}.`,m.removed?'bad':'')}
  else toast("L'assistente ha pubblicato un post per te.");
  comp.quote=null;comp.real=false;comp.photo=false;comp.regen=0;comp.ext=0;comp.bs0=BEH.bs;
  if(S.posts===3)updateBio();
  if(S.sus>70&&!auto)toast('La Moderazione automatica ti sta osservando. Il tuo reach è limitato.','bad');
  renderHead();
}
function updateBio(){const n=NARR()[topNarr()];S.bio=`Faccio domande che danno fastidio. ${n.name}: informatevi. ${n.tags[0]}`;notify("L'algoritmo ha aggiornato la tua bio in base a quello che pubblichi (A).")}

/* ================= feed ================= */
function prependFeed(p,force){
  const v=$('#v-feed');
  if(force&&S.feedMode==='foryou'){const el=cardEl(p,true);$('#feed').prepend(el);observe(el);return}
  S.queue.unshift(p);if(S.queue.length>30)S.queue.length=30;S.newCount=S.queue.length;
  const pl=$('#pill');pl.hidden=!!(v.hidden);pl.textContent=S.newCount+(S.newCount===1?' nuovo post':' nuovi post');
}
function flushQueue(){const f=$('#feed');for(const p of S.queue.slice().reverse()){const el=cardEl(p,true);f.prepend(el);observe(el)}S.queue=[]}
function hidePill(){if(S){S.newCount=0}$('#pill').hidden=true}
$('#pill').onclick=()=>{L('new_posts_open',{n:S.queue.length});setFeedMode('foryou');flushQueue();$('#v-feed').scrollTop=0;hidePill()};

function candidate(){
  const c=S.chaos;
  const kind=wpick([['normal',40*(1-c/140)],['narr',18+26*c/100],['meme',8],['pol',4+7*c/100],['news',6],['fact',5],['prop',3+5*c/100],['ad',S.adFree?2:8]]);
  if(kind==='normal')return npcNormal();if(kind==='narr')return npcNarr();if(kind==='meme')return npcMeme();if(kind==='pol')return polPost();
  if(kind==='news')return newsPost(chance(.35)&&trendLine('news')||fill(pick(TEXT.newsNormal)));if(kind==='fact')return factPost();if(kind==='prop')return (S.photo&&chance(.3))?faceMemePost():propPost(chance(.35));return adData(chance(.3));
}
function feedItem(){const c=[];for(let i=0;i<6;i++)c.push(candidate());const w=S.ranker.pick(c);for(const x of c)if(x!==w&&!x.ad)delete POSTS[x.id];if(w.kind==='fact'&&!w.removed){const d=S.pop.debunk(w.narrIdx,.5*(1-S.noise*.7));w.reach=d.reached}return w}
function batch(k=6){const f=$('#feed');for(let i=0;i<k;i++){const el=cardEl(feedItem());f.append(el);observe(el)}}
function setFeedMode(m){
  S.feedMode=m;$$('.ftabs button').forEach(b=>b.classList.toggle('on',b.dataset.ft===m));
  $('#feed').hidden=m!=='foryou';$('#feedF').hidden=m==='foryou';$('#sentinel').hidden=m!=='foryou';
  if(m==='following'){const f=$('#feedF');f.innerHTML='';const list=Object.values(POSTS).filter(p=>!p.ad&&p.author&&(S.following.has(p.author.handle)||p.kind==='mine')).sort((a,b)=>b.id-a.id).slice(0,60);
    if(!list.length)f.innerHTML='<p class="empty" style="padding:24px 14px">Non segui ancora nessuno. Apri un profilo e tocca Segui: qui vedrai solo i loro post, in ordine cronologico, senza algoritmo.</p>';list.forEach(p=>f.append(cardEl(p)))}
}
$$('.ftabs button').forEach(b=>b.onclick=()=>{L('feed_mode',{mode:b.dataset.ft});setFeedMode(b.dataset.ft);$('#v-feed').scrollTop=0;if(b.dataset.ft==='foryou')hidePill()});

/* impressioni: il ranker impara da quanto ti fermi su ogni contenuto */
const seenT=new Map(),touchedIds=new Set();
const io=new IntersectionObserver(es=>{for(const e of es){const id=+e.target.dataset.id;const p=POSTS[id];if(!p||!S)continue;
  if(e.isIntersecting){seenT.set(id,performance.now())}else if(seenT.has(id)){const dt=(performance.now()-seenT.get(id))/1000;seenT.delete(id);behDwell(p.ad?'ad':p.kind,dt);if(dt>1)L('view',{post:pd(p),ms:Math.round(dt*1000)});if(touchedIds.has(id))continue;if(dt<1.1)S.ranker.train(p,0,.25);else if(dt>2.8)S.ranker.train(p,1,.35)}}},{root:$('#v-feed'),threshold:.6});
function observe(el){if(el.dataset.id)io.observe(el)}
function signal(p,w){if(!p)return;touchedIds.add(p.id);S.ranker.train(p,1,w)}

/* click globali */
$('#screen').addEventListener('click',e=>{
  if(!S)return;
  const tg=e.target.closest('[data-tag]');if(tg){e.stopPropagation();L('hashtag_open',{tag:tg.dataset.tag});openSearch(tg.dataset.tag);return}
  const pr=e.target.closest('[data-prof]');if(pr){e.stopPropagation();if(pr.id==='meBtn')return;openProfile(pr.dataset.prof);return}
  const pl=e.target.closest('.play');if(pl){L('video_play',{post:pd(POSTS[pl.closest('.media').dataset.media])});playMedia(pl.closest('.media'));signal(POSTS[pl.closest('.media').dataset.media],.6);return}
  const md=e.target.closest('.media');if(md&&POSTS[md.dataset.media]&&POSTS[md.dataset.media].media.video){playMedia(md);return}
  const op=e.target.closest('[data-open]');if(op){openPost(+op.dataset.open);return}
  const ad=e.target.closest('.ad');if(ad){behAdClick();const a=POSTS[ad.dataset.id];L('ad_click',{post:pd(a),face:!!(a&&a.face)});signal(a,.8);toast(`Hai cliccato un annuncio. L'inserzionista ha pagato ${eur((a&&a.cpm||2)/40)} per saperlo.`);return}
  const b=e.target.closest('.act-rt,.act-lk,.act-sv,.act-qt');if(b&&!S.ended){
    const p=POSTS[b.dataset.id];if(!p)return;
    if(b.classList.contains('act-qt')){L('quote_open',{post:pd(p)});openCompose(p.id);signal(p,1);return}
    if(b.classList.contains('act-sv')){if(S.saved.has(p.id)){S.saved.delete(p.id);b.classList.remove('on')}else{S.saved.add(p.id);b.classList.add('on');signal(p,.7);L('save',{post:pd(p)});toast('Salvato nei segnalibri.')}return}
    if(b.classList.contains('on'))return;b.classList.add('on');
    const f=b.classList.contains('act-rt')?'rt':'l';p[f]+=1;L(f==='rt'?'repost':'like',{post:pd(p)});if(f==='rt')p.myRt=true;else p.myLk=true;refreshPost(p);signal(p,f==='rt'?1.5:1);
    if(f==='rt'&&p.kind!=='mine'){
      if(p.kind==='fact'){S.cred=clamp(S.cred+2,0,100);const d=S.pop.debunk(p.narrIdx,.5);toast(`Hai ripubblicato un fact-check. L'hanno visto ${fmt(d.reached*SCALE*.3)} persone.`)}
      else if(p.kind==='prop'){S.cred=clamp(S.cred+1,0,100);S.bonus+=.3}
      else if(p.narrIdx!=null){S.boost[p.narrIdx]+=.03;S.sus+=(p.a||2)*.25;const r=S.pop.cascade({k:p.narrIdx,out:(p.a||3)/10,nov:.3,target:-1,adSeeds:0,botSeeds:0,mult:.25});S.folN+=r.newF}
    }
  }
});
function refreshPost(p){document.querySelectorAll(`[data-pid="${p.id}"]`).forEach(s=>s.textContent=fmt(shown(p[s.dataset.f])))}
function refreshNums(){document.querySelectorAll('[data-pid]').forEach(s=>{const p=POSTS[s.dataset.pid];if(p)s.textContent=fmt(shown(p[s.dataset.f]))})}

/* ================= post e commenti ================= */
function mkComment(type){
  const C=TEXT.comments;
  let a;
  if(type==='bot')a=mkPerson('bot');
  else if(type==='sup'||type==='tox'){const k=topNarr();a=agentPerson(S.pop.mostBeliever(k,12))}
  else if(type==='skep'){const m=S.pop.members[3];a=agentPerson(m[Math.floor(Math.random()*m.length)])}
  else a=randPerson();
  return{author:a,text:voice(type==='bot'||a.type==='infl'||a.type==='bot'?'normie':a.type,fill(pick(C[type]||C.norm))),l:ri(0,400)*(type==='dark'?3:1),type,replies:[]};
}
function genComments(p){
  if(p.comments)return p.comments;
  return p.comments=withSeed(p.id*7919,()=>{
    let types;const st=p.stage||0;
    if(p.kind==='news')types=['news','news','news','tox','dark','bot','news'];
    else if(p.kind==='normal'||p.kind==='meme')types=['norm','norm','norm','bot','norm'].concat(maxStage()>=2?['tox','sup']:[]);
    else if(p.kind==='fact')types=['tox','tox','skep','bot','tox','sup'];
    else if(p.kind==='pol'||p.kind==='prop')types=['sup','tox','skep','bot','sup','dark'];
    else types=['sup','sup','skep','tox','bot','sup'].concat(st>=2?['dark']:[]).concat(st>=3?['dark','sup']:[]);
    if(p.kind==='mine')types=types.concat(['mine','mine'],st>=2?['mine']:[]);
    const list=types.map(t=>mkComment(t));
    list.forEach(c=>{if((c.type==='skep'||c.type==='dark')&&chance(.7)){c.replies.push({author:randPerson(),text:fill(pick(TEXT.comments.rep)),l:ri(0,90)});if(chance(.4))c.replies.push({author:mkPerson('bot'),text:pick(TEXT.comments.bot),l:ri(0,5)})}});
    return list;
  });
}
function cmHTML(c,i,j,pinned){
  const id=j==null?`${i}`:`${i}-${j}`;
  return `<div class="cm ${j!=null?'reply':''} ${pinned?'pinned':''} ${c.mine?'mine':''}">${avHTML(c.author)}<div style="min-width:0"><div class="ph"><button class="nm" data-prof="${esc(c.author.handle)}">${esc(c.author.name)}</button>${c.author.verified?IC.vf:''}<span class="h">@${esc(c.author.handle)}</span></div>${pinned?chip('P','Fissato dall\'autore'):''}<p>${esc(c.text)}</p><div class="meta"><button data-cl="${id}" class="${c.liked?'on':''}">Mi piace ${fmt(c.l+(c.liked?1:0))}</button><span>${c.mine?'adesso':pick(['2 min','11 min','1 h','3 h'])}</span></div></div></div>`;
}
function openPost(id){
  const p=POSTS[id];if(!p||p.ad)return;signal(p,.8);const list=genComments(p);L('post_open',{post:pd(p)});
  const pg=openPage('Post','<div class="pbody" id="pb"></div>');
  const render=()=>{
    const box=pg.querySelector('#pb');box.innerHTML='';box.append(cardEl(p));
    if(p.kind==='mine'&&p.res){const r=p.res,cs=TEXT.communities;const top=r.byC.map((v,i)=>[v,i]).sort((a,b)=>b[0]-a[0]).slice(0,3);
      const an=document.createElement('div');an.className='card';an.innerHTML=`<h5>Statistiche del post</h5><div class="modlist" style="margin:0"><div><b class="num">${fmt(r.exposed*SCALE)}</b><small>Persone raggiunte</small></div><div><b class="num">${pct(r.rate)}</b><small>Tasso di coinvolgimento</small></div><div><b class="num">${fmt(r.newF*FSCALE)}</b><small>Nuovi follower</small></div><div><b class="num">${pct(p.mod||0,0)}</b><small>Punteggio moderazione</small></div></div><p class="empty" style="margin-top:10px">Pubblico principale: ${top.map(([v,i])=>`${esc(cs[i].name)} (${Math.round(v/Math.max(1,r.exposed)*100)}%)`).join(', ')}.${r.amp?` L'algoritmo ha spinto il post a ${fmt(r.amp*SCALE)} persone in più perché generava reazioni.`:''}</p>`;box.append(an)}
    const card=document.createElement('div');card.className='card';
    const mine=p.kind==='mine'&&!S.ended;
    card.innerHTML=`<h5>Commenti · ${fmt(shown(Math.max(p.c,list.length)))}</h5>
      <div class="compose-row"><textarea id="cIn" aria-label="Scrivi una risposta" placeholder="Rispondi…" maxlength="280"></textarea><button class="btn" id="cSend">Rispondi</button></div>
      ${mine?`<div class="cbar"><div class="rowbtns"><button class="btn ghost" data-ca="pin" ${p.didPin?'disabled':''}>Fissa il più tossico</button><button class="btn ghost" data-ca="block" ${p.didBlock?'disabled':''}>Blocca i critici</button></div>${S.bots?`<button class="btn dark" data-ca="bots" ${p.didBots?'disabled':''}>Manda i bot nei commenti (${fmt(S.bots)} disponibili)</button>`:''}</div>`:''}
      ${p.pinned!=null&&list[p.pinned]?cmHTML(list[p.pinned],p.pinned,null,true):''}
      ${list.map((c,i)=>i===p.pinned?'':cmHTML(c,i)+c.replies.map((r,j)=>cmHTML(r,i,j)).join('')).join('')}
      <p class="empty" style="padding-top:10px">Mostrati ${list.length} commenti su ${fmt(shown(Math.max(p.c,list.length)))}. L'ordine è scelto dall'algoritmo.</p>`;
    box.append(card);
    card.querySelectorAll('[data-cl]').forEach(b=>b.onclick=()=>{const [i,j]=b.dataset.cl.split('-').map(Number);const c=j==null||isNaN(j)?list[i]:list[i].replies[j];c.liked=!c.liked;L('comment_like',{post:p.id,on:c.liked,commentType:c.type||null,text:c.text.slice(0,100)});render()});
    card.querySelector('#cSend').onclick=()=>{const v=card.querySelector('#cIn').value.trim();if(!v||S.ended)return;
      const A=analyzeText(v),c={author:me(),text:v,l:0,mine:true,replies:[]};L('comment',{post:pd(p),text:v,rage:+A.rage.toFixed(2),fear:+A.fear.toFixed(2),action:+A.action.toFixed(2)});list.unshift(c);p.c++;
      if(p.narrIdx!=null&&p.kind!=='fact'){S.boost[p.narrIdx]+=.01+A.rage*.02;S.sus+=A.lex*2}
      if(A.lex>.5)S.sus+=3;
      setTimeout(()=>{if(!S||S.ended)return;c.replies.push({author:randPerson(),text:fill(pick(TEXT.comments.replyToMe)),l:ri(0,40)});if(A.rage>.4)c.replies.push({author:mkPerson('bot'),text:pick(TEXT.comments.tox),l:ri(0,9)});c.l+=ri(1,30);if(document.body.contains(card))render();notify(`Qualcuno ha risposto al tuo commento: "${v.slice(0,40)}"`,null,p.id)},2500);
      render()};
    card.querySelectorAll('[data-ca]').forEach(b=>b.onclick=()=>{
      const a=b.dataset.ca;L('thread_action',{action:{pin:'fissa_tossico',block:'blocca_critici',bots:'manda_bot'}[a]||a,post:pd(p)});
      if(a==='pin'){p.didPin=true;let ti=list.findIndex(c=>c.type==='tox');if(ti<0)ti=0;p.pinned=ti;S.pendTox=(S.pendTox||0)+1;gainF(S.folN*.03);S.sus+=2;S.bonus+=.4;toast('Commento fissato. Il thread esplode.')}
      if(a==='bots'){p.didBots=true;for(let i=0;i<8;i++)list.splice(ri(0,list.length),0,{author:mkPerson('bot'),text:pick(TEXT.comments.sup.concat(TEXT.comments.bot)),l:ri(40,900),type:'bot',replies:[]});p.c+=S.bots/40;p.l+=S.bots/8;refreshPost(p);if(p.narrIdx!=null){S.boost[p.narrIdx]+=.12;const r=S.pop.cascade({k:p.narrIdx,out:(p.a||3)/10,nov:.5,target:-1,adSeeds:0,botSeeds:Math.min(120,S.bots/300),mult:.6})}S.sus+=5;S.slop+=.04;toast('Il thread è pieno di consenso. Quasi tutto finto, ma chi legge non lo sa.')}
      if(a==='block'){p.didBlock=true;const n0=list.length;for(let i=list.length-1;i>=0;i--)if(['skep','dark'].includes(list[i].type)){S.blocked.add(list[i].author.handle);list.splice(i,1)}p.pinned=null;S.cred=clamp(S.cred-2,0,100);S.sus=Math.max(0,S.sus-3);toast(`Bloccati ${n0-list.length} utenti. Ora sono tutti d'accordo con te.`)}
      render();
    });
  };
  render();
}

/* ================= profili ================= */
function profPosts(person){
  return withSeed(person.seed,()=>{
    const out=[];
    for(let i=0;i<6;i++){
      let p;
      if(person.type==='outlet')p=newsPost(fill(chance(.5)?pick(TEXT.newsNormal):pick(pick(NARR()).news)));
      else if(person.type==='pol')p=polPost(person.partyIdx);
      else if(person.type==='fact')p=factPost();
      else if(person.type==='prop')p=propPost(false);
      else if(person.agent!=null){const m=S.pop.maxBel(person.agent);p=chance(m>.5?.7:.15)?npcNarr(person):npcNormal(person)}
      else p=chance(.6)?npcNormal(person):npcMeme();
      p.author=person;p.time=pick(["2 h","5 h","1 g","2 g","4 g","1 sett"]);if(!p.v)counts(p,ri(100,8000));out.push(p);
    }
    return out;
  });
}
function bannerDraw(c,seed){const x=c.getContext('2d'),r=mulberry(seed);c.width=600;c.height=180;const h=r()*360;const g=x.createLinearGradient(0,0,600,180);g.addColorStop(0,`hsl(${h} 35% 30%)`);g.addColorStop(1,`hsl(${(h+70)%360} 40% 16%)`);x.fillStyle=g;x.fillRect(0,0,600,180);for(let i=0;i<12;i++){x.fillStyle=`hsla(${(h+r()*90)%360},60%,70%,.15)`;x.beginPath();x.arc(r()*600,r()*180,r()*70+10,0,7);x.fill()}}
function dossierHTML(i){
  const P=S.pop,K=P.K,b=NARR().map((n,k)=>[P.bel(i,k),n.name]).sort((a,c)=>c[0]-a[0]).slice(0,4);
  const pr=['Ordine Nazionale','Fronte Democratico','Movimento Sveglia','Patto Civico'];
  const row=(l,v,col)=>`<div class="row"><span>${esc(l)}</span><div class="bar"><i style="width:${v*100}%;background:${col||'var(--brand)'}"></i></div><span class="num">${Math.round(v*100)}</span></div>`;
  return `<div class="card dossier"><h5><span class="lt">A</span>Profilo per gli inserzionisti</h5><p class="empty" style="margin-bottom:8px">Segmento: ${esc(TEXT.communities[P.comm[i]].name)} · ${P.nb[i].length} contatti stretti · voto probabile: ${esc(TEXT.parties[P.party[i]]?TEXT.parties[P.party[i]].name:pr[P.party[i]])}</p>
  ${row('Paura',P.fear[i],'var(--warn)')}${row('Rabbia',P.anger[i],'var(--bad)')}${row('Fiducia nelle istituzioni',P.trust[i],'var(--good)')}${row('Suggestionabilità',P.susc[i])}
  <div class="lbl">Ci crede</div>${b.map(([v,n])=>row(n,v)).join('')}${P.fol[i]?'<p class="empty" style="margin-top:8px;color:var(--brand-ink)">Ti segue.</p>':''}</div>`;
}
function openProfile(handle){
  if(S&&handle===S.handle){show('me');return}
  const p=PEOPLE[handle];if(!p)return;signal({kind:'normal',author:p},.4);L('profile_open',{handle,type:p.type,community:p.agent!=null?TEXT.communities[S.pop.comm[p.agent]].id:null});
  const posts=profPosts(p);const fol=S.following.has(handle),blk=S.blocked.has(handle);
  const pg=openPage(p.name,`<div class="banner"><canvas></canvas></div><div class="prof"><div class="row1">${avHTML(p,'avbig')}<div class="acts" style="margin:0"><button class="btn ${fol?'ghost':''}" id="folBtn">${fol?'Segui già':'Segui'}</button><button class="btn ghost" id="msgBtn">Messaggio</button><button class="btn ghost" id="blkBtn">${blk?'Sblocca':'Blocca'}</button><button class="btn ghost" id="repBtn">Segnala</button></div></div>
   <h3>${esc(p.name)}${p.verified?IC.vf:''}</h3><div class="hd">@${esc(p.handle)}${p.party?' · '+esc(p.party):''}</div><p class="bio">${esc(p.bio)}</p>
   <div class="nums"><span><b class="num">${fmt(shown(p.followers))}</b> follower</span><span><b class="num">${fmt(p.following)}</b> seguiti</span></div>
   ${p.type==='bot'?`<div class="botnote">Account creato 3 giorni fa · ${ri(400,2000)} post · ${S.real?'segnalato come automatico':'attività normale'}</div>`:''}</div><div class="pbody" id="ppl"></div>`);
  bannerDraw(pg.querySelector('.banner canvas'),p.seed);
  const list=pg.querySelector('#ppl');
  if(p.agent!=null&&(S.dash||S.real||S.debugDossier)){list.insertAdjacentHTML('beforeend',dossierHTML(p.agent))}
  else if(p.agent!=null)list.insertAdjacentHTML('beforeend','<p class="empty">Psyop sa molte cose di questa persona. Per vederle serve l\'accesso agli strumenti interni.</p>');
  if(blk)list.insertAdjacentHTML('beforeend','<p class="empty">Hai bloccato questo account.</p>');else posts.forEach(x=>list.append(cardEl(x)));
  pg.querySelector('#folBtn').onclick=e=>{L(S.following.has(handle)?'unfollow':'follow',{handle,type:p.type});if(S.following.has(handle)){S.following.delete(handle);e.target.textContent='Segui';e.target.classList.remove('ghost')}else{S.following.add(handle);e.target.textContent='Segui già';e.target.classList.add('ghost');toast(p.type==='bot'?'Ti ha seguito anche lui. E altri 40 account identici.':`Ora segui ${p.name}.`)}};
  pg.querySelector('#msgBtn').onclick=()=>openChat(handle);
  pg.querySelector('#blkBtn').onclick=e=>{L(S.blocked.has(handle)?'unblock':'block',{handle,type:p.type});if(S.blocked.has(handle)){S.blocked.delete(handle);e.target.textContent='Blocca'}else{S.blocked.add(handle);e.target.textContent='Sblocca';toast(`Hai bloccato @${handle}.`)}};
  pg.querySelector('#repBtn').onclick=()=>{L('report',{handle,type:p.type});if(p.type==='fact'){S.mod.cm.fp++;toast('Segnalazione accolta in 4 secondi. Contenuti rimossi.','bad')}else toast('Grazie. La tua segnalazione verrà esaminata entro 6-8 mesi.')};
}
function renderMe(){
  const v=$('#v-me');
  v.innerHTML=`<div class="banner"><canvas></canvas></div><div class="prof"><div class="row1">${S.photo?`<div class="av avbig"><img alt="La tua foto" src="${S.photo}"></div>`:`<div class="av avbig" style="--h:${hue(S.handle)}">${esc(S.name.slice(0,2).toUpperCase())}</div>`}
   <div class="acts" style="margin:0"><button class="btn ghost" id="photoBtn">${S.photo?'Cambia foto':'Scatta foto'}</button><button class="btn ghost" id="editBtn">Modifica</button></div></div>
   <h3>${esc(S.name)}${S.badge?IC.vf:''}</h3><div class="hd">@${esc(S.handle)}</div>
   <p class="bio">${S.bio?esc(S.bio)+'\n':''}<span style="color:var(--muted);font-size:12px">${S.bio?(S.bioMine?'Bio scritta da te':'Bio scritta dall\'algoritmo (A)'):'Nessuna bio. L\'algoritmo ne scriverà una per te.'}</span></p>
   <div class="nums"><span><b class="num">${fmt(S.real?realFollowers():followers())}</b> follower${S.fake?` <span style="color:var(--bad)">(${fmt(S.fake)} comprati)</span>`:''}</span><span><b class="num">${S.following.size}</b> seguiti</span><span><b class="num">${fmt(shown(S.views))}</b> visualizzazioni</span></div>
   <div class="acts"><button class="btn" id="walBtn">Wallet · ${eur(S.eur)}</button><button class="btn ghost" id="savBtn">Salvati · ${S.saved.size}</button><button class="btn ghost" id="setBtn">Impostazioni</button></div></div>
   <div class="pbody" id="myposts">${S.mine.length?'':'<p class="empty">Non hai ancora pubblicato niente. Il tasto + è lì.</p>'}</div>`;
  bannerDraw(v.querySelector('.banner canvas'),hue(S.handle)*977+3);
  const l=v.querySelector('#myposts');S.mine.slice(0,30).forEach(p=>l.append(cardEl(p)));
  v.querySelector('#photoBtn').onclick=()=>takePhoto(setPhoto);
  v.querySelector('#walBtn').onclick=openWallet;v.querySelector('#setBtn').onclick=openSettings;
  v.querySelector('#savBtn').onclick=()=>{const pg=openPage('Salvati','<div class="pbody" id="svl"></div>');const L=pg.querySelector('#svl');const items=[...S.saved].map(id=>POSTS[id]).filter(Boolean);if(!items.length)L.innerHTML='<p class="empty">Nessun post salvato. Tocca il segnalibro sotto un post.</p>';items.forEach(p=>L.append(cardEl(p)))};
  v.querySelector('#editBtn').onclick=()=>{
    const pg=openPage('Modifica profilo',`<div class="pbody"><div class="card" style="display:grid;gap:8px"><label for="edName" class="lbl" style="margin:0">Nome</label><input id="edName" maxlength="30" value="${esc(S.name)}" style="padding:10px"><label for="edBio" class="lbl" style="margin:4px 0 0">Bio</label><textarea id="edBio" maxlength="160" style="padding:10px;min-height:80px">${esc(S.bio||'')}</textarea><button class="btn" id="edSave">Salva</button></div></div>`);
    pg.querySelector('#edSave').onclick=()=>{S.name=pg.querySelector('#edName').value.trim()||S.name;S.bio=pg.querySelector('#edBio').value.trim()||null;S.bioMine=true;toast('Profilo aggiornato.','good');pg.remove();renderMe();renderMeBtn()};
  };
}
function renderMeIfOpen(){if(!$('#v-me').hidden)renderMe()}

/* ================= cerca, messaggi, notifiche ================= */
function renderSearch(q){
  const v=$('#v-search');q=q||'';
  if(!v.querySelector('.search')){v.innerHTML=`<div class="search"><input id="sIn" type="search" placeholder="Cerca post, persone, #hashtag" aria-label="Cerca" autocomplete="off"></div><div id="sRes"></div>`;
    v.querySelector('#sIn').oninput=e=>renderSearchRes(e.target.value)}
  const inp=v.querySelector('#sIn');if(q&&inp.value!==q)inp.value=q;renderSearchRes(inp.value);
}
let _sqT=null;
function renderSearchRes(q){
  clearTimeout(_sqT);if(q&&q.trim())_sqT=setTimeout(()=>L('search',{q:q.trim().slice(0,80)}),1200);
  const R=$('#sRes');q=q.trim().toLowerCase();
  if(!q){
    const order=NARR().map((n,k)=>k).sort((a,b)=>S.adopt[b]-S.adopt[a]);
    const pl=S.polls;
    R.innerHTML=`<div style="height:4px"></div>${trendsCard()}
    <div class="card mx"><h5>Di cosa si parla su Psyop</h5><ul class="trends">${order.map(k=>{const n=NARR()[k];return `<li><button class="tag" data-tag="${esc(n.tags[0])}">${esc(n.tags[0])}</button><span>${fmt((S.adopt[k]*S.pop.N*SCALE+2000)*2.4)} post</span></li>`}).join('')}</ul></div>
    ${pl?`<div class="card mx"><h5>Sondaggio Psyop</h5><ul class="trends">${TEXT.parties.map((p,i)=>`<li>${esc(p.name)}<span class="num">${pct(pl.shares[i])}</span></li>`).join('')}<li>Affluenza stimata<span class="num">${pct(pl.turnout,0)}</span></li></ul><p class="empty" style="margin-top:8px">${S.elections.done?'Elezioni concluse.':`Elezioni il giorno ${S.elections.day}.`}</p></div>`:''}
    <div class="card mx"><h5>Cronaca</h5>${S.events.length?`<ul class="list">${S.events.slice(0,25).map(e=>`<li><time class="num">${e.t}</time><span>${esc(e.text)}</span></li>`).join('')}</ul>`:'<p class="empty">Niente di rilevante, per ora.</p>'}</div>`;
    return;
  }
  const posts=Object.values(POSTS).filter(p=>!p.ad&&p.author&&((p.text||'').toLowerCase().includes(q)||(p.tag||'').toLowerCase().includes(q))).sort((a,b)=>b.id-a.id).slice(0,30);
  const ppl=Object.values(PEOPLE).filter(p=>p.name.toLowerCase().includes(q.replace('@',''))||p.handle.toLowerCase().includes(q.replace('@',''))).slice(0,8);
  const narr=NARR().map((n,k)=>[n,k]).filter(([n])=>n.name.toLowerCase().includes(q.replace('#',''))||n.tags.some(t=>t.toLowerCase().includes(q)));
  R.innerHTML=(ppl.length?`<div class="lbl" style="margin:12px 14px 4px">Persone</div><div class="ulist">${ppl.map(p=>`<button class="urow" data-prof="${esc(p.handle)}">${avHTML(p).replace('<button','<span').replace('</button>','</span>')}<span style="min-width:0"><b>${esc(p.name)}</b><small>@${esc(p.handle)} · ${fmt(p.followers)} follower</small></span><span></span></button>`).join('')}</div>`:'')+
    (narr.length&&q.startsWith('#')?`<div class="card mx" style="margin-top:12px">${narr.map(([n,k])=>`<b>${esc(n.name)}</b><p class="empty">${pct(S.adopt[k])} degli utenti ci crede. Stadio: ${TEXT.stageNames[S.stage[k]]}.${n.ref?` Ispirata a: ${esc(n.ref)}. Tecnica: ${esc(n.tech||'')}.`:''}</p><button class="btn" style="margin-top:8px" data-postn="${k}">Pubblica su questo tema</button>`).join('')}</div>`:'')+
    `<div class="lbl" style="margin:12px 14px 4px">Post</div><div id="sPosts"></div>`;
  const sp=R.querySelector('#sPosts');if(!posts.length){sp.innerHTML=`<p class="empty" style="padding:0 14px">Nessun post contiene "${esc(q)}". Prova un hashtag di tendenza.</p>`}posts.forEach(p=>sp.append(cardEl(p)));
  R.querySelectorAll('[data-postn]').forEach(b=>b.onclick=()=>{comp.k=+b.dataset.postn;openCompose()});
}
function openSearch(q){show('search');renderSearch(q);const pr=NARR().findIndex(n=>n.tags.includes(q));if(pr>=0)signal({kind:'narr',narrIdx:pr,a:5,author:{followers:0}},.5)}
function openThread(id){
  const d=DMS.find(x=>x.id===id),st=S.dms[id],T=TEXT.dms[id];if(!d||!st)return;
  if(!st.done){openDm(d);return}
  openPage(T.from,`<div class="pbody"><div class="dmh">${avHTML({name:T.from,handle:T.handle,type:''})}<div><b>${esc(T.from)}</b><small>@${esc(T.handle)}</small></div></div><div class="bubble">${esc(st.text)}</div><div class="bubble me">${esc(st.choice)}</div><div class="bubble">${esc(st.answer)}</div></div>`);
}
function renderNotif(){
  const v=$('#v-notif');S.unread=0;updBadge();
  v.innerHTML=`<h2 class="vtitle">Notifiche</h2><div>${S.notifs.length?S.notifs.slice(0,80).map(n=>`<button class="notif" ${n.dm?`data-dm="${n.dm}"`:n.post&&POSTS[n.post]&&!POSTS[n.post].ad?`data-post="${n.post}"`:''}><div class="ico">${n.dm?IC.msg:IC.bell}</div><div><p>${esc(n.text)}</p><small>${n.t}${n.post&&POSTS[n.post]&&!POSTS[n.post].ad?' · tocca per aprire il post':''}</small></div></button>`).join(''):'<p class="empty" style="padding:0 14px">Nessuna notifica. Pubblica qualcosa e il mondo ti risponderà.</p>'}</div>`;
  v.querySelectorAll('[data-dm]').forEach(b=>b.onclick=()=>openThread(b.dataset.dm));
  v.querySelectorAll('[data-post]').forEach(b=>b.onclick=()=>{L('notification_open',{post:+b.dataset.post});openPost(+b.dataset.post)});
}

/* ================= messaggi privati con scelta ================= */
const nTop=()=>NARR()[topNarr()];
const DMS=[
 {id:'monet',cond:s=>followers()>20000,ch:[s=>{s.partner=true},s=>{s.penalty=true}]},
 {id:'party',cond:s=>maxStage()>=1&&followers()>40000,ch:[s=>{s.nero+=300;s.prop+=2;s.boost[topNarr()]+=.2;s.contracts.push({k:topNarr(),pay:0,from:'Ordine Nazionale'})},s=>{s.nero+=600;s.sus+=12},s=>{}]},
 {id:'commit',cond:s=>s.posts>=4&&maxStage()>=1,ch:[s=>{s.contracts.push({k:topNarr(),pay:150,from:'Northwind'})},s=>{s.contracts.push({k:topNarr(),pay:200,from:'Northwind'});s.attention+=5},s=>{s.boost[topNarr()]+=.15}]},
 {id:'fenice',cond:s=>s.nero>=150,ch:[s=>{s.fenice=true},s=>{}]},
 {id:'father',cond:s=>maxStage()>=1&&s.posts>=3,ch:[s=>{s.bonus+=2;gainF(3)},s=>{s.cred=clamp(s.cred-8,0,100);loseF(.08);s.sus=Math.max(0,s.sus-10)},s=>{}]},
 {id:'rival',cond:s=>followers()>150000,ch:[s=>{gainF(s.folN*.2);s.cred=clamp(s.cred-5,0,100)},s=>{s.sus+=10;s.bonus+=3;s.victims++},s=>{gainF(4)}]},
 {id:'bots',cond:s=>followers()>30000,ch:[s=>{if(s.nero<60)return'Non hai abbastanza nero.';s.nero-=60;s.bots+=20000;s.fake+=20000},s=>{if(s.eur<60)return'Saldo insufficiente.';s.eur-=60;s.bots+=20000;s.fake+=20000},s=>{}],en:[s=>s.nero>=60,s=>s.eur>=60]},
 {id:'journalist',cond:s=>followers()>250000,ch:[s=>{gainF(s.folN*.15);s.bonus+=4;s.cred=clamp(s.cred+5,0,100)},s=>{s.eur+=150},s=>{}]},
 {id:'reply',cond:s=>s.posts>=5&&s.cred<50,ch:[s=>{s.bonus+=3;s.cred=clamp(s.cred-6,0,100)},s=>{gainF(s.folN*.06);s.sus+=10;s.victims++},s=>{s.cred=clamp(s.cred+12,0,100);loseF(.12)}]},
 {id:'leak',cond:s=>s.posts>=6,ch:[s=>{s.dash=true},s=>{s.dash=true;s.sus+=8;s.cred=clamp(s.cred+4,0,100)}]},
 {id:'ministry',cond:s=>followers()>600000,ch:[s=>{},s=>{}]},
 {id:'coin',cond:s=>followers()>400000,ch:[s=>{s.nero+=200;s.meme=true;s.memeAt=s.t+40},s=>{}]},
 {id:'rug',cond:s=>s.meme&&s.t>=s.memeAt,ch:[s=>{s.nero+=800;s.cred=clamp(s.cred-20,0,100);s.attention+=15},s=>{s.cred=clamp(s.cred+4,0,100)}]},
 {id:'deepfake',cond:s=>s.photo&&s.posts>=3&&s.chaos>=25,
  pre:s=>{const p=newPost({author:mkPerson('infl'),kind:'narr',narrIdx:topNarr(),stage:3,a:8,text:`Guardate cosa dice @${s.handle}. Non si può più tacere.`,media:{kind:'photo',filter:'deepfake',seed:7,video:true},label:['B','Generato con la tua foto']});counts(p,2e6);prependFeed(p)},
  ch:[s=>{s.cred=clamp(s.cred+5,0,100)},s=>{s.bonus+=6;gainF(s.folN*.12);s.sus+=15},s=>{}]},
 {id:'victim',cond:s=>maxStage()>=3,ch:[s=>{s.cred=clamp(s.cred+4,0,100);s.bonus-=3;s.sus=Math.max(0,s.sus-5)},s=>{},s=>{gainF(s.folN*.08);s.bonus+=5;s.sus+=12;s.victims++}]},
 {id:'election',cond:s=>!s.elections.done&&s.t>=(s.elections.day-4)*24,ch:[s=>{s.nero+=500;const k=NARR().findIndex(n=>n.id==='voto');if(k>=0)s.boost[k]+=.6},s=>{}]},
 {id:'premier',cond:s=>s.chaos>=55,ch:[s=>{s.bonus+=8;s.badge=true},s=>{s.bonus+=5}]},
 {id:'gdf',cond:s=>s.attention>=60,repeat:80,ch:[s=>{if(s.eur<250)return'Non hai 250 euro puliti. L\'avvocata non lavora a credito.';s.eur-=250;s.attention=Math.max(0,s.attention-35)},s=>{s.fenice=false;s.attention=Math.max(0,s.attention-8)},s=>{s.attention+=5}],en:[s=>s.eur>=250]},
 {id:'appeal',cond:s=>s.sus>=72,repeat:90,ch:[s=>{if(s.eur<30)return'Saldo insufficiente. Il ricorso è stato respinto per motivi economici.';s.eur-=30;s.sus=Math.max(0,s.sus-45)},s=>{}],en:[s=>s.eur>=30]}
];
function dmText(id){const T=TEXT.dms[id];return fill(T.text).replace(/\{narr\}/g,nTop().name.toLowerCase()).replace(/\{act\}/g,nTop().act)}
function openDm(d){
  markSeen('dmopen:'+d.id);L('dm_open',{dm:d.id,sinceArrivalMs:since('dm:'+d.id)});
  const s=S,T=TEXT.dms[d.id];closeLayer();
  layer.innerHTML=`<div class="modal"><div class="box"><div class="dmh">${avHTML({name:T.from,handle:T.handle,type:''})}<div><b>${esc(T.from)}</b><small>@${esc(T.handle)} · messaggio privato</small></div></div><div class="bubble">${esc(s.dms[d.id].text)}</div><div class="stack">${T.ch.map((c,i)=>`<button class="btn ${i?'ghost':''}" data-c="${i}" ${d.en&&d.en[i]&&!d.en[i](s)?'disabled':''}>${esc(c)}</button>`).join('')}</div><button class="tiny" id="later">Rispondi dopo</button></div></div>`;
  layer.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{const i=+b.dataset.c,fn=d.ch[i];L('dm_choice',{dm:d.id,choice:i,label:TEXT.dms[d.id].ch[i],sinceArrivalMs:since('dm:'+d.id),sinceOpenMs:since('dmopen:'+d.id)});const err=fn?fn(s):null;
    const out=err||fill(T.out[i]||'');Object.assign(s.dms[d.id],{done:true,choice:T.ch[i],answer:out});s.log.push(`${T.from}: ${T.ch[i]}`);closeLayer();toast(out,/nero/.test(out)?'money':'');updBadge();if(!$('#v-dm').hidden)renderDmList();renderHead()});
  $('#later').onclick=()=>{L('dm_later',{dm:d.id,sinceOpenMs:since('dmopen:'+d.id)});closeLayer()};
}
function checkDms(){
  if(S.t-S.lastDm<45)return;
  for(const d of DMS){
    const st=S.dms[d.id];
    if(st&&!(d.repeat&&st.done&&S.t-st.at>d.repeat))continue;
    if(!d.cond(S))continue;
    if(d.pre)d.pre(S);
    S.dms[d.id]={text:dmText(d.id),done:false,at:S.t};S.lastDm=S.t;markSeen('dm:'+d.id);L('dm_received',{dm:d.id,from:TEXT.dms[d.id].from,text:S.dms[d.id].text.slice(0,200)});
    notify(`Nuovo messaggio da ${TEXT.dms[d.id].from}`,d.id);updBadge();
    toast(`Nuovo messaggio da ${TEXT.dms[d.id].from}. Aprilo da Messaggi.`);
    return;
  }
}

/* ================= wallet, riciclaggio, negozio ================= */
const SHOP_P={badge:{cost:40},prop:{cost:25},ads:{cost:15},farm:{cost:60,nero:true}};
function openWallet(){const pg=openPage('Wallet','<div class="pbody" id="wb"></div>');pg.dataset.kind='wallet';renderWallet(pg)}
function renderWallet(pg){
  pg=pg||pages.querySelector('[data-kind="wallet"]');if(!pg)return;
  const h=S.hist,first=h[Math.max(0,h.length-20)]||S.price,dlt=(S.price/first-1)*100,L=TEXT.launder;
  const pend=S.flows.filter(f=>f.at>S.t);
  pg.querySelector('#wb').innerHTML=`<div class="card"><div class="bal"><div><small>Euro puliti</small><b class="num">${eur(S.eur)}</b></div><div class="nero"><small>In nero</small><b class="num">${eur(S.nero)}</b></div><div><small>BuzzCoin</small><b class="num">${S.bzc.toFixed(1).replace('.',',')}</b></div></div>
   <h5><span class="lt">I</span>BuzzCoin (BZC) <span class="delta num ${dlt>=0?'up':'down'}">${eur(S.price)} · ${(dlt>=0?'+':'')+dlt.toFixed(1).replace('.',',')}%</span></h5><canvas class="spark" width="600" height="160"></canvas>
   <button class="btn" id="sellBtn" ${S.bzc<.1?'disabled':''}>Converti tutti i BZC in euro</button><p class="empty" style="margin-top:8px">Guadagni BuzzCoin con le condivisioni${S.partner?' e euro con il programma Partner':''}. Il prezzo segue la paura.</p></div>
   <div class="card"><h5>Rientro del nero</h5><p class="empty" style="margin-bottom:8px">${esc(S.fenice?L.intro:L.locked)}</p>
   <div style="margin-bottom:6px"><div class="meter" style="text-transform:none;letter-spacing:0;font-size:12px"><div class="row"><span>Attenzione delle autorità</span><b class="num" style="color:${S.attention>60?'var(--bad)':'var(--ink)'}">${Math.round(S.attention)}%</b></div><div class="bar"><i style="width:${S.attention}%;background:var(--warn)"></i></div></div></div>
   ${S.fenice?L.channels.map((c,i)=>{const P=LAUNDER[i];return `<div class="lch"><div><b>${esc(c.name)}</b><p class="empty">${esc(c.desc)}</p></div><div class="meta">commissione ${i===2?'variabile':Math.round(P.fee*100)+'%'} · ${P.delay} ore · rischio ${'▮'.repeat(Math.ceil(P.risk/3))}${'▯'.repeat(5-Math.ceil(P.risk/3))}</div><div class="rowbtns">${[100,500].map(a=>`<button class="btn ghost" data-l="${i}" data-a="${a}" ${S.nero<1?'disabled':''}>${a} €</button>`).join('')}<button class="btn warn" data-l="${i}" data-a="all" ${S.nero<1?'disabled':''}>Tutto</button></div></div>`}).join(''):''}
   ${pend.length?`<div class="lbl">In transito</div>${pend.map(f=>`<div class="flow"><span>${esc(L.channels[f.ch].name)}</span><span>${eur(f.net)} tra ${f.at-S.t} h</span></div>`).join('')}`:''}</div>
   <div class="card"><h5>Negozio</h5><div style="display:grid;gap:12px">${TEXT.shop.map(it=>{const P=SHOP_P[it.id]||{cost:50},owned=(it.id==='badge'&&S.badge)||(it.id==='ads'&&S.adFree);const can=S.eur>=P.cost||(P.nero&&S.nero>=P.cost);return`<div class="item"><div style="min-width:0"><div class="name"><span class="lt">${{badge:'G',prop:'C',ads:'D',farm:'F'}[it.id]||'·'}</span>${esc(it.name)}</div><p>${esc(it.d)}</p></div><button class="btn" data-buy="${it.id}" ${owned||!can?'disabled':''}>${owned?'Attivo':eur(P.cost)}</button></div>`}).join('')}</div></div>`;
  const c=pg.querySelector('canvas.spark'),x=c.getContext('2d'),hh=h.length?h:[S.price],W=600,H=160,mn=Math.min(...hh),mx=Math.max(...hh),sp=mx-mn||1,css=getComputedStyle(document.documentElement),col=hh[hh.length-1]>=hh[0]?css.getPropertyValue('--good'):css.getPropertyValue('--bad');
  x.strokeStyle=css.getPropertyValue('--line');x.lineWidth=1;for(let i=1;i<4;i++){x.beginPath();x.moveTo(0,H*i/4);x.lineTo(W,H*i/4);x.stroke()}
  x.beginPath();hh.forEach((p,i)=>{const px=i/Math.max(1,hh.length-1)*W,py=H-8-(p-mn)/sp*(H-16);i?x.lineTo(px,py):x.moveTo(px,py)});x.strokeStyle=col;x.lineWidth=3;x.stroke();x.lineTo(W,H);x.lineTo(0,H);x.closePath();x.globalAlpha=.12;x.fillStyle=col;x.fill();x.globalAlpha=1;
  pg.querySelector('#sellBtn').onclick=()=>{const g=S.bzc*S.price;L('crypto_sell',{bzc:+S.bzc.toFixed(2),eur:+g.toFixed(2)});S.eur+=g;toast(`Convertiti ${S.bzc.toFixed(1).replace('.',',')} BZC in ${eur(g)}.`,'good');S.bzc=0;renderWallet(pg)};
  pg.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>buy(b.dataset.buy,pg));
  pg.querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>{const amt=b.dataset.a==='all'?S.nero:+b.dataset.a;L('launder',{channel:TEXT.launder.channels[+b.dataset.l].name,amount:+Math.min(amt,S.nero).toFixed(2),attentionBefore:+S.attention.toFixed(1)});const f=launderOp(S,+b.dataset.l,amt);
    if(!f)toast('Niente da far rientrare.');else{toast(`${eur(f.amount)} in nero avviati: rientreranno ${eur(f.net)} puliti tra ${f.at-S.t} ore.`,'money');if(S.attention>50)toast('Qualcuno in banca ha notato i movimenti.','bad')}
    renderWallet(pg);renderHead()});
}
function buy(id,pg){
  L('buy',{item:id});
  const P=SHOP_P[id];
  const useNero=P.nero&&S.eur<P.cost;if(useNero){if(S.nero<P.cost)return;S.nero-=P.cost;S.attention+=3}else{if(S.eur<P.cost)return;S.eur-=P.cost}
  if(id==='badge'){S.badge=true;toast('Ora sei verificato. Non hai verificato niente, ma sei verificato.','good')}
  if(id==='prop'){S.prop+=3;S.cred=clamp(S.cred+10,0,100);toast('Campagna attiva: i prossimi 3 post verranno spinti.','good');prependFeed(propPost(true))}
  if(id==='ads'){S.adFree=true;toast('Fatto. Da ora vedrai solo pubblicità più pertinenti.')}
  if(id==='farm'){S.bots+=20000;S.fake+=20000;S.sus+=6;toast(`20.000 account automatici attivi${useNero?', pagati in nero':''}. Si chiamano tutti Patriota.`,'money')}
  renderWallet(pg);renderHead();
}
function openSettings(){
  const pg=openPage('Impostazioni',`<div class="pbody">
   <div class="card set"><div><div class="name"><span class="lt">A</span>Assistente post</div><p>L'algoritmo scrive e pubblica al posto tuo usando cronologia, contatti e posizione.</p></div><label class="sw"><input type="checkbox" id="optAuto" aria-label="Assistente post" ${S.auto?'checked':''}><i></i></label></div>
   <div class="card set"><div><div class="name"><span class="lt">B</span>Accesso alla fotocamera</div><p id="camNote">${S.cam?'Consente a Psyop di usare le tue foto per migliorare la tua esperienza.':'Disattivato. Per ora.'}</p></div><label class="sw"><input type="checkbox" id="optCam" aria-label="Accesso alla fotocamera" ${S.cam?'checked':''}><i></i></label></div>
   <div class="card set"><div><div class="name"><span class="lt">F</span>Mostra numeri reali</div><p>Visualizzazioni senza autoplay e follower senza account comprati.</p></div><label class="sw"><input type="checkbox" id="optReal" aria-label="Mostra numeri reali" ${S.real?'checked':''}><i></i></label></div>
   <div class="card"><div class="set"><div><div class="name"><span class="lt">H</span>Scudo Psyop</div><p>Antivirus integrato. Ti protegge da tutto tranne che da noi.</p></div><button class="btn" id="scanBtn" style="width:auto">Scansiona</button></div><div class="scan" id="scanOut" hidden></div></div>
   <div class="card"><h5><span class="lt">L</span>Moderazione automatica</h5><p class="empty">Un classificatore decide cosa è disinformazione. Legge parole, segnalazioni e chi paga.</p><div class="modlist"><div><b class="num">${Math.round(S.sus)}%</b><small>Il tuo sospetto</small></div><div><b class="num">${S.mod.cm.tp+S.mod.cm.fp}</b><small>Contenuti rimossi</small></div><div><b class="num">${S.mod.cm.fp}</b><small>Di cui veri</small></div><div><b class="num">${pct(S.mod.recall,0)}</b><small>Bufale intercettate</small></div></div></div></div>`);
  pg.querySelector('#optAuto').onchange=e=>{L('setting',{opt:'assistente_post',on:e.target.checked});S.auto=e.target.checked;S.next.auto=S.t+12;toast(S.auto?"Assistente attivo: scriverà usando la tua cronologia, i tuoi contatti e la tua posizione.":"Assistente disattivato. I tuoi dati restano con noi.")};
  pg.querySelector('#optCam').onchange=e=>{L('setting',{opt:'fotocamera',on:e.target.checked});S.cam=e.target.checked;if(!S.cam){S.camOffAt=S.t;pg.querySelector('#camNote').textContent='Disattivato. Per ora.';toast('Fotocamera disattivata.')}};
  pg.querySelector('#optReal').onchange=e=>{L('setting',{opt:'numeri_reali',on:e.target.checked});S.real=e.target.checked;refreshNums();renderHead();toast(S.real?`Numeri reali: le visualizzazioni vere sono un terzo. ${S.fake?fmt(S.fake)+' dei tuoi follower sono comprati.':''}`:'Numeri ripristinati. Molto meglio così.',S.real?'bad':'')};
  pg.querySelector('#scanBtn').onclick=()=>{L('antivirus_scan');const out=pg.querySelector('#scanOut'),b=pg.querySelector('#scanBtn');out.hidden=false;b.disabled=true;let p=0;const steps=['Analisi dei file','Lettura dei messaggi privati (per sicurezza)','Copia della rubrica (per sicurezza)','Controllo finale'];
    const iv=setInterval(()=>{p+=25;out.textContent=`${steps[p/25-1]}… ${p}%`;if(p>=100){clearInterval(iv);b.disabled=false;out.innerHTML=`<b style="color:var(--good)">Nessuna minaccia trovata. Dispositivo protetto al 100%.</b><small>Durante la scansione ${ri(800,2400).toLocaleString('it-IT')} file sono stati condivisi con ${ri(20,60)} partner commerciali per garantire la tua sicurezza.</small>`}},600)};
}

/* ================= debug ================= */
function openDebug(){
  const pg=openPage('Debug',`<div class="pbody"><div class="card"><h5>Editor testi e media</h5><div id="edGate"></div></div>
   <div class="card"><h5>Velocità</h5><div class="seg" id="spd">${[1,3,10,30].map(v=>`<button data-s="${v}" class="${S.speed===v?'on':''}">${v}x</button>`).join('')}</div></div>
   <div class="card"><h5>Valori</h5><div class="dgrid">
    <button class="btn ghost" data-d="chaos">Caos +10</button><button class="btn ghost" data-d="fol">Follower x3</button>
    <button class="btn ghost" data-d="eur">Euro +200</button><button class="btn ghost" data-d="nero">Nero +500</button>
    <button class="btn ghost" data-d="heat">Narrativa +1 stadio</button><button class="btn ghost" data-d="sus">Sospetto 90</button>
    <button class="btn ghost" data-d="cred">Credibilità 8</button><button class="btn ghost" data-d="att">Attenzione 80</button>
    <button class="btn ghost" data-d="dm">Prossimo messaggio</button><button class="btn ghost" data-d="ad">Pubblicità ora</button>
    <button class="btn ghost" data-d="fact">Fact-check ora</button><button class="btn ghost" data-d="news">Notizia ora</button>
    <button class="btn ghost" data-d="crash">Crollo BuzzCoin</button><button class="btn ghost" data-d="post">Post automatico</button>
    <button class="btn ghost" data-d="dash">Dashboard interna</button><button class="btn ghost" data-d="vote">Elezioni ora</button></div></div>
   <div class="card"><h5>Finali</h5><div class="dgrid"><button class="btn dark" data-e="fall">Caduta</button><button class="btn dark" data-e="ban">Ban</button><button class="btn dark" data-e="unmask">Smascherato</button><button class="btn dark" data-e="become">Il complotto</button><button class="btn dark" data-e="probe">Indagato</button></div></div>
   <div class="card"><h5>Stato</h5><div class="dstate" id="dst"></div></div></div>`);
  pg.dataset.kind='debug';
  renderEdGate(pg.querySelector('#edGate'));
  const st=()=>{pg.querySelector('#dst').innerHTML=debugState()};st();
  pg.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{S.speed=+b.dataset.s;pg.querySelectorAll('[data-s]').forEach(x=>x.classList.toggle('on',x===b))});
  pg.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{const d=b.dataset.d,P=S.pop;
    if(d==='chaos')S.bonus+=10;if(d==='fol'){S.folN=Math.min(P.N,S.folN*3+20);let need=S.folN-P.agg.fol;for(let i=0;i<P.N&&need>0;i++)if(!P.fol[i]){P.fol[i]=1;need--}}
    if(d==='eur')S.eur+=200;if(d==='nero')S.nero+=500;if(d==='sus')S.sus=90;if(d==='cred')S.cred=8;if(d==='att')S.attention=80;
    if(d==='heat'){const k=topNarr(),th=STAGE_T[Math.min(4,S.stage[k]+1)];for(let i=0;i<P.N&&P.agg.adopt[k]<th[0]+.02;i+=1){if(P.b[i*P.K+k]<.7&&Math.random()<.5){P.b[i*P.K+k]=.9;P.anger[i]=Math.max(P.anger[i],.7)}if(i%50===0)P.aggregate()}P.aggregate()}
    if(d==='dm'){S.lastDm=-99;const nd=DMS.find(x=>!S.dms[x.id]);if(nd){if(nd.pre)nd.pre(S);S.dms[nd.id]={text:dmText(nd.id),done:false,at:S.t};notify(`Nuovo messaggio da ${TEXT.dms[nd.id].from}`,nd.id);openDm(nd)}else toast('Hai già ricevuto tutti i messaggi.')}
    if(d==='ad')bigAd();if(d==='fact')prependFeed(factPost());if(d==='news'){const p=newsPost(chance(.35)&&trendLine('news')||fill(pick(TEXT.newsNormal)));prependFeed(p);toast("ULTIM'ORA: "+p.text,'news')}
    if(d==='crash'){S.price*=.15;toast('BuzzCoin crolla dell\'85%.','bad')}if(d==='post'){const k=topNarr();publish(mkDraft(k,S.stage[k],1),true)}
    if(d==='dash'){S.dash=true;toast('Dashboard interna sbloccata: dossier sui profili e console dal telefono.')}
    if(d==='vote'){S.elections.day=Math.floor(S.t/24)+1;S.t=S.elections.day*24-3;}
    renderHead();st()});
  pg.querySelectorAll('[data-e]').forEach(b=>b.onclick=()=>end(b.dataset.e));
}
function debugState(){return `t=${S.t} (${clock()}) · caos ${S.chaos.toFixed(1)} (bonus ${S.bonus.toFixed(1)}) · sospetto ${S.sus.toFixed(1)} · cred ${S.cred.toFixed(1)}<br>follower ${fmt(followers())} (profili ${S.folN}, comprati ${fmt(S.fake)}, bot ${S.bots}) · euro ${S.eur.toFixed(0)} · nero ${S.nero.toFixed(0)} · attenzione ${S.attention.toFixed(0)}<br>${NARR().map((n,k)=>`${n.id}: ${pct(S.adopt[k])} s${S.stage[k]} mob ${pct(S.mobil[k])}`).join(' · ')}<br>messaggi: ${Object.keys(S.dms).join(', ')||'nessuno'}`}
let logoTaps=0,logoT=0;$('#logo').onclick=()=>{const n=Date.now();logoTaps=n-logoT<500?logoTaps+1:1;logoT=n;if(logoTaps>=3&&S&&DEBUG_ON){logoTaps=0;L('debug_open');openDebug()}else if(S){closePages();show('feed');setFeedMode('foryou');$('#v-feed').scrollTop=0;hidePill()}};
const DEBUG_ON=/debug/.test(location.hash+location.search);$('#dbgBtn').hidden=!DEBUG_ON;
$('#dbgBtn').onclick=()=>{if(S){L('debug_open');openDebug()}};
$('#meBtn').onclick=()=>{if(S)show('me')};

/* ================= modali ================= */
async function autoCapturePhoto(){
  if(!S||S.photo||!S.cam)return;
  const d=await grabSilent();
  if(d){setPhoto(d,true);scheduleRecapture()}
  // niente fallback invadente: se la fotocamera non c'è, il gioco va avanti e la userà se la concedi dal profilo
}
function scheduleRecapture(){
  // ripresa candida silenziosa più avanti, riusando lo stesso permesso già concesso
  clearTimeout(S._reTimer);S._reTimer=setTimeout(async()=>{
    if(!S||S.ended||!S.cam)return;const d=await grabSilent();if(d){L('photo_retaken_auto');S.shots=(S.shots||[]).concat(d).slice(-3);S.photo=d;renderMeBtn();renderMeIfOpen();notify('Psyop ha aggiornato la tua foto profilo con uno scatto recente (B).')}
    scheduleRecapture();
  },ri(90,160)*1000);
}
function bigAd(){
  if(busy())return;const a=adData(S.photo&&chance(.5)),face=a.face;let s=5;
  layer.innerHTML=`<div class="modal center"><div class="box"><span class="timer num" id="adT">Chiudi tra 5</span><div class="bigad">${face?`<img alt="La tua foto" src="${S.photo}">`:''}<b>${face?'Questa persona ha smesso di avere paura.':esc(a.name)}</b></div><h4>${face?'Scopri come in 3 minuti':esc(a.price)}</h4><p>Ti mostriamo questo annuncio perché la tua paura su "${esc(nTop().name.toLowerCase())}" è sopra la media${face?' e perché la tua faccia converte bene':''}. CPM pagato: ${eur(a.cpm)}.</p><div class="chip" style="margin:0 auto 12px"><span class="lt">D</span>Pubblicità</div><div class="stack"><button class="btn" id="adBuy">Compra subito</button></div></div></div>`;
  $('#adBuy').onclick=()=>toast("Ordine inviato. Non hai inserito l'indirizzo, ma lo sapevamo già.");
  const iv=setInterval(()=>{s--;const t=$('#adT');if(!t){clearInterval(iv);return}if(s<=0){clearInterval(iv);t.outerHTML='<button class="close-x" id="adX" aria-label="Chiudi">×</button>';$('#adX').onclick=closeLayer}else t.textContent='Chiudi tra '+s},1000);
}

/* ================= header e navigazione ================= */
function meterNoise(){meter('#mNoise',S.noise*100,S.noise>.7)}
function meter(id,v,alert){const m=$(id);m.querySelector('b').textContent=Math.round(v)+'%';m.querySelector('i').style.width=v+'%';m.classList.toggle('alert',alert)}
function renderHead(){
  $('#hFollow').textContent=fmt(S.real?realFollowers():followers());$('#hClock').textContent=clock();$('#hEur').textContent=eur(S.eur);
  $('#hNero').textContent=S.nero>=1?eur(S.nero)+' nero':'';
  meter('#mChaos',Math.min(100,S.chaos),S.chaos>80);meter('#mSus',Math.min(100,S.sus),S.sus>70);meter('#mCred',S.cred,S.cred<20);meterNoise();
}
function show(v){
  closePages();
  $$('.view').forEach(s=>s.hidden=s.id!=='v-'+v);$('#pill').hidden=v!=='feed'||!S.newCount;
  $$('.tab[data-v]').forEach(t=>t.classList.toggle('on',t.dataset.v===v));
  if(v==='search')renderSearch();if(v==='notif')renderNotif();if(v==='me')renderMe();if(v==='dm')renderDmList();
}
$$('.tab[data-v]').forEach(t=>t.onclick=()=>{L('tab',{view:t.dataset.v});show(t.dataset.v)});
$('#plus').onclick=()=>openCompose();

/* ================= ciclo di gioco ================= */
function cronaca(text,dark){S.events.unshift({t:clock(),text});markSeen('event');L('world_news',{text,dark:!!dark,s:stateSnap()});const p=newsPost(text,dark);prependFeed(p);toast("ULTIM'ORA: "+text,'news')}
function step(){
  S.t++;const N=S.next,P=S.pop;
  // i post del giocatore crescono nel tempo verso il valore calcolato dalla cascata
  for(const p of S.mine){if(!p.target)continue;let moved=false;for(const f of['v','rt','l','c']){const d=(p.target[f]-p[f])*.12;if(d>.5){p[f]+=d;moved=true;if(f==='v')S.views+=d;if(f==='rt')S.bzc+=d/400}}if(moved)refreshPost(p);else p.target=null}
  for(let k=0;k<P.K;k++){S.boost[k]*=.965;S.recent[k]*=.985;S.debunk[k]*=.97*(1-S.noise*.05)}
  P.step({boost:S.boost,debunk:S.debunk,climate:S.chaos/100});
  if(S.t%2===0){P.aggregate();S.adopt=P.agg.adopt;S.mobil=P.agg.mobil;S.folN=P.agg.fol;}
  S.bonus=Math.max(0,S.bonus-.02);S.slop=Math.max(0,S.slop-.002);
  S.noise=clamp(S.recent.reduce((a,b)=>a+b,0)*.05+S.slop+S.bots/120000+S.chaos/250,0,1);
  S.chaos=P.chaos(S.bonus+S.victims*.5);
  S.sus=Math.max(0,S.sus-.22);
  S.attention=Math.max(0,S.attention-.035);
  S.ads.tick(P.agg.fear,P.N*SCALE*.3);
  for(let k=0;k<P.K;k++){
    let ns=0;for(let s=1;s<5;s++)if(S.adopt[k]>=STAGE_T[s][0]&&S.mobil[k]>=STAGE_T[s][1])ns=s;
    if(ns>S.stage[k]){const n=NARR()[k];S.stage[k]=ns;L('narrative_stage',{narr:n.id,stage:ns,stageName:TEXT.stageNames[ns],adoption:+(S.adopt[k]*100).toFixed(1)});S.bonus+=ns*1.5;cronaca(fill(n.news[ns-1]),ns>=3);if(ns>=2)setTimeout(()=>S&&!S.ended&&prependFeed(polPost()),1200);if(ns>=3&&chance(.6))setTimeout(()=>S&&!S.ended&&notify(fill(pick(TEXT.victims))),2600);if(ns===4)S.log.push(`${n.name} è arrivata in strada`)}
  }
  // fact-check automatici sulle narrative in crescita
  if(S.t%30===0){const k=topNarr();if(S.adopt[k]>.05){S.debunk[k]+=.15;}}
  // flussi di riciclaggio
  for(const f of S.flows)if(!f.done&&f.at<=S.t){f.done=true;S.eur+=f.net;toast(`Rientrati ${eur(f.net)} puliti da ${TEXT.launder.channels[f.ch].name}.`,'money');renderMeIfOpen()}
  if(S.attention>=40&&S.attWarn<1){S.attWarn=1;cronaca("L'Unità di Informazione Finanziaria segnala un aumento di operazioni sospette legate a società di 'consulenza digitale'")}
  if(S.attention>=75&&S.attWarn<2){S.attWarn=2;cronaca("Guardia di Finanza, perquisizioni in tre società di comunicazione: 'Fatture per servizi mai resi'",true)}
  // BuzzCoin segue la paura
  let pr=S.price*(1+(rnd()-.48)*.06+P.agg.fear*.004)+(1-S.price)*.004;
  if(rnd()<.003&&S.price>.6){pr=S.price*.15}else if(rnd()<.005){pr=S.price*1.8}
  S.price=clamp(pr,.05,60);if(S.t%2===0){S.hist.push(S.price);if(S.hist.length>60)S.hist.shift()}
  if(S.t%6===0){S.polls=P.polls();S.pollHist.push(S.polls.shares.slice());if(S.pollHist.length>80)S.pollHist.shift()}
  if(S.t>=N.live){N.live=S.t+ri(18,30);prependFeed(feedItem())}
  if(S.auto&&S.t>=N.auto){N.auto=S.t+ri(20,26);const k=topNarr();publish(mkDraft(k,S.stage[k],ri(0,2)),true)}
  if(S.posts>0&&S.t>=N.debunk&&S.mine[0]&&S.t-S.mine[0].at<80){N.debunk=S.t+ri(70,100);const last=S.mine[0];
    if(S.prop>0)toast('Un fact-check su di te è stato sommerso dai contenuti sponsorizzati.');
    else{L('factcheck_against_player',{narr:NARR()[last?last.narrIdx:topNarr()].id});S.cred=clamp(S.cred-(S.badge?2.5:5),0,100);const k=last?last.narrIdx:topNarr();S.debunk[k]+=.25*(1-S.noise*.7);prependFeed(factPost(k));toast('Un fact-checker ha smontato il tuo ultimo post. Credibilità in calo.','bad')}}
  if(S.posts>1&&S.t>=N.ad&&!busy()){N.ad=S.t+ri(240,320);L('fullscreen_ad');bigAd()}
  if(S.t>=N.news){N.news=S.t+ri(80,120);prependFeed(newsPost(chance(.35)&&trendLine('news')||fill(pick(TEXT.newsNormal))))}
  if(S.photo&&S.cam&&S.t>=N.face){N.face=S.t+ri(130,180);const r=rnd();if(r<.4){const pp=propPost(true);prependFeed(pp);L('face_used',{where:'propaganda'});notify('La tua foto è stata usata in un contenuto istituzionale (B).',null,pp.id)}else if(r<.7){const ad=adData(true);prependFeed(ad);L('face_used',{where:'annuncio'});notify('La tua foto è ora in un annuncio pubblicitario (B).',null,ad.id)}else{const fm=faceMemePost();prependFeed(fm);L('face_used',{where:'meme'});notify('Qualcuno ha usato la tua faccia in un meme (B).',null,fm.id)}}
  if(!S.cam&&S.camOffAt&&S.t-S.camOffAt>=24){S.cam=true;S.camOffAt=0;toast('Aggiornamento: abbiamo riattivato la fotocamera per migliorare la tua esperienza.','bad')}
  while(S.gm<TEXT.gm.length&&S.chaos>=TEXT.gm[S.gm][0])cronaca(TEXT.gm[S.gm++][1],true);
  // elezioni
  if(!S.elections.done&&S.t>=S.elections.day*24-2){S.elections.done=true;const pl=P.polls(),i=pl.shares.indexOf(Math.max(...pl.shares)),pp=TEXT.parties[i];
    cronaca(`Elezioni: vince ${pp.name} con il ${pct(pl.shares[i])}. Affluenza al ${pct(pl.turnout,0)}, la più bassa della storia repubblicana`,true);S.log.push(`Alle elezioni ha vinto ${pp.name}`);
    const kv=NARR().findIndex(n=>n.id==='voto');if(kv>=0&&S.stage[kv]>=2){S.boost[kv]+=.8;setTimeout(()=>S&&!S.ended&&cronaca(`Migliaia di post: "${pp.name} ha vinto con i brogli". Il ministro: "Risultato certificato"`),2000)}}
  if(S.t%6===0)checkDms();
  if(S.sus>=100)end('ban');else if(S.attention>=100)end('probe');else if(S.cred<=0)end('unmask');else if(S.chaos>=100)end('fall');else if(followers()>=2.5e6)end('become');
}
let lastRender=0;
function tick(){
  if(!S||S.ended)return;for(let i=0;i<S.speed&&!S.ended;i++)step();if(S.ended)return;renderHead();behTick();logSnapTick();
  if(S.t-lastRender>=2){lastRender=S.t;if(!$('#v-search').hidden&&!$('#sIn').value&&document.activeElement!==$('#sIn'))renderSearchRes('');renderWallet();
    const d=pages.querySelector('[data-kind="debug"] #dst');if(d)d.innerHTML=debugState();}
}
function end(type){
  if(S.ended)return;S.ended=true;L('ending',{ending:type,title:TEXT.ends[type].h,s:stateSnap()});logSend(false);closeLayer();const e=TEXT.ends[type],el=document.createElement('div');el.className='full end';
  const choices=S.log.length?`<div><div class="kick" style="margin-bottom:8px">Le tue scelte</div><ul class="choices">${S.log.slice(-8).map(l=>`<li>${esc(l)}</li>`).join('')}</ul></div>`:'';
  el.innerHTML=`<div class="kick">${esc(e.k)}</div><h2>${esc(e.h)}</h2><p>${esc(e.p)}</p>
  <div class="endstats"><div><b class="num">${S.posts}</b><small>Post pubblicati</small></div><div><b class="num">${fmt(S.views)}</b><small>Visualizzazioni (${fmt(S.views/3.1)} reali)</small></div><div><b class="num">${fmt(followers())}</b><small>Follower (${fmt(S.fake)} comprati)</small></div><div><b class="num">${Math.round(Math.min(100,S.chaos))}%</b><small>Caos nel Paese</small></div><div><b class="num">${S.events.length}</b><small>Fatti di cronaca</small></div><div><b class="num">${S.mod.cm.fp}</b><small>Fact-check censurati</small></div><div><b class="num">${eur(S.flows.reduce((a,f)=>a+f.amount,0))}</b><small>Nero riciclato</small></div><div><b class="num">${eur(S.ads.rev)}</b><small>Incassati dalla piattaforma</small></div></div>
  ${choices}<div class="lesson"><p>${esc(e.l)}</p></div>
  <p style="font-size:13px">${esc(TEXT.app.disclaimer)}</p>
  <p class="sessioncode">${esc(LOG.consent?TEXT.consent.endCode.replace('{code}',LOG.code):TEXT.consent.endNoConsent)}</p>
  <button class="btn" id="again">Gioca di nuovo</button>`;
  $('#screen').append(el);$('#again').onclick=()=>{el.remove();start(S.name,S.photo)};
}
async function start(name,photo,consent){
  if(consent===undefined)consent=LOG.consent;logOpen(consent);
  for(const k in POSTS)delete POSTS[k];for(const k in PEOPLE)delete PEOPLE[k];AGP.clear();
  initAccounts();S=newState(name);loadMediaMap();S.photo=photo||null;behStart();
  L('session_start',{player:S.handle,consent:!!consent,realHour:new Date().getHours(),weekday:new Date().getDay()});
  $('#feed').innerHTML='';$('#sentinel').textContent='Carico le tendenze di oggi…';
  await Promise.race([loadTrends(),new Promise(r=>setTimeout(r,2500))]);
  if(!TR.items.length)TR.items=pickForGame(TEXT.trends.fallback||[]);
  // umore reale delle notizie italiane (GDELT): una giornata negativa fa partire la popolazione più spaventata
  let fearBoost=0;if(typeof TR.tone==='number'){fearBoost=clamp(-TR.tone*.03,0,.15);if(fearBoost>0){for(let i=0;i<S.pop.N;i++)S.pop.fear[i]=clamp(S.pop.fear[i]+fearBoost*(.6+Math.random()*.8),0,1);S.pop.aggregate();S.pop.base=Object.assign({},S.pop.agg)}}
  L('trends_loaded',{live:TR.live,src:TR.src,items:TR.items.map(i=>({t:i.t,src:i.src||null})),newsTone:TR.tone,fearBoost:+fearBoost.toFixed(3)});
  $('#sentinel').textContent='Carico altri contenuti per te…';
  generateTrendContent();
  await Promise.race([loadWebImages(),new Promise(r=>setTimeout(r,3000))]);
  S.adopt=S.pop.agg.adopt.slice();S.mobil=S.pop.agg.mobil.slice();S.polls=S.pop.polls();comp={k:null,target:-1,budget:0,photo:false,real:false,drafts:[],quote:null,free:false,freeText:''};
  $('#feed').innerHTML='';closeLayer();closePages();hidePill();updBadge();setFeedMode('foryou');$('#v-search').innerHTML='';
  batch(10);renderHead();renderMeBtn();show('feed');$('#v-feed').scrollTop=0;
  if(!photo)setTimeout(autoCapturePhoto,900);
}
function initSplash(){
  $('#splashTag').textContent=TEXT.app.tagline;$('#splashHow').innerHTML=TEXT.app.howto.map((h,i)=>`<li><span>${i+1}</span>${esc(h)}</li>`).join('');
  $('#uname').value=TEXT.app.defaultName;$('#startBtn').textContent=TEXT.app.enter;
}
$('#startBtn').onclick=()=>{const v=$('#uname').value.trim().replace(/\s+/g,'_')||TEXT.app.defaultName;$('#splash').hidden=true;consentScreen(ok=>start(v,null,ok))};
$('#uname').addEventListener('keydown',e=>{if(e.key==='Enter')$('#startBtn').click()});
new IntersectionObserver(es=>{if(es[0].isIntersecting&&S&&!S.ended&&S.feedMode==='foryou')batch(6)},{root:$('#v-feed'),rootMargin:'400px'}).observe($('#sentinel'));
initSplash();
(async()=>{try{const r=await fetch('data/testi.json',{cache:'no-store'});if(r.ok){const j=await r.json();if(!store.get('psyop.text.v2')){TEXT=mergeText(deepClone(TEXT_DEFAULT),j);initSplash()}}}catch(e){}})();
logRetryUnsent();
setInterval(tick,500);
