import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Google Client ID — loaded from environment variable
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

/**
 * Shared hook: loads GIS script + renders Google's own button into a hidden container.
 * The real Google button is made invisible and overlaid on top of a custom-styled button.
 */
export function useGoogleSignIn(containerRef, onCredential, onError) {
  const [ready, setReady] = useState(false)
  const callbackRef = useRef(onCredential)
  callbackRef.current = onCredential

  const renderBtn = useCallback(() => {
    if (!window.google?.accounts?.id || !containerRef.current) return
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => callbackRef.current?.(response),
      auto_select: false,
      cancel_on_tap_outside: true,
    })

    window.google.accounts.id.renderButton(containerRef.current, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      logo_alignment: 'left',
      width: 400,
    })
    setReady(true)
  }, [containerRef])

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.includes('YOUR_GOOGLE_CLIENT_ID')) return

    if (window.google?.accounts?.id) {
      renderBtn()
      return
    }

    const existing = document.getElementById('google-gsi-script')
    if (!existing) {
      const script = document.createElement('script')
      script.id = 'google-gsi-script'
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = () => renderBtn()
      script.onerror = () => onError?.('Failed to load Google Sign-In.')
      document.head.appendChild(script)
    } else {
      const timer = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(timer)
          renderBtn()
        }
      }, 200)
      return () => clearInterval(timer)
    }
  }, [renderBtn, onError])

  return ready
}

/**
 * Google Sign-In Button with real Google branding design.
 * Google's actual invisible button sits on top so clicks are handled by GIS.
 */
export function GoogleSignInButton({ googleRef, ready, loading }) {
  return (
    <div className="gsi-btn-outer">
      {/* Visual layer — pixel-perfect Google design */}
      <div className="gsi-btn-visual" aria-hidden="true">
        <div className="gsi-btn-icon">
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
        </div>
        <span className="gsi-btn-text">
          {loading ? 'Signing in…' : 'Continue with Google'}
        </span>
      </div>

      {/* Real Google button — invisible overlay (captures the click) */}
      <div ref={googleRef} className="gsi-btn-real" />
    </div>
  )
}

export { GOOGLE_CLIENT_ID }

export default function LoginPage() {
  const { login, googleLogin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const googleBtnRef = useRef(null)

  async function handleGoogleCredential(response) {
    if (!response?.credential) {
      setApiError('Google sign-in failed. Please try again.')
      return
    }
    setGoogleLoading(true)
    setApiError('')
    try {
      await googleLogin(response.credential)
      navigate(from, { replace: true })
    } catch (err) {
      const data = err.response?.data
      if (data?.credential) {
        setApiError(Array.isArray(data.credential) ? data.credential[0] : data.credential)
      } else if (data?.error) {
        setApiError(data.error)
      } else if (data?.non_field_errors) {
        setApiError(data.non_field_errors[0])
      } else {
        setApiError('Google login failed. Please try again.')
      }
    } finally {
      setGoogleLoading(false)
    }
  }

  const gsiReady = useGoogleSignIn(googleBtnRef, handleGoogleCredential, (msg) => setApiError(msg))

  const validate = () => {
    const errs = {}
    if (!form.email.trim()) errs.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Enter a valid email address.'
    if (!form.password) errs.password = 'Password is required.'
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
      await login({ email: form.email.toLowerCase(), password: form.password })
      navigate(from, { replace: true })
    } catch (err) {
      const data = err.response?.data
      if (data?.non_field_errors) {
        setApiError(data.non_field_errors[0])
      } else if (data?.detail) {
        setApiError(data.detail)
      } else {
        setApiError('Login failed. Please check your credentials and try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">Y</div>
          <span className="auth-logo-text">
            Yes<span>Cab</span>
          </span>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to manage your cab bookings.</p>

        {apiError && (
          <div className="alert alert-error mb-2">⚠️ {apiError}</div>
        )}

        {googleLoading && (
          <div className="alert alert-info mb-2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="spinner spinner-sm" /> Signing in with Google…
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email Address</label>
            <input
              id="login-email" type="email" name="email" className="form-control"
              placeholder="you@example.com" value={form.email}
              onChange={handleChange} autoComplete="email" autoFocus
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <input
              id="login-password" type="password" name="password" className="form-control"
              placeholder="Enter your password" value={form.password}
              onChange={handleChange} autoComplete="current-password"
            />
            {errors.password && <span className="form-error">{errors.password}</span>}
            <div style={{ textAlign: 'right', marginTop: '0.25rem' }}>
              <Link to="/forgot-password" style={{ fontSize: '0.82rem', color: 'var(--primary)' }}>
                Forgot password?
              </Link>
            </div>
          </div>

          <button
            id="login-submit-btn" type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading || googleLoading}
            style={{ marginTop: '0.5rem' }}
          >
            {loading ? (<><span className="spinner spinner-sm" /> Signing in…</>) : '🔐 Sign In'}
          </button>
        </form>

        {/* Google Sign-In */}
        <div className="oauth-divider"><span>or</span></div>
        <GoogleSignInButton googleRef={googleBtnRef} ready={gsiReady} loading={googleLoading} />

        <p className="auth-footer">
          Don&apos;t have an account?{' '}
          <Link to="/register">Create one now</Link>
        </p>
      </div>
    </div>
  )
}
