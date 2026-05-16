import React from 'react'
import { X, Printer, Download, Clock, MapPin, User, Calendar, Tag } from 'lucide-react'
import StatusBadge from './StatusBadge'

export default function BookingReceiptModal({ booking, onClose }) {
  if (!booking) return null

  const b = booking

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

  const formatTime = (timeStr) => {
    if (!timeStr) return '—'
    const [h, m] = timeStr.split(':')
    const d = new Date()
    d.setHours(Number(h), Number(m))
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content receipt-modal animate-scale" 
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '500px' }}
      >
        {/* Receipt Header */}
        <div className="receipt-header">
          <div className="receipt-brand">
            <span className="brand-yes">Yes</span><span className="brand-cab">Cab</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="receipt-body">
          <div className="receipt-title-wrap">
            <h2 className="receipt-title">Booking Receipt</h2>
            <div className="receipt-status">
              <StatusBadge status={b.status} />
            </div>
          </div>

          <div className="receipt-id">ID: #{b.id}</div>

          <div className="receipt-grid">
            <div className="receipt-item">
              <span className="receipt-label"><User size={14} /> Passenger</span>
              <span className="receipt-value">{b.name}</span>
            </div>
            <div className="receipt-item">
              <span className="receipt-label"><Calendar size={14} /> Date & Time</span>
              <span className="receipt-value">{formatDate(b.date)} at {formatTime(b.time)}</span>
            </div>
            <div className="receipt-item">
              <span className="receipt-label"><Tag size={14} /> Trip Type</span>
              <span className="receipt-value">{b.trip_type_display}</span>
            </div>
          </div>

          <div className="receipt-divider" />

          <div className="receipt-route">
            <div className="receipt-route-step">
              <div className="route-dot pickup" />
              <div className="route-info">
                <span className="route-label">Pickup Location</span>
                <span className="route-value">{b.pickup_address || b.from_location}</span>
              </div>
            </div>
            <div className="receipt-route-line" />
            <div className="receipt-route-step">
              <div className="route-dot drop" />
              <div className="route-info">
                <span className="route-label">Drop Location</span>
                <span className="route-value">{b.drop_address || b.to_location}</span>
              </div>
            </div>
          </div>

          <div className="receipt-divider" />

          <div className="receipt-footer-info">
            <div className="receipt-footer-row">
              <span>Passengers</span>
              <span>{b.num_people}</span>
            </div>
            <div className="receipt-footer-row">
              <span>Contact Phone</span>
              <span>{b.phone_number}</span>
            </div>
            <div className="receipt-footer-row">
              <span>Booked on</span>
              <span>{new Date(b.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </div>
          </div>

          {b.admin_note && (
            <div className="receipt-note">
              <strong>Admin Note:</strong> {b.admin_note}
            </div>
          )}
        </div>

        <div className="receipt-actions no-print">
          <button className="btn btn-secondary btn-sm" onClick={handlePrint}>
            <Printer size={16} /> Print
          </button>
          <button className="btn btn-primary btn-sm" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
