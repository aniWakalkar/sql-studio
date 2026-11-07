export default function StatusBar({ activeDb, pgVersion, status, cursor, showCursor }) {
  return (
    <footer className="statusbar">
      <span className="status-item status-db" title="Active database">
        <i className="codicon codicon-database" />
        {activeDb}
      </span>
      <span className="status-item">{pgVersion || 'PostgreSQL'}</span>
      <span className={`status-item status-message ${status.error ? 'error' : ''}`} title={status.text}>
        {status.busy && <i className="codicon codicon-loading codicon-modifier-spin" />}
        {status.error && <i className="codicon codicon-error" />}
        {status.text}
      </span>
      <span className="spacer" />
      {showCursor && (
        <span className="status-item">
          Ln {cursor.line}, Col {cursor.column}
          {cursor.selected > 0 && ` (${cursor.selected} selected)`}
        </span>
      )}
      <span className="status-item">SQL</span>
      <span className="status-item" title="Keyboard shortcuts are listed in APP-GUIDE.md">
        <i className="codicon codicon-keyboard" />
        F5 Run · Ctrl+Enter Statement
      </span>
    </footer>
  )
}
