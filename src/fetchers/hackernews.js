const fetch = require('node-fetch');
const config = require('../../config');

const AI_KEYWORDS = [
  'ai', 'artificial intelligence', 'machine learning', 'llm', 'gpt', 'claude',
  'gemini', 'mistral', 'openai', 'anthropic', 'deepmind', 'automation',
  'neural', 'chatbot', 'agent', 'langchain', 'rag', 'embedding', 'diffusion',
  'stable diffusion', 'midjourney', 'generative', 'transformer', 'fine-tun',
  'business idea', 'saas', 'startup', 'no-code', 'low-code', 'workflow',
];

function isAIRelated(title) {
  const lower = title.toLowerCase();
  return AI_KEYWORDS.some(kw => lower.includes(kw));
}

async function fetchHackerNews() {
  console.log('[HackerNews] Fetching top stories...');
  const items = [];

  try {
    const res = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
    const ids = await res.json();
    const topIds = ids.slice(0, 200); // revisar los 200 primeros

    const stories = await Promise.all(
      topIds.map(id =>
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
          .then(r => r.json())
          .catch(() => null)
      )
    );

    for (const story of stories) {
      if (!story || story.type !== 'story') continue;
      if (!story.url && !story.text) continue;
      if ((story.score || 0) < config.HACKERNEWS_MIN_SCORE) continue;
      if (!isAIRelated(story.title || '')) continue;

      items.push({
        source: 'Hacker News',
        source_type: 'hackernews',
        title: story.title,
        url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
        summary: null,
        upvotes: story.score || 0,
        published_at: story.time ? new Date(story.time * 1000).toISOString() : null,
        fetched_at: new Date().toISOString(),
      });

      if (items.length >= config.MAX_ITEMS_PER_SOURCE) break;
    }

    console.log(`[HackerNews] Found ${items.length} relevant items`);
  } catch (err) {
    console.error('[HackerNews] Error:', err.message);
  }

  return items;
}

module.exports = { fetchHackerNews };
