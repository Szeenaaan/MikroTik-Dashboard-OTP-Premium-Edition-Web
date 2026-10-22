import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogOut, Menu, Moon, Settings, Sun, UserRound, Wifi } from 'lucide-react'
import { useTheme } from '../../theme/ThemeContext'
import { useAuth } from '../../services/authService'
import { useToast } from '../feedback/Toast'
import { errorMessage } from '../../utils/errorMessage'

export function Header({ onOpenSidebar, sidebarOpen }: { onOpenSidebar: () => void; sidebarOpen: boolean }) {
  const { theme, toggleTheme } = useTheme()
  const { logout } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const signOut = async () => {
    setMenuOpen(false)
    try { await logout(); navigate('/login', { replace: true }) }
    catch (error) { notify(errorMessage(error, 'Logout request failed. Your local session was cleared.'), 'error'); navigate('/login', { replace: true }) }
  }
  return <header className="app-header">
    <div className="header-brand"><button type="button" className="icon-button mobile-menu" onClick={onOpenSidebar} aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'} aria-controls="netddash-navigation" aria-expanded={sidebarOpen}><Menu size={22}/></button><span className="brand-emblem"><Wifi size={21}/></span><div><strong>netddash</strong></div></div>
    <div className="header-actions">
      <button type="button" className="header-theme-toggle" aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'} onClick={toggleTheme}>{theme === 'light' ? <Moon size={18}/> : <Sun size={18}/>}</button>
      <div className="header-account"><button type="button" className="account-toggle" onClick={() => setMenuOpen(open => !open)} aria-expanded={menuOpen} aria-label="Account menu"><UserRound size={20}/></button>
        {menuOpen && <><button aria-label="Close account menu" className="popover-backdrop" onClick={() => setMenuOpen(false)} /><div className="account-popover"><div className="account-menu-title">Account</div><Link to="/settings" onClick={() => setMenuOpen(false)}><Settings size={16}/> Settings</Link><button type="button" onClick={() => { void signOut() }}><LogOut size={16}/> Logout</button></div></>}
      </div>
    </div>
  </header>
}
