import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRole } from './context/RoleContext'
import {
  GlassCard,
  StatusBadge,
  PrimaryButton,
  SecondaryButton,
  BottomNav,
  AppHeader,
  SubPageHeader,
  PageShell,
  QuickActionCard,
  ActivityCard,
  SearchBar,
  FilterChips,
  TabNav,
  InputField,
  Dropdown,
  Avatar,
  ProgressBar,
  ToggleSwitch,
  PropertyCard,
  JobCard,
  NotificationCard,
  UserCard,
  CountdownTimer,
  FAB,
} from './components'
import { recentActivity } from './data/payments'
import { properties, formatRent } from './data/properties'
import { notifications } from './data/inspections'
import { jobs } from './data/jobs'
import { users } from './data/users'

function App() {
  const { role, setRole, user, roles } = useRole()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('home')
  const [currentView, setCurrentView] = useState('main')
  const [searchVal, setSearchVal] = useState('')
  const [activeChips, setActiveChips] = useState(['all'])
  const [tabKey, setTabKey] = useState('overview')
  const [toggleOn, setToggleOn] = useState(true)

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    // Route to real pages when they are built
    const routeMap = {
      properties: '/properties', services: '/services', payments: '/payments',
      profile: '/profile', dashboard: '/dashboard', maintenance: '/maintenance',
      tax: '/tax', jobs: '/jobs', messages: '/messages', finance: '/finance',
      users: '/users',
    }
    if (routeMap[tab]) navigate(routeMap[tab])
  }

  /* ── Sub-page demo ── */
  if (currentView === 'subpage') {
    return (
      <PageShell
        header={
          <SubPageHeader title="Secure Payment" icon="lock" onBack={() => setCurrentView('main')}
            rightAction={<button style={{ background: 'none', border: 'none', cursor: 'pointer' }}><span className="material-symbols-outlined" style={{ color: 'var(--text-secondary)', fontSize: '24px' }}>more_horiz</span></button>}
          />
        }
        stickyFooter={<PrimaryButton icon="lock" amount="₹45,000 →">Pay Now</PrimaryButton>}
      >
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <GlassCard>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-lg)', background: 'var(--primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '24px' }}>receipt_long</span>
              </div>
              <div>
                <p style={{ fontWeight: 'var(--fw-semibold)' }}>Monthly Rent</p>
                <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>The Azure Horizon, Apt 4B</p>
              </div>
            </div>
            <div style={{ borderTop: '1px solid rgba(27, 42, 74, 0.04)', paddingTop: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-body)', color: 'var(--text-secondary)' }}>
                <span>Rent</span><span style={{ color: 'var(--text-primary)' }}>₹42,000</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-body)', color: 'var(--text-secondary)' }}>
                <span>Maintenance</span><span style={{ color: 'var(--text-primary)' }}>₹3,000</span>
              </div>
              <div style={{ borderTop: '1px dashed rgba(27, 42, 74, 0.06)', paddingTop: 'var(--space-2)', display: 'flex', justifyContent: 'space-between', fontWeight: 'var(--fw-bold)' }}>
                <span>Total Amount</span><span style={{ color: 'var(--primary)', fontSize: 'var(--fs-h2)' }}>₹45,000</span>
              </div>
            </div>
          </GlassCard>
          <div style={{ textAlign: 'center', padding: 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--text-tertiary)' }}>shield</span>
            <span style={{ fontSize: 'var(--fs-overline)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 'var(--fw-semibold)' }}>256-BIT SSL SECURED</span>
          </div>
        </div>
      </PageShell>
    )
  }

  /* ── Main demo page ── */
  return (
    <PageShell
      header={
        <AppHeader
          title="LuxeLife"
          subtitle={`Hello, ${user.name.split(' ')[0]}`}
          avatarText={user.initials}
          hasNotification={true}
          onNotificationClick={() => navigate('/notifications')}
          onAvatarClick={() => navigate('/profile')}
        />
      }
      bottomNav={
        <BottomNav
          role={role}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          badges={{ messages: 3 }}
        />
      }
    >
      <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

        {/* ── Role Switcher ── */}
        <div>
          <p style={{ fontSize: 'var(--fs-overline)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'var(--space-2)' }}>
            Switch Role
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            {roles.map((r) => (
              <button key={r}
                onClick={() => { setRole(r); setActiveTab(r === 'owner' ? 'dashboard' : 'home') }}
                style={{ padding: '6px 14px', borderRadius: 'var(--radius-full)', background: role === r ? 'var(--primary)' : 'transparent', color: role === r ? 'var(--bg-dark)' : 'var(--text-secondary)', border: `1px solid ${role === r ? 'var(--primary)' : 'var(--text-tertiary)'}`, fontWeight: 'var(--fw-semibold)', fontSize: 'var(--fs-caption)', textTransform: 'capitalize', cursor: 'pointer', transition: 'all 0.2s ease' }}
              >{r}</button>
            ))}
          </div>
        </div>

        {/* ── Search & Filters ── */}
        <SearchBar placeholder="Search properties, services…" value={searchVal} onChange={(e) => setSearchVal(e.target.value)} showFilter />
        <FilterChips
          chips={[{ key: 'all', label: 'All' }, { key: 'apartments', label: 'Apartments' }, { key: 'villas', label: 'Villas' }, { key: 'premium', label: 'Premium' }]}
          activeChips={activeChips}
          onChipClick={(k) => setActiveChips([k])}
        />

        {/* ── Tabs ── */}
        <TabNav
          tabs={[{ key: 'overview', label: 'Overview' }, { key: 'activity', label: 'Activity', count: 5 }, { key: 'payments', label: 'Payments', count: 2 }]}
          activeTab={tabKey}
          onTabChange={setTabKey}
        />

        {/* ── Hero Rent Card ── */}
        <GlassCard variant="highlighted" className="animate-slide-up">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
            <StatusBadge status="overdue" />
            <span className="material-symbols-outlined" style={{ color: 'var(--text-tertiary)', fontSize: '20px', cursor: 'pointer' }}>more_horiz</span>
          </div>
          <p style={{ fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-medium)', marginBottom: '2px' }}>The Azure Horizon, Apt 4B</p>
          <p style={{ fontSize: 'var(--fs-overline)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--space-1)', marginTop: 'var(--space-3)' }}>CURRENT BALANCE</p>
          <p style={{ fontSize: 'var(--fs-display)', fontWeight: 'var(--fw-bold)', color: 'var(--primary)', marginBottom: 'var(--space-2)' }}>₹45,000</p>
          <CountdownTimer targetDate="2026-03-10T00:00:00" label="Time until due:" />
          <div style={{ marginTop: 'var(--space-4)' }}>
            <PrimaryButton icon="payments" onClick={() => setCurrentView('subpage')}>Pay Rent Now</PrimaryButton>
          </div>
        </GlassCard>

        {/* ── Quick Actions ── */}
        <div>
          <p style={{ fontSize: 'var(--fs-h3)', fontWeight: 'var(--fw-semibold)', marginBottom: 'var(--space-3)' }}>Quick Actions</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <QuickActionCard icon="search" label="Browse" onClick={() => navigate('/browse')} />
            <QuickActionCard icon="storefront" label="Marketplace" onClick={() => navigate('/marketplace')} />
            <QuickActionCard icon="build" label="Provider Mode" onClick={() => setRole('provider')} />
            <QuickActionCard icon="real_estate_agent" label="Owner Portfolio" onClick={() => setRole('owner')} />
          </div>
        </div>

        {/* ── Property Card ── */}
        <div>
          <p style={{ fontSize: 'var(--fs-h3)', fontWeight: 'var(--fw-semibold)', marginBottom: 'var(--space-3)' }}>Featured Property</p>
          <PropertyCard
            image={properties[0].image}
            name={properties[0].name}
            location={properties[0].address}
            rent={formatRent(properties[0].rent)}
            chips={properties[0].chips}
            amenityIcons={properties[0].amenityIcons}
            premium={properties[0].premium}
          />
        </div>

        {/* ── Activity Cards ── */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
            <p style={{ fontSize: 'var(--fs-h3)', fontWeight: 'var(--fw-semibold)' }}>Recent Activity</p>
            <a href="#" style={{ fontSize: 'var(--fs-caption)', color: 'var(--primary)', fontWeight: 'var(--fw-medium)' }}>View All</a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {recentActivity.slice(0, 3).map((a) => (
              <ActivityCard key={a.id} icon={a.icon} iconBg={a.iconBg} iconColor={a.iconColor} title={a.title} subtitle={a.subtitle} amount={a.amount} amountColor={a.amountColor} badge={a.badge ? <StatusBadge status={a.badge} /> : undefined} />
            ))}
          </div>
        </div>

        {/* ── Job Card ── */}
        <div>
          <p style={{ fontSize: 'var(--fs-h3)', fontWeight: 'var(--fw-semibold)', marginBottom: 'var(--space-3)' }}>Active Job</p>
          <JobCard
            icon={jobs[0].icon}
            serviceType={jobs[0].serviceType}
            description={jobs[0].description}
            statusBadge={<StatusBadge status={jobs[0].status} />}
            address={jobs[0].address}
            time={jobs[0].scheduledTime}
            tenantName={jobs[0].tenantName}
            actions={<><SecondaryButton icon="close">Decline</SecondaryButton><PrimaryButton icon="check">Accept</PrimaryButton></>}
          />
        </div>

        {/* ── Notifications ── */}
        <div>
          <p style={{ fontSize: 'var(--fs-h3)', fontWeight: 'var(--fw-semibold)', marginBottom: 'var(--space-3)' }}>Notifications</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {notifications.slice(0, 3).map((n) => (
              <NotificationCard key={n.id} icon={n.icon} iconBg={n.iconBg} iconColor={n.iconColor} title={n.title} body={n.body} timestamp={n.timestamp} unread={n.unread}
                action={n.actionLabel ? <PrimaryButton fullWidth={false}>{n.actionLabel}</PrimaryButton> : undefined}
              />
            ))}
          </div>
        </div>

        {/* ── User Cards ── */}
        <div>
          <p style={{ fontSize: 'var(--fs-h3)', fontWeight: 'var(--fw-semibold)', marginBottom: 'var(--space-3)' }}>Users</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {users.slice(0, 3).map((u) => (
              <UserCard key={u.id} initials={u.initials} name={u.name} email={u.email} role={u.role} verified={u.status === 'verified'} statusBadge={<StatusBadge status={u.status === 'verified' ? 'verified' : 'pending'} />} />
            ))}
          </div>
        </div>

        {/* ── Form Controls ── */}
        <div>
          <p style={{ fontSize: 'var(--fs-h3)', fontWeight: 'var(--fw-semibold)', marginBottom: 'var(--space-3)' }}>Form Controls</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <InputField label="Full Name" icon="person" placeholder="Enter your name" />
            <InputField label="Email" icon="mail" type="email" placeholder="you@example.com" error="Please enter a valid email" />
            <InputField label="Description" type="textarea" placeholder="Describe the issue…" />
            <Dropdown label="Property Type" options={[{ value: 'apartment', label: 'Apartment' }, { value: 'villa', label: 'Villa' }, { value: 'penthouse', label: 'Penthouse' }]} placeholder="Select type" />
            <ToggleSwitch label="Auto-Pay Rent" description="Automatically deduct rent on the due date" checked={toggleOn} onChange={() => setToggleOn(!toggleOn)} />
            <ProgressBar label="KYC Verification" value={85} />
            <ProgressBar label="Rent Collection" value={60} color="gold" />
          </div>
        </div>

        {/* ── Avatars ── */}
        <div>
          <p style={{ fontSize: 'var(--fs-h3)', fontWeight: 'var(--fw-semibold)', marginBottom: 'var(--space-3)' }}>Avatars</p>
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
            <Avatar initials="PS" size="sm" status="online" />
            <Avatar initials="RM" size="md" status="away" />
            <Avatar initials="JD" size="lg" status="busy" verified />
            <Avatar initials="AU" size="xl" status="offline" />
          </div>
        </div>

        {/* ── Buttons ── */}
        <div>
          <p style={{ fontSize: 'var(--fs-h3)', fontWeight: 'var(--fw-semibold)', marginBottom: 'var(--space-3)' }}>Buttons</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <PrimaryButton icon="payments">Pay Rent Now</PrimaryButton>
            <PrimaryButton loading>Processing...</PrimaryButton>
            <PrimaryButton disabled>Disabled</PrimaryButton>
            <PrimaryButton icon="lock" amount="₹45,000 →">Pay Now</PrimaryButton>
            <SecondaryButton icon="close">Cancel</SecondaryButton>
            <SecondaryButton variant="danger" icon="gavel">Raise Dispute</SecondaryButton>
          </div>
        </div>

      </div>

      <FAB icon="add" onClick={() => alert('FAB!')} />
    </PageShell>
  )
}

export default App
