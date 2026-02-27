const Groq = require('groq-sdk');
const config = require('../config');

const groq = new Groq({ apiKey: config.GROQ_API_KEY });

const SYSTEM_PROMPT = `Eres un analista experto en tecnología e inteligencia artificial.
Tu tarea es evaluar noticias/posts y determinar si representan una oportunidad real de negocio o una novedad relevante del mundo de la IA.

Responde SIEMPRE con un JSON válido con esta estructura exacta:
{
  "score": <número del 0 al 10>,
  "profile": "<technical | non-technical | both>",
  "summary": "<resumen en español de 1-2 frases, máximo 200 caracteres>",
  "tags": ["<tag1>", "<tag2>"]
}

Criterios de puntuación:
- 0-3: Irrelevante, spam, clickbait, o no tiene nada que ver con IA/automatización/negocio
- 4-5: Interesante pero sin aplicación práctica clara
- 6-7: Relevante, con potencial de negocio o automatización aplicable
- 8-9: Alta oportunidad de negocio, idea accionable, tecnología muy relevante
- 10: Disruptivo, oportunidad excepcional

Criterios de perfil:
- technical: requiere saber programar o tener conocimientos técnicos profundos
- non-technical: cualquier persona puede aprovecharlo con las herramientas de IA actuales
- both: tiene versión técnica y no técnica

Tags posibles (elige 1-3): automatizacion, negocio, herramienta, modelo, investigacion, tutoral, tendencia, no-code, agentes, imagen, voz, video, datos, productividad`;

async function filterItem(item) {
  const prompt = `Título: ${item.title}\nFuente: ${item.source}\n${item.summary ? `Descripción: ${item.summary}` : ''}`;

  try {
    const response = await groq.chat.completions.create({
      model: config.AI_FILTER.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 300,
    });

    const text = response.choices[0]?.message?.content || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const result = JSON.parse(jsonMatch[0]);
    return {
      score:   Math.min(10, Math.max(0, parseInt(result.score) || 0)),
      profile: ['technical', 'non-technical', 'both'].includes(result.profile) ? result.profile : 'both',
      summary: result.summary || item.summary || '',
      tags:    JSON.stringify(Array.isArray(result.tags) ? result.tags.slice(0, 3) : []),
    };
  } catch (err) {
    console.error(`[Filter] Error evaluando "${item.title}":`, err.message);
    return { score: 0, profile: 'both', summary: item.summary || '', tags: '[]' };
  }
}

async function filterItems(items) {
  console.log(`[Filter] Evaluando ${items.length} items con IA...`);
  const results = [];

  // procesar en lotes de 5 para no saturar la API
  const BATCH = 5;
  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH);
    const evaluated = await Promise.all(batch.map(item => filterItem(item)));

    for (let j = 0; j < batch.length; j++) {
      const item = batch[j];
      const eval_ = evaluated[j];

      if (eval_.score >= config.AI_FILTER.min_score) {
        results.push({ ...item, ...eval_ });
      }
    }

    console.log(`[Filter] Procesados ${Math.min(i + BATCH, items.length)}/${items.length}`);
    // pequeña pausa entre lotes
    if (i + BATCH < items.length) await new Promise(r => setTimeout(r, 300));
  }

  console.log(`[Filter] ${results.length} items pasaron el filtro (score >= ${config.AI_FILTER.min_score})`);
  return results;
}

module.exports = { filterItems };
