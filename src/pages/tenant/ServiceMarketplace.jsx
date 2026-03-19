import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNavigation } from '../../hooks/useNavigation'
import {
  PageShell, AppHeader, BottomNav, GlassCard, StatusBadge,
  Skeleton,
} from '../../components'

import { fetchServiceCategories } from '../../services/api'
import './ServiceMarketplace.css'

export default function ServiceMarketplace() {
  const navigate = useNavigate()
  const { handleTabChange: _navTabChange } = useNavigation()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('services')

  useEffect(() => {
    fetchServiceCategories().then((data) => {
      setCategories(data)
      setLoading(false)
    })
  }, [])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    _navTabChange(tab)
  }

  return (
    <PageShell
      header={
        <AppHeader
          title="Service Marketplace"
          onNotificationClick={() => navigate('/notifications')}
          onAvatarClick={() => navigate('/profile')}
        >
          <button style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--text-secondary)', fontSize: '24px' }}>search</span>
          </button>
        </AppHeader>
      }
      bottomNav={
        <BottomNav role="tenant" activeTab={activeTab} onTabChange={handleTabChange} />
      }
    >
      <div className="svc-market animate-fade-in">
        {/* Location Bar */}
        <div className="svc-market__location">
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>location_on</span>
          <span className="svc-market__location-text">Services near Whitefield, Bangal...</span>
          <button className="svc-market__change-btn">CHANGE</button>
        </div>

        {/* Service Grid */}
        <div className="svc-market__grid">
          {loading ? (
            <>
              {[1,2,3,4,5,6,7,8].map((i) => (
                <Skeleton key={i} height="140px" radius="var(--radius-xl)" />
              ))}
            </>
          ) : (
            categories.map((cat) => (
              <GlassCard
                key={cat.key}
                interactive
                className={`svc-market__card ${cat.emergency ? 'svc-market__card--emergency' : ''}`}
                onClick={() => navigate(`/book-service/${cat.key}`)}
              >
                {cat.emergency && (
                  <span className="svc-market__emergency-badge">EMERGENCY</span>
                )}
                <span className={`material-symbols-outlined svc-market__card-icon ${cat.emergency ? 'svc-market__card-icon--emergency' : ''}`}>
                  {cat.icon}
                </span>
                <p className="svc-market__card-label">{cat.label}</p>
                <p className="svc-market__card-price">Starting from ₹{cat.startPrice}</p>
              </GlassCard>
            ))
          )}
        </div>
      </div>
    </PageShell>
  )
}
