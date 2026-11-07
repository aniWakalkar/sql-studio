import { useCallback, useEffect, useRef, useState } from 'react'
import * as monaco from 'monaco-editor'
import ActivityBar from './components/ActivityBar.jsx'
import Explorer from './components/Explorer.jsx'
import EditorArea from './components/EditorArea.jsx'
import OutputPane from './components/OutputPane.jsx'
import StatusBar from './components/StatusBar.jsx'
import Splitter from './components/Splitter.jsx'
import * as dbm from './db.js'
import { loadSchema } from './schema.js'
import { DEFAULT_QUERY_FILE, NOTES } from './defaults.js'
import { runScript } from './runner.js'
import { splitStatements } from './sqlSplit.js'
import { setCompletionSchema } from './sqlLanguage.js'
import { clamp, erTabId, formatMs, isErTab, isNoteTab, isViewTab, load, modelPath, newId, noteTabId, parseErTab, quoteIdent, save } from './util.js'

function loadWorkspace() {
  let files = load('files')
  if (!Array.isArray(files) || !files.length) files = [{ id: 'practice', ...DEFAULT_QUERY_FILE }]
  const valid = new Set([...files.map((f) => f.id), ...NOTES.map((n) => noteTabId(n.id))])
  let openTabs = (load('openTabs') ?? []).filter((id) => valid.has(id))
  if (!openTabs.length) openTabs = [files[0].id]
  let activeTab = load('activeTab')
  if (!openTabs.includes(activeTab)) activeTab = openTabs[0]
  const databases = dbm.loadDatabaseList()
  let activeDb = load('activeDb')
  if (!databases.includes(activeDb)) activeDb = databases[0]
  return { files, openTabs, activeTab, databases, activeDb }
}

const initial = loadWorkspace()
let runCounter = 0

// Underline the failing part of the query in the editor, like VS Code's red squiggles
function markError({ model, base }, error) {
  if (model.isDisposed()) return
  let start = model.getPositionAt(base + (error.hasPosition ? error.offset : error.start))
  let end = model.getPositionAt(base + error.end)
  if (error.hasPosition) {
    const word = model.getWordAtPosition(start)
    if (word) start = { lineNumber: start.lineNumber, column: word.startColumn }
    end = { lineNumber: start.lineNumber, column: word ? word.endColumn : start.column + 1 }
  }
  monaco.editor.setModelMarkers(model, 'sql-run', [{
    severity: monaco.MarkerSeverity.Error,
    message: `ERROR: ${error.message}${error.hint ? `\nHINT: ${error.hint}` : ''}`,
    startLineNumber: start.lineNumber,
    startColumn: start.column,
    endLineNumber: end.lineNumber,
    endColumn: end.column,
  }])
}

// Briefly highlight the statement that Ctrl+Enter is about to run
function flashRange(editor, model, startOffset, endOffset) {
  const s = model.getPositionAt(startOffset)
  const e = model.getPositionAt(endOffset)
  const decorations = editor.createDecorationsCollection([
    { range: new monaco.Range(s.lineNumber, s.column, e.lineNumber, e.column), options: { className: 'flash-statement' } },
  ])
  setTimeout(() => decorations.clear(), 600)
}

export default function App() {
  const [databases, setDatabases] = useState(initial.databases)
  const [activeDb, setActiveDb] = useState(initial.activeDb)
  const [schemas, setSchemas] = useState({})
  const [files, setFiles] = useState(initial.files)
  const [openTabs, setOpenTabs] = useState(initial.openTabs)
  const [activeTab, setActiveTab] = useState(initial.activeTab)
  const [lastSqlTab, setLastSqlTab] = useState(isViewTab(initial.activeTab) ? null : initial.activeTab)
  const [runs, setRuns] = useState([])
  const [running, setRunning] = useState(false)
  const [status, setStatus] = useState({ text: 'Starting PostgreSQL…', busy: true })
  const [pgVersion, setPgVersion] = useState('')
  const [cursor, setCursor] = useState({ line: 1, column: 1, selected: 0 })
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [leftWidth, setLeftWidth] = useState(() => load('leftWidth', 280))
  const [rightWidth, setRightWidth] = useState(() => load('rightWidth', 560))
  const [outputOpen, setOutputOpen] = useState(() => load('outputOpen', true))

  const editorRef = useRef(null)
  const runningRef = useRef(false)
  const pendingInsertRef = useRef(null)
  // Latest state for callbacks that are registered once (Monaco commands, window shortcuts)
  const live = useRef({})
  live.current = { databases, activeDb, files, openTabs, activeTab, lastSqlTab, schemas }

  useEffect(() => save('files', files), [files])
  useEffect(() => save('openTabs', openTabs), [openTabs])
  useEffect(() => save('activeTab', activeTab), [activeTab])
  useEffect(() => save('activeDb', activeDb), [activeDb])
  useEffect(() => save('leftWidth', leftWidth), [leftWidth])
  useEffect(() => save('rightWidth', rightWidth), [rightWidth])
  useEffect(() => save('outputOpen', outputOpen), [outputOpen])
  useEffect(() => {
    if (activeTab && !isViewTab(activeTab)) setLastSqlTab(activeTab)
  }, [activeTab])
  useEffect(() => {
    const tables = schemas[activeDb]
    setCompletionSchema(Array.isArray(tables) ? tables : [])
  }, [schemas, activeDb])

  const refreshSchema = useCallback(async (name) => {
    try {
      const tables = await loadSchema(await dbm.getDatabase(name))
      setSchemas((s) => ({ ...s, [name]: tables }))
    } catch (e) {
      setSchemas((s) => ({ ...s, [name]: { error: e.message } }))
    }
  }, [])

  const addRun = useCallback((run) => {
    setRuns((list) => [{ id: ++runCounter, at: new Date(), statementCount: 0, ms: 0, ...run }, ...list].slice(0, 50))
  }, [])

  const notify = useCallback(
    (message, kind = 'message') => addRun({ db: live.current.activeDb, blocks: [{ kind, message }] }),
    [addRun],
  )

  // Start PostgreSQL and read every database's tables for the Explorer
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const db = await dbm.getDatabase(live.current.activeDb)
        const { rows } = await db.query('SELECT version() AS v')
        if (cancelled) return
        setPgVersion(rows[0].v.split(' ').slice(0, 2).join(' '))
        setStatus({ text: 'Ready' })
      } catch (e) {
        if (!cancelled) setStatus({ text: `Could not start PostgreSQL: ${e.message}`, error: true })
      }
      for (const name of live.current.databases) {
        if (!cancelled) await refreshSchema(name)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [refreshSchema])

  const selectDb = useCallback(
    (name) => {
      if (!name) return
      live.current.activeDb = name
      setActiveDb(name)
      if (!live.current.schemas[name]) refreshSchema(name)
    },
    [refreshSchema],
  )

  /** Run SQL text. `source` = { model, base } when it came from the editor (used to underline errors). */
  const execute = useCallback(
    async (sql, source = null) => {
      if (runningRef.current) return
      runningRef.current = true
      setRunning(true)
      setStatus({ text: 'Running…', busy: true })
      if (source) monaco.editor.setModelMarkers(source.model, 'sql-run', [])
      const started = performance.now()
      try {
        const result = await runScript(sql, {
          dbName: live.current.activeDb,
          getDatabase: dbm.getDatabase,
          listDatabases: () => live.current.databases,
          createDatabase: async (name) => {
            const list = await dbm.createDatabase(name)
            live.current.databases = list
            setDatabases(list)
          },
          dropDatabase: async (name) => {
            const list = await dbm.dropDatabase(name)
            live.current.databases = list
            setDatabases(list)
            setSchemas(({ [name]: _dropped, ...rest }) => rest)
          },
        })
        const ms = performance.now() - started
        if (!result.statementCount) {
          setStatus({ text: 'Nothing to run. Write a query first.' })
          return
        }
        selectDb(result.dbName)
        result.touched.filter((n) => live.current.databases.includes(n)).forEach(refreshSchema)
        addRun({ db: result.dbName, blocks: result.blocks, ms, statementCount: result.statementCount })
        setOutputOpen(true) // never hide a fresh result
        const error = result.blocks.find((b) => b.kind === 'error')
        if (error && source) markError(source, error)
        setStatus(
          error
            ? { text: `ERROR: ${error.message}`, error: true }
            : { text: `Ran ${result.statementCount} statement${result.statementCount === 1 ? '' : 's'} in ${formatMs(ms)}` },
        )
      } catch (e) {
        setStatus({ text: e.message, error: true })
      } finally {
        runningRef.current = false
        setRunning(false)
      }
    },
    [addRun, refreshSchema, selectDb],
  )

  /**
   * mode 'all'       -> selection if any, otherwise the whole file   (F5, ▶ Run)
   * mode 'statement' -> selection if any, otherwise statement at cursor (Ctrl+Enter)
   * mode 'selection' -> only the selection                           (Enter with text selected)
   */
  const runFromEditor = useCallback(
    (mode) => {
      if (isViewTab(live.current.activeTab)) return
      const editor = editorRef.current
      const model = editor?.getModel()
      if (!model) return
      const selection = editor.getSelection()
      if (selection && !selection.isEmpty()) {
        execute(model.getValueInRange(selection), { model, base: model.getOffsetAt(selection.getStartPosition()) })
        return
      }
      if (mode === 'selection') return
      if (mode === 'statement') {
        const statements = splitStatements(model.getValue())
        const offset = model.getOffsetAt(editor.getPosition())
        const current =
          statements.find((s) => offset >= s.start && offset <= s.end + 1) ??
          statements.findLast((s) => s.start <= offset) ??
          statements[0]
        if (!current) {
          setStatus({ text: 'Nothing to run. Write a query first.' })
          return
        }
        flashRange(editor, model, current.start, current.start + current.text.length)
        execute(current.text, { model, base: current.start })
        return
      }
      execute(model.getValue(), { model, base: 0 })
    },
    [execute],
  )
  const runRef = useRef(runFromEditor)
  runRef.current = runFromEditor

  // ---------- tabs & files ----------

  const openTab = useCallback((id) => {
    setOpenTabs((tabs) => (tabs.includes(id) ? tabs : [...tabs, id]))
    setActiveTab(id)
  }, [])

  const closeTab = useCallback((id) => {
    const tabs = live.current.openTabs
    const i = tabs.indexOf(id)
    if (i < 0) return
    const next = tabs.filter((t) => t !== id)
    setOpenTabs(next)
    if (live.current.activeTab === id) setActiveTab(next[i] ?? next[i - 1] ?? null)
  }, [])

  // ER diagram of a whole database (table = null) or of one table and the tables connected to it
  const openEr = useCallback(
    (db, table = null) => {
      if (!live.current.schemas[db]) refreshSchema(db)
      openTab(erTabId(db, table))
    },
    [openTab, refreshSchema],
  )

  // Clicking a table inside a diagram shows that table's diagram in the same tab
  const focusEr = useCallback((fromId, db, table) => {
    const target = erTabId(db, table)
    if (target === fromId) return
    setOpenTabs((tabs) => (tabs.includes(target) ? tabs.filter((t) => t !== fromId) : tabs.map((t) => (t === fromId ? target : t))))
    setActiveTab(target)
  }, [])

  const newFile = useCallback(
    (content = '') => {
      const names = new Set(live.current.files.map((f) => f.name))
      let n = 1
      while (names.has(`query-${n}.sql`)) n++
      const file = { id: newId(), name: `query-${n}.sql`, content }
      setFiles((list) => [...list, file])
      openTab(file.id)
    },
    [openTab],
  )

  const renameFile = useCallback((id) => {
    const file = live.current.files.find((f) => f.id === id)
    if (!file) return
    let name = window.prompt('Rename file', file.name)?.trim()
    if (!name) return
    if (!name.toLowerCase().endsWith('.sql')) name += '.sql'
    setFiles((list) => list.map((f) => (f.id === id ? { ...f, name } : f)))
  }, [])

  const deleteFile = useCallback(
    (id) => {
      const file = live.current.files.find((f) => f.id === id)
      if (!file || !window.confirm(`Delete "${file.name}"? This cannot be undone.`)) return
      closeTab(id)
      setFiles((list) => list.filter((f) => f.id !== id))
      setTimeout(() => monaco.editor.getModel(monaco.Uri.parse(modelPath(id)))?.dispose(), 0)
    },
    [closeTab],
  )

  const updateFile = useCallback((id, content) => {
    setFiles((list) => list.map((f) => (f.id === id ? { ...f, content } : f)))
  }, [])

  // Notes -> "Open in editor": add the query to the end of the last query file and select it
  const openInEditor = useCallback(
    (sql) => {
      const { openTabs: tabs, files: fileList, lastSqlTab: last } = live.current
      const target = tabs.includes(last) ? last : tabs.find((t) => !isViewTab(t) && fileList.some((f) => f.id === t))
      if (!target) {
        newFile(sql)
        return
      }
      pendingInsertRef.current = sql
      setActiveTab(target)
    },
    [newFile],
  )

  useEffect(() => {
    const sql = pendingInsertRef.current
    const editor = editorRef.current
    const model = editor?.getModel()
    if (sql == null || !model || isViewTab(activeTab)) return
    pendingInsertRef.current = null
    const value = model.getValue()
    const prefix = !value.trim() ? '' : value.endsWith('\n') ? '\n' : '\n\n'
    const startOffset = value.length + prefix.length
    const end = model.getPositionAt(value.length)
    editor.executeEdits('notes', [{ range: new monaco.Range(end.lineNumber, end.column, end.lineNumber, end.column), text: `${prefix}${sql}\n`, forceMoveMarkers: true }])
    const s = model.getPositionAt(startOffset)
    const e = model.getPositionAt(startOffset + sql.length)
    editor.setSelection(new monaco.Range(s.lineNumber, s.column, e.lineNumber, e.column))
    editor.revealRangeInCenter(editor.getSelection())
    editor.focus()
    setStatus({ text: 'Query added and selected. Press Enter or F5 to run it.' })
  }, [activeTab])

  const insertAtCursor = useCallback((text) => {
    const editor = editorRef.current
    if (!editor?.getModel() || isViewTab(live.current.activeTab)) return
    editor.executeEdits('explorer', [{ range: editor.getSelection(), text, forceMoveMarkers: true }])
    editor.focus()
  }, [])

  // ---------- databases ----------

  const createDb = useCallback(async () => {
    const name = window.prompt('New database name (lowercase letters, numbers and _):', '')?.trim().toLowerCase()
    if (!name) return
    try {
      const list = await dbm.createDatabase(name)
      live.current.databases = list
      setDatabases(list)
      await refreshSchema(name)
      selectDb(name)
      notify(`Database "${name}" created and selected. It is empty. Try CREATE TABLE.`)
    } catch (e) {
      notify(e.message, 'error')
    }
  }, [notify, refreshSchema, selectDb])

  const resetDb = useCallback(
    async (name) => {
      const isDefault = dbm.isDefaultDatabase(name)
      const question = isDefault
        ? `Reset "${name}" to the original practice data?\nAll your changes in this database will be lost.`
        : `Remove all tables from "${name}"?`
      if (!window.confirm(question)) return
      setStatus({ text: `Resetting ${name}…`, busy: true })
      try {
        await dbm.resetDatabase(name)
        await refreshSchema(name)
        notify(isDefault ? `"${name}" is back to the original data.` : `All tables removed from "${name}".`)
        setStatus({ text: 'Ready' })
      } catch (e) {
        notify(e.message, 'error')
        setStatus({ text: e.message, error: true })
      }
    },
    [notify, refreshSchema],
  )

  const deleteDb = useCallback(
    async (name) => {
      if (live.current.databases.length === 1) {
        notify('You need at least one database.', 'error')
        return
      }
      if (!window.confirm(`Delete database "${name}" and all its data?`)) return
      try {
        if (live.current.activeDb === name) selectDb(live.current.databases.find((n) => n !== name))
        const list = await dbm.dropDatabase(name)
        live.current.databases = list
        setDatabases(list)
        setSchemas(({ [name]: _dropped, ...rest }) => rest)
        notify(`Database "${name}" deleted.`)
      } catch (e) {
        notify(e.message, 'error')
      }
    },
    [notify, selectDb],
  )

  const runTable = useCallback(
    (db, table) => {
      selectDb(db)
      execute(`SELECT * FROM ${quoteIdent(table)};`)
    },
    [execute, selectDb],
  )

  // ---------- editor & keyboard ----------

  const handleMount = useCallback((editor) => {
    editorRef.current = editor
    const { KeyMod, KeyCode } = monaco
    editor.addAction({
      id: 'sql.runStatement',
      label: 'SQL: Run Current Statement',
      keybindings: [KeyMod.CtrlCmd | KeyCode.Enter],
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 1,
      run: () => runRef.current('statement'),
    })
    editor.addAction({
      id: 'sql.run',
      label: 'SQL: Run Selection or Whole File',
      keybindings: [KeyCode.F5],
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 2,
      run: () => runRef.current('all'),
    })
    // Enter with text selected runs just that text
    editor.addCommand(
      KeyCode.Enter,
      () => runRef.current('selection'),
      'editorTextFocus && editorHasSelection && !editorHasMultipleSelections && !suggestWidgetVisible && !inSnippetMode',
    )
    editor.onDidChangeCursorSelection(() => {
      const model = editor.getModel()
      const pos = editor.getPosition()
      const sel = editor.getSelection()
      if (!model || !pos) return
      setCursor({ line: pos.lineNumber, column: pos.column, selected: sel ? model.getValueLengthInRange(sel) : 0 })
    })
    editor.onDidChangeModelContent(() => {
      const model = editor.getModel()
      if (model) monaco.editor.setModelMarkers(model, 'sql-run', [])
    })
    editor.focus()
  }, [])

  const formatEditor = useCallback(() => {
    editorRef.current?.getAction('editor.action.formatDocument')?.run()
  }, [])

  // App-wide shortcuts (the ones Monaco doesn't already handle)
  const shortcuts = useRef({})
  shortcuts.current = { newFile, closeTab }
  useEffect(() => {
    const onKey = (e) => {
      const ctrl = e.ctrlKey || e.metaKey
      const key = e.key.toLowerCase()
      if (e.key === 'F5') {
        e.preventDefault()
        runRef.current('all')
      } else if (ctrl && !e.shiftKey && key === 's') {
        e.preventDefault()
        setStatus({ text: 'Saved. Your files are also saved automatically as you type.' })
      } else if (ctrl && !e.shiftKey && key === 'b') {
        e.preventDefault()
        setSidebarOpen((open) => !open)
      } else if (ctrl && !e.shiftKey && key === 'j') {
        e.preventDefault()
        setOutputOpen((open) => !open)
      } else if (e.altKey && !ctrl && key === 'n') {
        e.preventDefault()
        shortcuts.current.newFile()
      } else if (e.altKey && !ctrl && key === 'w') {
        e.preventDefault()
        shortcuts.current.closeTab(live.current.activeTab)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ---------- render ----------

  const tabs = openTabs
    .map((id) => {
      if (isNoteTab(id)) {
        const note = NOTES.find((n) => noteTabId(n.id) === id)
        return note && { id, name: note.name, kind: 'note' }
      }
      if (isErTab(id)) {
        const { db, table } = parseErTab(id)
        return databases.includes(db) && { id, name: `ER: ${table ?? db}`, kind: 'er' }
      }
      const file = files.find((f) => f.id === id)
      return file && { id, name: file.name, kind: 'sql' }
    })
    .filter(Boolean)
  const sqlTabIds = tabs.filter((t) => t.kind === 'sql').map((t) => t.id)
  const editorFileId = isViewTab(activeTab) ? (sqlTabIds.includes(lastSqlTab) ? lastSqlTab : sqlTabIds[0]) : activeTab
  const editorFile = files.find((f) => f.id === editorFileId) ?? null
  const activeNote = isNoteTab(activeTab) ? NOTES.find((n) => noteTabId(n.id) === activeTab) : null
  const activeEr = isErTab(activeTab) && tabs.some((t) => t.id === activeTab) ? { id: activeTab, ...parseErTab(activeTab) } : null

  return (
    <div className="app">
      <div className="workbench">
        <ActivityBar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
          onOpenGuide={() => openTab(noteTabId('app-guide'))}
        />
        {sidebarOpen && (
          <>
            <div className="sidebar-wrap" style={{ width: leftWidth }}>
              <Explorer
                databases={databases}
                activeDb={activeDb}
                schemas={schemas}
                onSelectDb={selectDb}
                onRefresh={() => databases.forEach(refreshSchema)}
                onNewDb={createDb}
                onResetDb={resetDb}
                onDeleteDb={deleteDb}
                onRunTable={runTable}
                onOpenEr={openEr}
                onInsert={insertAtCursor}
                files={files}
                notes={NOTES}
                activeTab={activeTab}
                onOpenFile={openTab}
                onNewFile={newFile}
                onRenameFile={renameFile}
                onDeleteFile={deleteFile}
                onOpenNote={(id) => openTab(noteTabId(id))}
              />
            </div>
            <Splitter onDrag={(dx) => setLeftWidth((w) => clamp(w + dx, 180, 560))} />
          </>
        )}
        <EditorArea
          tabs={tabs}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onCloseTab={closeTab}
          onNewFile={newFile}
          onRenameFile={renameFile}
          editorFile={editorFile}
          onChange={updateFile}
          onMount={handleMount}
          note={activeNote}
          notes={NOTES}
          onRunSnippet={(sql) => execute(sql)}
          onOpenInEditor={openInEditor}
          onOpenNote={(id) => openTab(noteTabId(id))}
          er={activeEr && { ...activeEr, schema: schemas[activeEr.db] }}
          onFocusEr={(table) => focusEr(activeEr.id, activeEr.db, table)}
          onShowDatabaseEr={() => focusEr(activeEr.id, activeEr.db, null)}
          databases={databases}
          activeDb={activeDb}
          onSelectDb={selectDb}
          running={running}
          onRun={(mode) => runRef.current(mode)}
          onFormat={formatEditor}
          outputOpen={outputOpen}
          onToggleOutput={() => setOutputOpen((open) => !open)}
        />
        {outputOpen && (
          <>
            <Splitter onDrag={(dx) => setRightWidth((w) => clamp(w - dx, 260, Math.max(320, window.innerWidth - 560)))} />
            <div className="output-wrap" style={{ width: rightWidth }}>
              <OutputPane runs={runs} running={running} onClearHistory={() => setRuns([])} onClose={() => setOutputOpen(false)} />
            </div>
          </>
        )}
      </div>
      <StatusBar activeDb={activeDb} pgVersion={pgVersion} status={status} cursor={cursor} showCursor={Boolean(editorFile) && !activeNote && !activeEr} />
    </div>
  )
}
