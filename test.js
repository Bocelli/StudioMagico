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
  assert(typeof lesson.storia_semplice === 'string' && lesson.storia_semplice.length > 20, 'Storia semplice must be descriptive');
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

console.log('--- ALL CHECKS PASSED (Ponytail Approved) ---');
