import type { ReactNode } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../theme/ThemeContext'
export function AuthLayout({ children }: { children: ReactNode }) {
  const { theme, toggleTheme } = useTheme()
  return <div className="auth-shell"><div className="auth-left"><div className="auth-headline">Manage, monitor <span>and controll.</span></div></div><div className="auth-right"><button className="auth-theme-toggle" onClick={toggleTheme} aria-label="Toggle color theme">{theme === 'light' ? <Moon size={18}/> : <Sun size={18}/>}</button>{children}</div></div>
}
