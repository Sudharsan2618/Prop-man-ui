import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRole } from '../../context/RoleContext'
import { useNavigation } from '../../hooks/useNavigation'
import {
  PageShell, AppHeader, BottomNav, GlassCard, SearchBar, FilterChips, FAB, Avatar,
} from '../../components'
import './MessagingInbox.css'

const CONVERSATIONS = [
  { id: 'c1', name: 'Priya Sharma', initials: 'PS', online: true, preview: "Sure, I'll send the documents by tomorrow...", time: '2m ago', unread: 3 },
  { id: 'c2', name: 'John Doe', initials: 'JD', online: true, preview: 'The plumbing repair is scheduled for Thursday.', time: '15m ago', unread: 1 },
  { id: 'c3', name: 'Sarah Jenkins', initials: 'SJ', online: false, preview: 'Thank you for the quick response!', time: '1h ago', unread: 0 },
  { id: 'c4', name: 'Vikram Patel', initials: 'VP', online: false, preview: 'Can we reschedule the inspection?', time: '3h ago', unread: 0 },
  { id: 'c5', name: 'LuxeLife Support', initials: 'LS', online: true, preview: 'Your KYC documents have been verified.', time: '1d ago', unread: 0 },
]

const FILTERS = ['All', 'Tenants', 'Owners', 'Maintenance']

export default function MessagingInbox() {
  const { role } = useRole()
  const navigate = useNavigate()
  const { handleTabChange: _navTabChange } = useNavigation()
  const [activeTab, setActiveTab] = useState('messages')
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')

  const filtered = CONVERSATIONS.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    _navTabChange(tab)
  }

  return (
    <PageShell
      header={<AppHeader title="Messages" />}
      bottomNav={<BottomNav role={role} activeTab={activeTab} onTabChange={handleTabChange} />}
    >
      <div className="mi stagger-children">
        <SearchBar placeholder="Search messages" value={search} onChange={(e) => setSearch(e.target.value)} />

        <FilterChips chips={FILTERS} activeChip={filter} onChipClick={setFilter} />

        <div className="mi__list">
          {filtered.map((conv) => (
            <GlassCard key={conv.id} interactive className="mi__conv animate-slide-up" onClick={() => navigate(`/chat/${conv.id}`)}>
              <div className="mi__conv-row">
                <div className="mi__avatar-wrap">
                  <Avatar initials={conv.initials} size="md" />
                  {conv.online && <span className="mi__online-dot" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontWeight: conv.unread > 0 ? 'var(--fw-bold)' : 'var(--fw-medium)' }}>{conv.name}</p>
                    <span className="mi__time">{conv.time}</span>
                  </div>
                  <p className="mi__preview">{conv.preview}</p>
                </div>
                {conv.unread > 0 && <span className="mi__unread-badge">{conv.unread}</span>}
              </div>
            </GlassCard>
          ))}
        </div>

        <FAB icon="edit" onClick={() => {}} />
      </div>
    </PageShell>
  )
}
