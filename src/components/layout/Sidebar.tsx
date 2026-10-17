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
  return <><button aria-label="Close navigation" className={`sidebar-backdrop ${open ? 'open' : ''}`} onClick={onClose}/><aside id="netddash-navigation" className={`sidebar ${open ? 'open' : ''}`}>
    <div className="sidebar-top"><span>Navigation</span><button className="icon-button sidebar-close" onClick={onClose} aria-label="Close navigation"><X size={18}/></button></div>
    <nav className="sidebar-nav" aria-label="Main navigation">{items.map(({ path, label, icon: Icon }) => <NavLink key={path} to={path} onClick={onClose} className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}><Icon size={19}/><span>{label}</span></NavLink>)}</nav>
  </aside></>
}
