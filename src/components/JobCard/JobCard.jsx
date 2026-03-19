import './JobCard.css'

/**
 * JobCard — Service job card with type, status, address, tenant, actions.
 *
 * @param {string}  props.icon         — Material Symbol for service type
 * @param {string}  props.serviceType  — e.g. "Plumbing Repair"
 * @param {string}  [props.description] — e.g. "Sink Leak"
 * @param {React.ReactNode} props.statusBadge — StatusBadge element
 * @param {string}  props.address
 * @param {string}  [props.time]
 * @param {string}  [props.tenantName]
 * @param {React.ReactNode} [props.actions] — Button row
 */
export default function JobCard({
  icon = 'build',
  serviceType,
  description,
  statusBadge,
  address,
  time,
  tenantName,
  actions,
  className = '',
  ...rest
}) {
  return (
    <div className={`job-card glass-card ${className}`} {...rest}>
      <div className="job-card__header">
        <div className="job-card__type">
          <span className="material-symbols-outlined job-card__icon">{icon}</span>
          <div>
            <p className="job-card__service">{serviceType}</p>
            {description && <p className="job-card__desc">{description}</p>}
          </div>
        </div>
        {statusBadge}
      </div>

      <div className="job-card__details">
        {address && (
          <div className="job-card__detail">
            <span className="material-symbols-outlined">location_on</span>
            <span>{address}</span>
          </div>
        )}
        {time && (
          <div className="job-card__detail">
            <span className="material-symbols-outlined">schedule</span>
            <span>{time}</span>
          </div>
        )}
        {tenantName && (
          <div className="job-card__detail">
            <span className="material-symbols-outlined">person</span>
            <span>Tenant: {tenantName}</span>
          </div>
        )}
      </div>

      {actions && <div className="job-card__actions">{actions}</div>}
    </div>
  )
}
