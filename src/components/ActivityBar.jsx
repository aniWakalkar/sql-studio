export default function ActivityBar({ sidebarOpen, onToggleSidebar, onOpenGuide }) {
  return (
    <nav className="activitybar">
      <button
        className={`activity ${sidebarOpen ? 'active' : ''}`}
        title="Explorer (Ctrl+B)"
        onClick={onToggleSidebar}
      >
        <i className="codicon codicon-files" />
      </button>
      <button className="activity" title="App guide & keyboard shortcuts" onClick={onOpenGuide}>
        <i className="codicon codicon-book" />
      </button>
    </nav>
  )
}
