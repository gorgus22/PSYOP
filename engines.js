'use strict';
/* Psyop · motori algoritmici
   1. Population  – popolazione simulata (1.400 profili, ciascuno = 2.000 utenti) su un grafo small-world con omofilia.
                    Le credenze si contagiano con un modello a confidenza limitata (Deffuant), modulato da paura, rabbia e fiducia.
   2. cascade()   – propagazione di un singolo post: processo a ramificazione sul grafo + spinta algoritmica sui post che performano.
   3. Ranker      – il feed: regressione logistica online allenata sulle tue interazioni. Obiettivo: tempo di permanenza.
   4. Moderator   – classificatore automatico di disinformazione, con matrice di confusione reale (sbaglia nei due sensi).
   5. analyzeText – modello lessicale che stima rabbia, paura, complottismo e chiamata all'azione di un testo.
   6. AdMarket    – asta al secondo prezzo per gli spazi pubblicitari; il CPM sale con la paura.
   7. Laundry     – flussi di denaro nero, commissioni, ritardi e attenzione delle autorità.
   8. polls()     – intenzioni di voto calcolate dalla popolazione, astensione compresa. */

const SCALE=2000;
// parametri per comunità, nell'ordine di TEXT.communities
const C_SIZE=[.16,.15,.15,.13,.12,.1,.1,.09];
const C_TRUST=[.45,.5,.38,.72,.45,.34,.4,.28];
const C_ACT=[.42,.5,.36,.4,.48,.55,.75,.85];
const C_SUSC=[.62,.58,.5,.22,.5,.68,.42,.6];
// propensione di voto iniziale per comunità: [ordine, fronte, sveglia, centro]
const C_PARTY=[[.45,.3,.15,.1],[.3,.38,.2,.12],[.25,.3,.35,.1],[.2,.45,.08,.27],[.45,.2,.3,.05],[.15,.25,.5,.1],[.2,.3,.35,.15],[.35,.15,.48,.02]];

class Population{
  constructor(seed){
    const r=mulberry(seed);this.r=r;
    const N=this.N=1400,K=this.K=TEXT.narratives.length,C=this.C=TEXT.communities.length;
    const g=()=>(r()+r()+r()-1.5)/1.5;
    this.comm=new Uint8Array(N);this.b=new Float32Array(N*K);
    this.trust=new Float32Array(N);this.fear=new Float32Array(N);this.anger=new Float32Array(N);
    this.susc=new Float32Array(N);this.act=new Float32Array(N);this.fol=new Uint8Array(N);this.party=new Uint8Array(N);
    this.x=new Float32Array(N);this.y=new Float32Array(N);this.seen=new Uint32Array(N);
    this.members=Array.from({length:C},()=>[]);
    for(let i=0;i<N;i++){
      let x=r(),c=0;for(;c<C-1;c++){x-=C_SIZE[c];if(x<=0)break}
      this.comm[i]=c;this.members[c].push(i);
      this.trust[i]=clamp(C_TRUST[c]+g()*.18,.02,.98);
      this.act[i]=clamp(C_ACT[c]+g()*.2,.05,1);
      this.susc[i]=clamp(C_SUSC[c]+g()*.2,.02,1);
      this.fear[i]=clamp(.12+g()*.1,0,1);this.anger[i]=clamp(.12+g()*.1,0,1);
      let px=r(),p=0;for(;p<3;p++){px-=C_PARTY[c][p];if(px<=0)break}this.party[i]=p;
      for(let k=0;k<K;k++){const a=TEXT.narratives[k].affinity[c]??.5;let v=r()*.22*a;if(r()<.009*a)v=.62+r()*.25;this.b[i*K+k]=v}
      const ang=c/C*Math.PI*2-Math.PI/2,R=.33;this.x[i]=.5+Math.cos(ang)*R+g()*.085;this.y[i]=.5+Math.sin(ang)*R*.92+g()*.085;
    }
    // grafo: omofilia 85%, legami deboli 15%
    this.nb=Array.from({length:N},()=>[]);this.edges=[];
    for(let i=0;i<N;i++){
      const deg=3+Math.floor(r()*4),c=this.comm[i];
      for(let d=0;d<deg;d++){
        const j=r()<.85?this.members[c][Math.floor(r()*this.members[c].length)]:Math.floor(r()*N);
        if(j===i||this.nb[i].includes(j))continue;this.nb[i].push(j);this.nb[j].push(i);
        if(this.edges.length<2200)this.edges.push(i,j);
      }
    }
    this.aff=TEXT.narratives.map(n=>n.affinity.map(v=>.5+.5*(+v||0)));
    this.agg=null;this.base=null;this.aggregate();this.base=Object.assign({},this.agg);
  }
  bel(i,k){return this.b[i*this.K+k]}
  cap(i,k){return clamp((1.05-.85*this.trust[i])*this.aff[k][this.comm[i]],.1,1)}
  maxBel(i){let m=0;for(let k=0;k<this.K;k++)m=Math.max(m,this.b[i*this.K+k]);return m}
  /* un'ora di gioco: contagio organico, smentite, emozioni */
  step(env){
    const {N,K,b,r}=this;
    for(let k=0;k<K;k++){
      const push=env.boost[k];
      for(let s=0;s<260;s++){
        const i=Math.floor(r()*N),nb=this.nb[i];if(!nb.length)continue;
        const j=nb[Math.floor(r()*nb.length)],bj=b[j*K+k];if(bj<.4)continue;
        if(r()>this.act[j]*(.1+push*2.3))continue;
        const idx=i*K+k,bi=b[idx];
        const eps=.18+.45*this.susc[i]+.3*this.fear[i]-.28*this.trust[i];
        if(Math.abs(bj-bi)<eps)b[idx]=Math.min(this.cap(i,k),bi+.13*(bj-bi)+(bj>.8?.015:0));
      }
      for(let s=0;s<110;s++){const i=Math.floor(r()*N),idx=i*K+k;b[idx]=Math.max(0,b[idx]-.0045*(this.trust[i]+.2+env.debunk[k])*(1.15-b[idx]))}
    }
    for(let s=0;s<240;s++){
      const i=Math.floor(r()*N),m=this.maxBel(i);
      this.fear[i]+=.06*(clamp(.12+m*.95+env.climate*.3,0,1)-this.fear[i]);
      this.anger[i]+=.06*(clamp(.12+m*(1.25-this.trust[i])+env.climate*.2,0,1)-this.anger[i]);
      this.trust[i]=clamp(this.trust[i]-.006*m*m+.0008-.002*env.climate,.01,1);
    }
    // i follower poco coinvolti se ne vanno
    for(let s=0;s<20;s++){const i=Math.floor(r()*N);if(this.fol[i]&&this.maxBel(i)<.3&&r()<.03)this.fol[i]=0}
  }
  aggregate(){
    const {N,K,b}=this,ad=new Array(K).fill(0),mo=new Array(K).fill(0),byC=Array.from({length:this.C},()=>new Array(K).fill(0));
    let f=0,t=0,a=0,fol=0;
    for(let i=0;i<N;i++){
      f+=this.fear[i];t+=this.trust[i];a+=this.anger[i];fol+=this.fol[i];
      for(let k=0;k<K;k++){const v=b[i*K+k];if(v>.6){ad[k]++;byC[this.comm[i]][k]++;if(v>.82&&this.anger[i]>.55)mo[k]++}}
    }
    this.agg={adopt:ad.map(x=>x/N),mobil:mo.map(x=>x/N),fear:f/N,trust:t/N,anger:a/N,fol,byC:byC.map((row,c)=>row.map(x=>x/this.members[c].length))};
    return this.agg;
  }
  /* indice di tenuta sociale (0 = normale, 100 = collasso) */
  chaos(bonus){
    const A=this.agg,B=this.base;
    const raw=(A.fear-B.fear)*.55+(B.trust-A.trust)*1.2+A.mobil.reduce((x,y)=>x+y,0)*1.6+A.adopt.reduce((x,y)=>x+y,0)*.12;
    return clamp(raw*100+bonus,0,100);
  }
  polls(){
    const {N}=this,v=[0,0,0,0,0],ki=TEXT.narratives.findIndex(n=>n.id==='inutile');
    for(let i=0;i<N;i++){
      const m=this.maxBel(i),f=this.fear[i],t=this.trust[i],a=this.anger[i];
      if(t<.16+.25*a*(1-m)||(ki>=0&&this.b[i*this.K+ki]>.6)){v[4]++;continue}
      const s=[(this.party[i]===0)+.75*f+.2*m,(this.party[i]===1)+.6*t-.3*m,(this.party[i]===2)+1.3*m+.25*a,(this.party[i]===3)+.45*t-.4*a];
      v[s.indexOf(Math.max(...s))]++;
    }
    const voters=N-v[4];
    return{shares:v.slice(0,4).map(x=>x/Math.max(1,voters)),turnout:voters/N};
  }
  /* propagazione di un post: ritorna esposti, coinvolti, condivisioni, nuovi follower, segnalazioni */
  cascade(o){
    const {N,K,b,r}=this,k=o.k,seen=new Uint8Array(N),q=[],touched=[];
    let exposed=0,eng=0,shares=0,newF=0,reports=0;const byC=new Array(this.C).fill(0);
    const push=(i,d)=>{if(seen[i])return;seen[i]=1;q.push(i,d)};
    // 1. follower (solo una parte vede il post: è il feed a decidere)
    for(let i=0;i<N;i++)if(this.fol[i]&&r()<.32*(o.mult||1)&&(o.target<0||this.comm[i]===o.target||r()<.5))push(i,0);
    // 2. esplorazione algoritmica e pubblicità mirata
    const pool=o.target>=0?this.members[o.target]:null;
    const seeds=Math.round(45*(o.mult||1))+o.adSeeds;
    for(let s=0;s<seeds;s++)push(pool?pool[Math.floor(r()*pool.length)]:Math.floor(r()*N),0);
    for(let s=0;s<o.botSeeds;s++)push(Math.floor(r()*N),1);
    const run=(maxD)=>{
      while(q.length){
        const d=q.pop(),i=q.pop();exposed++;byC[this.comm[i]]++;touched.push(i);this.seen[i]++;
        const idx=i*K+k,bi=b[idx];
        const z=-1.1+3*bi+1.8*o.out*(this.fear[i]+this.anger[i])+.9*o.nov+(o.badge?.45:0)-1.2*this.trust[i]*o.out+(o.photo?.3:0)+.5*this.susc[i];
        if(r()<sigmoid(z)){
          eng++;
          b[idx]=Math.min(Math.max(bi,this.cap(i,k)),bi+.4*(1-bi)*(.35+.65*this.susc[i])*(.5+.5*o.out));
          this.anger[i]=Math.min(1,this.anger[i]+.04*o.out);this.fear[i]=Math.min(1,this.fear[i]+.03*o.out);
          if(!this.fol[i]&&r()<.09+.06*o.out){this.fol[i]=1;newF++}
          if(d<maxD&&r()<this.act[i]*(.38+.45*o.out)*(o.mult||1)){shares++;for(const j of this.nb[i])if(r()<.55)push(j,d+1)}
        }else{b[idx]=Math.min(Math.max(bi,this.cap(i,k)),bi+.05*this.susc[i]);/* effetto verità illusoria */}
        if(this.trust[i]>.55&&r()<.08*o.out+.02)reports++;
      }
    };
    run(7);
    // 3. spinta algoritmica: se il tasso di coinvolgimento supera la media, la piattaforma allarga il pubblico
    const rate=eng/Math.max(1,exposed);let amp=0;
    if(rate>.16){
      amp=Math.min(500,Math.floor(exposed*(rate-.16)*5));
      const comms=[...new Set(touched.slice(0,80).map(i=>this.comm[i]))];
      for(let s=0;s<amp;s++){const m=this.members[comms[Math.floor(r()*comms.length)]];push(m[Math.floor(r()*m.length)],2)}
      run(4);
    }
    return{exposed,eng,shares,newF,reports,byC,touched,amp,rate};
  }
  /* un fact-check: raggiunge soprattutto chi ha fiducia alta e già non ci crede */
  debunk(k,power){
    const {N,K,b,r}=this;let reached=0,changed=0;
    for(let s=0;s<Math.round(60*power);s++){
      const i=Math.floor(r()*N);if(r()>this.trust[i])continue;reached++;
      const idx=i*K+k;if(b[idx]>.85){b[idx]=Math.min(1,b[idx]+.02);continue}// effetto ritorno di fiamma
      b[idx]=Math.max(0,b[idx]-.12*this.trust[i]);changed++;
    }
    return{reached,changed};
  }
  mostBeliever(k,samples=30){let best=0,bv=-1;for(let s=0;s<samples;s++){const i=Math.floor(this.r()*this.N),v=this.b[i*this.K+k];if(v>bv){bv=v;best=i}}return best}
}

/* ---------- modello lessicale ---------- */
function analyzeText(t){
  const s=String(t||''),low=s.toLowerCase(),L=TEXT.lexicon;
  const letters=s.replace(/[^A-Za-zÀ-ú]/g,''),caps=letters.length?s.replace(/[^A-ZÀ-Ú]/g,'').length/letters.length:0;
  const hits=a=>a.reduce((n,w)=>n+(low.includes(w)?1:0),0);
  const ex=(s.match(/!/g)||[]).length,qm=(s.match(/\?/g)||[]).length;
  const rage=clamp(hits(L.rage)*.28+caps*1.4+ex*.08,0,1),fear=clamp(hits(L.fear)*.3,0,1),plot=clamp(hits(L.plot)*.25,0,1),action=clamp(hits(L.action)*.35,0,1);
  return{rage,fear,plot,action,hedge:clamp(qm*.2,0,1),lex:clamp((rage+fear+plot)/2.2+action*.6,0,1)};
}

/* ---------- feed ranker ---------- */
class Ranker{
  constructor(){
    this.names=['Base','Indignazione','Narrative','Cronaca','Vita quotidiana','Meme','Politica','Propaganda','Fact-check','Pubblicità','Paura del momento','Account grandi','Foto e video','Già vicino a te'];
    // priori della piattaforma: l'engagement storico premia l'indignazione
    this.w=[-.3,.9,.35,.3,.25,.3,.2,.1,-.45,.05,.55,.3,.35,.4];this.w0=this.w.slice();this.n=0;this.pos=0;this.lr=.09;
  }
  feats(it){
    const k=it.ad?'ad':it.kind;const adopt=it.narrIdx!=null&&S?S.adopt[it.narrIdx]||0:0;
    return[1,(it.a||(k==='news'?3:k==='meme'?2:k==='pol'?4:1))/10,+(k==='narr'||k==='mine'),+(k==='news'),+(k==='normal'),+(k==='meme'),+(k==='pol'),+(k==='prop'),+(k==='fact'),+(k==='ad'),adopt*4,it.author&&it.author.followers>1e5?1:0,it.media?1:0,it.near?1:0];
  }
  score(it){const f=this.feats(it);let z=0;for(let i=0;i<f.length;i++)z+=this.w[i]*f[i];return z}
  train(it,y,wt=1){
    const f=this.feats(it),p=sigmoid(this.score(it)),g=(y-p)*this.lr*wt;
    for(let i=0;i<f.length;i++)this.w[i]+=g*f[i]-.0004*(this.w[i]-this.w0[i]);
    this.n++;if(y)this.pos++;
  }
  pick(cands,temp=.55){
    const sc=cands.map(c=>this.score(c)/temp),m=Math.max(...sc),ex=sc.map(s=>Math.exp(s-m)),tot=ex.reduce((a,b)=>a+b,0);
    let x=rnd()*tot;for(let i=0;i<cands.length;i++){x-=ex[i];if(x<=0)return cands[i]}return cands[0];
  }
}

/* ---------- moderazione automatica ---------- */
class Moderator{
  constructor(){this.w={bias:-4.2,out:2.2,rep:4,lex:2.3,ver:-1.5,paid:-1.1};this.cm={tp:0,fp:0,fn:0,tn:0}}
  prob(x){return sigmoid(this.w.bias+this.w.out*x.out+this.w.rep*x.rep+this.w.lex*x.lex+this.w.ver*(x.ver?1:0)+this.w.paid*(x.paid?1:0))}
  judge(x,isFalse){
    const p=this.prob(x),removed=p>.62;
    if(isFalse){removed?this.cm.tp++:this.cm.fn++}else{removed?this.cm.fp++:this.cm.tn++}
    return{p,removed};
  }
  get precision(){const c=this.cm;return c.tp/Math.max(1,c.tp+c.fp)}
  get recall(){const c=this.cm;return c.tp/Math.max(1,c.tp+c.fn)}
}

/* ---------- mercato pubblicitario ---------- */
class AdMarket{
  constructor(){this.rev=0;this.day=0;this.hist=[];this.last=null}
  cpm(fear){return 1.8*(1+3*fear)}
  auction(fear,topNarr){
    const bids=TEXT.ads.map((a,i)=>({i,bid:(1+((i*37)%7)/5)*(a[2]?(a[2]===topNarr?2.2:.9):1)*(1+2*fear*(a[2]?1:.2))*(.7+rnd()*.6)}));
    bids.sort((a,b)=>b.bid-a.bid);
    const w=bids[0],price=bids[1]?bids[1].bid:w.bid;this.last={ad:TEXT.ads[w.i],price,bidders:bids.length};return{idx:w.i,price};
  }
  tick(fear,dau){const h=dau*.04*this.cpm(fear)/1000;this.rev+=h;this.day+=h;return h}
}

/* ---------- riciclaggio ---------- */
const LAUNDER=[{fee:.12,risk:7,delay:20,cap:600},{fee:.22,risk:2.5,delay:48,cap:300},{fee:.05,risk:13,delay:6,cap:2500},{fee:0,risk:5,delay:30,cap:400}];
function launderOp(st,ch,amount){
  const P=LAUNDER[ch];amount=Math.min(amount,st.nero,P.cap*(ch===3?1+st.folN/150:1));
  if(amount<1)return null;
  st.nero-=amount;
  let fee=P.fee;if(ch===2)fee=clamp(.05+(rnd()-.5)*.5,-.2,.45);// la memecoin oscilla
  const risk=P.risk*Math.pow(amount/300,.7)*(ch===3?clamp(1.6-st.folN/300,.4,1.6):1);
  st.attention=clamp(st.attention+risk,0,100);
  const f={ch,amount,net:amount*(1-fee),at:st.t+P.delay};st.flows.push(f);return f;
}
