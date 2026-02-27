const RSSParser = require('rss-parser');
const config = require('../../config');

const parser = new RSSParser({
  timeout: 10000,
  headers: { 'User-Agent': 'NoticIAs/1.0 (local aggregator)' },
});

async function fetchRSS() {
  console.log('[RSS] Fetching feeds...');
  const items = [];

  for (const feed of config.RSS_FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url);
      const entries = (parsed.items || []).slice(0, config.MAX_ITEMS_PER_SOURCE);

      for (const entry of entries) {
        const url = entry.link || entry.guid;
        if (!url) continue;

        const summary = entry.contentSnippet || entry.content || entry.summary || null;

        items.push({
          source: feed.name,
          source_type: 'rss',
          title: entry.title || 'Sin título',
          url,
          summary: summary ? summary.slice(0, 600) : null,
          upvotes: 0,
          published_at: entry.pubDate || entry.isoDate || null,
          fetched_at: new Date().toISOString(),
        });
      }

      console.log(`[RSS] ${feed.name}: ${entries.length} items`);
    } catch (err) {
      console.error(`[RSS] Error en "${feed.name}":`, err.message);
    }
  }

  console.log(`[RSS] Total: ${items.length} items`);
  return items;
}

module.exports = { fetchRSS };
