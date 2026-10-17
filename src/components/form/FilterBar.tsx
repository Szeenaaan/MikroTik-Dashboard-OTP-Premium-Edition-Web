import { RotateCcw } from 'lucide-react'
import { SearchBar } from './SearchBar'
import { initialFilters } from '../../types/api.types'
import type { Filters } from '../../types/api.types'
export function FilterBar({ filters, setFilters, placeholder, statuses }: {
  filters: Filters; setFilters: (filters: Filters) => void; placeholder: string; statuses: string[]
}) {
  const change = (patch: Partial<Filters>) => setFilters({ ...filters, ...patch, page: 1 })
  return <div className="filter-section">
    <div className="filter-row"><SearchBar value={filters.search} onChange={search => change({ search })} placeholder={placeholder}/>
      <select aria-label="Filter status" className="select-input" value={filters.status} onChange={event => change({ status: event.target.value })}><option value="">All statuses</option>{statuses.map(status => <option key={status} value={status}>{status}</option>)}</select>
    </div>
    <div className="filter-row secondary-filter-row">
      <label className="date-filter">From <input className="date-input" type="date" value={filters.from_date} onChange={event => change({ from_date: event.target.value })}/></label>
      <label className="date-filter">To <input className="date-input" type="date" min={filters.from_date || undefined} value={filters.to_date} onChange={event => change({ to_date: event.target.value })}/></label>
      <select aria-label="Sort by date" className="select-input" value={filters.order} onChange={event => change({ order: event.target.value as Filters['order'] })}><option value="desc">Newest first</option><option value="asc">Oldest first</option></select>
      <button type="button" className="text-action" onClick={() => setFilters(initialFilters)}><RotateCcw size={15}/> Clear filters</button>
    </div>
  </div>
}
