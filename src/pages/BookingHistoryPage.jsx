import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { bookingsAPI } from '../api/axios'
import Navbar from '../components/Navbar'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import { RefreshCw, CarFront, AlertTriangle } from 'lucide-react'

const STATUS_FILTERS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'driver_assigned', label: 'Driver Assigned' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
]

export default function BookingHistoryPage() {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [filteredBookings, setFilteredBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await bookingsAPI.list()
      setBookings(res.data)
      setFilteredBookings(res.data)
    } catch {
      setError('Failed to load your bookings. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  // Apply status filter client-side
  useEffect(() => {
    if (!statusFilter) {
      setFilteredBookings(bookings)
    } else {
      setFilteredBookings(bookings.filter((b) => b.status === statusFilter))
    }
  }, [statusFilter, bookings])

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

  const formatTime = (timeStr) => {
    if (!timeStr) return '—'
    const [h, m] = timeStr.split(':')
    const d = new Date()
    d.setHours(Number(h), Number(m))
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
  }

  return (
    <>
      <Navbar />
      <div className="page-wrapper">
        {/* Header */}
        <div className="section-header">
          <div>
            <h1 className="page-title">My Bookings</h1>
            <p className="page-subtitle">
              {bookings.length > 0
                ? `${bookings.length} booking${bookings.length > 1 ? 's' : ''} found`
                : 'Your booking history will appear here.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              id="status-filter"
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUS_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
            <button
              id="refresh-bookings-btn"
              className="btn btn-secondary btn-sm"
              onClick={fetchBookings}
              disabled={loading}
              title="Refresh"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <RefreshCw size={16} /> Refresh
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate('/book')}
            >
              + New Booking
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="alert alert-error mb-2" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <AlertTriangle size={18} /> {error}
            <button
              className="btn btn-ghost btn-sm"
              onClick={fetchBookings}
              style={{ marginLeft: '1rem' }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <LoadingSpinner text="Loading your bookings…" />
        ) : filteredBookings.length === 0 ? (
          <div className="empty-state card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <div className="empty-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}><CarFront size={48} color="var(--text-muted)" /></div>
            <div className="empty-title" style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text)' }}>
              {statusFilter ? `No ${statusFilter} bookings found.` : 'No bookings yet.'}
            </div>
            <p className="empty-text">
              {statusFilter
                ? 'Try selecting a different filter.'
                : 'Start by booking your first cab ride!'}
            </p>
            {!statusFilter && (
              <button className="btn btn-primary mt-2" onClick={() => navigate('/book')}>
                Book Now
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredBookings.map((b) => (
              <div key={b.id} className="booking-card animate-fadeup">
                {/* Card Header */}
                <div className="booking-card-header">
                  <div>
                    <div className="booking-card-title">{b.trip_type_display}</div>
                    <div className="booking-card-id">
                      Booking #{b.id} &nbsp;·&nbsp;
                      <span style={{ color: 'var(--text-faint)', fontSize: '0.78rem' }}>
                        Booked on{' '}
                        {new Date(b.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={b.status} />
                </div>

                {/* Card Body */}
                <div className="booking-card-body" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                  <div className="booking-detail">
                    <span className="booking-detail-label">From</span>
                    <span className="booking-detail-value">{b.from_location}</span>
                  </div>
                  <div className="booking-detail">
                    <span className="booking-detail-label">To</span>
                    <span className="booking-detail-value">{b.to_location}</span>
                  </div>
                  <div className="booking-detail">
                    <span className="booking-detail-label">Passengers</span>
                    <span className="booking-detail-value">{b.num_people}</span>
                  </div>
                  <div className="booking-detail">
                    <span className="booking-detail-label">Travel Date</span>
                    <span className="booking-detail-value">{formatDate(b.date)}</span>
                  </div>
                  <div className="booking-detail">
                    <span className="booking-detail-label">Pickup Time</span>
                    <span className="booking-detail-value">{formatTime(b.time)}</span>
                  </div>
                  <div className="booking-detail">
                    <span className="booking-detail-label">Passenger Name</span>
                    <span className="booking-detail-value">{b.name}</span>
                  </div>
                  <div className="booking-detail">
                    <span className="booking-detail-label">Phone</span>
                    <span className="booking-detail-value">{b.phone_number || '—'}</span>
                  </div>
                </div>

                {/* Notes */}
                {b.notes && (
                  <div
                    style={{
                      marginTop: '0.85rem',
                      padding: '0.75rem 1rem',
                      background: 'var(--surface-2)',
                      borderRadius: 'var(--radius)',
                      fontSize: '0.85rem',
                      color: 'var(--text-muted)',
                      borderLeft: '3px solid var(--border-active)',
                    }}
                  >
                    <span style={{ fontWeight: 600, color: 'var(--text)' }}>Notes: </span>
                    {b.notes}
                  </div>
                )}

                {/* Admin Note */}
                {b.admin_note && (
                  <div
                    style={{
                      marginTop: '0.85rem',
                      padding: '0.75rem 1rem',
                      background: 'rgba(255, 204, 0, 0.1)',
                      borderRadius: 'var(--radius)',
                      fontSize: '0.85rem',
                      color: 'var(--text-muted)',
                      borderLeft: '3px solid var(--primary)',
                    }}
                  >
                    <span style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>Admin Note: </span>
                    {b.admin_note}
                  </div>
                )}

                {/* Rejected reason hint */}
                {b.status === 'rejected' && (
                  <div className="alert alert-error" style={{ marginTop: '0.85rem', fontSize: '0.83rem' }}>
                    This booking was rejected. Please contact support or create a new booking.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
