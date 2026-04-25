/**
 * StatusBadge — displays a color-coded pill for booking status.
 * Supports: pending | approved | rejected
 */
export default function StatusBadge({ status }) {
  const config = {
    pending: { label: '⏳ Pending', className: 'badge-pending' },
    approved: { label: '✅ Approved', className: 'badge-approved' },
    rejected: { label: '❌ Rejected', className: 'badge-rejected' },
  }

  const { label, className } = config[status] ?? {
    label: status,
    className: '',
  }

  return <span className={`badge ${className}`}>{label}</span>
}
