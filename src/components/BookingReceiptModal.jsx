import React, { useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, Printer, Download, Clock, MapPin, User, Calendar, Tag } from 'lucide-react'
import StatusBadge from './StatusBadge'

export default function BookingReceiptModal({ booking, onClose }) {
  if (!booking) return null

  const b = booking
  const modalRef = useRef(null)
  const receiptRef = useRef(null)
  const prevOverflowRef = useRef('')

  // Lock body scrolling while modal is open; restore on close/unmount
  useEffect(() => {
    prevOverflowRef.current = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflowRef.current || ''
    }
  }, [])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Auto-focus modal on open for accessibility
  useEffect(() => {
    modalRef.current?.focus()
  }, [])

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

  // Print: uses browser's native print dialog (user can "Save as PDF" from there)
  const handlePrint = () => {
    window.print()
  }

  // Download PDF: programmatically triggers print in "save as PDF" mode
  // Since browsers control the print dialog, this also uses window.print()
  // The @media print CSS ensures only the receipt renders cleanly
  const handleDownloadPDF = () => {
    window.print()
  }

  // Prevent scroll chaining from receipt body to background
  const handleContentScroll = useCallback((e) => {
    const el = e.currentTarget
    const atTop = el.scrollTop === 0
    const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 1

    if ((atTop && e.deltaY < 0) || (atBottom && e.deltaY > 0)) {
      e.preventDefault()
    }
  }, [])

  // Use a React Portal to render the modal directly as a child of <body>.
  // This is critical for print CSS: the rule `body > *:not(.receipt-print-root)`
  // hides #root and all page content, while this portal element remains visible.
  return createPortal(
    <div
      className="modal-overlay receipt-print-root"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Booking Receipt"
    >
      <div
        ref={modalRef}
        className="modal-content receipt-modal animate-scale"
        onClick={e => e.stopPropagation()}
        tabIndex={-1}
        style={{ maxWidth: '500px' }}
      >
        {/* Receipt Header — sticky at top */}
        <div className="receipt-header">
          <div className="receipt-brand">
            <span className="brand-yes">Yez</span><span className="brand-cab">Cabs</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close receipt">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable receipt content */}
        <div className="receipt-body" ref={receiptRef} onWheel={handleContentScroll}>
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

        {/* Sticky action buttons — always visible on screen, hidden in print */}
        <div className="receipt-actions no-print">
          <button className="btn btn-secondary btn-sm" onClick={handlePrint}>
            <Printer size={16} /> Print
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleDownloadPDF}>
            <Download size={16} /> Download PDF
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
