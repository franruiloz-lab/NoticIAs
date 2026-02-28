require('dotenv').config();

module.exports = {
  GROQ_API_KEY: process.env.GROQ_API_KEY,

  RSS_FEEDS: [
    // Blogs oficiales de labs de IA
    { name: 'OpenAI Blog',       url: 'https://openai.com/blog/rss.xml' },
    { name: 'Anthropic News',    url: 'https://www.anthropic.com/rss.xml' },
    { name: 'Google DeepMind',   url: 'https://deepmind.google/blog/rss.xml' },
    { name: 'Mistral AI',        url: 'https://mistral.ai/news/rss' },
    { name: 'Hugging Face Blog', url: 'https://huggingface.co/blog/feed.xml' },
    // Newsletters y medios IA
    { name: 'The Batch (deeplearning.ai)', url: 'https://www.deeplearning.ai/the-batch/feed/' },
    { name: 'Import AI',         url: 'https://importai.substack.com/feed' },
    { name: 'Ben\'s Bites',      url: 'https://bensbites.beehiiv.com/feed' },
    { name: 'The Rundown AI',    url: 'https://www.therundown.ai/feed' },
    { name: 'TLDR AI',           url: 'https://tldr.tech/ai/rss' },
    { name: 'Towards Data Science', url: 'https://towardsdatascience.com/feed' },
    { name: 'VentureBeat AI',    url: 'https://venturebeat.com/category/ai/feed/' },
  ],

  REDDIT_SUBREDDITS: [
    'MachineLearning',
    'artificial',
    'ChatGPT',
    'SideProject',
    'Entrepreneur',
    'startups',
    'LocalLLaMA',
    'AIAssistants',
  ],

  REDDIT_MIN_SCORE: 50, // solo posts con >= X upvotes

  HACKERNEWS_MIN_SCORE: 30, // solo stories con >= X puntos
  HACKERNEWS_TAGS: ['story'], // 'story', 'ask_hn', 'show_hn'

  MAX_ITEMS_PER_SOURCE: 20, // cuantos items traer por fuente en cada fetch

  AI_FILTER: {
    model: 'llama-3.1-8b-instant', // modelo rápido y barato en Groq
    min_score: 6,            // puntuación mínima para guardar (0-10)
  },
};
