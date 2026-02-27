const fetch = require('node-fetch');
const config = require('../../config');

async function fetchSubreddit(subreddit) {
  const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=${config.MAX_ITEMS_PER_SOURCE}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'NoticIAs/1.0 (local aggregator)' },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data?.data?.children || [];
}

async function fetchReddit() {
  console.log('[Reddit] Fetching subreddits...');
  const items = [];

  for (const subreddit of config.REDDIT_SUBREDDITS) {
    try {
      const posts = await fetchSubreddit(subreddit);

      for (const { data: post } of posts) {
        if (post.score < config.REDDIT_MIN_SCORE) continue;
        if (post.is_self && !post.selftext) continue; // posts vacíos

        const url = post.url?.startsWith('http')
          ? post.url
          : `https://reddit.com${post.permalink}`;

        items.push({
          source: `Reddit r/${subreddit}`,
          source_type: 'reddit',
          title: post.title,
          url,
          summary: post.selftext ? post.selftext.slice(0, 500) : null,
          upvotes: post.score,
          published_at: post.created_utc
            ? new Date(post.created_utc * 1000).toISOString()
            : null,
          fetched_at: new Date().toISOString(),
        });
      }

      console.log(`[Reddit] r/${subreddit}: ${posts.length} posts procesados`);
      // pequeña pausa para no saturar la API pública de Reddit
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.error(`[Reddit] Error en r/${subreddit}:`, err.message);
    }
  }

  console.log(`[Reddit] Total: ${items.length} items`);
  return items;
}

module.exports = { fetchReddit };
