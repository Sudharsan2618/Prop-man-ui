import './PropertyCard.css'

/**
 * PropertyCard — Property listing card with image, name, rent, feature chips.
 *
 * @param {string}  [props.image]     — Hero image URL
 * @param {string}  props.name        — Property name
 * @param {string}  props.location    — Location text
 * @param {string}  props.rent        — e.g. "₹1,50,000/mo"
 * @param {string[]} [props.chips]    — Feature chips e.g. ["3 BHK", "1500 sqft", "Furnished"]
 * @param {string[]} [props.amenityIcons] — Material icon names for amenity row
 * @param {boolean} [props.premium]   — Show PREMIUM badge
 * @param {boolean} [props.favorited] — Heart icon state
 * @param {function} [props.onFavorite]
 * @param {function} [props.onClick]
 * @param {React.ReactNode} [props.badge] — Status badge (e.g. occupancy)
 */
export default function PropertyCard({
  image,
  name,
  location,
  rent,
  chips = [],
  amenityIcons = [],
  premium = false,
  favorited = false,
  onFavorite,
  onClick,
  badge,
  className = '',
  ...rest
}) {
  return (
    <div className={`property-card glass-card ${className}`} {...rest}>
      {/* Image section */}
      {image && (
        <div className="property-card__image-wrap">
          <img src={image} alt={name} className="property-card__image" />
          {premium && <span className="property-card__premium">PREMIUM</span>}
          <button
            className={`property-card__fav ${favorited ? 'property-card__fav--active' : ''}`}
            onClick={(e) => { e.stopPropagation(); onFavorite?.() }}
            aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <span className={`material-symbols-outlined ${favorited ? 'icon-filled' : ''}`}>
              favorite
            </span>
          </button>
        </div>
      )}

      {/* Info section */}
      <div className="property-card__info" onClick={onClick}>
        <div className="property-card__row">
          <h3 className="property-card__name">{name}</h3>
          <span className="property-card__rent">{rent}</span>
        </div>
        <div className="property-card__location">
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>location_on</span>
          <span>{location}</span>
        </div>

        {chips.length > 0 && (
          <div className="property-card__chips">
            {chips.map((chip, i) => (
              <span key={i} className="property-card__chip">{chip}</span>
            ))}
          </div>
        )}

        {amenityIcons.length > 0 && (
          <div className="property-card__amenities">
            {amenityIcons.map((icon, i) => (
              <span key={i} className="material-symbols-outlined property-card__amenity-icon" title={icon}>{icon}</span>
            ))}
          </div>
        )}

        {badge && <div className="property-card__badge-row">{badge}</div>}
      </div>
    </div>
  )
}
