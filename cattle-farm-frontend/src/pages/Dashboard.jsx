import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { healthAPI, milkAPI, financeAPI } from '../services/api'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const mockTrend = Array.from({ length: 7 }, (_, i) => ({
  day: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i],
  milk: Math.round(60 + Math.random() * 40),
}))

const MODULES = [
  {
    emoji: '🌐', tag: 'Module 01', label: 'Health Monitor',
    sub: 'Random Forest · Federated Learning',
    desc: 'Catches disease risk days before symptoms show.',
    tech: ['RF Model', 'Flower FL', '2 Nodes'],
    color: '#2f8f7c', path: '/health',
    img: 'https://cattledaily.com/wp-content/uploads/2025/09/Cattle-Health-101.jpg',
  },
  {
    emoji: '🩺', tag: 'Module 02', label: 'AI Vet & Chat',
    sub: 'Gemma AI · Nearby vet locations',
    desc: 'Instant first-aid guidance, day or night.',
    tech: ['Gemma LLM', 'Local Map'],
    color: '#5a6fa5', path: '/vet',
    img: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=700&q=80&crop=entropy',
  },
  {
    emoji: '🥛', tag: 'Module 03', label: 'Milk Purity',
    sub: '6-param classifier · PDF certificate',
    desc: 'Certifies purity in seconds, not a lab visit.',
    tech: ['6 Params', 'ML Classify', 'PDF cert'],
    color: '#8b5a8c', path: '/milk',
    img: 'https://images.unsplash.com/photo-1440428099904-c6d459a7e7b5?auto=format&fit=crop&w=700&q=80&crop=entropy',
  },
  {
    emoji: '💹', tag: 'Module 04', label: 'Finance',
    sub: 'Prophet forecast · P&L · Rankings',
    desc: 'Profit per animal, forecast weeks ahead.',
    tech: ['Prophet', 'P&L', 'Rankings'],
    color: '#c1752e', path: '/finance',
    img: 'https://www.shutterstock.com/image-photo/confident-male-farmer-touchpad-explaining-600w-1504965473.jpg',
  },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [health,  setHealth]  = useState(null)
  const [milk,    setMilk]    = useState(null)
  const [finance, setFinance] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      healthAPI.getDashboard(),
      milkAPI.getStats(),
      financeAPI.getDashboard(),
    ]).then(([h, m, f]) => {
      if (h.status === 'fulfilled') setHealth(h.value.data)
      if (m.status === 'fulfilled') setMilk(m.value.data)
      if (f.status === 'fulfilled') setFinance(f.value.data)
      setLoading(false)
    })
  }, [])

  const stats = [
    { emoji:'🐄', label:'Total Cattle',    value: loading ? '…' : (health?.total_cattle  ?? 0),           sub:'Active animals',  color:'var(--green)' },
    { emoji:'⚠️', label:'High Risk Alerts', value: loading ? '…' : (health?.high_risk     ?? 0),           sub:'Need attention',  color:'var(--red)'   },
    { emoji:'🥛', label:'Milk Pass Rate',   value: loading ? '…' : `${milk?.pass_rate     ?? 0}%`,         sub:'Quality index',   color:'var(--purple)' },
    { emoji:'💰', label:'Month Income',     value: loading ? '…' : `₹${finance?.this_month?.income ?? 0}`, sub:'Gross earnings',  color:'var(--amber)' },
  ]

  return (
    <div>
      {/* ══════ FULL-BLEED HERO ══════ */}
      <section style={st.hero}>
        <img
          src="https://images.unsplash.com/photo-1440428099904-c6d459a7e7b5?auto=format&fit=crop&w=2000&q=80"
          alt="Dairy cattle grazing in a green pasture"
          style={st.heroImg}
        />
        <div style={st.heroOverlay} />
        <div style={st.heroContent} className="animate-fade-up">
          <span style={st.badge}>
            <span style={st.badgeDot} />
            SMART DAIRY PLATFORM
          </span>
          <h1 style={st.title}>AI Powered<br />Dairy Farm<br />Management</h1>
          <p style={st.subtitle}>
            Monitor cattle health, predict diseases, test milk purity and
            manage farm finances — all in one platform.
          </p>
          <div style={st.actions}>
            <button style={st.btnPrimary} onClick={() => document.getElementById('dash-modules')?.scrollIntoView({ behavior:'smooth' })}>
              🌿 Explore Farm
            </button>
            <button style={st.btnSecondary} onClick={() => navigate('/health')}>
              🩺 AI Health Check
            </button>
          </div>
        </div>
      </section>

      {/* ══════ STAT CARDS — full width, sits right under the hero ══════ */}
      <div style={st.wrap}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
          gap: 12, marginTop: '-2.25rem', position: 'relative', zIndex: 2,
          marginBottom: '1.75rem',
        }} className="animate-fade-up">
          {stats.map(({ emoji, label, value, sub, color }) => (
            <div key={label} className="card stat-card" style={{ padding: '1.4rem', '--accent-color': color, boxShadow: 'var(--shadow)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 10,
                  background: `color-mix(in srgb, ${color} 12%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${color} 24%, transparent)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                }}>
                  {emoji}
                </div>
              </div>
              <p style={{
                fontSize: 28, fontWeight: 800, color,
                fontFamily: 'Syne, sans-serif', lineHeight: 1.1, marginBottom: 4,
              }}>
                {value}
              </p>
              <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{label}</p>
              <p style={{ fontSize: 11, color: 'var(--text3)' }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* ── Middle Row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 14, marginBottom: '1.75rem' }}>

          {/* Risk Breakdown */}
          <div className="card animate-fade-up" style={{ padding: '1.5rem' }}>
            <p className="section-tag">Health Status</p>
            <h3 className="font-display" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: '1.25rem' }}>
              Risk Breakdown
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label:'Low risk — Healthy',    value: health?.low_risk    ?? 0, color:'#2f8f7c', bg:'rgba(47,143,124,0.08)',   border:'rgba(47,143,124,0.18)' },
                { label:'Medium — Monitor',      value: health?.medium_risk ?? 0, color:'#c1752e', bg:'rgba(193,117,46,0.08)',   border:'rgba(193,117,46,0.18)' },
                { label:'High — Critical',       value: health?.high_risk   ?? 0, color:'#c1443a', bg:'rgba(193,68,58,0.08)',    border:'rgba(193,68,58,0.18)'  },
              ].map(({ label, value, color, bg, border }) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '11px 14px', borderRadius: 10,
                  background: bg, border: `1px solid ${border}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color }}>{label}</span>
                  </div>
                  <span style={{ fontSize: 22, fontWeight: 800, color, fontFamily: 'Syne,sans-serif' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="card animate-fade-up" style={{ padding: '1.5rem' }}>
            <p className="section-tag">7-Day Output</p>
            <h3 className="font-display" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: '1.25rem' }}>
              Milk Production (litres)
            </h3>
            <ResponsiveContainer width="100%" height={165}>
              <AreaChart data={mockTrend} margin={{ top: 4, right: 0, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="milkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#2f8f7c" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#2f8f7c" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fill:'var(--text3)', fontSize:11, fontFamily:'JetBrains Mono,monospace' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'var(--text3)', fontSize:10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background:'rgba(15,26,18,0.96)', border:'1px solid rgba(47,143,124,0.2)', borderRadius:10, fontSize:12 }}
                  labelStyle={{ color:'var(--text3)', fontFamily:'JetBrains Mono,monospace' }}
                  itemStyle={{ color:'#2f8f7c' }}
                />
                <Area type="monotone" dataKey="milk" stroke="#2f8f7c" strokeWidth={2.5} fill="url(#milkGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Module Cards, each with a photo + one-line description, linked to its page ── */}
        <div id="dash-modules" style={{ marginBottom: '1rem', scrollMarginTop: 'calc(var(--topnav-h) + 12px)' }}>
          <p style={{
            fontFamily: 'JetBrains Mono,monospace', fontSize: 10.5,
            color: 'var(--green)', letterSpacing: '0.13em',
            textTransform: 'uppercase', marginBottom: '0.6rem',
          }}>Platform Modules</p>
          <h2 className="font-display" style={{
            fontSize: 'clamp(18px,3vw,24px)', fontWeight: 800,
            color: 'var(--text)', letterSpacing: '-0.022em',
            marginBottom: '1.25rem',
          }}>
            All systems online
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))',
          gap: 16, marginBottom: '2.5rem',
        }} className="animate-fade-up">
          {MODULES.map((m, i) => (
            <div
              key={i}
              className="dash-module-card"
              style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--card)', cursor: 'pointer' }}
              onClick={() => navigate(m.path)}
            >
              {/* Photo */}
              <div style={{ position: 'relative', height: 118, overflow: 'hidden' }}>
                <img src={m.img} alt={m.label} className="dash-module-img" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, transparent 40%, ${m.color}30 100%)` }} />
                <span style={{
                  position: 'absolute', top: 10, left: 10,
                  width: 34, height: 34, borderRadius: 9,
                  background: 'rgba(18,32,27,0.55)', backdropFilter: 'blur(6px)',
                  border: `1px solid color-mix(in srgb, ${m.color} 45%, transparent)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
                }}>{m.emoji}</span>
              </div>

              {/* Body */}
              <div style={{ padding: '1.25rem 1.3rem' }}>
                <p style={{
                  fontFamily: 'JetBrains Mono,monospace',
                  fontSize: 10, color: m.color,
                  letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6,
                }}>{m.tag}</p>

                <p className="font-display" style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--text)', marginBottom: 5 }}>{m.label}</p>
                <p style={{ fontSize: 12.5, color: 'var(--text2)', lineHeight: 1.55, marginBottom: 10 }}>{m.desc}</p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
                  {m.tech.map(t => (
                    <span key={t} style={{
                      padding: '3px 9px', borderRadius: 20,
                      fontSize: 10.5, fontFamily: 'JetBrains Mono,monospace',
                      background: `color-mix(in srgb, ${m.color} 8%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${m.color} 18%, transparent)`,
                      color: m.color,
                    }}>{t}</span>
                  ))}
                </div>

                <div style={{ fontSize: 12, color: m.color, fontFamily: 'JetBrains Mono,monospace', fontWeight: 600 }}>
                  Open module →
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .dash-module-card { transition: transform 0.28s cubic-bezier(0.16,1,0.3,1), border-color 0.28s, box-shadow 0.28s; }
        .dash-module-card:hover { transform: translateY(-4px); border-color: var(--border2); box-shadow: var(--shadow-sm); }
        .dash-module-card:hover .dash-module-img { transform: scale(1.06); }
        .dash-module-img { transition: transform 0.5s cubic-bezier(0.16,1,0.3,1); }
      `}</style>
    </div>
  )
}

/* ── styles ── */
const st = {
  wrap: { padding: '0 clamp(1rem,3vw,2.25rem) 2rem', maxWidth: 1440, margin: '0 auto' },

  hero: {
    position: 'relative',
    height: 'clamp(420px, 58vw, 560px)',
    width: '100%',
    overflow: 'hidden',
  },
  heroImg: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' },
  heroOverlay: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(100deg, rgba(18,32,27,0.94) 0%, rgba(18,32,27,0.80) 32%, rgba(18,32,27,0.30) 62%, rgba(18,32,27,0.08) 100%)',
  },
  heroContent: {
    position: 'relative', zIndex: 1, height: '100%',
    display: 'flex', flexDirection: 'column', justifyContent: 'center',
    padding: '0 clamp(1.25rem,5vw,4rem)', maxWidth: 640,
  },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
    padding: '6px 16px', borderRadius: 24,
    background: 'rgba(47,143,124,0.16)', border: '1px solid rgba(47,143,124,0.4)',
    fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.13em',
    color: '#7fd9c4', textTransform: 'uppercase', marginBottom: '1.25rem',
  },
  badgeDot: { width: 6, height: 6, borderRadius: '50%', background: '#2f8f7c' },
  title: {
    fontFamily: "'Syne', sans-serif", fontWeight: 800,
    fontSize: 'clamp(30px,5vw,52px)', lineHeight: 1.06, letterSpacing: '-0.025em',
    color: '#fdfbf5', marginBottom: '1.1rem', textShadow: '0 2px 20px rgba(0,0,0,0.35)',
  },
  subtitle: { fontSize: 'clamp(13.5px,1.6vw,15.5px)', color: 'rgba(253,251,245,0.82)', lineHeight: 1.65, maxWidth: 440, marginBottom: '1.75rem' },
  actions: { display: 'flex', flexWrap: 'wrap', gap: 12 },
  btnPrimary: {
    padding: '12px 22px', borderRadius: 12, border: 'none', cursor: 'pointer',
    background: 'linear-gradient(135deg, #2f8f7c, #d3a030)', color: '#12201b',
    fontWeight: 700, fontSize: 13.5,
  },
  btnSecondary: {
    padding: '12px 22px', borderRadius: 12, cursor: 'pointer',
    background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.35)',
    backdropFilter: 'blur(6px)', color: '#fdfbf5', fontWeight: 600, fontSize: 13.5,
  },
}