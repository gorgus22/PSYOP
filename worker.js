/* Psyop · Worker Cloudflare
   Fa due cose:
   1. GET  /trends   → tendenze di Google Trends Italia, filtrate (niente persone reali, niente fatti
                       tragici), con immagine da Wikipedia quando c'è, e l'umore medio delle notizie
                       italiane delle ultime 24 ore (GDELT). Risposta in cache per 10 minuti.
   2. POST /log      → riceve il log di una sessione e lo salva nell'archivio (KV "LOGS").
      GET  /logs     → elenco delle sessioni (serve la chiave di amministrazione)
      GET  /log/ID   → un log completo (serve la chiave)
      DELETE /log/ID → cancella un log (serve la chiave)
   Impostazioni (Settings → Variables del Worker):
      ADMIN_KEY       segreto: la password per leggere l'archivio
      ALLOWED_ORIGIN  facoltativo: l'indirizzo del gioco, es. https://tuonome.github.io (altrimenti *)
   Binding KV: LOGS
   Non salva indirizzi IP né altri dati della richiesta: solo il contenuto del log. */

const BLOCK = ["mort","muor","omicid","uccis","strage","attentat","terremot","sism","incident","arrest","clan","mafia","camorr","guerra","bomba","missil","molest","stupr","violenz","suicid","vittim","rapina","sparator","alluvion","incend","pedofil","ostagg","femminic","malatti","cancro","tumor","funeral","lutto","scompars","carcer","processo","indagat","sesso","porno","nud","epstein"];
const PEOPLE = ["attore","attrice","cantante","cantautor","calciatore","calciatrice","tennista","pilota","politic","giornalist","conduttor","presentator","imprenditor","scrittor","regist","influencer","youtuber","rapper","modell","allenator","ciclista","nuotator","sciator","pugile","atleta","comic","personaggio televisivo","papa","vescovo","principe","principessa","sovran","president","ministr","segretari","sindac","deputat","senator","miliardari","banchier","manager","dirigente"];

function cors(env, extra = {}) {
  return Object.assign({
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Authorization,Content-Type",
    "Access-Control-Max-Age": "86400"
  }, extra);
}
const json = (env, data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), { status, headers: cors(env, Object.assign({ "Content-Type": "application/json; charset=utf-8" }, extra)) });

function authed(req, env) {
  const h = req.headers.get("Authorization") || "";
  return env.ADMIN_KEY && h === "Bearer " + env.ADMIN_KEY;
}

/* ---------- tendenze ---------- */
function decode(s) {
  return String(s || "").replace(/<!\[CDATA\[|\]\]>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
}
function tag(block, name) { const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`)); return m ? decode(m[1]) : ""; }
function tagsAll(block, name) { return [...block.matchAll(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "g"))].map(m => decode(m[1])); }

async function googleTrends() {
  const r = await fetch("https://trends.google.com/trending/rss?geo=IT&hl=it", { headers: { "User-Agent": "Mozilla/5.0 psyop-trends" } });
  if (!r.ok) return [];
  const xml = await r.text();
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => {
    const b = m[1];
    return { t: tag(b, "title"), traffic: tag(b, "ht:approx_traffic"), news: tagsAll(b, "ht:news_item_title").slice(0, 3), date: tag(b, "pubDate") };
  });
}
function isLatinItalian(t) { return /^[\p{Script=Latin}0-9 '’.\-&]+$/u.test(t); }
async function wiki(t) {
  try {
    const r = await fetch(`https://it.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(t)}`, { headers: { "User-Agent": "psyop-trends (game)" } });
    if (!r.ok) return null;
    return await r.json();
  } catch (e) { return null; }
}
async function newsTone() {
  // tono medio delle notizie dei media italiani nelle ultime 24 ore (negativo = notizie negative)
  try {
    const r = await fetch("https://api.gdeltproject.org/api/v2/doc/doc?query=sourcecountry:IT&mode=timelinetone&timespan=24h&format=json");
    if (!r.ok) return null;
    const j = await r.json();
    const data = (j.timeline && j.timeline[0] && j.timeline[0].data) || [];
    const vals = data.map(d => +d.value).filter(v => !isNaN(v));
    if (!vals.length) return null;
    return +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2);
  } catch (e) { return null; }
}
async function buildTrends() {
  const [raw, tone] = await Promise.all([googleTrends().catch(() => []), newsTone()]);
  const out = [];
  for (const it of raw) {
    const t = it.t, all = (t + " " + it.news.join(" ")).toLowerCase();
    if (!t || t.length > 60 || !isLatinItalian(t)) continue;
    if (BLOCK.some(w => all.includes(w))) continue;
    out.push(it);
  }
  // controllo con Wikipedia: niente persone; immagine solo se orizzontale
  const checked = await Promise.all(out.slice(0, 20).map(async it => {
    const w = await wiki(it.t);
    const d = (w && w.description || "").toLowerCase(), x = (w && w.extract || "");
    if (PEOPLE.some(p => d.includes(p))) return null;
    if (/^[^.]{0,80}\([^)]*\b(1[89]|20)\d\d\b[^)]*\)\s*(è|era|fu)\b/.test(x)) return null;
    // termini di due parole senza voce Wikipedia sono spesso nomi e cognomi: meglio scartarli
    if (!w && /^[a-zà-ù']+ [a-zà-ù']+$/i.test(it.t) && !/ (di|del|della|in|a|e) /i.test(" " + it.t + " ")) return null;
    const im = w && w.thumbnail;
    return {
      t: w && w.title && w.title.toLowerCase() === it.t.toLowerCase() ? w.title : it.t,
      k: "tema", src: "Google Trends", traffic: it.traffic, checked: true, d: w ? w.description || "" : "",
      img: im && im.width / im.height >= 1.05 ? im.source.replace(/\/\d+px-/, "/640px-") : null
    };
  }));
  return { date: new Date().toISOString().slice(0, 10), updated: new Date().toISOString(), tone, items: checked.filter(Boolean) };
}

/* ---------- archivio ---------- */
async function saveLog(req, env) {
  const text = await req.text();
  if (text.length > 3_000_000) return json(env, { error: "log troppo grande" }, 413);
  let log; try { log = JSON.parse(text); } catch (e) { return json(env, { error: "JSON non valido" }, 400); }
  if (!log || !/^[0-9]{12}-[A-Z0-9]{6}$/.test(log.id || "") || !Array.isArray(log.events) || !log.consent) return json(env, { error: "log non valido" }, 400);
  const end = [...log.events].reverse().find(e => e.type === "ending");
  const meta = {
    code: log.code, started: log.meta && log.meta.started, player: log.meta && log.meta.player,
    durationMs: log.meta && log.meta.durationMs, events: log.events.length, partial: !!log.partial,
    ending: end ? end.ending : null, device: log.meta && log.meta.device
  };
  const prev = await env.LOGS.getWithMetadata("log:" + log.id);
  if (prev && prev.metadata && !prev.metadata.partial && log.partial) return json(env, { ok: true, kept: "completo" });
  await env.LOGS.put("log:" + log.id, text, { metadata: meta });
  return json(env, { ok: true, code: log.code });
}
async function listLogs(env) {
  const out = []; let cursor;
  do {
    const r = await env.LOGS.list({ prefix: "log:", cursor, limit: 1000 });
    for (const k of r.keys) out.push(Object.assign({ id: k.name.slice(4) }, k.metadata || {}));
    cursor = r.list_complete ? null : r.cursor;
  } while (cursor);
  out.sort((a, b) => String(b.started).localeCompare(String(a.started)));
  return out;
}

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url), path = url.pathname.replace(/\/$/, "");
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(env) });
    try {
      if (path === "/trends" && req.method === "GET") {
        const cache = caches.default, key = new Request(url.origin + "/trends-cache");
        let hit = await cache.match(key);
        if (!hit) {
          const data = await buildTrends();
          hit = new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=600" } });
          ctx.waitUntil(cache.put(key, hit.clone()));
        }
        return new Response(hit.body, { headers: cors(env, { "Content-Type": "application/json; charset=utf-8" }) });
      }
      if (path === "/log" && req.method === "POST") return await saveLog(req, env);
      if (path === "/logs" && req.method === "GET") {
        if (!authed(req, env)) return json(env, { error: "chiave non valida" }, 401);
        return json(env, await listLogs(env));
      }
      const m = path.match(/^\/log\/([0-9]{12}-[A-Z0-9]{6})$/);
      if (m) {
        if (!authed(req, env)) return json(env, { error: "chiave non valida" }, 401);
        if (req.method === "GET") {
          const v = await env.LOGS.get("log:" + m[1]);
          return v ? new Response(v, { headers: cors(env, { "Content-Type": "application/json; charset=utf-8" }) }) : json(env, { error: "non trovato" }, 404);
        }
        if (req.method === "DELETE") { await env.LOGS.delete("log:" + m[1]); return json(env, { ok: true }); }
      }
      if (path === "" || path === "/") return json(env, { ok: true, service: "psyop", endpoints: ["/trends", "/log", "/logs", "/log/:id"] });
      return json(env, { error: "non trovato" }, 404);
    } catch (e) {
      return json(env, { error: "errore interno" }, 500);
    }
  }
};
