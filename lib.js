// lib.js - Pure logic shared by the browser app and test.js (no DOM access here)
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.StudioLib = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
  const DEFAULT_MODEL = 'gemini-3.8-flash';
  const CANDIDATE_MODELS = ['gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-3.1-flash-lite'];

  // The model chosen by the parent goes first, the others stay as failover.
  function orderModels(selected) {
    if (!CANDIDATE_MODELS.includes(selected)) return CANDIDATE_MODELS.slice();
    return [selected].concat(CANDIDATE_MODELS.filter(m => m !== selected));
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Handles raw JSON, ```json fences and JSON embedded in free text.
  function extractJson(text) {
    if (!text || typeof text !== 'string') return null;
    let clean = text.trim();
    const fenced = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fenced && fenced[1]) clean = fenced[1].trim();
    try {
      return JSON.parse(clean);
    } catch (e) {
      const start = clean.indexOf('{');
      const end = clean.lastIndexOf('}');
      if (start !== -1 && end > start) {
        try {
          return JSON.parse(clean.substring(start, end + 1));
        } catch (err) {
          return null;
        }
      }
      return null;
    }
  }

  const isText = v => typeof v === 'string' && v.trim().length > 0;

  // Validates and cleans a lesson coming from the AI or from localStorage.
  // Throws an Italian, user-facing Error when the lesson cannot be used.
  function normalizeLesson(raw) {
    if (!raw || typeof raw !== 'object') throw new Error('La lezione ricevuta non è valida.');

    const riassunto = raw.riassunto || raw.storia_semplice;
    if (!isText(raw.titolo)) throw new Error('La lezione generata non ha un titolo.');
    if (!isText(riassunto)) throw new Error('La lezione generata non ha il riassunto.');

    const parole_chiave = (Array.isArray(raw.parole_chiave) ? raw.parole_chiave : [])
      .filter(c => c && isText(c.termine) && isText(c.spiegazione))
      .map(c => ({ termine: c.termine, emoji: isText(c.emoji) ? c.emoji : '', spiegazione: c.spiegazione }));

    const quiz = (Array.isArray(raw.quiz) ? raw.quiz : [])
      .map(q => {
        if (!q || !isText(q.domanda) || !Array.isArray(q.opzioni)) return null;
        const opzioni = q.opzioni.filter(isText);
        const idx = Number(q.risposta_corretta);
        // Dropping an option would shift the correct index: only keep fully valid questions.
        if (opzioni.length !== q.opzioni.length || opzioni.length < 2) return null;
        if (!Number.isInteger(idx) || idx < 0 || idx >= opzioni.length) return null;
        return { domanda: q.domanda, opzioni, risposta_corretta: idx, indizio: isText(q.indizio) ? q.indizio : '' };
      })
      .filter(Boolean);

    if (parole_chiave.length < 1) throw new Error('La lezione generata non ha flashcard utilizzabili. Riprova.');
    if (quiz.length < 1) throw new Error('La lezione generata non ha domande utilizzabili. Riprova.');

    return {
      id: isText(raw.id) ? raw.id : undefined,
      titolo: raw.titolo.trim(),
      materia: isText(raw.materia) ? raw.materia.trim() : 'Altro',
      riassunto,
      storia_semplice: riassunto,
      parole_chiave,
      quiz
    };
  }

  function formatSummary(text) {
    if (!text || typeof text !== 'string') return '';
    text = escapeHtml(text); // AI output is untrusted: escape first, then add our own tags
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
  }

  function buildGeminiParts(images, prompt, manualText) {
    const parts = [];
    const total = images.length;
    if (total > 1) {
      parts.push({
        text: `AVVISO: In questo messaggio sono allegate ${total} pagine consecutive numerate in sequenza (Pagina 1, Pagina 2...). Leggi, analizza e integra TUTTE le ${total} pagine nel riassunto!`
      });
    }
    images.forEach((img, idx) => {
      if (total > 1) parts.push({ text: `--- [INIZIO FOTO PAGINA ${idx + 1} DI ${total}] ---` });
      parts.push({ inline_data: { mime_type: img.mimeType || 'image/jpeg', data: img.base64 } });
      if (total > 1) parts.push({ text: `--- [FINE FOTO PAGINA ${idx + 1} DI ${total}] ---` });
    });
    parts.push({ text: prompt + (manualText ? `\n\nNote/testo aggiuntivo del libro:\n${manualText}` : '') });
    return parts;
  }

  // Skips "thought" parts and returns the final answer text.
  function extractTextFromParts(parts) {
    const list = Array.isArray(parts) ? parts : [];
    const part = list.slice().reverse().find(p => p.text && !p.thought) || list[0];
    return part ? part.text : null;
  }

  function buildGenerationConfig(model) {
    const config = { responseMimeType: 'application/json', temperature: 0.2 };
    // "minimal" thinking keeps latency low on the models that support it
    if (model.includes('3.8') || model.includes('3.6')) {
      config.thinkingConfig = { thinkingLevel: 'minimal' };
    }
    return config;
  }

  // Calls Gemini trying each model in order. Returns { data, usedModel }.
  // Throws Error (with .usedModel) when every model failed, an AbortError when `signal` aborts.
  async function callGeminiWithFailover(opts) {
    const {
      fetchImpl, apiKey, models, parts, signal,
      onStatus = () => {}, attemptTimeoutMs = 25000, retryDelayMs = 2000
    } = opts;

    let lastErrorMessage = '';
    let usedModel = models[0];
    const fail = (message) => {
      const err = new Error(message);
      err.usedModel = usedModel;
      return err;
    };

    for (const model of models) {
      usedModel = model;
      const maxAttempts = model === models[0] ? 2 : 1;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const attemptController = new AbortController();
        let timedOut = false;
        const timer = setTimeout(() => { timedOut = true; attemptController.abort(); }, attemptTimeoutMs);
        const onAbort = () => attemptController.abort();
        if (signal) signal.addEventListener('abort', onAbort);

        try {
          const response = await fetchImpl(`${API_BASE}/${model}:generateContent`, {
            method: 'POST',
            signal: attemptController.signal,
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
            body: JSON.stringify({
              contents: [{ role: 'user', parts }],
              generationConfig: buildGenerationConfig(model)
            })
          });

          if (response.ok) return { data: await response.json(), usedModel: model };

          const errData = await response.json().catch(() => ({}));
          lastErrorMessage = (errData.error && errData.error.message) || `Errore HTTP ${response.status}`;
          const lower = lastErrorMessage.toLowerCase();
          const rawLower = JSON.stringify(errData).toLowerCase();

          if (response.status === 400 && (rawLower.includes('api_key_invalid') || lower.includes('api key not valid'))) {
            throw fail('Chiave API Google non valida. Controlla la chiave nelle impostazioni.');
          }

          const isSpike = response.status === 503 || response.status === 429 ||
            lower.includes('high demand') || lower.includes('overloaded') ||
            lower.includes('resource_exhausted') || lower.includes('unavailable');
          const isGone = response.status === 404 || lower.includes('not found') ||
            lower.includes('no longer available') || lower.includes('deprecated');

          if (isGone) break;
          if (isSpike && attempt < maxAttempts) {
            onStatus(`Server ${model} occupato, riprovo tra un attimo... (${attempt}/${maxAttempts}) ⏳`);
            await new Promise(r => setTimeout(r, retryDelayMs));
            continue;
          }
          if (isSpike) onStatus(`Server ${model} saturo, passo a un modello più rapido... ⚡`);
          break;
        } catch (err) {
          if (err.usedModel) throw err; // our own fatal error
          if (signal && signal.aborted) throw err; // cancelled by the user
          if (timedOut) {
            onStatus(`Modello ${model} lento a rispondere, provo un modello più veloce... ⚡`);
          } else {
            lastErrorMessage = err.message || 'Errore di connessione';
          }
          break;
        } finally {
          clearTimeout(timer);
          if (signal) signal.removeEventListener('abort', onAbort);
        }
      }
    }

    throw fail(lastErrorMessage || 'I server di Google sono momentaneamente saturi. Riprova tra 1 minuto.');
  }

  return {
    API_BASE, DEFAULT_MODEL, CANDIDATE_MODELS,
    orderModels, escapeHtml, extractJson, normalizeLesson, formatSummary,
    buildGeminiParts, extractTextFromParts, buildGenerationConfig, callGeminiWithFailover
  };
});
