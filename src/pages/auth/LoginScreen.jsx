import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRole } from '../../context/RoleContext'
import { GlassCard, PrimaryButton, InputField } from '../../components'
import './LoginScreen.css'

export default function LoginScreen() {
  const navigate = useNavigate()
  const { login } = useRole()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!email.trim()) { setError('Please enter your email'); return }
    if (!password.trim()) { setError('Please enter your password'); return }
    setError('')
    setLoading(true)
    try {
      await login(email.trim(), password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login page-transition">
      <div className="login__bg" />

      <div className="login__content">
        {/* Back */}
        <button className="login__back" onClick={() => navigate('/select-role')}>
          <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>arrow_back</span>
        </button>

        {/* Logo */}
        <div className="login__logo-section animate-slide-down">
          <div className="login__lock-icon">
            <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'var(--accent)' }}>lock</span>
          </div>
          <h1 className="login__title">Welcome Back</h1>
          <p className="login__subtitle">Sign in to your LuxeLife account</p>
        </div>

        {/* Form */}
        <GlassCard className="login__form-card animate-slide-up">
          <div className="login__form">
            <InputField
              label="Email"
              icon="mail"
              type="email"
              placeholder="admin@luxelife.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error && !email.trim() ? error : ''}
            />
            <div style={{ position: 'relative' }}>
              <InputField
                label="Password"
                icon="lock"
                type={showPwd ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={error && email.trim() && !password.trim() ? error : ''}
              />
              <button className="login__pwd-toggle" onClick={() => setShowPwd(!showPwd)}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  {showPwd ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            <div className="login__forgot">
              <button className="login__link">Forgot Password?</button>
            </div>

            {error && email.trim() && password.trim() && (
              <p className="login__error">{error}</p>
            )}

            <PrimaryButton icon="login" loading={loading} onClick={handleLogin}>
              {loading ? 'Signing In...' : 'Login →'}
            </PrimaryButton>
          </div>
        </GlassCard>

        {/* Biometric + OTP */}
        <div className="login__alt-auth animate-slide-up" style={{ animationDelay: '200ms' }}>
          <p className="login__divider-text">or sign in with</p>
          <div className="login__alt-buttons">
            <GlassCard interactive className="login__alt-btn" onClick={handleLogin}>
              <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--accent)' }}>fingerprint</span>
              <span>Biometrics</span>
            </GlassCard>
            <GlassCard interactive className="login__alt-btn" onClick={handleLogin}>
              <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--accent)' }}>sms</span>
              <span>OTP</span>
            </GlassCard>
          </div>
        </div>

        {/* Sign Up */}
        <p className="login__signup-link animate-fade-in" style={{ animationDelay: '400ms' }}>
          Don't have an account?{' '}
          <button className="login__link login__link--primary" onClick={() => navigate('/signup')}>Sign Up</button>
        </p>
      </div>
    </div>
  )
}
