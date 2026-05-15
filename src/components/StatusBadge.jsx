/**
 * StatusBadge — displays a color-coded pill for booking status.
 * Supports: pending | approved | driver_assigned | completed | rejected
 */
import { Clock, CheckCircle, XCircle, CarFront, Check } from 'lucide-react'

export default function StatusBadge({ status }) {
  const config = {
    pending: { label: <><Clock size={14} /> Pending</>, className: 'badge-pending' },
    approved: { label: <><CheckCircle size={14} /> Approved</>, className: 'badge-approved' },
    driver_assigned: { label: <><CarFront size={14} /> Driver Assigned</>, className: 'badge-assigned' },
    completed: { label: <><Check size={14} /> Completed</>, className: 'badge-completed' },
    rejected: { label: <><XCircle size={14} /> Rejected</>, className: 'badge-rejected' },
  }

  const { label, className } = config[status] ?? {
    label: status,
    className: '',
  }

  return <span className={`badge ${className}`}>{label}</span>
}
