import { Link } from 'react-router-dom'

export default function PrivacyPolicyPage() {
  return (
    <div className="auth-page" style={{ alignItems: 'flex-start', padding: '2rem 1rem' }}>
      <div
        className="auth-card"
        style={{
          maxWidth: '760px',
          width: '100%',
          textAlign: 'left',
          padding: '2.5rem',
        }}
      >
        {/* Header */}
        <div className="auth-logo" style={{ marginBottom: '1.5rem' }}>
          <div className="auth-logo-icon">Y</div>
          <span className="auth-logo-text">
            Yes<span>Cab</span>
          </span>
        </div>

        <h1 className="auth-title" style={{ marginBottom: '0.25rem' }}>Privacy Policy</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '2rem' }}>
          Last updated: May 2026
        </p>

        <div style={{ color: 'var(--text)', lineHeight: 1.7, fontSize: '0.92rem' }}>
          <p>
            YesCab (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your personal
            information. This Privacy Policy explains what data we collect, how we use it, and your rights
            regarding that data.
          </p>

          <h2 style={{ color: 'var(--primary)', marginTop: '2rem', fontSize: '1.15rem' }}>
            1. Information We Collect
          </h2>
          <p>When you register and use YesCab, we collect the following information:</p>
          <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem' }}>
            <li><strong>Name</strong> — to personalise your experience and bookings.</li>
            <li><strong>Email address</strong> — for account authentication, booking confirmations, and important service communications.</li>
            <li><strong>Phone number</strong> — so drivers and our team can contact you regarding your rides.</li>
            <li><strong>Location data</strong> — pickup and drop-off coordinates and addresses you select when making a booking.</li>
            <li><strong>Booking details</strong> — trip type, date, time, number of passengers, and any notes you provide.</li>
          </ul>
          <p style={{ marginTop: '0.75rem' }}>
            If you sign in via Google, we receive your name and email from your Google account. We do <strong>not</strong> access
            your Google contacts, calendar, or any other data.
          </p>

          <h2 style={{ color: 'var(--primary)', marginTop: '2rem', fontSize: '1.15rem' }}>
            2. How We Use Your Information
          </h2>
          <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem' }}>
            <li>To create and manage your account.</li>
            <li>To process and fulfil your cab bookings.</li>
            <li>To send booking confirmations and status updates via email.</li>
            <li>To notify the admin team of new bookings for approval.</li>
            <li>To enforce service restrictions (e.g., Ernakulam district geo-restriction).</li>
            <li>To prevent fraud, abuse, and duplicate bookings.</li>
          </ul>

          <h2 style={{ color: 'var(--primary)', marginTop: '2rem', fontSize: '1.15rem' }}>
            3. Email & Phone Usage
          </h2>
          <p>
            We send emails for: account verification, password resets, booking confirmations, and booking
            status changes (approved / rejected). We will <strong>never</strong> send marketing emails
            without your explicit consent. Your phone number is shared only with assigned drivers for
            ride coordination.
          </p>

          <h2 style={{ color: 'var(--primary)', marginTop: '2rem', fontSize: '1.15rem' }}>
            4. Data Storage & Security
          </h2>
          <p>
            Your data is stored securely in a PostgreSQL database hosted on Neon (cloud infrastructure).
            All communications between your browser and our servers are encrypted via HTTPS/TLS.
            Passwords are hashed using industry-standard algorithms and are never stored in plain text.
          </p>

          <h2 style={{ color: 'var(--primary)', marginTop: '2rem', fontSize: '1.15rem' }}>
            5. Data Retention
          </h2>
          <p>
            We retain your account data for as long as your account is active. Booking records are
            retained for operational and record-keeping purposes. You may request deletion of your
            account and associated data at any time through the account settings.
          </p>

          <h2 style={{ color: 'var(--primary)', marginTop: '2rem', fontSize: '1.15rem' }}>
            6. Your Rights
          </h2>
          <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem' }}>
            <li>Access the personal data we hold about you.</li>
            <li>Request correction of inaccurate data.</li>
            <li>Delete your account and personal data.</li>
            <li>Withdraw consent for optional communications.</li>
          </ul>

          <h2 style={{ color: 'var(--primary)', marginTop: '2rem', fontSize: '1.15rem' }}>
            7. Third-Party Services
          </h2>
          <p>
            We use the following third-party services:
          </p>
          <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem' }}>
            <li><strong>Google OAuth</strong> — for optional Google sign-in authentication.</li>
            <li><strong>OpenStreetMap / Nominatim</strong> — for map display and location autocomplete.</li>
          </ul>
          <p style={{ marginTop: '0.5rem' }}>
            These services have their own privacy policies. We do not sell your data to any third party.
          </p>

          <h2 style={{ color: 'var(--primary)', marginTop: '2rem', fontSize: '1.15rem' }}>
            8. Cookies
          </h2>
          <p>
            YesCab does not use cookies for tracking or analytics. Authentication tokens are stored
            in your browser&apos;s local storage and are used solely for session management.
          </p>

          <h2 style={{ color: 'var(--primary)', marginTop: '2rem', fontSize: '1.15rem' }}>
            9. Contact Us
          </h2>
          <p>
            If you have questions about this Privacy Policy or wish to exercise your data rights,
            please contact us at: <strong style={{ color: 'var(--primary)' }}>support@yescab.com</strong>
          </p>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '2.5rem', textAlign: 'center', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
          <Link to="/register" style={{ color: 'var(--primary)', marginRight: '1.5rem' }}>← Register</Link>
          <Link to="/terms" style={{ color: 'var(--primary)' }}>Terms of Service →</Link>
        </div>
      </div>
    </div>
  )
}
