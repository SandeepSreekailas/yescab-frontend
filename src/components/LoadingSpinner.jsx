/**
 * LoadingSpinner
 * Props:
 *   fullPage — center spinner vertically in the full viewport
 *   small    — render the small variant (inline use)
 *   text     — optional label shown below the spinner
 */
export default function LoadingSpinner({ fullPage = false, small = false, text }) {
  if (fullPage) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          color: 'var(--text-muted)',
          fontSize: '0.9rem',
        }}
      >
        <div className="spinner" />
        {text && <span>{text}</span>}
      </div>
    )
  }

  if (small) {
    return <div className="spinner spinner-sm" style={{ display: 'inline-block' }} />
  }

  return (
    <div className="spinner-wrap" style={{ flexDirection: 'column', gap: '1rem' }}>
      <div className="spinner" />
      {text && (
        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{text}</span>
      )}
    </div>
  )
}
