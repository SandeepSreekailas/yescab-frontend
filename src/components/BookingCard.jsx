import { useMemo } from 'react'
import StatusBadge from './StatusBadge'

import { Plane, PlaneTakeoff, Map, CarFront, Clock, Users, Calendar, Eye, CheckCircle, XCircle, Ban } from 'lucide-react'

const TRIP_ICONS = {
  airport_pickup: <Plane size={16} />,
  airport_drop: <PlaneTakeoff size={16} />,
  tour_package: <Map size={16} />,
  taxi_booking: <CarFront size={16} />,
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

// States where admin cannot take action
const FINALIZED = new Set(['completed', 'rejected', 'cancelled'])

/**
 * BookingCard — compact card for the admin booking list.
 * State-aware: disables all action buttons on finalized bookings.
 */
export default function BookingCard({ booking: b, actionLoading, onApprove, onReject, onView }) {
  const icon = TRIP_ICONS[b.trip_type] || <CarFront size={16} />
  const isFinalized = FINALIZED.has(b.status)

  const statusAccent = useMemo(() => {
    if (b.status === 'pending')         return 'rgba(245,158,11,0.25)'
    if (b.status === 'approved')        return 'rgba(34,197,94,0.25)'
    if (b.status === 'driver_assigned') return 'rgba(59,130,246,0.25)'
    if (b.status === 'completed')       return 'rgba(34,197,94,0.25)'
    if (b.status === 'rejected')        return 'rgba(239,68,68,0.25)'
    if (b.status === 'cancelled')       return 'rgba(156,163,175,0.25)'
    return 'var(--border)'
  }, [b.status])

  return (
    <div
      className={`booking-card ${isFinalized ? 'booking-card--finalized' : ''}`}
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
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>{icon} {b.trip_type_display}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Calendar size={16} /> {formatDate(b.date)}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Clock size={16} /> {formatTime(b.time)}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Users size={16} /> {b.num_people}</span>
      </div>

      {/* Cancelled by customer notice */}
      {b.status === 'cancelled' && (
        <div className="booking-card-cancelled-notice">
          <Ban size={14} /> Cancelled by customer
          {b.cancelled_at && (
            <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--text-faint)' }}>
              {new Date(b.cancelled_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="booking-card-actions">
        <button
          id={`view-booking-${b.id}`}
          className="btn btn-secondary btn-sm"
          onClick={() => onView(b)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <Eye size={14} /> View
        </button>

        {!isFinalized && b.status === 'pending' && (
          <>
            <button
              id={`approve-booking-${b.id}`}
              className="btn btn-success btn-sm"
              onClick={() => onApprove(b.id)}
              disabled={actionLoading === b.id}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              {actionLoading === b.id ? <span className="spinner spinner-sm" /> : <><CheckCircle size={14} /> Approve</>}
            </button>
            <button
              id={`reject-booking-${b.id}`}
              className="btn btn-danger btn-sm"
              onClick={() => onReject(b.id)}
              disabled={actionLoading === b.id}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              {actionLoading === b.id ? <span className="spinner spinner-sm" /> : <><XCircle size={14} /> Reject</>}
            </button>
          </>
        )}

        {isFinalized && (
          <span className="booking-card-locked" title="This booking is finalized and cannot be modified">
            No actions available
          </span>
        )}
      </div>
    </div>
  )
}
