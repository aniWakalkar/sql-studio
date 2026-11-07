// Monaco (the editor inside VS Code) set up for SQL:
// local bundle (works offline), autocomplete for tables/columns, snippets and Format Document.
import * as monaco from 'monaco-editor'
import EditorWorker from 'monaco-editor/editor/editor.worker.js?worker'
import { loader } from '@monaco-editor/react'
import { format } from 'sql-formatter'

self.MonacoEnvironment = { getWorker: () => new EditorWorker() }
loader.config({ monaco })
monaco.editor.setTheme('vs-dark')

const KEYWORDS = [...new Set(`
  SELECT FROM WHERE AND OR NOT IN IS NULL LIKE ILIKE BETWEEN EXISTS AS DISTINCT ORDER BY GROUP HAVING
  LIMIT OFFSET FETCH ASC DESC NULLS FIRST LAST JOIN INNER LEFT RIGHT FULL OUTER CROSS NATURAL ON USING
  UNION ALL INTERSECT EXCEPT CASE WHEN THEN ELSE END INSERT INTO VALUES UPDATE SET DELETE RETURNING
  TRUNCATE CREATE TABLE VIEW INDEX DATABASE SCHEMA DROP ALTER ADD COLUMN RENAME TO CONSTRAINT PRIMARY
  KEY FOREIGN REFERENCES UNIQUE CHECK DEFAULT CASCADE IF BEGIN COMMIT ROLLBACK SAVEPOINT GRANT REVOKE
  WITH RECURSIVE OVER PARTITION WINDOW FILTER INTEGER INT BIGINT SMALLINT SERIAL NUMERIC DECIMAL REAL
  VARCHAR CHAR TEXT BOOLEAN DATE TIME TIMESTAMP INTERVAL TRUE FALSE GENERATED ALWAYS IDENTITY EXPLAIN
  ANALYZE USE SHOW TABLES DESCRIBE`.trim().split(/\s+/))]

const FUNCTIONS = [
  ['COUNT', 'Number of rows'], ['SUM', 'Total'], ['AVG', 'Average'], ['MIN', 'Smallest value'], ['MAX', 'Largest value'],
  ['ROUND', 'Round a number: ROUND(x, 2)'], ['COALESCE', 'First non-NULL value'], ['NULLIF', 'NULL if both are equal'],
  ['UPPER', 'Upper case'], ['LOWER', 'Lower case'], ['LENGTH', 'Number of characters'], ['CONCAT', 'Join text'],
  ['SUBSTRING', 'Part of text'], ['TRIM', 'Remove spaces'], ['REPLACE', 'Replace text'], ['STRING_AGG', "Join values: STRING_AGG(name, ', ')"],
  ['NOW', 'Current date and time'], ['AGE', 'Time between dates'], ['EXTRACT', 'EXTRACT(YEAR FROM hire_date)'],
  ['DATE_PART', "DATE_PART('year', hire_date)"], ['TO_CHAR', "Format: TO_CHAR(hire_date, 'DD Mon YYYY')"], ['CAST', 'CAST(x AS type)'],
  ['ROW_NUMBER', 'Window: 1, 2, 3, 4'], ['RANK', 'Window: 1, 2, 2, 4'], ['DENSE_RANK', 'Window: 1, 2, 2, 3'],
  ['LAG', 'Window: previous row value'], ['LEAD', 'Window: next row value'], ['NTILE', 'Window: split into buckets'],
]

const SNIPPETS = [
  ['sel', 'SELECT … FROM …', 'SELECT ${1:*}\nFROM ${2:table_name};'],
  ['selw', 'SELECT … WHERE …', 'SELECT ${1:*}\nFROM ${2:table_name}\nWHERE ${3:condition};'],
  ['join', 'INNER JOIN', 'SELECT ${1:*}\nFROM ${2:table1} a\nJOIN ${3:table2} b ON a.${4:id} = b.${5:id};'],
  ['ljoin', 'LEFT JOIN', 'SELECT ${1:*}\nFROM ${2:table1} a\nLEFT JOIN ${3:table2} b ON a.${4:id} = b.${5:id};'],
  ['grp', 'GROUP BY … HAVING', 'SELECT ${1:column}, COUNT(*) AS total\nFROM ${2:table_name}\nGROUP BY ${1:column}\nHAVING COUNT(*) > ${3:1};'],
  ['ins', 'INSERT INTO', 'INSERT INTO ${1:table_name} (${2:columns})\nVALUES (${3:values});'],
  ['upd', 'UPDATE … SET … WHERE', 'UPDATE ${1:table_name}\nSET ${2:column} = ${3:value}\nWHERE ${4:condition};'],
  ['del', 'DELETE … WHERE', 'DELETE FROM ${1:table_name}\nWHERE ${2:condition};'],
  ['crt', 'CREATE TABLE', 'CREATE TABLE ${1:table_name} (\n    ${2:id} SERIAL PRIMARY KEY,\n    ${3:name} VARCHAR(50) NOT NULL\n);'],
  ['case', 'CASE WHEN', 'CASE\n    WHEN ${1:condition} THEN ${2:value}\n    ELSE ${3:value}\nEND'],
  ['cte', 'WITH … AS (CTE)', 'WITH ${1:cte_name} AS (\n    ${2:SELECT 1}\n)\nSELECT * FROM ${1:cte_name};'],
  ['win', 'Window function', '${1:ROW_NUMBER}() OVER (PARTITION BY ${2:column} ORDER BY ${3:column} DESC)'],
  ['tx', 'BEGIN … ROLLBACK', 'BEGIN;\n${1:-- your changes}\nROLLBACK; -- or COMMIT;'],
]

// Tables of the active database, set by App whenever the schema changes
let schema = []
export function setCompletionSchema(tables) {
  schema = tables ?? []
}

const keywordSet = new Set(KEYWORDS)

// "FROM employees e JOIN departments AS d" -> { e: 'employees', employees: 'employees', d: 'departments', ... }
function aliasMap(text) {
  const map = {}
  for (const m of text.matchAll(/\b(?:from|join)\s+([a-z_]\w*)(?:\s+(?:as\s+)?([a-z_]\w*))?/gi)) {
    const table = m[1].toLowerCase()
    map[table] = table
    if (m[2] && !keywordSet.has(m[2].toUpperCase())) map[m[2].toLowerCase()] = table
  }
  return map
}

const { CompletionItemKind: Kind, CompletionItemInsertTextRule: Rule } = monaco.languages

monaco.languages.registerCompletionItemProvider('sql', {
  triggerCharacters: ['.'],
  provideCompletionItems(model, position) {
    const word = model.getWordUntilPosition(position)
    const range = {
      startLineNumber: position.lineNumber,
      endLineNumber: position.lineNumber,
      startColumn: word.startColumn,
      endColumn: word.endColumn,
    }
    const before = model.getLineContent(position.lineNumber).slice(0, word.startColumn - 1)

    // After "alias." only suggest that table's columns
    const dotted = /([A-Za-z_]\w*)\.$/.exec(before)
    if (dotted) {
      const tableName = aliasMap(model.getValue())[dotted[1].toLowerCase()] ?? dotted[1].toLowerCase()
      const table = schema.find((t) => t.name === tableName)
      return {
        suggestions: (table?.columns ?? []).map((c, i) => ({
          label: c.name,
          kind: Kind.Field,
          detail: `${c.type}${c.pk ? ' · primary key' : ''}${c.ref ? ` · → ${c.ref}` : ''}`,
          insertText: c.name,
          sortText: String(i).padStart(3, '0'),
          range,
        })),
      }
    }

    const columnTables = new Map()
    for (const t of schema) {
      for (const c of t.columns) {
        if (!columnTables.has(c.name)) columnTables.set(c.name, { type: c.type, tables: [] })
        columnTables.get(c.name).tables.push(t.name)
      }
    }

    const suggestions = [
      ...SNIPPETS.map(([label, detail, body]) => ({
        label, detail, kind: Kind.Snippet, insertText: body, insertTextRules: Rule.InsertAsSnippet, sortText: `0${label}`, range,
      })),
      ...schema.map((t) => ({
        label: t.name,
        kind: t.isView ? Kind.Interface : Kind.Struct,
        detail: `${t.isView ? 'view' : 'table'}${t.rowCount != null ? ` · ${t.rowCount} rows` : ''}`,
        documentation: t.columns.map((c) => `${c.name} ${c.type}`).join('\n'),
        insertText: t.name,
        sortText: `1${t.name}`,
        range,
      })),
      ...[...columnTables].map(([name, info]) => ({
        label: name,
        kind: Kind.Field,
        detail: `${info.type} · ${info.tables.join(', ')}`,
        insertText: name,
        sortText: `2${name}`,
        range,
      })),
      ...FUNCTIONS.map(([name, detail]) => ({
        label: name, detail, kind: Kind.Function, insertText: `${name}($0)`, insertTextRules: Rule.InsertAsSnippet, sortText: `3${name}`, range,
      })),
      ...KEYWORDS.map((k) => ({ label: k, kind: Kind.Keyword, insertText: k, sortText: `4${k}`, range })),
    ]
    return { suggestions }
  },
})

// Shift+Alt+F (Format Document) and Format Selection
const formatSql = (text) => format(text, { language: 'postgresql', keywordCase: 'upper', tabWidth: 4, linesBetweenQueries: 1 })

monaco.languages.registerDocumentFormattingEditProvider('sql', {
  provideDocumentFormattingEdits(model) {
    try {
      return [{ range: model.getFullModelRange(), text: formatSql(model.getValue()) }]
    } catch {
      return []
    }
  },
})

monaco.languages.registerDocumentRangeFormattingEditProvider('sql', {
  provideDocumentRangeFormattingEdits(model, range) {
    try {
      return [{ range, text: formatSql(model.getValueInRange(range)) }]
    } catch {
      return []
    }
  },
})
