import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import type { InputHTMLAttributes } from 'react'
interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> { label: string }
export function PasswordInput({ label, id, ...props }: Props) {
  const [visible, setVisible] = useState(false)
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-')
  return <div className="form-row"><label htmlFor={inputId}>{label}</label><div className="password-wrapper"><input id={inputId} className="text-input" type={visible ? 'text' : 'password'} {...props}/><button type="button" onClick={() => setVisible(v => !v)} className="password-eye" aria-label={visible ? 'Hide password' : 'Show password'}>{visible ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></div>
}
