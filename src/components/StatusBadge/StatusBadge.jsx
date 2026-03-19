import './StatusBadge.css'

/**
 * StatusBadge — Colored pill badges for status indicators.
 *
 * @param {'overdue'|'pending'|'verified'|'success'|'escrowed'|'info'|'scheduled'|'active'|'completed'|'disputed'} props.status
 * @param {React.ReactNode} [props.children] — Label text (defaults to status name)
 * @param {string} [props.className]
 */

const STATUS_LABELS = {
  overdue:   'Overdue',
  pending:   'Pending',
  verified:  'Verified',
  success:   'Success',
  escrowed:  'Escrowed',
  info:      'Info',
  scheduled: 'Scheduled',
  active:    'Active',
  completed: 'Completed',
  disputed:  'Disputed',
}

const STATUS_CLASS_MAP = {
  overdue:   'status-badge--overdue',
  pending:   'status-badge--pending',
  verified:  'status-badge--verified',
  success:   'status-badge--success',
  escrowed:  'status-badge--escrowed',
  info:      'status-badge--info',
  scheduled: 'status-badge--info',
  active:    'status-badge--pending',
  completed: 'status-badge--success',
  disputed:  'status-badge--overdue',
}

export default function StatusBadge({ status = 'info', children, className = '', ...rest }) {
  const cls = [
    'status-badge',
    STATUS_CLASS_MAP[status] || 'status-badge--info',
    className,
  ].filter(Boolean).join(' ')

  return (
    <span className={cls} {...rest}>
      {children || STATUS_LABELS[status] || status}
    </span>
  )
}
