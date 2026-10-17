import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MoreVertical } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface ActionItem {
  label: string
  icon: LucideIcon
  onClick: () => void
  danger?: boolean
}
export function ActionMenu({ items }: { items: ActionItem[] }) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const ref = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  function toggle() {
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + 235 > window.innerHeight ? Math.max(8, rect.top - 16 - Math.min(items.length * 42 + 14, 210)) : rect.bottom + 7,
        left: Math.max(10, Math.min(window.innerWidth - 235, rect.right - 223)),
      })
    }
    setOpen(current => !current)
  }
  useEffect(() => {
    if (!open) return
    const onOutside = (event: PointerEvent) => {
      const target = event.target as Node
      if (!ref.current?.contains(target) && !popupRef.current?.contains(target)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    const onScroll = () => setOpen(false)
    document.addEventListener('pointerdown', onOutside)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('pointerdown', onOutside)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open])
  return <div className="action-menu" ref={ref}>
    <button type="button" className="icon-button" aria-label="Open actions" aria-expanded={open} onClick={toggle}><MoreVertical size={18}/></button>
    {open && createPortal(<div className="action-popover floating-popover" style={{ top: position.top, left: position.left }} ref={popupRef} role="menu">
      {items.length ? items.map(item => <button type="button" key={item.label} className={`menu-option ${item.danger ? 'menu-danger' : ''}`} onClick={() => { setOpen(false); item.onClick() }} role="menuitem"><item.icon size={16}/>{item.label}</button>) : <span className="menu-empty">No actions available</span>}
    </div>, document.body)}
  </div>
}
