import Editor from '@monaco-editor/react'
import NoteView from './NoteView.jsx'
import { modelPath } from '../util.js'

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
  tabs, activeTab, onSelectTab, onCloseTab, onNewFile, onRenameFile,
  editorFile, onChange, onMount,
  note, notes, onRunSnippet, onOpenInEditor, onOpenNote,
  databases, activeDb, onSelectDb, running, onRun, onFormat,
}) {
  const noteActive = Boolean(note)

  return (
    <main className="editor-area">
      <div className="tabbar">
        <div
          className="tabs"
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
              <i className={`codicon codicon-${t.kind === 'note' ? 'markdown icon-md' : 'database icon-sqlfile'}`} />
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
      </div>

      {!noteActive && editorFile && (
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
          <button className="tool-btn" title="Run the statement under the cursor (Ctrl+Enter)" disabled={running} onClick={() => onRun('statement')}>
            <i className="codicon codicon-debug-line-by-line" /> Statement
          </button>
          <button className="run-btn" title="Run the selection, or the whole file if nothing is selected (F5)" disabled={running} onClick={() => onRun('all')}>
            <i className={`codicon ${running ? 'codicon-loading codicon-modifier-spin' : 'codicon-play'}`} /> Run
          </button>
        </div>
      )}

      <div className="editor-host" hidden={noteActive || !editorFile}>
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

      {!noteActive && !editorFile && (
        <div className="empty-editor">
          <i className="codicon codicon-database" />
          <p>No query file is open.</p>
          <button className="run-btn" onClick={() => onNewFile()}>
            <i className="codicon codicon-new-file" /> New query file
          </button>
          <p className="dim">or open one from the Explorer on the left</p>
        </div>
      )}

      {noteActive && (
        <NoteView note={note} notes={notes} onRun={onRunSnippet} onOpenInEditor={onOpenInEditor} onOpenNote={onOpenNote} />
      )}
    </main>
  )
}
