import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PageShell, SubPageHeader, GlassCard, PrimaryButton, StatusBadge,
  InputField, ToggleSwitch,
} from '../../components'
import './BankAccounts.css'

const SAVED_ACCOUNTS = [
  { id: 'ba1', bank: 'HDFC Bank', number: '****4521', primary: true },
  { id: 'ba2', bank: 'ICICI Bank', number: '****7890', primary: false },
]

export default function BankAccounts() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState('ba1')
  const [autopay, setAutopay] = useState(true)
  const [holder, setHolder] = useState('')
  const [ifsc, setIfsc] = useState('')
  const [accNum, setAccNum] = useState('')
  const [showNum, setShowNum] = useState(false)

  return (
    <PageShell header={<SubPageHeader title="Bank Accounts" onBack={() => navigate(-1)} />}>
      <div className="ba animate-fade-in">
        {/* Saved Accounts */}
        <div className="ba__list">
          {SAVED_ACCOUNTS.map((acc) => (
            <GlassCard
              key={acc.id}
              interactive
              className={`ba__account ${selected === acc.id ? 'ba__account--selected' : ''}`}
              onClick={() => setSelected(acc.id)}
            >
              <div className="ba__acc-row">
                <div className="ba__bank-logo">
                  <span className="material-symbols-outlined" style={{ fontSize: '22px', color: 'var(--primary)' }}>account_balance</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <p style={{ fontWeight: 'var(--fw-semibold)' }}>{acc.bank}</p>
                    {acc.primary && <StatusBadge status="active">Primary</StatusBadge>}
                  </div>
                  <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{acc.number}</p>
                </div>
                {selected === acc.id ? (
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '22px' }}>check_circle</span>
                ) : (
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--text-tertiary)', fontSize: '20px' }}>more_vert</span>
                  </button>
                )}
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Add New Account */}
        <GlassCard>
          <p style={{ fontWeight: 'var(--fw-semibold)', marginBottom: 'var(--space-3)' }}>Add New Account</p>
          <div className="ba__form">
            <InputField label="Account Holder Name" icon="person" value={holder} onChange={(e) => setHolder(e.target.value)} placeholder="Full name as per bank" />
            <InputField label="IFSC Code" icon="pin" value={ifsc} onChange={(e) => setIfsc(e.target.value)} placeholder="e.g. HDFC0001234" />
            <div style={{ position: 'relative' }}>
              <InputField
                label="Account Number"
                icon="credit_card"
                type={showNum ? 'text' : 'password'}
                value={accNum}
                onChange={(e) => setAccNum(e.target.value)}
                placeholder="Enter account number"
              />
              <button
                className="ba__toggle-vis"
                onClick={() => setShowNum(!showNum)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{showNum ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
            <PrimaryButton icon="add">+ Add Account</PrimaryButton>
          </div>
        </GlassCard>

        {/* Payout Settings */}
        <GlassCard>
          <ToggleSwitch
            label="Auto-payout on Mondays"
            checked={autopay}
            onChange={() => setAutopay(!autopay)}
          />
          <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-tertiary)', marginTop: 'var(--space-1)' }}>
            Automatically transfer available balance every Monday to your primary bank account
          </p>
        </GlassCard>
      </div>
    </PageShell>
  )
}
