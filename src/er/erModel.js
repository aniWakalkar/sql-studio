// Turns the schema from schema.js into foreign-key relationships and layouts.

/** [{ from, fromCol, to, toCol }]: from.fromCol is a FOREIGN KEY that points to to.toCol */
export function relationsOf(schema) {
  const byName = new Map(schema.map((t) => [t.name, t]))
  const edges = []
  for (const t of schema) {
    for (const c of t.columns) {
      const target = c.ref && byName.get(c.ref)
      if (!target) continue
      const pk = target.columns.find((x) => x.pk)?.name ?? target.columns[0]?.name
      edges.push({ from: t.name, fromCol: c.name, to: target.name, toCol: pk })
    }
  }
  return edges
}

/** Tables this one points to (parents), tables pointing to it (children), and self references */
export function neighbourhood(edges, name) {
  return {
    parents: edges.filter((e) => e.from === name && e.to !== name),
    children: edges.filter((e) => e.to === name && e.from !== name),
    self: edges.filter((e) => e.from === name && e.to === name),
  }
}

// ---- card geometry (must match .er-card in er.css) ----
export const CARD_W = 230
export const HEAD_H = 34
export const ROW_H = 24
const PAD_B = 6
const GAP_X = 130
const GAP_Y = 24
const MARGIN = 20

export const cardHeight = (t) => HEAD_H + t.columns.length * ROW_H + PAD_B
export const rowY = (pos, table, col) => pos.y + HEAD_H + Math.max(0, table.columns.findIndex((c) => c.name === col)) * ROW_H + ROW_H / 2

const columnHeight = (tables) => tables.reduce((s, t) => s + cardHeight(t), 0) + GAP_Y * Math.max(0, tables.length - 1)

function placeColumn(tables, x, totalH, positions) {
  let y = MARGIN + (totalH - columnHeight(tables)) / 2
  for (const t of tables) {
    positions.set(t.name, { x, y })
    y += cardHeight(t) + GAP_Y
  }
}

const unique = (names) => [...new Set(names)]

/** Selected table in the middle, tables that point to it on the left, tables it points to on the right */
export function focusedLayout(schema, edges, name) {
  const byName = new Map(schema.map((t) => [t.name, t]))
  const focus = byName.get(name)
  const { parents, children, self } = neighbourhood(edges, name)
  const left = unique(children.map((e) => e.from)).map((n) => byName.get(n))
  const right = unique(parents.map((e) => e.to)).map((n) => byName.get(n))

  const totalH = Math.max(columnHeight(left), cardHeight(focus), columnHeight(right))
  const xL = MARGIN
  const xC = left.length ? xL + CARD_W + GAP_X : MARGIN
  const xR = xC + CARD_W + GAP_X
  const positions = new Map()
  placeColumn(left, xL, totalH, positions)
  placeColumn([focus], xC, totalH, positions)
  placeColumn(right, xR, totalH, positions)

  const lines = [
    ...children.map((e) => link(byName, positions, e)),
    ...parents.map((e) => link(byName, positions, e)),
    ...self.map((e) => selfLoop(byName, positions, e)),
  ]
  const width = (right.length ? xR + CARD_W : xC + CARD_W + (self.length ? 60 : 0)) + MARGIN
  return { tables: [...left, focus, ...right], positions, lines, width, height: totalH + 2 * MARGIN, focus: name }
}

/** Every table, arranged left-to-right so that each table sits to the right of the tables it points to */
export function wholeLayout(schema, edges) {
  const byName = new Map(schema.map((t) => [t.name, t]))
  const depth = new Map()
  const depthOf = (name, seen = new Set()) => {
    if (depth.has(name)) return depth.get(name)
    if (seen.has(name)) return 0
    seen.add(name)
    const parents = edges.filter((e) => e.from === name && e.to !== name).map((e) => e.to)
    const d = parents.length ? 1 + Math.max(...parents.map((p) => depthOf(p, seen))) : 0
    depth.set(name, d)
    return d
  }
  schema.forEach((t) => depthOf(t.name))

  const columns = []
  for (const t of schema) (columns[depth.get(t.name)] ??= []).push(t)
  const totalH = Math.max(...columns.filter(Boolean).map(columnHeight))
  const positions = new Map()
  columns.forEach((tables, i) => tables && placeColumn(tables, MARGIN + i * (CARD_W + GAP_X), totalH, positions))

  const lines = edges.map((e) => (e.from === e.to ? selfLoop(byName, positions, e) : link(byName, positions, e)))
  return { tables: schema, positions, lines, width: MARGIN * 2 + columns.length * CARD_W + (columns.length - 1) * GAP_X + 40, height: totalH + 2 * MARGIN }
}

// A curved line from the FOREIGN KEY row to the PRIMARY KEY row it points to
function link(byName, positions, e) {
  const from = positions.get(e.from)
  const to = positions.get(e.to)
  const y1 = rowY(from, byName.get(e.from), e.fromCol)
  const y2 = rowY(to, byName.get(e.to), e.toCol)
  const fromIsLeft = from.x < to.x
  const x1 = fromIsLeft ? from.x + CARD_W : from.x
  const x2 = fromIsLeft ? to.x : to.x + CARD_W
  const bend = Math.max(40, Math.abs(x2 - x1) / 2) * (fromIsLeft ? 1 : -1)
  return {
    edge: e,
    d: `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`,
    start: { x: x1, y: y1 },
    end: { x: x2, y: y2 },
  }
}

function selfLoop(byName, positions, e) {
  const p = positions.get(e.from)
  const t = byName.get(e.from)
  const x = p.x + CARD_W
  const y1 = rowY(p, t, e.fromCol)
  const y2 = rowY(p, t, e.toCol)
  return { edge: e, d: `M ${x} ${y1} C ${x + 50} ${y1}, ${x + 50} ${y2}, ${x} ${y2}`, start: { x, y: y1 }, end: { x, y: y2 }, self: true }
}
