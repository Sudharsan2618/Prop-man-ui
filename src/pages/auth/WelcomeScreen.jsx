import { useNavigate } from 'react-router-dom'
import { GlassCard, PrimaryButton } from '../../components'
import './WelcomeScreen.css'

const FEATURES = [
  { icon: 'real_estate_agent', title: 'Property Management', desc: 'Manage premium properties across India with real-time insights' },
  { icon: 'payments', title: 'Smart Payments', desc: 'Secure escrow-based rent collection with auto-splitting' },
  { icon: 'support_agent', title: '24/7 Support', desc: 'Dedicated concierge for maintenance, disputes & inspections' },
]

export default function WelcomeScreen() {
  const navigate = useNavigate()

  return (
    <div className="welcome page-transition">
      {/* Ambient Background */}
      <div className="welcome__bg" />
      <div className="welcome__glow welcome__glow--1" />
      <div className="welcome__glow welcome__glow--2" />

      <div className="welcome__content">
        {/* Logo */}
        <div className="welcome__logo-section animate-slide-down">
          <div className="welcome__logo-mark">
            <span className="material-symbols-outlined" style={{ fontSize: '36px', color: 'var(--accent)' }}>apartment</span>
          </div>
          <h1 className="welcome__brand">LuxeLife</h1>
          <p className="welcome__tagline">Premium Property Management for NRIs</p>
        </div>

        {/* Feature Cards */}
        <div className="welcome__features stagger-children">
          {FEATURES.map((f) => (
            <GlassCard key={f.title} className="welcome__feature-card animate-slide-up">
              <div className="welcome__feature-icon">
                <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--accent)' }}>{f.icon}</span>
              </div>
              <div>
                <p className="welcome__feature-title">{f.title}</p>
                <p className="welcome__feature-desc">{f.desc}</p>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* CTA */}
        <div className="welcome__cta animate-slide-up" style={{ animationDelay: '400ms' }}>
          <PrimaryButton icon="arrow_forward" onClick={() => navigate('/select-role')}>
            Get Started
          </PrimaryButton>
          <p className="welcome__signin-link">
            Already have an account?{' '}
            <button className="welcome__link" onClick={() => navigate('/login')}>Sign In</button>
          </p>
        </div>
      </div>
    </div>
  )
}
