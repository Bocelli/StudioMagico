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

console.log('--- ALL CHECKS PASSED (Ponytail Approved) ---');
