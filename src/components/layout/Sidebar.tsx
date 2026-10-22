import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { Activity, ChartNoAxesCombined, CircleHelp, Settings, UsersRound, Wifi } from 'lucide-react'
import { X } from 'lucide-react'
const items = [
  { path: '/dashboard', label: 'Dashboard', icon: ChartNoAxesCombined },
  { path: '/users', label: 'Users', icon: UsersRound },
  { path: '/sessions', label: 'Sessions', icon: Wifi },
  { path: '/monitoring', label: 'Monitoring', icon: Activity },
  { path: '/settings', label: 'Settings', icon: Settings },
  { path: '/about', label: 'About', icon: CircleHelp },
]
export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const drawerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!open) return
    const previousFocus = document.activeElement as HTMLElement | null
    const drawer = drawerRef.current
    const controls = () => Array.from(drawer?.querySelectorAll<HTMLElement>('button, a[href]') ?? [])
    controls()[0]?.focus()
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const elements = controls()
      const first = elements[0]
      const last = elements[elements.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    document.addEventListener('keydown', trapFocus)
    return () => {
      document.removeEventListener('keydown', trapFocus)
      previousFocus?.focus()
    }
  }, [open])

  return <><button tabIndex={-1} aria-hidden="true" className={`sidebar-backdrop ${open ? 'open' : ''}`} onClick={onClose}/><aside ref={drawerRef} role="dialog" aria-modal={open || undefined} aria-label="Main navigation" inert={!open} id="netddash-navigation" className={`sidebar ${open ? 'open' : ''}`}>
    <div className="sidebar-top"><span>Navigation</span><button className="icon-button sidebar-close" onClick={onClose} aria-label="Close navigation"><X size={18}/></button></div>
    <nav className="sidebar-nav" aria-label="Main navigation">{items.map(({ path, label, icon: Icon }) => <NavLink key={path} to={path} onClick={onClose} className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}><Icon size={19}/><span>{label}</span></NavLink>)}</nav>
  </aside></>
}
