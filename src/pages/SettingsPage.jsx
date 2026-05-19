import { useState } from 'react'
import { authAPI } from '../api/axios'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import { Mail, Lock, User, AlertTriangle, CheckCircle, Shield } from 'lucide-react'

export default function SettingsPage() {
  const { user, updateUser } = useAuth()
  
  // -- Profile Form State --
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    place: user?.place || ''
  })
  const [profileStatus, setProfileStatus] = useState(null)

  // -- Email Change State --
  const [emailForm, setEmailForm] = useState({ new_email: '', password: '' })
  const [emailStatus, setEmailStatus] = useState(null)

  // -- Password Change State --
  const [pwdForm, setPwdForm] = useState({ old_password: '', new_password: '', new_password2: '' })
  const [pwdStatus, setPwdStatus] = useState(null)

  // Handlers
  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setProfileStatus({ loading: true })
    try {
      const res = await authAPI.updateProfile(profileForm)
      updateUser(res.data)
      setProfileStatus({ success: 'Profile updated successfully.' })
    } catch (err) {
      setProfileStatus({ error: err.response?.data?.error || 'Failed to update profile.' })
    }
  }

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setEmailStatus({ loading: true })
    try {
      const res = await authAPI.changeEmail(emailForm)
      setEmailStatus({ success: res.data.message })
      setEmailForm({ new_email: '', password: '' })
    } catch (err) {
      const msg = err.response?.data?.new_email?.[0] || err.response?.data?.password?.[0] || err.response?.data?.error || 'Failed to request email change.'
      setEmailStatus({ error: msg })
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPwdStatus({ loading: true })
    try {
      const res = await authAPI.changePassword(pwdForm)
      setPwdStatus({ success: res.data.message })
      setPwdForm({ old_password: '', new_password: '', new_password2: '' })
    } catch (err) {
      const msg = err.response?.data?.new_password?.[0] || err.response?.data?.old_password?.[0] || err.response?.data?.error || 'Failed to change password.'
      setPwdStatus({ error: msg })
    }
  }

  return (
    <>
      <Navbar />
      <div className="page-wrapper" style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '2rem' }}>
        <h1 className="page-title" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={28} color="var(--primary)" /> Account Settings
        </h1>
        <p className="page-subtitle" style={{ marginBottom: '2rem' }}>
          Manage your personal information, email preferences, and security settings.
        </p>

        {/* PROFILE SECTION */}
        <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            <User size={18} /> Personal Profile
          </h2>
          <form onSubmit={handleProfileSubmit}>
            {profileStatus?.error && <div className="alert alert-error mb-2"><AlertTriangle size={16} /> {profileStatus.error}</div>}
            {profileStatus?.success && <div className="alert alert-success mb-2"><CheckCircle size={16} /> {profileStatus.success}</div>}
            
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-control"
                value={profileForm.name}
                onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  className="form-control"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Place / City</label>
                <input
                  type="text"
                  className="form-control"
                  value={profileForm.place}
                  onChange={(e) => setProfileForm({...profileForm, place: e.target.value})}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={profileStatus?.loading}>
              {profileStatus?.loading ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>

        {/* EMAIL CHANGE SECTION */}
        <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            <Mail size={18} /> Change Email Address
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Current email: <strong>{user?.email}</strong>
            {!user?.is_email_verified && <span style={{ color: 'var(--danger)', marginLeft: '0.5rem' }}>(Unverified)</span>}
          </p>
          <form onSubmit={handleEmailSubmit}>
            {emailStatus?.error && <div className="alert alert-error mb-2"><AlertTriangle size={16} /> {emailStatus.error}</div>}
            {emailStatus?.success && <div className="alert alert-success mb-2"><CheckCircle size={16} /> {emailStatus.success}</div>}
            
            <div className="form-group">
              <label className="form-label">New Email Address</label>
              <input
                type="email"
                className="form-control"
                required
                value={emailForm.new_email}
                onChange={(e) => setEmailForm({...emailForm, new_email: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                type="password"
                className="form-control"
                required
                placeholder="Required for security"
                value={emailForm.password}
                onChange={(e) => setEmailForm({...emailForm, password: e.target.value})}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={emailStatus?.loading}>
              {emailStatus?.loading ? 'Sending Verification...' : 'Change Email'}
            </button>
          </form>
        </div>

        {/* PASSWORD CHANGE SECTION */}
        <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            <Lock size={18} /> Change Password
          </h2>
          <form onSubmit={handlePasswordSubmit}>
            {pwdStatus?.error && <div className="alert alert-error mb-2"><AlertTriangle size={16} /> {pwdStatus.error}</div>}
            {pwdStatus?.success && <div className="alert alert-success mb-2"><CheckCircle size={16} /> {pwdStatus.success}</div>}
            
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                type="password"
                className="form-control"
                required
                value={pwdForm.old_password}
                onChange={(e) => setPwdForm({...pwdForm, old_password: e.target.value})}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-control"
                  required
                  value={pwdForm.new_password}
                  onChange={(e) => setPwdForm({...pwdForm, new_password: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-control"
                  required
                  value={pwdForm.new_password2}
                  onChange={(e) => setPwdForm({...pwdForm, new_password2: e.target.value})}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={pwdStatus?.loading}>
              {pwdStatus?.loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

      </div>
    </>
  )
}
