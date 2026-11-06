// app.js - StudioMagico Logic & Interactions

// --- Sound Synthesizer (Zero-dependency Web Audio API) ---
class SoundEffects {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
  }

  playTone(freq, type = 'sine', duration = 0.15, startTime = 0, gainVal = 0.2) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + startTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime + startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + startTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + startTime);
      osc.stop(this.ctx.currentTime + startTime + duration);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  pop() {
    this.playTone(480, 'sine', 0.08, 0, 0.15);
  }

  success() {
    // Happy cheerful ascending chime (C5, E5, G5, C6)
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      this.playTone(freq, 'triangle', 0.2, idx * 0.08, 0.25);
    });
  }

  hint() {
    // Gentle warm chime
    this.playTone(392.00, 'sine', 0.2, 0, 0.2); // G4
    this.playTone(440.00, 'sine', 0.25, 0.1, 0.2); // A4
  }

  fanfare() {
    // Joyful celebration fanfare
    const seq = [
      { f: 523.25, t: 0.15, d: 0 },
      { f: 659.25, t: 0.15, d: 0.12 },
      { f: 783.99, t: 0.2, d: 0.24 },
      { f: 1046.50, t: 0.4, d: 0.40 }
    ];
    seq.forEach(s => this.playTone(s.f, 'triangle', s.t, s.d, 0.3));
  }
}

// --- Pedagogical Profiles by School Grade (3ª Elementare -> 3ª Media) ---
const GRADE_PROFILES = {
  '3-elem': {
    id: '3-elem',
    name: '3ª Elementare',
    fullLabel: '🎒 3ª Elementare (8-9 anni)',
    badgeTime: 'Lettura semplice: ~1 min',
    targetAudience: 'bambini di 3ª elementare (8-9 anni) ai primi passi dello studio disciplinare',
    toneDesc: 'Limpido, favolistico e rassicurante. Frasi brevi, metafore concrete del mondo quotidiano, nessun tecnicismo astratto senza spiegazione immediata.',
    wordCountMin: 120,
    wordCountMax: 180,
    paragraphs: 3,
    keyPointsCount: 4,
    quizDifficulty: 'Domande dirette e intuitive con 3 opzioni corte. Aiutino affettuoso e immediato.',
    mascotGreeting: 'Pronto a studiare? Leggi il riassunto semplice, gira le flashcard e vinci tante stelline col quiz! 🚀'
  },
  '4-elem': {
    id: '4-elem',
    name: '4ª Elementare',
    fullLabel: '🎒 4ª Elementare (9-10 anni)',
    badgeTime: 'Lettura guidata: ~1.5 min',
    targetAudience: 'bambini di 4ª elementare (9-10 anni), capaci di cogliere collegamenti di causa-effetto',
    toneDesc: 'Coinvolgente e chiaro. Metti in risalto il "perché accadono le cose" e le relazioni di causa ed effetto tra fatti storici, geografici e scientifici.',
    wordCountMin: 160,
    wordCountMax: 220,
    paragraphs: 3,
    keyPointsCount: 5,
    quizDifficulty: 'Domande su concetti e relazioni causa-effetto con aiutino che fa riflettere sul contesto.',
    mascotGreeting: 'Ciao! Oggi scopriamo il perché delle cose con spiegazioni chiare e quiz stimolanti! 💡'
  },
  '5-elem': {
    id: '5-elem',
    name: '5ª Elementare',
    fullLabel: '🎒 5ª Elementare (10-11 anni)',
    badgeTime: 'Lettura strutturata: ~2 min',
    targetAudience: 'studenti di 5ª elementare (10-11 anni) che consolidano il metodo di studio per le medie',
    toneDesc: 'Strutturato, ordinato e logico. Utilizza la corretta terminologia disciplinare, evidenziando nessi logici, temporali e spaziali.',
    wordCountMin: 200,
    wordCountMax: 260,
    paragraphs: 4,
    keyPointsCount: 5,
    quizDifficulty: 'Domande che verificano la comprensione di processi completi e nessi temporali/concettuali.',
    mascotGreeting: 'Benvenuto! Consolidiamo un grande metodo di studio: concetti ordinati, flashcard e quiz! 🎯'
  },
  '1-media': {
    id: '1-media',
    name: '1ª Media',
    fullLabel: '📚 1ª Media (11-12 anni)',
    badgeTime: 'Studio attivo: ~2.5 min',
    targetAudience: 'ragazzi di 1ª media (11-12 anni) che affrontano lo studio autonomo e disciplinare',
    toneDesc: 'Esposizione metodica, lineare e rigorosa. Linguaggio disciplinare accurato, articolazione logica per paragrafi tematici e sintesi orientata all\'esposizione orale.',
    wordCountMin: 240,
    wordCountMax: 310,
    paragraphs: 4,
    keyPointsCount: 6,
    quizDifficulty: 'Domande di comprensione approfondita e analisi del testo con opzioni plausibili e stimolanti.',
    mascotGreeting: 'Pronto per la scuola media? Sintesi efficace dei testi, concetti chiave e verifica immediata! 📖'
  },
  '2-media': {
    id: '2-media',
    name: '2ª Media',
    fullLabel: '📚 2ª Media (12-13 anni)',
    badgeTime: 'Studio approfondito: ~3 min',
    targetAudience: 'studenti di 2ª media (12-13 anni) chiamati al pensiero critico e collegamenti interdisciplinari',
    toneDesc: 'Analitico, maturo e scorrevole. Approfondimento dei processi storici, scientifici o letterari, evidenziando cause, svolgimento e conseguenze con spirito critico.',
    wordCountMin: 280,
    wordCountMax: 360,
    paragraphs: 4,
    keyPointsCount: 6,
    quizDifficulty: 'Quesiti che richiedono collegamenti logici, deduzione e confronto tra fenomeni.',
    mascotGreeting: 'Ottimo lavoro! Studio approfondito, parole chiave disciplinari e test di verifica pronti! 🔍'
  },
  '3-media': {
    id: '3-media',
    name: '3ª Media',
    fullLabel: '🎓 3ª Media (13-14 anni)',
    badgeTime: 'Studio esame: ~3.5 min',
    targetAudience: 'studenti di 3ª media (13-14 anni) in preparazione all\'esame di stato e alle scuole superiori',
    toneDesc: 'Rigoroso, argomentativo e approfondito. Enfasi sui quadri d\'insieme, collegamenti pluridisciplinari, sintesi concettuale densa ma chiara, ideale per il ripasso e l\'orale.',
    wordCountMin: 320,
    wordCountMax: 420,
    paragraphs: 4,
    keyPointsCount: 7,
    quizDifficulty: 'Domande a livello di esame di terza media: analisi critica, sintesi concettuale e verifica delle competenze.',
    mascotGreeting: 'Obiettivo Esame di 3ª Media: sintesi d\'alto livello, collegamenti e flashcard per spaccare! 🏆'
  }
};

// --- Application State & Controller ---
const App = {
  sound: new SoundEffects(),
  GRADE_PROFILES,
  selectedGrade: '3-elem',
  currentLesson: null,
  activeTab: 'storia', // 'storia' | 'flashcard' | 'quiz'
  drawerFilter: 'active', // 'active' | 'archived'
  uploadedImages: [], // Array of { id, dataUrl, mimeType, base64, name }
  currentCardIndex: 0,
  currentQuizIndex: 0,
  quizAnswersState: {}, // { [qIdx]: { selected: number, isCorrect: boolean, attempts: number } }

  // User Stats (Gamification)
  stats: {
    stars: 50,
    streak: 1,
    completedLessons: 0,
    readLessons: []
  },

  init() {
    const savedGrade = localStorage.getItem('studio_magico_grade');
    this.selectedGrade = (savedGrade && GRADE_PROFILES[savedGrade]) ? savedGrade : '3-elem';
    this.loadStats();
    this.initGradeSelectors();
    this.setupMascotGreetings();
    this.renderHeaderStats();
    this.bindEvents();

    // Load first available active lesson (or fallback to any lesson) so the app is immediately alive!
    const activeLessons = this.getAllLessons(false);
    const all = this.getAllLessons(true);
    if (activeLessons.length > 0) {
      this.loadLesson(activeLessons[0]);
    } else if (all.length > 0) {
      this.loadLesson(all[0]);
    } else if (window.DEMO_LESSONS && window.DEMO_LESSONS.length > 0) {
      this.loadLesson(window.DEMO_LESSONS[0]);
    }
    this.renderSavedLessonsList();
  },

  loadStats() {
    try {
      const saved = localStorage.getItem('studio_magico_stats');
      if (saved) {
        this.stats = Object.assign(this.stats, JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Error loading stats", e);
    }
  },

  saveStats() {
    try {
      localStorage.setItem('studio_magico_stats', JSON.stringify(this.stats));
      this.renderHeaderStats();
    } catch (e) {
      console.warn("Error saving stats", e);
    }
  },

  addStars(amount, source = '') {
    this.stats.stars += amount;
    this.saveStats();
    this.sound.success();

    const starBadge = document.getElementById('headerStars');
    if (starBadge) {
      starBadge.classList.add('star-pop');
      setTimeout(() => starBadge.classList.remove('star-pop'), 400);
    }

    this.setMascotMessage(`Evviva! Hai guadagnato +${amount} Stelline! 🌟`);
  },

  renderHeaderStats() {
    const starCount = document.getElementById('starCount');
    const streakCount = document.getElementById('streakCount');
    if (starCount) starCount.innerText = this.stats.stars;
    if (streakCount) streakCount.innerText = this.stats.streak;
  },

  setMascotMessage(text) {
    const msgEl = document.getElementById('mascotMessage');
    if (msgEl) {
      msgEl.innerText = text;
      msgEl.parentElement.classList.add('scale-105');
      setTimeout(() => msgEl.parentElement.classList.remove('scale-105'), 200);
    }
  },

  setGrade(gradeId, syncSelects = true) {
    if (!this.GRADE_PROFILES[gradeId]) return;
    this.selectedGrade = gradeId;
    localStorage.setItem('studio_magico_grade', gradeId);
    this.sound.pop();
    this.updateGradeUI(syncSelects);
  },

  updateGradeUI(syncSelects = true) {
    const profile = this.GRADE_PROFILES[this.selectedGrade] || this.GRADE_PROFILES['3-elem'];
    
    // Sync dropdown selects
    if (syncSelects) {
      const headerSelect = document.getElementById('gradeSelect');
      const modalSelect = document.getElementById('modalGradeSelect');
      if (headerSelect && headerSelect.value !== this.selectedGrade) headerSelect.value = this.selectedGrade;
      if (modalSelect && modalSelect.value !== this.selectedGrade) modalSelect.value = this.selectedGrade;
    }

    // Header brand subtitle
    const brandSub = document.getElementById('brandSubtitle');
    if (brandSub) {
      brandSub.innerHTML = `${profile.name} • <span class="text-blue-600 font-extrabold">v3.1</span>`;
    }

    // Modal subtitle description
    const modalDesc = document.getElementById('gradeModalDesc');
    if (modalDesc) {
      modalDesc.innerText = `Calibrato per ${profile.name} (${profile.badgeTime.replace('Lettura ', '').replace('Studio ', '')})`;
    }

    // Active lesson reading time badge
    const readingBadge = document.getElementById('readingTimeBadge');
    if (readingBadge) {
      if (this.currentLesson) {
        const text = this.currentLesson.riassunto || this.currentLesson.storia_semplice || '';
        const words = text.split(/\s+/).filter(Boolean).length;
        const isMedia = (this.currentLesson.classe || profile.name).includes('Media');
        const readingMinutes = Math.max(1, Math.round((words / (isMedia ? 130 : 100)) * 10) / 10);
        const pagesLabel = this.currentLesson.pagine && this.currentLesson.pagine > 1 ? ` • ${this.currentLesson.pagine} pagine` : '';
        readingBadge.innerText = `Lettura: ~${readingMinutes} min (${words} parole${pagesLabel})`;
      } else {
        readingBadge.innerText = profile.badgeTime;
      }
    }

    // Mascot greeting update
    if (profile.mascotGreeting) {
      this.setMascotMessage(profile.mascotGreeting);
    }
  },

  initGradeSelectors() {
    const headerSelect = document.getElementById('gradeSelect');
    const modalSelect = document.getElementById('modalGradeSelect');

    if (headerSelect) {
      headerSelect.value = this.selectedGrade;
      headerSelect.addEventListener('change', (e) => this.setGrade(e.target.value));
    }
    if (modalSelect) {
      modalSelect.value = this.selectedGrade;
      modalSelect.addEventListener('change', (e) => this.setGrade(e.target.value));
    }

    this.updateGradeUI(true);
  },

  setupMascotGreetings() {
    const profile = this.GRADE_PROFILES[this.selectedGrade] || this.GRADE_PROFILES['3-elem'];
    if (profile.mascotGreeting) {
      this.setMascotMessage(profile.mascotGreeting);
    } else {
      const greetings = [
        "Ciao campione! Pronto a fare scoperte incredibili oggi? 🚀",
        "Bentornato! Oggi diventeremo dei veri maestri dello studio! 💡",
        "Non preoccuparti per la lezione: con me imparare è un gioco da ragazzi! ⭐"
      ];
      const randomGreet = greetings[Math.floor(Math.random() * greetings.length)];
      this.setMascotMessage(randomGreet);
    }
  },

  bindEvents() {
    // Navigation Tabs
    document.querySelectorAll('[data-tab-target]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.sound.pop();
        const tab = btn.getAttribute('data-tab-target');
        this.switchTab(tab);
      });
    });

    // Parent Settings Modal
    const settingsBtn = document.getElementById('openSettingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
    const apiKeyInput = document.getElementById('apiKeyInput');

    if (settingsBtn && settingsModal) {
      settingsBtn.addEventListener('click', () => {
        this.sound.pop();
        if (apiKeyInput) {
          apiKeyInput.value = localStorage.getItem('gemini_api_key') || '';
        }
        const modelSelect = document.getElementById('modelSelectInput');
        if (modelSelect) {
          modelSelect.value = localStorage.getItem('gemini_selected_model') || 'gemini-3.8-flash';
        }

        settingsModal.classList.remove('hidden');
      });
    }

    if (closeSettingsBtn && settingsModal) {
      closeSettingsBtn.addEventListener('click', () => {
        this.sound.pop();
        settingsModal.classList.add('hidden');
      });
    }

    if (saveApiKeyBtn && apiKeyInput) {
      saveApiKeyBtn.addEventListener('click', () => {
        const val = apiKeyInput.value.trim();
        localStorage.setItem('gemini_api_key', val);
        const modelSelect = document.getElementById('modelSelectInput');
        if (modelSelect) {
          localStorage.setItem('gemini_selected_model', modelSelect.value);
        }

        

        this.sound.success();
        alert('Impostazioni salvate con successo!');
        settingsModal.classList.add('hidden');
      });
    }

    // New Lesson Upload Modal
    const openUploadBtn = document.getElementById('openUploadBtn');
    const uploadModal = document.getElementById('uploadModal');
    const closeUploadBtn = document.getElementById('closeUploadBtn');
    const analyzeBtn = document.getElementById('analyzeBtn');

    if (openUploadBtn && uploadModal) {
      openUploadBtn.addEventListener('click', () => {
        this.sound.pop();
        uploadModal.classList.remove('hidden');
      });
    }

    if (closeUploadBtn && uploadModal) {
      closeUploadBtn.addEventListener('click', () => {
        this.sound.pop();
        uploadModal.classList.add('hidden');
      });
    }

    // Multi-Image Handlers with Automatic Canvas Compression (Ponytail: max 1280px, ~150KB per page)
    // shortcut: client-side 2D canvas resize, upgrade to Web Workers only if processing >20 pages
    const compressAndAddImage = (file) => {
      if (!file) return;
      const isImg = (file.type && file.type.startsWith('image/')) || (file.name && file.name.match(/\.(jpe?g|png|webp|heic|bmp)$/i));
      if (!isImg) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const rawResult = e.target.result;
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            let { width, height } = img;
            const maxDim = 1280;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.80);
            this.uploadedImages.push({
              id: 'page-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
              dataUrl: dataUrl,
              mimeType: 'image/jpeg',
              base64: dataUrl.split(',')[1],
              name: file.name
            });
            this.renderUploadedPagesPreview();
            this.sound.pop();
          } catch (canvasErr) {
            this.uploadedImages.push({
              id: 'page-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
              dataUrl: rawResult,
              mimeType: file.type || 'image/jpeg',
              base64: rawResult.split(',')[1],
              name: file.name
            });
            this.renderUploadedPagesPreview();
            this.sound.pop();
          }
        };
        img.onerror = () => {
          this.uploadedImages.push({
            id: 'page-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
            dataUrl: rawResult,
            mimeType: file.type || 'image/jpeg',
            base64: rawResult.split(',')[1],
            name: file.name
          });
          this.renderUploadedPagesPreview();
          this.sound.pop();
        };
        img.src = rawResult;
      };
      reader.readAsDataURL(file);
    };

    const handleFiles = (fileList) => {
      if (!fileList || fileList.length === 0) return;
      Array.from(fileList).forEach(file => compressAndAddImage(file));
    };

    const fileInput = document.getElementById('bookPhotoInput');
    const cameraInput = document.getElementById('cameraPhotoInput');
    const fileInputMore = document.getElementById('bookPhotoInputMore');
    const cameraInputMore = document.getElementById('cameraPhotoInputMore');

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
        fileInput.value = '';
      });
    }
    if (cameraInput) {
      cameraInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
        cameraInput.value = '';
      });
    }
    if (fileInputMore) {
      fileInputMore.addEventListener('change', (e) => {
        handleFiles(e.target.files);
        fileInputMore.value = '';
      });
    }
    if (cameraInputMore) {
      cameraInputMore.addEventListener('change', (e) => {
        handleFiles(e.target.files);
        cameraInputMore.value = '';
      });
    }

    // Drag and Drop
    const dropZone = document.getElementById('dropZone');
    if (dropZone) {
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('border-blue-500', 'bg-blue-50');
      });
      dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('border-blue-500', 'bg-blue-50');
      });
      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-blue-500', 'bg-blue-50');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleFiles(e.dataTransfer.files);
        }
      });
    }

    if (analyzeBtn) {
      analyzeBtn.addEventListener('click', () => this.analyzeLessonWithAi());
    }

    // Mark Summary as Read Button
    const markReadBtn = document.getElementById('markReadBtn');
    if (markReadBtn) {
      markReadBtn.addEventListener('click', () => {
        if (!this.currentLesson) return;
        if (!this.stats.readLessons.includes(this.currentLesson.id)) {
          this.stats.readLessons.push(this.currentLesson.id);
          this.addStars(20, 'storia_letta');
          markReadBtn.innerHTML = '<span>✅</span><span>Completato! (+20 ⭐)</span>';
          markReadBtn.disabled = true;
          markReadBtn.classList.add('opacity-75', 'cursor-not-allowed');
        }
      });
    }

    // Audio effects mute toggle
    const soundToggle = document.getElementById('soundToggle');
    if (soundToggle) {
      soundToggle.addEventListener('click', () => {
        this.sound.enabled = !this.sound.enabled;
        soundToggle.innerText = this.sound.enabled ? '🔔 Suoni: Attivi' : '🔕 Suoni: Spenti';
        if (this.sound.enabled) this.sound.pop();
      });
    }
  },

  switchTab(tab) {
    this.activeTab = tab;

    // Update active tab button visuals
    document.querySelectorAll('[data-tab-target]').forEach(btn => {
      const isCurrent = btn.getAttribute('data-tab-target') === tab;
      if (isCurrent) {
        btn.classList.add('btn-blue', 'text-white');
        btn.classList.remove('btn-slate', 'text-slate-700');
      } else {
        btn.classList.remove('btn-blue', 'text-white');
        btn.classList.add('btn-slate', 'text-slate-700');
      }
    });

    // Toggle content views
    ['storia', 'flashcard', 'quiz'].forEach(t => {
      const el = document.getElementById(`tab-${t}`);
      if (el) {
        if (t === tab) {
          el.classList.remove('hidden');
        } else {
          el.classList.add('hidden');
        }
      }
    });

    // Context reactions
    if (tab === 'storia') {
      this.setMascotMessage("Ecco la spiegazione chiara e scorrevole della lezione! Buona lettura! 📖");
    } else if (tab === 'flashcard') {
      this.setMascotMessage("Tocca le carte per girarle e scoprire i trucchi delle parole chiave! 🗂️");
      this.renderFlashcard();
    } else if (tab === 'quiz') {
      this.setMascotMessage("Pronto per la sfida a quiz? Guadagna tantissime stelline rispondendo alle domande! 🎯");
      this.renderQuizQuestion();
    }
  },

  formatSummary(text) {
    if (!text || typeof text !== 'string') return '';
    const blocks = text.split(/\n\n+/);
    return blocks.map(block => {
      let trimmed = block.trim();
      if (!trimmed) return '';

      const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
      const isList = lines.some(l => /^[-*•]\s+/.test(l));

      if (isList) {
        const headerLines = [];
        const listLines = [];
        lines.forEach(l => {
          if (/^[-*•]\s+/.test(l)) {
            listLines.push(l);
          } else {
            headerLines.push(l);
          }
        });

        let headerHtml = '';
        if (headerLines.length > 0) {
          const hText = headerLines.join(' ').replace(/^###\s*/, '').replace(/^##\s*/, '').replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-950 font-extrabold">$1</strong>');
          headerHtml = `<div class="flex items-center gap-2 mt-5 mb-2.5 pt-2 text-indigo-950 font-heading font-extrabold text-xl md:text-2xl border-b-2 border-indigo-100 pb-1.5">${hText}</div>`;
        }

        const listItemsHtml = listLines.map(line => {
          let itemText = line.replace(/^[-*•]\s+/, '').trim();
          if (!itemText) return '';
          itemText = itemText.replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-950 font-bold bg-indigo-50/70 px-1.5 py-0.5 rounded">$1</strong>');
          return `
            <li class="flex items-start gap-3 text-slate-700 text-lg md:text-xl font-medium leading-relaxed my-2">
              <span class="text-blue-600 font-extrabold text-2xl leading-none select-none mt-0.5">•</span>
              <span class="flex-1">${itemText}</span>
            </li>
          `;
        }).join('');

        return `${headerHtml}<ul class="bg-blue-50/60 border-2 border-blue-100 rounded-2xl p-4 sm:p-5 my-3 space-y-1 list-none shadow-sm">${listItemsHtml}</ul>`;
      }

      // Check if first line is a section header (e.g. starts with ### or emoji icons like 📌, 🔍, 💡, 👉, ⭐)
      if (/^(###|##|📌|🔍|💡|👉|⭐)/.test(lines[0])) {
        const headerLine = lines[0].replace(/^###\s*/, '').replace(/^##\s*/, '');
        const formattedHeader = headerLine.replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-950 font-extrabold">$1</strong>');
        const headerHtml = `<div class="flex items-center gap-2 mt-5 mb-2.5 pt-2 text-indigo-950 font-heading font-extrabold text-xl md:text-2xl border-b-2 border-indigo-100 pb-1.5">${formattedHeader}</div>`;

        if (lines.length > 1) {
          const bodyText = lines.slice(1).join(' ').replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-950 font-bold">$1</strong>');
          return `${headerHtml}<p class="leading-relaxed text-slate-800 text-lg md:text-xl font-medium mb-5">${bodyText}</p>`;
        }
        return headerHtml;
      }

      // Normal continuous flowing narrative paragraph with bold keywords and child-friendly typography
      const formatted = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-950 font-bold bg-indigo-50/70 px-1.5 py-0.5 rounded">$1</strong>');
      return `<p class="leading-relaxed text-slate-800 text-lg md:text-xl font-medium mb-5">${formatted}</p>`;
    }).join('');
  },

  loadLesson(lesson) {
    this.currentLesson = lesson;
    this.currentCardIndex = 0;
    this.currentQuizIndex = 0;
    this.quizAnswersState = {};

    // Dynamically randomize quiz options so answer A isn't always the correct one
    this.shuffleLessonQuiz(this.currentLesson);

    // Update Banner Info
    const titleEl = document.getElementById('lessonTitle');
    const subjectEl = document.getElementById('lessonSubject');
    const classBadgeEl = document.getElementById('lessonClassBadge');
    const readingBadgeEl = document.getElementById('readingTimeBadge');

    if (titleEl) titleEl.innerText = lesson.titolo;
    if (subjectEl) {
      subjectEl.innerText = lesson.materia || 'Lezione';
      // Subject-specific badge color
      subjectEl.className = 'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1 ' + 
        (lesson.materia === 'Storia' ? 'bg-amber-100 text-amber-800' :
         lesson.materia === 'Scienze' ? 'bg-cyan-100 text-cyan-800' :
         lesson.materia === 'Geografia' ? 'bg-emerald-100 text-emerald-800' :
         'bg-purple-100 text-purple-800');
    }

    const currentGradeProfile = Object.values(this.GRADE_PROFILES).find(p => p.name === lesson.classe) || this.GRADE_PROFILES[this.selectedGrade] || this.GRADE_PROFILES['3-elem'];
    if (classBadgeEl) {
      classBadgeEl.innerText = lesson.classe || currentGradeProfile.name;
    }
    if (readingBadgeEl) {
      const text = lesson.riassunto || lesson.storia_semplice || '';
      const words = text.split(/\s+/).filter(Boolean).length;
      const isMedia = (lesson.classe || currentGradeProfile.name).includes('Media');
      const readingMinutes = Math.max(1, Math.round((words / (isMedia ? 130 : 100)) * 10) / 10);
      const pagesLabel = lesson.pagine && lesson.pagine > 1 ? ` • ${lesson.pagine} pagine` : '';
      readingBadgeEl.innerText = `Lettura: ~${readingMinutes} min (${words} parole${pagesLabel})`;
    }

    // Render Structured Summary (Unified continuous narrative)
    const storyEl = document.getElementById('storyContent');
    if (storyEl) {
      const content = lesson.riassunto || lesson.storia_semplice || '';
      storyEl.innerHTML = this.formatSummary(content);
    }

    // Reset Read button
    const markReadBtn = document.getElementById('markReadBtn');
    if (markReadBtn) {
      const isRead = this.stats.readLessons.includes(lesson.id);
      markReadBtn.disabled = isRead;
      if (isRead) {
        markReadBtn.innerHTML = '<span>✅</span><span>Completato! (+20 ⭐)</span>';
        markReadBtn.classList.add('opacity-75', 'cursor-not-allowed');
      } else {
        markReadBtn.innerHTML = '<span>⭐</span><span>Ho letto il racconto! (+20 ⭐)</span>';
        markReadBtn.classList.remove('opacity-75', 'cursor-not-allowed');
      }
    }

    // Update current lesson archive button state
    this.updateCurrentLessonArchiveBtn();

    // Render Flashcards & Quiz
    this.renderFlashcard();
    this.renderQuizQuestion();
  },

  // --- Flashcard Logic ---
  renderFlashcard() {
    if (!this.currentLesson || !this.currentLesson.parole_chiave) return;
    const cards = this.currentLesson.parole_chiave;
    const card = cards[this.currentCardIndex] || cards[0];

    const cardContainer = document.getElementById('flashcardContainer');
    if (!cardContainer) return;

    cardContainer.innerHTML = `
      <div class="flip-card-scene w-full max-w-md h-72 mx-auto">
        <div class="flip-card-inner card-clay" id="activeFlipCard" onclick="App.toggleCardFlip()">
          <div class="flip-card-front bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
            <span class="text-6xl mb-3">${card.emoji || '⭐'}</span>
            <h3 class="text-2xl md:text-3xl font-bold text-indigo-900 mb-2 font-heading">${card.termine}</h3>
            <span class="text-sm font-semibold text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full mt-4 flex items-center gap-1">
              👆 Tocca per scoprire il significato
            </span>
          </div>
          <div class="flip-card-back bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
            <span class="text-3xl mb-2 font-heading text-amber-900 font-bold">${card.termine}</span>
            <p class="text-lg md:text-xl text-slate-800 leading-relaxed font-medium px-4">${card.spiegazione}</p>
          </div>
        </div>
      </div>
      <div class="flex items-center justify-between max-w-md mx-auto mt-6">
        <button onclick="App.prevCard()" class="btn-tactile btn-slate px-4 py-2.5 rounded-2xl font-bold flex items-center gap-2" ${this.currentCardIndex === 0 ? 'disabled style="opacity:0.4"' : ''}>
          ⬅️ Precedente
        </button>
        <span class="font-bold text-slate-600 font-heading text-lg">
          ${this.currentCardIndex + 1} di ${cards.length}
        </span>
        <button onclick="App.nextCard()" class="btn-tactile btn-blue px-4 py-2.5 rounded-2xl font-bold flex items-center gap-2" ${this.currentCardIndex === cards.length - 1 ? 'disabled style="opacity:0.4"' : ''}>
          Successiva ➡️
        </button>
      </div>
    `;
  },

  toggleCardFlip() {
    this.sound.pop();
    const cardEl = document.getElementById('activeFlipCard');
    if (cardEl) {
      cardEl.classList.toggle('is-flipped');
    }
  },

  nextCard() {
    if (!this.currentLesson) return;
    if (this.currentCardIndex < this.currentLesson.parole_chiave.length - 1) {
      this.sound.pop();
      this.currentCardIndex++;
      this.renderFlashcard();
    }
  },

  prevCard() {
    if (this.currentCardIndex > 0) {
      this.sound.pop();
      this.currentCardIndex--;
      this.renderFlashcard();
    }
  },

  // --- Quiz Engine & Randomization ---
  shuffleLessonQuiz(lesson) {
    if (!lesson || !Array.isArray(lesson.quiz)) return;
    lesson.quiz.forEach(q => {
      if (!q || !Array.isArray(q.opzioni) || q.opzioni.length < 2) return;
      const currentCorrectIdx = (typeof q.risposta_corretta === 'number' && q.risposta_corretta >= 0 && q.risposta_corretta < q.opzioni.length)
        ? q.risposta_corretta
        : 0;

      // Wrap each option with correctness indicator
      const items = q.opzioni.map((opt, idx) => ({
        text: opt,
        isCorrect: (idx === currentCorrectIdx)
      }));

      // Fisher-Yates shuffle
      for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = items[i];
        items[i] = items[j];
        items[j] = temp;
      }

      q.opzioni = items.map(item => item.text);
      const newCorrectIdx = items.findIndex(item => item.isCorrect);
      q.risposta_corretta = newCorrectIdx >= 0 ? newCorrectIdx : 0;
    });
  },

  renderQuizQuestion() {
    if (!this.currentLesson || !this.currentLesson.quiz) return;
    const questions = this.currentLesson.quiz;
    const qIndex = this.currentQuizIndex;
    const q = questions[qIndex];
    const quizBox = document.getElementById('quizBox');
    if (!quizBox) return;

    if (!q) {
      this.renderQuizResults();
      return;
    }

    const state = this.quizAnswersState[qIndex] || { selected: null, isCorrect: null, attempts: 0 };

    quizBox.innerHTML = `
      <div class="card-clay p-6 md:p-8">
        <div class="flex items-center justify-between mb-4">
          <span class="bg-blue-100 text-blue-800 text-sm font-extrabold px-3 py-1 rounded-full font-heading">
            Domanda ${qIndex + 1} di ${questions.length}
          </span>
        </div>

        <h3 class="text-xl md:text-2xl font-bold text-slate-800 mb-6 font-heading leading-snug">
          ${q.domanda}
        </h3>

        <div class="space-y-3.5 mb-6">
          ${q.opzioni.map((opt, optIdx) => {
            let btnClass = "btn-slate bg-white border-2 border-slate-200 text-slate-800 hover:border-blue-400";
            let indicator = String.fromCharCode(65 + optIdx); // A, B, C

            if (state.selected === optIdx) {
              if (state.isCorrect) {
                btnClass = "bg-green-100 border-2 border-green-500 text-green-900 shadow-md font-bold";
                indicator = "🎉";
              } else {
                btnClass = "bg-amber-100 border-2 border-amber-500 text-amber-900";
                indicator = "🤔";
              }
            }

            return `
              <button onclick="App.handleQuizChoice(${qIndex}, ${optIdx})" 
                      class="btn-tactile w-full text-left p-4 rounded-2xl flex items-center gap-4 text-base md:text-lg transition-all ${btnClass}"
                      ${state.isCorrect ? 'disabled' : ''}>
                <span class="w-9 h-9 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center font-extrabold text-slate-700 flex-shrink-0">
                  ${indicator}
                </span>
                <span class="font-medium">${opt}</span>
              </button>
            `;
          }).join('')}
        </div>

        <!-- Hint Box if wrong answer -->
        <div id="quizHintBox" class="${state.selected !== null && !state.isCorrect ? '' : 'hidden'} p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl mb-6">
          <div class="flex items-start gap-3">
            <span class="text-2xl">💡</span>
            <div>
              <h4 class="font-bold text-amber-900 text-sm">💡 Aiutino Magico:</h4>
              <p class="text-amber-800 text-base mt-0.5">${q.indizio || "Rileggi bene la domanda, puoi farcela!"}</p>
            </div>
          </div>
        </div>

        <!-- Navigation Buttons -->
        <div class="flex items-center justify-between border-t border-slate-100 pt-5">
          <button onclick="App.prevQuiz()" class="btn-tactile btn-slate px-4 py-2.5 rounded-2xl font-bold flex items-center gap-1.5" ${qIndex === 0 ? 'disabled style="opacity:0.4"' : ''}>
            ⬅️ Indietro
          </button>
          
          ${state.isCorrect ? `
            <button onclick="App.nextQuiz()" class="btn-tactile btn-emerald px-6 py-2.5 rounded-2xl font-bold flex items-center gap-2 shadow-lg">
              ${qIndex === questions.length - 1 ? 'Vedi Risultato Finale 🏆' : 'Prossima Domanda ➡️'}
            </button>
          ` : `
            <span class="text-sm font-semibold text-slate-400">Scegli una risposta per proseguire</span>
          `}
        </div>
      </div>
    `;
  },

  handleQuizChoice(qIndex, choiceIdx) {
    const q = this.currentLesson.quiz[qIndex];
    const isCorrect = (choiceIdx === q.risposta_corretta);
    const existing = this.quizAnswersState[qIndex] || { attempts: 0 };

    this.quizAnswersState[qIndex] = {
      selected: choiceIdx,
      isCorrect: isCorrect,
      attempts: existing.attempts + 1
    };

    if (isCorrect) {
      this.sound.success();
      // Award stars based on attempts
      const awarded = existing.attempts === 0 ? 10 : 5;
      this.addStars(awarded, 'quiz_esatto');
      this.setMascotMessage("Bravissimo! Risposta corretta al 100%! 🚀", true);
    } else {
      this.sound.hint();
      this.setMascotMessage("Quasi! Non ti abbattere, leggi l'aiutino e riprova!", true);
    }

    this.renderQuizQuestion();
  },

  nextQuiz() {
    this.sound.pop();
    this.currentQuizIndex++;
    this.renderQuizQuestion();
  },

  prevQuiz() {
    if (this.currentQuizIndex > 0) {
      this.sound.pop();
      this.currentQuizIndex--;
      this.renderQuizQuestion();
    }
  },

  renderQuizResults() {
    const quizBox = document.getElementById('quizBox');
    if (!quizBox) return;

    this.sound.fanfare();
    if (window.confetti) {
      window.confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }

    const total = this.currentLesson.quiz.length;
    let correctFirstTry = 0;
    Object.values(this.quizAnswersState).forEach(st => {
      if (st.isCorrect && st.attempts === 1) correctFirstTry++;
    });

    this.stats.completedLessons++;
    this.saveStats();

    quizBox.innerHTML = `
      <div class="card-clay p-8 text-center bg-gradient-to-b from-yellow-50 via-white to-amber-50">
        <span class="text-7xl mb-3 block animate-bounce">🏆</span>
        <h2 class="text-3xl md:text-4xl font-extrabold text-amber-900 font-heading mb-2">Quiz Completato con Successo!</h2>
        <p class="text-lg text-slate-700 max-w-md mx-auto mb-6">
          Hai superato tutte le domande della lezione <br><strong class="text-indigo-900 text-xl font-heading">"${this.currentLesson.titolo}"</strong>!
        </p>

        <div class="bg-white border-2 border-amber-200 rounded-2xl p-5 max-w-sm mx-auto shadow-sm mb-6 flex justify-around">
          <div>
            <div class="text-3xl font-extrabold text-amber-600 font-heading">${total} / ${total}</div>
            <div class="text-xs font-bold text-slate-500 uppercase mt-1">Domande Risolte</div>
          </div>
          <div class="border-r border-slate-200"></div>
          <div>
            <div class="text-3xl font-extrabold text-emerald-600 font-heading">+${total * 10} ⭐</div>
            <div class="text-xs font-bold text-slate-500 uppercase mt-1">Stelline Totali</div>
          </div>
        </div>

        <div class="flex flex-wrap items-center justify-center gap-4">
          <button onclick="App.showDiploma()" class="btn-tactile btn-amber px-6 py-3 rounded-2xl font-bold flex items-center gap-2 text-lg shadow-lg">
            📜 Guarda il tuo Diploma di Esperto
          </button>
          <button onclick="App.restartQuiz()" class="btn-tactile btn-slate px-5 py-3 rounded-2xl font-bold flex items-center gap-2 text-base">
            🔄 Riprova il Quiz
          </button>
        </div>
      </div>
    `;
  },

  restartQuiz() {
    this.quizAnswersState = {};
    this.currentQuizIndex = 0;
    if (this.currentLesson) {
      this.shuffleLessonQuiz(this.currentLesson);
    }
    this.renderQuizQuestion();
  },

  showDiploma() {
    this.sound.fanfare();
    const modal = document.getElementById('diplomaModal');
    const diplomaTitle = document.getElementById('diplomaLessonTitle');
    const diplomaDate = document.getElementById('diplomaDate');
    const diplomaLevel = document.getElementById('diplomaLevel');

    if (diplomaTitle) diplomaTitle.innerText = this.currentLesson.titolo;
    if (diplomaDate) diplomaDate.innerText = new Date().toLocaleDateString('it-IT');
    if (diplomaLevel) {
      const currentGradeName = this.currentLesson.classe || (this.GRADE_PROFILES[this.selectedGrade]?.name || '3ª Elementare');
      diplomaLevel.innerText = `Livello: ${currentGradeName} ⭐ Super Campione`;
    }
    if (modal) modal.classList.remove('hidden');
    if (window.confetti) {
      window.confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
    }
  },

  closeDiploma() {
    const modal = document.getElementById('diplomaModal');
    if (modal) modal.classList.add('hidden');
  },

  // --- Saved Lessons, Memory & History Management ---
  getArchivedLessonIds() {
    try {
      return JSON.parse(localStorage.getItem('studio_magico_archived_lessons') || '[]');
    } catch (e) {
      return [];
    }
  },

  isLessonArchived(id) {
    return this.getArchivedLessonIds().includes(id);
  },

  getAllLessons(includeArchived = true) {
    let saved = [];
    try {
      saved = JSON.parse(localStorage.getItem('studio_magico_custom_lessons') || '[]');
    } catch (e) {
      saved = [];
    }

    let hiddenDemos = [];
    try {
      hiddenDemos = JSON.parse(localStorage.getItem('studio_magico_hidden_demos') || '[]');
    } catch (e) {
      hiddenDemos = [];
    }

    const visibleDemos = (window.DEMO_LESSONS || []).filter(d => !hiddenDemos.includes(d.id));
    const all = [...saved, ...visibleDemos];

    if (includeArchived) return all;

    const archivedIds = this.getArchivedLessonIds();
    return all.filter(l => !archivedIds.includes(l.id));
  },

  setDrawerFilter(filter) {
    this.sound.pop();
    this.drawerFilter = filter;
    this.renderSavedLessonsList();
  },

  archiveLesson(id) {
    this.sound.pop();
    let archived = this.getArchivedLessonIds();
    if (!archived.includes(id)) {
      archived.push(id);
      localStorage.setItem('studio_magico_archived_lessons', JSON.stringify(archived));
    }
    const all = this.getAllLessons(true);
    const target = all.find(l => l.id === id);
    const title = target ? target.titolo : 'Lezione';
    this.setMascotMessage(`"${title}" archiviata! La ritrovi sempre nella sezione Archivio per ripassarla quando vuoi 📦`, true);
    this.renderSavedLessonsList();
    this.updateCurrentLessonArchiveBtn();
  },

  unarchiveLesson(id) {
    this.sound.pop();
    let archived = this.getArchivedLessonIds();
    archived = archived.filter(item => item !== id);
    localStorage.setItem('studio_magico_archived_lessons', JSON.stringify(archived));
    const all = this.getAllLessons(true);
    const target = all.find(l => l.id === id);
    const title = target ? target.titolo : 'Lezione';
    this.setMascotMessage(`"${title}" riportata tra le lezioni attive in studio! 🚀`, true);
    this.renderSavedLessonsList();
    this.updateCurrentLessonArchiveBtn();
  },

  toggleArchiveCurrentLesson() {
    if (!this.currentLesson || !this.currentLesson.id) return;
    const id = this.currentLesson.id;
    if (this.isLessonArchived(id)) {
      this.unarchiveLesson(id);
    } else {
      this.archiveLesson(id);
    }
  },

  updateCurrentLessonArchiveBtn() {
    const btn = document.getElementById('archiveCurrentLessonBtn');
    const badge = document.getElementById('lessonArchivedBadge');
    if (!this.currentLesson) return;

    const isArchived = this.isLessonArchived(this.currentLesson.id);

    if (badge) {
      if (isArchived) {
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }

    if (!btn) return;

    if (isArchived) {
      btn.innerHTML = '<span>📥</span><span class="hidden sm:inline">Riporta</span>';
      btn.className = 'btn-tactile border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold px-2 sm:px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition-colors';
      btn.title = "Questa lezione è archiviata. Clicca per riportarla tra le lezioni attive in studio";
    } else {
      btn.innerHTML = '<span>📦</span><span class="hidden sm:inline">Archivia</span>';
      btn.className = 'btn-tactile border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold px-2 sm:px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition-colors';
      btn.title = "Archivia questa lezione già studiata per rileggerla più avanti senza averla tra le lezioni attive";
    }
  },

  renderSavedLessonsList() {
    const list = document.getElementById('demoLessonsList');
    if (!list) return;

    const allLessons = this.getAllLessons(true);
    const archivedIds = this.getArchivedLessonIds();

    const activeLessons = allLessons.filter(l => !archivedIds.includes(l.id));
    const archivedLessons = allLessons.filter(l => archivedIds.includes(l.id));

    const currentFilter = this.drawerFilter || 'active';
    const displayedLessons = currentFilter === 'archived' ? archivedLessons : activeLessons;

    let hiddenDemos = [];
    try {
      hiddenDemos = JSON.parse(localStorage.getItem('studio_magico_hidden_demos') || '[]');
    } catch (e) {
      hiddenDemos = [];
    }

    let filterBar = `
      <div class="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-200 w-full gap-2">
        <div class="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <button onclick="App.setDrawerFilter('active')" 
                  class="btn-tactile text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${currentFilter === 'active' ? 'btn-blue text-white shadow-xs' : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'}">
            <span>📚</span>
            <span>In Studio (${activeLessons.length})</span>
          </button>
          <button onclick="App.setDrawerFilter('archived')" 
                  class="btn-tactile text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${currentFilter === 'archived' ? 'btn-amber text-amber-950 shadow-xs' : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'}">
            <span>📦</span>
            <span>Archivio (${archivedLessons.length})</span>
          </button>
        </div>
        <button onclick="document.getElementById('lessonsDrawer').classList.add('hidden')" class="btn-tactile bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-700 text-xs font-bold px-2.5 py-1.5 rounded-xl flex items-center gap-1 flex-shrink-0">
          <span>✕</span>
          <span class="hidden sm:inline">Chiudi</span>
        </button>
      </div>
    `;

    if (currentFilter === 'archived' && archivedLessons.length > 0) {
      filterBar += `
        <div class="p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium mb-3 flex items-center gap-2">
          <span>💡</span>
          <span>Lezioni archiviate per il ripasso: puoi rileggerle quando vuoi o premere <strong>"Riporta"</strong> per riaverle tra le lezioni attive in studio.</span>
        </div>
      `;
    }

    let cardsHtml = '';

    if (displayedLessons.length === 0) {
      if (currentFilter === 'archived') {
        cardsHtml = `
          <div class="p-6 text-center bg-white rounded-2xl border-2 border-dashed border-amber-200 w-full">
            <span class="text-3xl mb-1 block">📦</span>
            <p class="text-slate-600 font-bold text-sm mb-1">Nessuna lezione archiviata.</p>
            <p class="text-slate-400 text-xs">Quando hai finito di studiare una lezione, premi il tasto <strong>"📦 Archivia"</strong> per conservarla qui senza ingombrare la lista delle lezioni in studio!</p>
          </div>
        `;
      } else {
        cardsHtml = `
          <div class="p-6 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200 w-full">
            <span class="text-3xl mb-1 block">📚</span>
            <p class="text-slate-600 font-bold text-sm mb-2">Tutte le lezioni sono state archiviate o rimosse!</p>
            <div class="flex items-center justify-center gap-2 flex-wrap">
              <button onclick="App.setDrawerFilter('archived')" class="btn-tactile btn-amber text-xs font-bold px-3 py-1.5 rounded-xl text-amber-950">
                📦 Guarda le lezioni archiviate (${archivedLessons.length})
              </button>
              <button onclick="App.restoreDemoLessons()" class="btn-tactile btn-blue text-xs font-bold px-3 py-1.5 rounded-xl text-white">
                🔄 Ripristina lezioni demo
              </button>
            </div>
          </div>
        `;
      }
    } else {
      cardsHtml = `
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 w-full max-w-full">
          ${displayedLessons.map(l => {
            const isCurrent = this.currentLesson && this.currentLesson.id === l.id;
            const isCustom = l.id && l.id.toString().startsWith('custom-');
            const isRead = this.stats && this.stats.readLessons && this.stats.readLessons.includes(l.id);
            const isArchived = archivedIds.includes(l.id);
            const icon = l.materia === 'Storia' ? '🔥' : l.materia === 'Scienze' ? '💧' : l.materia === 'Geografia' ? '🏔️' : '📚';

            return `
              <div class="card-clay p-3 sm:p-4 rounded-2xl flex flex-col gap-2.5 transition-all w-full max-w-full overflow-hidden ${isCurrent ? 'border-2 border-blue-500 bg-blue-50/60 shadow-sm' : 'bg-white hover:border-blue-300'}">
                
                <!-- Row 1: Clickable Title & Details -->
                <div onclick="App.loadLessonById('${l.id}')" class="flex items-start gap-2.5 cursor-pointer w-full min-w-0">
                  <span class="text-2xl sm:text-3xl flex-shrink-0 mt-0.5">${icon}</span>
                  <div class="min-w-0 flex-1">
                    <h4 class="font-bold text-slate-900 text-sm sm:text-base font-heading leading-snug break-words" title="${l.titolo}">
                      ${l.titolo}
                    </h4>
                    <div class="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span class="text-[10px] font-extrabold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full uppercase">${l.materia}</span>
                      ${l.classe ? `<span class="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-full">${l.classe}</span>` : ''}
                      ${isCustom ? `<span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">📸 Tua Foto</span>` : ''}
                      ${isRead ? `<span class="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">⭐ Studiata</span>` : ''}
                      ${isCurrent ? `<span class="text-[10px] font-bold text-blue-800 bg-blue-100 border border-blue-200 px-1.5 py-0.5 rounded-full">✓ Aperta</span>` : ''}
                    </div>
                  </div>
                </div>

                <!-- Row 2: Action Buttons (Guaranteed 100% fitting on mobile) -->
                <div class="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-100 w-full min-w-0">
                  <div class="flex items-center gap-1.5 flex-shrink-0">
                    ${isArchived ? `
                      <button onclick="event.stopPropagation(); App.unarchiveLesson('${l.id}')" 
                              title="Riporta questa lezione tra quelle attive in studio" 
                              class="btn-tactile border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition-colors">
                        <span>📥</span>
                        <span>Riporta</span>
                      </button>
                    ` : `
                      <button onclick="event.stopPropagation(); App.archiveLesson('${l.id}')" 
                              title="Archivia questa lezione per rileggerla più avanti" 
                              class="btn-tactile border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition-colors">
                        <span>📦</span>
                        <span>Archivia</span>
                      </button>
                    `}
                    <button onclick="event.stopPropagation(); App.deleteLesson('${l.id}')" 
                            title="Elimina definitivamente dalla memoria" 
                            class="btn-tactile border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition-colors">
                      <span>🗑️</span>
                      <span class="hidden sm:inline">Elimina</span>
                    </button>
                  </div>

                  <button onclick="App.loadLessonById('${l.id}')" 
                          class="btn-tactile ${isCurrent ? 'bg-indigo-600 text-white font-bold' : 'btn-slate text-slate-800 font-semibold'} text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 flex-shrink-0 shadow-xs">
                    <span>${isCurrent ? '📖 Leggi' : (isArchived ? 'Rileggi ➔' : 'Apri ➔')}</span>
                  </button>
                </div>

              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    let footerHtml = '';
    if (hiddenDemos.length > 0) {
      footerHtml = `
        <div class="pt-3 mt-3 border-t border-slate-200 flex justify-end w-full">
          <button onclick="App.restoreDemoLessons()" class="text-xs text-blue-600 hover:text-blue-800 hover:underline font-bold flex items-center gap-1">
            <span>🔄</span>
            <span>Ripristina le ${hiddenDemos.length} lezioni demo nascoste</span>
          </button>
        </div>
      `;
    }

    list.innerHTML = filterBar + cardsHtml + footerHtml;
  },

  loadLessonById(id) {
    this.sound.pop();
    const allLessons = this.getAllLessons(true);
    const found = allLessons.find(l => l.id === id);
    if (found) {
      this.loadLesson(found);
      this.renderSavedLessonsList();
      this.switchTab('storia');
      // Auto-close drawer on selection
      const drawer = document.getElementById('lessonsDrawer');
      if (drawer) drawer.classList.add('hidden');
    }
  },

  deleteLesson(id) {
    const all = this.getAllLessons(true);
    const target = all.find(l => l.id === id);
    if (!target) return;

    const confirmMsg = `Vuoi davvero cancellare la lezione "${target.titolo}" dalla memoria?`;
    if (!window.confirm(confirmMsg)) return;

    this.sound.pop();

    // 1. If it's a custom lesson, remove from localStorage custom lessons
    let saved = [];
    try {
      saved = JSON.parse(localStorage.getItem('studio_magico_custom_lessons') || '[]');
    } catch (e) {
      saved = [];
    }
    const filteredSaved = saved.filter(l => l.id !== id);
    localStorage.setItem('studio_magico_custom_lessons', JSON.stringify(filteredSaved));

    // 2. If it's a demo lesson, track it as hidden in localStorage
    if (window.DEMO_LESSONS && window.DEMO_LESSONS.some(d => d.id === id)) {
      let hiddenDemos = [];
      try {
        hiddenDemos = JSON.parse(localStorage.getItem('studio_magico_hidden_demos') || '[]');
      } catch (e) {
        hiddenDemos = [];
      }
      if (!hiddenDemos.includes(id)) {
        hiddenDemos.push(id);
        localStorage.setItem('studio_magico_hidden_demos', JSON.stringify(hiddenDemos));
      }
    }

    // 3. Remove from archive list if it was archived
    let archived = this.getArchivedLessonIds().filter(archId => archId !== id);
    localStorage.setItem('studio_magico_archived_lessons', JSON.stringify(archived));

    // 4. Remove from read history if tracked
    if (this.stats && Array.isArray(this.stats.readLessons)) {
      this.stats.readLessons = this.stats.readLessons.filter(readId => readId !== id);
      this.saveStats();
    }

    // 5. If current active lesson was deleted, load next available lesson
    const remainingActive = this.getAllLessons(false);
    const remainingAll = this.getAllLessons(true);
    if (this.currentLesson && this.currentLesson.id === id) {
      if (remainingActive.length > 0) {
        this.loadLesson(remainingActive[0]);
      } else if (remainingAll.length > 0) {
        this.loadLesson(remainingAll[0]);
      } else if (window.DEMO_LESSONS && window.DEMO_LESSONS.length > 0) {
        localStorage.removeItem('studio_magico_hidden_demos');
        this.loadLesson(window.DEMO_LESSONS[0]);
      }
    }

    // 6. Re-render drawer list & update mascot
    this.renderSavedLessonsList();
    this.updateCurrentLessonArchiveBtn();
    this.setMascotMessage(`Lezione "${target.titolo}" rimossa dalla memoria! 🧹`, true);
  },

  deleteCurrentLesson() {
    if (this.currentLesson && this.currentLesson.id) {
      this.deleteLesson(this.currentLesson.id);
    }
  },

  restoreDemoLessons() {
    this.sound.pop();
    localStorage.removeItem('studio_magico_hidden_demos');
    this.renderSavedLessonsList();
    this.setMascotMessage("Lezioni demo ripristinate con successo! 📚", true);
  },

  // --- Multi-Page Upload Preview & Management ---
  renderUploadedPagesPreview() {
    const preview = document.getElementById('photoPreview');
    const uploadPlaceholder = document.getElementById('uploadPlaceholder');
    const grid = document.getElementById('uploadedPagesGrid');
    const badge = document.getElementById('pagesCountBadge');
    const analyzeBtn = document.getElementById('analyzeBtn');

    if (!preview || !uploadPlaceholder || !grid) return;

    if (this.uploadedImages.length === 0) {
      preview.classList.add('hidden');
      uploadPlaceholder.classList.remove('hidden');
      if (analyzeBtn) {
        const manualText = document.getElementById('manualTextInput')?.value.trim();
        analyzeBtn.disabled = !manualText;
      }
      return;
    }

    uploadPlaceholder.classList.add('hidden');
    preview.classList.remove('hidden');
    if (analyzeBtn) analyzeBtn.disabled = false;

    if (badge) {
      const count = this.uploadedImages.length;
      badge.innerText = `${count} ${count === 1 ? 'pagina caricata' : 'pagine caricate'} ✅`;
    }

    grid.innerHTML = this.uploadedImages.map((img, idx) => `
      <div class="relative bg-white rounded-2xl border-2 border-slate-200 p-2 shadow-sm flex flex-col items-center">
        <span class="absolute top-1 left-1 bg-indigo-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow">
          Pagina ${idx + 1}
        </span>
        <button onclick="App.removeUploadedPage('${img.id}')" 
                class="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white font-bold text-xs flex items-center justify-center shadow-md transition-transform hover:scale-110"
                title="Rimuovi questa pagina">
          ✕
        </button>
        <img src="${img.dataUrl}" alt="Pagina ${idx + 1}" class="w-full h-24 object-cover rounded-xl mt-3 mb-1 border border-slate-100">
      </div>
    `).join('');
  },

  removeUploadedPage(id) {
    this.sound.pop();
    this.uploadedImages = this.uploadedImages.filter(img => img.id !== id);
    this.renderUploadedPagesPreview();
  },

  // --- AI Analysis with Google Gemini Free API ---
  async analyzeLessonWithAi() {
    const apiKey = localStorage.getItem('gemini_api_key');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const loadingState = document.getElementById('aiLoadingState');
    const loadingText = document.getElementById('aiLoadingText');
    const loadingTimer = document.getElementById('aiLoadingTimer');
    const cancelBtn = document.getElementById('cancelAiBtn');
    const uploadModal = document.getElementById('uploadModal');
    const manualTextInput = document.getElementById('manualTextInput');

    if (!apiKey) {
      this.sound.hint();
      alert("⚠️ Non hai ancora inserito la chiave API gratuita di Google Gemini!\n\nClicca su 'Genitore / Impostazioni' in alto a destra. Ci vuole solo 1 minuto per averla gratis da Google!");
      return;
    }

    if (this.uploadedImages.length === 0 && (!manualTextInput || !manualTextInput.value.trim())) {
      alert("Carica o scatta prima almeno una foto della pagina del libro o scrivi qualche appunto!");
      return;
    }

    let interval = null;
    let timerInterval = null;
    const abortController = new AbortController();

    if (cancelBtn) {
      cancelBtn.onclick = () => {
        abortController.abort();
      };
    }

    let elapsedSeconds = 0;
    const errorBox = document.getElementById('aiErrorBox');
    const errorMsg = document.getElementById('aiErrorMsg');
    const errorDetails = document.getElementById('aiErrorDetails');
    if (errorBox) errorBox.classList.add('hidden');

    try {
      if (analyzeBtn) analyzeBtn.disabled = true;
      if (loadingState) loadingState.classList.remove('hidden');

      if (loadingTimer) loadingTimer.innerText = '0s';
      timerInterval = setInterval(() => {
        elapsedSeconds++;
        if (loadingTimer) loadingTimer.innerText = `${elapsedSeconds}s`;
      }, 1000);

      const loadingSteps = [
        `Lettura in corso delle ${this.uploadedImages.length > 1 ? this.uploadedImages.length + ' pagine' : 'pagine'} del libro... 📖`,
        "Scrittura del racconto unico che unisce tutti i punti focali... ✏️",
        "Generazione delle flashcard didattiche... 🗂️",
        "Creazione del Super Quiz per la verifica... 🎯 (ancora pochi istanti!)"
      ];
      let stepIdx = 0;
      interval = setInterval(() => {
        stepIdx = (stepIdx + 1) % loadingSteps.length;
        if (loadingText) loadingText.innerText = loadingSteps[stepIdx];
      }, 3000);

      const grade = this.GRADE_PROFILES[this.selectedGrade] || this.GRADE_PROFILES['3-elem'];
      const totalPages = this.uploadedImages.length;
      const numPages = Math.max(1, totalPages);

      // Multi-Page Proportional Scaling:
      // Modulates word count, paragraphs, and key points dynamically so that 2, 3, or 4 pages
      // receive proportional pedagogical depth and aren't squashed into a 1-page template!
      let pageMultiplier = 1;
      let paragraphBonus = 0;
      let keyPointBonus = 0;

      if (numPages === 2) {
        pageMultiplier = 1.65;
        paragraphBonus = 1;
        keyPointBonus = 2;
      } else if (numPages === 3) {
        pageMultiplier = 2.25;
        paragraphBonus = 2;
        keyPointBonus = 4;
      } else if (numPages >= 4) {
        pageMultiplier = 2.85;
        paragraphBonus = 3;
        keyPointBonus = 6;
      }

      const minWords = Math.round(grade.wordCountMin * pageMultiplier);
      const maxWords = Math.round(grade.wordCountMax * pageMultiplier);
      const totalParagraphs = grade.paragraphs + paragraphBonus;

      const baseKeyPoints = grade.keyPointsCount || 5;
      const targetCount = numPages > 1 
        ? Math.min(12, Math.max(baseKeyPoints + keyPointBonus, numPages * 2)) 
        : baseKeyPoints;

      const promptText = `
Sei un docente esperto specializzato nell'insegnamento per ${grade.targetAudience}.
Il tuo obiettivo è analizzare TUTTI i contenuti e i concetti chiave delle ${numPages > 1 ? numPages + ' pagine' : 'pagine'} caricate e amalgamarli in un UNICO TESTO DI STUDIO FLUIDO E ARMONIOSO (campo "riassunto"), unendo in una sola narrazione continua sia la visione d'insieme sia la spiegazione di ogni singolo punto chiave!

${numPages > 1 ? `
REGOLE TASSATIVE MULTI-PAGINA (${numPages} PAGINE DEL LIBRO CARICATE):
- Sono state caricate ben ${numPages} pagine consecutive del libro di testo, chiaramente contrassegnate come [FOTO PAGINA 1], [FOTO PAGINA 2], ecc.
- VIETATO condensare frettolosamente sacrificando i contenuti: ogni singola pagina ha pari importanza didattica!
- Distribuisci la narrazione in modo equilibrato: organizza il testo in ${totalParagraphs} paragrafi in modo che gli argomenti di ciascuna pagina trovino spazio adeguato e siano spiegati ordinatamente in sequenza.
- Estrai ed evidenzia in grassetto i concetti e punti focali di TUTTE le ${numPages} pagine (non solo della prima o dell'ultima!).
- La lunghezza totale del testo DEVE essere proporzionata alle ${numPages} pagine: scrivi tra ${minWords} e ${maxWords} parole complessive.
` : `
REGOLE PER IL TESTO (1 PAGINA CARICATA):
- Scrivi un testo unitario e scorrevole suddiviso in ${totalParagraphs} brevi paragrafi ben spaziati (separati da doppio a capo \\n\\n).
- Lunghezza del testo: tra ${minWords} e ${maxWords} parole complessive (calibrato per ${grade.name}).
`}

REGOLE TASSATIVE GENERALI:
1. UNICO TESTO CONTINUO (NIENTE SCHEDE SEPARATE, NIENTE ELENCHI, NIENTE TITOLI STEP-BY-STEP):
   - Scrivi un testo unitario e scorrevole suddiviso in ${totalParagraphs} paragrafi ben spaziati (separati da doppio a capo \\n\\n).
   - NON usare elenchi puntati o trattini (- o •).
   - NON usare sezioni rigide o etichette (niente "📌 Introduzione", "🔍 Punti focali", "💡 Conclusione").
   - Stile e tono: ${grade.toneDesc}

2. TUTTI I PUNTI FOCALI AMALGAMATI CON SPIEGAZIONE CALIBRATA:
   - Identifica TUTTI i punti focali, concetti, personaggi, mestieri, fasi o elementi presenti nelle pagine caricate (senza tralasciarne alcuno!).
   - Inserisci e spiega ciascun punto focale all'interno del racconto con una spiegazione calibrata per ${grade.name}.
   - Evidenzia sempre ogni termine o punto focale in **grassetto** (es. **il cartografo**, **la selce**, **la membrana cellulare**) direttamente nella frase in cui viene spiegato.

3. LUNGHEZZA E LESSICO PER ${grade.name.toUpperCase()} (${numPages} ${numPages > 1 ? 'PAGINE' : 'PAGINA'}):
   - Lunghezza totale del testo: tra ${minWords} e ${maxWords} parole complessive.
   - Niente formule infantili finte ("Ciao sono Leo", "C'era una volta").

REQUISITI PER FLASHCARD E SUPER QUIZ:
- "parole_chiave": ${targetCount} flashcard per il ripasso interattivo, coprendo i concetti di tutte le pagine (termine, emoji simpatica e spiegazione adatta a ${grade.name}).
- "quiz": ${targetCount} domande a risposta multipla con 3 opzioni (una sola corretta) e un aiutino per verificare la comprensione (${grade.quizDifficulty}).
- IMPORTANTE SULLE RISPOSTE DEL QUIZ: NON posizionare sempre la risposta corretta sulla prima opzione (A)! Alterna la posizione in modo casuale ed equilibrato tra la prima (indice 0), la seconda (indice 1) e la terza (indice 2), impostando il valore numerico di "risposta_corretta" sul corrispondente indice (0, 1 o 2).

Rispondi ESCLUSIVAMENTE con un JSON con la seguente struttura:
{
  "titolo": "Titolo chiaro e corretto della lezione",
  "materia": "Storia | Scienze | Geografia | Italiano | Altro",
  "classe": "${grade.name}",
  "pagine_analizzate": ${numPages},
  "riassunto": "Primo paragrafo continuo che introduce l'argomento generale e i primi **punti focali**...\\n\\nSecondo paragrafo continuo che prosegue la spiegazione con i successivi **punti chiave**...\\n\\nTerzo paragrafo continuo che completa la lezione e conclude il testo in modo armonioso...",
  "parole_chiave": [
    {
      "termine": "Nome del punto focale",
      "emoji": "Icona adatta",
      "spiegazione": "Spiegazione chiara calibrata per ${grade.name}."
    }
  ],
  "quiz": [
    {
      "domanda": "Domanda per verificare la comprensione?",
      "opzioni": ["Prima opzione plausibile", "Seconda opzione corretta", "Terza opzione"],
      "risposta_corretta": 1,
      "indizio": "Un aiutino per ragionare."
    }
  ]
}
`;

      const parts = [];

      if (totalPages > 1) {
        parts.push({
          text: `AVVISO: In questo messaggio sono allegate ${totalPages} pagine consecutive numerate in sequenza (Pagina 1, Pagina 2...). Leggi, analizza e integra TUTTE le ${totalPages} pagine nel riassunto!`
        });
      }

      // Push all compressed pages in order with explicit demarcation headers
      this.uploadedImages.forEach((img, idx) => {
        if (totalPages > 1) {
          parts.push({
            text: `--- [INIZIO FOTO PAGINA ${idx + 1} DI ${totalPages}] ---`
          });
        }
        parts.push({
          inline_data: {
            mime_type: img.mimeType || 'image/jpeg',
            data: img.base64
          }
        });
        if (totalPages > 1) {
          parts.push({
            text: `--- [FINE FOTO PAGINA ${idx + 1} DI ${totalPages}] ---`
          });
        }
      });

      const manualText = manualTextInput ? manualTextInput.value.trim() : '';
      parts.push({
        text: promptText + (manualText ? `\n\nNote/testo aggiuntivo del libro:\n${manualText}` : '')
      });

      // Candidate models for automatic failover (Gemini 3 active generation)
      // Flash-Lite is placed as immediate fallback for ultra-low latency document processing
      const candidateModels = ['gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-3.1-flash-lite'];
      let data = null;
      let lastErrorMessage = '';
      let usedModel = 'gemini-3.8-flash';

      const timeoutId = setTimeout(() => abortController.abort(), 100000);

      modelLoop:
      for (const modelToCall of candidateModels) {
        usedModel = modelToCall;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelToCall}:generateContent?key=${apiKey}`;

        const genConfig = {
          responseMimeType: "application/json",
          temperature: 0.2
        };
        // Use "minimal" thinking to ensure fastest response without lengthy reasoning delays
        if (modelToCall.includes('3.8') || modelToCall.includes('3.6')) {
          genConfig.thinkingConfig = { thinkingLevel: "minimal" };
        }

        // Try up to 2 attempts on 3.8, 1 attempt on others
        const maxAttempts = modelToCall === 'gemini-3.8-flash' ? 2 : 1;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          // Per-attempt timeout (25s): never allow a hanging model to freeze the entire session
          const attemptController = new AbortController();
          let isAttemptTimeout = false;
          const attemptTimeoutId = setTimeout(() => {
            isAttemptTimeout = true;
            attemptController.abort();
          }, 25000);

          const onGlobalAbort = () => attemptController.abort();
          abortController.signal.addEventListener('abort', onGlobalAbort);

          try {
            const response = await fetch(url, {
              method: 'POST',
              signal: attemptController.signal,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{
                  role: "user",
                  parts: parts
                }],
                generationConfig: genConfig
              })
            });

            if (response.ok) {
              data = await response.json();
              break modelLoop; // Success! Exit outer loop
            }

            const errData = await response.json().catch(() => ({}));
            lastErrorMessage = errData.error?.message || `Errore HTTP ${response.status}`;
            console.warn(`[${modelToCall}] Tentativo ${attempt}/${maxAttempts} fallito: ${lastErrorMessage}`);

            const errMsgLower = lastErrorMessage.toLowerCase();
            const isSpike = response.status === 503 ||
                            response.status === 429 ||
                            errMsgLower.includes('high demand') ||
                            errMsgLower.includes('overloaded') ||
                            errMsgLower.includes('resource_exhausted') ||
                            errMsgLower.includes('unavailable');

            const isDeprecatedOrNotFound = response.status === 404 ||
                                           errMsgLower.includes('not found') ||
                                           errMsgLower.includes('no longer available') ||
                                           errMsgLower.includes('deprecated');

            if (isDeprecatedOrNotFound) {
              // Model is shut down or unavailable for this key, move to next candidate
              break;
            }

            if (isSpike) {
              if (attempt < maxAttempts) {
                if (loadingText) {
                  loadingText.innerText = `Server ${modelToCall} occupato, riprovo tra un attimo... (${attempt}/${maxAttempts}) ⏳`;
                }
                await new Promise(r => setTimeout(r, 2000));
                continue;
              } else {
                if (loadingText) {
                  loadingText.innerText = `Server ${modelToCall} saturo, passo a un modello più rapido... ⚡`;
                }
                break;
              }
            } else {
              // Check for invalid API key
              if (response.status === 400 && errMsgLower.includes('api_key_invalid')) {
                throw new Error("Chiave API Google non valida. Controlla la chiave nelle impostazioni.");
              }
              // For other non-fatal errors, try next model candidate
              break;
            }
          } catch (callErr) {
            if (abortController.signal.aborted) {
              throw callErr; // User explicitly cancelled
            }
            if (isAttemptTimeout) {
              console.warn(`[${modelToCall}] Timeout tentativo (>25s), passo al modello successivo...`);
              if (loadingText) {
                loadingText.innerText = `Modello ${modelToCall} lento a rispondere, provo un modello più veloce... ⚡`;
              }
              break; // Skip to next candidate model!
            }
            if (callErr.message && callErr.message.includes('non valida')) throw callErr;
            lastErrorMessage = callErr.message || 'Errore di connessione';
            console.warn(`[${modelToCall}] Errore di rete:`, callErr);
            break;
          } finally {
            clearTimeout(attemptTimeoutId);
            abortController.signal.removeEventListener('abort', onGlobalAbort);
          }
        }
      }

      clearTimeout(timeoutId);

      if (!data) {
        throw new Error(lastErrorMessage || "I server di Google sono momentaneamente saturi. Riprova tra 1 minuto.");
      }

      const candParts = data.candidates?.[0]?.content?.parts || [];
      // Pick the non-thought part that contains the final JSON
      const textPart = candParts.slice().reverse().find(p => p.text && !p.thought) || candParts[0];
      const rawText = textPart?.text;
      if (!rawText) throw new Error("La risposta dell'IA era vuota. Riprova con una foto più nitida.");

      // Parse JSON using the tested resilient extractor
      const parsedLesson = this.extractJson(rawText);
      if (!parsedLesson || !parsedLesson.titolo || !parsedLesson.quiz) {
        throw new Error("L'IA non ha formattato correttamente i dati della lezione. Riprova con un'altra foto.");
      }

      parsedLesson.id = 'custom-' + Date.now();
      // Ensure compatibility for both riassunto and storia_semplice
      parsedLesson.riassunto = parsedLesson.riassunto || parsedLesson.storia_semplice || '';
      parsedLesson.classe = parsedLesson.classe || (this.GRADE_PROFILES[this.selectedGrade]?.name || '3ª Elementare');
      parsedLesson.pagine = parsedLesson.pagine_analizzate || numPages;
      parsedLesson.storia_semplice = parsedLesson.riassunto;

      // Randomize quiz answers order immediately so it is varied in storage as well
      this.shuffleLessonQuiz(parsedLesson);

      // Save to localStorage
      let saved = [];
      try {
        saved = JSON.parse(localStorage.getItem('studio_magico_custom_lessons') || '[]');
      } catch (e) {}
      saved.unshift(parsedLesson);
      localStorage.setItem('studio_magico_custom_lessons', JSON.stringify(saved));

      if (uploadModal) uploadModal.classList.add('hidden');

      // Clear upload inputs
      this.uploadedImages = [];
      this.renderUploadedPagesPreview();
      if (manualTextInput) manualTextInput.value = '';

      this.sound.fanfare();
      this.loadLesson(parsedLesson);
      this.renderSavedLessonsList();
      this.switchTab('storia');
      this.setMascotMessage("Evviva! Ho preparato la spiegazione della lezione, le flashcard e i quiz! 🚀");

    } catch (err) {
      this.sound.hint();
      console.error("StudioMagico AI Error:", err);
      if (errorBox && errorMsg) {
        errorMsg.innerText = err.message || "Errore sconosciuto";
        if (errorDetails) {
          errorDetails.innerText = `Modello chiamato: ${typeof usedModel !== 'undefined' ? usedModel : 'gemini-3.8-flash'} | Tempo: ${elapsedSeconds}s | ${new Date().toLocaleTimeString()}`;
        }
        errorBox.classList.remove('hidden');
      }
      if (err.name === 'AbortError') {
        alert("Elaborazione interrotta (timeout o annullata). Riprova!");
      } else {
        alert("Si è verificato un errore durante l'elaborazione:\n" + err.message + "\n\nSuggerimento: Controlla che la chiave API sia valida e che le foto siano ben illuminate.");
      }
    } finally {
      if (interval) clearInterval(interval);
      if (timerInterval) clearInterval(timerInterval);
      if (loadingState) loadingState.classList.add('hidden');
      if (analyzeBtn) analyzeBtn.disabled = false;
    }
  },

  extractJson(text) {
    if (!text || typeof text !== 'string') return null;
    let clean = text.trim();
    const jsonMatch = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      clean = jsonMatch[1].trim();
    }
    try {
      return JSON.parse(clean);
    } catch (e) {
      const start = clean.indexOf('{');
      const end = clean.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        try {
          return JSON.parse(clean.substring(start, end + 1));
        } catch (err) {
          return null;
        }
      }
      return null;
    }
  }
};

// Initialize App on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
