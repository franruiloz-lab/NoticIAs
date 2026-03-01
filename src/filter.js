const Groq = require('groq-sdk');
const config = require('../config');

const groq = new Groq({ apiKey: config.GROQ_API_KEY });

const SYSTEM_PROMPT = `Eres un analista experto en tecnología, inteligencia artificial y negocios digitales.
Tu tarea es evaluar noticias/posts y determinar si representan una novedad relevante de IA o una oportunidad real de negocio.

Responde SIEMPRE con un JSON válido con esta estructura exacta:
{
  "score": <número del 0 al 10>,
  "profile": "<technical | non-technical | both>",
  "category": "<business | news>",
  "summary": "<resumen en español de 1-2 frases, máximo 200 caracteres>",
  "tags": ["<tag1>", "<tag2>"]
}

Criterios de puntuación:
- 0-3: Irrelevante, spam, clickbait, o no tiene nada que ver con IA/automatización/negocio
- 4-5: Interesante pero sin aplicación práctica clara
- 6-7: Relevante, con potencial o automatización aplicable
- 8-9: Alta oportunidad de negocio, idea accionable, tecnología muy relevante
- 10: Disruptivo, oportunidad excepcional

Criterios de categoría:
- business: hay una forma concreta de ganar dinero aquí (alguien comparte ingresos, idea de negocio, herramienta que se puede monetizar, caso de éxito, modelo de negocio con IA)
- news: novedad tecnológica, lanzamiento de modelo, investigación, tendencia general

Criterios de perfil:
- technical: requiere saber programar o conocimientos técnicos profundos
- non-technical: cualquier persona puede aprovecharlo con herramientas de IA actuales
- both: tiene versión técnica y no técnica

Tags posibles (elige 1-3): automatizacion, negocio, herramienta, modelo, investigacion, tutorial, tendencia, no-code, agentes, imagen, voz, video, datos, productividad, ingresos, saas, freelance`;

async function filterItem(item, retries = 4) {
  const prompt = `Título: ${item.title}\nFuente: ${item.source}\n${item.summary ? `Descripción: ${item.summary}` : ''}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
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
        score:    Math.min(10, Math.max(0, parseInt(result.score) || 0)),
        profile:  ['technical', 'non-technical', 'both'].includes(result.profile) ? result.profile : 'both',
        category: ['business', 'news'].includes(result.category) ? result.category : 'news',
        summary:  result.summary || item.summary || '',
        tags:     JSON.stringify(Array.isArray(result.tags) ? result.tags.slice(0, 3) : []),
      };
    } catch (err) {
      const msg = err.message || '';
      // Extraer el tiempo de espera del mensaje de rate limit
      const waitMatch = msg.match(/try again in ([\d.]+)s/);
      const isRateLimit = err.status === 429 || msg.includes('rate_limit');

      if (isRateLimit && attempt < retries) {
        const waitMs = waitMatch ? Math.ceil(parseFloat(waitMatch[1]) * 1000) + 200 : 8000;
        process.stdout.write(`[Filter] Rate limit, esperando ${(waitMs/1000).toFixed(1)}s...\r`);
        await new Promise(r => setTimeout(r, waitMs));
        continue;
      }

      console.error(`[Filter] Error evaluando "${item.title}":`, msg.slice(0, 80));
      return { score: 0, profile: 'both', category: 'news', summary: item.summary || '', tags: '[]' };
    }
  }

  return { score: 0, profile: 'both', category: 'news', summary: item.summary || '', tags: '[]' };
}

async function filterItems(items) {
  console.log(`[Filter] Evaluando ${items.length} items con IA (uno a uno para respetar rate limit)...`);
  const results = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const eval_ = await filterItem(item);

    if (eval_.score >= config.AI_FILTER.min_score) {
      results.push({ ...item, ...eval_ });
    }

    if ((i + 1) % 10 === 0) {
      console.log(`[Filter] Procesados ${i + 1}/${items.length} — guardados hasta ahora: ${results.length}`);
    }

    // pausa entre items para no saturar el límite de tokens/minuto
    if (i + 1 < items.length) await new Promise(r => setTimeout(r, 700));
  }

  console.log(`\n[Filter] ${results.length} items pasaron el filtro (score >= ${config.AI_FILTER.min_score})`);
  return results;
}

module.exports = { filterItems };
