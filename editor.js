'use strict';
/* Psyop · editor dei testi di gioco (Debug → Editor testi)
   Modifica qualsiasi stringa di TEXT. Le liste di frasi si scrivono una per riga.
   Un "a capo" dentro una singola frase si scrive \n. Le modifiche valgono subito e si salvano in questo browser. */
const ED_LABELS={app:'Interfaccia e splash',ends:'Finali',communities:'Comunità della popolazione',parties:'Partiti e leader',narratives:'Narrative',stageNames:'Nomi degli stadi',formats:'Formati delle bozze',world:'Mondo (città, vie, fonti)',people:'Persone generate',accounts:'Account fissi',normal:'Post di vita quotidiana',infected:'Post "contagiati" [stadio minimo, testo]',memes:'Meme',politics:'Post dei politici (uno per stadio)',propaganda:'Propaganda',newsNormal:'Notizie normali',ads:'Inserzionisti [nome, prezzo, narrativa]',lexicon:'Lessico del classificatore',comments:'Commenti',gm:'Eventi di caos [soglia, testo]',launder:'Riciclaggio',dms:'Messaggi privati',shop:'Negozio',victims:'Notifiche sulle vittime'};
const ED_HELP={stages:'Una riga per frase. Gli stadi vanno da Dubbio (0) a Strada (4).',affinity:'Un numero da 0 a 1 per riga, nell\'ordine delle comunità.',ch:'Testi dei pulsanti di scelta.',out:'Esito di ogni scelta, nello stesso ordine dei pulsanti.',tags:'Un hashtag per riga.',news:'Una notizia per stadio raggiunto (Sospetto, Certezza, Sfida, Strada).'};
let edDirty=false;
const isPrim=v=>v===null||typeof v!=='object';
const enc=s=>String(s).replace(/\n/g,'\\n'),dec=s=>s.replace(/\\n/g,'\n');
function edGet(path){return path.reduce((o,k)=>o[k],TEXT)}
function edSet(path,val){const last=path[path.length-1],o=path.slice(0,-1).reduce((o,k)=>o[k],TEXT);o[last]=val;edDirty=true;const m=$('#edState');if(m){m.textContent='Modifiche non salvate';m.className='dirty'}}
function edTitle(v,k){if(v&&typeof v==='object'&&!Array.isArray(v))return v.name||v.n||v.from||v.h||v.id||k;if(Array.isArray(v)&&isPrim(v[0]))return String(v[v.length>1&&typeof v[0]==='number'?1:0]).slice(0,48);return k}
function edField(path,key,val){
  const id='ed_'+path.join('_').replace(/[^\w]/g,'_');
  const wrap=document.createElement('div');wrap.className='fld';
  const help=ED_HELP[key]?`<span class="help">${esc(ED_HELP[key])}</span>`:'';
  if(Array.isArray(val)){
    const nums=val.length&&val.every(x=>typeof x==='number');
    wrap.innerHTML=`<label for="${id}">${esc(key)} · ${val.length} righe</label><textarea id="${id}" rows="${Math.min(12,Math.max(3,val.length+1))}">${esc(val.map(enc).join('\n'))}</textarea>${help}`;
    wrap.querySelector('textarea').oninput=e=>{const lines=e.target.value.split('\n').map(x=>x.trim()).filter(x=>x.length);edSet(path,nums?lines.map(Number).map(n=>isNaN(n)?0:n):lines.map(dec))};
  }else if(typeof val==='number'){
    wrap.innerHTML=`<label for="${id}">${esc(key)}</label><input id="${id}" type="number" step="any" value="${val}">${help}`;
    wrap.querySelector('input').oninput=e=>edSet(path,+e.target.value||0);
  }else{
    const long=String(val).length>60;
    wrap.innerHTML=`<label for="${id}">${esc(key)}</label>${long?`<textarea id="${id}">${esc(enc(val))}</textarea>`:`<input id="${id}" value="${esc(enc(val))}">`}${help}`;
    wrap.querySelector(long?'textarea':'input').oninput=e=>edSet(path,dec(e.target.value));
  }
  return wrap;
}
function edNode(path,key,val,filter){
  // liste di frasi e valori semplici diventano un campo; oggetti e liste di oggetti diventano sezioni apribili
  if(isPrim(val)||(Array.isArray(val)&&val.every(isPrim)))return edField(path,key,val);
  const d=document.createElement('details');
  const label=path.length===1?(ED_LABELS[key]||key):edTitle(val,key);
  const n=Array.isArray(val)?val.length:Object.keys(val).length;
  d.innerHTML=`<summary><span>${esc(label)}</span><small>${Array.isArray(val)?n+' voci':key}</small></summary>`;
  let built=false;
  const build=()=>{if(built)return;built=true;const box=document.createElement('div');
    const keys=Array.isArray(val)?val.map((_,i)=>i):Object.keys(val);
    for(const k of keys){const child=val[k];if(key==='stages'&&Array.isArray(child)){box.append(edField(path.concat(k),`${TEXT.stageNames[k]||k} (stadio ${k})`,child));continue}box.append(edNode(path.concat(k),String(k),child,filter))}
    d.append(box)};
  d.addEventListener('toggle',()=>{if(d.open)build()});
  if(filter){build();d.open=true}
  return d;
}
function edMatches(v,f){if(isPrim(v))return String(v).toLowerCase().includes(f);if(Array.isArray(v))return v.some(x=>edMatches(x,f));return Object.entries(v).some(([k,x])=>k.toLowerCase().includes(f)||edMatches(x,f))}
function edPrune(v,f){
  // tiene solo i rami che contengono il testo cercato, conservando i percorsi originali
  if(isPrim(v)||(Array.isArray(v)&&v.every(isPrim)))return edMatches(v,f);
  return edMatches(v,f);
}
function edRender(pg,filter){
  const box=pg.querySelector('#edTree');box.innerHTML='';const f=(filter||'').trim().toLowerCase();
  for(const k of Object.keys(TEXT)){
    if(f&&!(k.toLowerCase().includes(f)||(ED_LABELS[k]||'').toLowerCase().includes(f)||edMatches(TEXT[k],f)))continue;
    if(f&&typeof TEXT[k]==='object'){
      // in ricerca mostra direttamente i sotto-rami che contengono il testo
      const d=document.createElement('details');d.open=true;d.innerHTML=`<summary><span>${esc(ED_LABELS[k]||k)}</span><small>${k}</small></summary>`;
      const inner=document.createElement('div');
      const keys=Array.isArray(TEXT[k])?TEXT[k].map((_,i)=>i):Object.keys(TEXT[k]);
      for(const c of keys){const v=TEXT[k][c];if(String(c).toLowerCase().includes(f)||edPrune(v,f))inner.append(edNode([k,c],String(c),v,false))}
      d.append(inner);box.append(d);
    }else box.append(edNode([k],k,TEXT[k],false));
  }
  if(!box.children.length)box.innerHTML=`<p class="empty" style="padding:14px">Nessun testo contiene "${esc(filter)}".</p>`;
}
let edWin=null;
function openTextEditor(){
  if(edWin){edWin.remove();edWin=null}
  const win=document.createElement('div');win.className='edwin';win.dataset.kind='editor';
  win.innerHTML=`<div class="edbar"><h3>Editor Psyop</h3><div class="grow"><input id="edSearch" type="search" placeholder="Cerca un testo, ad esempio: cantina" aria-label="Cerca nei testi"></div><button class="btn" id="edSave">Salva</button><button class="btn ghost" id="edIO">Esporta / Importa</button><button class="btn ghost" id="edReset">Ripristina</button><button class="edclose" id="edClose" aria-label="Chiudi l'editor">×</button><small id="edState">${store.get('psyop.text.v2')?'Stai usando testi personalizzati.':'Testi originali.'}</small></div><div class="edbody"><div class="edinner"><div id="edMedia"></div><div class="ed" id="edTree"></div></div></div>`;
  document.body.append(win);edWin=win;
  const pg=win;// stesse query interne
  win.querySelector('#edClose').onclick=()=>{win.remove();edWin=null};
  renderMediaLib(win.querySelector('#edMedia'));
  edRender(pg);
  let t=null;pg.querySelector('#edSearch').oninput=e=>{clearTimeout(t);t=setTimeout(()=>edRender(pg,e.target.value),220)};
  pg.querySelector('#edSave').onclick=()=>{const ok=store.set('psyop.text.v2',TEXT);edDirty=false;const m=pg.querySelector('#edState');m.className='';m.textContent=ok?'Salvato in questo browser. Le modifiche sono già attive.':'Non riesco a salvare in questo browser: le modifiche restano attive fino alla chiusura. Usa Esporta per non perderle.';toast(ok?'Testi salvati.':'Salvataggio non disponibile qui. Esporta il JSON.',ok?'good':'bad')};
  pg.querySelector('#edReset').onclick=e=>{const b=e.target;if(b.dataset.confirm!=='1'){b.dataset.confirm='1';b.textContent='Conferma';setTimeout(()=>{b.dataset.confirm='';b.textContent='Ripristina'},3000);return}
    store.del('psyop.text.v2');TEXT=deepClone(TEXT_DEFAULT);edDirty=false;edRender(pg,pg.querySelector('#edSearch').value);pg.querySelector('#edState').textContent='Testi originali ripristinati.';b.dataset.confirm='';b.textContent='Ripristina';toast('Testi originali ripristinati.')};
  pg.querySelector('#edIO').onclick=()=>{
    const io=document.createElement('div');io.className='edwin';io.style.zIndex='121';
    io.innerHTML=`<div class="edbar"><h3>Esporta / Importa</h3><div class="grow"></div><button class="edclose" id="ioClose" aria-label="Chiudi">×</button></div><div class="edbody"><div class="edinner" style="padding-top:14px"><div class="card" style="margin-bottom:14px"><h5>Esporta</h5><p class="empty" style="margin-bottom:8px">Copia questo JSON e conservalo. Per pubblicare i testi per tutti i giocatori, salvalo come <b>data/testi.json</b> nel repository GitHub.</p><textarea class="io" style="width:100%;min-height:200px;font-family:var(--f-mono);font-size:11.5px;padding:10px" id="ioOut" readonly aria-label="Testi esportati">${esc(JSON.stringify(TEXT,null,1))}</textarea><button class="btn" id="ioCopy" style="margin-top:8px;width:auto">Copia</button></div>
      <div class="card"><h5>Importa</h5><p class="empty" style="margin-bottom:8px">Incolla un JSON esportato in precedenza. I campi mancanti restano quelli originali.</p><textarea class="io" style="width:100%;min-height:200px;font-family:var(--f-mono);font-size:11.5px;padding:10px" id="ioIn" aria-label="Testi da importare" placeholder="{ ... }"></textarea><button class="btn ghost" id="ioLoad" style="margin-top:8px;width:auto">Importa e salva</button><p class="empty" id="ioMsg" style="margin-top:8px"></p></div></div></div>`;
    document.body.append(io);
    io.querySelector('#ioClose').onclick=()=>io.remove();
    io.querySelector('#ioCopy').onclick=()=>{const ta=io.querySelector('#ioOut');const done=()=>toast('JSON copiato.','good');try{navigator.clipboard.writeText(ta.value).then(done,()=>{ta.select();toast('Seleziona e copia il testo a mano.')})}catch(e){ta.select();toast('Seleziona e copia il testo a mano.')}};
    io.querySelector('#ioLoad').onclick=()=>{const msg=io.querySelector('#ioMsg');try{const obj=JSON.parse(io.querySelector('#ioIn').value);TEXT=mergeText(deepClone(TEXT_DEFAULT),obj);store.set('psyop.text.v2',TEXT);edRender(pg);msg.textContent='Importato. Le modifiche sono attive.';msg.style.color='var(--good)'}catch(e){msg.textContent='Il testo incollato non è un JSON valido: '+e.message;msg.style.color='var(--bad)'}};
  };
}
