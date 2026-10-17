import type { InputHTMLAttributes } from 'react'
interface Props extends InputHTMLAttributes<HTMLInputElement> { label: string }
export function AppInput({ label, id, ...props }: Props) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-')
  return <div className="form-row"><label htmlFor={inputId}>{label}</label><input className="text-input" id={inputId} {...props}/></div>
}
