// test.js - Self-check for StudioMagico: exercises the real code in lib.js, server.js and the shipped HTML
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const L = require('./lib.js');
const { resolvePublicPath } = require('./server.js');

const validLesson = () => ({
  titolo: "Il Ciclo dell'Acqua",
  materia: 'Scienze',
  riassunto: "L'acqua del mare si scalda con il **sole** e sale in cielo.",
  parole_chiave: [
    { termine: 'Evaporazione', emoji: '☀️', spiegazione: "L'acqua scaldata diventa vapore" },
    { termine: 'Condensazione', spiegazione: 'Il vapore forma le nuvole' }
  ],
  quiz: [
    { domanda: 'Cosa scalda l\'acqua?', opzioni: ['La Luna', 'Il Sole', 'Il Frigorifero'], risposta_corretta: 1, indizio: 'Brilla di giorno!' },
    { domanda: 'Dove finisce la pioggia?', opzioni: ['Nei fiumi e nel mare', 'Nello spazio'], risposta_corretta: 0, indizio: 'Pensa ai pesci!' }
  ]
});

async function main() {
  console.log('--- Testing StudioMagico ---');

  // 1. JSON extraction
  const json = JSON.stringify(validLesson());
  assert.strictEqual(L.extractJson(json).titolo, "Il Ciclo dell'Acqua");
  assert.strictEqual(L.extractJson('```json\n' + json + '\n```').materia, 'Scienze');
  assert.strictEqual(L.extractJson('Ecco la lezione:\n' + json + '\nBuono studio!').materia, 'Scienze');
  assert.strictEqual(L.extractJson('non è json {rotto'), null);
  assert.strictEqual(L.extractJson(null), null);
  console.log('✓ extractJson: raw, fenced, embedded, invalid');

  // 2. Lesson validation
  const ok = L.normalizeLesson(validLesson());
  assert.strictEqual(ok.quiz.length, 2);
  assert.strictEqual(ok.riassunto, ok.storia_semplice);
  // legacy field name
  const legacy = validLesson(); legacy.storia_semplice = legacy.riassunto; delete legacy.riassunto;
  assert.ok(L.normalizeLesson(legacy).riassunto.includes('sole'));
  // string index from the AI is coerced
  const strIdx = validLesson(); strIdx.quiz[0].risposta_corretta = '1';
  assert.strictEqual(L.normalizeLesson(strIdx).quiz[0].risposta_corretta, 1);
  // out-of-range correct answer: the question is dropped instead of marking right answers wrong
  const badIdx = validLesson(); badIdx.quiz[0].risposta_corretta = 7;
  assert.strictEqual(L.normalizeLesson(badIdx).quiz.length, 1);
  // a blank option would shift indexes: drop the whole question
  const blankOpt = validLesson(); blankOpt.quiz[0].opzioni[0] = '';
  assert.strictEqual(L.normalizeLesson(blankOpt).quiz.length, 1);
  // unusable lessons throw
  const noQuiz = validLesson(); noQuiz.quiz = [];
  assert.throws(() => L.normalizeLesson(noQuiz), /domande/);
  const noCards = validLesson(); noCards.parole_chiave = [{ termine: 'x' }];
  assert.throws(() => L.normalizeLesson(noCards), /flashcard/);
  assert.throws(() => L.normalizeLesson({ ...validLesson(), titolo: '' }), /titolo/);
  assert.throws(() => L.normalizeLesson(null));
  console.log('✓ normalizeLesson: schema, coercion, dropped bad questions, errors');

  // 3. HTML escaping (AI output is untrusted)
  assert.strictEqual(L.escapeHtml(`<img src=x onerror="a('b')">&`), '&lt;img src=x onerror=&quot;a(&#39;b&#39;)&quot;&gt;&amp;');
  assert.strictEqual(L.escapeHtml(undefined), '');
  const html = L.formatSummary('Testo <script>alert(1)</script> con **parola**\n\nSecondo paragrafo');
  assert.ok(!html.includes('<script>'), 'formatSummary must escape raw HTML');
  assert.ok(html.includes('&lt;script&gt;') && html.includes('>parola</strong>'));
  assert.strictEqual((html.match(/<p /g) || []).length, 2);
  const list = L.formatSummary('Titolo\n- **uno**: a\n- due');
  assert.ok(list.includes('<ul') && list.includes('>uno</strong>'));
  console.log('✓ escapeHtml / formatSummary neutralise injected HTML and keep formatting');

  // 4. Gemini payload
  const pages = [{ mimeType: 'image/jpeg', base64: 'p1' }, { mimeType: 'image/png', base64: 'p2' }];
  const parts = L.buildGeminiParts(pages, 'PROMPT', 'appunti');
  assert.strictEqual(parts.length, 8);
  assert.ok(parts[0].text.includes('AVVISO'));
  assert.ok(parts[1].text.includes('INIZIO FOTO PAGINA 1 DI 2'));
  assert.strictEqual(parts[2].inline_data.data, 'p1');
  assert.strictEqual(parts[5].inline_data.mime_type, 'image/png');
  assert.ok(parts[7].text.startsWith('PROMPT') && parts[7].text.includes('appunti'));
  assert.strictEqual(L.buildGeminiParts([pages[0]], 'P', '').length, 2, 'single page has no demarcation');
  const thought = [{ thought: true, text: 'ragiono...' }, { text: 'RISPOSTA' }];
  assert.strictEqual(L.extractTextFromParts(thought), 'RISPOSTA');
  assert.strictEqual(L.extractTextFromParts(undefined), null);
  assert.ok(L.buildGenerationConfig('gemini-3.8-flash').thinkingConfig);
  assert.ok(!L.buildGenerationConfig('gemini-3.5-flash-lite').thinkingConfig);
  console.log('✓ Gemini payload: multi-page markers, thinking-part filter, config');

  // 5. Model ordering
  assert.deepStrictEqual(L.orderModels('gemini-3.6-flash')[0], 'gemini-3.6-flash');
  assert.strictEqual(new Set(L.orderModels('gemini-3.6-flash')).size, L.CANDIDATE_MODELS.length);
  assert.deepStrictEqual(L.orderModels('modello-sconosciuto'), L.CANDIDATE_MODELS);
  assert.deepStrictEqual(L.orderModels(null), L.CANDIDATE_MODELS);
  console.log('✓ orderModels: selected model first, unknown ignored');

  // 6. Failover engine (the real one, with a fake fetch)
  const okRes = (data) => ({ ok: true, status: 200, json: async () => data });
  const errRes = (status, message, extra = {}) => ({ ok: false, status, json: async () => ({ error: { message, ...extra } }) });
  const run = (fetchImpl, models = L.CANDIDATE_MODELS, extra = {}) => L.callGeminiWithFailover({
    fetchImpl, apiKey: 'KEY', models, parts: [{ text: 'x' }], retryDelayMs: 0, attemptTimeoutMs: 50, ...extra
  });

  // request shape: key goes in a header, never in the URL
  let seen;
  await run(async (url, init) => { seen = { url, init }; return okRes({ a: 1 }); });
  assert.ok(!seen.url.includes('KEY') && !seen.url.includes('key='), 'API key must not be in the URL');
  assert.strictEqual(seen.init.headers['x-goog-api-key'], 'KEY');
  assert.ok(seen.url.includes('/gemini-3.8-flash:generateContent'));

  // 503 on first attempt, retried on the same model
  const calls = [];
  const r1 = await run(async (url) => {
    calls.push(url);
    return calls.length === 1 ? errRes(503, 'high demand') : okRes({ ok: 1 });
  });
  assert.strictEqual(r1.usedModel, 'gemini-3.8-flash');
  assert.strictEqual(calls.length, 2);

  // a retired model (404) is skipped
  const r2 = await run(async (url) => url.includes('old-model') ? errRes(404, 'models/old-model is no longer available') : okRes({ ok: 2 }), ['old-model', 'gemini-3.8-flash']);
  assert.strictEqual(r2.usedModel, 'gemini-3.8-flash');

  // a hanging model times out and the next one answers
  const r3 = await run((url, init) => url.includes('3.8-flash')
    ? new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(new Error('aborted'))))
    : Promise.resolve(okRes({ ok: 3 })));
  assert.strictEqual(r3.usedModel, 'gemini-3.5-flash-lite');

  // a network error moves on to the next model
  const r4 = await run(async (url) => { if (url.includes('3.8-flash')) throw new Error('rete assente'); return okRes({ ok: 4 }); });
  assert.strictEqual(r4.usedModel, 'gemini-3.5-flash-lite');

  // invalid key stops immediately (no point trying other models)
  let keyCalls = 0;
  await assert.rejects(
    run(async () => { keyCalls++; return errRes(400, 'API key not valid. Please pass a valid API key.', { status: 'INVALID_ARGUMENT' }); }),
    /Chiave API Google non valida/
  );
  assert.strictEqual(keyCalls, 1);

  // everything down: the last error is reported together with the model name
  await assert.rejects(run(async () => errRes(500, 'boom')), (e) => e.message === 'boom' && e.usedModel === 'gemini-3.1-flash-lite');

  // user cancel is propagated as-is, not swallowed into a fallback
  const ctl = new AbortController();
  await assert.rejects(run((url, init) => new Promise((_, reject) => {
    init.signal.addEventListener('abort', () => reject(Object.assign(new Error('stop'), { name: 'AbortError' })));
    ctl.abort();
  }), L.CANDIDATE_MODELS, { signal: ctl.signal, attemptTimeoutMs: 5000 }), (e) => e.name === 'AbortError');
  console.log('✓ callGeminiWithFailover: header key, retry, 404 skip, timeout, network error, bad key, total failure, cancel');

  // 7. Static server paths
  assert.ok(resolvePublicPath('/').endsWith('index.html'));
  assert.ok(resolvePublicPath('/app.js?v=12').endsWith('app.js'));
  assert.ok(resolvePublicPath('/vendor/fonts/nunito-400.woff2'));
  for (const bad of ['/../package.json', '/server.js', '/test.js', '/package.json', '/.git/config', '/%2e%2e/etc/passwd', '/%', '/README.md']) {
    assert.strictEqual(resolvePublicPath(bad), null, `${bad} must not be served`);
  }
  console.log('✓ server: only app files are served, traversal / dotfiles / malformed URLs rejected');

  // 8. Shipped files are consistent
  const root = __dirname;
  const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const appJs = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  assert.ok(indexHtml.indexOf('lib.js') < indexHtml.indexOf('app.js'), 'lib.js must load before app.js');
  const localRefs = [...indexHtml.matchAll(/(?:src|href)="([^"#]+?)(?:\?[^"]*)?"/g)].map(m => m[1]).filter(r => !/^(https?:|mailto:)/.test(r));
  localRefs.forEach(ref => assert.ok(fs.existsSync(path.join(root, ref)), `index.html references missing file: ${ref}`));
  assert.ok(!/https?:\/\/(cdn|fonts)\./.test(indexHtml), 'index.html must not depend on CDNs');
  const selectValues = [...indexHtml.matchAll(/<option value="(gemini-[^"]+)"/g)].map(m => m[1]);
  assert.deepStrictEqual(selectValues.sort(), L.CANDIDATE_MODELS.slice().sort(), 'model <select> must match CANDIDATE_MODELS');
  assert.ok(!/App\.voice\.speak\('\$\{/.test(appJs), 'no AI text may be interpolated into inline JS');
  assert.ok(!/key=\$\{/.test(appJs), 'no API key in URLs');
  console.log('✓ index.html: local assets exist, script order, model list in sync, no inline-JS interpolation');

  // 9. Demo lessons are valid
  global.window = {};
  require('./demo-data.js');
  assert.strictEqual(window.DEMO_LESSONS.length, 3);
  window.DEMO_LESSONS.forEach(l => assert.doesNotThrow(() => L.normalizeLesson(l), `demo ${l.id} invalid`));
  console.log('✓ the 3 demo lessons pass the same validation as AI lessons');

  console.log('--- ALL CHECKS PASSED ---');
}

main().catch(err => {
  console.error('✗ TEST FAILED:', err);
  process.exit(1);
});
