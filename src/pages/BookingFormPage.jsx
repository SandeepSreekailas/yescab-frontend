import { useState, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { bookingsAPI, authAPI } from '../api/axios'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import LocationInput from '../components/LocationInput'

import { 
  Plane, 
  PlaneTakeoff, 
  Map, 
  CarFront, 
  CheckCircle, 
  Send, 
  ArrowDownUp, 
  AlertCircle, 
  XCircle,
  FileText
} from 'lucide-react'
import BookingReceiptModal from '../components/BookingReceiptModal'

const TRIP_TYPES = [
  { value: 'airport_pickup', label: 'Airport Pickup' },
  { value: 'airport_drop', label: 'Airport Drop' },
  { value: 'tour_package', label: 'Tour Package' },
  { value: 'taxi_booking', label: 'Taxi Booking' },
]

// ── Date/time helpers (computed fresh to avoid stale values if page stays open) ──
const getToday = () => new Date().toISOString().split('T')[0]

const getMaxDate = () => {
  const d = new Date()
  d.setMonth(d.getMonth() + 6)
  return d.toISOString().split('T')[0]
}

// Returns current time as HH:MM string (rounded up to next minute for min-time UX)
const getCurrentTime = () => {
  const now = new Date()
  // Round up: if seconds > 0, bump minute by 1 so the user can't pick "right now"
  if (now.getSeconds() > 0) now.setMinutes(now.getMinutes() + 1)
  return now.toTimeString().slice(0, 5) // "HH:MM"
}

const initialForm = (tripType = '') => ({
  trip_type: tripType,
  name: '',
  phone_number: '',
  num_people: '',
  from_location: '',
  to_location: '',
  date: '',
  time: '',
  notes: '',
  // Map fields
  pickup_address: '',
  pickup_lat: null,
  pickup_lng: null,
  drop_address: '',
  drop_lat: null,
  drop_lng: null,
})

export default function BookingFormPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  // Pre-fill trip type if navigated from service card
  const [form, setForm] = useState(initialForm(location.state?.tripType ?? ''))
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)

  // Ref-based guard: prevents duplicate API calls even if React state batching is slow
  const isSubmittingRef = useRef(false)

  // ── Location change handlers (unified from LocationInput) ──
  const handlePickupChange = useCallback(({ address, latitude, longitude }) => {
    setForm((prev) => ({
      ...prev,
      from_location: address,
      pickup_address: address,
      pickup_lat: latitude,
      pickup_lng: longitude,
    }))
    setErrors((prev) => ({ ...prev, from_location: '' }))
    setApiError('')
    setSuccess('')
  }, [])

  const handleDropChange = useCallback(({ address, latitude, longitude }) => {
    setForm((prev) => ({
      ...prev,
      to_location: address,
      drop_address: address,
      drop_lat: latitude,
      drop_lng: longitude,
    }))
    setErrors((prev) => ({ ...prev, to_location: '' }))
    setApiError('')
    setSuccess('')
  }, [])

  // ── Swap pickup ↔ drop ──
  const handleSwapLocations = () => {
    setForm((prev) => ({
      ...prev,
      from_location: prev.to_location,
      to_location: prev.from_location,
      pickup_address: prev.drop_address,
      drop_address: prev.pickup_address,
      pickup_lat: prev.drop_lat,
      pickup_lng: prev.drop_lng,
      drop_lat: prev.pickup_lat,
      drop_lng: prev.pickup_lng,
    }))
    setErrors((prev) => ({ ...prev, from_location: '', to_location: '' }))
  }

  const validate = () => {
    const errs = {}
    const today = getToday()
    const maxDate = getMaxDate()
    const currentTime = getCurrentTime()

    if (!form.trip_type) errs.trip_type = 'Please select a trip type.'
    if (!form.name.trim()) errs.name = 'Passenger name is required.'

    if (!form.phone_number.trim()) {
      errs.phone_number = 'Phone number is required.'
    } else if (!/^[6-9]\d{9}$/.test(form.phone_number)) {
      errs.phone_number = 'Indian mobile numbers must be exactly 10 digits starting with 6, 7, 8, or 9.'
    }

    const people = Number(form.num_people)
    if (!form.num_people) errs.num_people = 'Number of passengers is required.'
    else if (!Number.isInteger(people) || people < 1) errs.num_people = 'Must be at least 1.'
    else if (people > 50) errs.num_people = 'Maximum 50 passengers per booking.'

    if (!form.from_location.trim()) errs.from_location = 'Pickup location is required.'
    else if (form.from_location.trim().length < 3) errs.from_location = 'Too short — at least 3 characters.'

    if (!form.to_location.trim()) errs.to_location = 'Drop location is required.'
    else if (form.to_location.trim().length < 3) errs.to_location = 'Too short — at least 3 characters.'
    else if (form.from_location.trim().toLowerCase() === form.to_location.trim().toLowerCase())
      errs.to_location = 'Pickup and drop locations cannot be the same.'

    // ── Date validation ──
    if (!form.date) {
      errs.date = 'Travel date is required.'
    } else if (form.date < today) {
      errs.date = 'Cannot select a past date.'
    } else if (form.date > maxDate) {
      errs.date = 'Booking allowed only within the next 6 months.'
    }

    // ── Time validation ──
    if (!form.time) {
      errs.time = 'Pickup time is required.'
    } else if (form.date) {
      const journeyDT = new Date(`${form.date}T${form.time}`)
      const minAllowedDT = new Date(new Date().getTime() + 60 * 60 * 1000)
      if (journeyDT < minAllowedDT) {
        errs.time = 'Bookings must be made at least 1 hour before journey time.'
      }
    }

    return errs
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    let finalValue = value

    if (name === 'phone_number') {
      finalValue = value.replace(/\D/g, '').slice(0, 10)
    }

    setForm((prev) => ({ ...prev, [name]: finalValue }))

    // Clear current field error
    const clearedErrors = { [name]: '' }

    // Cross-clear: changing date may make a previously-invalid time valid (and vice versa)
    if (name === 'date' && errors.time) clearedErrors.time = ''
    if (name === 'time' && errors.date) clearedErrors.date = ''

    setErrors((prev) => ({ ...prev, ...clearedErrors }))
    setApiError('')
    setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Guard: block if already submitting (ref is synchronous, immune to batching)
    if (isSubmittingRef.current) return

    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }

    isSubmittingRef.current = true
    setLoading(true)
    setSubmitted(false)
    setApiError('')
    setSuccess('')

    try {
      const payload = {
        trip_type: form.trip_type,
        name: form.name.trim(),
        phone_number: form.phone_number.trim(),
        num_people: Number(form.num_people),
        from_location: form.from_location.trim(),
        to_location: form.to_location.trim(),
        date: form.date,
        time: form.time,
        notes: form.notes || '',
        // Map coordinates — sent as null if user used manual input only
        pickup_address: form.pickup_address || null,
        pickup_lat: form.pickup_lat,
        pickup_lng: form.pickup_lng,
        drop_address: form.drop_address || null,
        drop_lat: form.drop_lat,
        drop_lng: form.drop_lng,
      }
      const res = await bookingsAPI.create(payload)
      const newBooking = res.data.booking
      setSuccess('Booking submitted! We will review and confirm shortly.')
      setSubmitted(true)
      // Save last booking details for receipt and WhatsApp
      setForm(prev => ({...initialForm(), _lastBooking: newBooking}))
      setErrors({})
      // No auto-redirect so they can click the WhatsApp button
    } catch (err) {
      const data = err.response?.data
      if (data) {
        // Map backend field errors
        const fieldMap = {}
        let generalError = ''
        Object.entries(data).forEach(([key, val]) => {
          const msg = Array.isArray(val) ? val[0] : val
          const knownFields = [
            'trip_type', 'name', 'phone_number', 'num_people', 'from_location',
            'to_location', 'date', 'time', 'notes',
            'pickup_address', 'pickup_lat', 'pickup_lng',
            'drop_address', 'drop_lat', 'drop_lng',
          ]
          if (knownFields.includes(key)) {
            fieldMap[key] = msg
          } else {
            generalError = msg
          }
        })
        if (Object.keys(fieldMap).length) setErrors(fieldMap)
        if (generalError) setApiError(generalError)
      } else {
        setApiError('Booking failed. Please try again.')
      }
      // Error path: release the guard so user can retry
      isSubmittingRef.current = false
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="page-wrapper">
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div className="mb-2">
            <h1 className="page-title">Book a Cab</h1>
            <p className="page-subtitle">Select your locations, then fill in the details.</p>
          </div>

          {/* Email verification gate */}
          {!user?.is_email_verified && (
            <div className="alert alert-error" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
              <p style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><AlertCircle size={18} /> Email verification required</p>
              <p style={{ fontSize: '0.88rem', marginBottom: '0.75rem' }}>
                Please verify your email address before making a booking. Check your inbox for the verification link.
              </p>
              <button
                className="btn btn-primary"
                style={{ fontSize: '0.82rem', padding: '0.4rem 1rem' }}
                onClick={async () => {
                  try {
                    await authAPI.resendVerification()
                    alert('Verification email sent! Check your inbox.')
                  } catch {
                    alert('Could not send email. Please try again later.')
                  }
                }}
              >
                Resend Verification Email
              </button>
            </div>
          )}

          {user?.is_email_verified === false ? null : (<>

          {/* Booking Warning System */}
          <div className="alert alert-info mb-2" style={{ borderLeft: '4px solid var(--info)', background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.95rem', color: 'var(--text)' }}>
              <AlertCircle size={16} color="var(--info)" /> Booking Guidelines
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.85rem', lineHeight: 1.6 }}>
              <li>Bookings must be placed <strong>at least 1 hour</strong> before journey time.</li>
              <li>Bookings are subject to vehicle availability.</li>
              <li>Unconfirmed bookings may be automatically rejected after 1 hour.</li>
            </ul>
          </div>

          {apiError && <div className="alert alert-error mb-2"><XCircle size={18} /> {apiError}</div>}
          
          {submitted ? (
            <div className="card animate-fadeup" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <CheckCircle size={56} color="var(--success)" />
              </div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text)' }}>Booking Received!</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                {success}
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                {import.meta.env.VITE_ADMIN_WHATSAPP_NUMBER ? (
                  <a 
                    href={`https://wa.me/${import.meta.env.VITE_ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi YesCab, I have successfully submitted a booking request for ${form._lastBooking?.date} from ${form._lastBooking?.from_location} to ${form._lastBooking?.to_location}.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{ backgroundColor: '#25D366', color: '#fff', border: 'none', width: '100%', maxWidth: '300px' }}
                  >
                    Notify on WhatsApp
                  </a>
                ) : (
                  <div className="alert alert-info" style={{ fontSize: '0.82rem', width: '100%', maxWidth: '300px', justifyContent: 'center' }}>
                    Admin contact details pending.
                  </div>
                )}
                
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setShowReceipt(true)}
                  style={{ width: '100%', maxWidth: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <FileText size={18} /> View Receipt
                </button>

                <button 
                  className="btn btn-ghost" 
                  onClick={() => navigate('/my-bookings')}
                  style={{ width: '100%', maxWidth: '300px' }}
                >
                  Go to My Bookings
                </button>
              </div>
            </div>
          ) : (
          <form className="card animate-fadeup" onSubmit={handleSubmit} noValidate>

            {/* Trip Type */}
            <div className="form-group mb-2">
              <label className="form-label" htmlFor="trip-type">Trip Type</label>
              <select
                id="trip-type"
                name="trip_type"
                className="form-control"
                value={form.trip_type}
                onChange={handleChange}
              >
                <option value="">— Select trip type —</option>
                {TRIP_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              {errors.trip_type && <span className="form-error">{errors.trip_type}</span>}
            </div>

            {/* ── Location Inputs with Swap ── */}
            <div className="mb-2">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <LocationInput
                  id="pickup-location"
                  label="Pickup Location"
                  placeholder="Search or pick a pickup location…"
                  value={form.from_location}
                  coords={form.pickup_lat != null ? { lat: form.pickup_lat, lng: form.pickup_lng } : null}
                  error={errors.from_location}
                  onChange={handlePickupChange}
                />

                {/* Swap button */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleSwapLocations}
                    style={{ alignSelf: 'center', margin: '0.25rem 0', borderRadius: 'var(--radius-full)', padding: '0.6rem' }}
                    title="Swap locations"
                    disabled={loading || submitted}
                  >
                    <ArrowDownUp size={16} />
                  </button>
                </div>

                <LocationInput
                  id="drop-location"
                  label="Drop Location"
                  placeholder="Search or pick a drop location…"
                  value={form.to_location}
                  coords={form.drop_lat != null ? { lat: form.drop_lat, lng: form.drop_lng } : null}
                  error={errors.to_location}
                  onChange={handleDropChange}
                />
              </div>
            </div>

            {/* Passenger Name & Phone Number */}
            <div className="form-grid mb-2">
              <div className="form-group">
                <label className="form-label" htmlFor="passenger-name">Passenger Name</label>
                <input
                  id="passenger-name"
                  type="text"
                  name="name"
                  className="form-control"
                  placeholder="Full name of lead passenger"
                  value={form.name}
                  onChange={handleChange}
                />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="phone-number">Phone Number</label>
                <div className="indian-phone-group">
                  <span className="indian-phone-prefix">+91</span>
                  <input
                    id="phone-number"
                    type="tel"
                    name="phone_number"
                    className="indian-phone-input"
                    placeholder="9876543210"
                    pattern="[6-9][0-9]{9}"
                    inputMode="numeric"
                    value={form.phone_number}
                    onChange={handleChange}
                  />
                </div>
                {errors.phone_number && <span className="form-error">{errors.phone_number}</span>}
              </div>
            </div>

            {/* Number of Passengers */}
            <div className="form-group mb-2">
              <label className="form-label" htmlFor="num-people">No. of Passengers</label>
              <input
                id="num-people"
                type="number"
                name="num_people"
                className="form-control"
                placeholder="e.g. 2"
                min="1"
                max="50"
                value={form.num_people}
                onChange={handleChange}
              />
              {errors.num_people && <span className="form-error">{errors.num_people}</span>}
            </div>

            {/* Date & Time */}
            <div className="form-grid mb-2">
              <div className="form-group">
                <label className="form-label" htmlFor="travel-date">Travel Date</label>
                <input
                  id="travel-date"
                  type="date"
                  name="date"
                  className="form-control"
                  min={getToday()}
                  max={getMaxDate()}
                  value={form.date}
                  onChange={handleChange}
                />
                {errors.date && <span className="form-error">{errors.date}</span>}
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="pickup-time">Pickup Time</label>
                <input
                  id="pickup-time"
                  type="time"
                  name="time"
                  className="form-control"
                  min={form.date === getToday() ? getCurrentTime() : undefined}
                  value={form.time}
                  onChange={handleChange}
                />
                {errors.time && <span className="form-error">{errors.time}</span>}
              </div>
            </div>

            {/* Notes */}
            <div className="form-group mb-2">
              <label className="form-label" htmlFor="booking-notes">
                Additional Notes <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>(optional)</span>
              </label>
              <textarea
                id="booking-notes"
                name="notes"
                className="form-control"
                placeholder="Any special instructions, landmarks, or requirements…"
                rows={3}
                value={form.notes}
                onChange={handleChange}
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Submit */}
            <button
              id="booking-submit-btn"
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading || submitted}
              style={submitted ? { background: 'var(--success)', borderColor: 'var(--success)' } : undefined}
            >
              {loading ? (
                <>
                  <span className="spinner spinner-sm" /> Booking…
                </>
              ) : submitted ? (
                <><CheckCircle size={18} /> Booked! Redirecting…</>
              ) : (
                <><Send size={18} /> Submit Booking</>
              )}
            </button>
          </form>
          )}
          </>)}
        </div>
      </div>

      {showReceipt && form._lastBooking && (
        <BookingReceiptModal 
          booking={form._lastBooking} 
          onClose={() => setShowReceipt(false)} 
        />
      )}
    </>
  )
}
