import { useState, useEffect, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// ── Fix Leaflet default icon paths broken by bundlers ──
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// ── Custom Marker Icons ──
const pickupIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const dropIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

// ── Nominatim reverse geocoder ──
const reverseGeocode = async (lat, lng) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    )
    if (!res.ok) throw new Error('Geocoding request failed')
    const data = await res.json()
    return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  }
}

// ── Sub-component: recenter map when user position changes ──
function RecenterMap({ center }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.flyTo(center, 14, { duration: 1.2 })
  }, [center, map])
  return null
}

// ── Sub-component: handle map click events ──
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => onMapClick(e.latlng),
  })
  return null
}

/**
 * LocationPicker
 *
 * Props:
 *   pickupCoords: { lat, lng } | null
 *   dropCoords:   { lat, lng } | null
 *   pickupAddress: string
 *   dropAddress:   string
 *   onPickupChange: ({ lat, lng, address }) => void
 *   onDropChange:   ({ lat, lng, address }) => void
 */
export default function LocationPicker({
  pickupCoords,
  dropCoords,
  pickupAddress,
  dropAddress,
  onPickupChange,
  onDropChange,
}) {
  const [mode, setMode] = useState('pickup') // 'pickup' | 'drop'
  const [center, setCenter] = useState([10.8505, 76.2711]) // Default: Kerala, India
  const [geoLoading, setGeoLoading] = useState(false)
  const [reverseLoading, setReverseLoading] = useState(false)
  const [geoError, setGeoError] = useState('')
  const initialLocated = useRef(false)

  // ── Get user's current location on mount ──
  useEffect(() => {
    if (initialLocated.current) return
    initialLocated.current = true

    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.')
      return
    }

    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenter([pos.coords.latitude, pos.coords.longitude])
        setGeoLoading(false)
      },
      () => {
        setGeoError('Location access denied. Using default map center.')
        setGeoLoading(false)
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    )
  }, [])

  // ── Handle map click → set marker + reverse geocode ──
  const handleMapClick = useCallback(
    async (latlng) => {
      const { lat, lng } = latlng
      setReverseLoading(true)

      const address = await reverseGeocode(lat, lng)

      if (mode === 'pickup') {
        onPickupChange({ lat, lng, address })
      } else {
        onDropChange({ lat, lng, address })
      }

      setReverseLoading(false)
    },
    [mode, onPickupChange, onDropChange]
  )

  return (
    <div className="location-picker">
      {/* Mode Selector */}
      <div className="location-picker-header">
        <div className="tabs" style={{ marginBottom: 0 }}>
          <button
            type="button"
            id="mode-pickup"
            className={`tab ${mode === 'pickup' ? 'active' : ''}`}
            onClick={() => setMode('pickup')}
          >
            📍 Set Pickup
          </button>
          <button
            type="button"
            id="mode-drop"
            className={`tab ${mode === 'drop' ? 'active' : ''}`}
            onClick={() => setMode('drop')}
          >
            🏁 Set Drop
          </button>
        </div>
        <div className="location-picker-hint">
          {reverseLoading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="spinner spinner-sm" /> Fetching address…
            </span>
          ) : (
            <span>
              Click on the map to select your{' '}
              <strong style={{ color: mode === 'pickup' ? 'var(--success)' : 'var(--danger)' }}>
                {mode === 'pickup' ? 'pickup' : 'drop-off'}
              </strong>{' '}
              location
            </span>
          )}
        </div>
      </div>

      {/* Geolocation warnings */}
      {geoError && (
        <div className="alert alert-info" style={{ marginBottom: '0.75rem', fontSize: '0.82rem' }}>
          📍 {geoError}
        </div>
      )}

      {/* Map Container */}
      <div className="location-picker-map-wrap">
        {geoLoading ? (
          <div className="location-picker-map-placeholder">
            <div className="spinner" />
            <span style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Getting your location…
            </span>
          </div>
        ) : (
          <MapContainer
            center={center}
            zoom={13}
            scrollWheelZoom={true}
            style={{ width: '100%', height: '100%', borderRadius: 'var(--radius)' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <RecenterMap center={center} />
            <MapClickHandler onMapClick={handleMapClick} />

            {/* Pickup Marker */}
            {pickupCoords && (
              <Marker position={[pickupCoords.lat, pickupCoords.lng]} icon={pickupIcon}>
                <Popup>
                  <strong style={{ color: '#16a34a' }}>📍 Pickup</strong>
                  <br />
                  <span style={{ fontSize: '0.82rem' }}>{pickupAddress || 'Selected pickup location'}</span>
                </Popup>
              </Marker>
            )}

            {/* Drop Marker */}
            {dropCoords && (
              <Marker position={[dropCoords.lat, dropCoords.lng]} icon={dropIcon}>
                <Popup>
                  <strong style={{ color: '#dc2626' }}>🏁 Drop-off</strong>
                  <br />
                  <span style={{ fontSize: '0.82rem' }}>{dropAddress || 'Selected drop location'}</span>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        )}
      </div>

      {/* Selected Addresses Summary */}
      <div className="location-picker-addresses">
        <div className={`location-address-item ${pickupAddress ? 'filled' : ''}`}>
          <div className="location-address-dot pickup" />
          <div className="location-address-content">
            <span className="location-address-label">Pickup</span>
            <span className="location-address-text">
              {pickupAddress || 'Click on the map to select pickup…'}
            </span>
            {pickupCoords && (
              <span className="location-address-coords">
                {pickupCoords.lat.toFixed(5)}, {pickupCoords.lng.toFixed(5)}
              </span>
            )}
          </div>
        </div>
        <div className="location-address-divider" />
        <div className={`location-address-item ${dropAddress ? 'filled' : ''}`}>
          <div className="location-address-dot drop" />
          <div className="location-address-content">
            <span className="location-address-label">Drop-off</span>
            <span className="location-address-text">
              {dropAddress || 'Click on the map to select drop-off…'}
            </span>
            {dropCoords && (
              <span className="location-address-coords">
                {dropCoords.lat.toFixed(5)}, {dropCoords.lng.toFixed(5)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
