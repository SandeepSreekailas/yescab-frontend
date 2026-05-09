import { Link } from 'react-router-dom'

export default function TermsOfServicePage() {
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

        <h1 className="auth-title" style={{ marginBottom: '0.25rem' }}>Terms of Service</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '2rem' }}>
          Last updated: May 2026
        </p>

        <div style={{ color: 'var(--text)', lineHeight: 1.7, fontSize: '0.92rem' }}>
          <p>
            By using YesCab (&quot;the Service&quot;), you agree to the following terms and conditions.
            Please read them carefully before creating an account or making a booking.
          </p>

          <h2 style={{ color: 'var(--primary)', marginTop: '2rem', fontSize: '1.15rem' }}>
            1. Service Description
          </h2>
          <p>
            YesCab is a cab booking platform that connects passengers with transportation services
            in the Ernakulam district, Kerala. We offer airport pickups, airport drops, tour packages,
            and local taxi bookings. All bookings are subject to admin approval.
          </p>

          <h2 style={{ color: 'var(--primary)', marginTop: '2rem', fontSize: '1.15rem' }}>
            2. Booking Rules
          </h2>
          <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem' }}>
            <li>All bookings must be made within the Ernakulam district service area.</li>
            <li>Bookings must be made at least for the current time or a future date/time.</li>
            <li>Bookings can be made up to 6 months in advance.</li>
            <li>Each booking is subject to review and approval by our admin team.</li>
            <li>Duplicate or spam bookings may be automatically rejected.</li>
            <li>You must provide accurate pickup and drop-off locations, a valid phone number, and correct passenger details.</li>
          </ul>

          <h2 style={{ color: 'var(--primary)', marginTop: '2rem', fontSize: '1.15rem' }}>
            3. User Responsibilities
          </h2>
          <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem' }}>
            <li>You must provide truthful and accurate information when registering and booking.</li>
            <li>You are responsible for maintaining the security of your account credentials.</li>
            <li>You must not create multiple accounts for the same person.</li>
            <li>You must not use the service for any unlawful purpose.</li>
            <li>You must be present at the pickup location at the scheduled time.</li>
          </ul>

          <h2 style={{ color: 'var(--primary)', marginTop: '2rem', fontSize: '1.15rem' }}>
            4. Cancellations & Modifications
          </h2>
          <p>
            Once a booking is submitted, it is reviewed by our admin team. Cancellation or modification
            policies are at the discretion of YesCab. If you need to cancel or modify a booking, please
            contact our support team as soon as possible.
          </p>

          <h2 style={{ color: 'var(--primary)', marginTop: '2rem', fontSize: '1.15rem' }}>
            5. Accuracy Disclaimer
          </h2>
          <p>
            While we strive to ensure accuracy of location data, maps, and travel estimates, we rely
            on third-party services (OpenStreetMap / Nominatim) and cannot guarantee 100% accuracy.
            Estimated travel times and routes are approximate and may vary due to traffic, weather,
            or other conditions.
          </p>

          <h2 style={{ color: 'var(--primary)', marginTop: '2rem', fontSize: '1.15rem' }}>
            6. Limitation of Liability
          </h2>
          <p>
            YesCab acts as a booking facilitation platform. To the fullest extent permitted by law:
          </p>
          <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem' }}>
            <li>We are not responsible for delays, cancellations, or service quality issues caused by drivers or external factors.</li>
            <li>We are not liable for any loss, damage, or injury during transportation.</li>
            <li>Our total liability shall not exceed the amount paid for the specific booking in question.</li>
          </ul>

          <h2 style={{ color: 'var(--primary)', marginTop: '2rem', fontSize: '1.15rem' }}>
            7. Abuse Prevention
          </h2>
          <p>
            We reserve the right to suspend or terminate accounts that engage in:
          </p>
          <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem' }}>
            <li>Fraudulent bookings or payment abuse.</li>
            <li>Repeated no-shows without cancellation.</li>
            <li>Harassment or abuse of drivers, staff, or other users.</li>
            <li>Automated or bot-driven booking attempts.</li>
            <li>Any violation of these terms.</li>
          </ul>

          <h2 style={{ color: 'var(--primary)', marginTop: '2rem', fontSize: '1.15rem' }}>
            8. Account Termination
          </h2>
          <p>
            You may delete your account at any time through the app settings. Upon deletion, your
            personal data will be permanently removed. We reserve the right to terminate accounts
            that violate these terms without prior notice.
          </p>

          <h2 style={{ color: 'var(--primary)', marginTop: '2rem', fontSize: '1.15rem' }}>
            9. Changes to Terms
          </h2>
          <p>
            We may update these terms from time to time. Continued use of the service after changes
            constitutes acceptance of the revised terms. We will notify users of significant changes
            via email.
          </p>

          <h2 style={{ color: 'var(--primary)', marginTop: '2rem', fontSize: '1.15rem' }}>
            10. Contact
          </h2>
          <p>
            For questions about these Terms of Service, please contact us at:{' '}
            <strong style={{ color: 'var(--primary)' }}>support@yescab.com</strong>
          </p>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '2.5rem', textAlign: 'center', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
          <Link to="/register" style={{ color: 'var(--primary)', marginRight: '1.5rem' }}>← Register</Link>
          <Link to="/privacy" style={{ color: 'var(--primary)' }}>Privacy Policy →</Link>
        </div>
      </div>
    </div>
  )
}
