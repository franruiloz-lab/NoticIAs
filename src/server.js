const express = require('express');
const path = require('path');
const { getItems, getStats } = require('./db');

const app = express();
const PORT = 3333;

app.use(express.static(path.join(__dirname, '..', 'public')));

// API: listado de items con filtros
app.get('/api/items', (req, res) => {
  const { profile, minScore, limit = 50, offset = 0, search } = req.query;
  try {
    const items = getItems({
      profile,
      minScore: minScore ? parseInt(minScore) : undefined,
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

// API: estadísticas
app.get('/api/stats', (req, res) => {
  try {
    res.json(getStats());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n NoticIAs corriendo en http://localhost:${PORT}\n`);
});
