import { useEffect, useState } from 'react'
import { formatMs } from '../util.js'

const MAX_ROWS = 1000

const cellText = (v) => {
  if (v === null || v === undefined) return null
  if (v instanceof Date) return v.toISOString()
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

function ResultTable({ columns, rows }) {
  const [copied, setCopied] = useState(false)
  const shown = rows.slice(0, MAX_ROWS)

  const copy = () => {
    const lines = [columns.map((c) => c.name), ...rows.map((r) => r.map((v) => cellText(v) ?? 'NULL'))]
    navigator.clipboard?.writeText(lines.map((l) => l.join('\t')).join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  return (
    <div className="result">
      <div className="result-bar">
        <span>
          {rows.length} {rows.length === 1 ? 'row' : 'rows'}
          {rows.length > MAX_ROWS && ` (showing first ${MAX_ROWS})`}
        </span>
        <button className="link-btn" title="Copy rows (paste into Excel / Sheets)" onClick={copy}>
          <i className={`codicon codicon-${copied ? 'check' : 'copy'}`} /> {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th className="rownum">#</th>
              {columns.map((c, i) => (
                <th key={i} className={c.numeric ? 'num' : ''}>{c.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((row, i) => (
              <tr key={i}>
                <td className="rownum">{i + 1}</td>
                {row.map((v, j) => {
                  const text = cellText(v)
                  return text === null ? (
                    <td key={j} className="null">NULL</td>
                  ) : (
                    <td key={j} className={columns[j]?.numeric ? 'num' : ''} title={text.length > 40 ? text : undefined}>
                      {text}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <div className="no-rows">No rows returned</div>}
      </div>
    </div>
  )
}

function Block({ block }) {
  const [showSql, setShowSql] = useState(false)
  const sqlLines = block.sql?.split('\n') ?? []
  const longSql = sqlLines.length > 3

  return (
    <div className={`block block-${block.kind}`}>
      {block.sql && (
        <pre className="block-sql" onClick={() => longSql && setShowSql(!showSql)} title={longSql ? 'Click to show the full query' : undefined}>
          {longSql && !showSql ? `${sqlLines.slice(0, 3).join('\n')}\n…` : block.sql}
        </pre>
      )}
      {block.note && (
        <div className="block-note">
          <i className="codicon codicon-info" />
          <span>{block.note}</span>
        </div>
      )}
      {block.kind === 'rows' && <ResultTable columns={block.columns} rows={block.rows} />}
      {block.kind === 'message' && (
        <div className="block-message">
          <i className="codicon codicon-check" /> {block.message}
        </div>
      )}
      {block.kind === 'error' && (
        <div className="block-error">
          <div>
            <i className="codicon codicon-error" /> <b>ERROR:</b> {block.message}
          </div>
          {block.detail && <div className="error-extra">DETAIL: {block.detail}</div>}
          {block.hint && <div className="error-extra">HINT: {block.hint}</div>}
          {block.skipped > 0 && (
            <div className="error-extra dim">
              Stopped here. {block.skipped} statement{block.skipped === 1 ? '' : 's'} after this one did not run.
            </div>
          )}
        </div>
      )}
      {block.ms != null && block.sql && <div className="block-meta">{formatMs(block.ms)}</div>}
    </div>
  )
}

function RunView({ run, latest }) {
  const [open, setOpen] = useState(latest)
  // When a newer run arrives, fold this one away (click its header to open it again)
  useEffect(() => {
    if (!latest) setOpen(false)
  }, [latest])
  const failed = run.blocks.some((b) => b.kind === 'error')
  return (
    <div className={`run ${open ? 'open' : ''}`}>
      <div className="run-header" onClick={() => setOpen(!open)}>
        <i className={`codicon codicon-chevron-${open ? 'down' : 'right'}`} />
        <i className={`codicon codicon-${failed ? 'error run-failed' : 'pass run-ok'}`} />
        <span>{run.at.toLocaleTimeString()}</span>
        <span className="dim">· {run.db}</span>
        {run.statementCount > 0 && (
          <span className="dim">
            · {run.statementCount} statement{run.statementCount === 1 ? '' : 's'} · {formatMs(run.ms)}
          </span>
        )}
      </div>
      {open && (
        <div className="run-body">
          {run.blocks.map((b, i) => (
            <Block key={i} block={b} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function OutputPane({ runs, running, onClear }) {
  return (
    <section className="output">
      <div className="panel-header">
        <span className="panel-title">OUTPUT</span>
        {running && <i className="codicon codicon-loading codicon-modifier-spin" />}
        <span className="spacer" />
        <button className="icon-btn" title="Clear output" onClick={onClear} disabled={!runs.length}>
          <i className="codicon codicon-clear-all" />
        </button>
      </div>
      <div className="output-body">
        {!runs.length && (
          <div className="output-empty">
            <i className="codicon codicon-output" />
            <p>Results will appear here.</p>
            <ul>
              <li><kbd>F5</kbd> or <b>▶ Run</b>: run the selection, or the whole file</li>
              <li><kbd>Ctrl</kbd>+<kbd>Enter</kbd>: run the statement under the cursor</li>
              <li>Select a query, then press <kbd>Enter</kbd> to run just that</li>
            </ul>
          </div>
        )}
        {runs.map((run, i) => (
          <RunView key={run.id} run={run} latest={i === 0} />
        ))}
      </div>
    </section>
  )
}
