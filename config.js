'use strict';
/* Psyop · configurazione per la pubblicazione
   workerUrl: indirizzo del tuo Cloudflare Worker (vedi worker/LEGGIMI.md), senza barra finale.
   Esempio: 'https://psyop.tuonome.workers.dev'
   Se resta vuoto, il gioco funziona lo stesso: tendenze da Wikipedia e Mastodon, nessun log inviato. */
const CFG={
  workerUrl:'https://rough-credit-938f.giorgiomascio13.workers.dev',
  mastodon:'https://mastodon.uno',   // istanza da cui leggere hashtag di tendenza
  refreshMin:10,                     // ogni quanti minuti reali ricaricare le tendenze durante la partita
  version:'2026-11-23'
};
