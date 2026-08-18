import { useState, useEffect } from 'react'
import { vetAPI } from '../services/api'

const LEVEL_CARDS = [
  { id:'ai',  emoji:'🤖', tag:'Level 01', label:'AI First Aid',   desc:'Instant advice from Gemma AI', color:'var(--green)' },
  { id:'map', emoji:'📍', tag:'Level 02', label:'Vet Locations',  desc:'Real nearby clinics on the map', color:'var(--blue)' },
]

// Farm reference location — used to center the map and the search radius.
const FARM_LAT = 12.3
const FARM_LNG = 76.6
const MAP_EMBED_SRC = `https://www.google.com/maps?q=veterinary+clinic&ll=${FARM_LAT},${FARM_LNG}&z=12&output=embed`
const MAP_LINK       = `https://www.google.com/maps/search/veterinary+clinic/@${FARM_LAT},${FARM_LNG},12z`

// Cleans a phone string into something safe for a tel: link
const telHref = (phone) => `tel:${String(phone).replace(/[^\d+]/g, '')}`

export default function Vet() {
  const [tab, setTab]         = useState('ai')
  const [form, setForm]       = useState({ farmer_name:'', symptoms:'' })
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)

  const [vets, setVets]               = useState([])
  const [vetsLoading, setVetsLoading] = useState(true)

  // Load nearby vet doctors once on mount so a "call now" number is always ready,
  // no matter which tab the farmer is on.
  useEffect(() => {
    (async () => {
      try {
        const r = await vetAPI.getNearbyVets(FARM_LAT, FARM_LNG)
        setVets(r.data?.vets || [])
      } catch (e) {
        setVets([])
      }
      setVetsLoading(false)
    })()
  }, [])

  const nearestVet = vets[0]

  const getAI = async () => {
    if (!form.symptoms.trim()) return alert('Describe symptoms first')
    setLoading(true); setResult(null)
    try {
      const r = await vetAPI.firstAid({ farmer_name: form.farmer_name || 'Farmer', symptoms: form.symptoms })
      setResult(r.data)
    } catch(e) { alert(e.response?.data?.detail || 'Error — is backend running on port 8000?') }
    setLoading(false)
  }

  return (
    <div style={{ padding: 'clamp(1rem,3vw,2rem)', maxWidth: 1160, margin: '0 auto' }}>

      {/* ── Page Header ── */}
      <div style={{ marginBottom: '1.25rem' }} className="animate-fade-up">
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '5px 16px', borderRadius: 24,
          background: 'rgba(90,111,165,0.10)',
          border: '1px solid rgba(90,111,165,0.26)',
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
          AI first aid, then real veterinary clinics near your farm
        </p>
      </div>

      {/* ── Emergency Call Strip — always visible, always dial-able ── */}
      <div className="animate-fade-up" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
        padding: '14px 18px', borderRadius: 14, marginBottom: '1.75rem',
        background: 'var(--red-dim)', border: '1px solid rgba(193,68,58,0.28)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, minWidth: 0 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
            background: 'rgba(193,68,58,0.16)', border: '1px solid rgba(193,68,58,0.32)',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize: 18,
          }}>🚨</div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)' }}>
              {vetsLoading ? 'Finding nearest vet…' : nearestVet ? `Nearest vet: ${nearestVet.name}` : 'No vet found nearby'}
            </p>
            <p style={{ fontSize: 11.5, color: 'var(--text3)' }}>
              {nearestVet ? `${nearestVet.distance_km} km away · ${nearestVet.available ? 'Available now' : 'May be unavailable'}` : 'Call any time for urgent cattle issues'}
            </p>
          </div>
        </div>
        <a
          href={nearestVet ? telHref(nearestVet.phone) : undefined}
          className="btn-primary"
          style={{
            textDecoration: 'none', flexShrink: 0, fontSize: 13, padding: '10px 18px',
            background: 'var(--red)', borderColor: 'var(--red)',
            opacity: nearestVet ? 1 : 0.5, pointerEvents: nearestVet ? 'auto' : 'none',
          }}
        >
          📞 Call Vet Now
        </a>
      </div>

      {/* ── Level Selector Cards (LP grid style) ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(2,1fr)',
        gap: 1,
        background: 'rgba(255,255,255,0.04)',
        borderRadius: 16, overflow: 'hidden',
        border: '1px solid var(--border)',
        marginBottom: '1.75rem',
      }}>
        {LEVEL_CARDS.map(({ id, emoji, tag, label, desc, color }, i) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              padding: '1.5rem 1.25rem', textAlign: 'left', cursor: 'pointer',
              background: tab === id ? `color-mix(in srgb, ${color} 8%, var(--card))` : 'var(--card)',
              border: 'none',
              borderRight: i < LEVEL_CARDS.length - 1 ? '1px solid var(--border)' : 'none',
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
                  background:'var(--green-dim)', border:'1px solid rgba(47,143,124,0.18)',
                  color:'var(--text)', fontSize:13, lineHeight:1.8,
                  whiteSpace:'pre-wrap', maxHeight:260, overflowY:'auto', marginBottom:16,
                }}>
                  {result.ai_response}
                </div>

                {/* Direct call-through to a real vet for treatment advice */}
                {nearestVet && (
                  <a href={telHref(nearestVet.phone)} style={{
                    display:'flex', alignItems:'center', justifyContent:'space-between', gap:10,
                    padding:'12px 14px', borderRadius:10, marginBottom:12, textDecoration:'none',
                    background:'var(--red-dim)', border:'1px solid rgba(193,68,58,0.28)',
                  }}>
                    <span style={{ fontSize:12.5, color:'var(--text)' }}>
                      Confirm treatment with <strong>{nearestVet.name}</strong> ({nearestVet.distance_km} km)
                    </span>
                    <span style={{ fontSize:12.5, fontWeight:700, color:'var(--red)', whiteSpace:'nowrap' }}>📞 Call</span>
                  </a>
                )}

                <button className="btn-primary" style={{ width:'100%', justifyContent:'center' }} onClick={() => setTab('map')}>
                  📍 View Vet Locations Near Me
                </button>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:320 }}>
                <div style={{
                  width:80, height:80, borderRadius:'50%',
                  background:'rgba(90,111,165,0.1)', border:'1px solid rgba(90,111,165,0.2)',
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

      {/* ══ VET LOCATIONS — doctor contact cards + real Google Map ══ */}
      {tab === 'map' && (
        <div className="animate-fade-up">

          {/* Doctor contact cards — direct call, anytime */}
          <p className="section-tag" style={{ marginBottom: 10 }}>Nearby Vet Doctors</p>
          {vetsLoading ? (
            <p style={{ fontSize:12.5, color:'var(--text3)', marginBottom:'1.25rem' }}>Loading nearby vets…</p>
          ) : vets.length === 0 ? (
            <p style={{ fontSize:12.5, color:'var(--text3)', marginBottom:'1.25rem' }}>No vets found nearby right now.</p>
          ) : (
            <div style={{
              display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',
              gap:'1rem', marginBottom:'1.5rem',
            }}>
              {vets.map((v, i) => (
                <div key={i} className="card" style={{ padding:'1.1rem 1.2rem' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8, marginBottom:10 }}>
                    <div>
                      <p className="font-display" style={{ fontSize:14.5, fontWeight:700, color:'var(--text)' }}>{v.name}</p>
                      <p style={{ fontSize:11.5, color:'var(--text3)', marginTop:2 }}>{v.distance_km} km away</p>
                    </div>
                    <span style={{
                      fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:20,
                      textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap',
                      background: v.available ? 'var(--green-dim)' : 'var(--amber-dim)',
                      color: v.available ? 'var(--green)' : 'var(--amber)',
                      border: `1px solid ${v.available ? 'rgba(47,143,124,0.3)' : 'rgba(193,117,46,0.3)'}`,
                    }}>
                      {v.available ? 'Available' : 'Busy'}
                    </span>
                  </div>
                  <a href={telHref(v.phone)} className="btn-primary" style={{
                    width:'100%', justifyContent:'center', textDecoration:'none',
                    fontSize:12.5, padding:'9px 14px',
                  }}>
                    📞 Call {v.phone}
                  </a>
                </div>
              ))}
            </div>
          )}

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 10, marginBottom: '1.1rem',
          }}>
            <p style={{ fontSize:13, color:'var(--text2)' }}>
              Veterinary clinics near your farm — pan and zoom to explore, or open directly in Google Maps.
            </p>
            <a
              href={MAP_LINK}
              target="_blank"
              rel="noreferrer"
              className="btn-primary"
              style={{ textDecoration: 'none', fontSize: 12.5, padding: '9px 16px', flexShrink: 0 }}
            >
              🧭 Open in Google Maps
            </a>
          </div>

          <div className="card" style={{ padding: 8, overflow: 'hidden' }}>
            <iframe
              title="Nearby veterinary clinics"
              src={MAP_EMBED_SRC}
              width="100%"
              height="480"
              style={{ border: 0, borderRadius: 12, display: 'block' }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <p style={{ fontSize: 11.5, color: 'var(--text3)', marginTop: 10 }}>
            Map centered on your farm location. Tap any pin on Google Maps for phone numbers, hours and directions.
          </p>
        </div>
      )}
    </div>
  )
}