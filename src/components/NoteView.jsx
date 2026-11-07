import { useEffect, useState } from 'react'
import * as monaco from 'monaco-editor'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { NOTE_IMAGES } from '../defaults.js'

const hastText = (node) => (!node ? '' : node.type === 'text' ? node.value : (node.children ?? []).map(hastText).join(''))

function CodeBlock({ node, children, onRun, onOpenInEditor }) {
  const code = node?.children?.[0]
  const lang = (code?.properties?.className ?? []).map(String).find((c) => c.startsWith('language-'))?.slice(9) ?? ''
  const text = hastText(code).replace(/\n$/, '')
  const isSql = lang === 'sql'
  const [html, setHtml] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!isSql) return
    let alive = true
    monaco.editor.colorize(text, 'sql', { tabSize: 4 }).then((h) => alive && setHtml(h))
    return () => {
      alive = false
    }
  }, [text, isSql])

  const copy = () => {
    navigator.clipboard?.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  return (
    <div className="code-block">
      <div className="code-actions">
        {isSql && (
          <>
            <button title="Run this query (results appear on the right)" onClick={() => onRun(text)}>
              <i className="codicon codicon-play" /> Run
            </button>
            <button title="Add this query to your query file" onClick={() => onOpenInEditor(text)}>
              <i className="codicon codicon-go-to-file" /> Open in editor
            </button>
          </>
        )}
        <button title="Copy" onClick={copy}>
          <i className={`codicon codicon-${copied ? 'check' : 'copy'}`} /> {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      {html ? <pre className="code" dangerouslySetInnerHTML={{ __html: html }} /> : <pre className="code">{children}</pre>}
    </div>
  )
}

export default function NoteView({ note, notes, onRun, onOpenInEditor, onOpenNote }) {
  const components = {
    pre: (props) => <CodeBlock {...props} onRun={onRun} onOpenInEditor={onOpenInEditor} />,
    img: ({ src = '', alt }) => <img src={NOTE_IMAGES[src.replace(/^\.\//, '')] ?? src} alt={alt} />,
    a: ({ href = '', children }) => {
      if (/^https?:/.test(href)) return <a href={href} target="_blank" rel="noreferrer">{children}</a>
      const target = notes.find((n) => href.toLowerCase().endsWith(n.name.toLowerCase()))
      return (
        <a
          href={href}
          onClick={(e) => {
            e.preventDefault()
            if (target) onOpenNote(target.id)
          }}
        >
          {children}
        </a>
      )
    },
  }

  return (
    <div className="note-view">
      <article className="markdown-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={components}>
          {note.content}
        </ReactMarkdown>
      </article>
    </div>
  )
}
