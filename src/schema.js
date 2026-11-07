import { quoteIdent } from './util.js'

const RELATION_KINDS = `('r', 'p', 'v', 'm')`

/**
 * Read the tables, columns and keys of the public schema.
 * Returns [{ name, isView, rowCount, columns: [{ name, type, notNull, pk, ref }] }]
 */
export async function loadSchema(db) {
  const { rows: relations } = await db.query(`
    SELECT c.relname AS name, c.relkind AS kind
    FROM pg_class c
    WHERE c.relnamespace = 'public'::regnamespace AND c.relkind IN ${RELATION_KINDS}
    ORDER BY c.relname`)

  const { rows: columns } = await db.query(`
    SELECT c.relname AS table_name, a.attname AS name,
           format_type(a.atttypid, a.atttypmod) AS type, a.attnotnull AS not_null
    FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    WHERE c.relnamespace = 'public'::regnamespace AND c.relkind IN ${RELATION_KINDS}
      AND a.attnum > 0 AND NOT a.attisdropped
    ORDER BY c.relname, a.attnum`)

  const { rows: keys } = await db.query(`
    SELECT t.relname AS table_name, a.attname AS column_name, k.contype AS type, r.relname AS ref_table
    FROM pg_constraint k
    JOIN pg_class t ON t.oid = k.conrelid
    JOIN pg_attribute a ON a.attrelid = k.conrelid AND a.attnum = ANY (k.conkey)
    LEFT JOIN pg_class r ON r.oid = k.confrelid
    WHERE k.contype IN ('p', 'f') AND t.relnamespace = 'public'::regnamespace`)

  const tables = []
  for (const rel of relations) {
    let rowCount = null
    try {
      rowCount = (await db.query(`SELECT count(*)::int AS n FROM public.${quoteIdent(rel.name)}`)).rows[0].n
    } catch {
      // e.g. a view that fails to run; just don't show a count
    }
    tables.push({
      name: rel.name,
      isView: rel.kind === 'v' || rel.kind === 'm',
      rowCount,
      columns: columns
        .filter((c) => c.table_name === rel.name)
        .map((c) => {
          const own = keys.filter((k) => k.table_name === rel.name && k.column_name === c.name)
          return {
            name: c.name,
            type: shortType(c.type),
            notNull: c.not_null,
            pk: own.some((k) => k.type === 'p'),
            ref: own.find((k) => k.type === 'f')?.ref_table ?? null,
          }
        }),
    })
  }
  return tables
}

const shortType = (type) =>
  type
    .replace('character varying', 'varchar')
    .replace(/^character\b/, 'char')
    .replace('timestamp without time zone', 'timestamp')
    .replace('timestamp with time zone', 'timestamptz')
