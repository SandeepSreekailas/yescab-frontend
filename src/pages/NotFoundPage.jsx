import { Link } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import Navbar from '../components/Navbar'

export default function NotFoundPage() {
  return (
    <>
      <Navbar />
      <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
        <div style={{ color: 'var(--text-faint)', marginBottom: '1.5rem' }}>
          <AlertCircle size={64} />
        </div>
        <h1 className="page-title" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>404</h1>
        <p className="page-subtitle" style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
          Oops! We couldn't find the page you were looking for.
        </p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/" className="btn btn-primary">
            Back to Home
          </Link>
        </div>
      </div>
    </>
  )
}
