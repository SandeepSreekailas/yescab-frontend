import { useEffect, useRef, useState } from 'react'
import StatusBadge from './StatusBadge'

/**
 * BookingDetailModal — full-screen overlay showing complete booking details + map.
 *
 * Props:
 *   booking  — the booking object to display (null = hidden)
 *   onClose  — () => void
 */
export default function BookingDetailModal({ booking, onClose }) {
  const overlayRef = useRef(null)
  const [mapError, setMapError] = useState(false)

  // Close on Escape key
  useEffect(() => {
    if (!booking) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [booking, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (booking) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [booking])

  if (!booking) return null

  const b = booking
  const hasPickupCoords = b.pickup_lat != null && b.pickup_lng != null
  const hasDropCoords = b.drop_lat != null && b.drop_lng != null
  const hasCoords = hasPickupCoords || hasDropCoords

  // Build OpenStreetMap embed URL for the route preview
  let mapSrc = ''
  if (hasPickupCoords && hasDropCoords) {
    // Show a bounding box that includes both points
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
            <button className="modal-close" onClick={onClose} title="Close">✕</button>
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
            <div className="modal-map-fallback">
              🗺️ Map preview unavailable. Coordinates shown below.
            </div>
          ) : null}

          {/* Detail Grid */}
          <div className="modal-detail-grid">
            {/* Customer Info */}
            <div className="modal-detail-section">
              <h4 className="modal-detail-heading">👤 Customer</h4>
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
              <h4 className="modal-detail-heading">🚗 Route</h4>
              <div className="modal-detail-row">
                <span className="modal-detail-label">📍 Pickup</span>
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
                <span className="modal-detail-label">🏁 Drop</span>
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
              <h4 className="modal-detail-heading">📅 Schedule</h4>
              <div className="modal-detail-row">
                <span className="modal-detail-label">Date</span>
                <span className="modal-detail-value">{formatDate(b.date)}</span>
              </div>
              <div className="modal-detail-row">
                <span className="modal-detail-label">Time</span>
                <span className="modal-detail-value">{formatTime(b.time)}</span>
              </div>
            </div>

            {/* Notes */}
            {b.notes && (
              <div className="modal-detail-section">
                <h4 className="modal-detail-heading">📝 Notes</h4>
                <p className="modal-detail-notes">{b.notes}</p>
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
    </div>
  )
}
