import { splitStatements } from './sqlSplit.js'

// PostgreSQL type ids that are right-aligned in the results grid
const NUMERIC_TYPES = new Set([20, 21, 23, 26, 700, 701, 790, 1700])

const LIST_TABLES_SQL = `SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name`

const describeSql = (table) => `SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = '${table.replace(/'/g, "''")}'
ORDER BY ordinal_position`

/**
 * Run every statement in `sql`, one at a time, stopping at the first error.
 *
 * ctx = { dbName, getDatabase(name), listDatabases(), createDatabase(name), dropDatabase(name) }
 */
export async function runScript(sql, ctx) {
  const statements = splitStatements(sql)
  const blocks = []
  const touched = new Set([ctx.dbName])
  let dbName = ctx.dbName

  for (let i = 0; i < statements.length; i++) {
    const st = statements[i]
    const started = performance.now()
    try {
      const out = await runStatement(st.text, dbName, ctx)
      const ms = performance.now() - started
      if (out.switchTo) dbName = out.switchTo
      out.touched?.forEach((name) => touched.add(name))
      touched.add(dbName)
      for (const block of out.blocks) blocks.push({ sql: st.text, db: dbName, ms, ...block })
    } catch (err) {
      blocks.push({
        kind: 'error',
        sql: st.text,
        db: dbName,
        ms: performance.now() - started,
        message: err?.message || String(err),
        detail: err?.detail,
        hint: err?.hint,
        hasPosition: Boolean(err?.position),
        offset: st.start + Math.max(0, Number(err?.position || 1) - 1),
        start: st.start,
        end: st.start + st.text.length,
        skipped: statements.length - i - 1,
      })
      break
    }
  }
  return { blocks, dbName, touched: [...touched], statementCount: statements.length }
}

async function runStatement(text, dbName, ctx) {
  // Single-line version without comments, used to spot the helper commands below
  const cmd = text.replace(/--[^\n]*/g, ' ').replace(/\s+/g, ' ').trim().replace(/;$/, '')
  const isMeta = cmd.startsWith('\\')
  let m

  if ((m = /^(?:use|\\c|\\connect) "?(\w+)"?$/i.exec(cmd))) {
    const name = m[1].toLowerCase()
    if (!ctx.listDatabases().includes(name)) throw new Error(`database "${name}" does not exist`)
    await ctx.getDatabase(name)
    return {
      switchTo: name,
      blocks: [{
        kind: 'message',
        message: `Now using database "${name}"`,
        note: isMeta ? undefined : `USE comes from MySQL. In PostgreSQL you connect to a database instead (psql: \\c ${name}). SQL Studio accepts both.`,
      }],
    }
  }

  if ((m = /^create database "?(\w+)"?$/i.exec(cmd))) {
    const name = m[1].toLowerCase()
    await ctx.createDatabase(name)
    return { touched: [name], blocks: [{ kind: 'message', message: `CREATE DATABASE — "${name}" created. Switch to it with: USE ${name};` }] }
  }

  if ((m = /^drop database (if exists )?"?(\w+)"?$/i.exec(cmd))) {
    const name = m[2].toLowerCase()
    if (!ctx.listDatabases().includes(name)) {
      if (m[1]) return { blocks: [{ kind: 'message', message: `database "${name}" does not exist, skipping` }] }
      throw new Error(`database "${name}" does not exist`)
    }
    if (name === dbName) throw new Error(`cannot drop the currently open database "${name}". Switch to another one first, e.g. USE other_db;`)
    await ctx.dropDatabase(name)
    return { blocks: [{ kind: 'message', message: `DROP DATABASE — "${name}" deleted` }] }
  }

  if (/^(?:show databases|\\l)$/i.test(cmd)) {
    return {
      blocks: [{
        kind: 'rows',
        columns: [{ name: 'database', numeric: false }],
        rows: ctx.listDatabases().map((name) => [name]),
        note: isMeta ? undefined : 'SHOW DATABASES is MySQL. In PostgreSQL: SELECT datname FROM pg_database;  (psql: \\l)',
      }],
    }
  }

  if (/^(?:show tables|\\dt)$/i.test(cmd)) {
    const why = isMeta ? '\\dt is a psql shortcut.' : 'SHOW TABLES is MySQL. PostgreSQL does not have it.'
    return runSql(LIST_TABLES_SQL, dbName, ctx, `${why} SQL Studio ran this instead:\n${LIST_TABLES_SQL};`)
  }

  if ((m = /^(?:describe|desc|\\d) "?(\w+)"?$/i.exec(cmd))) {
    const query = describeSql(m[1].toLowerCase())
    const why = isMeta ? '\\d is a psql shortcut.' : 'DESCRIBE is MySQL. PostgreSQL does not have it.'
    return runSql(query, dbName, ctx, `${why} SQL Studio ran this instead:\n${query};`)
  }

  if (isMeta) throw new Error(`unknown command "${cmd}". Supported psql shortcuts: \\c <db>, \\l, \\dt, \\d <table>`)

  return runSql(text, dbName, ctx)
}

async function runSql(text, dbName, ctx, note) {
  const db = await ctx.getDatabase(dbName)
  const results = await db.exec(text, { rowMode: 'array' })
  if (!results.length) return { blocks: [{ kind: 'message', message: 'Done', note }] }
  return {
    blocks: results.map((r) =>
      r.fields.length
        ? {
            kind: 'rows',
            columns: r.fields.map((f) => ({ name: f.name, numeric: NUMERIC_TYPES.has(f.dataTypeID) })),
            rows: r.rows,
            note,
          }
        : { kind: 'message', message: commandMessage(r, text), note },
    ),
  }
}

const ROW_COMMANDS = new Set(['INSERT', 'UPDATE', 'DELETE', 'MERGE', 'COPY'])
const OBJECT_COMMANDS = new Set(['CREATE', 'DROP', 'ALTER', 'COMMENT'])
const FILLER_WORDS = new Set(['OR', 'REPLACE', 'UNIQUE', 'TEMP', 'TEMPORARY', 'IF', 'NOT', 'EXISTS', 'MATERIALIZED'])

function commandMessage(result, text) {
  const words = text.replace(/--[^\n]*/g, ' ').trim().toUpperCase().split(/\s+/)
  const verb = (result.command || words[0]).toUpperCase()
  if (ROW_COMMANDS.has(verb)) {
    const n = result.rowCount ?? result.affectedRows ?? 0
    return `${verb} — ${n} row${n === 1 ? '' : 's'} affected`
  }
  if (OBJECT_COMMANDS.has(words[0])) {
    const object = words.slice(1).find((w) => !FILLER_WORDS.has(w))
    return `${words[0]} ${object ?? ''} — done`.replace('  ', ' ')
  }
  return `${words[0]} — done`
}
