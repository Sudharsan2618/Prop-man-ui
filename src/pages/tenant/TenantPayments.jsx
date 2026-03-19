import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRole } from '../../context/RoleContext'
import { useNavigation } from '../../hooks/useNavigation'
import {
  PageShell, SubPageHeader, BottomNav, GlassCard, PrimaryButton, StatusBadge,
  Skeleton,
} from '../../components'
import { fetchPayments } from '../../services/api'
import './TenantPayments.css'

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
}

const STATUS_MAP = {
  pending: { label: 'Pending', type: 'pending' },
  overdue: { label: 'Overdue', type: 'danger' },
  paid: { label: 'Paid', type: 'verified' },
  awaiting_verification: { label: 'Awaiting Verification', type: 'pending' },
  rejected: { label: 'Rejected', type: 'danger' },
}

const TYPE_ICON = {
  rent: 'home',
  advance: 'account_balance',
  service: 'build',
}

export default function TenantPayments() {
  const navigate = useNavigate()
  const { role } = useRole()
  const { handleTabChange: _navTabChange } = useNavigation()
  const [activeTab, setActiveTab] = useState('payments')
  const [filter, setFilter] = useState('all')
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadPayments() }, [filter])

  async function loadPayments() {
    setLoading(true)
    try {
      const params = {}
      if (filter !== 'all') params.status = filter
      const data = await fetchPayments(params)
      setPayments(data)
    } catch { setPayments([]) }
    setLoading(false)
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    _navTabChange(tab)
  }

  const handlePayNow = (payment) => {
    navigate('/pay', { state: { mode: payment.type, rentPaymentOverride: payment } })
  }

  const totalPending = payments
    .filter(p => p.status === 'pending' || p.status === 'overdue')
    .reduce((sum, p) => sum + p.amount, 0)

  return (
    <PageShell
      header={<SubPageHeader title="Payments" onBack={() => navigate(-1)} />}
      bottomNav={<BottomNav role={role} activeTab={activeTab} onTabChange={handleTabChange} />}
    >
      <div className="tp animate-fade-in">
        <GlassCard>
          <div className="tp__summary">
            <div>
              <p className="tp__summary-label">Pending Total</p>
              <p className="tp__summary-amount">₹{totalPending.toLocaleString('en-IN')}</p>
            </div>
            {totalPending > 0 && (
              <PrimaryButton fullWidth={false} onClick={() => {
                const next = payments.find(p => p.status === 'pending' || p.status === 'overdue')
                if (next) handlePayNow(next)
              }}>
                Clear Dues
              </PrimaryButton>
            )}
          </div>
        </GlassCard>

        <div className="tp__filters">
          {[
            { key: 'all', label: 'All' },
            { key: 'pending', label: 'Pending' },
            { key: 'paid', label: 'Paid' },
          ].map(f => (
            <button
              key={f.key}
              className={`tp__filter-btn ${filter === f.key ? 'tp__filter-btn--active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="tp__list">
          {loading ? (
            [1, 2, 3].map(i => (
              <Skeleton key={i} height="80px" radius="var(--radius-xl)" />
            ))
          ) : payments.length === 0 ? (
            <div className="tp__empty">
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-tertiary)' }}>payments</span>
              <p style={{ color: 'var(--text-secondary)' }}>No payments found</p>
            </div>
          ) : (
            payments.map(p => {
              const status = STATUS_MAP[p.status] || { label: p.status, type: 'pending' }
              const icon = TYPE_ICON[p.type] || 'receipt'
              const canPay = p.status === 'pending' || p.status === 'overdue' || p.status === 'rejected'

              return (
                <GlassCard key={p.id} className="tp__card">
                  <div className="tp__card-row">
                    <div className="tp__card-icon">
                      <span className="material-symbols-outlined" style={{ fontSize: '22px', color: 'var(--primary)' }}>{icon}</span>
                    </div>
                    <div className="tp__card-info">
                      <p className="tp__card-label">{p.label}</p>
                      <p className="tp__card-date">
                        {p.status === 'paid' ? `Verified ${formatDate(p.verified_at || p.paid_date)}` : `Due ${formatDate(p.due_date)}`}
                      </p>
                    </div>
                    <div className="tp__card-right">
                      <p className="tp__card-amount">₹{p.amount.toLocaleString('en-IN')}</p>
                      <StatusBadge status={status.type}>{status.label}</StatusBadge>
                    </div>
                  </div>
                  {p.rejection_reason && (
                    <p className="tp__rejection-note">Rejected: {p.rejection_reason}</p>
                  )}
                  {canPay && (
                    <div className="tp__card-action">
                      <PrimaryButton fullWidth onClick={() => handlePayNow(p)}>
                        Upload Payment Receipt
                      </PrimaryButton>
                    </div>
                  )}
                </GlassCard>
              )
            })
          )}
        </div>
      </div>
    </PageShell>
  )
}

