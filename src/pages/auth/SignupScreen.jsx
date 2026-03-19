import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRole } from '../../context/RoleContext'
import { GlassCard, PrimaryButton, InputField } from '../../components'
import './SignupScreen.css'

const ROLE_LABELS = { tenant: 'Tenant', owner: 'NRI Owner', provider: 'Service Provider', admin: 'Admin' }

export default function SignupScreen() {
  const navigate = useNavigate()
  const { signup, role } = useRole()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignup = async () => {
    if (!name.trim()) { setError('Please enter your full name'); return }
    if (!email.trim()) { setError('Please enter your email'); return }
    if (!phone.trim()) { setError('Please enter your phone number'); return }
    if (!password.trim() || password.length < 8) { setError('Password must be at least 8 characters'); return }
    setError('')
    setLoading(true)
    try {
      await signup(name.trim(), email.trim(), phone.trim(), password, role)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="signup page-transition">
      <div className="signup__bg" />

      <div className="signup__content">
        {/* Back */}
        <button className="signup__back" onClick={() => navigate('/login')}>
          <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>arrow_back</span>
        </button>

        {/* Header */}
        <div className="signup__header animate-slide-down">
          <div className="signup__icon">
            <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'var(--accent)' }}>person_add</span>
          </div>
          <h1 className="signup__title">Create Account</h1>
          <p className="signup__subtitle">
            Sign up as <strong>{ROLE_LABELS[role] || 'User'}</strong>
          </p>
        </div>

        {/* Form */}
        <GlassCard className="signup__form-card animate-slide-up">
          <div className="signup__form">
            <InputField label="Full Name" icon="person" placeholder="Priya Sharma" value={name} onChange={(e) => setName(e.target.value)} />
            <InputField label="Email Address" icon="mail" type="email" placeholder="priya@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <InputField label="Phone Number" icon="phone" type="tel" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <InputField label="Password" icon="lock" type="password" placeholder="Min 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} />

            {error && <p className="signup__error">{error}</p>}

            <PrimaryButton icon="how_to_reg" loading={loading} onClick={handleSignup}>
              {loading ? 'Creating Account...' : 'Sign Up →'}
            </PrimaryButton>
          </div>
        </GlassCard>

        {/* Login link */}
        <p className="signup__login-link animate-fade-in" style={{ animationDelay: '300ms' }}>
          Already have an account?{' '}
          <button className="signup__link" onClick={() => navigate('/login')}>Sign In</button>
        </p>
      </div>
    </div>
  )
}
