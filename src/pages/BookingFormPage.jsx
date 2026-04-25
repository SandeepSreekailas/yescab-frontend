import { useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { bookingsAPI } from '../api/axios'
import Navbar from '../components/Navbar'
import LocationPicker from '../components/LocationPicker'

const TRIP_TYPES = [
  { value: 'airport_pickup', label: '✈️ Airport Pickup' },
  { value: 'airport_drop', label: '🛫 Airport Drop' },
  { value: 'tour_package', label: '🗺️ Tour Package' },
  { value: 'taxi_booking', label: '🚕 Taxi Booking' },
]

const TODAY = new Date().toISOString().split('T')[0]

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

  // Pre-fill trip type if navigated from service card
  const [form, setForm] = useState(initialForm(location.state?.tripType ?? ''))
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  // ── Map data (kept in sync with form via callbacks) ──
  const [pickupCoords, setPickupCoords] = useState(null)
  const [dropCoords, setDropCoords] = useState(null)

  const handlePickupChange = useCallback(({ lat, lng, address }) => {
    setPickupCoords({ lat, lng })
    setForm((prev) => ({
      ...prev,
      pickup_lat: lat,
      pickup_lng: lng,
      pickup_address: address,
      from_location: address, // Auto-fill the text field from the map
    }))
    setErrors((prev) => ({ ...prev, from_location: '', pickup_lat: '' }))
    setApiError('')
    setSuccess('')
  }, [])

  const handleDropChange = useCallback(({ lat, lng, address }) => {
    setDropCoords({ lat, lng })
    setForm((prev) => ({
      ...prev,
      drop_lat: lat,
      drop_lng: lng,
      drop_address: address,
      to_location: address, // Auto-fill the text field from the map
    }))
    setErrors((prev) => ({ ...prev, to_location: '', drop_lat: '' }))
    setApiError('')
    setSuccess('')
  }, [])

  const validate = () => {
    const errs = {}
    if (!form.trip_type) errs.trip_type = 'Please select a trip type.'
    if (!form.name.trim()) errs.name = 'Passenger name is required.'

    if (!form.phone_number.trim()) errs.phone_number = 'Phone number is required.'
    else {
      const cleaned = form.phone_number.replace(/[\s\-\(\)\+]/g, '')
      if (!/^\d{7,15}$/.test(cleaned)) errs.phone_number = 'Enter a valid phone number (7–15 digits).'
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

    if (!form.date) errs.date = 'Travel date is required.'
    else if (form.date < TODAY) errs.date = 'Date cannot be in the past.'

    if (!form.time) errs.time = 'Pickup time is required.'

    return errs
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
    setApiError('')
    setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }

    setLoading(true)
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
      await bookingsAPI.create(payload)
      setSuccess('Booking submitted! We will review and confirm shortly.')
      setForm(initialForm())
      setPickupCoords(null)
      setDropCoords(null)
      setErrors({})
      // Auto-redirect after 2.5 s
      setTimeout(() => navigate('/my-bookings'), 2500)
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
            <p className="page-subtitle">Select your locations on the map, then fill in the details.</p>
          </div>

          {apiError && (
            <div className="alert alert-error mb-2">⚠️ {apiError}</div>
          )}
          {success && (
            <div className="alert alert-success mb-2">
              ✅ {success} Redirecting to your bookings…
            </div>
          )}

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

            {/* ── Map Location Picker ── */}
            <div className="mb-2">
              <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                📍 Select Locations on Map
              </label>
              <LocationPicker
                pickupCoords={pickupCoords}
                dropCoords={dropCoords}
                pickupAddress={form.pickup_address}
                dropAddress={form.drop_address}
                onPickupChange={handlePickupChange}
                onDropChange={handleDropChange}
              />
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
                <input
                  id="phone-number"
                  type="tel"
                  name="phone_number"
                  className="form-control"
                  placeholder="e.g. +91 9876543210"
                  value={form.phone_number}
                  onChange={handleChange}
                />
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

            {/* From & To — manual text input (auto-filled by map or typed manually) */}
            <div className="form-grid mb-2">
              <div className="form-group">
                <label className="form-label" htmlFor="from-location">
                  Pickup Location
                  {form.pickup_lat && (
                    <span style={{ color: 'var(--success)', fontWeight: 400, textTransform: 'none', marginLeft: '0.35rem' }}>
                      ✓ Map selected
                    </span>
                  )}
                </label>
                <input
                  id="from-location"
                  type="text"
                  name="from_location"
                  className="form-control"
                  placeholder="e.g. Cochin Airport"
                  value={form.from_location}
                  onChange={handleChange}
                />
                {errors.from_location && <span className="form-error">{errors.from_location}</span>}
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="to-location">
                  Drop Location
                  {form.drop_lat && (
                    <span style={{ color: 'var(--success)', fontWeight: 400, textTransform: 'none', marginLeft: '0.35rem' }}>
                      ✓ Map selected
                    </span>
                  )}
                </label>
                <input
                  id="to-location"
                  type="text"
                  name="to_location"
                  className="form-control"
                  placeholder="e.g. Marine Drive, Kochi"
                  value={form.to_location}
                  onChange={handleChange}
                />
                {errors.to_location && <span className="form-error">{errors.to_location}</span>}
              </div>
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
                  min={TODAY}
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
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner spinner-sm" /> Submitting…
                </>
              ) : (
                '📨 Submit Booking'
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
