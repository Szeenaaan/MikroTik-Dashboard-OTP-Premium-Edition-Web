import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react'

type Kind = 'success' | 'error' | 'info'
interface ToastItem { id: number; kind: Kind; message: string }
interface ToastContextValue { notify: (message: string, kind?: Kind) => void }
const ToastContext = createContext<ToastContextValue | null>(null)
let toastId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const remove = useCallback((id: number) => setItems(list => list.filter(item => item.id !== id)), [])
  const notify = useCallback((message: string, kind: Kind = 'info') => {
    const id = ++toastId
    setItems(list => [...list.slice(-3), { id, kind, message }])
    window.setTimeout(() => remove(id), 5000)
  }, [remove])
  const value = useMemo(() => ({ notify }), [notify])
  return <ToastContext.Provider value={value}>
    {children}
    <div className="toast-stack" aria-live="polite">
      {items.map(item => <div className={`toast toast-${item.kind}`} key={item.id} role="status">
        {item.kind === 'success' ? <CheckCircle2 size={19} /> : item.kind === 'error' ? <CircleAlert size={19} /> : <Info size={19} />}
        <span>{item.message}</span>
        <button type="button" className="icon-button compact" aria-label="Dismiss" onClick={() => remove(item.id)}><X size={15} /></button>
      </div>)}
    </div>
  </ToastContext.Provider>
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast requires ToastProvider')
  return context
}
