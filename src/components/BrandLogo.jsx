import logoImg from '../assets/logo.webp'

/**
 * BrandLogo — Reusable YezCabs branding component.
 *
 * @param {"sm" | "md" | "lg"} size   – Controls logo + text scale
 * @param {boolean}            showText – Whether to render "YezCabs" next to the logo
 * @param {string}             className – Extra CSS class on the wrapper
 */
export default function BrandLogo({ size = 'md', showText = true, className = '' }) {
  return (
    <div className={`brand-logo brand-logo--${size} ${className}`}>
      <img
        src={logoImg}
        alt="YezCabs Logo"
        className="brand-logo__img"
        draggable={false}
      />
      {showText && (
        <span className="brand-logo__text">
          Yez<span>Cabs</span>
        </span>
      )}
    </div>
  )
}
