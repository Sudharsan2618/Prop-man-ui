/**
 * ComponentSandbox — Kitchen-sink dev preview of every component.
 *
 * Mounted only in DEV at /dev/components. Replaces the deleted App.jsx demo
 * page. Use this when reviewing tokens / variants without spinning up a real
 * page. NOT part of any user role's nav.
 */
import { useState } from 'react'
import {
  PageShell, SubPageHeader, GlassCard, StatusBadge,
  PrimaryButton, SecondaryButton, InputField, Dropdown,
  Avatar, ProgressBar, ToggleSwitch, ActivityCard, QuickActionCard,
  PropertyCard, JobCard, NotificationCard, UserCard,
  CountdownTimer, FAB, Skeleton, ConfirmModal, Drawer, Modal,
  PermissionGate,
} from '../../components'
import './ComponentSandbox.css'

const SECTIONS = [
  'Tokens', 'Buttons', 'Inputs', 'Cards', 'Status', 'Overlays', 'Layout',
]

export default function ComponentSandbox() {
  const [active, setActive] = useState('Tokens')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [toggleOn, setToggleOn] = useState(true)

  return (
    <PageShell header={<SubPageHeader title="Component Sandbox" onBack={() => window.history.back()} />}>
      <div className="cs">
        <div className="cs__nav">
          {SECTIONS.map((s) => (
            <button
              key={s}
              className={`cs__nav-btn ${active === s ? 'cs__nav-btn--active' : ''}`}
              onClick={() => setActive(s)}
            >
              {s}
            </button>
          ))}
        </div>

        {active === 'Tokens' && (
          <section className="cs__section">
            <h2 className="cs__heading">Design Tokens</h2>
            <div className="cs__token-grid">
              {['--bg-dark', '--surface-dark', '--primary', '--accent', '--text-primary', '--text-secondary',
                '--status-success', '--status-warning', '--status-danger', '--status-info'].map((t) => (
                <div key={t} className="cs__token">
                  <div className="cs__token-swatch" style={{ background: `var(${t})` }} />
                  <code>{t}</code>
                </div>
              ))}
            </div>
          </section>
        )}

        {active === 'Buttons' && (
          <section className="cs__section">
            <h2 className="cs__heading">Buttons</h2>
            <div className="cs__stack">
              <PrimaryButton icon="payments">Pay Rent Now</PrimaryButton>
              <PrimaryButton loading>Processing…</PrimaryButton>
              <PrimaryButton disabled>Disabled</PrimaryButton>
              <PrimaryButton icon="lock" amount="₹45,000 →">Pay Now</PrimaryButton>
              <SecondaryButton icon="close">Cancel</SecondaryButton>
              <SecondaryButton variant="danger" icon="gavel">Raise Dispute</SecondaryButton>
            </div>
          </section>
        )}

        {active === 'Inputs' && (
          <section className="cs__section">
            <h2 className="cs__heading">Inputs</h2>
            <div className="cs__stack">
              <InputField label="Full Name" icon="person" placeholder="Enter your name" />
              <InputField label="Email" icon="mail" type="email" placeholder="you@example.com" error="Please enter a valid email" />
              <InputField label="Description" type="textarea" placeholder="Describe the issue…" />
              <Dropdown label="Property Type" options={[
                { value: 'apartment', label: 'Apartment' },
                { value: 'villa', label: 'Villa' },
                { value: 'penthouse', label: 'Penthouse' },
              ]} placeholder="Select type" />
              <ToggleSwitch label="Auto-Pay Rent" description="Deduct rent on the due date" checked={toggleOn} onChange={() => setToggleOn(!toggleOn)} />
              <ProgressBar label="KYC Verification" value={85} />
              <ProgressBar label="Rent Collection" value={60} color="gold" />
            </div>
          </section>
        )}

        {active === 'Cards' && (
          <section className="cs__section">
            <h2 className="cs__heading">Cards</h2>
            <div className="cs__stack">
              <GlassCard><p>Default Glass Card</p></GlassCard>
              <GlassCard variant="highlighted"><p>Highlighted Glass Card</p></GlassCard>
              <ActivityCard icon="payments" iconBg="rgba(19,200,236,0.12)" iconColor="var(--primary)" title="Rent paid" subtitle="Mar 1, 2026" amount="₹45,000" />
              <div className="cs__grid-2">
                <QuickActionCard icon="search" label="Browse" />
                <QuickActionCard icon="storefront" label="Marketplace" />
              </div>
              <NotificationCard icon="payments" iconBg="rgba(19,200,236,0.12)" iconColor="var(--primary)" title="Rent due" body="Your March rent is due in 3 days" timestamp="2h ago" unread />
              <UserCard initials="JD" name="John Doe" email="john@example.com" role="Tenant" verified statusBadge={<StatusBadge status="verified" />} />
            </div>
          </section>
        )}

        {active === 'Status' && (
          <section className="cs__section">
            <h2 className="cs__heading">Status Badges</h2>
            <div className="cs__row-wrap">
              {['overdue', 'pending', 'verified', 'escrowed', 'completed', 'active'].map((s) => (
                <StatusBadge key={s} status={s} />
              ))}
            </div>
            <h3 className="cs__subheading">Countdown</h3>
            <CountdownTimer targetDate={new Date(Date.now() + 3 * 86400000).toISOString()} label="Time until due:" />
            <h3 className="cs__subheading">Avatars</h3>
            <div className="cs__row-wrap">
              <Avatar initials="PS" size="sm" status="online" />
              <Avatar initials="RM" size="md" status="away" />
              <Avatar initials="JD" size="lg" status="busy" verified />
              <Avatar initials="AU" size="xl" status="offline" />
            </div>
          </section>
        )}

        {active === 'Overlays' && (
          <section className="cs__section">
            <h2 className="cs__heading">Overlays</h2>
            <div className="cs__stack">
              <PrimaryButton onClick={() => setConfirmOpen(true)}>Open ConfirmModal</PrimaryButton>
              <PrimaryButton onClick={() => setDrawerOpen(true)}>Open Drawer</PrimaryButton>
              <PrimaryButton onClick={() => setModalOpen(true)}>Open Modal</PrimaryButton>
            </div>
            <ConfirmModal
              open={confirmOpen}
              title="Delete this item?"
              description="This action cannot be undone."
              confirmText="Delete"
              variant="danger"
              onConfirm={() => setConfirmOpen(false)}
              onCancel={() => setConfirmOpen(false)}
            />
            <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Drawer Example">
              <p>Drawer content goes here. Try Escape or clicking the backdrop.</p>
            </Drawer>
            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Modal Example">
              <p>Modal content. Use this for forms/dialogs that aren't anchored.</p>
            </Modal>
          </section>
        )}

        {active === 'Layout' && (
          <section className="cs__section">
            <h2 className="cs__heading">Layout / Skeleton</h2>
            <div className="cs__stack">
              <Skeleton height="20px" />
              <Skeleton height="120px" />
              <PermissionGate code="property.create" fallback={<p>(hidden — requires <code>property.create</code>)</p>}>
                <p>You hold <code>property.create</code>.</p>
              </PermissionGate>
            </div>
          </section>
        )}
      </div>

      <FAB icon="add" onClick={() => alert('FAB!')} />
    </PageShell>
  )
}
