# 📜 StudioMagico - Trail Code Audit & Monitoring Log

> **Sistema di Audit Trail e Tracciamento Modifiche (Skill `trail-code`)**  
> **Data Creazione:** 2026-11-06  
> **Stato Rilascio:** v3.6 (Mobile Drawer Overflow Fix & 2-Row Responsive Card Architecture)  
> **Repository:** `https://github.com/Bocelli/StudioMagico`  

---

## 1. Obiettivo dell'Intervento (Tracking Action)
1. **Risoluzione Bug Layout Drawer Mobile (Overflow Schede e Pulsanti Tagliati Fuori Schermo)**:
   - *Problema rilevato dall'utente tramite screenshot (`media_1793970051550_14b0307f.jpg`)*:
     1. La scheda della lezione attiva all'interno del drawer *"Lezioni"* fuoriusciva vistosamente oltre il bordo destro del display (bordo blu sbalzato all'infinito e testo troncato a metà), facendo sparire completamente fuori schermo i pulsanti di azione (`Archivia`, `Cancella`, `Apri`).
     2. Nell'intestazione della lezione aperta, i pulsanti `Archivia` e `Cancella` apparivano come minuscoli quadrati con sole emoji fluttuanti, a causa dell'uso di una classe `hidden xs:inline` (classe `xs:` inesistente in Tailwind standard, che lasciava l'etichetta testuale permanentemente invisibile).
   - *Causa radice*:
     - In `renderSavedLessonsList()`, ogni scheda lezione tentava di stipare in una sola riga orizzontale (`flex items-center justify-between`): icona grande, titolo, 4 badge di stato e 3 pulsanti tattili distinti (`Archivia`, `Cancella`, `Apri ➔`). Su viewport mobile (360-390px), questa composizione richiedeva una larghezza minima intrinseca di oltre 380px, sbalzando la scheda fuori dal cassetto.
   - *Soluzione architetturale (Mobile-First / Awesome AI Tools for UI)*:
     - **Architettura a 2 Righe per Scheda**:
       - *Riga 1*: icona, titolo con `break-words` e badge di stato (`ALTRO`, `3ª Media`, `📸 Tua Foto`, `⭐ Studiata`) che vanno a capo fluidamente occupando il 100% della larghezza.
       - *Riga 2*: barra delle azioni dedicata e distanziata con linea divisoria sottile: a sinistra `[ 📦 Archivia ]` (o `[ 📥 Riporta ]`) e `[ 🗑️ Elimina ]`, a destra `[ 📖 Leggi ]` (o `[ Apri ➔ ]`).
     - **Regole Anti-Overflow CSS**: applicato `max-width: 100%; box-sizing: border-box; overflow-hidden` a `#lessonsDrawer`, `#demoLessonsList` e `.card-clay`.
     - **Risoluzione Header Lezione Attiva**: sostituzione delle classi `xs:` con responsive design standard: icone con padding calibrato su mobile (`px-2 py-1.5`) ed etichette testuali visibili da `sm:inline`, con aggiunta del badge esplicito `📦 Archiviata` quando la lezione corrente è in archivio.
2. **Pulsante Archivia / Gestione Archivio per il Ripasso Dilazionato (v3.5)**:
   - Sistema di archiviazione per conservare le lezioni già studiate senza ingombrare la lista attiva.
3. **Pulsante Cancella / Gestione Memoria Lezioni Studiate (v3.4)**:
   - Eliminazione definitiva delle lezioni dalla memoria browser con pulizia sincronizzata di custom lessons, hidden demos, archivio e read stats.
4. **Risoluzione Posizione Risposta Corretta nei Quiz (Shuffle Dinamico - v3.3)**:
   - Algoritmo di Fisher-Yates per distribuire casualmente ed equamente le risposte esatte tra A, B e C.

---

## 2. Benchmark e Ricerca di Mercato (via `agent-reach`)
Tramite il comando `agent-reach web search`, sono state analizzate le soluzioni leader per l'apprendimento scolastico guidato da IA:

1. **Google NotebookLM (Gemini Notebook for Education)**:
   - *Punti di forza:* Grounding rigoroso sui documenti caricati dall'utente (zero allucinazioni su fonti esterne), generazione di study guide, flashcard e FAQ.
   - *Adattamento per fascia d'età:* Interfaccia e policy differenziate per studenti under 18; possibilità di personalizzare il livello di dettaglio del prompt.
2. **Algor Education (Piattaforma italiana per studio e DSA - Primaria / Medie / Superiori)**:
   - *Punti di forza:* Selettore esplicito del livello scolastico (Primaria vs Secondaria I grado vs Secondaria II grado).
   - *Adattamento:* Modula la gerarchia concettuale delle mappe, la densità del testo nei riassunti e la complessità dei quiz.
3. **Quizlet Q-Chat & Khanmigo**:
   - *Punti di forza:* Dialogo socratico e scaffolded learning commisurato all'età inserita nel profilo dello studente.

---

## 3. Matrice dei Profili Pedagogici (GRADE_PROFILES)

| ID Classe | Grado Scolastico | Età Target | Parole Target | Paragrafi | Stile Didattico | Focus Quiz | Badge Tempo |
|---|---|---|---|---|---|---|---|
| `3-elem` | 3ª Elementare | 8-9 anni | 120 - 180 | 3 | Favolistico, metafore concrete, frasi corte | Domande dirette e intuitive, aiutino affettuoso | `~1 min` |
| `4-elem` | 4ª Elementare | 9-10 anni | 160 - 220 | 3 | Causa ed effetto, "perché accade", terminologia spiegata | Relazioni causali, ragionamento sul contesto | `~1.5 min` |
| `5-elem` | 5ª Elementare | 10-11 anni | 200 - 260 | 4 | Strutturato, logico, nessi temporali/spaziali | Comprensione di processi completi | `~2 min` |
| `1-media` | 1ª Media | 11-12 anni | 240 - 310 | 4 | Metodico, disciplinare, orientato all'esposizione orale | Comprensione del testo e inferenza logica | `~2.5 min` |
| `2-media` | 2ª Media | 12-13 anni | 280 - 360 | 4 | Analitico, spirito critico, confronto di processi | Ragionamento deduttivo e collegamenti | `~3 min` |
| `3-media` | 3ª Media | 13-14 anni | 320 - 420 | 4 | Rigoroso, argomentativo, preparazione esame di stato | Analisi critica e verifica competenze d'esame | `~3.5 min` |

---

## 4. Registro Modifiche File (Change Log)

### A. `app.js`
- **Configurazione `GRADE_PROFILES`**: Introdotta tabella immutabile a livello di modulo contenente parametri, prompt specifici e obiettivi didattici per ciascun anno.
- **Stato `App.selectedGrade`**: Lettura e scrittura persistente su `localStorage.getItem('studio_magico_grade')`.
- **Sincronizzazione UI (`initGradeSelectors`, `setGrade`, `updateGradeUI`)**:
  - Sincronizzazione a due vie tra il selettore rapido nella barra di navigazione e il selettore nel modal di upload.
  - Aggiornamento istantaneo del sottotitolo brand (`3ª Elementare • v3.1` o `1ª Media • v3.1`), del badge di lettura e del messaggio del tutor Leo.
- **Motore di Prompting Dinamico & Scalabilità Multi-Pagina (`analyzeLessonWithAi`)**:
  - Calibrazione dinamica delle istruzioni di sistema per Gemini in base al profilo di classe attivo.
  - **Formula di Scalabilità Multi-Pagina**:
    - 1 pagina: Moltiplicatore 1x, target base di classe (es. 120-180 parole, 3 paragrafi, 5 flashcard/quiz).
    - 2 pagine: Moltiplicatore 1.65x (+1 paragrafo, 6-8 flashcard/quiz, 200-300 parole per 3ª elem fino a 530-690 per 3ª media).
    - 3 pagine: Moltiplicatore 2.25x (+2 paragrafi, 8-10 flashcard/quiz, 270-400 parole fino a 720-945 per 3ª media).
    - 4+ pagine: Moltiplicatore 2.85x (+3 paragrafi, fino a 12 flashcard/quiz, 340-510 parole fino a 900-1200 per 3ª media).
  - Regole tassative nel prompt che vietano a Gemini la compressione affrettata ed impongono la trattazione equilibrata di tutte le pagine contrassegnate.
  - Salvataggio di `pagine` e calcolo dinamico della stima del tempo di lettura nel badge (`📖 Lettura: ~2.5 min (320 parole • 2 pagine)`).
- **Riconoscimento Lezioni (`loadLesson`, `showDiploma`)**:
  - Badge di classe dinamico nella scheda lezione (`#lessonClassBadge`).
  - Diploma personalizzato con il grado scolastico completato (`#diplomaLevel`).

### B. `style.css`
- **Prevenzione Globale Overflow Orizzontale Mobile**:
  - Aggiunta regola rigorosa: `html, body { overflow-x: hidden; max-width: 100vw; width: 100%; position: relative; }`.
  - Impedisce a elementi intrinsecamente lunghi di allargare il canvas e creare scrolling e spazi bianchi spuri a destra su viewport compatti (360-390px).

### C. `index.html`
- **Mobile Navigation Header Refactor (Awesome AI Tools for UI & Ponytail)**:
  - Header reso `w-full overflow-hidden px-2.5 py-2.5 sm:px-6 sm:py-3`.
  - Selettore classe compattato con etichette sintetiche (`🎒 3ª Elem`, `📚 1ª Media`, ecc.) e classi di troncamento responsive (`max-w-[95px] xs:max-w-[125px] sm:max-w-[170px] md:max-w-none truncate`).
  - Badge stelline e pulsanti azione con padding e icone ridimensionate su mobile (`px-2 py-1`, touch target preservati).
  - Logo `StudioMagico` con `whitespace-nowrap` e icona ridimensionata su smartphone (`w-9 h-9 sm:w-11 sm:h-11`) per azzerare il disallineamento e il troncamento a sinistra.
  - Sezione principale data di `p-3 sm:p-6 overflow-hidden` per evitare sbordature di tab e pulsanti tattili.
- **Cache Buster**: Portato a `?v=21` su `app.js` e `demo-data.js`.

### D. `demo-data.js`
- Aggiornate le 3 lezioni precaricate con il campo `classe: "3ª Elementare"`.
- Aggiunta una 4ª lezione dimostrativa per la scuola secondaria di primo grado:  
  `scienze-cellula-media` (**"La Cellula: la Fabbrica della Vita"**, `1ª Media`, 4 paragrafi analitici, 5 flashcard formali, 4 quiz di deduzione).

### E. `test.js`
- Aggiornato schema validator per verificare la proprietà opzionale `classe`.
- **Test K**: Validazione di integrità di tutti i 6 profili di classe e verifica della scalabilità pedagogica progressiva dei volumi di testo.
- **Test L**: Validazione dello schema e conformità della nuova lezione demo di 1ª Media.
- **Test M**: Verifica della composizione dinamica del prompt IA in funzione della classe.
- **Test N**: Validazione dell'algoritmo di scalabilità proporzionale multi-pagina (1, 2, 3, 4+ pagine) per parole min/max, paragrafi e target flashcard/quiz.
- **Test O**: Verifica dinamica dello shuffler delle opzioni quiz (algoritmo di Fisher-Yates, conservazione rigorosa della risposta esatta, verifica della distribuzione casuale equilibrata tra le opzioni A, B e C su 150 iterazioni).
- **Test P**: Validazione della cancellazione lezioni (`deleteLesson`, `deleteCurrentLesson`, `restoreDemoLessons`) e della pulizia sincronizzata di storage e statistiche.
- **Test Q**: Validazione del ciclo di vita dell'archiviazione lezioni (`archiveLesson`, `unarchiveLesson`, `toggleArchiveCurrentLesson`, separazione e filtraggio tra lezioni attive e archiviate).

---

## 5. Audit di Sicurezza e Rispetto Privacy (Compliance Check)
- **Zero Tracciamento / Zero Database Remoto**: Tutti i dati dell'alunno (stelline, lezioni caricate, livello classe selezionato, cronologia) risiedono esclusivamente nel `localStorage` del browser client.
- **Conformità Minori (GDPR / COPPA)**: Nessun cookie di profilazione, nessuna raccolta di dati anagrafici, nomi o email.
- **Resilienza Chiave API**: La chiave Google Gemini rimane custodita localmente nel browser del genitore/studente.

---

## 6. Registro Esecuzione Test (Execution Trace)
```
--- Testing StudioMagico Logic ---
✓ Direct JSON parser passed
✓ Markdown fenced JSON parser passed
✓ Loose embedded JSON parser passed
✓ Schema validation passed
✓ Multi-page Gemini demarcated payload verification passed
✓ Gemini 3.8 thinking block separator passed
✓ Model retry, timeout & failover resilience verification passed
✓ Structured Summary markdown & bullet points formatter passed
✓ Continuous flowing narrative formatter passed
✓ Kid-sized ultra-concise brevity verification passed (46 words in 2 paragraphs)
✓ Key points with brief explanation verification & renderer passed (3 points)
✓ Multi-Grade profiles integrity and progressive scaling passed (6 grades)
✓ 1ª Media demo lesson validation passed
✓ Dynamic grade prompt calibration verified
✓ Multi-page proportional scaling verification passed (1, 2, 3, 4+ pages verified)
✓ Quiz options dynamic shuffling & balanced distribution verified (A: 47, B: 60, C: 43 across 150 runs)
✓ Lesson deletion and memory cleanup logic verified
✓ Lesson archive & unarchive lifecycle verified
--- ALL CHECKS PASSED (Ponytail Approved) ---
```
