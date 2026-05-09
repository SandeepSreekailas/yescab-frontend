import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authAPI } from '../api/axios'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Email is required.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address.')
      return
    }

    setLoading(true)
    setError('')
    try {
      await authAPI.forgotPassword({ email: email.toLowerCase().trim() })
      setSuccess(true)
    } catch {
      // Always show success to prevent user enumeration
      setSuccess(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">Y</div>
          <span className="auth-logo-text">
            Yes<span>Cab</span>
          </span>
        </div>

        <h1 className="auth-title">Reset your password</h1>
        <p className="auth-subtitle">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div className="alert alert-success mb-2">
              ✅ If an account with that email exists, a reset link has been sent. Please check your inbox.
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '1rem' }}>
              Didn&apos;t receive an email? Check your spam folder or try again in a few minutes.
            </p>
            <Link
              to="/login"
              className="btn btn-primary btn-full btn-lg"
              style={{ marginTop: '1.5rem', display: 'block', textAlign: 'center' }}
            >
              ← Back to Sign In
            </Link>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="forgot-email">Email Address</label>
              <input
                id="forgot-email"
                type="email"
                className="form-control"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError('') }}
                autoComplete="email"
                autoFocus
              />
              {error && <span className="form-error">{error}</span>}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
              style={{ marginTop: '0.5rem' }}
            >
              {loading ? (
                <><span className="spinner spinner-sm" /> Sending…</>
              ) : (
                '📧 Send Reset Link'
              )}
            </button>
          </form>
        )}

        <p className="auth-footer">
          Remember your password? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
