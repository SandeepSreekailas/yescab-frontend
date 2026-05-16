import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { bookingsAPI } from '../api/axios'
import Navbar from '../components/Navbar'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import { CarFront, Plane, PlaneTakeoff, Map, Package, CheckCircle, XCircle, Clock, ClipboardList, MapPin } from 'lucide-react'

const SERVICES = [
  {
    type: 'airport_pickup',
    icon: <Plane size={32} color="var(--primary)" />,
    name: 'Airport Pickup',
    desc: 'We pick you up from the airport and drop you home safely.',
  },
  {
    type: 'airport_drop',
    icon: <PlaneTakeoff size={32} color="var(--primary)" />,
    name: 'Airport Drop',
    desc: 'Never miss a flight — reliable drop-off at any terminal.',
  },
  {
    type: 'tour_package',
    icon: <Map size={32} color="var(--primary)" />,
    name: 'Tour Package',
    desc: 'Curated sightseeing tours with a dedicated driver.',
  },
  {
    type: 'taxi_booking',
    icon: <CarFront size={32} color="var(--primary)" />,
    name: 'Taxi Booking',
    desc: 'On-demand local taxi for any destination in the city.',
  },
]

export default function DashboardPage() {
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [recentBookings, setRecentBookings] = useState([])
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      try {
        const res = await bookingsAPI.list()
        const bookings = res.data
        if (!isMounted) return
        setRecentBookings(bookings.slice(0, 3))
        setStats({
          total: bookings.length,
          pending: bookings.filter((b) => b.status === 'pending').length,
          approved: bookings.filter((b) => b.status === 'approved').length + bookings.filter((b) => b.status === 'driver_assigned').length,
          rejected: bookings.filter((b) => b.status === 'rejected').length,
          cancelled: bookings.filter((b) => b.status === 'cancelled').length,
        })
      } catch {
        // Non-critical — dashboard still renders without stats
      } finally {
        if (isMounted) setLoading(false)
      }
    })()
    return () => { isMounted = false }
  }, [])

  const handleServiceClick = (tripType) => {
    navigate('/book', { state: { tripType } })
  }

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <>
      <Navbar />
      <div className="page-wrapper">
        {/* Hero Banner */}
        <div className="dashboard-hero animate-fadeup">
          <h1 className="dashboard-hero-title">
            {greeting()}, <span>{user?.name?.split(' ')[0] ?? 'there'}</span>
          </h1>
          <p className="dashboard-hero-sub">
            {isAdmin 
              ? 'Welcome back! Head over to the Admin Dashboard to manage users and bookings.' 
              : 'Where are you headed today? Book your ride in under a minute.'}
          </p>
          {!isAdmin && (
            <div className="dashboard-actions">
              <button
                id="dashboard-book-now-btn"
                className="btn btn-primary btn-lg"
                onClick={() => navigate('/book')}
              >
                <CarFront size={20} /> Book a Cab Now
              </button>
              <Link to="/my-bookings" className="btn btn-secondary btn-lg">
                <ClipboardList size={20} /> View My Bookings
              </Link>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        {!isAdmin && (
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-icon"><Package size={24} color="var(--text-muted)" /></span>
              <span className="stat-value">{loading ? '—' : stats.total}</span>
              <span className="stat-label">Total Bookings</span>
            </div>
            <div className="stat-card">
              <span className="stat-icon"><Clock size={24} color="#fbbf24" /></span>
              <span className="stat-value" style={{ color: '#fbbf24' }}>
                {loading ? '—' : stats.pending}
              </span>
              <span className="stat-label">Pending</span>
            </div>
            <div className="stat-card">
              <span className="stat-icon"><CheckCircle size={24} color="var(--success)" /></span>
              <span className="stat-value" style={{ color: 'var(--success)' }}>
                {loading ? '—' : stats.approved}
              </span>
              <span className="stat-label">Approved</span>
            </div>
            <div className="stat-card">
              <span className="stat-icon"><XCircle size={24} color="var(--danger)" /></span>
              <span className="stat-value" style={{ color: 'var(--danger)' }}>
                {loading ? '—' : stats.rejected}
              </span>
              <span className="stat-label">Rejected</span>
            </div>
            <div className="stat-card">
              <span className="stat-icon"><Clock size={24} color="var(--text-faint)" /></span>
              <span className="stat-value" style={{ color: 'var(--text-faint)' }}>
                {loading ? '—' : stats.cancelled}
              </span>
              <span className="stat-label">Cancelled</span>
            </div>
          </div>
        )}

        {/* Service Cards */}
        {!isAdmin && (
          <>
            <div className="section-header mt-2">
              <h2 className="section-title">Our Services</h2>
            </div>
            <div className="service-grid">
              {SERVICES.map((s) => (
                <button
                  key={s.type}
                  id={`service-${s.type}`}
                  className="service-card"
                  onClick={() => handleServiceClick(s.type)}
                >
                  <div className="service-icon">{s.icon}</div>
                  <div className="service-name">{s.name}</div>
                  <div className="service-desc">{s.desc}</div>
                </button>
              ))}
            </div>

            {/* Recent Bookings */}
            <div className="section-header mt-3">
              <h2 className="section-title">Recent Bookings</h2>
              {recentBookings.length > 0 && (
                <Link to="/my-bookings" className="btn btn-ghost btn-sm">
                  View All →
                </Link>
              )}
            </div>

            {loading ? (
              <LoadingSpinner text="Loading your bookings…" />
            ) : recentBookings.length === 0 ? (
              <div className="empty-state-card" style={{ padding: '2.5rem', textAlign: 'center', background: 'var(--surface-2)', borderRadius: 'var(--radius)', border: '1px dashed var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                  <CarFront size={48} color="var(--text-faint)" />
                </div>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  No recent bookings. Start your journey with YesCab today!
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => navigate('/book')}
                >
                  Book Your First Cab
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {recentBookings.map((b) => (
                  <div key={b.id} className="booking-card">
                    <div className="booking-card-header">
                      <div>
                        <div className="booking-card-title">{b.trip_type_display}</div>
                        <div className="booking-card-id">Booking #{b.id}</div>
                      </div>
                      <StatusBadge status={b.status} />
                    </div>
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
                        <span className="booking-detail-label">Date</span>
                        <span className="booking-detail-value">
                          {new Date(b.date).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="booking-detail">
                        <span className="booking-detail-label">Passengers</span>
                        <span className="booking-detail-value">{b.num_people}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
