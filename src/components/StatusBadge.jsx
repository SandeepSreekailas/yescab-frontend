/**
 * StatusBadge — displays a color-coded pill for booking status.
 * Supports: pending | approved | rejected
 */
import { Clock, CheckCircle, XCircle } from 'lucide-react'

export default function StatusBadge({ status }) {
  const config = {
    pending: { label: <><Clock size={14} /> Pending</>, className: 'badge-pending' },
    approved: { label: <><CheckCircle size={14} /> Approved</>, className: 'badge-approved' },
    rejected: { label: <><XCircle size={14} /> Rejected</>, className: 'badge-rejected' },
  }

  const { label, className } = config[status] ?? {
    label: status,
    className: '',
  }

  return <span className={`badge ${className}`}>{label}</span>
}
