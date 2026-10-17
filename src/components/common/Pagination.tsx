import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { LaravelPagination } from '../../types/api.types'
export function Pagination<T>({ data, onPage }: { data: LaravelPagination<T>; onPage: (page: number) => void }) {
  return <div className="pagination"><span>Showing {data.from ?? 0}–{data.to ?? 0} of {data.total.toLocaleString()}</span>
    <div className="pager-buttons"><button className="icon-button" aria-label="Previous page" disabled={data.current_page <= 1} onClick={() => onPage(data.current_page - 1)}><ChevronLeft size={18}/></button><span className="current-page">{data.current_page} / {data.last_page}</span><button className="icon-button" aria-label="Next page" disabled={data.current_page >= data.last_page} onClick={() => onPage(data.current_page + 1)}><ChevronRight size={18}/></button></div>
  </div>
}
