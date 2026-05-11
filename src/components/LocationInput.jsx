import { useState, useRef, useEffect, useCallback, memo, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Map as MapIcon, MapPin, Search, AlertTriangle, Check, X } from 'lucide-react'

// ── Scroll lock utility ──
// Centralized so every close path (confirm, cancel, Escape, overlay click) is safe.
function lockBodyScroll() {
  const prev = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  return prev
}

function unlockBodyScroll(prev) {
  document.body.style.overflow = prev || ''
}

// ── Leaflet icon fix for bundlers ──
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// ── Ernakulam bounding box ──
const ERNAKULAM_BOUNDS = {
  minLat: 9.7,
  maxLat: 10.2,
  minLng: 76.1,
  maxLng: 76.5,
}

// Nominatim viewbox param: west,north,east,south
const NOMINATIM_VIEWBOX = `${ERNAKULAM_BOUNDS.minLng},${ERNAKULAM_BOUNDS.maxLat},${ERNAKULAM_BOUNDS.maxLng},${ERNAKULAM_BOUNDS.minLat}`

const isInsideErnakulam = (lat, lng) =>
  lat >= ERNAKULAM_BOUNDS.minLat &&
  lat <= ERNAKULAM_BOUNDS.maxLat &&
  lng >= ERNAKULAM_BOUNDS.minLng &&
  lng <= ERNAKULAM_BOUNDS.maxLng

const BOUNDS_ERROR = 'Service available only in Ernakulam district.'

// ── Popular places (Ernakulam district) ──
const POPULAR_PLACES = [
  { name: 'Cochin International Airport', lat: 10.1520, lng: 76.4019, area: 'Nedumbassery' },
  { name: 'Kakkanad', lat: 10.0159, lng: 76.3419, area: 'Kochi' },
  { name: 'Edappally Junction', lat: 10.0261, lng: 76.3083, area: 'Kochi' },
  { name: 'Aluva Railway Station', lat: 10.1076, lng: 76.3516, area: 'Aluva' },
  { name: 'Fort Kochi', lat: 9.9647, lng: 76.2425, area: 'Kochi' },
  { name: 'Marine Drive', lat: 9.9816, lng: 76.2750, area: 'Kochi' },
  { name: 'Ernakulam South Railway Station', lat: 9.9681, lng: 76.2896, area: 'Kochi' },
  { name: 'Ernakulam Town', lat: 9.9816, lng: 76.2999, area: 'Kochi' },
  { name: 'Vyttila Hub', lat: 9.9672, lng: 76.3204, area: 'Kochi' },
  { name: 'Lulu Mall', lat: 10.0270, lng: 76.3087, area: 'Edappally' },
  { name: 'Infopark Kochi', lat: 10.0078, lng: 76.3570, area: 'Kakkanad' },
  { name: 'Kaloor', lat: 9.9944, lng: 76.2958, area: 'Kochi' },
  { name: 'Palarivattom', lat: 10.0063, lng: 76.3082, area: 'Kochi' },
  { name: 'MG Road Kochi', lat: 9.9751, lng: 76.2847, area: 'Kochi' },
  { name: 'Thripunithura', lat: 9.9462, lng: 76.3505, area: 'Kochi' },
  { name: 'North Paravur', lat: 10.1440, lng: 76.2275, area: 'Ernakulam' },
  { name: 'Angamaly', lat: 10.1960, lng: 76.3860, area: 'Ernakulam' },
  { name: 'Perumbavoor', lat: 10.1076, lng: 76.4747, area: 'Ernakulam' },
  { name: 'Mattancherry', lat: 9.9584, lng: 76.2595, area: 'Kochi' },
  { name: 'Cheranalloor', lat: 10.0135, lng: 76.3170, area: 'Kochi' },
  { name: 'Kalamassery', lat: 10.0555, lng: 76.3277, area: 'Kochi' },
  { name: 'Willingdon Island', lat: 9.9535, lng: 76.2686, area: 'Kochi' },
  { name: 'Kochi Metro - Aluva', lat: 10.1100, lng: 76.3520, area: 'Aluva' },
  { name: 'Tripunithura Palace', lat: 9.9450, lng: 76.3480, area: 'Thripunithura' },
]

// ── Nominatim API search (Ernakulam-restricted) ──
const searchCache = new Map()

const searchNominatim = async (query, abortSignal) => {
  const key = query.trim().toLowerCase()
  if (searchCache.has(key)) return searchCache.get(key)

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&viewbox=${NOMINATIM_VIEWBOX}&bounded=1&countrycodes=in&limit=6&addressdetails=1`
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'en' },
      signal: abortSignal,
    })
    if (!res.ok) return []
    const data = await res.json()

    const results = data.map((item) => ({
      name: item.display_name.split(',').slice(0, 3).join(', '),
      fullName: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      area: item.address?.county || item.address?.state_district || item.address?.state || '',
    }))

    if (searchCache.size > 50) searchCache.clear()
    searchCache.set(key, results)

    return results
  } catch (err) {
    if (err.name === 'AbortError') return null
    return []
  }
}

// ── Reverse geocode via Nominatim ──
const reverseGeocode = async (lat, lng) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    )
    if (!res.ok) throw new Error('Geocoding failed')
    const data = await res.json()
    return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  }
}

// ── Debounce utility ──
function useDebouncedCallback(fn, delay) {
  const timerRef = useRef(null)
  const fnRef = useRef(fn)
  fnRef.current = fn

  return useCallback((...args) => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => fnRef.current(...args), delay)
  }, [delay])
}

// ── Map sub-components (memoized to prevent re-renders) ──
const MapClickHandler = memo(function MapClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng) })
  return null
})

const RecenterMap = memo(function RecenterMap({ center }) {
  const map = useMap()
  const prevCenter = useRef(null)
  useEffect(() => {
    if (!center) return
    if (
      prevCenter.current &&
      prevCenter.current[0] === center[0] &&
      prevCenter.current[1] === center[1]
    ) return
    prevCenter.current = center
    map.flyTo(center, 14, { duration: 0.8 })
  }, [center, map])
  return null
})

// ── Custom marker icon (yellow for selection) ──
const selectionIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

/**
 * LocationInput — Smart location selector
 *
 * Props:
 *   id, label, placeholder, value, coords, error, onChange
 */
export default function LocationInput({
  id,
  label,
  placeholder = 'Search or select a location…',
  value = '',
  coords = null,
  error = '',
  onChange,
}) {
  const [query, setQuery] = useState(value)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showMapModal, setShowMapModal] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)
  const [localError, setLocalError] = useState('')

  // ── Autocomplete state ──
  const [apiResults, setApiResults] = useState([])
  const [apiLoading, setApiLoading] = useState(false)
  const [hasSelected, setHasSelected] = useState(!!coords)
  const abortRef = useRef(null)

  // ── Map modal state — stored in refs to avoid stale closures ──
  // FIX: Using refs for map modal data eliminates the stale-closure bug
  // that caused confirmMapSelection to read empty mapAddress.
  const mapMarkerRef = useRef(null)
  const mapAddressRef = useRef('')
  const [mapMarkerDisplay, setMapMarkerDisplay] = useState(null)  // only for rendering
  const [mapAddressDisplay, setMapAddressDisplay] = useState('')   // only for rendering
  const [mapBoundsError, setMapBoundsError] = useState('')
  const [reverseLoading, setReverseLoading] = useState(false)
  const geocodeRequestId = useRef(0)  // FIX: tracks the latest geocode request

  const wrapperRef = useRef(null)
  const inputRef = useRef(null)

  // Keep local query in sync with parent value
  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    setHasSelected(!!coords)
  }, [coords])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Filter popular places based on query ──
  const filteredPopular = useMemo(() => {
    if (query.trim().length === 0) return POPULAR_PLACES
    const q = query.toLowerCase()
    return POPULAR_PLACES.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      p.area.toLowerCase().includes(q)
    )
  }, [query])

  // ── Debounced Nominatim search ──
  const debouncedSearch = useDebouncedCallback(async (searchQuery) => {
    const trimmed = searchQuery.trim()
    if (trimmed.length < 2) {
      setApiResults([])
      setApiLoading(false)
      return
    }

    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    setApiLoading(true)
    const results = await searchNominatim(trimmed, abortRef.current.signal)

    if (results === null) return
    setApiResults(results)
    setApiLoading(false)
  }, 400)

  // ── Input handlers ──
  const handleInputChange = useCallback((e) => {
    const val = e.target.value
    setQuery(val)
    setShowDropdown(true)
    setLocalError('')
    setHasSelected(false)

    onChange({
      address: val,
      latitude: null,
      longitude: null,
      source: 'custom',
    })

    debouncedSearch(val)
  }, [onChange, debouncedSearch])

  const handleSelectApiResult = useCallback((result) => {
    setQuery(result.name)
    setShowDropdown(false)
    setApiResults([])
    setLocalError('')
    setHasSelected(true)
    onChange({
      address: result.name,
      latitude: result.lat,
      longitude: result.lng,
      source: 'autocomplete',
    })
  }, [onChange])

  const handleSelectPlace = useCallback((place) => {
    setQuery(place.name)
    setShowDropdown(false)
    setApiResults([])
    setLocalError('')
    setHasSelected(true)
    onChange({
      address: place.name,
      latitude: place.lat,
      longitude: place.lng,
      source: 'dropdown',
    })
  }, [onChange])

  const handleInputFocus = useCallback(() => {
    setShowDropdown(true)
  }, [])

  const handleInputKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      setShowDropdown(false)
      inputRef.current?.blur()
    }
  }, [])

  const handleClear = useCallback(() => {
    setQuery('')
    setShowDropdown(false)
    setApiResults([])
    setLocalError('')
    setHasSelected(false)
    onChange({ address: '', latitude: null, longitude: null, source: 'custom' })
    inputRef.current?.focus()
  }, [onChange])

  const handleInputBlur = useCallback(() => {
    setTimeout(() => {
      if (query.trim().length >= 3 && !hasSelected && !coords) {
        setLocalError('Please select a location from suggestions, popular places, or the map.')
      }
    }, 200)
  }, [query, hasSelected, coords])

  // ── Use Current Location (with bounds check) ──
  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) return
    setGeoLoading(true)
    setLocalError('')

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords

        if (!isInsideErnakulam(latitude, longitude)) {
          setGeoLoading(false)
          setLocalError(BOUNDS_ERROR)
          return
        }

        const address = await reverseGeocode(latitude, longitude)
        setQuery(address)
        setShowDropdown(false)
        setHasSelected(true)
        onChange({ address, latitude, longitude, source: 'map' })
        setGeoLoading(false)
      },
      () => {
        setGeoLoading(false)
        setLocalError('Location access denied. Please allow location access.')
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    )
  }, [onChange])

  // ═══════════════════════════════════════════
  //  Map modal handlers
  // ═══════════════════════════════════════════

  const openMapModal = useCallback(() => {
    const initial = coords ? [coords.lat, coords.lng] : null
    mapMarkerRef.current = initial
    mapAddressRef.current = coords ? value : ''
    setMapMarkerDisplay(initial)
    setMapAddressDisplay(coords ? value : '')
    setMapBoundsError('')
    setReverseLoading(false)
    geocodeRequestId.current = 0
    setShowMapModal(true)
  }, [coords, value])

  const handleMapClick = useCallback((latlng) => {
    const { lat, lng } = latlng

    if (!isInsideErnakulam(lat, lng)) {
      setMapBoundsError(BOUNDS_ERROR)
      return
    }

    setMapBoundsError('')

    const pos = [lat, lng]
    mapMarkerRef.current = pos
    mapAddressRef.current = ''
    setMapMarkerDisplay(pos)
    setMapAddressDisplay('')
    setReverseLoading(true)

    const thisRequestId = ++geocodeRequestId.current

    reverseGeocode(lat, lng).then((address) => {
      if (thisRequestId !== geocodeRequestId.current) return
      mapAddressRef.current = address
      setMapAddressDisplay(address)
      setReverseLoading(false)
    })
  }, [])

  // FIX: Force-restore body scroll on every close path as a safety net.
  // The useEffect cleanup inside MapPickerModal handles the normal case,
  // but this guarantees scroll is restored even if unmount is delayed.
  const confirmMapSelection = useCallback(() => {
    const marker = mapMarkerRef.current
    if (!marker) return

    const address = mapAddressRef.current || `${marker[0].toFixed(5)}, ${marker[1].toFixed(5)}`

    setQuery(address)
    setShowMapModal(false)
    setLocalError('')
    setHasSelected(true)
    setReverseLoading(false)

    // Safety net: restore scroll immediately (don't wait for unmount)
    unlockBodyScroll('')

    onChange({
      address,
      latitude: marker[0],
      longitude: marker[1],
      source: 'map',
    })
  }, [onChange])

  const closeMapModal = useCallback(() => {
    setShowMapModal(false)
    setMapBoundsError('')
    setReverseLoading(false)
    geocodeRequestId.current = 0

    // Safety net: restore scroll immediately
    unlockBodyScroll('')
  }, [])

  // ── Computed display values ──
  const sourceTag = coords && value === query ? 'Location set' : null
  const displayError = error || localError

  const isTyping = query.trim().length >= 2
  const showApiSection = isTyping && (apiResults.length > 0 || apiLoading)
  const showPopularSection = filteredPopular.length > 0

  return (
    <div className="loc-input-wrapper" ref={wrapperRef}>
      {/* Label */}
      <label className="form-label" htmlFor={id}>
        {label}
        {sourceTag && (
          <span style={{
            color: 'var(--success)', fontWeight: 400,
            textTransform: 'none', marginLeft: '0.35rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem'
          }}>
            <Check size={12} /> {sourceTag}
          </span>
        )}
      </label>

      {/* Input row */}
      <div className="loc-input-row">
        <div className="loc-input-field-wrap">
          <input
            ref={inputRef}
            id={id}
            type="text"
            className="form-control loc-input-field"
            placeholder={placeholder}
            value={query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleInputKeyDown}
            onBlur={handleInputBlur}
            autoComplete="off"
          />
          {apiLoading && (
            <span className="loc-input-loading">
              <span className="spinner spinner-sm" />
            </span>
          )}
          {query && !apiLoading && (
            <button
              type="button"
              className="loc-input-clear"
              onClick={handleClear}
              title="Clear"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Action buttons */}
        <button
          type="button"
          className="btn btn-secondary btn-sm loc-input-btn"
          onClick={openMapModal}
          title="Pick on map"
        >
          <MapIcon size={18} />
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm loc-input-btn"
          onClick={handleUseCurrentLocation}
          disabled={geoLoading}
          title="Use current location"
        >
          {geoLoading ? <span className="spinner spinner-sm" /> : <MapPin size={18} />}
        </button>
      </div>

      {/* Error */}
      {displayError && <span className="form-error">{displayError}</span>}

      {/* ── Unified Dropdown ── */}
      {showDropdown && (
        <div className="loc-dropdown">

          {/* API autocomplete results */}
          {showApiSection && (
            <>
              <div className="loc-dropdown-header" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Search size={14} /> Search Results
                {apiLoading && <span className="spinner spinner-sm" style={{ marginLeft: '0.5rem', width: 12, height: 12 }} />}
              </div>
              {apiResults.map((result, idx) => (
                <button
                  key={`api-${idx}-${result.lat}`}
                  type="button"
                  className="loc-dropdown-item"
                  onClick={() => handleSelectApiResult(result)}
                >
                  <span className="loc-dropdown-icon" style={{ display: 'flex', alignItems: 'center' }}><Search size={14} /></span>
                  <div className="loc-dropdown-text">
                    <span className="loc-dropdown-name">{result.name}</span>
                    {result.area && <span className="loc-dropdown-area">{result.area}</span>}
                  </div>
                </button>
              ))}
              {apiResults.length === 0 && !apiLoading && (
                <div className="loc-dropdown-empty" style={{ borderBottom: '1px solid var(--border)' }}>
                  No results found in Ernakulam.
                </div>
              )}
            </>
          )}

          {/* Popular places */}
          {showPopularSection && (
            <>
              <div className="loc-dropdown-header">⭐ Popular Places</div>
              {filteredPopular.slice(0, isTyping ? 5 : 24).map((place) => (
                <button
                  key={place.name}
                  type="button"
                  className="loc-dropdown-item"
                  onClick={() => handleSelectPlace(place)}
                >
                  <span className="loc-dropdown-icon" style={{ display: 'flex', alignItems: 'center' }}><MapPin size={14} /></span>
                  <div className="loc-dropdown-text">
                    <span className="loc-dropdown-name">{place.name}</span>
                    <span className="loc-dropdown-area">{place.area}</span>
                  </div>
                </button>
              ))}
            </>
          )}

          {/* Nothing at all */}
          {!showApiSection && !showPopularSection && (
            <div className="loc-dropdown-empty">
              No matching locations found.
            </div>
          )}
        </div>
      )}

      {/* ── Map Modal ── */}
      {showMapModal && (
        <MapPickerModal
          initialCenter={
            mapMarkerDisplay || (coords ? [coords.lat, coords.lng] : [10.0159, 76.3419])
          }
          marker={mapMarkerDisplay}
          address={mapAddressDisplay}
          reverseLoading={reverseLoading}
          boundsError={mapBoundsError}
          onMapClick={handleMapClick}
          onConfirm={confirmMapSelection}
          onClose={closeMapModal}
        />
      )}
    </div>
  )
}


// ═══════════════════════════════════════════
//  Map Picker Modal (memoized)
//  FIX: Scroll lock now saves/restores the original overflow value.
//  Rendered via createPortal to document.body to avoid z-index stacking issues.
// ═══════════════════════════════════════════

const MapPickerModal = memo(function MapPickerModal({
  initialCenter,
  marker,
  address,
  reverseLoading,
  boundsError,
  onMapClick,
  onConfirm,
  onClose,
}) {
  const overlayRef = useRef(null)
  const prevOverflowRef = useRef('')

  // Close on Escape — use ref to always have the latest onClose
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onCloseRef.current() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, []) // stable — uses ref

  // FIX: Scroll lock — save original value and restore it exactly on unmount
  useEffect(() => {
    prevOverflowRef.current = lockBodyScroll()
    return () => {
      unlockBodyScroll(prevOverflowRef.current)
    }
  }, [])

  const modalContent = (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="modal-content loc-map-modal">
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><MapPin size={20} /> Pick Location</h2>
            <span className="modal-subtitle">
              Tap on the map to select a point in Ernakulam
            </span>
          </div>
          <button className="modal-close" onClick={onClose} title="Close" style={{ display: 'flex', alignItems: 'center' }}><X size={20} /></button>
        </div>

        {/* Map */}
        <div className="loc-map-container">
          <MapContainer
            center={initialCenter}
            zoom={13}
            scrollWheelZoom={true}
            style={{ width: '100%', height: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <RecenterMap center={initialCenter} />
            <MapClickHandler onMapClick={onMapClick} />
            {marker && <Marker position={marker} icon={selectionIcon} />}
          </MapContainer>
        </div>

        {/* Bounds error */}
        {boundsError && (
          <div className="loc-map-bounds-error" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <AlertTriangle size={18} /> {boundsError}
          </div>
        )}

        {/* Selected address bar */}
        <div className="loc-map-address-bar">
          {reverseLoading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
              <span className="spinner spinner-sm" /> Fetching address…
            </span>
          ) : marker ? (
            <div className="loc-map-address-text" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <MapPin size={16} color="var(--success)" />
              {address || `${marker[0].toFixed(5)}, ${marker[1].toFixed(5)}`}
            </div>
          ) : (
            <span style={{ color: 'var(--text-faint)' }}>Click on the map to select a location</span>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onConfirm}
            disabled={!marker || reverseLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Check size={16} /> Confirm Location
          </button>
        </div>
      </div>
    </div>
  )

  // Render via portal to document.body — avoids z-index/overflow issues from parent containers
  return createPortal(modalContent, document.body)
})
