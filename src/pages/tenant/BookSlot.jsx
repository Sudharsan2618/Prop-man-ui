import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageShell, SubPageHeader, GlassCard, PrimaryButton } from '../../components'
import { fetchServiceCategories } from '../../services/api'
import './BookSlot.css'

const TIME_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '01:00 PM', '02:00 PM',
  '03:00 PM', '04:00 PM', '05:00 PM',
]

function generateCalendar(year, month) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)
  return days
}

export default function BookSlot() {
  const { serviceKey } = useParams()
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState(10) // day of month
  const [selectedTime, setSelectedTime] = useState(null)
  const [calMonth, setCalMonth] = useState(2) // March (0-indexed)
  const [calYear, setCalYear] = useState(2026)
  const [service, setService] = useState({ key: serviceKey, label: 'Service', icon: 'build', startPrice: 500 })

  useEffect(() => {
    fetchServiceCategories().then(cats => {
      const found = cats.find((s) => s.key === serviceKey) || cats[0]
      if (found) setService(found)
    }).catch(() => {})
  }, [serviceKey])
  const days = generateCalendar(calYear, calMonth)
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December']

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1) }
    else setCalMonth(calMonth - 1)
  }
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1) }
    else setCalMonth(calMonth + 1)
  }

  return (
    <PageShell
      header={<SubPageHeader title={service.label} onBack={() => navigate(-1)} />}
      stickyFooter={
        <PrimaryButton
          icon="check"
          disabled={!selectedDate || !selectedTime}
          onClick={() => navigate('/booking-confirmed')}
        >
          Confirm Booking ✓
        </PrimaryButton>
      }
    >
      <div className="book-slot animate-fade-in">
        {/* Service Summary */}
        <GlassCard>
          <div className="book-slot__summary">
            <div className="book-slot__summary-icon">
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '28px' }}>{service.icon}</span>
            </div>
            <div>
              <p style={{ fontWeight: 'var(--fw-semibold)', marginBottom: '4px' }}>Service Summary</p>
              <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>Duration: 1-2 hours</p>
              <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>Price: ₹{service.startPrice} – ₹{service.startPrice * 3}</p>
            </div>
          </div>
        </GlassCard>

        {/* Calendar */}
        <div>
          <h2 className="section-heading">Select Date</h2>
          <GlassCard>
            <div className="book-slot__cal-header">
              <button className="book-slot__cal-nav" onClick={prevMonth}>
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <span className="book-slot__cal-month">{monthNames[calMonth]} {calYear}</span>
              <button className="book-slot__cal-nav" onClick={nextMonth}>
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
            <div className="book-slot__cal-weekdays">
              {['S','M','T','W','T','F','S'].map((d, i) => (
                <span key={i} className="book-slot__cal-wd">{d}</span>
              ))}
            </div>
            <div className="book-slot__cal-grid">
              {days.map((day, i) => (
                <button
                  key={i}
                  className={`book-slot__cal-day ${day === selectedDate ? 'book-slot__cal-day--selected' : ''} ${!day ? 'book-slot__cal-day--empty' : ''}`}
                  disabled={!day}
                  onClick={() => day && setSelectedDate(day)}
                >
                  {day}
                </button>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Time Slots */}
        <div>
          <h2 className="section-heading">Select Time Slot</h2>
          <div className="book-slot__times">
            {TIME_SLOTS.map((slot) => (
              <button
                key={slot}
                className={`book-slot__time ${selectedTime === slot ? 'book-slot__time--selected' : ''}`}
                onClick={() => setSelectedTime(slot)}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  )
}
