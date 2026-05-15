import { useState, useEffect, useCallback } from 'react'
import { adminAPI } from '../api/axios'
import Navbar from '../components/Navbar'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import BookingCard from '../components/BookingCard'
import BookingDetailModal from '../components/BookingDetailModal'
import { Users, Package, Clock, CheckCircle, XCircle, Search, RefreshCw, Trash2, Mail, Phone, Calendar, AlertTriangle, CarFront, Check } from 'lucide-react'

// ── Sub-components ──────────────────────────────────────────

function StatsBar({ bookings, users }) {
  const total = bookings.length
  const pending = bookings.filter((b) => b.status === 'pending').length
  const approved = bookings.filter((b) => b.status === 'approved').length
  const assigned = bookings.filter((b) => b.status === 'driver_assigned').length
  const completed = bookings.filter((b) => b.status === 'completed').length
  const rejected = bookings.filter((b) => b.status === 'rejected').length

  return (
    <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
      <div className="stat-card">
        <span className="stat-icon"><Users size={20} color="var(--text-muted)" /></span>
        <span className="stat-value" style={{ fontSize: '1.5rem' }}>{users.length}</span>
        <span className="stat-label">Users</span>
      </div>
      <div className="stat-card">
        <span className="stat-icon"><Clock size={20} color="#fbbf24" /></span>
        <span className="stat-value" style={{ color: '#fbbf24', fontSize: '1.5rem' }}>{pending}</span>
        <span className="stat-label">Pending</span>
      </div>
      <div className="stat-card">
        <span className="stat-icon"><CheckCircle size={20} color="var(--success)" /></span>
        <span className="stat-value" style={{ color: 'var(--success)', fontSize: '1.5rem' }}>{approved}</span>
        <span className="stat-label">Approved</span>
      </div>
      <div className="stat-card">
        <span className="stat-icon"><CarFront size={20} color="#60a5fa" /></span>
        <span className="stat-value" style={{ color: '#60a5fa', fontSize: '1.5rem' }}>{assigned}</span>
        <span className="stat-label">Assigned</span>
      </div>
      <div className="stat-card">
        <span className="stat-icon"><Check size={20} color="var(--success)" /></span>
        <span className="stat-value" style={{ color: 'var(--success)', fontSize: '1.5rem' }}>{completed}</span>
        <span className="stat-label">Done</span>
      </div>
      <div className="stat-card">
        <span className="stat-icon"><XCircle size={20} color="var(--danger)" /></span>
        <span className="stat-value" style={{ color: 'var(--danger)', fontSize: '1.5rem' }}>{rejected}</span>
        <span className="stat-label">Rejected</span>
      </div>
    </div>
  )
}

// ── Bookings Tab (Card-based) ──────────────────────────────────

function BookingsTab({ bookings, loading, onStatusChange, onRefresh }) {
  const [statusFilter, setStatusFilter] = useState('')
  const [tripFilter, setTripFilter] = useState('')
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const [selectedBooking, setSelectedBooking] = useState(null) // for modal

  const filtered = bookings.filter((b) => {
    const matchStatus = !statusFilter || b.status === statusFilter
    const matchTrip = !tripFilter || b.trip_type === tripFilter
    const matchSearch =
      !search ||
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.user_info?.email.toLowerCase().includes(search.toLowerCase()) ||
      b.from_location.toLowerCase().includes(search.toLowerCase()) ||
      b.to_location.toLowerCase().includes(search.toLowerCase()) ||
      (b.phone_number || '').includes(search)
    return matchStatus && matchTrip && matchSearch
  })

  const handleStatus = async (bookingId, newStatus) => {
    setActionLoading(bookingId)
    try {
      await adminAPI.updateBookingStatus(bookingId, { status: newStatus })
      onStatusChange(bookingId, newStatus)
    } catch (err) {
      alert(
        err.response?.data?.error ||
          `Failed to ${newStatus} booking #${bookingId}. Please try again.`
      )
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div>
      {/* Filters */}
      <div className="filter-bar">
        <input
          id="admin-booking-search"
          type="text"
          className="filter-input"
          placeholder="Search name, email, phone, location…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          id="admin-status-filter"
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="driver_assigned">Driver Assigned</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          id="admin-trip-filter"
          className="filter-select"
          value={tripFilter}
          onChange={(e) => setTripFilter(e.target.value)}
        >
          <option value="">All Trip Types</option>
          <option value="airport_pickup">Airport Pickup</option>
          <option value="airport_drop">Airport Drop</option>
          <option value="tour_package">Tour Package</option>
          <option value="taxi_booking">Taxi Booking</option>
        </select>
        <button className="btn btn-secondary btn-sm" onClick={onRefresh} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Count */}
      <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem', marginBottom: '1rem' }}>
        Showing <strong style={{ color: 'var(--text)' }}>{filtered.length}</strong> of{' '}
        {bookings.length} bookings
      </p>

      {loading ? (
        <LoadingSpinner text="Loading bookings…" />
        ) : filtered.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-icon"><Search size={32} color="var(--text-muted)" /></div>
            <div className="empty-title">No bookings found</div>
            <p className="empty-text">Try adjusting your search or filters.</p>
          </div>
        ) : (
        <div className="booking-cards-grid">
          {filtered.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              actionLoading={actionLoading}
              onApprove={(id) => handleStatus(id, 'approved')}
              onReject={(id) => handleStatus(id, 'rejected')}
              onReset={(id) => handleStatus(id, 'pending')}
              onView={setSelectedBooking}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <BookingDetailModal
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        isAdmin={true}
        onUpdate={async (status, note) => {
          await adminAPI.updateBookingStatus(selectedBooking.id, { status, admin_note: note })
          onStatusChange(selectedBooking.id, status, note)
          setSelectedBooking(null)
        }}
      />
    </div>
  )
}

// ── Users Tab ──────────────────────────────────────────

function UsersTab({ users, loading, onUsersChange, onRefresh }) {
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null) // user id pending delete confirm

  const filtered = users.filter(
    (u) =>
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.includes(search) ||
      u.place.toLowerCase().includes(search.toLowerCase())
  )

  const toggleAdmin = async (user) => {
    setActionLoading(user.id)
    try {
      await adminAPI.updateUser(user.id, { is_admin: !user.is_admin })
      onUsersChange(
        users.map((u) =>
          u.id === user.id ? { ...u, is_admin: !user.is_admin } : u
        )
      )
    } catch {
      alert('Failed to update admin status.')
    } finally {
      setActionLoading(null)
    }
  }

  const toggleActive = async (user) => {
    setActionLoading(user.id + '_active')
    try {
      await adminAPI.updateUser(user.id, { is_active: !user.is_active })
      onUsersChange(
        users.map((u) =>
          u.id === user.id ? { ...u, is_active: !user.is_active } : u
        )
      )
    } catch {
      alert('Failed to update active status.')
    } finally {
      setActionLoading(null)
    }
  }

  const deleteUser = async (userId) => {
    setActionLoading(userId + '_del')
    try {
      await adminAPI.deleteUser(userId)
      onUsersChange(users.filter((u) => u.id !== userId))
      setConfirmDelete(null)
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete user.')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div>
      {/* Search */}
      <div className="filter-bar">
        <input
          id="admin-user-search"
          type="text"
          className="filter-input"
          placeholder="Search by name, email, phone, city…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          id="admin-refresh-users"
          className="btn btn-secondary btn-sm"
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem', marginBottom: '1rem' }}>
        Showing <strong style={{ color: 'var(--text)' }}>{filtered.length}</strong> of{' '}
        {users.length} users
      </p>

      {loading ? (
        <LoadingSpinner text="Loading users…" />
        ) : filtered.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-icon"><Users size={32} color="var(--text-muted)" /></div>
            <div className="empty-title">No users found</div>
            <p className="empty-text">Try adjusting your search criteria.</p>
          </div>
        ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>City</th>
                <th>Joined</th>
                <th>Admin</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{u.id}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div className="avatar">
                        {u.name
                          .split(' ')
                          .slice(0, 2)
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>{u.email}</td>
                  <td style={{ fontSize: '0.83rem' }}>{u.phone}</td>
                  <td style={{ fontSize: '0.83rem' }}>{u.place}</td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(u.date_joined).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </td>
                  <td>
                    <button
                      id={`toggle-admin-${u.id}`}
                      className={`badge ${u.is_admin ? 'badge-approved' : 'badge-rejected'}`}
                      style={{ cursor: 'pointer', border: 'none', background: undefined }}
                      onClick={() => toggleAdmin(u)}
                      disabled={actionLoading === u.id}
                      title={u.is_admin ? 'Remove admin' : 'Make admin'}
                    >
                      {actionLoading === u.id ? (
                        <span className="spinner spinner-sm" />
                      ) : u.is_admin ? (
                        'Yes'
                      ) : (
                        'No'
                      )}
                    </button>
                  </td>
                  <td>
                    <button
                      id={`toggle-active-${u.id}`}
                      className={`badge ${u.is_active ? 'badge-approved' : 'badge-rejected'}`}
                      style={{ cursor: 'pointer', border: 'none' }}
                      onClick={() => toggleActive(u)}
                      disabled={actionLoading === u.id + '_active'}
                      title={u.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {actionLoading === u.id + '_active' ? (
                        <span className="spinner spinner-sm" />
                      ) : u.is_active ? (
                        'Active'
                      ) : (
                        'Inactive'
                      )}
                    </button>
                  </td>
                  <td>
                    {confirmDelete === u.id ? (
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button
                          className="btn btn-danger btn-sm"
                          title="Delete user permanently"
                          onClick={() => deleteUser(u.id)}
                          disabled={actionLoading === u.id + '_del'}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                        >
                          {actionLoading === u.id + '_del' ? (
                            <span className="spinner spinner-sm" />
                          ) : (
                            'Confirm'
                          )}
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setConfirmDelete(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        id={`delete-user-${u.id}`}
                        className="btn btn-danger btn-sm"
                        onClick={() => setConfirmDelete(u.id)}
                        title="Delete user"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Main Admin Dashboard ──────────────────────────────────────────

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('bookings')
  const [bookings, setBookings] = useState([])
  const [users, setUsers] = useState([])
  const [bookingsLoading, setBookingsLoading] = useState(true)
  const [usersLoading, setUsersLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')

  const fetchBookings = useCallback(async () => {
    setBookingsLoading(true)
    try {
      const res = await adminAPI.listAllBookings()
      setBookings(res.data)
    } catch {
      setFetchError('Failed to load bookings.')
    } finally {
      setBookingsLoading(false)
    }
  }, [])

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true)
    try {
      const res = await adminAPI.listUsers()
      setUsers(res.data)
    } catch {
      setFetchError('Failed to load users.')
    } finally {
      setUsersLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBookings()
    fetchUsers()
  }, [fetchBookings, fetchUsers])

  // Optimistic status update — avoids full refetch
  const handleStatusChange = useCallback((bookingId, newStatus, note = null) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          const updated = { ...b, status: newStatus, status_display: capitalize(newStatus) }
          if (note !== null) updated.admin_note = note
          return updated
        }
        return b
      })
    )
  }, [])

  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1)

  return (
    <>
      <Navbar />
      <div className="page-wrapper">
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">
            Manage bookings, approve or reject requests, and oversee all users.
          </p>
        </div>

        {fetchError && (
          <div className="alert alert-error mb-2" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <AlertTriangle size={18} /> {fetchError}
          </div>
        )}

        {/* Stats Bar */}
        <StatsBar
          bookings={bookings}
          users={users}
        />

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Package size={18} /> Manage Bookings
          </button>
          <button
            className={`tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Users size={18} /> Manage Users
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'bookings' ? (
          <BookingsTab
            bookings={bookings}
            loading={bookingsLoading}
            onStatusChange={handleStatusChange}
            onRefresh={fetchBookings}
          />
        ) : (
          <UsersTab
            users={users}
            loading={usersLoading}
            onUsersChange={setUsers}
            onRefresh={fetchUsers}
          />
        )}
      </div>
    </>
  )
}
