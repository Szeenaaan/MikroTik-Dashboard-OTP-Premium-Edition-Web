import type { ReactNode } from 'react'
export function AppCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`app-card ${className}`}>{children}</section>
}
