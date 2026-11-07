import { useEffect, useRef, useState } from 'react'
import { focusedLayout, neighbourhood, relationsOf, wholeLayout } from '../er/erModel.js'
import { CardsDiagram } from '../er/ErViews.jsx'

const BODY_PADDING = 48

export default function ErTab({ db, table, schema, onFocusTable, onShowDatabase }) {
  const bodyRef = useRef(null)
  const [bodyWidth, setBodyWidth] = useState(0)
  const [fit, setFit] = useState(true)

  // Watch the panel width so "Fit" can shrink the diagram to fit it
  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setBodyWidth(entry.contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const tables = Array.isArray(schema) ? schema : null
  const exists = !table || tables?.some((t) => t.name === table)
  const ready = tables && exists && tables.length > 0
  const edges = tables ? relationsOf(tables) : []
  const layout = ready ? (table ? focusedLayout(tables, edges, table) : wholeLayout(tables, edges)) : null
  const zoom = layout && fit && bodyWidth ? Math.min(1, Math.max(0.35, (bodyWidth - BODY_PADDING) / layout.width)) : 1
  const n = table && ready ? neighbourhood(edges, table) : null
  const connected = n ? new Set([...n.parents.map((e) => e.to), ...n.children.map((e) => e.from)]).size : 0

  return (
    <div className="er-tab">
      <div className="toolbar">
        <span className="breadcrumb">
          <i className="codicon codicon-type-hierarchy" />
          <i className="codicon codicon-database" />
          {db}
          {table && (
            <>
              <i className="codicon codicon-chevron-right" />
              <i className="codicon codicon-table" />
              {table}
            </>
          )}
        </span>
        <span className="spacer" />
        {layout && (
          <button className="tool-btn" title={fit ? 'Show at full size (scroll to see everything)' : 'Shrink to fit the panel'} onClick={() => setFit(!fit)}>
            <i className={`codicon codicon-${fit ? 'zoom-in' : 'screen-normal'}`} /> {fit ? '100%' : 'Fit'}
          </button>
        )}
        {table && (
          <button className="tool-btn" title="Show every table in this database" onClick={onShowDatabase}>
            <i className="codicon codicon-database" /> All tables
          </button>
        )}
      </div>
      <div className="er-tab-body" ref={bodyRef}>
        {schema?.error && <p className="er-message error">{schema.error}</p>}
        {!schema && <p className="er-message"><i className="codicon codicon-loading codicon-modifier-spin" /> Loading…</p>}
        {tables && !exists && <p className="er-message">Table “{table}” does not exist any more.</p>}
        {tables && tables.length === 0 && <p className="er-message">This database has no tables yet. Try CREATE TABLE.</p>}
        {layout && (
          <>
            <p className="er-message dim">
              {table
                ? connected
                  ? `${table} is connected to ${connected} table${connected === 1 ? '' : 's'}. Click a table name to see its diagram.`
                  : `${table} has no foreign keys and no table points to it.`
                : `${tables.length} tables. Click a table name to see just that table and its connections.`}
            </p>
            <p className="er-legend">
              <i className="codicon codicon-key pk" /> primary key
              <i className="codicon codicon-link fk" /> foreign key
              <span className="er-legend-arrow">●──▶</span> foreign key points to the primary key
            </p>
            <CardsDiagram layout={layout} onSelectTable={onFocusTable} zoom={zoom} />
          </>
        )}
      </div>
    </div>
  )
}
