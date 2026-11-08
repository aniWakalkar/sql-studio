import { useState } from 'react'

function Section({ title, actions = [], children }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="section">
      <div className="section-header" onClick={() => setOpen(!open)}>
        <i className={`codicon codicon-chevron-${open ? 'down' : 'right'}`} />
        <span className="section-title">{title}</span>
        <span className="row-actions">
          {actions.map((a) => (
            <button
              key={a.icon}
              className="icon-btn"
              title={a.title}
              onClick={(e) => {
                e.stopPropagation()
                a.onClick()
              }}
            >
              <i className={`codicon codicon-${a.icon}`} />
            </button>
          ))}
        </span>
      </div>
      {open && <div className="section-body">{children}</div>}
    </div>
  )
}

function RowButton({ icon, title, onClick }) {
  return (
    <button
      className="icon-btn"
      title={title}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    >
      <i className={`codicon codicon-${icon}`} />
    </button>
  )
}

function TableNode({ db, table, expanded, onToggle, onRunTable, onOpenEr, onInsert }) {
  const key = `table:${db}.${table.name}`
  const open = expanded.has(key)
  return (
    <>
      <div
        className="tree-row"
        style={{ paddingLeft: 26 }}
        onClick={() => onToggle(key)}
        onDoubleClick={() => onInsert(table.name)}
        title={`${table.name} — click to see columns, double-click to insert the name`}
      >
        <i className={`codicon codicon-chevron-${open ? 'down' : 'right'}`} />
        <i className={`codicon codicon-${table.isView ? 'eye' : 'table'} icon-table`} />
        <span className="label">{table.name}</span>
        {table.rowCount != null && <span className="dim">{table.rowCount} rows</span>}
        <span className="row-actions">
          <RowButton icon="type-hierarchy" title={`ER diagram: ${table.name} and its connected tables`} onClick={() => onOpenEr(db, table.name)} />
          <RowButton icon="play" title={`Run SELECT * FROM ${table.name}`} onClick={() => onRunTable(db, table.name)} />
        </span>
      </div>
      {open &&
        table.columns.map((c) => (
          <div
            key={c.name}
            className="tree-row column-row"
            style={{ paddingLeft: 58 }}
            onDoubleClick={() => onInsert(c.name)}
            title={`${c.name} ${c.type}${c.pk ? ' · PRIMARY KEY' : ''}${c.ref ? ` · FOREIGN KEY → ${c.ref}` : ''}${c.notNull ? ' · NOT NULL' : ''}\nDouble-click to insert`}
          >
            <i
              className={`codicon codicon-${c.pk ? 'key' : c.ref ? 'link' : 'symbol-field'} ${c.pk ? 'icon-pk' : c.ref ? 'icon-fk' : 'icon-col'}`}
            />
            <span className="label">{c.name}</span>
            <span className="dim">
              {c.type}
              {c.ref && ` → ${c.ref}`}
            </span>
          </div>
        ))}
    </>
  )
}

function DatabaseNode({ name, active, schema, expanded, onToggle, onSelectDb, onResetDb, onDeleteDb, onRunTable, onOpenEr, onInsert }) {
  const key = `db:${name}`
  const open = expanded.has(key)
  const tables = Array.isArray(schema) ? schema : null
  return (
    <>
      <div
        className={`tree-row db-row ${active ? 'active' : ''}`}
        style={{ paddingLeft: 8 }}
        onClick={() => {
          onSelectDb(name)
          onToggle(key)
        }}
        title={`${name}${active ? ' (active — queries run here)' : ' — click to use this database'}`}
      >
        <i className={`codicon codicon-chevron-${open ? 'down' : 'right'}`} />
        <i className="codicon codicon-database icon-db" />
        <span className="label">{name}</span>
        {tables && <span className="badge">{tables.length} {tables.length === 1 ? 'table' : 'tables'}</span>}
        {active && <i className="codicon codicon-check active-check" title="Active database" />}
        <span className="row-actions">
          <RowButton icon="type-hierarchy" title="ER diagram of all tables" onClick={() => onOpenEr(name)} />
          <RowButton icon="discard" title="Reset database" onClick={() => onResetDb(name)} />
          <RowButton icon="trash" title="Delete database" onClick={() => onDeleteDb(name)} />
        </span>
      </div>
      {open && (
        <>
          {schema?.error && <div className="tree-row tree-note error" style={{ paddingLeft: 30 }}>{schema.error}</div>}
          {!schema && (
            <div className="tree-row tree-note" style={{ paddingLeft: 30 }}>
              <i className="codicon codicon-loading codicon-modifier-spin" /> Loading…
            </div>
          )}
          {tables?.length === 0 && (
            <div className="tree-row tree-note" style={{ paddingLeft: 30 }}>No tables yet. Try CREATE TABLE.</div>
          )}
          {tables?.map((t) => (
            <TableNode key={t.name} db={name} table={t} expanded={expanded} onToggle={onToggle} onRunTable={onRunTable} onOpenEr={onOpenEr} onInsert={onInsert} />
          ))}
        </>
      )}
    </>
  )
}

export default function Explorer({
  databases, activeDb, schemas, onSelectDb, onRefresh, onNewDb, onResetDb, onDeleteDb, onRunTable, onOpenEr, onInsert,
  files, notes, activeTab, onOpenFile, onNewFile, onRenameFile, onDeleteFile, onOpenNote,
}) {
  // everything starts collapsed; databases and tables open only when clicked
  const [expanded, setExpanded] = useState(() => new Set())
  const toggle = (key) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  return (
    <aside className="sidebar">
      <div className="sidebar-title">EXPLORER</div>
      <div className="sidebar-scroll">
        <Section
          title="Databases"
          actions={[
            { icon: 'add', title: 'New database', onClick: onNewDb },
            { icon: 'refresh', title: 'Refresh', onClick: onRefresh },
          ]}
        >
          {databases.map((name) => (
            <DatabaseNode
              key={name}
              name={name}
              active={name === activeDb}
              schema={schemas[name]}
              expanded={expanded}
              onToggle={toggle}
              onSelectDb={onSelectDb}
              onResetDb={onResetDb}
              onDeleteDb={onDeleteDb}
              onRunTable={onRunTable}
              onOpenEr={onOpenEr}
              onInsert={onInsert}
            />
          ))}
        </Section>

        <Section title="Query Files" actions={[{ icon: 'new-file', title: 'New query file (Alt+N)', onClick: () => onNewFile() }]}>
          {files.map((f) => (
            <div
              key={f.id}
              className={`tree-row ${f.id === activeTab ? 'selected' : ''}`}
              style={{ paddingLeft: 22 }}
              onClick={() => onOpenFile(f.id)}
              onDoubleClick={() => onRenameFile(f.id)}
              title={`${f.name} — double-click to rename`}
            >
              <i className="codicon codicon-database icon-sqlfile" />
              <span className="label">{f.name}</span>
              <span className="row-actions">
                <RowButton icon="edit" title="Rename" onClick={() => onRenameFile(f.id)} />
                <RowButton icon="trash" title="Delete file" onClick={() => onDeleteFile(f.id)} />
              </span>
            </div>
          ))}
          {!files.length && <div className="tree-row tree-note" style={{ paddingLeft: 22 }}>No files. Click + to create one.</div>}
        </Section>

        <Section title="Notes">
          {notes.map((n) => (
            <div
              key={n.id}
              className={`tree-row ${`note:${n.id}` === activeTab ? 'selected' : ''}`}
              style={{ paddingLeft: 22 }}
              onClick={() => onOpenNote(n.id)}
            >
              <i className="codicon codicon-markdown icon-md" />
              <span className="label">{n.name}</span>
            </div>
          ))}
        </Section>
      </div>
    </aside>
  )
}
