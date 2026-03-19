import { useState, useEffect, useRef } from 'react'
import './CountdownTimer.css'

/**
 * CountdownTimer — Days/hours/minutes boxes countdown.
 *
 * @param {Date|string|number} props.targetDate — Target date to count down to
 * @param {string} [props.label] — Optional label above timer
 */
export default function CountdownTimer({
  targetDate,
  label,
  className = '',
  ...rest
}) {
  const [timeLeft, setTimeLeft] = useState(calcTimeLeft())
  const intervalRef = useRef(null)

  function calcTimeLeft() {
    const target = new Date(targetDate).getTime()
    const now = Date.now()
    const diff = Math.max(0, target - now)
    return {
      days:  Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      mins:  Math.floor((diff / (1000 * 60)) % 60),
    }
  }

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeLeft(calcTimeLeft())
    }, 60000) // update every minute
    return () => clearInterval(intervalRef.current)
  }, [targetDate])

  return (
    <div className={`countdown ${className}`} {...rest}>
      {label && <p className="countdown__label">{label}</p>}
      <div className="countdown__boxes">
        <div className="countdown__box">
          <span className="countdown__number">{String(timeLeft.days).padStart(2, '0')}</span>
          <span className="countdown__unit">DAYS</span>
        </div>
        <div className="countdown__box">
          <span className="countdown__number">{String(timeLeft.hours).padStart(2, '0')}</span>
          <span className="countdown__unit">HRS</span>
        </div>
        <div className="countdown__box">
          <span className="countdown__number">{String(timeLeft.mins).padStart(2, '0')}</span>
          <span className="countdown__unit">MINS</span>
        </div>
      </div>
    </div>
  )
}
