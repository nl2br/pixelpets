import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://ollama:11434';
const MODEL = process.env.LLM_MODEL || 'qwen2.5:1.5b-instruct-q4_K_M';

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'ai-service', model: MODEL }));
app.get('/ai/health', (_req, res) => res.json({ status: 'ok', service: 'ai-service', model: MODEL })); // alias

// 1) Suggestion de noms : GET /ai/suggest-name?species=axolotl
app.get('/ai/suggest-name', async (req, res) => {
  try {
    const species = (req.query.species || 'pet').toString();
    const prompt = `Propose 5 noms courts, mignons et différents pour un ${species}. Réponds UNIQUEMENT un JSON: ["Nom1","Nom2","Nom3","Nom4","Nom5"].`;

    const resp = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, prompt, stream: false, options: { num_predict: 120 } })
    });
    const data = await resp.json();

    let names = [];
    try { names = JSON.parse(data.response); } catch { names = [data.response]; }
    res.json({ species, names });
  } catch (e) {
    res.status(500).json({ error: 'ai_error', detail: String(e) });
  }
});

// 2) Parler comme le pet : POST /ai/talk { species, mood, message, name? }
app.post('/ai/talk', async (req, res) => {
  try {
    const { species = 'pet', mood = 'happy', message = 'Bonjour', name = 'Mochi' } = req.body || {};
    const system = `Tu es ${name}, un ${species} ${mood}. Réponds en 1-2 phrases max, style cohérent avec "${mood}". Réponse concise.`;
    const prompt = `${system}\n\nUtilisateur: ${message}\n\nRéponse:`;

    const resp = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, prompt, stream: false, options: { num_predict: 80 } })
    });
    const data = await resp.json();
    const answer = (data?.response || '').trim();
    res.json({ name, species, mood, reply: answer });
  } catch (e) {
    res.status(500).json({ error: 'ai_error', detail: String(e) });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`ai-service listening on ${port}, model=${MODEL}, ollama=${OLLAMA_URL}`));
