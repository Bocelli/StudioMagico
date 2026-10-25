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

// --- Voice Narrator (Web Speech API for Italian Children) ---
class VoiceNarrator {
  constructor() {
    this.synth = window.speechSynthesis || null;
    this.isSpeaking = false;
    this.italianVoice = null;
    this.onEndCallback = null;

    if (this.synth) {
      this.loadVoices();
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  loadVoices() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    // Prefer clear Italian voices (Google italiano, Alice, Cosimo, Elsa, Federica, etc.)
    this.italianVoice = voices.find(v => v.lang.startsWith('it') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Alice'))) ||
                        voices.find(v => v.lang.startsWith('it')) || null;
  }

  speak(text, onStart, onEnd) {
    if (!this.synth) {
      alert("Il tuo browser non supporta la sintesi vocale, ma puoi leggere comodamente il testo!");
      return;
    }

    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'it-IT';
    utterance.rate = 0.92; // Slightly slower, very clear for 3rd grade
    utterance.pitch = 1.05; // Friendly and cheerful
    if (this.italianVoice) {
      utterance.voice = this.italianVoice;
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      if (onStart) onStart();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      console.warn("Speech synthesis error", e);
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };

    this.synth.speak(utterance);
  }

  stop() {
    if (this.synth && this.synth.speaking) {
      this.synth.cancel();
      this.isSpeaking = false;
      if (this.onEndCallback) this.onEndCallback();
    }
  }
}

// --- Application State & Controller ---
const App = {
  sound: new SoundEffects(),
  voice: new VoiceNarrator(),
  currentLesson: null,
  activeTab: 'storia', // 'storia' | 'flashcard' | 'quiz' | 'curiosita'
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
    this.loadStats();
    this.setupMascotGreetings();
    this.renderHeaderStats();
    this.bindEvents();

    // Load first demo lesson by default so the app is immediately alive!
    if (window.DEMO_LESSONS && window.DEMO_LESSONS.length > 0) {
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

  setMascotMessage(text, speak = false) {
    const msgEl = document.getElementById('mascotMessage');
    if (msgEl) {
      msgEl.innerText = text;
      msgEl.parentElement.classList.add('scale-105');
      setTimeout(() => msgEl.parentElement.classList.remove('scale-105'), 200);
    }
    if (speak) {
      this.voice.speak(text);
    }
  },

  setupMascotGreetings() {
    const greetings = [
      "Ciao campione! Pronto a fare scoperte incredibili oggi? 🚀",
      "Bentornato! Oggi diventeremo dei veri maestri dello studio! 💡",
      "Non preoccuparti per la lezione: con me imparare è un gioco da ragazzi! ⭐"
    ];
    const randomGreet = greetings[Math.floor(Math.random() * greetings.length)];
    this.setMascotMessage(randomGreet);
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
        alert('Impostazioni salvate con successo! Ora puoi analizzare le pagine del libro!');
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

    // Voice narration controls
    const listenStoryBtn = document.getElementById('listenStoryBtn');
    if (listenStoryBtn) {
      listenStoryBtn.addEventListener('click', () => {
        if (this.voice.isSpeaking) {
          this.voice.stop();
          listenStoryBtn.innerHTML = '<span>🔊</span><span>Ascolta con Leo</span>';
        } else if (this.currentLesson) {
          listenStoryBtn.innerHTML = '<span>⏹️</span><span>Ferma Voce</span>';
          this.voice.speak(
            `${this.currentLesson.titolo}. ${this.currentLesson.storia_semplice}`,
            () => {},
            () => {
              listenStoryBtn.innerHTML = '<span>🔊</span><span>Ascolta con Leo</span>';
            }
          );
        }
      });
    }

    // Mark Story as Read Button
    const markReadBtn = document.getElementById('markReadBtn');
    if (markReadBtn) {
      markReadBtn.addEventListener('click', () => {
        if (!this.currentLesson) return;
        if (!this.stats.readLessons.includes(this.currentLesson.id)) {
          this.stats.readLessons.push(this.currentLesson.id);
          this.addStars(20, 'storia_letta');
          markReadBtn.innerHTML = '<span>✅</span><span>Completata! (+20 ⭐)</span>';
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
    this.voice.stop();
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
    ['storia', 'flashcard', 'quiz', 'curiosita'].forEach(t => {
      const el = document.getElementById(`tab-${t}`);
      if (el) {
        if (t === tab) {
          el.classList.remove('hidden');
        } else {
          el.classList.add('hidden');
        }
      }
    });

    // Mascot context reactions
    if (tab === 'storia') {
      this.setMascotMessage("Ecco la storia della lezione! Puoi leggerla o cliccare 'Ascolta' per farla leggere a me! 📖");
    } else if (tab === 'flashcard') {
      this.setMascotMessage("Tocca le carte per girarle e scoprire i trucchi delle parole chiave! 🗂️");
      this.renderFlashcard();
    } else if (tab === 'quiz') {
      this.setMascotMessage("Pronto per la sfida a quiz? Guadagna stelline rispondendo alle domande! 🎯");
      this.renderQuizQuestion();
    } else if (tab === 'curiosita') {
      this.setMascotMessage("Sapevi queste cose straordinarie? Leggi le curiosità e fai la mini-sfida! 💡");
    }
  },

  loadLesson(lesson) {
    this.currentLesson = lesson;
    this.currentCardIndex = 0;
    this.currentQuizIndex = 0;
    this.quizAnswersState = {};

    // Update Banner Info
    const titleEl = document.getElementById('lessonTitle');
    const subjectEl = document.getElementById('lessonSubject');
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

    // Render Story
    const storyEl = document.getElementById('storyContent');
    if (storyEl) {
      const paragraphs = lesson.storia_semplice.split('\n\n');
      storyEl.innerHTML = paragraphs.map(p => `
        <p class="leading-relaxed text-slate-700 text-lg md:text-xl font-medium mb-4">${p.trim()}</p>
      `).join('');
    }

    // Reset Read button
    const markReadBtn = document.getElementById('markReadBtn');
    if (markReadBtn) {
      const isRead = this.stats.readLessons.includes(lesson.id);
      markReadBtn.disabled = isRead;
      if (isRead) {
        markReadBtn.innerHTML = '<span>✅</span><span>Completata! (+20 ⭐)</span>';
        markReadBtn.classList.add('opacity-75', 'cursor-not-allowed');
      } else {
        markReadBtn.innerHTML = '<span>⭐</span><span>Ho letto la storia! (+20 ⭐)</span>';
        markReadBtn.classList.remove('opacity-75', 'cursor-not-allowed');
      }
    }

    // Render Flashcards & Quiz
    this.renderFlashcard();
    this.renderQuizQuestion();
    this.renderCuriosities();
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
            <div class="mt-4 flex gap-2">
              <button onclick="event.stopPropagation(); App.voice.speak('${card.termine}. ${card.spiegazione.replace(/'/g, "\\'")}')" class="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold flex items-center gap-1 shadow">
                🔊 Ascolta
              </button>
            </div>
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

  // --- Quiz Engine ---
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
          <button onclick="App.voice.speak('${q.domanda.replace(/'/g, "\\'")}')" class="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-xl">
            🔊 Leggi domanda
          </button>
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
              <h4 class="font-bold text-amber-900 text-sm">Aiutino di Leo il Robot:</h4>
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
    this.renderQuizQuestion();
  },

  showDiploma() {
    this.sound.fanfare();
    const modal = document.getElementById('diplomaModal');
    const diplomaTitle = document.getElementById('diplomaLessonTitle');
    const diplomaDate = document.getElementById('diplomaDate');
    if (diplomaTitle) diplomaTitle.innerText = this.currentLesson.titolo;
    if (diplomaDate) diplomaDate.innerText = new Date().toLocaleDateString('it-IT');
    if (modal) modal.classList.remove('hidden');
    if (window.confetti) {
      window.confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
    }
  },

  closeDiploma() {
    const modal = document.getElementById('diplomaModal');
    if (modal) modal.classList.add('hidden');
  },

  renderCuriosities() {
    const container = document.getElementById('curiositaContent');
    if (!container || !this.currentLesson) return;

    const curiosita = this.currentLesson.curiosita || [];
    const sfida = this.currentLesson.sfida_veloce || "Racconta a voce alta a mamma o papà quello che hai imparato in soli 30 secondi!";

    container.innerHTML = `
      <div class="space-y-6">
        <div class="card-clay p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <div class="flex items-center gap-3 mb-4">
            <span class="text-3xl">🚀</span>
            <h3 class="text-2xl font-bold text-purple-900 font-heading">Lo Sapevi Che...?</h3>
          </div>
          <div class="space-y-3">
            ${curiosita.map(c => `
              <div class="p-4 bg-white/90 rounded-2xl border border-purple-100 flex items-start gap-3 shadow-sm">
                <span class="text-xl">✨</span>
                <p class="text-slate-800 text-lg font-medium leading-relaxed">${c}</p>
                <button onclick="App.voice.speak('${c.replace(/'/g, "\\'")}')" class="text-purple-600 hover:text-purple-900 p-1 rounded-lg ml-auto" title="Ascolta">
                  🔊
                </button>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="card-clay p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
          <div class="flex items-center gap-3 mb-3">
            <span class="text-3xl">⚡</span>
            <h3 class="text-2xl font-bold text-emerald-900 font-heading">Mini Sfida di Azione!</h3>
          </div>
          <p class="text-emerald-900 text-lg font-semibold bg-white/90 p-4 rounded-2xl border border-emerald-200 mb-4">
            ${sfida}
          </p>
          <button onclick="App.completeChallenge()" class="btn-tactile btn-emerald px-5 py-2.5 rounded-2xl font-bold flex items-center gap-2 shadow">
            🎉 Ho fatto la sfida! (+15 ⭐)
          </button>
        </div>
      </div>
    `;
  },

  completeChallenge() {
    this.addStars(15, 'sfida_fatta');
    if (window.confetti) {
      window.confetti({ particleCount: 80, spread: 60 });
    }
  },

  // --- Saved Lessons & History ---
  renderSavedLessonsList() {
    const list = document.getElementById('demoLessonsList');
    if (!list) return;

    let saved = [];
    try {
      saved = JSON.parse(localStorage.getItem('studio_magico_custom_lessons') || '[]');
    } catch (e) {
      saved = [];
    }

    const allLessons = [...(window.DEMO_LESSONS || []), ...saved];

    list.innerHTML = allLessons.map(l => `
      <div onclick="App.loadLessonById('${l.id}')" 
           class="card-clay p-4 cursor-pointer hover:border-blue-400 flex items-center justify-between transition-all ${this.currentLesson && this.currentLesson.id === l.id ? 'border-2 border-blue-500 bg-blue-50/40' : 'bg-white'}">
        <div class="flex items-center gap-3">
          <span class="text-3xl">${l.materia === 'Storia' ? '🔥' : l.materia === 'Scienze' ? '💧' : l.materia === 'Geografia' ? '🏔️' : '📚'}</span>
          <div>
            <h4 class="font-bold text-slate-800 text-base md:text-lg font-heading leading-tight">${l.titolo}</h4>
            <span class="text-xs font-bold text-slate-500 uppercase">${l.materia}</span>
          </div>
        </div>
        <span class="btn-tactile btn-slate text-xs font-bold px-3 py-1.5 rounded-xl">
          Apri ➔
        </span>
      </div>
    `).join('');
  },

  loadLessonById(id) {
    this.sound.pop();
    let saved = [];
    try {
      saved = JSON.parse(localStorage.getItem('studio_magico_custom_lessons') || '[]');
    } catch (e) {}

    const allLessons = [...(window.DEMO_LESSONS || []), ...saved];
    const found = allLessons.find(l => l.id === id);
    if (found) {
      this.loadLesson(found);
      this.renderSavedLessonsList();
      this.switchTab('storia');
    }
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

    try {
      if (analyzeBtn) analyzeBtn.disabled = true;
      if (loadingState) loadingState.classList.remove('hidden');

      let elapsedSeconds = 0;
      if (loadingTimer) loadingTimer.innerText = '0s';
      timerInterval = setInterval(() => {
        elapsedSeconds++;
        if (loadingTimer) loadingTimer.innerText = `${elapsedSeconds}s`;
      }, 1000);

      const loadingSteps = [
        `Leo sta leggendo ${this.uploadedImages.length > 1 ? 'le ' + this.uploadedImages.length + ' pagine' : 'la pagina'} del tuo libro... 📖`,
        "Estraendo le idee più importanti e le parole magiche... ✨",
        "Scrivendo la storia divertente per la 3ª elementare... ✏️",
        "Creando il Super Quiz con aiutini amichevoli... 🎯"
      ];
      let stepIdx = 0;
      interval = setInterval(() => {
        stepIdx = (stepIdx + 1) % loadingSteps.length;
        if (loadingText) loadingText.innerText = loadingSteps[stepIdx];
      }, 2500);

      const promptText = `
Sei "Leo", il tutor di studio per bambini di 3ª elementare (8-9 anni).
Dalle pagine caricate, crea una spiegazione chiara e coinvolgente.
Sii sintetico, chiaro, usa frasi brevi con metafore semplici.
Rispondi ESCLUSIVAMENTE con un JSON con la seguente struttura:
{
  "titolo": "Titolo accattivante della lezione",
  "materia": "Storia | Scienze | Geografia | Italiano | Altro",
  "storia_semplice": "Un racconto scorrevole di 3-4 brevi paragrafi che spiega la lezione come un'avventura.",
  "parole_chiave": [
    {
      "termine": "Concetto 1",
      "emoji": "Icona",
      "spiegazione": "Definizione semplice in 1 o 2 frasi."
    },
    {
      "termine": "Concetto 2",
      "emoji": "Icona",
      "spiegazione": "Definizione semplice in 1 o 2 frasi."
    },
    {
      "termine": "Concetto 3",
      "emoji": "Icona",
      "spiegazione": "Definizione semplice in 1 o 2 frasi."
    }
  ],
  "quiz": [
    {
      "domanda": "Domanda chiara?",
      "opzioni": ["Opzione A", "Opzione B", "Opzione C"],
      "risposta_corretta": 0,
      "indizio": "Un aiutino amichevole per chi sbaglia."
    },
    {
      "domanda": "Seconda domanda?",
      "opzioni": ["Opzione A", "Opzione B", "Opzione C"],
      "risposta_corretta": 1,
      "indizio": "Un aiutino amichevole."
    },
    {
      "domanda": "Terza domanda?",
      "opzioni": ["Opzione A", "Opzione B", "Opzione C"],
      "risposta_corretta": 2,
      "indizio": "Un aiutino amichevole."
    }
  ],
  "curiosita": [
    "Un fatto sorprendente per dire 'Wow!' sulla lezione."
  ],
  "sfida_veloce": "Una mini sfida da mimare o fare in 30 secondi."
}
`;

      const parts = [];
      // Push all compressed pages in order
      this.uploadedImages.forEach((img) => {
        parts.push({
          inline_data: {
            mime_type: img.mimeType || 'image/jpeg',
            data: img.base64
          }
        });
      });

      const manualText = manualTextInput ? manualTextInput.value.trim() : '';
      parts.push({
        text: promptText + (manualText ? `\n\nNote/testo aggiuntivo del libro:\n${manualText}` : '')
      });

      const modelName = localStorage.getItem('gemini_selected_model') || 'gemini-3.8-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

      // Max 45 seconds timeout so it never hangs
      const timeoutId = setTimeout(() => abortController.abort(), 45000);

      const response = await fetch(url, {
        method: 'POST',
        signal: abortController.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: parts
          }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2
          }
        })
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `Errore HTTP ${response.status}`);
      }

      const data = await response.json();
      const candParts = data.candidates?.[0]?.content?.parts || [];
      // In Gemini 3.8 Flash, pick the non-thought part that contains the final JSON
      const textPart = candParts.slice().reverse().find(p => p.text && !p.thought) || candParts[0];
      const rawText = textPart?.text;
      if (!rawText) throw new Error("La risposta dell'IA era vuota. Riprova con una foto più nitida.");

      // Parse JSON using the tested resilient extractor
      const parsedLesson = this.extractJson(rawText);
      if (!parsedLesson || !parsedLesson.titolo || !parsedLesson.quiz) {
        throw new Error("L'IA non ha formattato correttamente i dati della lezione. Riprova con un'altra foto.");
      }

      parsedLesson.id = 'custom-' + Date.now();

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
      this.setMascotMessage("Evviva! Ho trasformato tutte le pagine del tuo libro in un gioco! Iniziamo dalla storia! 🚀", true);

    } catch (err) {
      this.sound.hint();
      if (err.name === 'AbortError') {
        alert("Elaborazione interrotta (timeout o annullata). Riprova!");
      } else {
        console.error(err);
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
