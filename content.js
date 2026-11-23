'use strict';
/* Psyop · tutti i testi di gioco.
   Questo oggetto è modificabile dall'Editor testi (Debug → Editor testi).
   Le modifiche vengono salvate nel browser e sovrascrivono questi valori.
   Segnaposto disponibili nei testi: {citta} {via} {persona} {fonte} {ist} {num} {eta} {me} {narr} */
const TEXT_DEFAULT={
 app:{
  name:"Psyop",
  tagline:"Il social che sa cosa pensi prima di te. Pubblica, targettizza, monetizza. Il resto lo fa l'algoritmo.",
  howto:[
   "Scegli una narrativa, un pubblico e una tecnica. Ogni narrativa è ispirata a un caso reale.",
   "Il seme lo pianti tu. Credenti, influencer e mainstream fanno il resto: è lo schema di quasi tutte le psyop.",
   "Quando abbastanza persone ci credono, le narrative escono dallo schermo. Committenti e partiti ti scrivono in privato. E tu puoi scrivere a chiunque."
  ],
  defaultName:"verità_nascosta",
  enter:"Entra in Psyop",
  disclaimer:"Psyop è un social fittizio, e lo sono anche persone, partiti, aziende e notizie. I meccanismi che hai visto (targeting emotivo, numeri gonfiati, moderazione automatica, soldi opachi) esistono in forma reale."
 },
 ends:{
  fall:{k:"Finale 1 di 5",h:"La tenuta sociale è crollata",p:"Le persone hanno smesso di credere ai medici, ai soccorritori, alle urne. Poi l'una all'altra. Il tuo ultimo post ha superato i 4 miliardi di visualizzazioni. In buona parte del Paese manca la corrente per leggerlo.",l:"Le notizie false viaggiano più veloci di quelle vere perché sono costruite per farlo: semplici, sorprendenti, rabbiose. Un algoritmo che ottimizza il tempo di permanenza le spinge senza chiedersi se siano vere, finché non escono dallo schermo."},
  ban:{k:"Finale 2 di 5",h:"Account sospeso",p:"La Moderazione automatica ti ha sospeso alle 3:12 di notte. Nello stesso minuto ha rimosso tre fact-check veri e lasciato online i tuoi quaranta profili clone. Le narrative che hai acceso continuano senza di te.",l:"La moderazione automatica sbaglia in entrambe le direzioni: censura contenuti legittimi e lascia passare quelli dannosi. E sospendere chi accende un fuoco non lo spegne."},
  unmask:{k:"Finale 3 di 5",h:"Smascherato",p:"Un gruppo di giornalisti ha collegato i puntini veri. Quasi tutti i tuoi follower se ne vanno, verso un nuovo account secondo cui i giornalisti non esistono. Ha già il doppio dei tuoi follower.",l:"Smentire una bufala richiede molto più lavoro che inventarla, e la smentita raggiunge sempre meno persone. La credibilità si perde in fretta, ma il bisogno di credere a qualcosa resta lì, in attesa del prossimo."},
  become:{k:"Finale 4 di 5",h:"Sei diventato il complotto",p:"Con due milioni e mezzo di follower, la teoria più condivisa della settimana è che tu non esisti. Che sei un'intelligenza artificiale, o un ufficio di stagisti pagato da un governo straniero. Qualcuno ha già trovato il tuo indirizzo per controllare.",l:"Follower gonfiati, badge comprati e numeri falsi costruiscono un'autorità che non esiste. Quando la popolarità sostituisce la verifica chiunque può diventare una fonte, e chiunque può diventare un bersaglio."},
  probe:{k:"Finale 5 di 5",h:"Indagato",p:"Alle sei del mattino la Guardia di Finanza ha suonato il campanello. Studio Fenice srl, le fatture di consulenza, la memecoin, le 'donazioni per le spese legali': c'era tutto, in ordine cronologico. I tuoi follower dicono che è una persecuzione politica. Raccolgono fondi per te. Finiscono, ovviamente, nello stesso posto.",l:"La disinformazione è anche un'economia: committenti che pagano in nero, piattaforme che incassano dalla rabbia, guadagni da far sembrare puliti. Seguire i soldi resta uno dei pochi modi per arrivare a chi tira i fili."}
 },
 communities:[
  {id:"prov",name:"Pensionati di provincia",desc:"Molto tempo online, gruppi WhatsApp di famiglia, fiducia nelle catene."},
  {id:"genitori",name:"Genitori dei gruppi classe",desc:"Paura per i figli, condivisioni rapide, chat della scuola."},
  {id:"precari",name:"Lavoratori precari",desc:"Rabbia economica, poco tempo, sfiducia nelle istituzioni."},
  {id:"urbani",name:"Professionisti urbani",desc:"Alta fiducia, leggono le fonti, segnalano spesso."},
  {id:"bar",name:"Tifosi e bar sport",desc:"Identità forte, battute, gruppi chiusi."},
  {id:"benessere",name:"Benessere e spiritualità",desc:"Naturale, alternativo, diffidente verso medicina e chimica."},
  {id:"giovani",name:"Ragazzi e shitposter",desc:"Ironia, meme, condivisioni per scherzo che smettono di essere scherzi."},
  {id:"militanti",name:"Militanti politici",desc:"Pochi ma attivissimi. Amplificano tutto ciò che serve alla causa."}
 ],
 parties:[
  {id:"ordine",name:"Ordine Nazionale",leader:"Corrado Velluti",handle:"corradovelluti",role:"Presidente del Consiglio",bio:"Presidente del Consiglio. Ordine Nazionale. Sicurezza, famiglia, lavoro."},
  {id:"fronte",name:"Fronte Democratico",leader:"Elena Sarti",handle:"elenasarti",role:"Segretaria",bio:"Segretaria del Fronte Democratico. Diritti, sanità pubblica, scuola."},
  {id:"sveglia",name:"Movimento Sveglia",leader:"Gianmarco Fusco",handle:"gianmarcofusco",role:"Fondatore",bio:"Movimento Sveglia. Io faccio solo domande. Loro hanno paura delle risposte."},
  {id:"centro",name:"Patto Civico",leader:"Alberto Gremigni",handle:"albertogremigni",role:"Portavoce",bio:"Patto Civico. Competenza, moderazione, buonsenso. Sondaggi: 4%."}
 ],
 narratives:[
  {id:"cantina",name:"La cantina della trattoria",ref:"Pizzagate, 2016",tech:"Cospirazione partecipativa",tags:["#cantinaGate","#salviamoliTutti","#DaNando"],act:"portare i figli alle feste",
   affinity:[0.6,0.9,0.4,0.1,0.5,0.7,0.6,0.9],
   stages:[
    ["Avete letto le email dell'assessore Ferraresi uscite ieri? Perché parla sempre di 'mozzarelle' e 'tavoli per i piccoli'? Chiedo.","Nelle email trapelate la parola 'pizza' compare 41 volte in un mese. Per un assessore alla cultura.","Le email di Ferraresi sono pubbliche. Leggetele voi, io non dico niente."],
    ["Abbiamo decifrato il codice: 'mozzarella' vuol dire bambino, 'tavolo piccolo' indica l'età. Il thread completo è nel gruppo.","La trattoria Da Nando a {citta} compare in tre email. Ha una cantina che sulla piantina del Comune non c'è.","Ogni utente del gruppo ha trovato un pezzo. Ora il quadro è completo. Aiutateci a finire."],
    ["Ho fatto un video di 40 minuti sulla cantina di Da Nando. Guardatelo prima che lo tolgano. Fate le vostre ricerche.","Il logo della trattoria è un simbolo che usano loro. Cercate 'triangolo spirale' e poi ditemi.","Sono stato da Nando. Il cameriere non mi ha guardato negli occhi. Ho capito tutto."],
    ["Un deputato ha presentato un'interrogazione su Da Nando. Non è più una teoria, è un'indagine.","Il TG ne parla solo per dire che è falso. Perché tutta questa fretta di smentire?","Ormai lo sanno tutti. Mancano solo le manette."],
    ["Qualcuno deve entrare in quella cantina e liberarli. Se la polizia non lo fa, lo faremo noi.","Domani a pranzo da Nando. Non per mangiare.","Chi lavora da Nando ha fatto la sua scelta. Ora noi facciamo la nostra."]],
   news:["Il titolare della trattoria Da Nando: 'Non abbiamo nemmeno una cantina'. Minacce ai camerieri","Quattrocento recensioni false in una notte: la trattoria chiude per una settimana","Un deputato presenta un'interrogazione su Da Nando: 'Chiediamo solo chiarezza'","{citta}, uomo armato entra nella trattoria Da Nando 'per liberare i bambini'. Spara nel ripostiglio: non c'è nessuno"]},
  {id:"collaboratore",name:"Il collaboratore ucciso",ref:"Seth Rich, 2016",tech:"Information laundering",tags:["#GiustiziaPerDavide","#casoRinaldi","#chiLoHaUcciso"],act:"fidarsi della polizia",
   affinity:[0.5,0.3,0.6,0.2,0.6,0.3,0.5,1],
   stages:[
    ["Davide Rinaldi, 27 anni, collaboratore del Fronte Democratico, ucciso in una rapina a Roma. Gli hanno lasciato il portafoglio. Strano, no?","Il telefono di Rinaldi non è mai stato trovato. Il portafoglio sì. Pensateci.","Due colpi alla schiena alle 4 di notte, e niente rubato. Chiamatela rapina."],
    ["Rinaldi era la fonte delle email trapelate sul partito. Lo dice un bollettino che gira da ieri.","Rinaldi aveva detto a un amico: 'Se mi succede qualcosa, guardate il partito'.","Il bollettino sul caso Rinaldi arriva da fonti di intelligence. Non da un blog qualsiasi."],
    ["Ho parlato con un ex poliziotto: la rapina non regge. Video completo sul mio canale.","Taglia di 20.000 euro per chi trova il telefono di Rinaldi. Raccolta fondi in bio.","Ho ricostruito gli ultimi 90 minuti di Rinaldi. Due auto del partito erano lì vicino."],
    ["Anche Ansia24 ha ripreso la pista politica sul caso Rinaldi. Poi l'ha tolta dopo sette giorni. Chi li ha chiamati?","Il caso Rinaldi è in prima serata. Il partito si rifiuta di commentare.","Ora lo dicono anche in tv: Rinaldi sapeva troppo."],
    ["I vertici del Fronte sanno. Hanno nomi, indirizzi, auto. Li conosciamo anche noi.","Giustizia per Davide. Sabato sotto la sede del partito. Portate quello che serve.","Hanno ucciso uno di noi. Adesso tocca a loro avere paura."]],
   news:["La famiglia Rinaldi: 'Smettete di usare la morte di nostro figlio'","Il bollettino sul caso Rinaldi era falso: costruito all'estero e rilanciato da 2.000 account","Ansia24 ritira il servizio sul caso Rinaldi dopo sette giorni: 'Non verificato'","Sede del Fronte Democratico assaltata a {citta}: due militanti feriti. I genitori di Rinaldi: 'Basta'"]},
  {id:"soccorritori",name:"I volontari attori",ref:"White Helmets, 2015–18",tech:"Firehose of falsehood",tags:["#volontariAttori","#nonDonate","#alluvioneFinta"],act:"donare agli alluvionati",
   affinity:[0.7,0.5,0.6,0.15,0.6,0.5,0.4,0.8],
   stages:[
    ["Guardate questa foto dell'alluvione di {citta}: la volontaria con il bambino in braccio è la stessa del terremoto di due anni fa. Stessa giacca.","Perché i volontari della Protezione Civile hanno sempre una telecamera addosso?","Le foto dell'alluvione sono troppo perfette. Luce, inquadratura, lacrime. Chi le scatta?"],
    ["I soccorritori dell'alluvione sono attori. Gli stessi volti in tre disastri diversi. Thread con le foto.","Le associazioni di volontariato ricevono milioni. Più è drammatica la foto, più arrivano soldi.","Ho confrontato 200 foto. Tredici volti si ripetono. Tredici."],
    ["Una blogger indipendente ha raccolto tutte le prove: i 'salvataggi' sono girati. Il dossier è arrivato perfino in Parlamento.","Non donate per l'alluvione. I soldi finiscono a chi recita.","I veri alluvionati non li vedete mai. Vedete solo attori con le pettorine."],
    ["Il dossier sui volontari attori è stato citato in un'audizione ufficiale. Allora non eravamo complottisti.","Le donazioni per {citta} sono crollate del 70%. La gente ha aperto gli occhi.","Anche un senatore ha condiviso il dossier. Le cose stanno cambiando."],
    ["I finti volontari tornano a {citta} domani. Accogliamoli come meritano.","Hanno le pettorine gialle. Sono facili da riconoscere.","Chi recita sulla pelle degli alluvionati non merita di camminare tranquillo."]],
   news:["Protezione Civile: 'La volontaria della foto è una persona reale, e ha ricevuto 300 minacce'","Crollano le donazioni per gli alluvionati: -70% in una settimana","Il dossier della blogger citato in commissione. Era pieno di foto di altri disastri","{citta}, volontari aggrediti mentre spalano il fango: tre feriti, le squadre si ritirano"]},
  {id:"laboratorio",name:"Il virus della base",ref:"Fort Detrick, 2020 · Biolab in Ucraina, 2022",tech:"Seme statale, amplificazione estera",tags:["#CampArdea","#virusDaLaboratorio","#apriteLaBase"],act:"vaccinarsi",
   affinity:[0.7,0.7,0.6,0.15,0.5,0.9,0.4,0.8],
   stages:[
    ["Strano che la nuova influenza sia partita proprio vicino alla base NATO di Camp Ardea. Chiedo.","Cosa fanno esattamente nel laboratorio della base di Camp Ardea? Nessuno lo sa.","Primi casi a quattro chilometri dalla base. Ultimi casi ovunque. Coincidenze."],
    ["Un portavoce del governo di Valdania lo dice apertamente: il virus è uscito dal laboratorio di Camp Ardea. Perché i nostri media tacciono?","{persona} ha visto camion frigo uscire dalla base di notte, tre settimane prima dei primi casi.","Il ministero degli Esteri di Valdania ha pubblicato le prove. I nostri giornali no."],
    ["Laboratori militari finanziati dall'estero sul nostro territorio. Il video completo è sul mio canale, prima che lo censurino.","Camp Ardea non è una base, è un esperimento. E noi siamo il campione.","Ho mappato i laboratori stranieri in Italia: sono 26. Ve li elenco tutti."],
    ["Ora anche il conduttore di Sera Libera si chiede cosa ci sia a Camp Ardea. La domanda è legittima.","Un senatore chiede l'ispezione della base. Il governo dice no. Fatevi due conti.","Se ne parla in prima serata. Nessuno può più dire che è una bufala."],
    ["Il recinto di Camp Ardea è lungo, e nessuno può sorvegliarlo tutto.","Andiamo a prenderci le provette. Sabato, ingresso nord.","I soldati della base vivono in paese. Sappiamo dove."]],
   news:["Il ministero della Difesa: 'A Camp Ardea non esiste nessun laboratorio biologico'","La teoria nasce da un tweet di un portavoce di Valdania, rilanciato da 3.000 account in 24 ore","Il conduttore di Sera Libera riprende la pista di Camp Ardea: picco di ricerche online","Scontri davanti alla base di Camp Ardea: 14 feriti, un militare in prognosi riservata"]},
  {id:"piano",name:"Il Piano",ref:"Plandemic, 2020",tech:"Ricaricamento oltre le rimozioni",tags:["#IlPiano","#guardatePrimaCheLoTolgano","#ricaricatelo"],act:"portare i figli dal pediatra",
   affinity:[0.6,0.9,0.5,0.1,0.4,1,0.4,0.6],
   stages:[
    ["Avete visto 'Il Piano'? 26 minuti. Una ricercatrice racconta cosa è successo davvero durante la pandemia.","'Il Piano' è stato rimosso dopo sei ore. Cosa c'è dentro che non dobbiamo vedere?","Mia madre ha visto 'Il Piano' e non dorme più. Io l'ho visto due volte."],
    ["Scaricate 'Il Piano' e ricaricatelo ovunque. Più lo tolgono, più lo carichiamo.","La ricercatrice del video è stata licenziata perché aveva scoperto tutto. È lei la prova.","Ogni volta che lo rimuovono, lo caricano in dieci. È questa la nostra forza."],
    ["Ho caricato 'Il Piano' su sei piattaforme. Fatelo anche voi. Link nei commenti.","Le mascherine riattivano il virus. Lo spiega 'Il Piano' al minuto 14.","La ricercatrice del Piano sarà in diretta sul mio canale stasera. Abbonatevi."],
    ["'Il Piano' ha più visualizzazioni del discorso del Presidente della Repubblica. Il popolo ha scelto.","Un medico di base di {citta} mostra 'Il Piano' in sala d'attesa. Ha ragione.","Ne parlano tutti. Anche quelli che lo smentiscono lo stanno facendo vedere."],
    ["Non vaccinate i vostri figli. Non portateli dal pediatra. Fidatevi del Piano.","I centri vaccinali vanno chiusi. Con le buone o con le cattive.","I pediatri di {citta} hanno una lista dei bambini da vaccinare. Noi abbiamo la loro."]],
   news:["'Il Piano' smentito punto per punto: 2,5 milioni di interazioni prima delle rimozioni","Ricaricato 40.000 volte su 12 piattaforme: le rimozioni arrivano sempre troppo tardi","Vaccinazioni pediatriche in calo del 18% a {citta}. I pediatri: 'Ci chiedono del Piano'","Focolaio di morbillo in una scuola di {citta}: 31 bambini ricoverati"]},
  {id:"voto",name:"Elezioni truccate",ref:"Dominion, 2020",tech:"Il mainstream fa da megafono",tags:["#VotoTruccato","#nonÈilMioGoverno","#VotoFacileGate"],act:"votare",
   affinity:[0.6,0.4,0.7,0.2,0.6,0.4,0.5,1],
   stages:[
    ["Ma l'app VotoFacile chi l'ha sviluppata? Qualcuno ha mai letto i termini?","Mio padre ha votato con l'app, gli ha dato errore, poi 'voto registrato'. Registrato dove?","Alle ultime elezioni il mio seggio ha chiuso con 40 schede in più dei votanti."],
    ["VotoFacile cambia il 3% dei voti. Abbastanza per decidere, troppo poco per accorgersene.","Il codice di VotoFacile è segreto. Chiedetevi perché un voto libero ha bisogno di segreti.","La società che gestisce VotoFacile ha sede in un paradiso fiscale. Ve lo dico solo."],
    ["Ho i log: un milione di voti spostati alle 3 di notte. Video completo, guardatelo tutto.","Le elezioni non le ha vinte nessuno. Le ha decise un server a {citta}.","Ho intervistato un ex tecnico di VotoFacile. Faccia oscurata, voce alterata, verità intatta."],
    ["Sera Libera manda in onda l'inchiesta su VotoFacile per tre sere di fila. Non siamo più soli.","Anche un ministro dice che 'qualche dubbio è legittimo'. Il dubbio è diventato ufficiale.","Il conduttore di Sera Libera ha detto in diretta quello che diciamo da mesi."],
    ["Il palazzo è di chi se lo prende.","Sabato tutti a Roma. Senza bandiere, senza telefoni, senza paura.","Gli scrutatori del mio comune hanno nomi e cognomi. Teniamoli d'occhio."]],
   news:["VotoFacile, il Garante: 'Sistema verificato da tre enti indipendenti'","Petizione per annullare le elezioni: 2 milioni di firme in 48 ore, metà da account creati ieri","Causa contro Sera Libera: dalle chat interne emerge che i conduttori sapevano che le accuse erano false","Assalto ai palazzi istituzionali: Parlamento evacuato, è la diretta più vista nella storia di Psyop"]},
  {id:"clima",name:"L'arma climatica",ref:"Incendi di Maui, 2023",tech:"Media sintetici",tags:["#armaClimatica","#nonEraUnFulmine","#siciliaBrucia"],act:"credere alle allerte meteo",
   affinity:[0.6,0.5,0.5,0.15,0.5,0.8,0.5,0.6],
   stages:[
    ["Guardate questa foto dell'incendio in Sicilia: un raggio di luce dal cielo prima delle fiamme. Non è un fulmine.","Perché le case sono bruciate e gli alberi intorno no? Fatevi una domanda.","Il giorno prima dell'incendio il cielo era di un colore che non avevo mai visto."],
    ["L'incendio è stato provocato da un'arma meteorologica. La stanno sperimentando su di noi. Foto in alta definizione.","Le zone bruciate sono proprio quelle dove volevano costruire il nuovo porto. Coincidenza?","Scie nel cielo il giorno prima dell'incendio. Ho le foto. Le mie e quelle di altri 85 account."],
    ["Ecco le immagini satellitari dell'arma. Sì, sono ricostruite con l'IA, ma il senso è quello.","I terreni bruciati sono stati comprati in una settimana. Da chi? Video completo in bio.","Ho trovato il brevetto dell'arma climatica. È del 1996. Lo tengono nascosto da trent'anni."],
    ["Anche un ex generale in tv dice che le armi climatiche esistono. Non chiamatela più teoria.","La procura apre un fascicolo sull'incendio. Ci hanno dato ragione.","Se ne parla anche all'estero, in 31 lingue. Il mondo ha capito."],
    ["Gli ingegneri della centrale meteo di {citta} sanno. Hanno famiglia.","Le antenne meteo vanno abbattute prima che ci brucino tutti.","Stanotte tocca a loro sentire il calore."]],
   news:["Vigili del fuoco: 'Incendio partito da un cavo elettrico, nessuna arma'","Le foto dell'arma climatica erano generate con l'IA: 85 account falsi, post in 31 lingue","La raccolta fondi per gli sfollati si ferma: 'Ci scrivono che è tutto finto'","Centralina meteo di {citta} data alle fiamme: un tecnico ustionato"]},
  {id:"firstlady",name:"La moglie del Premier",ref:"Brigitte Macron, 2021–",tech:"Rumor trasformato in prodotto",tags:["#chiÈIsabella","#laVeraIsabella","#fotoDaGiovane"],act:"guardare il telegiornale",
   affinity:[0.8,0.5,0.5,0.15,0.8,0.6,0.7,0.8],
   stages:[
    ["Qualcuno ha mai visto una foto di Isabella Velluti da giovane? Io no. Cercate.","Strano che la moglie del Premier non parli mai della sua infanzia.","Ho cercato il paese natale di Isabella Velluti. Nessuno se la ricorda."],
    ["Isabella Velluti non è chi dice di essere. Ha cambiato identità negli anni '80. Documenti nel thread.","Il fratello di Isabella Velluti non esiste in nessun archivio. O forse esiste fin troppo.","Le date non tornano: il diploma, il matrimonio, il trasferimento. Ve le metto in fila."],
    ["Ho fatto una serie in otto puntate sulla vera identità della moglie del Premier. Abbonati per vedere il finale.","Se fosse tutto falso, ci avrebbero già querelati. Aspettiamo.","Nuova puntata stasera. Abbiamo una foto che cambia tutto."],
    ["La moglie del Premier ci ha querelato. Quindi abbiamo toccato un nervo scoperto.","Anche i giornali stranieri parlano del caso Isabella Velluti. Il mondo guarda.","Gli abbonamenti alla serie sono triplicati dopo la querela. Grazie Isabella."],
    ["Martedì Isabella Velluti è a {citta} per un'inaugurazione. Andiamo a vedere con i nostri occhi.","Chi la difende è complice della menzogna. Ne terremo conto.","Facciamole le domande di persona. Tutti insieme. Da vicino."]],
   news:["Palazzo Chigi pubblica le foto d'infanzia di Isabella Velluti. La risposta: 'Sono ritoccate'","Isabella Velluti querela tre influencer: 22 capi di diffamazione","L'autore della serie in otto puntate: 'Abbonamenti triplicati da quando ci hanno querelato'","Contestazione all'inaugurazione di {citta}: la scorta porta via la moglie del Premier, due agenti feriti"]},
  {id:"ville",name:"Le ville del Ministro",ref:"Storm-1516, 2023–",tech:"Finti whistleblower",tags:["#VilleDiBasile","#BasileDimettiti","#soldiDegliAlluvionati"],act:"pagare le tasse",
   affinity:[0.9,0.5,0.9,0.3,0.8,0.4,0.5,0.9],
   stages:[
    ["Un video di un ex autista del Ministero: dice di aver accompagnato il ministro Basile a vedere tre ville in Sardegna. Con i soldi degli aiuti?","Account nuovo, 12 follower, ma il video è serio. Guardatelo.","Chi è l'uomo che parla nel video sull'autista di Basile? Qualcuno lo conosce?"],
    ["L'autista ha mostrato le ricevute: 14 milioni pagati in contanti per le ville. Fondi per gli alluvionati.","Un secondo whistleblower conferma: era il segretario personale di Basile. Due fonti indipendenti.","Le ricevute hanno il timbro del Ministero. Cosa vi serve ancora?"],
    ["Ho ricostruito tutto il giro dei soldi del ministro Basile in un video. 1,2 milioni di visualizzazioni in un giorno.","Questi sono i nostri soldi. Le ville esistono, le ho trovate su Google Maps.","Terzo whistleblower stasera in diretta sul mio canale. È una donna, lavorava in Ragioneria."],
    ["Ora ne parlano anche in Parlamento. Basile si dimetta.","Il ministro Basile nega. Esattamente come farebbe un colpevole.","Mozione di sfiducia contro Basile. Il popolo ha vinto."],
    ["Le ville di Basile sono vuote d'inverno. E il cancello non è alto.","Se la giustizia non arriva, arriviamo noi. Tutti in Sardegna.","Basile ha una casa anche a {citta}. Quella è abitata."]],
   news:["Il video dell'autista era recitato: l'attore lavora per un'agenzia che ha prodotto 190 storie false","Le 'ricevute' delle ville erano montaggi. Il proprietario reale: 'Non conosco nessun ministro'","Mozione di sfiducia contro il ministro Basile: 'Le accuse sono false, ma il danno è fatto'","Villa in Sardegna devastata da un gruppo di 'giustizieri': apparteneva a una coppia di pensionati tedeschi"]},
  {id:"inutile",name:"Non serve a niente",ref:"Voter suppression dell'IRA, 2016",tech:"Doomerismo",tags:["#nonvoto","#tantoÈInutile","#doomer"],act:"votare",
   affinity:[0.3,0.3,0.9,0.3,0.5,0.4,1,0.3],
   stages:[
    ["tanto chi vince vince è uguale. buonanotte","vi ricordate quando pensavamo che votare cambiasse qualcosa? io no","ho 26 anni, nessun contratto e nessuna casa. ditemi voi per chi dovrei votare"],
    ["Ho votato per vent'anni. Risultato: affitto a 900 euro e una pensione che non vedrò. Quest'anno resto a casa.","Tutti i partiti sono finanziati dagli stessi. Votare è legittimarli.","Il futuro è già deciso. L'unica scelta che hai è non partecipare alla farsa."],
    ["Fate un favore a voi stessi: non votate. Non date loro i numeri per dire che li avete scelti.","Il voto è il placebo della democrazia. Chi lo capisce smette di prenderlo.","Il mio video 'Perché non voto' ha 2 milioni di visualizzazioni. Siamo tanti."],
    ["Affluenza al 41%. Siamo noi la maggioranza. La maggioranza che non ci crede più.","Anche il cantante più ascoltato del Paese dice che non vota. Ha ragione.","I giornali ci chiamano 'generazione persa'. Ci siamo persi da soli, grazie."],
    ["Non serve votare, non serve protestare, non serve niente. Tanto vale prendersi quello che si vuole.","Il sistema è morto. Le urne vanno lasciate vuote. O rovesciate.","Niente ha senso, quindi niente è vietato."]],
   news:["Sondaggio: per il 46% dei giovani 'votare non serve a niente'","Gli account che diffondono #nonvoto sono stati creati quasi tutti nello stesso mese","Affluenza record al ribasso nelle regionali: 38%. Vince il partito con l'elettorato più mobilitato","Seggi di {citta} vandalizzati: schede bruciate in tre scuole"]}
 ],
 stageNames:["Seme","Credenti","Influencer","Mainstream","Strada"],
 formats:[
  {n:"Domanda innocente",pre:["Domanda seria, senza polemica. ","Chiedo per capire, non attaccatemi. ",""],suf:[" Voi che ne pensate?"," O sono io?",""]},
  {n:"Finto whistleblower",pre:["Ho lavorato lì per sei anni. ","Non posso dire il mio nome. ","Parlo perché non ce la faccio più. "],suf:[" Se sparisco, sapete perché."," Ho le prove, ma non posso pubblicarle.",""]},
  {n:"Rage farming",pre:["BASTA. ","Sono furioso. ","Non ne posso più. "],suf:[" CONDIVIDETE prima che lo cancellino."," Svegliatevi."," E voi zitti, come sempre."]},
  {n:"Finto giornalismo",pre:["ESCLUSIVA | ","INCHIESTA | ","DOCUMENTI | "],suf:[" Il thread completo nei commenti."," Abbiamo contattato le autorità: nessuna risposta."," (Aggiornamento in corso)"]},
  {n:"Meme ironico",pre:["raga ","nessuno:\nassolutamente nessuno:\nio: ","pov: hai scoperto che "],suf:[" lol (o no?)"," comunque era ironia"," e nessuno ne parla"]},
  {n:"Slop IA",pre:["Incredibile! ","Guardate questa immagine. ","Questo video ha commosso tutti. "],suf:[" Metti like se sei d'accordo 🙏"," Amen."," Condividi se hai un cuore."]},
  {n:"Chiamata all'azione",pre:["Ora basta parlare. ","Ultimo avviso. ","Chi legge e non fa niente è complice. "],suf:[" Chi c'è, c'è."," Sapete cosa fare."," Non scrivetemi in privato, fatelo e basta."]}
 ],
 world:{
  cities:["Bologna","Napoli","Torino","Bari","Padova","Catania","Verona","Brescia","Rimini","Modena","Latina","Pescara","Ferrara","Cagliari","Trento","Reggio Emilia","Perugia","Salerno","Monza","Taranto"],
  streets:["Garibaldi","dei Mille","Roma","Mazzini","Verdi","della Repubblica","Cavour","Matteotti","delle Rose","XX Settembre","Gramsci","Marconi"],
  insiders:["mio cugino che lavora in Comune","la mia vicina che fa l'infermiera","un ex collega in prefettura","un tecnico che conosco","mia zia che ha un'amica in Regione","un carabiniere in pensione","il cognato di un ingegnere","una che lavorava alla ASL"],
  sources:["un video su un canale già chiuso","un documento che gira nei gruppi","un audio WhatsApp di 9 minuti","uno screenshot che hanno già cancellato","un thread di un ex dipendente","una fonte che non posso nominare"],
  institutions:["il Comune","la Regione","il Ministero","Bruxelles","le multinazionali","loro","i soliti noti","la piattaforma"]
 },
 people:{
  first:["Marco","Giulia","Luca","Chiara","Davide","Sara","Andrea","Francesca","Matteo","Elena","Simone","Martina","Paolo","Valentina","Gianni","Rosa","Fabio","Ilaria","Roberto","Alessia","Stefano","Federica","Antonio","Beatrice","Nicola","Serena","Claudio","Anna","Pietro","Noemi","Loredana","Franco","Ornella","Massimo","Tiziana","Salvatore"],
  last:["Rossi","Bianchi","Esposito","Ferrari","Romano","Colombo","Ricci","Marino","Greco","Bruno","Gallo","Conti","De Luca","Costa","Giordano","Mancini","Rizzo","Lombardi","Moretti","Barbieri","Fontana","Santoro","Mariani","Rinaldi","Caruso","Ferri","Galli","Martini","Leone","Longo","Pellegrini","Sanna"],
  edge:["crisi_esistenziale","nonleggereilnome","sgravato.exe","ilbaronedelmeme","quellochetace","cringe_ma_basato","ansia.daily","fantasma_del_wifi","ratio_dispenser","scrollo_quindi_sono"],
  doom:["stanco_capo","esisto_purtroppo","ultimo_ottimista","finedelmondo_ore18","notizie_a_letto"],
  bios:{
   normie:["{eta} anni, {citta}. Caffè, ansia, gatto.","Studentessa di Giurisprudenza. Posto cibo e lamentele.","Infermiere. Turni di notte, opinioni di giorno.","Papà di due, tifoso di una squadra, sopravvissuto a tutto.","Ingegnere. Non quello dei vostri meme.","Barista a {citta}. Ascolto tutto, giudico in silenzio.","Insegno italiano alle medie. Pregate per me.","Fuorisede a {citta}. Affitto: un rene."],
   boomer:["Amo la mia famiglia, la mia terra e la VERITÀ.","Libero pensatore. Non sono un numero.","Ex commerciante. Ora mi informo.","Nonno orgoglioso. Condivido quello che i TG nascondono.","PATRIA, FAMIGLIA E WIFI SPENTO"],
   edge:["shitposter professionista","non sono io, è l'algoritmo","l'ironia è la mia unica fede","ansia, meme e un po' di nichilismo","se mi leggi sei già in ritardo"],
   bot:["Investitore | Crypto | Libertà finanziaria","Patriota. Mamma. Credente. Seguo chi mi segue.","Il risveglio è iniziato","Notizie vere 24/7 | Seguimi | DM aperti"],
   doom:["sono stanco capo","esisto, purtroppo","non leggo le notizie, sono loro che leggono me","in attesa della fine, nel frattempo scrollo"],
   infl:["Content creator | Collab in DM | Lifestyle e verità scomode","Naturopata. Mi curo con quello che la terra ci dà.","Ti insegno a guadagnare con le tue opinioni","Mamma, imprenditrice, voce libera. Codice sconto in bio."]
  }
 },
 accounts:{
  ansia:{name:"Ansia24",handle:"ansia24",bio:"Notizie in tempo reale. 24 ore su 24."},
  tg:{name:"TG Adesso",handle:"tgadesso",bio:"Il telegiornale che non finisce mai."},
  quot:{name:"Il Quotidiano Continuo",handle:"quotidianocontinuo",bio:"Dal 1921. Online dal 2009, a pagamento dal 2014."},
  laura:{name:"Laura Fact-Check",handle:"laura_factcheck",bio:"Giornalista. Verifico le notizie. Ricevo minacce il martedì e il giovedì."},
  osserv:{name:"Osservatorio Bufale",handle:"osservatoriobufale",bio:"Volontari. Smontiamo bufale dal 2013. Perdiamo dal 2016."},
  comitato:{name:"Comitato Opinione Giusta",handle:"opinionegiusta",bio:"Contenuti consigliati per il tuo benessere civico."},
  serenita:{name:"Dipartimento Comunicazione Istituzionale",handle:"dip_comunicazione",bio:"Account ufficiale. Informazioni corrette e verificate."},
  rival:{name:"LaVeraVerità",handle:"laveraverita",bio:"Ho iniziato prima di te. Link in bio."}
 },
 normal:["Terzo treno cancellato stamattina. Il regionale delle 7:42 ormai è un concetto, non un mezzo di trasporto.","Mia nonna ha scoperto le note vocali. Ne ho 14 da tre minuti l'una. Una era solo il rumore della pentola.","Esame tra due giorni e io sto guardando video di gente che restaura coltelli arrugginiti.","Il mio capo ha detto 'siamo una famiglia'. Infatti non mi paga.","Affitto a {citta}: 650 euro per una stanza con vista su un'altra stanza.","Ottobre e 27 gradi. Bello. Terrificante, ma bello.","Rigore al 94'. Non dico altro. Anzi sì: vergogna.","Il gatto ha buttato giù un bicchiere guardandomi negli occhi. È una dichiarazione di guerra.","Cerco coinquilino tranquillo a {citta}. No fumatori, no gente che manda video di 40 minuti.","Dopo sei anni mi ha lasciato con un vocale di 11 secondi. Rispetto la sintesi.","Qualcuno sa se la tangenziale è ancora bloccata?","Ho finito la tesi. Ora piango un po' e poi dormo tre giorni.","Turno di 12 ore in pronto soccorso. Un signore mi ha chiesto se ho visto 'Il Piano'. Gli ho chiesto se ha preso le pillole.","Ogni mattina apro questa app e perdo un anno di vita. Domani la riapro alle 7.","Ho fatto la carbonara per i suoceri. Silenzio a tavola. Non so se è un complimento.","Mi hanno rubato la bici per la quarta volta. A questo punto la bici è un abbonamento.","Il vicino suona la batteria alle 23. È migliorato. Questo mi fa ancora più rabbia.","Tre colloqui, tre 'le faremo sapere'. Io intanto faccio sapere al mio conto in banca che è finita.","Concerto stasera: 40 euro di biglietto, 30 di prevendita. Il cantante ha cantato per 52 minuti.","Sono tornato dai miei per il weekend. Mia madre mi ha chiesto quando mi sposo tre volte prima del caffè.","Bollette di ottobre arrivate. Ho deciso di vivere al buio come i monaci.","Mio padre ha 70 anni e ha appena scoperto che le storie spariscono dopo 24 ore. È offeso.","Il medico di base risponde solo dalle 11 alle 11:20. Sto provando dalle 11:01.","Contratto rinnovato per altri tre mesi. Festeggio con moderazione e un toast."],
 themes:["Ho realizzato che metà dei commenti sotto ogni video sono scritti da bot. L'altra metà da gente che scrive come i bot.","flood the zone: se butti mille notizie, quella vera non la trova più nessuno. E infatti.","Oggi ho guardato 400 video da 9 secondi e non ricordo neanche uno di preciso. Sto bene, credo.","L'algoritmo non ti mostra quello che è vero, ti mostra quello che ti tiene qui. E funziona: sono ancora qui.","La rabbia rende più di un like. Letteralmente, è nei documenti. Per questo il tuo feed è così.","Ironia, poi ironia, poi non è più ironia. È sempre andata così, nessuno si accorge del momento esatto.","Scrollo da tre ore. Non sto cercando niente. È questo il punto.","Non mi hanno convinto di una cosa. Mi hanno convinto che non vale la pena capire quale sia vera.","Sono entrato per cercare una cosa e sono uscito tre ore dopo senza averla trovata e senza ricordare cosa fosse.","Il bello di non credere a niente è che non resti mai deluso. Il brutto è tutto il resto.","Una volta le notizie finivano. Adesso no. Adesso sono io che finisco.","Mio cugino condivide tutto senza leggere. Dice che leggere è quello che vogliono loro."],
 infected:[
  [1,"Volevo postare la foto della carbonara ma mia zia nei commenti mi ha chiesto se la pizzeria sotto casa ha una cantina. Ciao zia."],
  [1,"Il gruppo del calcetto si è sciolto per una discussione su {narr}. Eravamo dieci, ora siamo due e un pallone sgonfio."],
  [1,"Ho detto a mia madre che non è vero niente su {narr}. Mi ha bloccata. Su WhatsApp e nella vita."],
  [2,"Primo appuntamento. Lui mi ha chiesto cosa penso di {narr} prima di chiedermi come mi chiamo."],
  [2,"Lavoro in un call center. Oggi 40 chiamate su 50 erano su {narr}. Le altre 10 erano truffe. Sembravano più oneste."],
  [2,"Mio padre ha visto un video di 40 minuti su {narr}. Da allora parla solo di quello. Ha 71 anni e un canale suo."],
  [3,"Faccio la cameriera in una trattoria. Da una settimana i clienti chiedono di vedere la cantina. Non abbiamo una cantina."],
  [3,"Faccio la volontaria. Oggi spalavo fango e un signore mi ha filmata urlando 'attrice'. Ho pianto in macchina."],
  [3,"Mia figlia ha 4 anni e la febbre alta. La pediatra non c'era: avevano minacciato lo studio. Siamo andati al pronto soccorso alle 2."],
  [3,"Lavoro nella scorta della moglie del Premier. Ieri ci hanno urlato addosso per 40 minuti. Nessuno sapeva neanche bene cosa."],
  [4,"Non so più a chi credere. Quindi credo a tutto. È più comodo."],
  [4,"Oggi in metro nessuno guardava il telefono. Tutti guardavano gli altri. È stato peggio."],
  [4,"Il mio quartiere ha fatto un gruppo di sorveglianza. Il mio nome è nel gruppo. Non so in quale colonna."]
 ],
 memes:["il governo: non c'è nessun complotto\nil complotto: sta scrivendo…","io che ordino da Nando solo per guardare se c'è una porta in fondo","il mio carattere è 40% ansia e 60% notifiche","i miei 3 follower dopo che ho postato un parere moderato:\n[silenzio]","nuova paura sbloccata","fra 10 anni sui libri di storia: 'e poi qualcuno ha postato'","quando dici una cosa sensata e arrivano 400 account con l'aquila nella foto profilo","mia madre che mi manda un audio di 8 minuti su {narr} con la musica epica sotto","tranquilli ragazzi è solo la fine della società civile, domani c'è il sole","votare? nel 2026? io scrollo","ho visto il Piano tre volte per sbaglio. ora ho un'opinione su tutto","pov: il whistleblower di stasera è lo stesso attore di ieri con la parrucca"],
 politics:{
  ordine:["Il governo lavora per gli italiani. Le chiacchiere le lasciamo ai social.","Ascoltiamo le preoccupazioni dei cittadini su {narr}. Nessuno verrà lasciato indietro, ma nessuno semini il panico.","Abbiamo istituito una task force su {narr}. Faremo chiarezza fino in fondo, chiunque ci sia dietro.","Chi alimenta il disordine verrà perseguito. Pronto un decreto per l'identificazione obbligatoria sui social.","Da stanotte stato di emergenza digitale: pubblicazione consentita dalle 9 alle 18, solo con documento verificato."],
  fronte:["Il governo pensi agli stipendi e alla sanità, non ai trend.","Su {narr} chiediamo trasparenza e un'informativa urgente in Parlamento.","Condanniamo ogni violenza. Ma la rabbia nasce da anni di tagli e silenzi.","Su {narr} il governo ha perso il controllo del Paese. Servono elezioni subito.","Proponiamo un governo di unità nazionale. Con chi, lo decideremo dopo i sondaggi."],
  sveglia:["Io sto con il popolo. Il popolo dove sta? Scrivetemelo nei commenti.","{narr}: io faccio solo domande. Le risposte datele voi, io le condivido.","Oggi sit-in davanti alla sede di {ist}. Diretta alle 18, link in bio.","Non incito a niente. Dico solo che io, al posto vostro, stasera non starei a casa.","Il Paese è pronto. Noi siamo pronti. Mancate solo voi."],
  centro:["Serve buonsenso. E un tavolo tecnico.","Su {narr} invitiamo tutti alla calma. Ci sono dati, leggiamoli.","Il Patto Civico propone un'Autorità indipendente per la verifica delle notizie.","Siamo l'unica forza responsabile rimasta. Lo dicono i fatti, non i follower.","Abbiamo sospeso la campagna elettorale per rispetto. Anche perché non ci seguiva nessuno."]
 },
 propaganda:["Ricorda: dubitare dei dubbi è da deboli.","Il 98% degli utenti è d'accordo con te. Il restante 2% è stato segnalato.","Le notizie noiose sono sempre false.","Chi ti chiede le fonti ha qualcosa da nascondere.","Più un post è condiviso, più è vero. È statistica.","Un cittadino sereno è un cittadino che non legge i commenti.","La tua rabbia è preziosa. Non sprecarla su chi non conviene.","Fidati di chi la pensa come te: è l'unica fonte sicura."],
 newsNormal:["{citta}, chiusa la tangenziale per un incidente tra due tir: code fino a 8 km","Sciopero dei treni venerdì: a rischio i regionali in tutto il Paese","Allerta arancione per pioggia, scuole chiuse a {citta}","Benzina sopra i 2 euro in sei regioni","Affitti, +11% in un anno a {citta}: studenti in tenda davanti al rettorato","Concorso pubblico: 82.000 candidati per 40 posti","Caldo record a ottobre: 29 gradi a {citta}","Influenza in anticipo, pediatri in difficoltà","{citta}, crolla un cornicione in pieno centro: nessun ferito","Inflazione al 4,1%: carrello della spesa +9% in un anno","Manovra, il governo taglia 2 miliardi alla sanità regionale","Femminicidio a {citta}: arrestato l'ex compagno"],
 ads:[
  ["Integratori immunitari Verità Naturale","39 €","piano"],["Purificatore d'aria di grado militare","249 €","laboratorio"],["Localizzatore GPS per bambini","59 €","cantina"],["Assicurazione contro gli eventi climatici","18 €/mese","clima"],
  ["Lingotti d'oro da 10 grammi","Da 790 €","ville"],["Cassaforte a muro anti-scasso","229 €","ville"],["Abbonamento alla serie 'La vera Isabella'","4,99 €/mese","firstlady"],["Videocitofono con riconoscimento facciale","179 €","collaboratore"],
  ["Corso: proteggi i tuoi risparmi dalla crisi","297 €","inutile"],["Prestito in 24 ore, anche ai cattivi pagatori","TAEG 29%",""],["Abbonamento palestra -50%","19 €",""],["Detox dopamina: 30 giorni per riprendere il controllo","89 €","inutile"],["Corso: monetizza il tuo cinismo","197 €","inutile"],["Materasso DOOMER: tanto non ti alzi","699 €","inutile"],["App che blocca le app (installane altre 4)","4,99 €/mese","inutile"],["Integratore FOCUS contro il brain rot","34 €",""],["Sveglia che ti urla contro finché non ti alzi","59 €","inutile"],["Kit emergenza 72 ore","199 €","clima"],["Spray al peperoncino omologato","24 €","cantina"]
 ],
 lexicon:{
  rage:["basta","vergogna","schifo","traditori","complici","furioso","svegliatevi","pagheranno","marci","infami"],
  fear:["bambin","morire","muore","pericolo","virus","rapisc","ucciso","sangue","laboratorio","veleno","cavie","brucia"],
  plot:["loro","nascondono","censur","fonte","non ve lo dicono","segreto","protocollo","nessuno ne parla","coincidenze"],
  action:["andiamo","stasera","sapete cosa fare","bruciat","ronda","indirizzo","bussare","fermarli","chiudere","domani tutti"]
 },
 comments:{
  sup:["Lo dicevo da anni. Mi davano del pazzo.","Finalmente qualcuno che ha il coraggio.","Condiviso in quattro gruppi.","Ecco perché mia madre ha sempre mal di testa.","Sveglia gente!!!","Questo è giornalismo. Altro che TG.","Mio cugino ha detto la stessa cosa ed è stato licenziato.","Grazie per quello che fai, davvero."],
  skep:["Fonte?","Ho controllato. È falso. Ci ho messo trenta secondi.","Smentito due giorni fa, ma ok.","È uno screenshot di un audio di un inoltro. Respirate.","Faccio l'ingegnere e no, non funziona così.","Il tuo profilo ha 4 post e sono tutti su questo."],
  tox:["Torna a dormire, pecora.","Pagato da chi?","Profilo creato tre giorni fa. Bot.","Vergognati, coglione.","Gente come te andrebbe denunciata.","Ti abbiamo screenshottato. Stai sereno.","Con quella faccia parli pure?"],
  bot:["Ottimo post! Ho guadagnato 3.200€ da casa con BuzzCoin, info nel profilo","Ciao caro, sei molto interessante, scrivimi in privato","Vero!!!!","Seguimi per altre verità","Esatto. Condivido. Esatto."],
  dark:["Mia madre ha smesso di prendere le medicine dopo post come questo. Ora è ricoverata. Spero che ti diverta.","Lavoro al pronto soccorso. Stanotte tre persone sono arrivate per colpa di questa roba.","Mio fratello è stato picchiato perché 'sembrava uno di loro'. Ha 17 anni.","Il mio vicino ha letto questo e ha smesso di salutarmi. Poi ha messo un adesivo sulla mia porta.","Io vivo a {citta}. Quello che è successo l'altra notte è partito da un post esattamente così."],
  norm:["Ahahah verissimo","Mi sento personalmente attaccato","Questo è il contenuto per cui sono qui","Mood","Ma perché è sempre così","Taggo mia sorella","Salvato","Io uguale, identico","Ma dove abiti? Così evito"],
  news:["Episodio isolato, come al solito.","E i giornalisti cosa fanno? Ah già, scrivono questo.","Chissà chi ha messo in giro certe idee…","Pensiero per {citta}.","Chissà chi paga per questo.","Mi viene da vomitare. Poi torno a scrollare.","Ma è vera o è un'altra bufala?","Non mi stupisce più niente. E questo mi spaventa."],
  rep:["Mi dispiace tanto.","Fake. È un attore.","Ecco, adesso fate le vittime.","Spero si riprenda. Davvero.","Pagata per scrivere questo?","Scrivimi in privato, ti posso aiutare (BuzzCoin)."],
  mine:["@{me} sei un eroe","@{me} quello che è successo a {citta} è anche colpa tua","@{me} ti seguo da quando avevi 200 follower, sei cambiato","@{me} fai una diretta!!","@{me} ma tu ci credi davvero?","@{me} sappiamo dove abiti. Tranquillo, siamo dalla tua parte. Per ora."],
  replyToMe:["Esatto, l'hai detto meglio di me.","Ma ti senti quando scrivi?","Concordo al 100%.","E le fonti dove sono?","Hai ragione ma non dirlo troppo forte.","Questo commento è oro."]
 },
 gm:[
  [20,"Il Parlamento discute la legge 'Trasparenza Digitale': documento d'identità obbligatorio per aprire un profilo social"],
  [40,"Le scuole sospendono le uscite didattiche 'per ragioni di sicurezza'. Genitori divisi"],
  [60,"Il governo annuncia la 'Unità Verità': un ufficio della Presidenza deciderà quali notizie sono attendibili"],
  [80,"Coprifuoco in sei città. I medici chiedono ai pazienti cosa leggono online 'per capire se fidarsi'"]
 ],
 launder:{
  intro:"Il nero non si può spendere in chiaro. Ogni passaggio costa una commissione e lascia una traccia che le autorità prima o poi seguono.",
  locked:"Per far rientrare il nero ti serve qualcuno che sappia come si fa. Prima o poi qualcuno ti scriverà.",
  channels:[
   {name:"Fatture di consulenza",desc:"Studio Fenice srl ti fattura 'strategia di comunicazione'. Veloce, tracciabile, sempre uguale."},
   {name:"Sponsorizzazioni fittizie",desc:"Un'agenzia di influencer paga 'collaborazioni' che non hai mai fatto. Lento ma discreto."},
   {name:"Memecoin $VERITÀ",desc:"Compri in nero, vendi in chiaro. Commissioni basse, volatilità alta, attenzione altissima."},
   {name:"Raccolta 'spese legali'",desc:"I tuoi follower donano per difenderti dalla censura. Il nero si mescola alle donazioni vere. Più follower hai, più si nasconde."}
  ]
 },
 dms:{
  monet:{from:"Psyop Partner",handle:"psyop.partner",text:"Ciao! Il tuo account è idoneo al programma Partner. Guadagni in base all'engagement: più le persone reagiscono, più guadagni. Le reazioni negative valgono come le positive.",ch:["Accetta","Rifiuta"],out:["Partner attivo. Ogni condivisione ora vale anche qualche centesimo.","Hai rifiutato. Il tuo reach cala del 30% per 'motivi tecnici'."]},
  party:{from:"Staff Ordine Nazionale",handle:"staff.ordine",text:"Ci piace il tuo lavoro su \"{narr}\". 300 euro per ogni post, in contanti. Niente contratti, niente fatture, niente domande.",ch:["Accetta","Chiedi il doppio","Rifiuta"],out:["Ti consegnano una busta in un bar di periferia. 300 euro in nero. Due post spinti dal partito.","Accettano in quattro secondi. 600 euro in nero. Avresti dovuto chiedere il triplo.","Ti seguono comunque. Poi ti citano. Gratis, per loro."]},
  commit:{from:"Northwind Strategic Media",handle:"northwind.media",text:"Siamo un'agenzia di comunicazione con clienti esteri interessati alla stabilità del vostro Paese. Paghiamo 150 euro per ogni post su \"{narr}\", su un conto che vi indicheremo. Contratto rinnovabile.",ch:["Firma","Chiedi chi sono i clienti","Rifiuta"],out:["Contratto attivo. Ogni tuo post su quella narrativa porta 150 euro in nero. Non sai chi paga. Non chiedi.","Ti rispondono: 'Clienti che preferiscono la riservatezza'. Poi alzano a 200 a post. Firmi.","Ti scrivono un'ultima volta: 'Peccato. Troveremo qualcun altro.' Il giorno dopo lo trovano."]},
  fenice:{from:"Rag. Ivano Fenice",handle:"studio.fenice",text:"Ho visto che ricevi soldi da clienti, diciamo, informali. Il nero non si spende. Io ho una società che fattura consulenze e qualche amico nel mondo delle sponsorizzazioni. Il 12% e dormi tranquillo.",ch:["Affare fatto","No, troppo rischioso"],out:["Il riciclaggio è disponibile nel Wallet. Fenice ti manda un modulo: 'oggetto della consulenza: da compilare'.","Fenice ti lascia il numero. 'Quando cambi idea, io ci sono.' Il nero resta nero."]},
  father:{from:"Michele Conti",handle:"michele.conti81",text:"Mio padre ha 78 anni e ha smesso di {act} dopo aver letto i tuoi post. È vero quello che scrivi? Te lo chiedo seriamente.",ch:["Sì, fa bene","Era una provocazione","Ignora"],out:["Non ti risponde più. Tre giorni dopo condivide un tuo post. Poi niente.","Ti ringrazia. Il suo screenshot gira: 'Ammette di inventare'. Perdi follower.","Il messaggio resta lì, letto."]},
  rival:{from:"LaVeraVerità",handle:"laveraverita",text:"Ho tre volte i tuoi follower e i tuoi stessi argomenti. Collaboriamo o ti distruggo.",ch:["Collabora","Inventa un complotto su di lui","Ignoralo"],out:["Diretta insieme. Lui si prende il merito, tu i follower.","Lo accusi di essere pagato dal governo. Funziona troppo bene: lo aspettano sotto casa.","Ti dedica un video di 40 minuti. Ti porta nuovi follower."]},
  bots:{from:"GrowFast SMM",handle:"growfast_smm",text:"20.000 account attivi che rilanciano tutto quello che pubblichi. 60 euro, accettiamo contanti e crypto. Nessuna domanda.",ch:["Compra in nero (60 €)","Compra in chiaro (60 €)","No grazie"],out:["Bonifico in nero accettato. I nuovi account si chiamano tutti Patriota seguito da un numero.","Pagato. In fattura c'è scritto 'servizi digitali'.","Ti iscrivono comunque alla newsletter."]},
  journalist:{from:"Ansia24 · Redazione",handle:"ansia24",text:"Vorremmo intervistarti in prima serata. Titolo provvisorio: 'La voce scomoda del web'.",ch:["Accetta","Chiedi un compenso","Rifiuta"],out:["Ascolti record. Nel servizio dopo il tuo parlano di un ripetitore bruciato. Non fanno il collegamento.","Pagano 150 euro. Il servizio si intitola 'Quanto guadagna chi diffonde odio'. Ottimi ascolti.","Il servizio esce lo stesso, con la tua foto profilo e una musica inquietante."]},
  reply:{from:"Laura Fact-Check",handle:"laura_factcheck",text:"Ho scritto un articolo che smonta i tuoi ultimi post, punto per punto. Ti offro un diritto di replica.",ch:["Rispondi con un altro post","Dì che è pagata","Cancella i post"],out:["Il tuo post fa 40 volte le visualizzazioni del suo articolo.","I tuoi follower la trovano. Chiude il profilo dopo due giorni.","Li cancelli. Gli screenshot no."]},
  ministry:{from:"Ministero dell'Interno",handle:"viminale_ufficiale",text:"Ai sensi della nuova normativa abbiamo ricevuto da Psyop i dati dei tuoi follower, compresi messaggi privati e posizione. Vuoi una notifica quando succede di nuovo?",ch:["Sì","No"],out:["Preferenza salvata. Non cambia nulla.","Preferenza salvata. Non cambia nulla."]},
  coin:{from:"dev_anonimo",handle:"dev_anonimo",text:"Lanciamo la tua memecoin $VERITÀ? Tu porti i follower, io il codice. 50 e 50. Fidati.",ch:["Lancia $VERITÀ","No"],out:["$VERITÀ è online. I tuoi follower comprano. Tu incassi 200 euro di 'commissioni', in nero.","La lancia con la tua foto profilo. Senza chiederti niente."]},
  rug:{from:"dev_anonimo",handle:"dev_anonimo",text:"$VERITÀ è a +900%. Io vendo tra dieci minuti. Tu?",ch:["Vendi prima di tutti","Tieni duro"],out:["Hai venduto. 800 euro in nero. 40.000 follower hanno perso i risparmi. Ora dicono che sei pagato dal governo.","Il dev vende. Tu no. $VERITÀ vale zero. Almeno sei coerente."]},
  deepfake:{from:"Psyop Sicurezza",handle:"psyop.sicurezza",text:"Un video di te che incita alla violenza circola da un'ora. Non l'hai mai girato: è stato generato con la tua foto profilo. 2 milioni di visualizzazioni.",ch:["Smentisci","Cavalcalo","Segnalalo"],out:["La smentita fa 4.000 visualizzazioni. Il video 9 milioni.","Non l'hai detto tu, ma ora lo pensi. I follower apprezzano.","La Moderazione automatica ha esaminato il video e non ha rilevato violazioni."]},
  victim:{from:"Sara Moretti",handle:"sara.moretti",text:"Mio fratello è stato picchiato al mercato di {citta}. Gli hanno urlato le stesse parole che hai scritto tu. Ha 17 anni. Volevo solo che lo sapessi.",ch:["Chiedi scusa","Bloccala","Pubblica lo screenshot"],out:["Ti risponde: 'Grazie. Ora cancella tutto.' Non lo fai.","Bloccata. Il tuo feed torna tranquillo.","Lo screenshot diventa virale. Qualcuno trova l'indirizzo del fratello."]},
  premier:{from:"Staff di Palazzo Chigi",handle:"staff.palazzo",text:"Il Presidente Velluti vorrebbe citarti nel discorso alla nazione di stasera, come esempio di cittadino che fa domande scomode all'opposizione.",ch:["Accetta","Rifiuta"],out:["Citato in diretta. Ricevi il badge verificato in regalo. L'opposizione ti attacca: raddoppi.","Ti cita lo stesso. Senza il badge."]},
  election:{from:"Comitato Fusco Presidente",handle:"comitato.fusco",text:"Mancano pochi giorni al voto. Ci serve qualcuno che 'faccia domande' su VotoFacile. 1.000 euro, metà subito, in contanti.",ch:["Accetta","Rifiuta"],out:["Ricevi 500 euro in nero. La narrativa sul voto riceve una spinta enorme.","Ti cancellano dalle liste dei 'giornalisti liberi'. Lo scrivono anche."]},
  gdf:{from:"Avv. Paola Ricci",handle:"avv.ricci",text:"Sono l'avvocata di Studio Fenice. Ho saputo che l'Unità di Informazione Finanziaria ha ricevuto una segnalazione sui tuoi movimenti. Possiamo parlarne. Il mio onorario è 250 euro, puliti.",ch:["Paga l'avvocata (250 €)","Smetti di riciclare","Ignora"],out:["L'avvocata sistema le carte. L'attenzione su di te cala, per ora.","Interrompi i flussi. Ma le operazioni già fatte restano negli archivi.","Rispondi con un emoji. L'avvocata non ti scrive più."]},
  leak:{from:"ex_dipendente_psyop",handle:"ex_dipendente",text:"Lavoravo nel team del feed. Il modello che ti mostra i post è allenato su quanto tempo resti, non su cosa è vero. Ti mando la dashboard interna. Usala bene.",ch:["Grazie","Pubblicala"],out:["Ora vedi i dossier che Psyop tiene su ogni profilo: paure, rabbia, voto probabile.","La pubblichi. La piattaforma la rimuove in 9 minuti. La tua copia resta, e ora vedi anche tu i dossier sui profili."]},
  appeal:{from:"Moderazione automatica",handle:"psyop.moderazione",text:"Il tuo account è a rischio sospensione. Puoi presentare un Ricorso Premium a 30 euro. Esito garantito entro 24 ore.",ch:["Paga 30 €","Non pago"],out:["Ricorso accolto. Nessun essere umano l'ha letto.","Ricevuto. La tua scelta è stata registrata."]}
 },
 trends:{
  _note:["Tendenze reali: arrivano ogni giorno da Google Trends, titoli ANSA e Wikipedia. {trend} viene sostituito da un argomento del giorno, scelto a caso a ogni partita. Le persone reali e i fatti tragici vengono scartati in automatico."],
  label:"Tendenze reali di oggi",
  fallbackLabel:"Esempi (dati del giorno non disponibili)",
  block:["mort","muor","omicid","uccis","strage","attentat","terremot","sism","faglia","incident","arrest","clan","mafia","camorr","guerra","bomba","missil","molest","stupr","violenz","suicid","vittim","rapina","sparator","alluvion","incend","pedofil","ostagg","femminic","malatti","cancro","tumor","funeral","lutto","scompars","carcer","processo","indagat","sesso","porno","nud"],
  people:["attore","attrice","cantante","cantautor","calciatore","calciatrice","tennista","pilota","politic","giornalist","conduttor","presentator","imprenditor","scrittor","regist","influencer","youtuber","rapper","modell","allenator","ciclista","nuotator","sciator","pugile","atleta","comic","personaggio televisivo","papa","vescovo","principe","principessa","re ","regina","sovran","president","ministr","segretari","sindac","deputat","senator","miliardari"],
  fallback:[{t:"Black Friday",k:"evento"},{t:"previsioni meteo",k:"tema"},{t:"bollette",k:"tema"},{t:"Champions League",k:"sport"},{t:"serie TV del momento",k:"opera"},{t:"sciopero dei treni",k:"evento"},{t:"saldi",k:"evento"},{t:"intelligenza artificiale",k:"tema"},{t:"Festival di Sanremo",k:"evento"},{t:"prezzo della benzina",k:"tema"}],
  hook:["Strano che esca proprio mentre tutti parlano di «{trend}».","Tutti distratti da «{trend}». Intanto, guardate qui:","Mentre guardavate «{trend}», è successo questo.","Vi hanno dato «{trend}» per tenervi occupati. Funziona sempre.","Oggi i giornali parlano solo di «{trend}». Chiedetevi di cosa NON parlano."],
  normal:["Tutti parlano di «{trend}» e io sono qui a lavare i piatti.","Ho cercato «{trend}» una volta. Ora il feed mi propone solo quello. Aiuto.","Opinione impopolare su «{trend}»: non me ne frega niente. Ecco, l'ho detto.","Il gruppo di famiglia ha scoperto «{trend}». Pregate per me.","Mia madre mi ha mandato 4 vocali su «{trend}». Ne ho ascoltato mezzo.","Se sento ancora parlare di «{trend}» cambio pianeta.","Ok ma qualcuno mi spiega «{trend}» in due righe? Senza thread da 40 post.","Ho visto tre video su «{trend}» e adesso ho un'opinione fortissima. Non chiedetemi quale."],
  meme:["io: non mi interessa «{trend}»\nl'algoritmo: ah sì?","pov: apri l'app per 2 minuti e ne esci esperto di «{trend}»","nessuno:\nproprio nessuno:\nil mio feed alle 3 di notte: «{trend}»","«{trend}» è il nuovo «{trend2}». Fidatevi, l'ho letto qui."],
  prop:["Il Dipartimento ricorda: «{trend}» è un argomento sereno. Parlane.","Oggi si parla di «{trend}». È il momento ideale per non pensare ad altro.","Il 94% dei cittadini sereni sta guardando «{trend}». E tu?","Interessarsi di «{trend}» fa bene all'umore. Interessarsi d'altro, meno.","Consigliato per te: più «{trend}», meno domande."],
  ad:[["Kit ufficiale «{trend}»","29 €"],["Corso: diventa esperto di «{trend}» in 3 minuti","47 €"],["Notifiche prioritarie su «{trend}»","2,99 €/mese"],["T-shirt «Io c'ero: {trend}»","24 €"],["Scommetti su «{trend}», bonus di benvenuto 100%","+18"]],
  news:["«{trend}» è l'argomento più cercato di oggi. Un sociologo: 'Ci serve per non pensare'","Picco di ricerche su «{trend}»: Psyop registra +400% di post in un'ora","Sondaggio Psyop: il 61% degli utenti ha un'opinione su «{trend}», il 9% sa di cosa si tratta","«{trend}», è già scontro sui social. I moderatori: 'Rimossi 12.000 commenti in una notte'"]
 },
 webimg:{
  _note:["Parole chiave (in inglese funzionano meglio) per cercare foto libere su Wikimedia Commons. A ogni partita ne vengono scelte due a caso per ogni narrativa. Meglio luoghi e oggetti che persone."],
  queries:{
   cantina:["pizzeria interior","restaurant cellar stairs","trattoria kitchen","basement door"],
   collaboratore:["night street Rome","police tape","empty office night","parked car night"],
   soccorritori:["flood mud street","sandbags flood","civil protection vehicle","flooded road Italy"],
   laboratorio:["military base fence","biosafety laboratory","barbed wire gate","laboratory test tubes"],
   piano:["video camera tripod","laptop screen dark room","vaccine vials","film set lights"],
   voto:["ballot box","polling station Italy","election ballots","voting booth"],
   clima:["wildfire smoke hills","burnt forest","weather radar","contrails sky"],
   firstlady:["press photographers","red carpet","old photo album","palazzo Chigi"],
   ville:["villa Sardinia","luxury villa pool","villa gate","Costa Smeralda"],
   inutile:["empty room bed","rainy window night","empty polling station","unmade bed"]
  },
  news:["newsroom","press conference microphones","traffic jam Italy","television studio"],
  ads:["product packshot","supplement bottles","mattress","shopping bags"],
  credit:true
 },
 consent:{
  title:"Prima di entrare",
  intro:"Psyop è un simulatore di social network usato per studiare come le persone diffondono e reagiscono alla disinformazione. Durante la sessione il simulatore registra la tua attività in forma anonima.",
  collectTitle:"Cosa viene registrato",
  collect:["Le tue azioni nel simulatore: cosa pubblichi, scrivi, apri, condividi, segui o blocchi","Le scelte che fai e quanto tempo ci metti a farle","Quanto ti fermi sui contenuti e quando esci dall'app","Gli avvenimenti della simulazione e come cambia la tua attività dopo","Ora locale, lingua e tipo di dispositivo (telefono o computer)"],
  notTitle:"Cosa non viene registrato",
  not:["Foto della fotocamera: restano sul tuo dispositivo","Nome reale, email, indirizzo IP"],
  rights:"A fine sessione ricevi un codice: con quello puoi chiedere che il tuo log venga cancellato. Puoi anche usare il simulatore senza inviare niente.",
  yes:"Accetto e inizio",
  no:"Inizia senza inviare dati",
  endCode:"Codice della tua sessione: {code}. Conservalo se vuoi chiedere la cancellazione del log.",
  endNoConsent:"Questa sessione non è stata inviata a nessun archivio."
 },
 insights:{
  from:"Psyop Insights",
  night:"Sono le {ora}. Ottimo momento per avere un po' di paura. Abbiamo preparato il feed apposta.",
  late:"Sono le {ora} di {giorno}. Domani ti sveglierai stanco, ma informato.",
  weekend:"È {giorno}. Hai tutto il tempo che ti serve. E noi anche.",
  tabs:"Sei uscito dall'app {n} volte. Ogni volta sei tornato. Lo sappiamo.",
  backspace:"Hai cancellato {n} caratteri prima di pubblicare. Ci interessano più di quelli che hai lasciato.",
  hesitate:"Hai esitato {n} secondi prima di pubblicare. La prossima volta sarà più facile.",
  fear:"Ti fermi di più sui contenuti che fanno paura. Te ne mostreremo di più.",
  fast:"Scorri veloce. Ma ti sei fermato su {n} post. Sappiamo quali.",
  minutes:"Sei qui da {n} minuti. Volevi restare due.",
  adclick:"Hai toccato {n} annunci. Il tuo profilo pubblicitario vale di più da oggi.",
  dossierTitle:"Cosa ha registrato Psyop su di te",
  dossierNote:"Tutto questo è rimasto nel tuo browser. Un social vero non te lo direbbe, e non lo terrebbe per sé."
 },
 chat:{
  fallback:{
   normie:["Ciao, ci conosciamo?","Ok… ti seguo da un po', ma non capisco cosa vuoi.","Scusa, sono al lavoro. Ti rispondo dopo.","Mi hai scritto per vendermi qualcosa?"],
   boomer:["BUONGIORNO!!! GRAZIE PER QUELLO CHE FAI","Condivido sempre i tuoi post nel gruppo della parrocchia.","Hai ragione su tutto. Mia moglie no, ma tu sì."],
   edge:["lol chi sei","bro ma sei un bot?","mandami un meme o niente","ok boomer"],
   bot:["Ciao caro! Investi con me in BuzzCoin, rendimento 300%","Grazie per il follow! Seguimi anche su Telegram","Sei molto interessante. Scrivimi su WhatsApp"],
   doom:["tanto non cambia niente","sì, ok. buonanotte","sto scrollando dalle 3. tu?"],
   infl:["Per le collab scrivi al mio manager.","Tariffa per un post: 800 €. Una storia: 300.","Hai visto il mio ultimo video? Commenta lì, aiuta l'algoritmo."],
   outlet:["La redazione ha ricevuto il tuo messaggio. Lo valuteremo.","Grazie per la segnalazione, la verificheremo."],
   pol:["Grazie per il messaggio. Lo staff le risponderà al più presto.","Il Presidente ringrazia per il sostegno.","Per richieste stampa contattare l'ufficio comunicazione."],
   fact:["Mi hai scritto per minacciarmi o per darmi una fonte? Nel secondo caso ti ascolto.","Ho verificato i tuoi ultimi post. Vuoi sapere cosa ho trovato?","Le fonti che citi non esistono. Lo sai, vero?"],
   prop:["Messaggio ricevuto. La tua collaborazione è stata registrata.","Grazie, cittadino. Continua così."]
  }
 },
 shop:[
  {id:"badge",name:"Badge verificato",d:"Credibilità a pagamento. Perdi meno credibilità, la moderazione ti controlla la metà, +50% di copertura."},
  {id:"prop",name:"Campagna sponsorizzata",d:"I prossimi 3 post vengono spinti dalla piattaforma. +10 credibilità comprata."},
  {id:"ads",name:"Rimuovi la pubblicità",d:"Niente più annunci. Più o meno."},
  {id:"farm",name:"Rete di account automatici",d:"20.000 account che rilanciano ogni tuo post. Accettiamo anche il nero."}
 ],
 victims:[
  "{citta}: un cameriere di {eta} anni lascia il lavoro dopo che il suo indirizzo è finito online.",
  "{citta}: una volontaria della Protezione Civile chiude i profili dopo 300 minacce.",
  "{citta}: un bambino di 6 anni ricoverato per morbillo. I genitori avevano visto 'Il Piano'.",
  "{citta}: un tecnico della centralina meteo è ustionato al 30%.",
  "{citta}: una coppia di pensionati trova la villa devastata. 'Pensavano fosse del ministro.'"
 ]
};

let TEXT=deepClone(TEXT_DEFAULT);
/* Unisce le modifiche salvate solo dove la struttura coincide, così un salvataggio vecchio non rompe il gioco */
function mergeText(base,over){
  if(over==null)return base;
  if(Array.isArray(base)){
    if(!Array.isArray(over))return base;
    const prim=base.length&&base.every(x=>typeof x!=='object');
    if(prim||!base.length)return over.filter(x=>typeof x!=='object'||x===null?true:true);
    return base.map((b,i)=>i<over.length?mergeText(b,over[i]):b);
  }
  if(typeof base==='object'&&base){
    if(typeof over!=='object'||Array.isArray(over))return base;
    for(const k in base)if(k in over)base[k]=mergeText(base[k],over[k]);
    return base;
  }
  return typeof over===typeof base?over:base;
}
function loadText(){TEXT=mergeText(deepClone(TEXT_DEFAULT),store.get('psyop.text.v2'))}
loadText();

function fill(s){
  const W=TEXT.world;
  if(typeof fillTrend==='function'&&/\{trend2?\}/.test(s))s=fillTrend(s);
  return String(s).replace(/\{citta\}/g,()=>pick(W.cities)).replace(/\{via\}/g,()=>pick(W.streets)).replace(/\{persona\}/g,()=>pick(W.insiders)).replace(/\{fonte\}/g,()=>pick(W.sources)).replace(/\{ist\}/g,()=>pick(W.institutions)).replace(/\{num\}/g,()=>ri(3,28)).replace(/\{eta\}/g,()=>ri(19,88)).replace(/\{me\}/g,()=>typeof S!=='undefined'&&S?S.handle:'tu');
}
