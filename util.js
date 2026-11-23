'use strict';
/* Psyop · utilità condivise */
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
let rnd=Math.random;
const ri=(a,b)=>a+Math.floor(rnd()*(b-a+1));
const pick=a=>a[Math.floor(rnd()*a.length)];
const chance=p=>rnd()<p;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const sigmoid=x=>1/(1+Math.exp(-x));
function withSeed(seed,fn){const o=rnd;rnd=mulberry(seed);try{return fn()}finally{rnd=o}}
function wpick(pairs){let tot=0;for(const p of pairs)tot+=Math.max(0,p[1]);let x=rnd()*tot;for(const p of pairs){x-=Math.max(0,p[1]);if(x<=0)return p[0]}return pairs[0][0]}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function fmt(n){n=Math.max(0,Math.round(n));if(n<1000)return String(n);if(n<1e6)return(n/1e3).toFixed(n<1e4?1:0).replace('.',',')+'K';if(n<1e9)return(n/1e6).toFixed(n<1e7?1:0).replace('.',',')+' Mln';return(n/1e9).toFixed(1).replace('.',',')+' Mld'}
const eur=n=>(n<0?'-':'')+Math.abs(n).toFixed(2).replace('.',',')+' €';
const pct=(n,d=1)=>(n*100).toFixed(d).replace('.',',')+'%';
const hue=s=>{let h=0;for(const c of String(s))h=(h*31+c.charCodeAt(0))%360;return h};
const deepClone=o=>JSON.parse(JSON.stringify(o));
const store={
  get(k){try{const v=localStorage.getItem(k);return v?JSON.parse(v):null}catch(e){return null}},
  set(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}},
  del(k){try{localStorage.removeItem(k)}catch(e){}}
};
