import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { LoaderCircle } from 'lucide-react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
  busy?: boolean
  children: ReactNode
}
export function AppButton({ children, variant = 'primary', busy = false, className = '', disabled, ...rest }: Props) {
  return <button className={`app-button btn-${variant} ${className}`} disabled={disabled || busy} {...rest}>
    {busy && <LoaderCircle className="spin" size={16} />}{children}
  </button>
}
