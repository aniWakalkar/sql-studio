import { useEffect, useRef, useState } from 'react'
import { focusedLayout, neighbourhood, relationsOf, wholeLayout } from '../er/erModel.js'
import { CardsDiagram } from '../er/ErViews.jsx'

const BODY_PADDING = 48
const MIN_ZOOM = 0.25
const MAX_ZOOM = 2
const ZOOM_STEP = 0.1
const clampZoom = (z) => Math.round(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z)) * 100) / 100

export default function ErTab({ db, table, schema, onFocusTable, onShowDatabase }) {
  const bodyRef = useRef(null)
  const [bodyWidth, setBodyWidth] = useState(0)
  const [zoomLevel, setZoomLevel] = useState(null) // null = fit to the panel
  const zoomRef = useRef(1)

  // Watch the panel width so "Fit" can shrink the diagram to fit it
  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setBodyWidth(entry.contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Ctrl + mouse wheel zooms the diagram (needs a non-passive listener to stop the page zooming)
  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    const onWheel = (e) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      setZoomLevel(clampZoom(zoomRef.current + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP)))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const tables = Array.isArray(schema) ? schema : null
  const exists = !table || tables?.some((t) => t.name === table)
  const ready = tables && exists && tables.length > 0
  const edges = tables ? relationsOf(tables) : []
  const layout = ready ? (table ? focusedLayout(tables, edges, table) : wholeLayout(tables, edges)) : null
  const fitZoom = layout && bodyWidth ? clampZoom(Math.min(1, (bodyWidth - BODY_PADDING) / layout.width)) : 1
  const zoom = zoomLevel ?? fitZoom
  zoomRef.current = zoom
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
          <span className="er-zoom">
            <button className="icon-btn" title="Zoom out (Ctrl + mouse wheel)" disabled={zoom <= MIN_ZOOM} onClick={() => setZoomLevel(clampZoom(zoom - ZOOM_STEP))}>
              <i className="codicon codicon-zoom-out" />
            </button>
            <button className="er-zoom-value" title="Reset to 100%" onClick={() => setZoomLevel(1)}>
              {Math.round(zoom * 100)}%
            </button>
            <button className="icon-btn" title="Zoom in (Ctrl + mouse wheel)" disabled={zoom >= MAX_ZOOM} onClick={() => setZoomLevel(clampZoom(zoom + ZOOM_STEP))}>
              <i className="codicon codicon-zoom-in" />
            </button>
            <button className={`tool-btn ${zoomLevel === null ? 'active' : ''}`} title="Shrink to fit the panel" onClick={() => setZoomLevel(null)}>
              <i className="codicon codicon-screen-normal" /> Fit
            </button>
          </span>
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
