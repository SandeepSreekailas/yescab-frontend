import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useGoogleSignIn, GoogleSignInButton } from './LoginPage'
import { AlertTriangle, UserPlus } from 'lucide-react'

export default function RegisterPage() {
  const { register, googleLogin } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '', email: '', phone: '', place: '',
    password: '', password2: '', agreed_to_terms: false,
  })
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
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const data = err.response?.data
      if (data?.credential) {
        setApiError(Array.isArray(data.credential) ? data.credential[0] : data.credential)
      } else if (data?.error) {
        setApiError(data.error)
      } else {
        setApiError('Google sign-up failed. Please try again.')
      }
    } finally {
      setGoogleLoading(false)
    }
  }

  const gsiReady = useGoogleSignIn(googleBtnRef, handleGoogleCredential, (msg) => setApiError(msg))

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Full name is required.'
    else if (form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters.'
    if (!form.email.trim()) errs.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Enter a valid email address.'
    if (!form.phone.trim()) errs.phone = 'Phone number is required.'
    else if (!/^[\d\s\-\+\(\)]{7,15}$/.test(form.phone))
      errs.phone = 'Enter a valid phone number (7–15 digits).'
    if (!form.place.trim()) errs.place = 'City / Place is required.'
    if (!form.password) errs.password = 'Password is required.'
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters.'
    if (!form.password2) errs.password2 = 'Please confirm your password.'
    else if (form.password !== form.password2) errs.password2 = 'Passwords do not match.'
    if (!form.agreed_to_terms) errs.agreed_to_terms = 'You must agree to the Terms and Privacy Policy.'
    return errs
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
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
      await register({
        name: form.name.trim(), email: form.email.toLowerCase().trim(),
        phone: form.phone.trim(), place: form.place.trim(),
        password: form.password, password2: form.password2,
        agreed_to_terms: form.agreed_to_terms,
      })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const data = err.response?.data
      if (data) {
        const fieldMap = {}
        let generalError = ''
        Object.entries(data).forEach(([key, val]) => {
          const msg = Array.isArray(val) ? val[0] : val
          if (['name', 'email', 'phone', 'place', 'password', 'password2'].includes(key)) {
            fieldMap[key] = msg
          } else { generalError = msg }
        })
        if (Object.keys(fieldMap).length) setErrors(fieldMap)
        if (generalError) setApiError(generalError)
      } else {
        setApiError('Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '520px' }}>
        <div className="auth-logo">
          <div className="auth-logo-icon">Y</div>
          <span className="auth-logo-text">Yes<span>Cab</span></span>
        </div>

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Join YesCab and start booking rides in seconds.</p>

        {apiError && (<div className="alert alert-error mb-2" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><AlertTriangle size={18} /> {apiError}</div>)}

        {googleLoading && (
          <div className="alert alert-info mb-2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="spinner spinner-sm" /> Signing up with Google…
          </div>
        )}

        {/* Google Sign-Up at top */}
        <GoogleSignInButton googleRef={googleBtnRef} ready={gsiReady} loading={googleLoading} />
        <div className="oauth-divider"><span>or register with email</span></div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-name">Full Name</label>
            <input id="reg-name" type="text" name="name" className="form-control"
              placeholder="John Doe" value={form.name} onChange={handleChange}
              autoComplete="name" autoFocus />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email Address</label>
            <input id="reg-email" type="email" name="email" className="form-control"
              placeholder="you@example.com" value={form.email} onChange={handleChange}
              autoComplete="email" />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-phone">Phone Number</label>
              <input id="reg-phone" type="tel" name="phone" className="form-control"
                placeholder="+91 98765 43210" value={form.phone} onChange={handleChange}
                autoComplete="tel" />
              {errors.phone && <span className="form-error">{errors.phone}</span>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-place">City / Place</label>
              <input id="reg-place" type="text" name="place" className="form-control"
                placeholder="Kochi" value={form.place} onChange={handleChange}
                autoComplete="address-level2" />
              {errors.place && <span className="form-error">{errors.place}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Password</label>
            <input id="reg-password" type="password" name="password" className="form-control"
              placeholder="Min. 8 characters" value={form.password} onChange={handleChange}
              autoComplete="new-password" />
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-password2">Confirm Password</label>
            <input id="reg-password2" type="password" name="password2" className="form-control"
              placeholder="Re-enter your password" value={form.password2} onChange={handleChange}
              autoComplete="new-password" />
            {errors.password2 && <span className="form-error">{errors.password2}</span>}
          </div>

          <button id="register-submit-btn" type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading || googleLoading} style={{ marginTop: '0.5rem' }}>
            {loading ? (<><span className="spinner spinner-sm" /> Creating account…</>) : <><UserPlus size={18} /> Create Account</>}
          </button>

          <label className="form-checkbox" style={{ marginTop: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox" name="agreed_to_terms"
              checked={form.agreed_to_terms} onChange={handleChange}
              style={{ marginTop: '0.2rem', accentColor: 'var(--primary)' }}
            />
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              I agree to the{' '}
              <Link to="/terms" target="_blank" style={{ color: 'var(--primary)' }}>Terms of Service</Link>
              {' '}and{' '}
              <Link to="/privacy" target="_blank" style={{ color: 'var(--primary)' }}>Privacy Policy</Link>
            </span>
          </label>
          {errors.agreed_to_terms && <span className="form-error">{errors.agreed_to_terms}</span>}
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
