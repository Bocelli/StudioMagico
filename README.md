# 🚀 StudioMagico - Compagno di Studio IA per la 3ª Elementare

**StudioMagico** è una webapp progettata appositamente per bambini della scuola primaria (in particolare terza elementare, 8-9 anni) che faticano con il classico e noioso metodo *"leggo e ripeto"*.

L'app sfrutta l'**Intelligenza Artificiale gratuita (Google Gemini)** combinata con le **fotografie delle pagine del libro di scuola o del quaderno** per trasformare lo studio in un'avventura interattiva, giocosa e autonoma.

---

## 🎯 Perché Aiuta Tuo Figlio a Studiare da Solo

1. **Addio muri di testo noiosi**: L'IA trasforma la lezione in una **favola/avventura avvincente** con parole semplici, frasi corte ed esempi della vita quotidiana adatti a un bambino di 8 anni.
2. **Lettura Vocale con Leo il Robot 🔊**: Grazie alla sintesi vocale in italiano integrata nel browser (*Web Speech API*), il bambino può premere un pulsante e ascoltare la spiegazione e le domande lette ad alta voce da Leo con cuffie o altoparlanti, permettendoti di dedicarti ad altro in tranquillità.
3. **Flashcard Magiche 3D 🗂️**: Carte interattive che si girano con un tocco per scoprire il significato delle parole chiave e i concetti fondamentali con icone e spiegazioni immediate.
4. **Super Quiz Gamificato 🎯**:
   - Domande a risposta multipla a caratteri grandi e pulsanti facili da toccare.
   - **Nessuna frustrazione**: Se sbaglia, non riceve una croce rossa punitiva, ma un *Aiutino Magico* amichevole di Leo che lo guida a ragionare e riprovare!
   - Ricompense con **Stelline ⭐** e festeggiamenti con coriandoli animati (*Confetti*).
5. **Diploma di Esperto 🏆**: Al termine di ogni quiz superato, viene generato un attestato ufficiale personalizzato con il titolo della lezione, stampabile o salvabile in PDF!
6. **3 Lezioni Demo Già Pronte**: Storia (*Paleolitico e la scoperta del fuoco*), Scienze (*Il ciclo dell'acqua*) e Geografia (*I segreti della montagna*) pronte per giocare subito senza configurare nulla!

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

L'app utilizza le API di **Google Gemini (Gemini 2.5 Flash / 1.5 Flash)**, che Google offre con un piano **100% gratuito**:
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
