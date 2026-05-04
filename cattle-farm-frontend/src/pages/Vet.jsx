import { useState, useEffect, useRef } from 'react'
import { vetAPI, BASE_URL } from '../services/api'
import { io } from 'socket.io-client'

const LEVEL_CARDS = [
  { id:'ai',    emoji:'🤖', tag:'Level 01', label:'AI First Aid',    desc:'Instant advice from Gemma AI',    color:'var(--green)' },
  { id:'map',   emoji:'📍', tag:'Level 02', label:'Find a Vet',      desc:'Nearby vets on map',              color:'var(--blue)'  },
  { id:'video', emoji:'📹', tag:'Level 03', label:'Live Consult',    desc:'Chat & video with a vet',         color:'var(--amber)' },
]

const STATUS = {
  idle:       { color:'var(--text3)', bg:'var(--bg2)',      border:'var(--border)',                      label:'Not connected' },
  connecting: { color:'var(--amber)', bg:'var(--amber-dim)', border:'rgba(240,160,48,0.2)',              label:'Connecting…'  },
  connected:  { color:'var(--green)', bg:'var(--green-dim)', border:'rgba(34,201,122,0.2)',              label:'Connected'    },
  error:      { color:'var(--red)',   bg:'var(--red-dim)',   border:'rgba(240,96,96,0.2)',               label:'Failed'       },
}

export default function Vet() {
  const [tab, setTab]           = useState('ai')
  const [form, setForm]         = useState({ farmer_name:'', symptoms:'' })
  const [result, setResult]     = useState(null)
  const [loading, setLoading]   = useState(false)
  const [vets, setVets]         = useState([])
  const [messages, setMessages] = useState([])
  const [msgInput, setMsgInput] = useState('')
  const [socketStatus, setSocketStatus] = useState('idle')
  const [room]    = useState('consult-' + Date.now())
  const socketRef = useRef(null)
  const chatRef   = useRef(null)

  useEffect(() => {
    socketRef.current = io(BASE_URL, {
      transports: ['polling','websocket'], autoConnect: false,
      reconnection: true, reconnectionAttempts: 5, path: '/socket.io',
    })
    socketRef.current.on('connect',       () => { setSocketStatus('connected'); socketRef.current.emit('join_room', { room }); addMsg('System', 'Connected to chat room', true) })
    socketRef.current.on('disconnect',    () => { setSocketStatus('idle'); addMsg('System', 'Disconnected', true) })
    socketRef.current.on('connect_error', err => { setSocketStatus('error'); addMsg('System', 'Connection failed: ' + err.message, true) })
    socketRef.current.on('system_message', msg => addMsg('System', msg.text, true))
    socketRef.current.on('chat_message',   msg => setMessages(prev => [...prev, msg]))
    return () => socketRef.current?.disconnect()
  }, [room])

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight }, [messages])

  const addMsg = (sender, text, system=false) =>
    setMessages(prev => [...prev, { sender, text, system, ts: new Date().toLocaleTimeString() }])

  const joinChat = () => { if (socketStatus === 'connected') return; setSocketStatus('connecting'); socketRef.current.connect() }
  const sendMsg  = () => {
    if (!msgInput.trim() || socketStatus !== 'connected') return
    socketRef.current.emit('chat_message', { room, sender: form.farmer_name || 'Farmer', text: msgInput, timestamp: new Date().toLocaleTimeString() })
    setMsgInput('')
  }

  const getAI = async () => {
    if (!form.symptoms.trim()) return alert('Describe symptoms first')
    setLoading(true); setResult(null)
    try {
      const r = await vetAPI.firstAid({ farmer_name: form.farmer_name || 'Farmer', symptoms: form.symptoms })
      setResult(r.data)
    } catch(e) { alert(e.response?.data?.detail || 'Error — is backend running on port 8000?') }
    setLoading(false)
  }

  const loadVets = async () => {
    setTab('map')
    try { const r = await vetAPI.getNearbyVets(12.3, 76.6); setVets(r.data.vets || []) }
    catch { setVets([]) }
  }

  const openVideo = () => window.open(`https://meet.jit.si/cattle-farm-${room}`, '_blank')

  const ss = STATUS[socketStatus]

  return (
    <div style={{ padding: 'clamp(1rem,3vw,2rem)', maxWidth: 1160, margin: '0 auto' }}>

      {/* ── Page Header ── */}
      <div style={{ marginBottom: '2rem' }} className="animate-fade-up">
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '5px 16px', borderRadius: 24,
          background: 'rgba(96,168,240,0.10)',
          border: '1px solid rgba(96,168,240,0.26)',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10.5, letterSpacing: '0.13em', color: 'var(--blue)',
          textTransform: 'uppercase', marginBottom: '1rem',
        }}>
          Module 02
        </div>
        <h1 className="font-display" style={{
          fontSize: 'clamp(26px,4.5vw,36px)',
          fontWeight: 800, color: 'var(--text)',
          letterSpacing: '-0.027em', lineHeight: 1.08, marginBottom: '0.6rem',
        }}>
          AI Vet & Consultation
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text2)' }}>
          AI first aid → vet locator → live video consultation
        </p>
      </div>

      {/* ── Level Selector Cards (LP grid style) ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
        gap: 1,
        background: 'rgba(255,255,255,0.04)',
        borderRadius: 16, overflow: 'hidden',
        border: '1px solid var(--border)',
        marginBottom: '1.75rem',
      }}>
        {LEVEL_CARDS.map(({ id, emoji, tag, label, desc, color }, i) => (
          <button
            key={id}
            onClick={() => id === 'map' ? loadVets() : setTab(id)}
            style={{
              padding: '1.5rem 1.25rem', textAlign: 'left', cursor: 'pointer',
              background: tab === id ? `color-mix(in srgb, ${color} 8%, var(--card))` : 'var(--card)',
              border: 'none',
              borderRight: i < 2 ? '1px solid var(--border)' : 'none',
              outline: tab === id ? `1px solid color-mix(in srgb, ${color} 30%, transparent)` : 'none',
              outlineOffset: -1,
              transition: 'background 0.2s',
            }}
          >
            <div style={{
              width: 42, height: 42, borderRadius: 10,
              background: tab === id ? `color-mix(in srgb, ${color} 14%, transparent)` : 'var(--bg2)',
              border: `1px solid ${tab === id ? `color-mix(in srgb, ${color} 28%, transparent)` : 'var(--border)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, marginBottom: '0.85rem',
            }}>
              {emoji}
            </div>
            <p style={{
              fontSize: 10, fontFamily: 'JetBrains Mono,monospace',
              color: tab === id ? color : 'var(--text3)',
              letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5,
            }}>{tag}</p>
            <p className="font-display" style={{ fontSize: 14, fontWeight: 700, color: tab === id ? 'var(--text)' : 'var(--text2)', marginBottom: 4 }}>{label}</p>
            <p style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>{desc}</p>
          </button>
        ))}
      </div>

      {/* ══ AI FIRST AID ══ */}
      {tab === 'ai' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))', gap:'1.5rem' }}
             className="animate-fade-up">
          <div className="card" style={{ padding:'1.75rem' }}>
            <p className="section-tag">AI Diagnosis</p>
            <h3 className="font-display" style={{ fontSize:17, fontWeight:700, color:'var(--text)', marginBottom:'1.5rem' }}>
              Describe Symptoms
            </h3>
            <div style={{ marginBottom:14 }}>
              <label>Your Name</label>
              <input placeholder="Farmer name" value={form.farmer_name} onChange={e => setForm({...form, farmer_name:e.target.value})} />
            </div>
            <div style={{ marginBottom:20 }}>
              <label>Symptoms *</label>
              <textarea rows={5}
                placeholder="e.g. Cow not eating, temperature 40.5°C, breathing fast…"
                value={form.symptoms}
                onChange={e => setForm({...form, symptoms:e.target.value})}
                style={{ resize:'vertical' }} />
            </div>
            <button className="btn-primary" style={{ width:'100%', justifyContent:'center', padding:'11px 20px' }}
              onClick={getAI} disabled={loading}>
              {loading ? '⏳ Asking Gemma AI…' : '🤖 Get AI First Aid'}
            </button>
            <p style={{ fontSize:10.5, color:'var(--text3)', marginTop:10, textAlign:'center', fontFamily:'JetBrains Mono,monospace', letterSpacing:'0.05em' }}>
              Powered by Gemma via Ollama — runs locally
            </p>
          </div>

          <div className="card" style={{ padding:'1.75rem' }}>
            {result ? (
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--green)', flexShrink:0 }} />
                  <p className="font-display" style={{ fontWeight:700, fontSize:16, color:'var(--text)' }}>Gemma AI Response</p>
                </div>
                <div style={{
                  padding:'1rem 1.1rem', borderRadius:10,
                  background:'var(--green-dim)', border:'1px solid rgba(34,201,122,0.18)',
                  color:'var(--text)', fontSize:13, lineHeight:1.8,
                  whiteSpace:'pre-wrap', maxHeight:260, overflowY:'auto', marginBottom:16,
                }}>
                  {result.ai_response}
                </div>
                <div style={{ display:'flex', gap:10 }}>
                  <button className="btn-ghost" style={{ flex:1, justifyContent:'center' }} onClick={() => setTab('map')}>
                    📍 Find Vet Nearby
                  </button>
                  <button className="btn-primary" style={{ flex:1, justifyContent:'center' }} onClick={() => setTab('video')}>
                    📹 Video Call
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:320 }}>
                <div style={{
                  width:80, height:80, borderRadius:'50%',
                  background:'rgba(96,168,240,0.1)', border:'1px solid rgba(96,168,240,0.2)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:38, marginBottom:18,
                }}>🤖</div>
                <p style={{ color:'var(--text)', fontSize:15, fontWeight:600, fontFamily:'Syne,sans-serif' }}>Ready to diagnose</p>
                <p style={{ color:'var(--text3)', fontSize:12.5, marginTop:6, textAlign:'center', lineHeight:1.6 }}>
                  Describe the cattle's symptoms<br/>and get instant AI advice
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ VET MAP ══ */}
      {tab === 'map' && (
        <div className="animate-fade-up">
          <p style={{ fontSize:13, color:'var(--text2)', marginBottom:'1.25rem' }}>
            Nearest veterinarians to your farm location
          </p>
          {vets.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-icon">📍</div>
                <p>Loading nearby vets…</p>
                <small>Searching within 50 km radius</small>
              </div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {vets.map((v, i) => (
                <div key={i} className="card card-hover" style={{ padding:'1rem 1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                    <div style={{
                      width:48, height:48, borderRadius:'50%',
                      background:'var(--blue-dim)', border:'1px solid rgba(96,168,240,0.22)',
                      display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0,
                    }}>🩺</div>
                    <div>
                      <p style={{ fontWeight:600, fontSize:14.5, color:'var(--text)', marginBottom:3 }}>{v.name}</p>
                      <p style={{ fontSize:12, color:'var(--text3)' }}>
                        <span style={{ fontFamily:'JetBrains Mono,monospace' }}>{v.distance_km} km</span> away · {v.phone}
                      </p>
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span className={`badge ${v.available ? 'badge-green' : 'badge-amber'}`}>
                      {v.available ? '● Available' : '○ Busy'}
                    </span>
                    <button className="btn-primary" style={{ fontSize:12.5, padding:'7px 16px' }} onClick={() => setTab('video')}>
                      📹 Call
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ LIVE CHAT + VIDEO ══ */}
      {tab === 'video' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))', gap:'1.5rem' }}
             className="animate-fade-up">

          {/* Chat panel */}
          <div className="card" style={{ padding:'1.5rem', display:'flex', flexDirection:'column', height:520 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <div>
                <p className="section-tag">Live Chat</p>
                <h3 className="font-display" style={{ fontSize:15, fontWeight:700, color:'var(--text)' }}>Chat Room</h3>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{
                  display:'flex', alignItems:'center', gap:6,
                  padding:'4px 11px', borderRadius:20,
                  background: ss.bg, border:`1px solid ${ss.border}`,
                }}>
                  <div style={{ width:6, height:6, borderRadius:'50%', background:ss.color }} />
                  <span style={{ fontSize:11, color:ss.color, fontFamily:'JetBrains Mono,monospace' }}>{ss.label}</span>
                </div>
                {socketStatus !== 'connected' && (
                  <button className="btn-primary" style={{ fontSize:11, padding:'5px 12px' }} onClick={joinChat}>Connect</button>
                )}
              </div>
            </div>

            <p style={{ fontSize:10.5, fontFamily:'JetBrains Mono,monospace', color:'var(--text3)', marginBottom:12, letterSpacing:'0.05em' }}>
              ROOM · {room.slice(-12)}
            </p>

            <div ref={chatRef} style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:8, marginBottom:12, paddingRight:4 }}>
              {messages.length === 0 && (
                <div style={{ textAlign:'center', marginTop:60 }}>
                  <div style={{ fontSize:36, marginBottom:12 }}>💬</div>
                  <p style={{ color:'var(--text3)', fontSize:13 }}>Click Connect to join the room</p>
                </div>
              )}
              {messages.map((m, i) => {
                const isMe = m.sender === (form.farmer_name || 'Farmer')
                return (
                  <div key={i} style={{ display:'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth:'78%', padding:'9px 13px', borderRadius:12,
                      fontSize:13, lineHeight:1.55,
                      background: m.system ? 'var(--bg2)' : isMe ? 'var(--green-dim)' : 'var(--card2)',
                      color: m.system ? 'var(--text3)' : 'var(--text)',
                      border: `1px solid ${m.system ? 'var(--border)' : isMe ? 'rgba(34,201,122,0.2)' : 'var(--border)'}`,
                    }}>
                      {!m.system && <p style={{ fontSize:10, color:'var(--text3)', marginBottom:3, fontFamily:'JetBrains Mono,monospace' }}>{m.sender} · {m.ts}</p>}
                      {m.text}
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ display:'flex', gap:8 }}>
              <input
                placeholder={socketStatus==='connected' ? 'Type a message…' : 'Connect first…'}
                value={msgInput}
                disabled={socketStatus !== 'connected'}
                onChange={e => setMsgInput(e.target.value)}
                onKeyDown={e => e.key==='Enter' && sendMsg()}
              />
              <button className="btn-primary" style={{ padding:'0 18px', flexShrink:0 }}
                onClick={sendMsg} disabled={socketStatus !== 'connected'}>
                →
              </button>
            </div>
          </div>

          {/* Video panel */}
          <div className="card" style={{ padding:'2.5rem', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', gap:20, height:520 }}>
            <div style={{
              width:84, height:84, borderRadius:'50%',
              background:'var(--blue-dim)', border:'1px solid rgba(96,168,240,0.28)',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:38,
            }}>
              📹
            </div>

            <div>
              <h3 className="font-display" style={{ fontSize:18, fontWeight:700, color:'var(--text)', marginBottom:6 }}>
                Jitsi Video Consultation
              </h3>
              <p style={{ fontSize:13.5, color:'var(--text2)', lineHeight:1.65 }}>
                Free · No account needed · HD quality
              </p>
            </div>

            <button className="btn-primary" style={{ width:'100%', justifyContent:'center', padding:'13px 20px', fontSize:14.5 }} onClick={openVideo}>
              🚀 Launch Video Call
            </button>

            <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 18px', width:'100%' }}>
              <p style={{ fontSize:10, color:'var(--text3)', fontFamily:'JetBrains Mono,monospace', marginBottom:5, letterSpacing:'0.08em' }}>ROOM ID</p>
              <p style={{ fontSize:12.5, color:'var(--text2)', fontFamily:'JetBrains Mono,monospace' }}>{room.slice(-16)}</p>
            </div>

            <p style={{ fontSize:12, color:'var(--text3)' }}>Share Room ID with your vet to join the same call</p>
          </div>
        </div>
      )}
    </div>
  )
}