import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRole } from '../../context/RoleContext'
import { useNavigation } from '../../hooks/useNavigation'
import {
  PageShell, AppHeader, BottomNav, SearchBar, FilterChips, PropertyCard, PrimaryButton,
  Skeleton,
} from '../../components'
import { fetchProperties, formatRent } from '../../services/api'
import './PropertyDiscovery.css'

export default function PropertyDiscovery() {
  const navigate = useNavigate()
  const { role, user } = useRole()
  const { handleTabChange: _navTabChange } = useNavigation()
  const [activeTab, setActiveTab] = useState('properties')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeChips, setActiveChips] = useState(['all'])
  const [favorites, setFavorites] = useState(new Set())

  const chips = [
    { key: 'all', label: 'All' },
    { key: '3bhk', label: '3 BHK', removable: true },
    { key: 'furnished', label: 'Furnished', removable: true },
    { key: 'premium', label: 'Premium' },
    { key: 'villa', label: 'Villa' },
  ]

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim())
    }, 400)

    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    loadProperties()
  }, [activeChips, debouncedSearch])

  async function loadProperties() {
    setLoading(true)
    const filters = {}
    if (debouncedSearch.length >= 2) filters.search = debouncedSearch
    if (activeChips.includes('villa')) filters.type = 'VILLA'
    if (activeChips.includes('furnished')) filters.furnishing = 'FULLY_FURNISHED'
    if (activeChips.includes('premium')) {
      const data = await fetchProperties(filters)
      setProperties(data.filter((p) => p.premium))
    } else {
      const data = await fetchProperties(filters)
      setProperties(data)
    }
    setLoading(false)
  }

  const toggleFav = (id) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    _navTabChange(tab)
  }

  return (
    <PageShell
      header={
        <AppHeader
          title="LuxeLife"
          subtitle="Properties"
          avatarText={user?.initials || ''}
          hasNotification={true}
          onNotificationClick={() => navigate('/notifications')}
          onAvatarClick={() => navigate('/profile')}
        />
      }
      bottomNav={<BottomNav role={role} activeTab={activeTab} onTabChange={handleTabChange} />}
    >
      <div className="prop-discovery">
        {/* Search */}
        <div className="prop-discovery__search">
          <SearchBar
            placeholder="Bandra West, Mumbai"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            showFilter
            onFilter={() => {}}
          />
        </div>

        {/* Filter Chips */}
        <FilterChips
          chips={chips}
          activeChips={activeChips}
          onChipClick={(k) => setActiveChips(k === 'all' ? ['all'] : [k])}
          onChipRemove={(k) => setActiveChips(['all'])}
        />

        {/* Property Cards */}
        <div className="prop-discovery__list">
          {loading ? (
            <>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} height="320px" radius="var(--radius-xl)" />
              ))}
            </>
          ) : properties.length === 0 ? (
            <div className="prop-discovery__empty">
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-tertiary)' }}>search_off</span>
              <p>No properties found</p>
            </div>
          ) : (
            properties.map((p) => (
              <PropertyCard
                key={p.id}
                image={p.image}
                name={p.name}
                location={p.address}
                rent={formatRent(p.rent)}
                chips={p.chips}
                amenityIcons={p.amenityIcons}
                premium={p.premium}
                favorited={favorites.has(p.id)}
                onFavorite={() => toggleFav(p.id)}
                onClick={() => navigate(`/property/${p.id}`)}
                badge={
                  <PrimaryButton fullWidth={false} onClick={(e) => { e.stopPropagation(); navigate(`/property/${p.id}`) }}>
                    View Details
                  </PrimaryButton>
                }
              />
            ))
          )}
        </div>
      </div>
    </PageShell>
  )
}
