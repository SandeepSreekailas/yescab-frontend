import { useState, useEffect, useCallback } from 'react'
import { adminAPI } from '../api/axios'
import Navbar from '../components/Navbar'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import BookingCard from '../components/BookingCard'
import BookingDetailModal from '../components/BookingDetailModal'
import { Users, Package, Clock, CheckCircle, XCircle, Search, RefreshCw, Trash2, Mail, Phone, Calendar, AlertTriangle, CarFront, Check } from 'lucide-react'

import Pagination from '../components/Pagination'

// ── Sub-components ──────────────────────────────────────────

function StatsBar({ stats }) {
  if (!stats) return null;
  const { users, pending, approved, driver_assigned, completed, rejected, cancelled } = stats;

  return (
    <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
      <div className="stat-card">
        <span className="stat-icon"><Users size={20} color="var(--text-muted)" /></span>
        <span className="stat-value" style={{ fontSize: '1.5rem' }}>{users}</span>
        <span className="stat-label">Users</span>
      </div>
      <div className="stat-card">
        <span className="stat-icon"><Clock size={20} color="#fbbf24" /></span>
        <span className="stat-value" style={{ color: '#fbbf24', fontSize: '1.5rem' }}>{pending}</span>
        <span className="stat-label">Pending</span>
      </div>
      <div className="stat-card">
        <span className="stat-icon"><CheckCircle size={20} color="var(--success)" /></span>
        <span className="stat-value" style={{ color: 'var(--success)', fontSize: '1.5rem' }}>{approved + driver_assigned}</span>
        <span className="stat-label">Active</span>
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
      <div className="stat-card">
        <span className="stat-icon"><Package size={20} color="var(--text-faint)" /></span>
        <span className="stat-value" style={{ color: 'var(--text-faint)', fontSize: '1.5rem' }}>{cancelled}</span>
        <span className="stat-label">Cancelled</span>
      </div>
    </div>
  )
}

// ── Bookings Tab (Card-based) ──────────────────────────────────

function BookingsTab({ bookings, vehicles, count, currentPage, loading, onStatusChange, onRefresh, fetchBookings }) {
  const [statusFilter, setStatusFilter] = useState('')
  const [tripFilter, setTripFilter] = useState('')
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const [selectedBooking, setSelectedBooking] = useState(null)

  // Trigger search/filter from backend when inputs change (with simple debounce on search)
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchBookings(1, { status: statusFilter, trip_type: tripFilter, search })
    }, 300)
    return () => clearTimeout(handler)
  }, [statusFilter, tripFilter, search, fetchBookings])

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
          <option value="cancelled">Cancelled</option>
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
        Found <strong style={{ color: 'var(--text)' }}>{count}</strong> matching bookings
      </p>

      {loading ? (
        <LoadingSpinner text="Loading bookings…" />
        ) : bookings.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-icon"><Search size={32} color="var(--text-muted)" /></div>
            <div className="empty-title">No bookings found</div>
            <p className="empty-text">Try adjusting your search or filters.</p>
          </div>
        ) : (
        <div className="booking-cards-grid">
          {bookings.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              actionLoading={actionLoading}
              onApprove={(id) => handleStatus(id, 'approved')}
              onReject={(id) => handleStatus(id, 'rejected')}
              onView={setSelectedBooking}
            />
          ))}
        </div>
      )}

      {bookings.length > 0 && (
        <Pagination 
          count={count} 
          pageSize={50} 
          currentPage={currentPage} 
          onPageChange={(p) => fetchBookings(p, { status: statusFilter, trip_type: tripFilter, search })} 
        />
      )}

      {/* Detail Modal */}
      <BookingDetailModal
        booking={selectedBooking}
        vehicles={vehicles}
        onClose={() => setSelectedBooking(null)}
        isAdmin={true}
        onUpdate={async (newStatus, note, vehicle, rejectionReason) => {
          try {
            const payload = { status: newStatus, admin_note: note }
            if (vehicle) payload.vehicle = vehicle
            if (rejectionReason) payload.rejection_reason = rejectionReason
            
            await adminAPI.updateBookingStatus(selectedBooking.id, payload)
            onStatusChange(selectedBooking.id, newStatus, note)
            setSelectedBooking(null)
          } catch (err) {
            const msg = err.response?.data?.error
              || err.response?.data?.status?.[0]
              || err.response?.data?.vehicle?.[0]
              || err.response?.data?.rejection_reason?.[0]
              || 'Failed to update booking. The status transition may not be allowed.'
            alert(msg)
          }
        }}
      />
    </div>
  )
}

// ── Users Tab ──────────────────────────────────────────

function UsersTab({ users, count, currentPage, loading, onUsersChange, onRefresh, fetchUsers }) {
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchUsers(1, { search })
    }, 300)
    return () => clearTimeout(handler)
  }, [search, fetchUsers])

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
        Found <strong style={{ color: 'var(--text)' }}>{count}</strong> matching users
      </p>

      {loading ? (
        <LoadingSpinner text="Loading users…" />
        ) : users.length === 0 ? (
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
              {users.map((u) => (
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
          
          {users.length > 0 && (
            <Pagination 
              count={count} 
              pageSize={50} 
              currentPage={currentPage} 
              onPageChange={(p) => fetchUsers(p, { search })} 
            />
          )}
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
  const [vehicles, setVehicles] = useState([])
  
  const [bookingsCount, setBookingsCount] = useState(0)
  const [usersCount, setUsersCount] = useState(0)
  
  const [bookingsPage, setBookingsPage] = useState(1)
  const [usersPage, setUsersPage] = useState(1)
  
  const [bookingsLoading, setBookingsLoading] = useState(true)
  const [usersLoading, setUsersLoading] = useState(true)
  
  const [stats, setStats] = useState(null)
  const [fetchError, setFetchError] = useState(null)

  const fetchStats = useCallback(async () => {
    try {
      const res = await adminAPI.getStats()
      setStats(res.data)
    } catch {
      console.error('Failed to load stats')
    }
  }, [])

  const fetchBookings = useCallback(async (page = 1, filters = {}) => {
    setBookingsLoading(true)
    try {
      const res = await adminAPI.listAllBookings({ page, ...filters })
      setBookings(res.data.results || [])
      setBookingsCount(res.data.count || 0)
      setBookingsPage(page)
    } catch {
      setFetchError('Failed to load bookings.')
    } finally {
      setBookingsLoading(false)
    }
  }, [])

  const fetchUsers = useCallback(async (page = 1, filters = {}) => {
    setUsersLoading(true)
    try {
      const res = await adminAPI.listUsers({ page, ...filters })
      setUsers(res.data.results || [])
      setUsersCount(res.data.count || 0)
      setUsersPage(page)
    } catch {
      setFetchError('Failed to load users.')
    } finally {
      setUsersLoading(false)
    }
  }, [])

  const fetchVehicles = useCallback(async () => {
    try {
      const res = await adminAPI.listVehicles()
      setVehicles(res.data)
    } catch {
      console.error('Failed to load vehicles')
    }
  }, [])

  useEffect(() => {
    fetchStats()
    fetchBookings(1)
    fetchUsers(1)
    fetchVehicles()
  }, [fetchStats, fetchBookings, fetchUsers, fetchVehicles])

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
        <StatsBar stats={stats} />

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
            vehicles={vehicles}
            count={bookingsCount}
            currentPage={bookingsPage}
            loading={bookingsLoading}
            onStatusChange={(id, status, note) => {
              handleStatusChange(id, status, note)
              fetchStats() // refresh stats when status changes
            }}
            onRefresh={() => { fetchBookings(bookingsPage); fetchStats(); }}
            fetchBookings={fetchBookings}
          />
        ) : (
          <UsersTab
            users={users}
            count={usersCount}
            currentPage={usersPage}
            loading={usersLoading}
            onUsersChange={setUsers}
            onRefresh={() => { fetchUsers(usersPage); fetchStats(); }}
            fetchUsers={fetchUsers}
          />
        )}
      </div>
    </>
  )
}
