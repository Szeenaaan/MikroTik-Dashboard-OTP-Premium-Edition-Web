import { useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { AppButton } from './AppButton'

export function ConfirmDialog({ title, description, confirmLabel = 'Confirm', onClose, onConfirm, busy = false, danger = false }: {
  title: string; description: string; confirmLabel?: string; onClose: () => void; onConfirm: () => void; busy?: boolean; danger?: boolean
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) { if (event.key === 'Escape' && !busy) onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [busy, onClose])
  return <div className="modal-scrim" onMouseDown={event => { if (event.target === event.currentTarget && !busy) onClose() }}>
    <div className="modal-card" role="dialog" aria-modal="true" aria-label={title}>
      <button className="icon-button modal-close" onClick={onClose} aria-label="Close"><X size={18}/></button>
      <div className="modal-icon"><AlertTriangle size={24}/></div>
      <h2>{title}</h2><p>{description}</p>
      <div className="modal-actions"><AppButton variant="outline" onClick={onClose} disabled={busy}>Cancel</AppButton><AppButton variant={danger ? 'danger' : 'primary'} busy={busy} onClick={onConfirm}>{confirmLabel}</AppButton></div>
    </div>
  </div>
}
