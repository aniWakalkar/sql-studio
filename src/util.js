const PREFIX = 'sqlstudio.'

export function load(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw == null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // storage blocked or full: the app still works, it just won't remember
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    // ignore
  }
}

export const isNoteTab = (id) => typeof id === 'string' && id.startsWith('note:')
export const noteTabId = (noteId) => `note:${noteId}`

// ER diagram tabs: "er:company" (whole database) or "er:company:employees" (one table)
export const isErTab = (id) => typeof id === 'string' && id.startsWith('er:')
export const erTabId = (db, table) => (table ? `er:${db}:${table}` : `er:${db}`)
export function parseErTab(id) {
  const [db, ...rest] = id.slice(3).split(':')
  return { db, table: rest.join(':') || null }
}
// Tabs that show something other than the SQL editor
export const isViewTab = (id) => isNoteTab(id) || isErTab(id)
export const newId = () => Math.random().toString(36).slice(2, 10)
export const modelPath = (fileId) => `inmemory://sqlstudio/${fileId}.sql`
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

export const quoteIdent = (name) => (/^[a-z_][a-z0-9_]*$/.test(name) ? name : `"${name.replace(/"/g, '""')}"`)

export function formatMs(ms) {
  if (ms < 1) return '<1 ms'
  if (ms < 1000) return `${Math.round(ms)} ms`
  return `${(ms / 1000).toFixed(2)} s`
}
