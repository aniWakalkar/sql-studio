import { CARD_W, HEAD_H, ROW_H } from './erModel.js'
import './er.css'

function Card({ table, pos, focus, linked, onSelectTable }) {
  const clickable = Boolean(onSelectTable) && !focus
  return (
    <div className={`er-card ${focus ? 'focus' : ''}`} style={{ left: pos.x, top: pos.y, width: CARD_W }}>
      <div
        className={`er-card-head ${clickable ? 'clickable' : ''}`}
        style={{ height: HEAD_H }}
        onClick={clickable ? () => onSelectTable(table.name) : undefined}
        title={clickable ? `Show the diagram for ${table.name}` : undefined}
      >
        <i className="codicon codicon-table" />
        <span className="er-card-name">{table.name}</span>
        {table.rowCount != null && <span className="er-card-rows">{table.rowCount} rows</span>}
      </div>
      {table.columns.map((c) => (
        <div
          key={c.name}
          className={`er-row ${linked.has(`${table.name}.${c.name}`) ? 'linked' : ''}`}
          style={{ height: ROW_H }}
          title={`${c.name} ${c.type}${c.pk ? ' · PRIMARY KEY' : ''}${c.ref ? ` · FOREIGN KEY → ${c.ref}` : ''}`}
        >
          <i className={`codicon codicon-${c.pk ? 'key' : c.ref ? 'link' : 'symbol-field'} ${c.pk ? 'pk' : c.ref ? 'fk' : ''}`} />
          <span className="er-col">{c.name}</span>
          <span className="er-type">{c.type}</span>
        </div>
      ))}
    </div>
  )
}

export function CardsDiagram({ layout, onSelectTable, zoom = 1 }) {
  const linked = new Set(layout.lines.flatMap((l) => [`${l.edge.from}.${l.edge.fromCol}`, `${l.edge.to}.${l.edge.toCol}`]))
  return (
    <div className="er-canvas" style={{ width: layout.width, height: layout.height, zoom }}>
      <svg className="er-lines" width={layout.width} height={layout.height}>
        <defs>
          <marker id="er-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="#4daafc" />
          </marker>
        </defs>
        {layout.lines.map((l, i) => (
          <g key={i}>
            <title>{`${l.edge.from}.${l.edge.fromCol} → ${l.edge.to}.${l.edge.toCol}`}</title>
            <path d={l.d} className="er-line" markerEnd="url(#er-arrow)" />
            <circle cx={l.start.x} cy={l.start.y} r="3.5" className="er-dot" />
          </g>
        ))}
      </svg>
      {layout.tables.map((t) => (
        <Card
          key={t.name}
          table={t}
          pos={layout.positions.get(t.name)}
          focus={t.name === layout.focus}
          linked={linked}
          onSelectTable={onSelectTable}
        />
      ))}
    </div>
  )
}
