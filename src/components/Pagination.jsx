import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ count, pageSize = 50, currentPage, onPageChange }) {
  if (count <= pageSize) return null

  const totalPages = Math.ceil(count / pageSize)
  const isFirst = currentPage === 1
  const isLast = currentPage === totalPages

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderTop: '1px solid var(--border)', marginTop: '1rem' }}>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        Showing <strong>{(currentPage - 1) * pageSize + 1}</strong> to <strong>{Math.min(currentPage * pageSize, count)}</strong> of <strong>{count}</strong> results
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          className="btn btn-secondary btn-sm"
          disabled={isFirst}
          onClick={() => onPageChange(currentPage - 1)}
          style={{ display: 'flex', alignItems: 'center', padding: '0.4rem' }}
        >
          <ChevronLeft size={16} />
        </button>
        <span style={{ display: 'flex', alignItems: 'center', padding: '0 0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
          Page {currentPage} of {totalPages}
        </span>
        <button
          className="btn btn-secondary btn-sm"
          disabled={isLast}
          onClick={() => onPageChange(currentPage + 1)}
          style={{ display: 'flex', alignItems: 'center', padding: '0.4rem' }}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
