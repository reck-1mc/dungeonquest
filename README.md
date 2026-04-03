# DungeonQuest Railway

## Structure
- `public/index.html` : page HTML
- `public/styles.css` : styles
- `public/app.js` : logique front
- `server.js` : backend Node.js + API scores
- `db/schema.sql` : schéma PostgreSQL

## API
- `GET /api/highscores` → top 10
- `POST /api/highscores` → ajout d'un score

## Lancement local
```bash
npm install
cp .env.example .env
# renseigne DATABASE_URL
npm start
```

## Déploiement Railway
- crée un projet Railway
- ajoute un service PostgreSQL
- ajoute la variable `DATABASE_URL`
- deploy depuis le repo GitHub
- commande de start : `npm start`
