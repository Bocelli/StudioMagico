// api/tts.js - Vercel Serverless Function for High-Definition Natural Italian TTS
export default async function handler(req, res) {
  // Enable CORS so the client can call this endpoint safely
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const text = (req.query.text || '').trim();
  const lang = (req.query.lang || 'it').trim();

  if (!text) {
    return res.status(400).json({ error: 'Missing text parameter' });
  }

  // Cap chunk length to prevent upstream limits
  const safeText = text.slice(0, 200);

  try {
    const upstreamUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(lang)}&client=tw-ob&q=${encodeURIComponent(safeText)}`;
    
    const upstreamRes = await fetch(upstreamUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).json({ error: 'TTS upstream error' });
    }

    const arrayBuffer = await upstreamRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400'); // 24-hour cache
    return res.status(200).send(buffer);
  } catch (err) {
    console.error('TTS handler error:', err);
    return res.status(500).json({ error: err.message || 'Internal TTS Error' });
  }
}
