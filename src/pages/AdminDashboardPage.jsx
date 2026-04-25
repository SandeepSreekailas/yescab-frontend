import { useState, useEffect, useCallback } from 'react'
import { adminAPI } from '../api/axios'
import Navbar from '../components/Navbar'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'

// ── Sub-components ──────────────────────────────────────────

function StatsBar({ bookings, users }) {
  const total = bookings.length
  const pending = bookings.filter((b) => b.status === 'pending').length
  const approved = bookings.filter((b) => b.status === 'approved').length
  const rejected = bookings.filter((b) => b.status === 'rejected').length

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <span className="stat-icon">👥</span>
        <span className="stat-value">{users.length}</span>
        <span className="stat-label">Total Users</span>
      </div>
      <div className="stat-card">
        <span className="stat-icon">📦</span>
        <span className="stat-value">{total}</span>
        <span className="stat-label">Total Bookings</span>
      </div>
      <div className="stat-card">
        <span className="stat-icon">⏳</span>
        <span className="stat-value" style={{ color: '#fbbf24' }}>{pending}</span>
        <span className="stat-label">Pending</span>
      </div>
      <div className="stat-card">
        <span className="stat-icon">✅</span>
        <span className="stat-value" style={{ color: 'var(--success)' }}>{approved}</span>
        <span className="stat-label">Approved</span>
      </div>
      <div className="stat-card">
        <span className="stat-icon">❌</span>
        <span className="stat-value" style={{ color: 'var(--danger)' }}>{rejected}</span>
        <span className="stat-label">Rejected</span>
      </div>
    </div>
  )
}

// ── Bookings Tab ──────────────────────────────────────────

function BookingsTab({ bookings, loading, onStatusChange, onRefresh }) {
  const [statusFilter, setStatusFilter] = useState('')
  const [tripFilter, setTripFilter] = useState('')
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState(null) // booking id being acted on

  const filtered = bookings.filter((b) => {
    const matchStatus = !statusFilter || b.status === statusFilter
    const matchTrip = !tripFilter || b.trip_type === tripFilter
    const matchSearch =
      !search ||
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.user_info?.email.toLowerCase().includes(search.toLowerCase()) ||
      b.from_location.toLowerCase().includes(search.toLowerCase()) ||
      b.to_location.toLowerCase().includes(search.toLowerCase())
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

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    })

  const formatTime = (t) => {
    if (!t) return '—'
    const [h, m] = t.split(':')
    const d = new Date()
    d.setHours(Number(h), Number(m))
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
  }

  return (
    <div>
      {/* Filters */}
      <div className="filter-bar">
        <input
          id="admin-booking-search"
          type="text"
          className="filter-input"
          placeholder="🔍 Search by name, email, location…"
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
          <option value="pending">⏳ Pending</option>
          <option value="approved">✅ Approved</option>
          <option value="rejected">❌ Rejected</option>
        </select>
        <select
          id="admin-type-filter"
          className="filter-select"
          value={tripFilter}
          onChange={(e) => setTripFilter(e.target.value)}
        >
          <option value="">All Trip Types</option>
          <option value="airport_pickup">✈️ Airport Pickup</option>
          <option value="airport_drop">🛫 Airport Drop</option>
          <option value="tour_package">🗺️ Tour Package</option>
          <option value="taxi_booking">🚕 Taxi Booking</option>
        </select>
        <button
          id="admin-refresh-bookings"
          className="btn btn-secondary btn-sm"
          onClick={onRefresh}
          disabled={loading}
        >
          🔄 Refresh
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
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <div className="empty-title">No bookings match your filters.</div>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Customer</th>
                <th>Trip Type</th>
                <th>Passenger</th>
                <th>Phone</th>
                <th>Pax</th>
                <th>From → To</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id}>
                  <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>#{b.id}</td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                      {b.user_info?.name ?? '—'}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      {b.user_info?.email ?? '—'}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{b.trip_type_display}</td>
                  <td style={{ fontSize: '0.85rem' }}>{b.name}</td>
                  <td style={{ fontSize: '0.83rem', whiteSpace: 'nowrap' }}>{b.phone_number || '—'}</td>
                  <td style={{ textAlign: 'center' }}>{b.num_people}</td>
                  <td style={{ fontSize: '0.82rem' }}>
                    <div>{b.from_location}</div>
                    <div style={{ color: 'var(--text-muted)' }}>→ {b.to_location}</div>
                  </td>
                  <td style={{ fontSize: '0.83rem', whiteSpace: 'nowrap' }}>
                    {formatDate(b.date)}
                  </td>
                  <td style={{ fontSize: '0.83rem', whiteSpace: 'nowrap' }}>
                    {formatTime(b.time)}
                  </td>
                  <td>
                    <StatusBadge status={b.status} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {b.status !== 'approved' && (
                        <button
                          id={`approve-booking-${b.id}`}
                          className="btn btn-success btn-sm"
                          onClick={() => handleStatus(b.id, 'approved')}
                          disabled={actionLoading === b.id}
                          title="Approve"
                        >
                          {actionLoading === b.id ? (
                            <span className="spinner spinner-sm" />
                          ) : (
                            '✅'
                          )}
                        </button>
                      )}
                      {b.status !== 'rejected' && (
                        <button
                          id={`reject-booking-${b.id}`}
                          className="btn btn-danger btn-sm"
                          onClick={() => handleStatus(b.id, 'rejected')}
                          disabled={actionLoading === b.id}
                          title="Reject"
                        >
                          {actionLoading === b.id ? (
                            <span className="spinner spinner-sm" />
                          ) : (
                            '❌'
                          )}
                        </button>
                      )}
                      {b.status !== 'pending' && (
                        <button
                          id={`reset-booking-${b.id}`}
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleStatus(b.id, 'pending')}
                          disabled={actionLoading === b.id}
                          title="Reset to Pending"
                        >
                          ↩
                        </button>
                      )}
                    </div>
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
          u.id === user.id ? { ...u, is_admin: !u.is_admin } : u
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
          u.id === user.id ? { ...u, is_active: !u.is_active } : u
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
          placeholder="🔍 Search by name, email, phone, city…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          id="admin-refresh-users"
          className="btn btn-secondary btn-sm"
          onClick={onRefresh}
          disabled={loading}
        >
          🔄 Refresh
        </button>
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem', marginBottom: '1rem' }}>
        Showing <strong style={{ color: 'var(--text)' }}>{filtered.length}</strong> of{' '}
        {users.length} users
      </p>

      {loading ? (
        <LoadingSpinner text="Loading users…" />
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <div className="empty-title">No users found.</div>
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
                        '✅ Yes'
                      ) : (
                        '❌ No'
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
                        '✅ Active'
                      ) : (
                        '❌ Inactive'
                      )}
                    </button>
                  </td>
                  <td>
                    {confirmDelete === u.id ? (
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button
                          id={`confirm-delete-${u.id}`}
                          className="btn btn-danger btn-sm"
                          onClick={() => deleteUser(u.id)}
                          disabled={actionLoading === u.id + '_del'}
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
                      >
                        🗑 Delete
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
  const handleStatusChange = useCallback((bookingId, newStatus) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId ? { ...b, status: newStatus, status_display: capitalize(newStatus) } : b
      )
    )
  }, [])

  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1)

  return (
    <>
      <Navbar />
      <div className="page-wrapper">
        {/* Page Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 className="page-title">⚙️ Admin Dashboard</h1>
          <p className="page-subtitle">
            Manage bookings, approve or reject requests, and oversee all users.
          </p>
        </div>

        {fetchError && (
          <div className="alert alert-error mb-2">⚠️ {fetchError}</div>
        )}

        {/* Stats Bar */}
        <StatsBar
          bookings={bookings}
          users={users}
        />

        {/* Tabs */}
        <div className="tabs">
          <button
            id="tab-bookings"
            className={`tab ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            📋 Bookings ({bookings.length})
          </button>
          <button
            id="tab-users"
            className={`tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 Users ({users.length})
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
