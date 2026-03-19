import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PageShell, SubPageHeader, GlassCard, ToggleSwitch, BottomNav,
} from '../../components'
import { useRole } from '../../context/RoleContext'
import { useNavigation } from '../../hooks/useNavigation'
import './NotificationPreferences.css'

const PUSH_ITEMS = [
  { key: 'rent', icon: 'payments', label: 'Rent Reminders', desc: 'Get notified before rent due dates', default: true },
  { key: 'maint', icon: 'build', label: 'Maintenance Updates', desc: 'Status changes for service requests', default: true },
  { key: 'msg', icon: 'chat', label: 'New Message Alerts', desc: 'Incoming messages from contacts', default: true },
]

const EMAIL_ITEMS = [
  { key: 'payout', icon: 'account_balance', label: 'Payout Confirmations', desc: 'Email receipts for each payout', default: true },
  { key: 'inspect', icon: 'fact_check', label: 'Inspection Schedules', desc: 'Upcoming inspection reminders', default: false },
]

export default function NotificationPreferences() {
  const navigate = useNavigate()
  const { handleTabChange: _navTabChange } = useNavigation()
  const { role } = useRole()
  const [activeTab, setActiveTab] = useState('settings')
  const [pushToggles, setPushToggles] = useState(
    Object.fromEntries(PUSH_ITEMS.map((i) => [i.key, i.default]))
  )
  const [emailToggles, setEmailToggles] = useState(
    Object.fromEntries(EMAIL_ITEMS.map((i) => [i.key, i.default]))
  )
  const [dndEnabled, setDndEnabled] = useState(false)
  const [dndFrom, setDndFrom] = useState('22:00')
  const [dndTo, setDndTo] = useState('07:00')

  const togglePush = (key) => setPushToggles((p) => ({ ...p, [key]: !p[key] }))
  const toggleEmail = (key) => setEmailToggles((p) => ({ ...p, [key]: !p[key] }))

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    _navTabChange(tab)
  }

  return (
    <PageShell
      header={<SubPageHeader title="Notification Settings" onBack={() => navigate(-1)} />}
      bottomNav={<BottomNav role={role} activeTab={activeTab} onTabChange={handleTabChange} />}
    >
      <div className="np stagger-children">
        {/* Push Notifications */}
        <div>
          <p className="np__heading">Push Notifications</p>
          <div className="np__toggle-list">
            {PUSH_ITEMS.map((item) => (
              <GlassCard key={item.key}>
                <div className="np__toggle-row">
                  <div className="np__toggle-icon">
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--primary)' }}>{item.icon}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 'var(--fw-medium)' }}>{item.label}</p>
                    <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-tertiary)' }}>{item.desc}</p>
                  </div>
                  <ToggleSwitch checked={pushToggles[item.key]} onChange={() => togglePush(item.key)} />
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Email Alerts */}
        <div>
          <p className="np__heading">Email Alerts</p>
          <div className="np__toggle-list">
            {EMAIL_ITEMS.map((item) => (
              <GlassCard key={item.key}>
                <div className="np__toggle-row">
                  <div className="np__toggle-icon">
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--primary)' }}>{item.icon}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 'var(--fw-medium)' }}>{item.label}</p>
                    <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-tertiary)' }}>{item.desc}</p>
                  </div>
                  <ToggleSwitch checked={emailToggles[item.key]} onChange={() => toggleEmail(item.key)} />
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Do Not Disturb */}
        <div>
          <p className="np__heading">Do Not Disturb</p>
          <GlassCard>
            <ToggleSwitch label="Enable Schedule" checked={dndEnabled} onChange={() => setDndEnabled(!dndEnabled)} />
            {dndEnabled && (
              <div className="np__dnd-times animate-slide-up">
                <div className="np__time-picker">
                  <label className="np__time-label">From</label>
                  <input type="time" className="np__time-input" value={dndFrom} onChange={(e) => setDndFrom(e.target.value)} />
                </div>
                <div className="np__time-picker">
                  <label className="np__time-label">To</label>
                  <input type="time" className="np__time-input" value={dndTo} onChange={(e) => setDndTo(e.target.value)} />
                </div>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </PageShell>
  )
}
