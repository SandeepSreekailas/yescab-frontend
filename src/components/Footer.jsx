import React from 'react'
import { Link } from 'react-router-dom'
import { Phone, Mail, MapPin, Globe, MessageCircle, Send } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer-wrap">
      <div className="container footer-content">
        {/* Brand & Mission */}
        <div className="footer-section">
          <Link to="/" className="footer-brand">
            <span className="brand-yes">Yes</span><span className="brand-cab">Cab</span>
          </Link>
          <p className="footer-desc">
            Your premium transportation partner in Ernakulam. Professional drivers, 
            transparent pricing, and 24/7 support for all your travel needs.
          </p>
          <div className="footer-socials">
            <a href="#" className="social-icon" aria-label="Website"><Globe size={20} /></a>
            <a href="#" className="social-icon" aria-label="WhatsApp"><MessageCircle size={20} /></a>
            <a href="#" className="social-icon" aria-label="Telegram"><Send size={20} /></a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="footer-section">
          <h4 className="footer-heading">Services</h4>
          <ul className="footer-links">
            <li><Link to="/book">Local Taxi</Link></li>
            <li><Link to="/book">Airport Pickup</Link></li>
            <li><Link to="/book">Airport Drop</Link></li>
            <li><Link to="/book">Tour Packages</Link></li>
          </ul>
        </div>

        {/* Support & Legal */}
        <div className="footer-section">
          <h4 className="footer-heading">Company</h4>
          <ul className="footer-links">
            <li><Link to="/dashboard">About Us</Link></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
            <li><Link to="/terms">Terms & Conditions</Link></li>
            <li><Link to="/my-bookings">My Bookings</Link></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="footer-section">
          <h4 className="footer-heading">Contact Us</h4>
          <ul className="footer-contact">
            <li>
              <MapPin size={18} />
              <span>Ernakulam, Kochi, Kerala, India</span>
            </li>
            <li>
              <Phone size={18} />
              <span>+91 {import.meta.env.VITE_ADMIN_WHATSAPP_NUMBER || '9876543210'}</span>
            </li>
            <li>
              <Mail size={18} />
              <span>support@yescab.com</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <p>&copy; {currentYear} YesCab Transportation Services. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
