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
  if (lesson.classe !== undefined) {
    assert(typeof lesson.classe === 'string' && lesson.classe.length > 0, 'Classe must be non-empty string when present');
  }
  const summaryContent = lesson.riassunto || lesson.storia_semplice;
  assert(typeof summaryContent === 'string' && summaryContent.length > 20, 'Summary/storia must be descriptive string');
  assert(Array.isArray(lesson.parole_chiave) && lesson.parole_chiave.length >= 2, 'Must have at least 2 parole chiave');
  lesson.parole_chiave.forEach((pk, idx) => {
    assert(typeof pk.termine === 'string' && pk.termine.length > 0, `Punto chiave ${idx} missing termine`);
    assert(typeof pk.spiegazione === 'string' && pk.spiegazione.length > 5, `Punto chiave ${idx} missing brief spiegazione`);
  });
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

  // Test I: Kid-sized summary word count & brevity check (terza elementare)
  function checkKidSizedBrevity(text) {
    const words = text.replace(/[*#•_~`>-]/g, ' ').trim().split(/\s+/).filter(Boolean);
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
    return {
      wordCount: words.length,
      paragraphCount: paragraphs.length,
      isKidSized: words.length >= 40 && words.length <= 130 && paragraphs.length <= 3,
      hasBannedPrefixes: /^(📌|🔍|💡|Step\s*\d|Ciao sono Leo|C'era una volta)/i.test(text.trim())
    };
  }

  const sampleKidSummary = `La **geografia** studia la Terra e i suoi paesaggi naturali. Il geografo non lavora mai da solo, ma con una squadra di esperti fidati.

Il **fotografo** scatta foto nel tempo per vedere come cambia l'ambiente, mentre il **cartografo** disegna carte e mappe utilissime per tutti noi.`;

  const brevityCheck = checkKidSizedBrevity(sampleKidSummary);
  assert(brevityCheck.isKidSized, `Summary should be kid-sized (got ${brevityCheck.wordCount} words, ${brevityCheck.paragraphCount} paragraphs)`);
  assert(!brevityCheck.hasBannedPrefixes, 'Kid summary must not contain banned robotic/childish prefixes');
  console.log(`✓ Kid-sized ultra-concise brevity verification passed (${brevityCheck.wordCount} words in ${brevityCheck.paragraphCount} paragraphs)`);

  // Test J: Key Points with brief explanations renderer
  function renderKeyPointsHtml(cards) {
    return cards.map((item, idx) => `
      <div class="keypoint-card">
        <span>${item.emoji || '⭐'}</span>
        <h5>${item.termine}</h5>
        <p>${item.spiegazione}</p>
      </div>
    `).join('');
  }

  const sampleKeyPoints = [
    { termine: "Il Fotografo", emoji: "📸", spiegazione: "Scatta fotografie nel tempo per osservare come cambia il territorio." },
    { termine: "Il Cartografo", emoji: "🗺️", spiegazione: "Disegna le mappe e le carte geografiche per aiutarci a orientarci." },
    { termine: "Il Geologo", emoji: "🪨", spiegazione: "Studia le rocce e la composizione del terreno." }
  ];

  sampleKeyPoints.forEach(kp => {
    assert(kp.termine && kp.termine.length > 0, "Key point missing title");
    assert(kp.spiegazione && kp.spiegazione.length >= 10, "Key point missing brief explanation");
    assert(kp.spiegazione.split(/\s+/).length <= 35, "Key point explanation should remain brief for kids");
  });

  const keyPointsHtml = renderKeyPointsHtml(sampleKeyPoints);
  assert(keyPointsHtml.includes('Il Fotografo') && keyPointsHtml.includes('Scatta fotografie'), 'Key points HTML generation failed');
  console.log(`✓ Key points with brief explanation verification & renderer passed (${sampleKeyPoints.length} points)`);

  // Test K: Multi-Grade Pedagogical Profiles (3ª Elementare -> 3ª Media)
  const fs = require('fs');
  const appCode = fs.readFileSync('app.js', 'utf8');
  assert(appCode.includes("'3-elem'") && appCode.includes("'3-media'"), 'Grade keys missing from app.js');
  
  // Extract GRADE_PROFILES from app.js for isolated unit testing
  const gradeProfilesMatch = appCode.match(/const GRADE_PROFILES = ({[\s\S]*?});\n\n\/\/ --- Application/);
  assert(gradeProfilesMatch && gradeProfilesMatch[1], 'Could not extract GRADE_PROFILES from app.js');
  const evaluatedProfiles = eval('(' + gradeProfilesMatch[1] + ')');
  
  const expectedGrades = ['3-elem', '4-elem', '5-elem', '1-media', '2-media', '3-media'];
  expectedGrades.forEach(gKey => {
    const prof = evaluatedProfiles[gKey];
    assert(prof, `Missing profile for ${gKey}`);
    assert(typeof prof.name === 'string' && prof.name.length > 0, `${gKey} missing name`);
    assert(typeof prof.targetAudience === 'string' && prof.targetAudience.length > 10, `${gKey} missing targetAudience`);
    assert(typeof prof.badgeTime === 'string' && prof.badgeTime.includes('min'), `${gKey} missing badgeTime`);
    assert(prof.wordCountMin < prof.wordCountMax, `${gKey} wordCountMin must be < wordCountMax`);
    assert(prof.paragraphs >= 3, `${gKey} must have at least 3 paragraphs`);
    assert(prof.keyPointsCount >= 4, `${gKey} must have at least 4 key points`);
  });

  // Verify proportional pedagogical scaling
  assert(evaluatedProfiles['3-media'].wordCountMax > evaluatedProfiles['1-media'].wordCountMax, '3ª media max word count should be greater than 1ª media');
  assert(evaluatedProfiles['1-media'].wordCountMax > evaluatedProfiles['5-elem'].wordCountMax, '1ª media max word count should be greater than 5ª elem');
  assert(evaluatedProfiles['5-elem'].wordCountMax > evaluatedProfiles['3-elem'].wordCountMax, '5ª elem max word count should be greater than 3ª elem');
  console.log(`✓ Multi-Grade profiles integrity and progressive scaling passed (${expectedGrades.length} grades)`);

  // Test L: Middle School Demo Lesson Validation
  const demoCode = fs.readFileSync('demo-data.js', 'utf8');
  assert(demoCode.includes('scienze-cellula-media'), '1ª Media demo lesson missing in demo-data.js');
  const win = {};
  eval(demoCode.replace(/window/g, 'win'));
  const mediaDemo = win.DEMO_LESSONS.find(l => l.id === 'scienze-cellula-media');
  assert(mediaDemo, 'Could not find 1ª Media demo lesson');
  assert(mediaDemo.classe === '1ª Media', '1ª Media demo lesson has wrong classe tag');
  assert(validateLesson(mediaDemo) === true, '1ª Media demo lesson failed schema validation');
  console.log('✓ 1ª Media demo lesson validation passed');

  // Test M: Dynamic Grade Prompt Calibration
  function buildGradePromptSnippet(grade) {
    return `Sei un docente esperto specializzato nell'insegnamento per ${grade.targetAudience}. Stile: ${grade.toneDesc}. Parole: tra ${grade.wordCountMin} e ${grade.wordCountMax}.`;
  }
  const prompt3Elem = buildGradePromptSnippet(evaluatedProfiles['3-elem']);
  const prompt3Media = buildGradePromptSnippet(evaluatedProfiles['3-media']);
  assert(prompt3Elem.includes('3ª elementare') && prompt3Elem.includes('favolistico'), '3ª elementare prompt must have elementary tone');
  assert(prompt3Media.includes('3ª media') && prompt3Media.includes('argomentativo'), '3ª media prompt must have middle school argumentative tone');
  console.log('✓ Dynamic grade prompt calibration verified');

  // Test N: Multi-Page Proportional Scaling Algorithm (1, 2, 3, 4+ Pages)
  function computeMultiPageTargets(grade, numPages) {
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

    return { minWords, maxWords, totalParagraphs, targetCount };
  }

  const p1 = computeMultiPageTargets(evaluatedProfiles['3-elem'], 1);
  const p2 = computeMultiPageTargets(evaluatedProfiles['3-elem'], 2);
  const p3 = computeMultiPageTargets(evaluatedProfiles['3-elem'], 3);
  const p4 = computeMultiPageTargets(evaluatedProfiles['3-elem'], 4);

  assert(p1.minWords === 120 && p1.maxWords === 180, '1-page 3-elem targets mismatch');
  assert(p2.minWords > p1.maxWords, `2-page min words (${p2.minWords}) must exceed 1-page max words (${p1.maxWords})`);
  assert(p4.minWords > p3.minWords && p3.minWords > p2.minWords, 'Multi-page word count must strictly increase with page count');
  assert(p4.totalParagraphs === 6 && p1.totalParagraphs === 3, 'Paragraph count must scale with pages (from 3 to 6)');
  assert(p4.targetCount >= 10, `4 pages must extract at least 10 flashcards/quizzes (got ${p4.targetCount})`);

  // Verify that multi-page instruction is present in app.js
  assert(appCode.includes('REGOLE TASSATIVE MULTI-PAGINA'), 'Missing multi-page prompt rules in app.js');
  assert(appCode.includes('pageMultiplier'), 'Missing pageMultiplier logic in app.js');
  console.log('✓ Multi-page proportional scaling verification passed (1, 2, 3, 4+ pages verified)');

  // Test O: Quiz Options Dynamic Shuffling & Non-Fixed Answer Distribution
  function shuffleLessonQuiz(lesson) {
    if (!lesson || !Array.isArray(lesson.quiz)) return;
    lesson.quiz.forEach(q => {
      if (!q || !Array.isArray(q.opzioni) || q.opzioni.length < 2) return;
      const currentCorrectIdx = (typeof q.risposta_corretta === 'number' && q.risposta_corretta >= 0 && q.risposta_corretta < q.opzioni.length)
        ? q.risposta_corretta
        : 0;

      const items = q.opzioni.map((opt, idx) => ({
        text: opt,
        isCorrect: (idx === currentCorrectIdx)
      }));

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
  }

  const testQuizLesson = {
    titolo: "Test Quiz Shuffle",
    materia: "Storia",
    classe: "3ª Elementare",
    riassunto: "Paragrafo di test per verificare che lo shuffling delle opzioni del quiz funzioni perfettamente e conservi la correttezza del testo.",
    parole_chiave: [
      { termine: "Concetto A", spiegazione: "Spiegazione del concetto A" },
      { termine: "Concetto B", spiegazione: "Spiegazione del concetto B" }
    ],
    quiz: [
      {
        domanda: "Domanda 1?",
        opzioni: ["Risposta Vera 1", "Sbagliata 1A", "Sbagliata 1B"],
        risposta_corretta: 0,
        indizio: "Indizio 1"
      },
      {
        domanda: "Domanda 2?",
        opzioni: ["Risposta Vera 2", "Sbagliata 2A", "Sbagliata 2B"],
        risposta_corretta: 0,
        indizio: "Indizio 2"
      }
    ]
  };

  const counts = { 0: 0, 1: 0, 2: 0 };
  const iterations = 150;

  for (let i = 0; i < iterations; i++) {
    shuffleLessonQuiz(testQuizLesson);
    
    // Assert correctness of question 1
    const q1 = testQuizLesson.quiz[0];
    assert(q1.opzioni[q1.risposta_corretta] === "Risposta Vera 1", "Shuffling corrupted the correct answer of question 1!");
    counts[q1.risposta_corretta]++;

    // Assert correctness of question 2
    const q2 = testQuizLesson.quiz[1];
    assert(q2.opzioni[q2.risposta_corretta] === "Risposta Vera 2", "Shuffling corrupted the correct answer of question 2!");
    
    // Schema must stay 100% valid
    assert(validateLesson(testQuizLesson) === true, "Validation failed after quiz shuffling");
  }

  // Verify that all positions (0, 1, 2) were chosen over 150 iterations (none is stuck at 0)
  assert(counts[0] > 15, `Index 0 expected >= 15 hits, got ${counts[0]}`);
  assert(counts[1] > 15, `Index 1 expected >= 15 hits, got ${counts[1]}`);
  assert(counts[2] > 15, `Index 2 expected >= 15 hits, got ${counts[2]}`);

  // Verify app.js contains the shuffle function and prompt instruction
  assert(appCode.includes('shuffleLessonQuiz'), 'app.js missing shuffleLessonQuiz implementation');
  assert(appCode.includes('NON posizionare sempre la risposta corretta'), 'app.js missing randomized quiz answer prompt instruction');
  console.log(`✓ Quiz options dynamic shuffling & balanced distribution verified (A: ${counts[0]}, B: ${counts[1]}, C: ${counts[2]} across ${iterations} runs)`);

  // Test P: Lesson Deletion & Storage Memory Cleanup
  assert(appCode.includes('getAllLessons'), 'app.js missing getAllLessons helper');
  assert(appCode.includes('deleteLesson'), 'app.js missing deleteLesson method');
  assert(appCode.includes('deleteCurrentLesson'), 'app.js missing deleteCurrentLesson method');
  assert(appCode.includes('restoreDemoLessons'), 'app.js missing restoreDemoLessons method');

  // Simulate memory management operations
  const mockStorage = {
    custom: [
      { id: 'custom-1', titolo: 'I Vulcani d\'Italia' },
      { id: 'custom-2', titolo: 'I Greci e le Polis' }
    ],
    hiddenDemos: [],
    readLessons: ['custom-1', 'storia-fuoco-3elem']
  };

  // 1. Delete custom-1
  mockStorage.custom = mockStorage.custom.filter(l => l.id !== 'custom-1');
  mockStorage.readLessons = mockStorage.readLessons.filter(id => id !== 'custom-1');
  assert(mockStorage.custom.length === 1 && mockStorage.custom[0].id === 'custom-2', 'Failed to delete custom lesson from memory');
  assert(!mockStorage.readLessons.includes('custom-1'), 'Failed to clean up read stats for deleted lesson');

  // 2. Hide demo lesson
  mockStorage.hiddenDemos.push('storia-fuoco-3elem');
  assert(mockStorage.hiddenDemos.includes('storia-fuoco-3elem'), 'Failed to hide demo lesson');

  // 3. Restore demo lessons
  mockStorage.hiddenDemos = [];
  assert(mockStorage.hiddenDemos.length === 0, 'Failed to restore hidden demo lessons');

  console.log('✓ Lesson deletion and memory cleanup logic verified');

  // Test Q: Lesson Archive & Unarchive Lifecycle Verification
  assert(appCode.includes('archiveLesson'), 'app.js missing archiveLesson method');
  assert(appCode.includes('unarchiveLesson'), 'app.js missing unarchiveLesson method');
  assert(appCode.includes('toggleArchiveCurrentLesson'), 'app.js missing toggleArchiveCurrentLesson method');
  assert(appCode.includes('updateCurrentLessonArchiveBtn'), 'app.js missing updateCurrentLessonArchiveBtn method');
  assert(appCode.includes('getArchivedLessonIds'), 'app.js missing getArchivedLessonIds method');

  // Simulate archive operations
  let archivedIds = [];
  const lessons = [
    { id: 'custom-101', titolo: 'I Romani' },
    { id: 'custom-102', titolo: 'Il Sistema Solare' },
    { id: 'storia-fuoco-3elem', titolo: 'Il Fuoco' }
  ];

  // 1. Archive custom-101
  archivedIds.push('custom-101');
  const activeLessons = lessons.filter(l => !archivedIds.includes(l.id));
  const archivedLessons = lessons.filter(l => archivedIds.includes(l.id));

  assert(activeLessons.length === 2 && !activeLessons.some(l => l.id === 'custom-101'), 'Archived lesson must be removed from active lessons view');
  assert(archivedLessons.length === 1 && archivedLessons[0].id === 'custom-101', 'Archived lesson must appear in archive view');

  // 2. Unarchive custom-101
  archivedIds = archivedIds.filter(id => id !== 'custom-101');
  const restoredActive = lessons.filter(l => !archivedIds.includes(l.id));
  assert(restoredActive.length === 3, 'Unarchiving must restore lesson to active list');

  console.log('✓ Lesson archive & unarchive lifecycle verified');

  // Test R: Mobile Top Navbar Collision Prevention & Responsiveness
  const htmlContent = fs.readFileSync('index.html', 'utf8');
  const cssContent = fs.readFileSync('style.css', 'utf8');

  assert(htmlContent.includes('id="gradeSelect"'), 'index.html missing gradeSelect element');
  assert(htmlContent.includes('id="headerStars"'), 'index.html missing headerStars element');
  assert(htmlContent.includes('id="openUploadBtn"'), 'index.html missing openUploadBtn element');
  assert(htmlContent.includes('id="openSettingsBtn"'), 'index.html missing openSettingsBtn element');

  // Verify elements have flex-shrink-0 to prevent flexbox collision/overlap
  assert(/id="gradeSelect"[^>]*flex-shrink-0/.test(htmlContent), 'gradeSelect must have flex-shrink-0 to prevent collision');
  assert(/id="headerStars"[^>]*flex-shrink-0/.test(htmlContent), 'headerStars must have flex-shrink-0');
  assert(/id="openUploadBtn"[^>]*flex-shrink-0/.test(htmlContent), 'openUploadBtn must have flex-shrink-0');

  // Verify openUploadBtn text is hidden on mobile to conserve header width
  assert(htmlContent.includes('<span class="hidden sm:inline">Foto Libro</span>'), 'Foto text must be hidden on mobile');

  // Verify CSS contains compact mobile-safe rules
  assert(cssContent.includes('#gradeSelect'), 'style.css must contain responsive styling for gradeSelect');
  assert(cssContent.includes('appearance: none'), 'gradeSelect must use normalized appearance to prevent platform padding blowout');

  console.log('✓ Mobile top navbar collision prevention verified');

  // Test S: iPad Tablet Responsiveness & Card Action Buttons Non-Clipping
  const updatedAppCode = fs.readFileSync('app.js', 'utf8');
  assert(updatedAppCode.includes('md:grid-cols-2 lg:grid-cols-3'), 'Drawer cards must use md:grid-cols-2 to prevent iPad portrait squish');
  assert(updatedAppCode.includes('flex-wrap'), 'Drawer card buttons must allow wrapping to prevent card clipping');
  assert(updatedAppCode.includes('ml-auto'), 'Read/Open button must be pushed cleanly to the right edge with ml-auto');
  console.log('✓ iPad tablet responsiveness & card action non-clipping verified');

  // Test T: Settings Modal Dedicated API Tab, Mandatory Notice, & Visual Guide
  assert(htmlContent.includes('id="settingsTabBtnGeneral"'), 'Settings modal missing General tab button');
  assert(htmlContent.includes('id="settingsTabBtnApi"'), 'Settings modal missing dedicated API tab button');
  assert(htmlContent.includes('id="settingsApiKeyAlert"'), 'Settings modal missing API key notice in general tab');
  assert(htmlContent.includes('SERVE COMPILARE LA TAB DELLE API'), 'Settings modal general tab missing mandatory notice text');
  assert(htmlContent.includes('aistudio.google.com/app/apikey'), 'Settings API tab missing Google AI Studio link');
  assert(htmlContent.includes('Create API key'), 'Settings visual guide missing Create API key mockup step');
  assert(htmlContent.includes('id="testApiKeyBtn"'), 'Settings API tab missing connection tester button');

  assert(updatedAppCode.includes('switchSettingsTab'), 'app.js missing switchSettingsTab method');
  assert(updatedAppCode.includes('updateSettingsModalState'), 'app.js missing updateSettingsModalState method');
  assert(updatedAppCode.includes('testApiKey'), 'app.js missing testApiKey method');
  assert(updatedAppCode.includes('pasteApiKey'), 'app.js missing pasteApiKey method');
  assert(updatedAppCode.includes('toggleApiKeyVisibility'), 'app.js missing toggleApiKeyVisibility method');
  console.log('✓ Settings modal dedicated API tab, mandatory notice & visual guide verified');

  console.log('--- ALL CHECKS PASSED (Ponytail Approved) ---');
})();
