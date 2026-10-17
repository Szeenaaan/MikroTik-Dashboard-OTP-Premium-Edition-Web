import { Search, X } from 'lucide-react'
export function SearchBar({ value, onChange, placeholder = 'Search…' }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <div className="search-bar"><Search size={17}/><input aria-label="Search" value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder}/>{value && <button type="button" className="icon-button compact" aria-label="Clear search" onClick={() => onChange('')}><X size={14}/></button>}</div>
}
