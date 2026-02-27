const { fetchHackerNews } = require('./src/fetchers/hackernews');
const { fetchReddit }     = require('./src/fetchers/reddit');
const { fetchRSS }        = require('./src/fetchers/rss');
const { filterItems }     = require('./src/filter');
const { insertItem }      = require('./src/db');

async function main() {
  console.log('=== NoticIAs — Fetch & Filter ===\n');

  // 1. Recopilar de todas las fuentes en paralelo
  const [hn, reddit, rss] = await Promise.all([
    fetchHackerNews(),
    fetchReddit(),
    fetchRSS(),
  ]);

  const allItems = [...hn, ...reddit, ...rss];
  console.log(`\nTotal recogido: ${allItems.length} items\n`);

  if (allItems.length === 0) {
    console.log('Nada que procesar.');
    return;
  }

  // 2. Filtrar con IA
  const filtered = await filterItems(allItems);

  // 3. Guardar en SQLite (INSERT OR IGNORE, no duplica)
  let saved = 0;
  for (const item of filtered) {
    const result = insertItem(item);
    if (result.changes > 0) saved++;
  }

  console.log(`\n=== Listo: ${saved} items nuevos guardados (${filtered.length - saved} ya existían) ===\n`);
}

main().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
