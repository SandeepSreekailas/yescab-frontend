import React, { useState } from 'react'
import Footer from './Footer'
import { useAuth } from '../context/AuthContext'
import { AlertTriangle } from 'lucide-react'
import { authAPI } from '../api/axios'

export default function UserLayout({ children }) {
  const { user } = useAuth()
  const [resendStatus, setResendStatus] = useState(null)

  const handleResend = async () => {
    setResendStatus('sending')
    try {
      await authAPI.resendVerification()
      setResendStatus('success')
    } catch {
      setResendStatus('error')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {user && user.is_email_verified === false && (
        <div style={{
          backgroundColor: 'rgba(255, 204, 0, 0.15)',
          borderBottom: '1px solid var(--primary)',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
          textAlign: 'center',
          zIndex: 1000
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-dark)', fontSize: '0.9rem', fontWeight: 500 }}>
            <AlertTriangle size={18} />
            Please verify your email address to unlock full access.
          </span>
          {resendStatus === 'sending' ? (
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sending...</span>
          ) : resendStatus === 'success' ? (
            <span style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600 }}>Verification sent!</span>
          ) : (
            <button 
              onClick={handleResend}
              className="btn btn-sm btn-ghost" 
              style={{ padding: '0.2rem 0.5rem', border: '1px solid var(--primary)', color: 'var(--primary-dark)', backgroundColor: 'transparent' }}
            >
              Resend Verification
            </button>
          )}
        </div>
      )}
      <main style={{ flex: 1 }}>
        {children}
      </main>
      <Footer />
    </div>
  )
}

