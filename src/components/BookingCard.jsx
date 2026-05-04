import { useMemo } from 'react'
import StatusBadge from './StatusBadge'

const TRIP_ICONS = {
  airport_pickup: '✈️',
  airport_drop: '🛫',
  tour_package: '🗺️',
  taxi_booking: '🚕',
}

/** Truncate long addresses to maxLen characters */
function truncate(str, maxLen = 28) {
  if (!str) return '—'
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function formatTime(t) {
  if (!t) return '—'
  const [h, m] = t.split(':')
  const d = new Date()
  d.setHours(Number(h), Number(m))
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

/**
 * BookingCard — compact card for the admin booking list.
 *
 * Props:
 *   booking        — booking object from API
 *   actionLoading  — ID of the booking currently being acted on
 *   onApprove      — (id) => void
 *   onReject       — (id) => void
 *   onReset        — (id) => void
 *   onView         — (booking) => void  — opens the detail modal
 */
export default function BookingCard({ booking: b, actionLoading, onApprove, onReject, onReset, onView }) {
  const icon = TRIP_ICONS[b.trip_type] || '🚗'

  const statusAccent = useMemo(() => {
    if (b.status === 'pending')  return 'rgba(245,158,11,0.25)'
    if (b.status === 'approved') return 'rgba(34,197,94,0.25)'
    if (b.status === 'rejected') return 'rgba(239,68,68,0.25)'
    return 'var(--border)'
  }, [b.status])

  return (
    <div
      className="booking-card"
      style={{ borderTopColor: statusAccent }}
    >
      {/* Top row: ID + Status */}
      <div className="booking-card-header">
        <span className="booking-card-id">#{b.id}</span>
        <StatusBadge status={b.status} />
      </div>

      {/* Customer */}
      <div className="booking-card-customer">
        <div className="booking-card-avatar">
          {(b.user_info?.name || b.name || '?')
            .split(' ')
            .slice(0, 2)
            .map((n) => n[0])
            .join('')
            .toUpperCase()}
        </div>
        <div>
          <div className="booking-card-name">{b.name}</div>
          <div className="booking-card-email">{b.user_info?.email ?? '—'}</div>
        </div>
      </div>

      {/* Route */}
      <div className="booking-card-route">
        <span className="booking-card-route-dot pickup" />
        <span className="booking-card-route-text" title={b.from_location}>
          {truncate(b.from_location)}
        </span>
        <span className="booking-card-route-arrow">→</span>
        <span className="booking-card-route-dot drop" />
        <span className="booking-card-route-text" title={b.to_location}>
          {truncate(b.to_location)}
        </span>
      </div>

      {/* Meta row */}
      <div className="booking-card-meta">
        <span>{icon} {b.trip_type_display}</span>
        <span>📅 {formatDate(b.date)}</span>
        <span>🕐 {formatTime(b.time)}</span>
        <span>👥 {b.num_people}</span>
      </div>

      {/* Actions */}
      <div className="booking-card-actions">
        <button
          id={`view-booking-${b.id}`}
          className="btn btn-secondary btn-sm"
          onClick={() => onView(b)}
        >
          👁 View
        </button>

        {b.status !== 'approved' && (
          <button
            id={`approve-booking-${b.id}`}
            className="btn btn-success btn-sm"
            onClick={() => onApprove(b.id)}
            disabled={actionLoading === b.id}
          >
            {actionLoading === b.id ? <span className="spinner spinner-sm" /> : '✅ Approve'}
          </button>
        )}

        {b.status !== 'rejected' && (
          <button
            id={`reject-booking-${b.id}`}
            className="btn btn-danger btn-sm"
            onClick={() => onReject(b.id)}
            disabled={actionLoading === b.id}
          >
            {actionLoading === b.id ? <span className="spinner spinner-sm" /> : '❌ Reject'}
          </button>
        )}

        {b.status !== 'pending' && (
          <button
            id={`reset-booking-${b.id}`}
            className="btn btn-ghost btn-sm"
            onClick={() => onReset(b.id)}
            disabled={actionLoading === b.id}
            title="Reset to Pending"
          >
            ↩ Reset
          </button>
        )}
      </div>
    </div>
  )
}
