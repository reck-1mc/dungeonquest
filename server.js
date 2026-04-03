const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false
});

async function ensureSchema() {
  const sql = `
    CREATE TABLE IF NOT EXISTS highscores (
      id BIGSERIAL PRIMARY KEY,
      first_name VARCHAR(40) NOT NULL,
      last_name VARCHAR(40) NOT NULL,
      hero_name VARCHAR(40) NOT NULL,
      hero_class VARCHAR(40) NOT NULL,
      gold INTEGER NOT NULL DEFAULT 0,
      items_count INTEGER NOT NULL DEFAULT 0,
      remaining_body INTEGER NOT NULL DEFAULT 0,
      killed_dragon BOOLEAN NOT NULL DEFAULT FALSE,
      score INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_highscores_score_created
      ON highscores (score DESC, created_at ASC);
  `;
  await pool.query(sql);
}

function sanitizeText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

function toInt(value, fallback = 0) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false });
  }
});

app.get('/api/highscores', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        id,
        first_name,
        last_name,
        hero_name,
        hero_class,
        gold,
        items_count,
        remaining_body,
        killed_dragon,
        score,
        created_at
      FROM highscores
      ORDER BY score DESC, created_at ASC
      LIMIT 10
    `);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Impossible de récupérer les scores.' });
  }
});

app.post('/api/highscores', async (req, res) => {
  try {
    const payload = {
      firstName: sanitizeText(req.body.firstName, 40),
      lastName: sanitizeText(req.body.lastName, 40),
      heroName: sanitizeText(req.body.heroName, 40),
      heroClass: sanitizeText(req.body.heroClass, 40),
      gold: Math.max(0, toInt(req.body.gold)),
      itemsCount: Math.max(0, toInt(req.body.itemsCount)),
      remainingBody: Math.max(0, toInt(req.body.remainingBody)),
      killedDragon: Boolean(req.body.killedDragon),
      score: Math.max(0, toInt(req.body.score))
    };

    if (!payload.firstName || !payload.lastName) {
      return res.status(400).json({ error: 'Nom et prénom sont obligatoires.' });
    }

    if (!payload.heroName || !payload.heroClass) {
      return res.status(400).json({ error: 'Le héros est obligatoire.' });
    }

    const { rows } = await pool.query(
      `
        INSERT INTO highscores (
          first_name,
          last_name,
          hero_name,
          hero_class,
          gold,
          items_count,
          remaining_body,
          killed_dragon,
          score
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        RETURNING *
      `,
      [
        payload.firstName,
        payload.lastName,
        payload.heroName,
        payload.heroClass,
        payload.gold,
        payload.itemsCount,
        payload.remainingBody,
        payload.killedDragon,
        payload.score
      ]
    );

    // Garde-fou : on ne conserve que le top 10
    await pool.query(`
      DELETE FROM highscores
      WHERE id IN (
        SELECT id
        FROM highscores
        ORDER BY score DESC, created_at ASC
        OFFSET 10
      )
    `);

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Impossible de sauvegarder le score.' });
  }
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

ensureSchema()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`DungeonQuest server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Schema init failed:', error);
    process.exit(1);
  });
