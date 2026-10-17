import { CircleAlert, RefreshCcw } from 'lucide-react'
import { AppButton } from '../common/AppButton'

export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return <div className="empty-state"><CircleAlert size={32} /><strong>Unable to load data</strong><p>{message}</p>{retry && <AppButton variant="outline" onClick={retry}><RefreshCcw size={15} /> Retry</AppButton>}</div>
}
