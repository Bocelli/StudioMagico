# 🚀 StudioMagico - Compagno di Studio IA dalla 3ª Elementare alla 3ª Media

**StudioMagico** è una webapp progettata per studenti della scuola primaria e secondaria di primo grado (dalla 3ª elementare alla 3ª media, 8-14 anni) che cercano un metodo di studio efficace, autonomo e stimolante che superi il noioso *"leggo e ripeto"*.

L'app sfrutta l'**Intelligenza Artificiale gratuita (Google Gemini)** combinata con le **fotografie delle pagine del libro di scuola o del quaderno** per trasformare lo studio in un percorso interattivo, chiaro e strutturato su misura per la classe dello studente.

---

## 🎯 Perché Aiuta a Studiare da Soli

1. **Selettore della Classe Didattica (3ª Elem ➔ 3ª Media) 🎓**: L'IA adatta automaticamente il registro linguistico, la profondità dei concetti, la lunghezza del riassunto e la complessità dei quiz in base all'anno selezionato (3ª, 4ª, 5ª elementare o 1ª, 2ª, 3ª media).
2. **Addio muri di testo noiosi**: L'IA trasforma la lezione in una **spiegazione chiara, strutturata e scorrevole**, con punti focali evidenziati in grassetto e spiegati in modo chiaro e immediato.
3. **Supporto Multi-Pagina 📸**: Puoi scattare o caricare più pagine dello stesso argomento (es. pagina 42 e 43). L'IA le analizzerà in sequenza come un'unica lezione coerente!
4. **Lettura Chiara e Calibrata 📖**: Testo dosato con cura (da ~1 minuto per la 3ª elementare a ~3.5 minuti per la 3ª media), completo ma senza affaticare la concentrazione.
5. **Flashcard Magiche 3D 🗂️**: Carte interattive che si girano con un tocco per scoprire il significato delle parole chiave e i concetti fondamentali con icone e spiegazioni immediate.
6. **Super Quiz Gamificato 🎯**:
   - Domande a risposta multipla a caratteri grandi e pulsanti facili da toccare.
   - **Nessuna frustrazione**: Se sbaglia, non riceve una croce rossa punitiva, ma un *Aiutino Magico* che lo guida a ragionare e riprovare!
   - Ricompense con **Stelline ⭐** e festeggiamenti con coriandoli animati (*Confetti*).
7. **Diploma di Esperto 🏆**: Al termine di ogni quiz superato, viene generato un attestato ufficiale personalizzato con il titolo della lezione e il livello scolastico, stampabile o salvabile in PDF!
8. **4 Lezioni Demo Già Pronte**: Storia (*Paleolitico e il fuoco*, 3ª Elem), Scienze (*Il ciclo dell'acqua*, 3ª Elem), Geografia (*I segreti della montagna*, 3ª Elem) e Scienze Medie (*La Cellula: la Fabbrica della Vita*, 1ª Media).

---

## 🚀 Come Avviare l'Applicazione

Puoi usarla in due modi semplicissimi:

### Modo 1: Diretto (Senza installare nulla)
Fai semplicemente **doppio clic sul file `index.html`** per aprirlo in Google Chrome, Microsoft Edge, Safari o Firefox. Funziona immediatamente!

### Modo 2: Tramite Server Locale (Ideale per Tablet / iPad / Smartphone)
Se vuoi far studiare tuo figlio sul suo tablet o smartphone via Wi-Fi:
1. Apri il terminale nella cartella del progetto:
   ```bash
   cd C:\Users\Admin\.gemini\antigravity\scratch\studio-magico
   ```
2. Avvia il server:
   ```bash
   npm start
   # oppure: node server.js
   ```
3. Il terminale ti mostrerà due indirizzi:
   - **Sul tuo PC:** `http://localhost:3000`
   - **Sul Tablet del bambino:** `http://192.168.x.x:3000` (apri questo indirizzo nel browser del tablet connesso allo stesso Wi-Fi di casa!)

---

## 🔑 Come Ottenere la Chiave IA Gratuita di Google Gemini (in 1 Minuto)

L'app utilizza le API di **Google Gemini (Gemini 3.8 Flash / 3.5 Flash Lite)**, che Google offre con un piano **100% gratuito**:
1. Accedi a [Google AI Studio](https://aistudio.google.com/app/apikey) con il tuo normale account Google.
2. Clicca su **"Create API key"** (Crea chiave API).
3. Copia la chiave generata (inizia con `AIzaSy...`).
4. Nell'app StudioMagico, clicca sull'icona delle impostazioni in alto a destra ⚙️ (**Pannello Genitore**) e incolla la chiave.
5. Clicca su **Salva Chiave API**. La chiave resta memorizzata in modo sicuro esclusivamente nel tuo browser (`localStorage`).

---

## 🛠️ Note di Sviluppo (Ponytail & UI-UX Pro Max)

- **Filosofia Ponytail (Zero Bloat)**:
  - Architettura snella e robusta: zero dipendenze pesanti o framework complessi (niente build step lunghi, zero configurazioni Webpack/Vite).
  - Suoni sintetizzati direttamente via *Web Audio API* (nessun file audio esterno da scaricare che rischia di andare in errore 404).
  - Test automatico con asserzioni incluso in `test.js` (`npm test`) per verificare l'integrità del parser JSON e dello schema didattico.
- **UI-UX Pro Max (Design per Bambini)**:
  - Tipografia specifica per l'infanzia: *Fredoka* per i titoli giocosi e *Nunito* per la massima leggibilità del testo.
  - Target tattili grandi (>48px) con effetto 3D "bubbly" che simula la pressione fisica dei tasti.
  - Contrasti cromatici conformi WCAG (>4.5:1) con palette vivace ed energica (Giallo Sole, Blu Fiducia, Verde Successo, Corallo).
- *shortcut: Nessun backend database remoto; tutti i dati e le lezioni fotografate sono salvate nel localStorage del browser del dispositivo.*
