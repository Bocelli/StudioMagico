# 🚀 StudioMagico - Compagno di Studio IA per la 3ª Elementare

**StudioMagico** è una webapp progettata appositamente per bambini della scuola primaria (in particolare terza elementare, 8-9 anni) che faticano con il classico e noioso metodo *"leggo e ripeto"*.

L'app sfrutta l'**Intelligenza Artificiale gratuita (Google Gemini)** combinata con le **fotografie delle pagine del libro di scuola o del quaderno** per trasformare lo studio in un'avventura interattiva, giocosa e autonoma.

---

## 🎯 Perché Aiuta Tuo Figlio a Studiare da Solo

1. **Addio muri di testo noiosi**: L'IA trasforma la lezione in una **spiegazione fluida e scorrevole**, con parole semplici, frasi corte, parole chiave in grassetto ed esempi adatti a un bambino di 8 anni.
2. **Supporto Multi-Pagina 📸**: Puoi scattare o caricare più pagine dello stesso argomento (es. pagina 42 e 43). L'IA le analizzerà in sequenza come un'unica lezione coerente!
3. **Lettura Vocale con Leo il Robot 🔊**: Grazie alla sintesi vocale in italiano integrata nel browser (*Web Speech API*), il bambino può premere un pulsante e ascoltare la spiegazione e le domande lette ad alta voce da Leo con cuffie o altoparlanti, permettendoti di dedicarti ad altro in tranquillità.
4. **Flashcard Magiche 3D 🗂️**: Carte interattive che si girano con un tocco per scoprire il significato delle parole chiave e i concetti fondamentali con icone e spiegazioni immediate.
5. **Super Quiz Gamificato 🎯**:
   - Domande a risposta multipla a caratteri grandi e pulsanti facili da toccare.
   - **Nessuna frustrazione**: Se sbaglia, non riceve una croce rossa punitiva, ma un *Aiutino Magico* amichevole di Leo che lo guida a ragionare e riprovare!
   - Ricompense con **Stelline ⭐** e festeggiamenti con coriandoli animati (*Confetti*).
6. **Diploma di Esperto 🏆**: Al termine di ogni quiz superato, viene generato un attestato ufficiale personalizzato con il titolo della lezione, stampabile o salvabile in PDF!
7. **3 Lezioni Demo Già Pronte**: Storia (*Paleolitico e la scoperta del fuoco*), Scienze (*Il ciclo dell'acqua*) e Geografia (*I segreti della montagna*) pronte per giocare subito senza configurare nulla!

---

## 🚀 Come Avviare l'Applicazione

Puoi usarla in due modi semplicissimi:

### Modo 1: Diretto (Senza installare nulla)
Fai semplicemente **doppio clic sul file `index.html`** per aprirlo in Google Chrome, Microsoft Edge, Safari o Firefox. Font, stile e coriandoli sono inclusi nella cartella `vendor/`, quindi l'app si apre anche offline. **Serve internet solo per generare nuove lezioni con l'IA** (le 3 lezioni demo funzionano sempre).

### Modo 2: Tramite Server Locale (Ideale per Tablet / iPad / Smartphone)
Se vuoi far studiare tuo figlio sul suo tablet o smartphone via Wi-Fi:
1. Apri il terminale nella cartella del progetto:
   ```bash
   cd percorso/della/cartella/studio-magico
   ```
2. Avvia il server:
   ```bash
   npm start
   # oppure: node server.js
   ```
3. Il terminale ti mostrerà due indirizzi:
   - **Sul tuo PC:** `http://localhost:3000`
   - **Sul Tablet del bambino:** `http://192.168.x.x:3000` (apri questo indirizzo nel browser del tablet connesso allo stesso Wi-Fi di casa!)

> ⚠️ Il server è raggiungibile da **tutti i dispositivi della tua rete Wi-Fi**: usalo solo su reti di cui ti fidi. Serve soltanto i file dell'app (non `server.js`, `package.json`, file nascosti o la cartella `.git`).

---

## 🔑 Come Ottenere la Chiave IA Gratuita di Google Gemini (in 1 Minuto)

L'app utilizza le API di **Google Gemini** (famiglia Gemini 3), che Google offre con un piano gratuito:
1. Accedi a [Google AI Studio](https://aistudio.google.com/app/apikey) con il tuo normale account Google.
2. Clicca su **"Create API key"** (Crea chiave API).
3. Copia la chiave generata (inizia con `AIzaSy...`).
4. Nell'app StudioMagico, clicca sull'icona delle impostazioni in alto a destra ⚙️ (**Pannello Genitore**) e incolla la chiave.
5. Clicca su **Salva Chiave API**. La chiave resta memorizzata esclusivamente nel tuo browser (`localStorage`) e viene inviata solo a Google, nell'intestazione `x-goog-api-key` (mai nell'indirizzo della richiesta). Non è cifrata: usa il browser su un dispositivo di cui ti fidi e, se il tablet è condiviso, una chiave dedicata che puoi revocare da AI Studio.

### Modelli IA usati

Nel Pannello Genitore scegli il modello preferito; se non risponde, l'app passa in automatico ai successivi:

| Modello | Ruolo |
|---|---|
| `gemini-3.8-flash` | Predefinito (2 tentativi in caso di server occupato) |
| `gemini-3.5-flash-lite` | Primo ripiego, molto rapido |
| `gemini-3.6-flash` | Secondo ripiego |
| `gemini-3.1-flash-lite` | Ultimo ripiego |

Il modello scelto va sempre per primo. Ogni tentativo ha un timeout di 25 secondi (100 secondi in totale) e c'è un pulsante per annullare. L'elenco è definito in un solo punto (`CANDIDATE_MODELS` in `lib.js`) e un test verifica che coincida con il menu a tendina.

### Privacy e cose da sapere
- Le foto delle pagine vengono **inviate a Google** per l'analisi. Con il piano gratuito Google può usare i dati per migliorare i suoi servizi: evita foto con volti, nomi o dati personali del bambino.
- L'IA può **sbagliare**: controlla le lezioni generate insieme al bambino, soprattutto date e numeri. L'app scarta le domande con una risposta corretta non valida, ma non può verificare che il contenuto sia esatto.
- Le lezioni create sono salvate come **testo** (non le foto) nel browser. Se la memoria del browser è piena, la lezione si apre comunque ma non viene salvata e l'app lo segnala.

---

## 🛠️ Note di Sviluppo (Ponytail & UI-UX Pro Max)

- **Filosofia Ponytail (Zero Bloat)**:
  - Architettura snella: nessun framework né dipendenza npm per far girare l'app. Il CSS di Tailwind è già compilato in `vendor/tailwind.css`; serve rigenerarlo (`npm run build:css`) solo se aggiungi nuove classi Tailwind.
  - Suoni sintetizzati direttamente via *Web Audio API* (nessun file audio esterno).
  - Font e libreria dei coriandoli sono locali in `vendor/`: nessuna dipendenza da CDN.
  - **Contenuti dell'IA trattati come non fidati**: ogni testo generato viene "escapato" prima di finire nella pagina e la risposta viene validata (titolo, riassunto, flashcard, indice della risposta corretta) prima di essere mostrata o salvata.
- **Struttura**: `lib.js` (logica pura: parsing, validazione, escape, chiamata Gemini con failover), `app.js` (interfaccia), `server.js` (server locale), `demo-data.js` (lezioni demo).
- **Test**: `npm test` esegue `test.js`, che importa il codice vero (`lib.js`, `server.js`) e controlla parser, validazione, escape anti-iniezione, failover con `fetch` simulato, percorsi del server, coerenza di `index.html` e validità delle lezioni demo. Non chiama mai l'API reale e non prova l'interfaccia nel browser.
- **UI-UX Pro Max (Design per Bambini)**:
  - Tipografia specifica per l'infanzia: *Fredoka* per i titoli giocosi e *Nunito* per la massima leggibilità del testo.
  - Target tattili grandi (>48px) con effetto 3D "bubbly" che simula la pressione fisica dei tasti.
  - Contrasti cromatici conformi WCAG (>4.5:1) con palette vivace ed energica (Giallo Sole, Blu Fiducia, Verde Successo, Corallo).
- *shortcut: Nessun backend database remoto; tutti i dati e le lezioni fotografate sono salvate nel localStorage del browser del dispositivo.*
