require('dotenv').config();

module.exports = {
  GROQ_API_KEY: process.env.GROQ_API_KEY,

  RSS_FEEDS: [
    // Blogs oficiales de labs de IA
    { name: 'OpenAI Blog',          url: 'https://openai.com/blog/rss.xml' },
    { name: 'Google DeepMind',      url: 'https://deepmind.google/blog/rss.xml' },
    { name: 'Hugging Face Blog',    url: 'https://huggingface.co/blog/feed.xml' },
    { name: 'Mistral AI',           url: 'https://mistral.ai/news/rss.xml' },
    // Newsletters IA
    { name: 'Import AI',            url: 'https://importai.substack.com/feed' },
    { name: 'Towards Data Science', url: 'https://towardsdatascience.com/feed' },
    { name: 'VentureBeat AI',       url: 'https://venturebeat.com/category/ai/feed/' },
    { name: 'The Decoder',          url: 'https://the-decoder.com/feed/' },
    // ── Fuentes de negocios e ideas (gente real, sin humo) ──
    // Indie Hackers: fundadores bootstrapped que comparten ingresos reales
    { name: 'Indie Hackers',        url: 'https://www.indiehackers.com/feed.rss' },
    // Product Hunt: lanzamientos de productos IA nuevos
    { name: 'Product Hunt',         url: 'https://www.producthunt.com/feed' },
    // Bannerbear blog: caso real de SaaS bootstrapped con IA (comparte revenue)
    { name: 'Bannerbear Blog',      url: 'https://www.bannerbear.com/blog/feed/' },
    // No Code MBA: tutoriales de negocios sin código con IA
    { name: 'No Code MBA',          url: 'https://www.nocode.mba/feed' },
    // Lenny's Newsletter (free posts): estrategia de producto y crecimiento
    { name: "Lenny's Newsletter",   url: 'https://www.lennysnewsletter.com/feed' },
  ],

  REDDIT_SUBREDDITS: [
    // IA y tecnología
    'MachineLearning',
    'LocalLLaMA',
    'artificial',
    // Negocios reales con IA (gente que comparte lo que gana)
    'EntrepreneurRideAlong', // fundadores compartiendo su viaje con números reales
    'microsaas',             // micro-SaaS, negocios pequeños y rentables
    'SideProject',           // proyectos secundarios que generan ingresos
    'AIAssistants',
    'ChatGPT',
  ],

  REDDIT_MIN_SCORE: 50,

  HACKERNEWS_MIN_SCORE: 30,

  MAX_ITEMS_PER_SOURCE: 20,

  // Antigüedad máxima de noticias a mostrar por defecto (días)
  DEFAULT_MAX_DAYS: 7,

  AI_FILTER: {
    model: 'llama-3.1-8b-instant',
    min_score: 6,
  },
};
