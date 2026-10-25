// test.js - Ponytail self-check for StudioMagico lesson schema and parser
const assert = require('assert');

// 1. Test JSON extraction from AI responses (handles markdown wrappers ```json ... ```)
function extractJsonFromAiResponse(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let text = raw.trim();
  // Strip markdown code fences if present
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch && jsonMatch[1]) {
    text = jsonMatch[1].trim();
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    // Fallback: look for the first { and last }
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(text.substring(start, end + 1));
      } catch (err) {
        return null;
      }
    }
    return null;
  }
}

// 2. Validate lesson schema structure required by StudioMagico
function validateLesson(lesson) {
  assert(lesson && typeof lesson === 'object', 'Lesson must be an object');
  assert(typeof lesson.titolo === 'string' && lesson.titolo.length > 0, 'Titolo must be non-empty string');
  assert(typeof lesson.materia === 'string', 'Materia must be string');
  const summaryContent = lesson.riassunto || lesson.storia_semplice;
  assert(typeof summaryContent === 'string' && summaryContent.length > 20, 'Summary/storia must be descriptive string');
  assert(Array.isArray(lesson.parole_chiave) && lesson.parole_chiave.length >= 2, 'Must have at least 2 parole chiave');
  assert(Array.isArray(lesson.quiz) && lesson.quiz.length >= 2, 'Must have at least 2 quiz questions');
  
  lesson.quiz.forEach((q, idx) => {
    assert(typeof q.domanda === 'string', `Quiz ${idx} missing question`);
    assert(Array.isArray(q.opzioni) && q.opzioni.length >= 2, `Quiz ${idx} must have at least 2 options`);
    assert(typeof q.risposta_corretta === 'number', `Quiz ${idx} missing numeric correct answer index`);
    assert(q.risposta_corretta >= 0 && q.risposta_corretta < q.opzioni.length, `Quiz ${idx} correct answer index out of bounds`);
    assert(typeof q.indizio === 'string', `Quiz ${idx} missing helpful hint`);
  });

  return true;
}

// Run Tests
console.log('--- Testing StudioMagico Logic ---');

// Test A: Direct JSON
const sampleDirect = '{"titolo": "Il Ciclo dell\'Acqua", "materia": "Scienze", "storia_semplice": "C\'era una volta una gocciolina d\'acqua...", "parole_chiave": [{"termine": "Evaporazione", "spiegazione": "L\'acqua scaldata dal sole diventa vapore"}], "quiz": [{"domanda": "Cosa fa scaldare l\'acqua?", "opzioni": ["La Luna", "Il Sole", "Il Frigorifero"], "risposta_corretta": 1, "indizio": "Brilla nel cielo di giorno!"}]}';
const parsedDirect = extractJsonFromAiResponse(sampleDirect);
assert(parsedDirect !== null, 'Failed to parse direct JSON');
console.log('✓ Direct JSON parser passed');

// Test B: Markdown-fenced JSON
const sampleFenced = '```json\n' + sampleDirect + '\n```';
const parsedFenced = extractJsonFromAiResponse(sampleFenced);
assert(parsedFenced !== null && parsedFenced.titolo === "Il Ciclo dell'Acqua", 'Failed to parse fenced JSON');
console.log('✓ Markdown fenced JSON parser passed');

// Test C: Loose text with JSON embedded
const sampleLoose = 'Ecco la lezione elaborata per il bambino:\n' + sampleDirect + '\nSpero vi piaccia!';
const parsedLoose = extractJsonFromAiResponse(sampleLoose);
assert(parsedLoose !== null && parsedLoose.materia === "Scienze", 'Failed to parse loose embedded JSON');
console.log('✓ Loose embedded JSON parser passed');

// Test D: Schema validation
parsedDirect.parole_chiave.push({"termine": "Condensazione", "spiegazione": "Il vapore forma le nuvole"});
parsedDirect.quiz.push({"domanda": "Dove finisce la pioggia?", "opzioni": ["Nei fiumi e nel mare", "Nello spazio"], "risposta_corretta": 0, "indizio": "Pensa a dove nuotano i pesci!"});
assert(validateLesson(parsedDirect) === true, 'Lesson validation failed');
console.log('✓ Schema validation passed');

// Test E: Multi-image Gemini parts builder with explicit page demarcation
function buildGeminiParts(images, prompt, manualText) {
  const parts = [];
  const totalPages = images.length;
  if (totalPages > 1) {
    parts.push({
      text: `AVVISO: In questo messaggio sono allegate ${totalPages} pagine consecutive numerate in sequenza (Pagina 1, Pagina 2...). Leggi, analizza e integra TUTTE le ${totalPages} pagine nel riassunto!`
    });
  }
  images.forEach((img, idx) => {
    if (totalPages > 1) {
      parts.push({
        text: `--- [INIZIO FOTO PAGINA ${idx + 1} DI ${totalPages}] ---`
      });
    }
    parts.push({
      inline_data: {
        mime_type: img.mimeType,
        data: img.base64
      }
    });
    if (totalPages > 1) {
      parts.push({
        text: `--- [FINE FOTO PAGINA ${idx + 1} DI ${totalPages}] ---`
      });
    }
  });
  parts.push({
    text: prompt + (manualText ? `\n\nNote:\n${manualText}` : '')
  });
  return parts;
}

const mockPages = [
  { mimeType: 'image/jpeg', base64: 'page1data' },
  { mimeType: 'image/jpeg', base64: 'page2data' }
];
const partsResult = buildGeminiParts(mockPages, 'Prompt', '');
assert(partsResult.length === 8, `Expected 8 parts for 2-page payload, got ${partsResult.length}`);
assert(partsResult[0].text.includes('AVVISO'), 'Missing multi-page notice');
assert(partsResult[1].text.includes('INIZIO FOTO PAGINA 1 DI 2'), 'Missing page 1 start delimiter');
assert(partsResult[2].inline_data.data === 'page1data', 'Page 1 image missing');
assert(partsResult[3].text.includes('FINE FOTO PAGINA 1 DI 2'), 'Missing page 1 end delimiter');
assert(partsResult[4].text.includes('INIZIO FOTO PAGINA 2 DI 2'), 'Missing page 2 start delimiter');
assert(partsResult[5].inline_data.data === 'page2data', 'Page 2 image missing');
assert(partsResult[6].text.includes('FINE FOTO PAGINA 2 DI 2'), 'Missing page 2 end delimiter');
console.log('✓ Multi-page Gemini demarcated payload verification passed');

// Test F: Gemini 3.8 Thinking Block Separator
function extractTextFromParts(parts) {
  const textPart = parts.slice().reverse().find(p => p.text && !p.thought) || parts[0];
  return textPart ? textPart.text : null;
}

const mockCandidatesWithThinking = [
  { thought: true, text: "Ragiono sulla storia e creo il quiz..." },
  { text: '{"titolo": "Il Vulcano", "materia": "Geografia", "storia_semplice": "Un vulcano è una montagna speciale...", "parole_chiave": [{"termine": "Magma", "spiegazione": "Roccia fusa caldissima"}], "quiz": [{"domanda": "Cosa esce?", "opzioni": ["Lava", "Acqua"], "risposta_corretta": 0, "indizio": "È rossa e calda"}]}' }
];
const extractedText = extractTextFromParts(mockCandidatesWithThinking);
assert(extractedText.includes('Il Vulcano'), 'Failed to separate thinking part');
console.log('✓ Gemini 3.8 thinking block separator passed');

// Test G: Failover, Timeout & Deprecation Resilience Engine
async function simulateFailoverEngine(fetchMock, candidateModels) {
  let data = null;
  let lastErrorMessage = '';
  
  modelLoop:
  for (const model of candidateModels) {
    const maxAttempts = model === 'gemini-3.8-flash' ? 2 : 1;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const res = await fetchMock(model, attempt);
      if (res.ok) {
        data = res.data;
        break modelLoop;
      }
      if (res.timedOut) {
        // Attempt timeout: skip to next candidate model immediately
        break;
      }
      lastErrorMessage = res.errorMessage;
      const errMsgLower = (lastErrorMessage || '').toLowerCase();
      const isSpike = res.status === 503 || res.status === 429 || errMsgLower.includes('high demand');
      const isDeprecated = res.status === 404 || errMsgLower.includes('no longer available');

      if (isDeprecated) {
        break; // skip to next candidate
      }
      if (isSpike) {
        if (attempt < maxAttempts) {
          continue; // retry same model
        } else {
          break; // move to next candidate
        }
      }
    }
  }
  return { data, lastErrorMessage };
}

(async () => {
  // Case 1: gemini-3.8-flash has a spike on attempt 1, succeeds on attempt 2
  const candidateModels = ['gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-3.1-flash-lite'];
  assert(!candidateModels.includes('gemini-2.0-flash'), 'gemini-2.0-flash must not be in candidate list');
  assert(!candidateModels.includes('gemini-1.5-flash'), 'gemini-1.5-flash must not be in candidate list');

  const mock1 = async (model, attempt) => {
    if (model === 'gemini-3.8-flash' && attempt === 1) {
      return { ok: false, status: 503, errorMessage: 'This model is currently experiencing high demand.' };
    }
    return { ok: true, data: { lesson: 'ok' } };
  };
  const res1 = await simulateFailoverEngine(mock1, candidateModels);
  assert(res1.data && res1.data.lesson === 'ok', 'Failed to recover from spike via retry');

  // Case 2: A candidate model returns "no longer available", engine must skip to next candidate without crashing
  const candidateWithDeprecated = ['old-deprecated-model', 'gemini-3.8-flash'];
  const mock2 = async (model) => {
    if (model === 'old-deprecated-model') {
      return { ok: false, status: 404, errorMessage: 'models/old-deprecated-model is no longer available to new users.' };
    }
    return { ok: true, data: { lesson: 'recovered' } };
  };
  const res2 = await simulateFailoverEngine(mock2, candidateWithDeprecated);
  assert(res2.data && res2.data.lesson === 'recovered', 'Failed to skip deprecated model to next candidate');

  // Case 3: Model 1 times out (taking too long), engine immediately falls back to Model 2
  const mock3 = async (model) => {
    if (model === 'gemini-3.8-flash') {
      return { ok: false, timedOut: true };
    }
    return { ok: true, data: { lesson: 'recovered_from_timeout', model } };
  };
  const res3 = await simulateFailoverEngine(mock3, candidateModels);
  assert(res3.data && res3.data.lesson === 'recovered_from_timeout' && res3.data.model === 'gemini-3.5-flash-lite', 'Failed to recover from slow model timeout');

  console.log('✓ Model retry, timeout & failover resilience verification passed');

  // Test H: Structured Summary Formatter Verification
  function formatSummaryTest(text) {
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
          if (/^[-*•]\s+/.test(l)) listLines.push(l);
          else headerLines.push(l);
        });
        let headerHtml = headerLines.length ? `<h4>${headerLines.join(' ')}</h4>` : '';
        const listItems = listLines.map(l => {
          let item = l.replace(/^[-*•]\s+/, '').trim();
          item = item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          return `<li>${item}</li>`;
        }).join('');
        return `${headerHtml}<ul>${listItems}</ul>`;
      }
      if (/^(###|##|📌|🔍|💡)/.test(lines[0])) {
        const hHtml = `<h4>${lines[0]}</h4>`;
        if (lines.length > 1) {
          return `${hHtml}<p>${lines.slice(1).join(' ').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>`;
        }
        return hHtml;
      }
      return `<p>${trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>`;
    }).join('');
  }

  const sampleStructuredSummary = `📌 INTRODUZIONE:
La geografia è la scienza che descrive la Terra.

🔍 I PUNTI PRINCIPALI:
- **Il fotografo**: scatta foto per documentare i cambiamenti.
- **Il cartografo**: disegna le mappe e le carte.

💡 IN SINTESI:
Tutti gli scienziati collaborano insieme.`;

  const formattedHtml = formatSummaryTest(sampleStructuredSummary);
  assert(formattedHtml.includes('<h4>📌 INTRODUZIONE:</h4>'), 'Header missing in formatted summary');
  assert(formattedHtml.includes('<ul>'), 'List wrapper missing in formatted summary');
  assert(formattedHtml.includes('<strong>Il fotografo</strong>'), 'Bold tag missing in formatted list');
  console.log('✓ Structured Summary markdown & bullet points formatter passed');

  const sampleContinuousNarrative = `La geografia è la scienza che descrive e studia la Terra. Il **geografo** non lavora da solo, ma collabora con molti esperti.

Per osservare come cambia il paesaggio nel tempo, interviene **il fotografo**, che scatta immagini da confrontare. Per le piante, invece, c'è **il botanico**.

Infine, **il cartografo** disegna le mappe e **il geologo** studia le rocce per proteggerci.`;

  const formattedNarrative = formatSummaryTest(sampleContinuousNarrative);
  assert(formattedNarrative.includes('<p>La geografia'), 'First paragraph missing');
  assert(formattedNarrative.includes('<strong>geografo</strong>'), 'Bold tag missing in narrative');
  assert(formattedNarrative.includes('<p>Per osservare'), 'Second paragraph missing');
  assert(formattedNarrative.includes('<p>Infine,'), 'Third paragraph missing');
  console.log('✓ Continuous flowing narrative formatter passed');

  console.log('--- ALL CHECKS PASSED (Ponytail Approved) ---');
})();
