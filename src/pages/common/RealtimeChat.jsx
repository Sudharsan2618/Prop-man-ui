import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageShell } from '../../components'
import './RealtimeChat.css'

const MOCK_MESSAGES = [
  { id: 1, sender: 'them', name: 'Priya Sharma', text: 'Hi, I wanted to discuss the maintenance schedule for this month.', time: '10:30 AM' },
  { id: 2, sender: 'them', name: 'Priya Sharma', text: 'There\'s a leaky faucet in the kitchen that needs attention.', time: '10:31 AM' },
  { id: 3, sender: 'me', text: 'Sure, I\'ll arrange a plumber visit this week.', time: '10:35 AM', delivered: true },
  { id: 4, sender: 'them', name: 'Priya Sharma', text: 'That would be great! Also, can you share the updated rent receipt?', time: '10:36 AM' },
  { id: 5, sender: 'me', text: 'I\'ll send it over by end of day today.', time: '10:38 AM', delivered: true },
  { id: 6, sender: 'them', name: 'Priya Sharma', text: 'Thank you! 🙏', time: '10:39 AM', type: 'text' },
]

export default function RealtimeChat() {
  const { chatId } = useParams()
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState(MOCK_MESSAGES)

  const sendMessage = () => {
    if (!message.trim()) return
    setMessages([...messages, {
      id: Date.now(), sender: 'me', text: message.trim(), time: 'Just now', delivered: false,
    }])
    setMessage('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <PageShell
      header={
        <div className="chat__header">
          <button className="chat__back-btn" onClick={() => navigate(-1)}>
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 'var(--fw-semibold)' }}>Priya Sharma</p>
            <div className="chat__status">
              <span className="chat__online-dot" />
              <span>Online</span>
            </div>
          </div>
          <span className="chat__unit-pill">Apt 4B</span>
          <button className="chat__action-btn">
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>call</span>
          </button>
        </div>
      }
    >
      <div className="chat">
        {/* Messages */}
        <div className="chat__messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`chat__bubble-wrap ${msg.sender === 'me' ? 'chat__bubble-wrap--me' : ''}`}>
              <div className={`chat__bubble ${msg.sender === 'me' ? 'chat__bubble--me' : 'chat__bubble--them'}`}>
                {msg.sender !== 'me' && <p className="chat__sender-name">{msg.name}</p>}
                <p className="chat__text">{msg.text}</p>
                <div className="chat__meta">
                  <span className="chat__time-stamp">{msg.time}</span>
                  {msg.sender === 'me' && (
                    <span className="material-symbols-outlined chat__delivery">{msg.delivered ? 'done_all' : 'check'}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <div className="chat__input-bar">
          <button className="chat__attach-btn">
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>add</span>
          </button>
          <input
            type="text"
            className="chat__input"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="chat__emoji-btn">
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>mood</span>
          </button>
          <button className="chat__mic-btn" onClick={sendMessage}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              {message.trim() ? 'send' : 'mic'}
            </span>
          </button>
        </div>
      </div>
    </PageShell>
  )
}
