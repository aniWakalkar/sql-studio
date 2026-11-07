// Draggable bar between two panes. Calls onDrag(dx) with the mouse movement in pixels.
export default function Splitter({ onDrag }) {
  const onPointerDown = (e) => {
    e.preventDefault()
    const handle = e.currentTarget
    handle.setPointerCapture(e.pointerId)
    let lastX = e.clientX
    const move = (ev) => {
      onDrag(ev.clientX - lastX)
      lastX = ev.clientX
    }
    const up = () => {
      handle.removeEventListener('pointermove', move)
      handle.removeEventListener('pointerup', up)
      document.body.classList.remove('resizing')
    }
    handle.addEventListener('pointermove', move)
    handle.addEventListener('pointerup', up)
    document.body.classList.add('resizing')
  }

  return <div className="splitter" onPointerDown={onPointerDown} role="separator" aria-orientation="vertical" />
}
