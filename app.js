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
    this.voices = [];
    this.selectedVoice = null;
    this.isSpeaking = false;
    this.speechRate = parseFloat(localStorage.getItem('studio_magico_voice_rate') || '0.98');
    this.onEndCallback = null;

    if (this.synth) {
      this.loadVoices();
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  loadVoices() {
    if (!this.synth) return [];
    const rawVoices = this.synth.getVoices();
    // Normalize language codes (handles it_IT, it-IT)
    this.voices = rawVoices.filter(v => {
      const lang = (v.lang || '').replace('_', '-').toLowerCase();
      return lang.startsWith('it');
    });

    // Score voices by quality (Natural/Neural/Online/Network > Enhanced/Google > local)
    const scoreVoice = (v) => {
      const name = (v.name || '').toLowerCase();
      if (name.includes('natural') || name.includes('online')) return 100;
      if (name.includes('neural')) return 95;
      if (name.includes('enhanced') || name.includes('premium')) return 90;
      if (name.includes('network')) return 85; // Android Google Cloud voice
      if (name.includes('google')) return 70;
      if (name.includes('alice') || name.includes('federica') || name.includes('elsa') || name.includes('isabella') || name.includes('cosimo')) return 65;
      if (name.includes('local')) return 10; // low score for robotic offline engines
      return 50;
    };

    this.voices.sort((a, b) => scoreVoice(b) - scoreVoice(a));

    const savedVoiceName = localStorage.getItem('studio_magico_voice_name');
    if (savedVoiceName) {
      this.selectedVoice = this.voices.find(v => v.name === savedVoiceName) || this.voices[0] || null;
    } else {
      this.selectedVoice = this.voices[0] || null;
    }

    return this.voices;
  }

  speak(text, onStart, onEnd) {
    if (!this.synth) {
      alert("Il tuo browser non supporta la sintesi vocale, ma puoi leggere comodamente il testo!");
      return;
    }

    this.stop();
    if (!text || typeof text !== 'string') return;

    this.onEndCallback = onEnd;

    // Clean text: strip markdown symbols, asterisks, bullet dashes
    const cleanedText = text
      .replace(/[*#•_~`>-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Split text into natural sentences at punctuation (. ! ? :)
    // This gives proper human intonation curves and natural breath pauses!
    const rawSentences = cleanedText.match(/[^.!?:]+[.!?:]+/g);
    const sentences = (rawSentences && rawSentences.length > 0) ? rawSentences : [cleanedText];

    this.isSpeaking = true;
    if (onStart) onStart();

    let index = 0;
    const speakNext = () => {
      if (!this.isSpeaking || index >= sentences.length) {
        this.isSpeaking = false;
        if (onEnd) onEnd();
        return;
      }

      const sentenceText = sentences[index].trim();
      index++;
      if (!sentenceText) {
        speakNext();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(sentenceText);
      utterance.lang = 'it-IT';
      utterance.rate = this.speechRate;
      // Strictly 1.0 pitch: zero synthetic frequency warping or chipmunk artifacts
      utterance.pitch = 1.0;

      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }

      utterance.onend = () => {
        // Natural human breath pause between sentences (120ms)
        setTimeout(speakNext, 120);
      };

      utterance.onerror = (e) => {
        console.warn("Speech error on sentence", e);
        speakNext();
      };

      this.synth.speak(utterance);
    };

    speakNext();
  }

  stop() {
    this.isSpeaking = false;
    if (this.synth) {
      this.synth.cancel();
      if (this.onEndCallback) {
        const cb = this.onEndCallback;
        this.onEndCallback = null;
        cb();
      }
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

        // Populate voice dropdown with quality scoring
        const voiceSelect = document.getElementById('voiceSelectInput');
        if (voiceSelect) {
          const italianVoices = this.voice.loadVoices();
          if (italianVoices.length === 0) {
            voiceSelect.innerHTML = '<option value="">Voce italiana predefinita</option>';
          } else {
            voiceSelect.innerHTML = italianVoices.map(v => {
              const isSelected = this.voice.selectedVoice && this.voice.selectedVoice.name === v.name;
              const nameLower = v.name.toLowerCase();
              const isNatural = nameLower.includes('natural') || nameLower.includes('online') || nameLower.includes('neural') || nameLower.includes('enhanced') || nameLower.includes('network');
              return `<option value="${v.name}" ${isSelected ? 'selected' : ''}>
                ${v.name} ${isNatural ? '⭐ (Alta Qualità)' : ''}
              </option>`;
            }).join('');
          }
        }

        // Voice rate slider setup
        const rateSlider = document.getElementById('voiceRateSlider');
        const rateVal = document.getElementById('voiceRateVal');
        if (rateSlider && rateVal) {
          rateSlider.value = this.voice.speechRate;
          rateVal.innerText = `${this.voice.speechRate}x`;
          rateSlider.oninput = (e) => {
            rateVal.innerText = `${e.target.value}x`;
          };
        }

        settingsModal.classList.remove('hidden');
      });
    }

    // Test Voice Button
    const testVoiceBtn = document.getElementById('testVoiceBtn');
    if (testVoiceBtn) {
      testVoiceBtn.addEventListener('click', () => {
        const voiceSelect = document.getElementById('voiceSelectInput');
        if (voiceSelect && voiceSelect.value) {
          this.voice.selectedVoice = this.voice.voices.find(v => v.name === voiceSelect.value) || this.voice.selectedVoice;
        }
        const rateSlider = document.getElementById('voiceRateSlider');
        if (rateSlider) {
          this.voice.speechRate = parseFloat(rateSlider.value);
        }

        testVoiceBtn.innerHTML = '<span>🔊</span><span>Ascolto...</span>';
        this.voice.speak(
          "Ciao! Leggerò la spiegazione del libro in modo chiaro, naturale e tranquillo.",
          () => {},
          () => {
            testVoiceBtn.innerHTML = '<span>▶️</span><span>Prova Voce</span>';
          }
        );
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

        // Save selected voice and rate
        const voiceSelect = document.getElementById('voiceSelectInput');
        if (voiceSelect && voiceSelect.value) {
          localStorage.setItem('studio_magico_voice_name', voiceSelect.value);
          this.voice.selectedVoice = this.voice.voices.find(v => v.name === voiceSelect.value) || this.voice.selectedVoice;
        }
        const rateSlider = document.getElementById('voiceRateSlider');
        if (rateSlider) {
          localStorage.setItem('studio_magico_voice_rate', rateSlider.value);
          this.voice.speechRate = parseFloat(rateSlider.value);
        }

        this.sound.success();
        alert('Impostazioni e voce salvate con successo!');
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
          listenStoryBtn.innerHTML = '<span>🔊</span><span>Ascolta il Riassunto</span>';
        } else if (this.currentLesson) {
          listenStoryBtn.innerHTML = '<span>⏹️</span><span>Ferma Voce</span>';
          const content = this.currentLesson.riassunto || this.currentLesson.storia_semplice || '';
          const cleanSpeech = content
            .replace(/[*#•_~`>-]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          this.voice.speak(
            `${this.currentLesson.titolo}. ${cleanSpeech}`,
            () => {},
            () => {
              listenStoryBtn.innerHTML = '<span>🔊</span><span>Ascolta il Riassunto</span>';
            }
          );
        }
      });
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

    // Context reactions
    if (tab === 'storia') {
      this.setMascotMessage("Ecco la spiegazione continua e scorrevole della lezione! Puoi leggerla o cliccare 'Ascolta' per farla leggere ad alta voce! 📖");
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

    // Render Structured Summary
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
        markReadBtn.innerHTML = '<span>⭐</span><span>Ho letto il riassunto! (+20 ⭐)</span>';
        markReadBtn.classList.remove('opacity-75', 'cursor-not-allowed');
      }
    }

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
        "Scrittura della spiegazione continua e scorrevole per il bambino... ✏️",
        "Generazione delle flashcard didattiche... 🗂️",
        "Creazione del Super Quiz per la verifica... 🎯 (ancora pochi istanti!)"
      ];
      let stepIdx = 0;
      interval = setInterval(() => {
        stepIdx = (stepIdx + 1) % loadingSteps.length;
        if (loadingText) loadingText.innerText = loadingSteps[stepIdx];
      }, 3000);

      const totalPages = this.uploadedImages.length;
      // Generous target: at least 5 for 1 page, 7-10 for multi-page
      const targetCount = totalPages > 1 ? Math.min(10, Math.max(7, totalPages * 4)) : 5;

      const promptText = `
Sei un autore esperto di testi divulgativi e scolastici per bambini di 3ª elementare (8-9 anni).
Il tuo obiettivo è spiegare tutti i contenuti delle pagine caricate con una SPIEGAZIONE OMOGENEA, CONTINUA E SCORREVOLE, piacevole da leggere come un bel racconto informativo per ragazzi, insieme a flashcard e quiz per consolidare lo studio.

REGOLE FONDAMENTALI SULLA STRUTTURA DEL TESTO (campo "riassunto"):
1. TESTO CONTINUO E UNITARIO (SENZA SCHEMI STEP-BY-STEP O ELENCHI):
   - Scrivi una narrazione fluida e continua suddivisa in 3-5 paragrafi ben spaziati (usa doppi a capo \\n\\n tra un paragrafo e l'altro).
   - NON usare elenchi puntati (niente trattini -, niente pallini •).
   - NON usare titoli o etichette rigide a sezioni (NIENTE "📌 INTRODUZIONE", NIENTE "🔍 PUNTI PRINCIPALI", NIENTE "💡 IN SINTESI", NIENTE "Step 1/2").
   - I paragrafi devono scorrere in modo armonioso dall'inizio alla fine, collegando tutte le nozioni, le figure e le scoperte in una spiegazione omogenea e appassionante.

2. COMPLETEZZA SULLE PAGINE:
   - Spiega con cura e precisione TUTTI i concetti, i mestieri, le definizioni o le fasi presenti nelle pagine caricate, integrando tutto nel testo senza tralasciare nulla.
   - Evidenzia le parole chiave fondamentali in **grassetto** direttamente all'interno delle frasi per facilitare la memoria visiva del bambino.

3. STILE ADATTO A UN BAMBINO DI 8 ANNI (SENZA FORZATURE INFANTILI):
   - Usa un lessico chiaro, semplice e coinvolgente, con frasi brevi e ritmo piacevole.
   - NON usare formule finte o roleplay infantile (NIENTE "Ciao sono Leo", NIENTE "Ciao piccolo esploratore", NIENTE "C'era una volta", NIENTE "Ma l'avventura continua nella pagina successiva").
   - Il tono deve essere caldo, istruttivo e limpido, come nei migliori libri di lettura per ragazzi.

${totalPages > 1 ? `ATTENZIONE MULTI-PAGINA: Sono state caricate ${totalPages} pagine consecutive. Il testo deve unire ed esporre TUTTE le ${totalPages} pagine in un unico racconto logico e continuativo, e le ${targetCount} flashcard e ${targetCount} quiz devono verificare tutte le pagine!` : ''}

REQUISITI PER FLASHCARD E QUIZ:
- "parole_chiave": ${targetCount} flashcard con termine, emoji adatta e spiegazione semplice in 1 o 2 frasi.
- "quiz": ${targetCount} domande a risposta multipla con 3 opzioni (una sola corretta) e un utile indizio per chi sbaglia.

Rispondi ESCLUSIVAMENTE con un JSON con la seguente struttura:
{
  "titolo": "Titolo chiaro e corretto della lezione",
  "materia": "Storia | Scienze | Geografia | Italiano | Altro",
  "riassunto": "Primo paragrafo continuo che introduce l'argomento e i concetti chiave con **termini in grassetto**...\\n\\nSecondo paragrafo continuo che prosegue la spiegazione collegando gli elementi in modo naturale...\\n\\nTerzo paragrafo continuo che completa la lezione e conclude con una riflessione chiara...",
  "parole_chiave": [
    {
      "termine": "Concetto chiave",
      "emoji": "Icona adatta",
      "spiegazione": "Definizione chiara e semplice in 1 o 2 frasi."
    }
  ],
  "quiz": [
    {
      "domanda": "Domanda di verifica della comprensione?",
      "opzioni": ["Opzione corretta", "Opzione sbagliata 1", "Opzione sbagliata 2"],
      "risposta_corretta": 0,
      "indizio": "Un aiutino chiaro per ragionare sulla risposta corretta."
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
      parsedLesson.storia_semplice = parsedLesson.riassunto;

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
      this.setMascotMessage("Evviva! Ho preparato la spiegazione della lezione, le flashcard e i quiz! 🚀", true);

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
