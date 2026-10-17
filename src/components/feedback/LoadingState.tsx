export function LoadingState({ text = 'Loading…' }: { text?: string }) {
  return <div className="loading-state" role="status"><span className="spinner" />{text}</div>
}
