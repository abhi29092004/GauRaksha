import { useState, useEffect } from 'react'
import { milkAPI } from '../services/api'

const PARAMS = [
  { key:'fat_percent',    label:'Fat %',               ph:'4.2',  hint:'3.5–6.0 ideal'  },
  { key:'snf_percent',    label:'SNF %',               ph:'8.5',  hint:'8.0–9.0 ideal'  },
  { key:'ph_level',       label:'pH Level',            ph:'6.7',  hint:'6.6–6.8 ideal'  },
  { key:'temperature',    label:'Collection Temp °C',  ph:'8',    hint:'≤ 10°C'          },
  { key:'adulteration',   label:'Adulteration Score',  ph:'0.05', hint:'< 0.15'          },
  { key:'bacteria_count', label:'Bacteria (k CFU/ml)', ph:'50',   hint:'< 100k CFU/ml'  },
]

const STAT_ITEMS = [
  { key:'total',       label:'Total Tests',    icon:'🔬', color:'var(--blue)'   },
  { key:'pass_rate',   label:'Pass Rate',      icon:'✅', color:'var(--green)', suffix:'%' },
  { key:'avg_purity',  label:'Avg Purity',     icon:'⭐', color:'var(--amber)', suffix:'/100' },
]

export default function Milk() {
  const [tab, setTab]         = useState('test')
  const [form, setForm]       = useState({ fat_percent:'', snf_percent:'', ph_level:'', temperature:'', adulteration:'', bacteria_count:'' })
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [tests, setTests]     = useState([])
  const [stats, setStats]     = useState(null)

  useEffect(() => {
    milkAPI.getTests().then(r => setTests(r.data)).catch(() => {})
    milkAPI.getStats().then(r => setStats(r.data)).catch(() => {})
  }, [])

  const runTest = async () => {
    setLoading(true); setResult(null)
    try {
      const r = await milkAPI.runTest({
        fat_percent:    parseFloat(form.fat_percent)    || 4.2,
        snf_percent:    parseFloat(form.snf_percent)    || 8.5,
        ph_level:       parseFloat(form.ph_level)       || 6.7,
        temperature:    parseFloat(form.temperature)    || 8,
        adulteration:   parseFloat(form.adulteration)   || 0.05,
        bacteria_count: parseFloat(form.bacteria_count) || 50,
      })
      setResult(r.data)
      milkAPI.getTests().then(r => setTests(r.data)).catch(() => {})
      milkAPI.getStats().then(r => setStats(r.data)).catch(() => {})
    } catch(e) { alert(e.response?.data?.detail || 'Error — is backend running?') }
    setLoading(false)
  }

  const isPass = result?.verdict === 'pass'

  return (
    <div style={{ padding: 'clamp(1rem,3vw,2rem)', maxWidth: 1160, margin: '0 auto' }}>

      {/* ── Page Header ── */}
      <div style={{ marginBottom: '2rem' }} className="animate-fade-up">
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '5px 16px', borderRadius: 24,
          background: 'rgba(160,112,240,0.10)',
          border: '1px solid rgba(160,112,240,0.26)',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10.5, letterSpacing: '0.13em', color: 'var(--purple)',
          textTransform: 'uppercase', marginBottom: '1rem',
        }}>
          Module 03
        </div>
        <h1 className="font-display" style={{
          fontSize: 'clamp(26px,4.5vw,36px)',
          fontWeight: 800, color: 'var(--text)',
          letterSpacing: '-0.027em', lineHeight: 1.08, marginBottom: '0.6rem',
        }}>
          Milk Purity Checker
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text2)' }}>
          6-parameter ML classifier · PDF certificate · Auto-ledger
        </p>
      </div>

      {/* ── Stats row (LP feature-grid style) ── */}
      {stats && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
          gap: 1,
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 16, overflow: 'hidden',
          border: '1px solid var(--border)',
          marginBottom: '1.75rem',
        }} className="animate-fade-up">
          {STAT_ITEMS.map(({ key, label, icon, color, suffix='' }, i) => (
            <div key={key} style={{
              background: 'var(--card)',
              padding: '1.6rem 1.5rem',
              borderRight: i < 2 ? '1px solid var(--border)' : 'none',
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: `color-mix(in srgb, ${color} 12%, transparent)`,
                border: `1px solid color-mix(in srgb, ${color} 22%, transparent)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, flexShrink: 0,
              }}>
                {icon}
              </div>
              <div>
                <p style={{ fontSize: 26, fontWeight: 800, color, fontFamily: 'Syne,sans-serif', lineHeight: 1.1 }}>
                  {stats[key]}{suffix}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '1.75rem' }}>
        {[['test','🔬 Run Test'],['history','📋 Test History']].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)} className={`module-tab${tab===id?' active':''}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ══ TEST ══ */}
      {tab === 'test' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))', gap:'1.5rem' }}
             className="animate-fade-up">

          {/* Input */}
          <div className="card" style={{ padding:'1.75rem' }}>
            <p className="section-tag">Parameters</p>
            <h3 className="font-display" style={{ fontSize:17, fontWeight:700, color:'var(--text)', marginBottom:'1.5rem' }}>
              Enter Milk Data
            </h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
              {PARAMS.map(({ key, label, ph, hint }) => (
                <div key={key}>
                  <label style={{ fontSize:10 }}>{label}</label>
                  <input type="number" step="0.01" placeholder={ph}
                    value={form[key]} onChange={e => setForm({...form,[key]:e.target.value})} />
                  <p style={{ fontSize:10, color:'var(--text3)', marginTop:3 }}>{hint}</p>
                </div>
              ))}
            </div>
            <button className="btn-primary" style={{ width:'100%', justifyContent:'center', padding:'11px 20px' }}
              onClick={runTest} disabled={loading}>
              {loading ? '⏳ Analysing sample…' : '🔬 Run Purity Analysis'}
            </button>
          </div>

          {/* Result */}
          <div className="card" style={{ padding:'1.75rem' }}>
            {result ? (
              <div>
                {/* Verdict banner */}
                <div style={{
                  display:'flex', alignItems:'center', gap:16, marginBottom:20,
                  padding:'16px 18px', borderRadius:12,
                  background: isPass ? 'var(--green-dim)' : 'var(--red-dim)',
                  border: `1px solid ${isPass ? 'rgba(34,201,122,0.22)' : 'rgba(240,96,96,0.22)'}`,
                }}>
                  <div style={{ fontSize:42 }}>{isPass ? '✅' : '❌'}</div>
                  <div>
                    <p style={{
                      fontSize:22, fontWeight:800, fontFamily:'Syne,sans-serif',
                      color: isPass ? 'var(--green)' : 'var(--red)', letterSpacing:'-0.02em',
                    }}>
                      {isPass ? 'PASSED' : 'FAILED'}
                    </p>
                    <p style={{ fontSize:12.5, color:'var(--text2)', marginTop:2 }}>
                      Purity Score: <strong style={{ color: isPass ? 'var(--green)' : 'var(--red)' }}>{result.purity_score}/100</strong>
                    </p>
                  </div>
                </div>

                {/* Purity bar */}
                <div style={{ height:10, background:'var(--border)', borderRadius:5, overflow:'hidden', marginBottom:18 }}>
                  <div style={{
                    height:'100%', borderRadius:5,
                    width:`${result.purity_score}%`,
                    background: isPass ? 'var(--green)' : 'var(--red)',
                    transition:'width 1.1s cubic-bezier(0.16,1,0.3,1)',
                  }} />
                </div>

                {/* Issues */}
                {result.issues?.length > 0 && (
                  <div style={{ marginBottom:16 }}>
                    <p style={{ fontSize:10.5, color:'var(--text3)', marginBottom:8, letterSpacing:'0.08em', fontFamily:'JetBrains Mono,monospace' }}>
                      ISSUES DETECTED
                    </p>
                    {result.issues.map((issue, i) => (
                      <div key={i} style={{
                        padding:'9px 13px', borderRadius:9,
                        background:'var(--amber-dim)', border:'1px solid rgba(240,160,48,0.2)', marginBottom:6,
                      }}>
                        <p style={{ fontSize:12.5, color:'var(--amber)' }}>⚠ {issue}</p>
                      </div>
                    ))}
                  </div>
                )}

                <p style={{ fontSize:13, color: isPass ? 'var(--green)' : 'var(--red)', marginBottom:18, lineHeight:1.7 }}>
                  {result.message}
                </p>

                {result.certificate && (
                  <a href={`http://localhost:8000${result.certificate}`} target="_blank" rel="noreferrer"
                    className="btn-primary"
                    style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, textDecoration:'none', width:'100%', padding:'11px 20px' }}>
                    📄 Download PDF Certificate
                  </a>
                )}
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:340 }}>
                <div style={{
                  width:80, height:80, borderRadius:'50%',
                  background:'var(--purple-dim)', border:'1px solid rgba(160,112,240,0.22)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:38, marginBottom:18,
                }}>🥛</div>
                <p style={{ color:'var(--text)', fontSize:15, fontWeight:600, fontFamily:'Syne,sans-serif' }}>Ready to test</p>
                <p style={{ color:'var(--text3)', fontSize:12.5, marginTop:6, textAlign:'center', lineHeight:1.6 }}>
                  Enter your milk parameters<br/>and run the purity analysis
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ HISTORY ══ */}
      {tab === 'history' && (
        <div className="animate-fade-up" style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {tests.length === 0 && (
            <div className="card">
              <div className="empty-state">
                <div className="empty-icon">🔬</div>
                <p>No tests yet</p>
                <small>Run your first milk analysis above</small>
              </div>
            </div>
          )}
          {tests.map(t => {
            const pass = t.verdict === 'pass'
            return (
              <div key={t.id} className="card card-hover" style={{
                padding:'1.1rem 1.4rem',
                display:'flex', alignItems:'center',
                justifyContent:'space-between', flexWrap:'wrap', gap:10,
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                  <div style={{
                    width:44, height:44, borderRadius:10, flexShrink:0,
                    background: pass ? 'var(--green-dim)' : 'var(--red-dim)',
                    border: `1px solid ${pass ? 'rgba(34,201,122,0.2)' : 'rgba(240,96,96,0.2)'}`,
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:20,
                  }}>
                    {pass ? '✅' : '❌'}
                  </div>
                  <div>
                    <p style={{ fontWeight:600, color:'var(--text)', fontSize:13.5 }}>
                      Test #{t.id}
                      <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'var(--text3)', marginLeft:10 }}>
                        Score: {t.purity_score}/100
                      </span>
                    </p>
                    <p style={{ fontSize:11.5, color:'var(--text3)', marginTop:3 }}>
                      Fat {t.fat_percent}% · SNF {t.snf_percent}% · pH {t.ph_level}
                    </p>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span className={`badge ${pass ? 'badge-green' : 'badge-red'}`}>
                    {t.verdict}
                  </span>
                  {t.certificate_path && (
                    <a href={`http://localhost:8000/api/milk/certificate/${t.id}`} target="_blank" rel="noreferrer"
                      className="btn-ghost" style={{ fontSize:12.5, padding:'6px 14px', textDecoration:'none' }}>
                      📄 PDF
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}