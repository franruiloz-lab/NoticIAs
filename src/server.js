const express = require('express');
const path = require('path');
const Groq = require('groq-sdk');
const config = require('../config');
const { getItems, getStats } = require('./db');

const groq = new Groq({ apiKey: config.GROQ_API_KEY });

const app = express();
const PORT = 3333;

app.use(express.json());

// API: listado de items con filtros
app.get('/api/items', (req, res) => {
  const { profile, category, minScore, maxDays, limit = 50, offset = 0, search } = req.query;
  try {
    const items = getItems({
      profile,
      category,
      minScore: minScore ? parseInt(minScore) : undefined,
      maxDays:  maxDays  ? parseInt(maxDays)  : undefined,
      limit: parseInt(limit),
      offset: parseInt(offset),
      search,
    });

    // parsear tags de JSON string a array
    const parsed = items.map(item => ({
      ...item,
      tags: (() => { try { return JSON.parse(item.tags); } catch { return []; } })(),
    }));

    res.json({ items: parsed, count: parsed.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: chat sobre una noticia
app.post('/api/chat', async (req, res) => {
  const { item, messages } = req.body;
  if (!item || !messages) return res.status(400).json({ error: 'Faltan parámetros' });

  const systemPrompt = `Eres un asistente experto en tecnología, inteligencia artificial y negocios digitales.
El usuario está leyendo esta noticia y quiere saber más:

TÍTULO: ${item.title}
FUENTE: ${item.source}
PUNTUACIÓN DE RELEVANCIA: ${item.score}/10
PERFIL: ${item.profile}
TAGS: ${(item.tags || []).join(', ')}
RESUMEN: ${item.summary || 'Sin resumen disponible'}
URL: ${item.url}

Responde en español. Sé concreto, práctico y útil. Si el usuario pregunta por oportunidades de negocio, da ideas accionables. Si pregunta por aspectos técnicos, explícalos con claridad. Puedes hacer referencia a la noticia y al contexto del mundo de la IA.`;

  try {
    const completion = await groq.chat.completions.create({
      model: config.AI_FILTER.model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const reply = completion.choices[0]?.message?.content || 'Sin respuesta';
    res.json({ reply });
  } catch (err) {
    console.error('[Chat] Error:', err.message);
    res.status(500).json({ error: 'Error al contactar con la IA' });
  }
});

// API: estadísticas
app.get('/api/stats', (req, res) => {
  try {
    res.json(getStats());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Archivos estáticos DESPUÉS de las rutas API
app.use(express.static(path.join(__dirname, '..', 'public')));

app.listen(PORT, () => {
  console.log(`\n NoticIAs corriendo en http://localhost:${PORT}\n`);
});
