import { useEffect, useRef, useState } from 'react'
import StatusBadge from './StatusBadge'
import { MapPin, Navigation, Map, Calendar, FileText, User, X, Clock, CheckCircle, XCircle, CarFront, Ban, Check, ShieldAlert } from 'lucide-react'

// Valid next-states from each status (mirrors backend VALID_TRANSITIONS)
const VALID_TRANSITIONS = {
  pending:         ['approved', 'rejected'],
  approved:        ['driver_assigned', 'completed'],
  driver_assigned: ['completed'],
  completed:       [],
  rejected:        [],
  cancelled:       [],
}

const FINALIZED = new Set(['completed', 'rejected', 'cancelled'])

const STATUS_CONFIG = {
  pending:         { icon: Clock,       color: '#fbbf24', label: 'Pending' },
  approved:        { icon: CheckCircle, color: '#4ade80', label: 'Approved' },
  driver_assigned: { icon: CarFront,    color: '#60a5fa', label: 'Driver Assigned' },
  completed:       { icon: Check,       color: '#4ade80', label: 'Completed' },
  rejected:        { icon: XCircle,     color: '#f87171', label: 'Rejected' },
  cancelled:       { icon: Ban,         color: '#9ca3af', label: 'Cancelled' },
}

/**
 * BookingDetailModal — full-screen overlay with state-aware admin controls.
 */
export default function BookingDetailModal({ booking, vehicles = [], onClose, isAdmin, onUpdate }) {
  const overlayRef = useRef(null)
  const [mapError, setMapError] = useState(false)
  const [localStatus, setLocalStatus] = useState('')
  const [localNote, setLocalNote] = useState('')
  const [localVehicle, setLocalVehicle] = useState('')
  const [localRejectionReason, setLocalRejectionReason] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  // Sync local state when booking changes
  useEffect(() => {
    if (booking) {
      setLocalStatus(booking.status || 'pending')
      setLocalNote(booking.admin_note || '')
      setLocalVehicle(booking.vehicle || '')
      setLocalRejectionReason(booking.rejection_reason || '')
      setShowConfirm(false)
    }
  }, [booking])

  // Close on Escape key
  useEffect(() => {
    if (!booking) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [booking, onClose])

  // Prevent body scroll when modal is open
  const prevOverflowRef = useRef('')
  useEffect(() => {
    if (booking) {
      prevOverflowRef.current = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = prevOverflowRef.current || ''
    }
    return () => { document.body.style.overflow = prevOverflowRef.current || '' }
  }, [booking])

  if (!booking) return null

  const b = booking
  const isFinalized = FINALIZED.has(b.status)
  const allowedNext = VALID_TRANSITIONS[b.status] || []
  const hasPickupCoords = b.pickup_lat != null && b.pickup_lng != null
  const hasDropCoords = b.drop_lat != null && b.drop_lng != null
  const hasCoords = hasPickupCoords || hasDropCoords

  // Build OpenStreetMap embed URL
  let mapSrc = ''
  if (hasPickupCoords && hasDropCoords) {
    const minLat = Math.min(b.pickup_lat, b.drop_lat) - 0.01
    const maxLat = Math.max(b.pickup_lat, b.drop_lat) + 0.01
    const minLng = Math.min(b.pickup_lng, b.drop_lng) - 0.01
    const maxLng = Math.max(b.pickup_lng, b.drop_lng) + 0.01
    mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${minLng},${minLat},${maxLng},${maxLat}&layer=mapnik&marker=${b.pickup_lat},${b.pickup_lng}`
  } else if (hasPickupCoords) {
    mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${b.pickup_lng - 0.01},${b.pickup_lat - 0.01},${b.pickup_lng + 0.01},${b.pickup_lat + 0.01}&layer=mapnik&marker=${b.pickup_lat},${b.pickup_lng}`
  } else if (hasDropCoords) {
    mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${b.drop_lng - 0.01},${b.drop_lat - 0.01},${b.drop_lng + 0.01},${b.drop_lat + 0.01}&layer=mapnik&marker=${b.drop_lat},${b.drop_lng}`
  }

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })

  const formatTime = (t) => {
    if (!t) return '—'
    const [h, m] = t.split(':')
    const d = new Date()
    d.setHours(Number(h), Number(m))
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
  }

  // ── Build timeline events ──
  const timeline = []
  timeline.push({ status: 'created', label: 'Booking Created', time: b.created_at, active: true })

  const statusOrder = ['pending', 'approved', 'driver_assigned', 'completed']
  const currentIndex = statusOrder.indexOf(b.status)

  if (b.status === 'cancelled') {
    timeline.push({ status: 'cancelled', label: 'Cancelled by Customer', time: b.cancelled_at, active: true })
  } else if (b.status === 'rejected') {
    timeline.push({ status: 'rejected', label: 'Rejected by Admin', time: b.updated_at, active: true })
  } else {
    if (currentIndex >= 1) timeline.push({ status: 'approved', label: 'Approved', time: b.updated_at, active: true })
    else timeline.push({ status: 'approved', label: 'Awaiting Approval', time: null, active: false })

    if (currentIndex >= 2) timeline.push({ status: 'driver_assigned', label: 'Driver Assigned', time: b.updated_at, active: true })
    else if (currentIndex >= 1) timeline.push({ status: 'driver_assigned', label: 'Assigning Driver', time: null, active: false })

    if (currentIndex >= 3) timeline.push({ status: 'completed', label: 'Ride Completed', time: b.updated_at, active: true })
    else if (currentIndex >= 1) timeline.push({ status: 'completed', label: 'Pending Completion', time: null, active: false })
  }

  const handleSubmitUpdate = () => {
    if (localStatus !== b.status) {
      setShowConfirm(true)
    } else {
      // Only note/vehicle change, no confirmation needed
      onUpdate(localStatus, localNote, localVehicle, localRejectionReason)
    }
  }

  const confirmUpdate = () => {
    setShowConfirm(false)
    onUpdate(localStatus, localNote, localVehicle, localRejectionReason)
  }

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="modal-content booking-detail-modal">
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Booking #{b.id}</h2>
            <span className="modal-subtitle">{b.trip_type_display}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <StatusBadge status={b.status} />
            <button className="modal-close" onClick={onClose} title="Close" style={{ display: 'flex', alignItems: 'center' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="modal-body">

          {/* Map Preview */}
          {hasCoords && !mapError ? (
            <div className="modal-map-wrap">
              <iframe
                title="Booking location map"
                src={mapSrc}
                width="100%"
                height="100%"
                style={{ border: 'none', borderRadius: 'var(--radius)' }}
                loading="lazy"
                onError={() => setMapError(true)}
              />
            </div>
          ) : hasCoords && mapError ? (
            <div className="modal-map-fallback" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Map size={18} /> Map preview unavailable. Coordinates shown below.
            </div>
          ) : null}

          {/* Detail Grid */}
          <div className="modal-detail-grid">
            {/* Customer Info */}
            <div className="modal-detail-section">
              <h4 className="modal-detail-heading" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><User size={16} /> Customer</h4>
              <div className="modal-detail-row">
                <span className="modal-detail-label">Account</span>
                <span className="modal-detail-value">{b.user_info?.name ?? '—'} ({b.user_info?.email ?? '—'})</span>
              </div>
              <div className="modal-detail-row">
                <span className="modal-detail-label">Passenger Name</span>
                <span className="modal-detail-value">{b.name}</span>
              </div>
              <div className="modal-detail-row">
                <span className="modal-detail-label">Phone</span>
                <span className="modal-detail-value">{b.phone_number || '—'}</span>
              </div>
              <div className="modal-detail-row">
                <span className="modal-detail-label">Passengers</span>
                <span className="modal-detail-value">{b.num_people}</span>
              </div>
            </div>

            {/* Route */}
            <div className="modal-detail-section">
              <h4 className="modal-detail-heading" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Navigation size={16} /> Route</h4>
              <div className="modal-detail-row">
                <span className="modal-detail-label" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><MapPin size={14} /> Pickup</span>
                <span className="modal-detail-value">{b.pickup_address || b.from_location}</span>
              </div>
              {hasPickupCoords && (
                <div className="modal-detail-row">
                  <span className="modal-detail-label">Coords</span>
                  <span className="modal-detail-value modal-detail-mono">
                    {b.pickup_lat.toFixed(5)}, {b.pickup_lng.toFixed(5)}
                  </span>
                </div>
              )}
              <div className="modal-detail-row">
                <span className="modal-detail-label" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><MapPin size={14} color="var(--danger)" /> Drop</span>
                <span className="modal-detail-value">{b.drop_address || b.to_location}</span>
              </div>
              {hasDropCoords && (
                <div className="modal-detail-row">
                  <span className="modal-detail-label">Coords</span>
                  <span className="modal-detail-value modal-detail-mono">
                    {b.drop_lat.toFixed(5)}, {b.drop_lng.toFixed(5)}
                  </span>
                </div>
              )}
            </div>

            {/* Schedule */}
            <div className="modal-detail-section">
              <h4 className="modal-detail-heading" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Calendar size={16} /> Schedule</h4>
              <div className="modal-detail-row">
                <span className="modal-detail-label">Date</span>
                <span className="modal-detail-value">{formatDate(b.date)}</span>
              </div>
              <div className="modal-detail-row">
                <span className="modal-detail-label">Time</span>
                <span className="modal-detail-value">{formatTime(b.time)}</span>
              </div>
            </div>

            {/* Booking Timeline */}
            <div className="modal-detail-section" style={{ gridColumn: '1 / -1' }}>
              <h4 className="modal-detail-heading" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Clock size={16} /> Timeline</h4>
              <div className="booking-timeline">
                {timeline.map((event, i) => {
                  const cfg = STATUS_CONFIG[event.status] || STATUS_CONFIG.pending
                  const Icon = event.status === 'created' ? Clock : cfg.icon
                  return (
                    <div key={i} className={`timeline-step ${event.active ? 'active' : 'inactive'}`}>
                      <div className="timeline-dot" style={{ borderColor: event.active ? cfg.color : 'var(--border)' }}>
                        <Icon size={14} color={event.active ? cfg.color : 'var(--text-faint)'} />
                      </div>
                      {i < timeline.length - 1 && <div className={`timeline-line ${event.active ? 'active' : ''}`} />}
                      <div className="timeline-content">
                        <span className="timeline-label" style={{ color: event.active ? 'var(--text)' : 'var(--text-faint)' }}>
                          {event.label}
                        </span>
                        {event.time && (
                          <span className="timeline-time">
                            {new Date(event.time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Notes */}
            {b.notes && (
              <div className="modal-detail-section">
                <h4 className="modal-detail-heading" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><FileText size={16} /> Notes</h4>
                <p className="modal-detail-notes">{b.notes}</p>
              </div>
            )}
            {/* Admin Note */}
            {b.admin_note && (
              <div className="modal-detail-section">
                <h4 className="modal-detail-heading" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary-dark)' }}><FileText size={16} /> Admin Note</h4>
                <p className="modal-detail-notes" style={{ background: 'rgba(255, 204, 0, 0.1)', borderLeft: '3px solid var(--primary)' }}>{b.admin_note}</p>
              </div>
            )}
            
            {/* Rejection Reason */}
            {b.status === 'rejected' && b.rejection_reason && (
              <div className="modal-detail-section" style={{ gridColumn: '1 / -1' }}>
                <h4 className="modal-detail-heading" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--danger)' }}><XCircle size={16} /> Rejection Reason</h4>
                <p className="modal-detail-notes" style={{ background: 'rgba(248, 113, 113, 0.1)', borderLeft: '3px solid var(--danger)', color: 'var(--danger)' }}>{b.rejection_reason}</p>
              </div>
            )}
            
            {/* Vehicle Info */}
            {b.vehicle_info && (
              <div className="modal-detail-section" style={{ gridColumn: '1 / -1' }}>
                <h4 className="modal-detail-heading" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary-dark)' }}><CarFront size={16} /> Assigned Vehicle</h4>
                <p className="modal-detail-notes" style={{ background: 'var(--surface-2)' }}>{b.vehicle_info.name} - {b.vehicle_info.status_display}</p>
              </div>
            )}

            {/* Admin Controls — state-aware */}
            {isAdmin && onUpdate && (
              <div className="modal-detail-section" style={{ gridColumn: '1 / -1', background: 'var(--surface-2)', padding: '1rem', borderRadius: 'var(--radius)' }}>
                {isFinalized ? (
                  /* Finalized: show locked state */
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}>
                    <Ban size={18} />
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '0.15rem' }}>
                        Booking Finalized
                      </div>
                      <span style={{ fontSize: '0.82rem' }}>
                        {b.status === 'cancelled'
                          ? 'This booking was cancelled by the customer. No further actions can be taken.'
                          : b.status === 'rejected'
                            ? 'This booking has been rejected. No further actions can be taken.'
                            : 'This ride has been completed. No further actions can be taken.'}
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Active: show update form */
                  <>
                    <h4 className="modal-detail-heading" style={{ marginBottom: '0.75rem' }}>Update Status</h4>
                    <form
                      onSubmit={(e) => { e.preventDefault(); handleSubmitUpdate() }}
                      style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
                    >
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <select
                          name="status"
                          value={localStatus}
                          onChange={(e) => setLocalStatus(e.target.value)}
                          className="form-control"
                          style={{ flex: 1, minWidth: '160px' }}
                        >
                          <option value={b.status}>{STATUS_CONFIG[b.status]?.label || b.status} (current)</option>
                          {allowedNext.map(s => (
                            <option key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</option>
                          ))}
                        </select>
                        <a
                          href={`https://wa.me/${b.phone_number.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${b.name}, your YesCab booking #${b.id} status is now ${STATUS_CONFIG[localStatus]?.label || localStatus}.${localNote ? ` Note: ${localNote}` : ''}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary"
                          style={{ backgroundColor: '#25D366', color: '#fff', border: 'none' }}
                        >
                          Reply on WhatsApp
                        </a>
                      </div>
                      
                      {['approved', 'driver_assigned'].includes(localStatus) && (
                        <select
                          className="form-control"
                          value={localVehicle}
                          onChange={(e) => setLocalVehicle(e.target.value)}
                        >
                          <option value="">— Assign Vehicle —</option>
                          {vehicles.map(v => (
                            <option key={v.id} value={v.id}>{v.name} ({v.status_display})</option>
                          ))}
                        </select>
                      )}
                      
                      {localStatus === 'rejected' && (
                        <div>
                           <input 
                             list="rejection-reasons"
                             className="form-control"
                             placeholder="Select or type rejection reason..."
                             value={localRejectionReason}
                             onChange={(e) => setLocalRejectionReason(e.target.value)}
                           />
                           <datalist id="rejection-reasons">
                              <option value="No vehicle available" />
                              <option value="Driver unavailable" />
                              <option value="Pickup too far" />
                              <option value="Time slot unavailable" />
                              <option value="Outside service area" />
                           </datalist>
                        </div>
                      )}

                      <textarea
                        name="admin_note"
                        value={localNote}
                        onChange={(e) => setLocalNote(e.target.value)}
                        className="form-control"
                        placeholder="Add a note for the customer (e.g. 'Driver will arrive in 10 minutes')"
                        rows={2}
                      />
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button type="submit" className="btn btn-primary btn-sm">
                          Save Update
                        </button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setLocalStatus(b.status); setLocalNote(b.admin_note || ''); setLocalVehicle(b.vehicle || ''); setLocalRejectionReason(b.rejection_reason || '') }}>
                          Reset
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <span style={{ color: 'var(--text-faint)', fontSize: '0.78rem' }}>
            Created {new Date(b.created_at).toLocaleString('en-IN')}
          </span>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="modal-overlay" style={{ zIndex: 1001 }} onClick={() => setShowConfirm(false)}>
          <div className="modal-content animate-scale" style={{ maxWidth: '400px', textAlign: 'center', padding: '2rem' }} onClick={e => e.stopPropagation()}>
            <div style={{ color: 'var(--primary)', marginBottom: '1rem' }}><ShieldAlert size={48} /></div>
            <h3 style={{ marginBottom: '0.5rem' }}>Confirm Status Change</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
              Change booking #{b.id} from <strong>{STATUS_CONFIG[b.status]?.label}</strong> to <strong>{STATUS_CONFIG[localStatus]?.label}</strong>?
              {localStatus === 'rejected' && ' This action cannot be undone.'}
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowConfirm(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={confirmUpdate}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
