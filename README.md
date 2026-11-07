# SQL Studio

A simple, VS Code-style SQL tool for learning, built with React.
It runs **real PostgreSQL** in the browser (via [PGlite](https://pglite.dev)), so there's no database server to install.

## Start it

Double-click **`start.bat`**, or in a terminal:

```bash
cd sql-studio
npm install      # first time only
npm run dev      # opens http://localhost:7341 in your browser
```

## Live demo

https://aniwakalkar.github.io/sql-studio/  (deployed automatically by `.github/workflows/deploy.yml` on every push to `master`)

## What's inside

- **Explorer (left):** databases with their tables and columns, query files, and notes
- **Editor (middle):** Monaco, the editor from VS Code. Run with ▶, `F5`, `Ctrl+Enter`, or select text and press `Enter`
- **Output (right):** result tables, messages and errors

The `company` database, `practice.sql` and the notes come from the `content/` folder.
Shortcuts and tips are in the **APP-GUIDE.md** note inside the app.

## Code map

| File | Purpose |
|------|---------|
| `src/App.jsx` | Layout, state, running queries, keyboard shortcuts |
| `src/components/` | Explorer, EditorArea, OutputPane, NoteView, StatusBar, … |
| `src/db.js` | Opens/creates/resets PostgreSQL databases (stored in IndexedDB) |
| `src/runner.js` | Runs a script statement by statement; handles `USE`, `SHOW TABLES`, `\dt`, … |
| `src/sqlSplit.js` | Splits a script into statements (quotes, comments, `$$`) |
| `src/schema.js` | Reads tables, columns and keys for the Explorer and autocomplete |
| `src/sqlLanguage.js` | Monaco setup: autocomplete, snippets, Format SQL |
| `src/defaults.js` | Default databases, query file and notes (from `content/`) |
| `content/` | `company.sql` (tables + data), `practice.sql`, and the notes |
