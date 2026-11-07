/**
 * Split a SQL script into statements and remember where each one starts,
 * so errors can be underlined at the right place in the editor.
 *
 * Understands 'strings', "identifiers", -- and /* comments, $$dollar quotes$$
 * and psql meta-commands such as \dt (which end at the end of the line).
 *
 * Returns [{ text, start, end }] where start is the offset of the first
 * character of code and end is the offset of the terminating ';'.
 */
export function splitStatements(src) {
  const statements = []
  const n = src.length
  let codeStart = -1
  let i = 0

  const finish = (end) => {
    if (codeStart >= 0) statements.push({ text: src.slice(codeStart, end).trimEnd(), start: codeStart, end })
    codeStart = -1
  }

  while (i < n) {
    const c = src[i]
    const next = src[i + 1]

    if (c === '-' && next === '-') {
      const j = src.indexOf('\n', i)
      i = j < 0 ? n : j
      continue
    }
    if (c === '/' && next === '*') {
      const j = src.indexOf('*/', i + 2)
      i = j < 0 ? n : j + 2
      continue
    }
    if (c === ';') {
      finish(i)
      i++
      continue
    }
    if (/\s/.test(c)) {
      i++
      continue
    }
    if (c === '\\' && codeStart < 0) {
      const j = src.indexOf('\n', i)
      const end = j < 0 ? n : j
      codeStart = i
      finish(end)
      i = end
      continue
    }

    if (codeStart < 0) codeStart = i

    if (c === "'" || c === '"') {
      i = skipQuoted(src, i, c)
      continue
    }
    if (c === '$') {
      const tag = /^\$(?:[A-Za-z_]\w*)?\$/.exec(src.slice(i, i + 64))?.[0]
      if (tag) {
        const j = src.indexOf(tag, i + tag.length)
        i = j < 0 ? n : j + tag.length
        continue
      }
    }
    i++
  }
  finish(n)
  return statements
}

function skipQuoted(src, i, quote) {
  let j = i + 1
  while (j < src.length) {
    if (src[j] === quote) {
      if (src[j + 1] === quote) {
        j += 2
        continue
      }
      return j + 1
    }
    j++
  }
  return src.length
}
