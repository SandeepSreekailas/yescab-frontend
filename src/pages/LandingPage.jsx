import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Footer from '../components/Footer'
import {
  CarFront, Plane, Map, Shield, MessageCircle, Mail,
  Clock, CheckCircle, UserPlus, Star, ChevronRight,
  Menu, X, MapPin, Zap, Bell, LayoutDashboard, ArrowRight
} from 'lucide-react'
import './LandingPage.css'

// ── Intersection Observer hook for scroll animations ──
function useScrollReveal() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.15 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return [ref, visible]
}

function AnimateOnScroll({ children, className = '', delay = 0 }) {
  const [ref, visible] = useScrollReveal()
  return (
    <div
      ref={ref}
      className={`lp-animate ${visible ? 'visible' : ''} ${delay ? `lp-animate-delay-${delay}` : ''} ${className}`}
    >
      {children}
    </div>
  )
}

// ── Data ──
const FEATURES = [
  {
    icon: <Zap size={24} />,
    title: 'Instant Booking',
    desc: 'Book a cab in under a minute. Select your route, pick a time, and you\'re all set.',
    color: 'rgba(255, 204, 0, 0.12)',
    iconColor: '#ffcc00',
  },
  {
    icon: <Clock size={24} />,
    title: 'Real-Time Status',
    desc: 'Track your booking through every stage — from pending to approved to ride completion.',
    color: 'rgba(59, 130, 246, 0.12)',
    iconColor: '#60a5fa',
  },
  {
    icon: <Shield size={24} />,
    title: 'Secure Authentication',
    desc: 'JWT + Google OAuth login with email verification. Your account is always protected.',
    color: 'rgba(34, 197, 94, 0.12)',
    iconColor: '#4ade80',
  },
  {
    icon: <MessageCircle size={24} />,
    title: 'WhatsApp Support',
    desc: 'Instant booking confirmation on WhatsApp. Stay connected with your driver and admin.',
    color: 'rgba(37, 211, 102, 0.12)',
    iconColor: '#25D366',
  },
  {
    icon: <Bell size={24} />,
    title: 'Email Notifications',
    desc: 'Automated email updates for every booking status change. Never miss an update.',
    color: 'rgba(239, 68, 68, 0.12)',
    iconColor: '#f87171',
  },
  {
    icon: <LayoutDashboard size={24} />,
    title: 'Modern Dashboard',
    desc: 'Beautiful responsive dashboard with booking history, stats, and quick actions.',
    color: 'rgba(168, 85, 247, 0.12)',
    iconColor: '#a855f7',
  },
]

const STEPS = [
  {
    icon: <UserPlus size={28} color="var(--primary)" />,
    title: 'Create Account',
    desc: 'Register with email or sign in with Google. Verify your email to get started.',
  },
  {
    icon: <MapPin size={28} color="var(--primary)" />,
    title: 'Book Your Ride',
    desc: 'Pick your locations on the map, choose date & time, and submit your booking.',
  },
  {
    icon: <CheckCircle size={28} color="var(--primary)" />,
    title: 'Ride Confirmed',
    desc: 'Admin reviews and approves your booking. Get notified via email and WhatsApp.',
  },
]

const TESTIMONIALS = [
  {
    text: 'YesCab made my airport pickup so seamless. Booked the night before, got confirmed within an hour, and the driver was right on time at Kochi airport.',
    name: 'Arjun Menon',
    role: 'Business Traveler',
    initials: 'AM',
  },
  {
    text: 'I use YesCab weekly for my office commute from Aluva. The booking process is incredibly simple and the WhatsApp notifications keep me updated at every step.',
    name: 'Sneha Thomas',
    role: 'IT Professional',
    initials: 'ST',
  },
  {
    text: 'Planned a family tour package to Munnar through YesCab. The admin response was fast, driver was professional, and the whole experience felt premium.',
    name: 'Rajan Nair',
    role: 'Tour Customer',
    initials: 'RN',
  },
]

// ── Component ──
export default function LandingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const scrollTo = useCallback((id) => {
    setMobileMenuOpen(false)
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  // If already logged in, the dashboard link goes to dashboard
  const primaryAction = user ? '/dashboard' : '/register'
  const primaryLabel = user ? 'Go to Dashboard' : 'Get Started Free'

  return (
    <div className="lp-page">
      {/* ── Navbar ── */}
      <nav className={`lp-nav ${scrolled ? 'scrolled' : ''}`}>
        <Link to="/" className="lp-nav-brand">
          <span className="brand-yes">Yes</span><span className="brand-cab">Cab</span>
        </Link>

        <ul className="lp-nav-links">
          <li><a href="#features" onClick={(e) => { e.preventDefault(); scrollTo('features') }}>Features</a></li>
          <li><a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollTo('how-it-works') }}>How It Works</a></li>
          <li><a href="#about" onClick={(e) => { e.preventDefault(); scrollTo('about') }}>About</a></li>
          <li><a href="#testimonials" onClick={(e) => { e.preventDefault(); scrollTo('testimonials') }}>Reviews</a></li>
        </ul>

        <div className="lp-nav-actions">
          {user ? (
            <Link to="/dashboard" className="lp-btn lp-btn-primary lp-btn-sm">Dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="lp-btn lp-btn-ghost lp-btn-sm">Sign In</Link>
              <Link to="/register" className="lp-btn lp-btn-primary lp-btn-sm">Register</Link>
            </>
          )}
        </div>

        <button className="lp-hamburger" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">
          <Menu size={24} />
        </button>
      </nav>

      {/* ── Mobile Menu ── */}
      {mobileMenuOpen && (
        <div className="lp-mobile-menu">
          <button className="lp-mobile-close" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
            <X size={28} />
          </button>
          <a href="#features" onClick={(e) => { e.preventDefault(); scrollTo('features') }}>Features</a>
          <a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollTo('how-it-works') }}>How It Works</a>
          <a href="#about" onClick={(e) => { e.preventDefault(); scrollTo('about') }}>About</a>
          <a href="#testimonials" onClick={(e) => { e.preventDefault(); scrollTo('testimonials') }}>Reviews</a>
          <hr style={{ width: '60px', border: 'none', borderTop: '1px solid var(--border)', margin: '0.5rem 0' }} />
          {user ? (
            <Link to="/dashboard" className="lp-btn lp-btn-primary" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="lp-btn lp-btn-outline" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
              <Link to="/register" className="lp-btn lp-btn-primary" onClick={() => setMobileMenuOpen(false)}>Register</Link>
            </>
          )}
        </div>
      )}

      {/* ══════════ HERO ══════════ */}
      <section className="lp-hero">
        <div className="lp-hero-bg">
          <div className="lp-hero-gradient lp-hero-gradient-1" />
          <div className="lp-hero-gradient lp-hero-gradient-2" />
        </div>
        <div className="lp-hero-content">
          <div className="lp-hero-badge">
            <MapPin size={14} /> Serving Ernakulam, Kochi
          </div>
          <h1>
            Reliable Cab Booking<br />
            for <span>Kochi Travelers</span>
          </h1>
          <p className="lp-hero-sub">
            Airport pickups, local rides, and tour packages — all managed through
            a modern booking platform with real-time status updates and instant notifications.
          </p>
          <div className="lp-hero-cta">
            <Link to={primaryAction} className="lp-btn lp-btn-primary">
              {primaryLabel} <ArrowRight size={18} />
            </Link>
            <a href="#how-it-works" className="lp-btn lp-btn-outline" onClick={(e) => { e.preventDefault(); scrollTo('how-it-works') }}>
              See How It Works
            </a>
          </div>
          <div className="lp-hero-stats">
            <div className="lp-stat">
              <span className="lp-stat-number">500+</span>
              <span className="lp-stat-label">Rides Completed</span>
            </div>
            <div className="lp-stat">
              <span className="lp-stat-number">4.8</span>
              <span className="lp-stat-label">Avg. Rating</span>
            </div>
            <div className="lp-stat">
              <span className="lp-stat-number">24/7</span>
              <span className="lp-stat-label">Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ FEATURES ══════════ */}
      <section className="lp-section lp-section-alt" id="features">
        <AnimateOnScroll>
          <div className="lp-section-header">
            <span className="lp-section-label">Platform Features</span>
            <h2 className="lp-section-title">Everything You Need for Hassle-Free Travel</h2>
            <p className="lp-section-desc">
              Built with modern technology to give you the best booking experience in Kochi.
            </p>
          </div>
        </AnimateOnScroll>

        <div className="lp-features-grid">
          {FEATURES.map((f, i) => (
            <AnimateOnScroll key={i} delay={Math.min(i + 1, 5)}>
              <div className="lp-feature-card">
                <div className="lp-feature-icon" style={{ background: f.color, color: f.iconColor }}>
                  {f.icon}
                </div>
                <div className="lp-feature-title">{f.title}</div>
                <div className="lp-feature-desc">{f.desc}</div>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </section>

      {/* ══════════ HOW IT WORKS ══════════ */}
      <section className="lp-section" id="how-it-works">
        <AnimateOnScroll>
          <div className="lp-section-header">
            <span className="lp-section-label">How It Works</span>
            <h2 className="lp-section-title">Book a Ride in 3 Simple Steps</h2>
            <p className="lp-section-desc">
              From registration to ride confirmation, the entire process takes under 2 minutes.
            </p>
          </div>
        </AnimateOnScroll>

        <div className="lp-steps">
          {STEPS.map((s, i) => (
            <AnimateOnScroll key={i} delay={i + 1}>
              <div className="lp-step">
                <div className="lp-step-number">{s.icon}</div>
                <div className="lp-step-title">{s.title}</div>
                <div className="lp-step-desc">{s.desc}</div>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </section>

      {/* ══════════ ABOUT ══════════ */}
      <section className="lp-section lp-section-alt" id="about">
        <div className="lp-about-grid">
          <AnimateOnScroll>
            <div className="lp-about-visual">
              <div className="lp-about-logo">
                <span className="brand-yes">Yes</span><span className="brand-cab">Cab</span>
              </div>
              <p className="lp-about-tagline">
                Premium cab service trusted by hundreds of travelers across Ernakulam district.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <span className="lp-btn lp-btn-ghost lp-btn-sm" style={{ pointerEvents: 'none' }}>
                  <Plane size={16} /> Airport Rides
                </span>
                <span className="lp-btn lp-btn-ghost lp-btn-sm" style={{ pointerEvents: 'none' }}>
                  <CarFront size={16} /> Local Taxi
                </span>
                <span className="lp-btn lp-btn-ghost lp-btn-sm" style={{ pointerEvents: 'none' }}>
                  <Map size={16} /> Tour Packages
                </span>
              </div>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll delay={2}>
            <div className="lp-about-text">
              <h3>Built for Kochi. Built for You.</h3>
              <p>
                YesCab is a modern cab booking platform designed specifically for travelers
                in and around Ernakulam, Kochi. Whether you need an airport pickup at dawn,
                a reliable local taxi, or a curated tour package to Munnar, we have you covered.
              </p>
              <p>
                Our platform combines real-time booking management with instant WhatsApp notifications
                and email updates — so you always know exactly where your ride stands.
              </p>
              <div className="lp-about-highlights">
                <div className="lp-highlight"><div className="lp-highlight-dot" /> Professional, verified drivers</div>
                <div className="lp-highlight"><div className="lp-highlight-dot" /> Transparent, upfront pricing</div>
                <div className="lp-highlight"><div className="lp-highlight-dot" /> Admin-reviewed bookings for safety</div>
                <div className="lp-highlight"><div className="lp-highlight-dot" /> 24/7 customer support via WhatsApp</div>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ══════════ TESTIMONIALS ══════════ */}
      <section className="lp-section" id="testimonials">
        <AnimateOnScroll>
          <div className="lp-section-header">
            <span className="lp-section-label">Testimonials</span>
            <h2 className="lp-section-title">What Our Customers Say</h2>
            <p className="lp-section-desc">
              Real feedback from travelers who trust YesCab for their daily commute and special trips.
            </p>
          </div>
        </AnimateOnScroll>

        <div className="lp-testimonials-grid">
          {TESTIMONIALS.map((t, i) => (
            <AnimateOnScroll key={i} delay={i + 1}>
              <div className="lp-testimonial-card">
                <div className="lp-testimonial-stars">
                  {[...Array(5)].map((_, j) => <Star key={j} size={16} fill="currentColor" />)}
                </div>
                <p className="lp-testimonial-text">"{t.text}"</p>
                <div className="lp-testimonial-author">
                  <div className="lp-testimonial-avatar">{t.initials}</div>
                  <div>
                    <div className="lp-testimonial-name">{t.name}</div>
                    <div className="lp-testimonial-role">{t.role}</div>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </section>

      {/* ══════════ CTA ══════════ */}
      <section className="lp-cta-section lp-section-alt">
        <div className="lp-cta-glow" />
        <AnimateOnScroll>
          <div className="lp-cta-content">
            <h2>Ready to Book Your Next Ride?</h2>
            <p>
              Join hundreds of satisfied travelers in Kochi. Create your free account
              and book your first cab in under two minutes.
            </p>
            <div className="lp-cta-buttons">
              <Link to={primaryAction} className="lp-btn lp-btn-primary">
                {primaryLabel} <ArrowRight size={18} />
              </Link>
              {!user && (
                <Link to="/login" className="lp-btn lp-btn-outline">
                  Already have an account? Sign In
                </Link>
              )}
            </div>
          </div>
        </AnimateOnScroll>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <Footer />
    </div>
  )
}
