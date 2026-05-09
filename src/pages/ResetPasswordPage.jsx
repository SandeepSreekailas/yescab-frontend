import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { authAPI } from '../api/axios'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''

  const [form, setForm] = useState({ new_password: '', new_password2: '' })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-icon">Y</div>
            <span className="auth-logo-text">Yes<span>Cab</span></span>
          </div>
          <h1 className="auth-title">Invalid Reset Link</h1>
          <div className="alert alert-error mb-2">
            ⚠️ No reset token provided. Please request a new password reset link.
          </div>
          <Link
            to="/forgot-password"
            className="btn btn-primary btn-full btn-lg"
            style={{ marginTop: '1rem', display: 'block', textAlign: 'center' }}
          >
            Request New Link
          </Link>
        </div>
      </div>
    )
  }

  const validate = () => {
    const errs = {}
    if (!form.new_password) errs.new_password = 'Password is required.'
    else if (form.new_password.length < 8) errs.new_password = 'Password must be at least 8 characters.'
    if (!form.new_password2) errs.new_password2 = 'Please confirm your password.'
    else if (form.new_password !== form.new_password2) errs.new_password2 = 'Passwords do not match.'
    return errs
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
    setApiError('')
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
    try {
      await authAPI.resetPassword({
        token,
        new_password: form.new_password,
        new_password2: form.new_password2,
      })
      setSuccess(true)
      setTimeout(() => navigate('/login', { replace: true }), 3000)
    } catch (err) {
      const data = err.response?.data
      if (data?.error) {
        setApiError(data.error)
      } else if (data?.new_password) {
        setErrors({ new_password: Array.isArray(data.new_password) ? data.new_password[0] : data.new_password })
      } else if (data?.new_password2) {
        setErrors({ new_password2: Array.isArray(data.new_password2) ? data.new_password2[0] : data.new_password2 })
      } else {
        setApiError('Password reset failed. The link may have expired.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">Y</div>
          <span className="auth-logo-text">Yes<span>Cab</span></span>
        </div>

        <h1 className="auth-title">Set new password</h1>
        <p className="auth-subtitle">Enter your new password below.</p>

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div className="alert alert-success mb-2">
              ✅ Password reset successful! Redirecting to login…
            </div>
            <Link to="/login" style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>
              Click here if not redirected
            </Link>
          </div>
        ) : (
          <>
            {apiError && <div className="alert alert-error mb-2">⚠️ {apiError}</div>}

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="reset-password">New Password</label>
                <input
                  id="reset-password" type="password" name="new_password"
                  className="form-control" placeholder="Min. 8 characters"
                  value={form.new_password} onChange={handleChange}
                  autoComplete="new-password" autoFocus
                />
                {errors.new_password && <span className="form-error">{errors.new_password}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reset-password2">Confirm Password</label>
                <input
                  id="reset-password2" type="password" name="new_password2"
                  className="form-control" placeholder="Re-enter your password"
                  value={form.new_password2} onChange={handleChange}
                  autoComplete="new-password"
                />
                {errors.new_password2 && <span className="form-error">{errors.new_password2}</span>}
              </div>

              <button
                type="submit" className="btn btn-primary btn-full btn-lg"
                disabled={loading} style={{ marginTop: '0.5rem' }}
              >
                {loading ? (<><span className="spinner spinner-sm" /> Resetting…</>) : '🔒 Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
