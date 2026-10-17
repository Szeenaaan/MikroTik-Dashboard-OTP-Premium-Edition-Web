import { AlertCircle, CheckCircle2 } from 'lucide-react'

export function InlineMessage({ message, success = false }: { message: string; success?: boolean }) {
  if (!message) return null
  return <div className={`inline-message ${success ? 'inline-success' : 'inline-error'}`} role="alert">
    {success ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}
    <span>{message}</span>
  </div>
}
