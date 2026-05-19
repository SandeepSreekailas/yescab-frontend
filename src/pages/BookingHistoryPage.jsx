import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { bookingsAPI } from '../api/axios'
import Navbar from '../components/Navbar'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import BookingReceiptModal from '../components/BookingReceiptModal'
import Pagination from '../components/Pagination'
import {
  RefreshCw, CarFront, AlertTriangle, FileText, Trash2, ShieldAlert,
  Clock, CheckCircle, Ban, XCircle, Check, Info
} from 'lucide-react'

const STATUS_FILTERS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'driver_assigned', label: 'Driver Assigned' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
]

// Receipts only available for these statuses
const RECEIPT_ELIGIBLE = new Set(['approved', 'driver_assigned', 'completed'])
const CANCELLABLE = new Set(['pending', 'approved', 'driver_assigned'])

const STATUS_EXPLANATIONS = {
  pending:         { icon: Clock,       text: 'Your booking is awaiting admin approval. You will be notified once reviewed.', color: '#fbbf24' },
  approved:        { icon: CheckCircle, text: 'Your ride has been approved. A driver will be assigned shortly.', color: '#4ade80' },
  driver_assigned: { icon: CarFront,    text: 'A driver has been assigned to your ride. Get ready!', color: '#60a5fa' },
  completed:       { icon: Check,       text: 'Your trip has been completed. Thank you for choosing YesCab!', color: '#4ade80' },
  rejected:        { icon: XCircle,     text: 'This booking was rejected by admin. Please contact support or create a new booking.', color: '#f87171' },
  cancelled:       { icon: Ban,         text: 'This booking was cancelled. You can create a new booking anytime.', color: '#9ca3af' },
}

export default function BookingHistoryPage() {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [filteredBookings, setFilteredBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedReceipt, setSelectedReceipt] = useState(null)
  const [cancellingId, setCancellingId] = useState(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(null)
  const [expandedTimeline, setExpandedTimeline] = useState(null)

  const [count, setCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)

  const fetchBookings = useCallback(async (page = 1) => {
    setLoading(true)
    setError('')
    try {
      const params = { page }
      if (statusFilter) params.status = statusFilter
      
      const res = await bookingsAPI.list(params)
      // DRF PageNumberPagination returns { count, next, previous, results }
      setBookings(res.data.results || [])
      setFilteredBookings(res.data.results || [])
      setCount(res.data.count || 0)
      setCurrentPage(page)
    } catch {
      setError('Failed to load your bookings. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  const handleCancelBooking = async (id) => {
    setCancellingId(id)
    try {
      await bookingsAPI.cancel(id)
      await fetchBookings()
      setShowCancelConfirm(null)
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel booking.')
    } finally {
      setCancellingId(null)
    }
  }

  useEffect(() => {
    fetchBookings(1)
  }, [fetchBookings, statusFilter])

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    })

  const formatTime = (timeStr) => {
    if (!timeStr) return '—'
    const [h, m] = timeStr.split(':')
    const d = new Date()
    d.setHours(Number(h), Number(m))
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
  }

  // Build simple timeline for a booking
  const getTimeline = (b) => {
    const events = [
      { label: 'Booking Created', time: b.created_at, active: true }
    ]
    const statusOrder = ['pending', 'approved', 'driver_assigned', 'completed']
    const idx = statusOrder.indexOf(b.status)

    if (b.status === 'cancelled') {
      events.push({ label: 'Cancelled', time: b.cancelled_at, active: true, terminal: true })
    } else if (b.status === 'rejected') {
      events.push({ label: 'Rejected', time: b.updated_at, active: true, terminal: true })
    } else {
      if (idx >= 1) events.push({ label: 'Approved', time: b.updated_at, active: true })
      else events.push({ label: 'Awaiting Approval', time: null, active: false })

      if (idx >= 2) events.push({ label: 'Driver Assigned', time: b.updated_at, active: true })
      else if (idx >= 1) events.push({ label: 'Assigning Driver', time: null, active: false })

      if (idx >= 3) events.push({ label: 'Completed', time: b.updated_at, active: true })
      else if (idx >= 1) events.push({ label: 'Pending Completion', time: null, active: false })
    }
    return events
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
              {count > 0
                ? `${count} booking${count > 1 ? 's' : ''} found`
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
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
            <button
              id="refresh-bookings-btn"
              className="btn btn-secondary btn-sm"
              onClick={() => fetchBookings(currentPage)}
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
            <button className="btn btn-ghost btn-sm" onClick={() => fetchBookings(currentPage)} style={{ marginLeft: '1rem' }}>
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
            {filteredBookings.map((b) => {
              const explanation = STATUS_EXPLANATIONS[b.status]
              const ExplIcon = explanation?.icon || Info
              const canReceipt = RECEIPT_ELIGIBLE.has(b.status)
              const canCancel = CANCELLABLE.has(b.status)
              const isTimelineOpen = expandedTimeline === b.id

              return (
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
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>

                  {/* Status Explanation */}
                  {explanation && (
                    <div className="booking-status-explain" style={{ borderLeftColor: explanation.color }}>
                      <ExplIcon size={16} color={explanation.color} />
                      <span>{explanation.text}</span>
                    </div>
                  )}

                  {/* Card Body */}
                  <div className="booking-card-body">
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

                  {/* Card Actions */}
                  <div className="booking-card-actions" style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
                    {canReceipt ? (
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                        onClick={() => setSelectedReceipt(b)}
                      >
                        <FileText size={14} /> View Receipt
                      </button>
                    ) : (
                      <span className="booking-receipt-hint">
                        {b.status === 'pending' && 'Receipt available after approval'}
                        {b.status === 'rejected' && 'No receipt for rejected bookings'}
                        {b.status === 'cancelled' && 'No receipt for cancelled bookings'}
                      </span>
                    )}

                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                      onClick={() => setExpandedTimeline(isTimelineOpen ? null : b.id)}
                    >
                      <Clock size={14} /> {isTimelineOpen ? 'Hide' : 'View'} Timeline
                    </button>

                    {canCancel && (
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--danger)', marginLeft: 'auto' }}
                        onClick={() => setShowCancelConfirm(b.id)}
                        disabled={cancellingId === b.id}
                      >
                        <Trash2 size={14} /> Cancel Ride
                      </button>
                    )}
                  </div>

                  {/* Inline Timeline */}
                  {isTimelineOpen && (
                    <div className="booking-inline-timeline">
                      {getTimeline(b).map((ev, i) => (
                        <div key={i} className={`inline-timeline-step ${ev.active ? 'active' : 'inactive'}`}>
                          <div className={`inline-timeline-dot ${ev.active ? 'active' : ''} ${ev.terminal ? 'terminal' : ''}`} />
                          <div className="inline-timeline-info">
                            <span className="inline-timeline-label">{ev.label}</span>
                            {ev.time && (
                              <span className="inline-timeline-time">
                                {new Date(ev.time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Notes */}
                  {b.notes && (
                    <div style={{ marginTop: '0.85rem', padding: '0.75rem 1rem', background: 'var(--surface-2)', borderRadius: 'var(--radius)', fontSize: '0.85rem', color: 'var(--text-muted)', borderLeft: '3px solid var(--border-active)' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>Notes: </span>
                      {b.notes}
                    </div>
                  )}

                  {/* Admin Note */}
                  {b.admin_note && (
                    <div style={{ marginTop: '0.85rem', padding: '0.75rem 1rem', background: 'rgba(255, 204, 0, 0.1)', borderRadius: 'var(--radius)', fontSize: '0.85rem', color: 'var(--text-muted)', borderLeft: '3px solid var(--primary)' }}>
                      <span style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>Admin Note: </span>
                      {b.admin_note}
                    </div>
                  )}
                </div>
              )
            })}
            
            <Pagination 
              count={count} 
              pageSize={50} 
              currentPage={currentPage} 
              onPageChange={(p) => fetchBookings(p)} 
            />
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      {selectedReceipt && (
        <BookingReceiptModal
          booking={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}

      {/* Cancellation Confirmation Modal */}
      {showCancelConfirm && (
        <div className="modal-overlay" onClick={() => setShowCancelConfirm(null)}>
          <div className="modal-content animate-scale" style={{ maxWidth: '400px', textAlign: 'center', padding: '2rem' }} onClick={e => e.stopPropagation()}>
            <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}><ShieldAlert size={48} /></div>
            <h3 style={{ marginBottom: '0.5rem' }}>Cancel Booking?</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
              Are you sure you want to cancel this ride? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setShowCancelConfirm(null)}
              >
                No, Keep it
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1, backgroundColor: 'var(--danger)', border: 'none' }}
                onClick={() => handleCancelBooking(showCancelConfirm)}
                disabled={cancellingId !== null}
              >
                {cancellingId ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
