import { useEffect, useRef } from 'react'
import Editor from '@monaco-editor/react'
import NoteView from './NoteView.jsx'
import ErTab from './ErTab.jsx'
import { modelPath } from '../util.js'

const TAB_ICONS = { sql: 'database icon-sqlfile', note: 'markdown icon-md', er: 'type-hierarchy icon-er' }

const EDITOR_OPTIONS = {
  fontSize: 14,
  fontFamily: "Consolas, 'Cascadia Code', 'Courier New', monospace",
  minimap: { enabled: true },
  automaticLayout: true,
  scrollBeyondLastLine: false,
  wordBasedSuggestions: 'off',
  tabSize: 4,
  renderWhitespace: 'selection',
  fixedOverflowWidgets: true,
  padding: { top: 8 },
  smoothScrolling: true,
  cursorBlinking: 'smooth',
  bracketPairColorization: { enabled: true },
  suggest: { showStatusBar: true },
}

export default function EditorArea({
  tabs, activeTab, onSelectTab, onCloseTab, onCloseAllTabs, onNewFile, onRenameFile,
  editorFile, onChange, onMount,
  note, notes, onRunSnippet, onOpenInEditor, onOpenNote,
  er, onFocusEr, onShowDatabaseEr,
  databases, activeDb, onSelectDb, running, onRun, onFormat,
  outputOpen, onToggleOutput,
}) {
  // a note or an ER diagram is showing instead of the SQL editor
  const viewActive = Boolean(note || er)

  // Keep the active tab visible when there are more tabs than fit
  const tabsRef = useRef(null)
  useEffect(() => {
    tabsRef.current?.querySelector('.tab.active')?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [activeTab, tabs.length])

  return (
    <main className="editor-area">
      <div className="tabbar">
        <div
          className="tabs"
          ref={tabsRef}
          onWheel={(e) => {
            // no visible scrollbar: the mouse wheel scrolls the tabs sideways
            e.currentTarget.scrollLeft += e.deltaY
          }}
        >
          {tabs.map((t) => (
            <div
              key={t.id}
              className={`tab ${t.id === activeTab ? 'active' : ''}`}
              onClick={() => onSelectTab(t.id)}
              onMouseDown={(e) => {
                if (e.button === 1) {
                  e.preventDefault()
                  onCloseTab(t.id)
                }
              }}
              onDoubleClick={() => t.kind === 'sql' && onRenameFile(t.id)}
              title={t.kind === 'sql' ? `${t.name} — double-click to rename` : t.name}
            >
              <i className={`codicon codicon-${TAB_ICONS[t.kind]}`} />
              <span className="tab-name">{t.name}</span>
              <button
                className="tab-close"
                title="Close (Alt+W)"
                onClick={(e) => {
                  e.stopPropagation()
                  onCloseTab(t.id)
                }}
              >
                <i className="codicon codicon-close" />
              </button>
            </div>
          ))}
        </div>
        <button className="icon-btn tab-add" title="New query file (Alt+N)" onClick={() => onNewFile()}>
          <i className="codicon codicon-add" />
        </button>
        <span className="spacer" />
        {tabs.length > 0 && (
          <button className="icon-btn tab-close-all" title="Close all tabs (your files are kept)" onClick={onCloseAllTabs}>
            <i className="codicon codicon-close-all" />
          </button>
        )}
        {/* Only when the Output panel is closed; while it is open, its own ✕ closes it */}
        {!outputOpen && (
          <button className="icon-btn tab-panel-toggle" title="Show the Output panel (Ctrl+J)" onClick={onToggleOutput}>
            <i className="codicon codicon-layout-sidebar-right-off" />
          </button>
        )}
      </div>

      {!viewActive && editorFile && (
        <div className="toolbar">
          <span className="breadcrumb">
            <i className="codicon codicon-database" />
            {activeDb}
            <i className="codicon codicon-chevron-right" />
            {editorFile.name}
          </span>
          <span className="spacer" />
          <label className="db-select" title="Database your queries run on (or write: USE name;)">
            <i className="codicon codicon-database" />
            <select value={activeDb} onChange={(e) => onSelectDb(e.target.value)}>
              {databases.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </label>
          <button className="tool-btn" title="Format SQL (Shift+Alt+F)" onClick={onFormat}>
            <i className="codicon codicon-list-flat" /> Format
          </button>
          <button className="run-btn" title="Run the selection, or the whole file if nothing is selected (F5)" disabled={running} onClick={() => onRun('all')}>
            <i className={`codicon ${running ? 'codicon-loading codicon-modifier-spin' : 'codicon-play'}`} /> Run
          </button>
        </div>
      )}

      <div className="editor-host" hidden={viewActive || !editorFile}>
        {editorFile && (
          <Editor
            theme="vs-dark"
            language="sql"
            path={modelPath(editorFile.id)}
            defaultValue={editorFile.content}
            onChange={(value) => onChange(editorFile.id, value ?? '')}
            onMount={onMount}
            options={EDITOR_OPTIONS}
            loading={<div className="editor-loading">Loading editor…</div>}
          />
        )}
      </div>

      {!viewActive && !editorFile && (
        <div className="empty-editor">
          <i className="codicon codicon-database" />
          <p>No query file is open.</p>
          <button className="run-btn" onClick={() => onNewFile()}>
            <i className="codicon codicon-new-file" /> New query file
          </button>
          <p className="dim">or open one from the Explorer on the left</p>
        </div>
      )}

      {note && (
        <NoteView note={note} notes={notes} onRun={onRunSnippet} onOpenInEditor={onOpenInEditor} onOpenNote={onOpenNote} />
      )}

      {er && (
        <ErTab db={er.db} table={er.table} schema={er.schema} onFocusTable={onFocusEr} onShowDatabase={onShowDatabaseEr} />
      )}
    </main>
  )
}
