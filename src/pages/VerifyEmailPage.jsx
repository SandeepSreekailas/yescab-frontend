import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { authAPI } from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { CheckCircle, AlertTriangle } from 'lucide-react'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const { updateUser } = useAuth()
  const token = searchParams.get('token') || ''

  const [status, setStatus] = useState('verifying') // verifying | success | error
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setErrorMsg('No verification token provided.')
      return
    }

    let cancelled = false

    async function verify() {
      try {
        const response = await authAPI.verifyEmail({ token })
        if (!cancelled) {
          setStatus('success')
          // Update auth context if user is logged in
          if (response.data?.user) {
            updateUser(response.data.user)
          }
        }
      } catch (err) {
        if (!cancelled) {
          setStatus('error')
          setErrorMsg(
            err.response?.data?.error || 'Verification failed. The link may have expired.'
          )
        }
      }
    }

    verify()
    return () => { cancelled = true }
  }, [token, updateUser])

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div className="auth-logo">
          <div className="auth-logo-icon">Y</div>
          <span className="auth-logo-text">Yes<span>Cab</span></span>
        </div>

        <h1 className="auth-title">Email Verification</h1>

        {status === 'verifying' && (
          <div style={{ padding: '2rem 0' }}>
            <span className="spinner" style={{ width: '2rem', height: '2rem' }} />
            <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Verifying your email…</p>
          </div>
        )}

        {status === 'success' && (
          <>
            <div className="alert alert-success mb-2" style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}>
              <CheckCircle size={20} /> Your email has been verified successfully!
            </div>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              You now have full access to YesCab.
            </p>
            <Link
              to="/dashboard"
              className="btn btn-primary btn-full btn-lg"
              style={{ marginTop: '1.5rem', display: 'block', textAlign: 'center' }}
            >
              Go to Dashboard →
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="alert alert-error mb-2" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}><AlertTriangle size={18} /> {errorMsg}</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              You can request a new verification email from your dashboard.
            </p>
            <Link
              to="/login"
              className="btn btn-primary btn-full btn-lg"
              style={{ marginTop: '1.5rem', display: 'block', textAlign: 'center' }}
            >
              Go to Login
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
