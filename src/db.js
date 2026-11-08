import { PGlite } from '@electric-sql/pglite'
import { DEFAULT_DATABASES } from './defaults.js'
import { load, remove, save } from './util.js'

// Each database is its own PGlite (real PostgreSQL) instance, stored in the
// browser's IndexedDB so your data survives a page reload.
const STORE_PREFIX = 'sqlstudio-'
const instances = new Map()

// Keep dates and times exactly as PostgreSQL prints them (not JS Date objects)
const asText = (value) => value
const parsers = { 1082: asText, 1083: asText, 1114: asText, 1184: asText, 1186: asText, 1266: asText }

export const isDefaultDatabase = (name) => Object.hasOwn(DEFAULT_DATABASES, name)

export function loadDatabaseList() {
  const list = load('databases')
  return Array.isArray(list) && list.length ? list : Object.keys(DEFAULT_DATABASES)
}

export function getDatabase(name) {
  if (!instances.has(name)) {
    const ready = (async () => {
      const db = await PGlite.create(`idb://${STORE_PREFIX}${name}`, { parsers })
      if (isDefaultDatabase(name) && !load(`seeded.${name}`)) {
        await db.exec(DEFAULT_DATABASES[name])
        save(`seeded.${name}`, true)
      }
      return db
    })()
    ready.catch(() => instances.delete(name))
    instances.set(name, ready)
  }
  return instances.get(name)
}

function checkNewName(name, list) {
  if (!/^[a-z_][a-z0-9_]{0,40}$/.test(name)) {
    throw new Error(`invalid database name "${name}". Use lowercase letters, numbers and _ (must not start with a number)`)
  }
  if (list.includes(name)) throw new Error(`database "${name}" already exists`)
}

export async function createDatabase(name) {
  const list = loadDatabaseList()
  checkNewName(name, list)
  await getDatabase(name)
  const next = [...list, name]
  save('databases', next)
  return next
}

export async function dropDatabase(name) {
  const list = loadDatabaseList()
  if (!list.includes(name)) throw new Error(`database "${name}" does not exist`)
  if (list.length === 1) throw new Error('cannot drop the only database')
  const instance = instances.get(name)
  instances.delete(name)
  if (instance) {
    try {
      await (await instance).close()
    } catch {
      // already closed
    }
  }
  await deleteStore(name)
  remove(`seeded.${name}`)
  const next = list.filter((n) => n !== name)
  save('databases', next)
  return next
}

/** ALTER DATABASE old RENAME TO new: copy the data files to the new name, then delete the old ones. */
export async function renameDatabase(oldName, newName) {
  const list = loadDatabaseList()
  if (!list.includes(oldName)) throw new Error(`database "${oldName}" does not exist`)
  checkNewName(newName, list)

  const source = await getDatabase(oldName)
  const files = await source.dumpDataDir('none')
  const copy = await PGlite.create(`idb://${STORE_PREFIX}${newName}`, { parsers, loadDataDir: files })
  instances.set(newName, Promise.resolve(copy))
  // the copy already has its data, so a practice-database name must not be filled again
  if (isDefaultDatabase(newName)) save(`seeded.${newName}`, true)

  instances.delete(oldName)
  await source.close()
  await deleteStore(oldName)
  remove(`seeded.${oldName}`)

  const next = list.map((n) => (n === oldName ? newName : n))
  save('databases', next)
  return next
}

/** Put a practice database back to its original data (other databases are emptied). */
export async function resetDatabase(name) {
  const db = await getDatabase(name)
  await db.exec('DROP SCHEMA public CASCADE; CREATE SCHEMA public;')
  if (isDefaultDatabase(name)) await db.exec(DEFAULT_DATABASES[name])
}

async function deleteStore(name) {
  if (!indexedDB.databases) return
  const target = STORE_PREFIX + name
  const stores = await indexedDB.databases()
  await Promise.all(
    stores
      .filter((s) => s.name?.endsWith(target))
      .map(
        (s) =>
          new Promise((resolve) => {
            const req = indexedDB.deleteDatabase(s.name)
            req.onsuccess = req.onerror = req.onblocked = () => resolve()
          }),
      ),
  )
}
