import { useState, useEffect } from 'react'
import { healthAPI } from '../services/api'

const STATUS_META = {
  low:    { badge: 'badge-green', label: 'Healthy',   color: 'var(--green)', bg: 'var(--green-dim)', border: 'rgba(34,201,122,0.2)'  },
  medium: { badge: 'badge-amber', label: 'Monitor',   color: 'var(--amber)', bg: 'var(--amber-dim)', border: 'rgba(240,160,48,0.2)'  },
  high:   { badge: 'badge-red',   label: 'Critical',  color: 'var(--red)',   bg: 'var(--red-dim)',   border: 'rgba(240,96,96,0.2)'   },
}

const VITAL_FIELDS = [
  { key:'temperature',      label:'Temperature',       unit:'°C',     ph:'38.5', hint:'Normal 38–39.5 °C' },
  { key:'heart_rate',       label:'Heart Rate',        unit:'bpm',    ph:'55',   hint:'Normal 48–84 bpm'  },
  { key:'respiratory_rate', label:'Respiratory Rate',  unit:'br/min', ph:'25',   hint:'Normal 12–36'      },
  { key:'milk_yield',       label:'Milk Yield',        unit:'L/day',  ph:'10',   hint:'Varies by breed'   },
  { key:'body_condition',   label:'Body Condition',    unit:'1–5',    ph:'3',    hint:'Ideal 3–3.5'       },
  { key:'activity_level',   label:'Activity Level',    unit:'0–10',   ph:'6',    hint:'Higher = active'   },
]

export default function Health() {
  const [tab, setTab]         = useState('list')
  const [cattle, setCattle]   = useState([])
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch]   = useState('')
  const [newCow, setNewCow]   = useState({ tag_number:'', name:'', breed:'HF Cross', age_years:'', weight_kg:'', farm_node:'node_1' })
  const [form, setForm]       = useState({ cattle_id:'', temperature:'', heart_rate:'', respiratory_rate:'', milk_yield:'', body_condition:'', activity_level:'' })

  useEffect(() => {
    healthAPI.getCattle().then(r => setCattle(r.data)).catch(() => setCattle([]))
  }, [])

  const filtered = cattle.filter(c =>
    c.tag_number?.toLowerCase().includes(search.toLowerCase()) ||
    c.name?.toLowerCase().includes(search.toLowerCase())
  )

  const registerCow = async () => {
    if (!newCow.tag_number) return alert('Tag number is required')
    try {
      await healthAPI.createCattle({ ...newCow, age_years: parseFloat(newCow.age_years)||3, weight_kg: parseFloat(newCow.weight_kg)||350 })
      const r = await healthAPI.getCattle()
      setCattle(r.data)
      setNewCow({ tag_number:'', name:'', breed:'HF Cross', age_years:'', weight_kg:'', farm_node:'node_1' })
      setTab('list')
    } catch(e) { alert(e.response?.data?.detail || 'Error registering') }
  }

  const predict = async () => {
    if (!form.cattle_id) return alert('Select an animal first')
    setLoading(true); setResult(null)
    try {
      const r = await healthAPI.predict({
        cattle_id:        parseInt(form.cattle_id),
        temperature:      parseFloat(form.temperature)      || 38.5,
        heart_rate:       parseFloat(form.heart_rate)       || 55,
        respiratory_rate: parseFloat(form.respiratory_rate) || 25,
        milk_yield:       parseFloat(form.milk_yield)       || 10,
        body_condition:   parseFloat(form.body_condition)   || 3,
        activity_level:   parseFloat(form.activity_level)   || 6,
      })
      setResult(r.data)
    } catch(e) { alert(e.response?.data?.detail || 'Prediction failed — is backend running?') }
    setLoading(false)
  }

  const meta = result ? (STATUS_META[result.risk_label] || STATUS_META.low) : null

  return (
    <div style={{ padding: 'clamp(1rem,3vw,2rem)', maxWidth: 1160, margin: '0 auto' }}>

      {/* ── Page Header ── */}
      <div style={{ marginBottom: '2rem' }} className="animate-fade-up">
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '5px 16px', borderRadius: 24,
          background: 'rgba(34,201,122,0.10)',
          border: '1px solid rgba(34,201,122,0.26)',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10.5, letterSpacing: '0.13em', color: 'var(--green)',
          textTransform: 'uppercase', marginBottom: '1rem',
        }}>
          Module 01
        </div>
        <h1 className="font-display" style={{
          fontSize: 'clamp(26px,4.5vw,36px)',
          fontWeight: 800, color: 'var(--text)',
          letterSpacing: '-0.027em', lineHeight: 1.08,
          marginBottom: '0.6rem',
        }}>
          Health Monitor
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text2)' }}>
          Random Forest ML · Federated Learning · 2 farm nodes
        </p>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '1.75rem', flexWrap: 'wrap' }}>
        {[['list','🐄 All Cattle'],['predict','🧠 Run Prediction'],['register','➕ Register Animal']].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)} className={`module-tab${tab===id?' active':''}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ══ ALL CATTLE ══ */}
      {tab === 'list' && (
        <div className="animate-fade-up">
          <div style={{ display: 'flex', gap: 10, marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              style={{ maxWidth: 280 }}
              placeholder="Search by tag or name…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button className="btn-primary" onClick={() => setTab('register')}>+ Register Animal</button>
          </div>

          {filtered.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-icon">🐄</div>
                <p>No cattle found</p>
                <small>Register your first animal to get started</small>
                <button className="btn-primary" style={{ marginTop: 12 }} onClick={() => setTab('register')}>
                  Register first animal →
                </button>
              </div>
            </div>
          ) : (
            <div className="card" style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    {['Tag','Name','Breed','Age','Weight','Node','Status'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id}>
                      <td>
                        <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11.5, color:'var(--green)', fontWeight:500 }}>
                          {c.tag_number}
                        </span>
                      </td>
                      <td style={{ fontWeight:500, color:'var(--text)' }}>{c.name || '—'}</td>
                      <td>{c.breed}</td>
                      <td>{c.age_years}y</td>
                      <td>{c.weight_kg} kg</td>
                      <td><span className="badge badge-blue" style={{ fontSize:10.5 }}>{c.farm_node}</span></td>
                      <td><span className="badge badge-green" style={{ fontSize:10.5 }}>Active</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══ PREDICTION ══ */}
      {tab === 'predict' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))', gap:'1.5rem' }}
             className="animate-fade-up">

          {/* Input form */}
          <div className="card" style={{ padding:'1.75rem' }}>
            <p className="section-tag">Vital Signs</p>
            <h3 className="font-display" style={{ fontSize:17, fontWeight:700, color:'var(--text)', marginBottom:'1.5rem' }}>
              Input Parameters
            </h3>

            <div style={{ marginBottom:18 }}>
              <label>Select Animal</label>
              <select value={form.cattle_id} onChange={e => setForm({...form, cattle_id:e.target.value})}>
                <option value="">— choose animal —</option>
                {cattle.map(c => <option key={c.id} value={c.id}>{c.tag_number}{c.name?` — ${c.name}`:''}</option>)}
              </select>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
              {VITAL_FIELDS.map(({ key, label, unit, ph, hint }) => (
                <div key={key}>
                  <label style={{ fontSize:10 }}>
                    {label} <span style={{ color:'var(--green)', opacity:0.65 }}>({unit})</span>
                  </label>
                  <input type="number" placeholder={ph}
                    value={form[key]} onChange={e => setForm({...form,[key]:e.target.value})} />
                  <p style={{ fontSize:10, color:'var(--text3)', marginTop:3 }}>{hint}</p>
                </div>
              ))}
            </div>

            <button className="btn-primary" style={{ width:'100%', justifyContent:'center', padding:'11px 20px' }}
              onClick={predict} disabled={loading}>
              {loading
                ? <><span className="animate-spin" style={{ display:'inline-block', width:14, height:14, border:'2px solid rgba(4,18,9,0.3)', borderTop:'2px solid #041209', borderRadius:'50%' }} /> Analysing…</>
                : '🧠 Run Health Prediction'}
            </button>
          </div>

          {/* Result */}
          <div className="card" style={{ padding:'1.75rem' }}>
            {result ? (
              <div>
                {/* Header */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                  <div>
                    <p className="section-tag">Prediction Result</p>
                    <h3 className="font-display" style={{ fontSize:17, fontWeight:700, color:'var(--text)' }}>
                      {result.tag_number}
                    </h3>
                  </div>
                  <div style={{
                    padding:'6px 16px', borderRadius:24,
                    background: meta.bg, border:`1px solid ${meta.border}`,
                    fontSize:12.5, fontWeight:700, color:meta.color,
                    fontFamily:'JetBrains Mono,monospace', letterSpacing:'0.05em',
                  }}>
                    {meta.label}
                  </div>
                </div>

                {/* Risk bar */}
                <p style={{ fontSize:10.5, color:'var(--text3)', marginBottom:8, letterSpacing:'0.08em', fontFamily:'JetBrains Mono,monospace' }}>RISK SCORE</p>
                <div style={{ height:10, background:'var(--border)', borderRadius:5, overflow:'hidden', marginBottom:6 }}>
                  <div style={{
                    height:'100%', borderRadius:5,
                    width:`${result.risk_score * 100}%`,
                    background: meta.color,
                    transition:'width 1.1s cubic-bezier(0.16,1,0.3,1)',
                  }} />
                </div>
                <p style={{ textAlign:'right', fontSize:12, fontFamily:'JetBrains Mono,monospace', marginBottom:18, color:meta.color }}>
                  {Math.round(result.risk_score * 100)}% risk
                </p>

                {/* Advice */}
                <div style={{
                  padding:'14px 16px', borderRadius:10,
                  background: meta.bg, border:`1px solid ${meta.border}`,
                  marginBottom:18,
                }}>
                  <p style={{ fontSize:13, lineHeight:1.7, color:meta.color }}>
                    {result.advice}
                  </p>
                </div>

                {/* ML probabilities */}
                {result.probabilities && (
                  <div>
                    <p style={{ fontSize:10.5, color:'var(--text3)', marginBottom:10, letterSpacing:'0.08em', fontFamily:'JetBrains Mono,monospace' }}>
                      ML CONFIDENCE
                    </p>
                    {Object.entries(result.probabilities).map(([label, prob]) => {
                      const c = label==='high'?'var(--red)':label==='medium'?'var(--amber)':'var(--green)'
                      return (
                        <div key={label} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:9 }}>
                          <span style={{ width:58, fontSize:11.5, color:'var(--text3)', textTransform:'capitalize', fontFamily:'JetBrains Mono,monospace' }}>{label}</span>
                          <div style={{ flex:1, height:6, background:'var(--border)', borderRadius:3, overflow:'hidden' }}>
                            <div style={{ height:'100%', borderRadius:3, width:`${prob*100}%`, background:c, transition:'width 0.9s ease' }} />
                          </div>
                          <span style={{ width:36, fontSize:11, fontFamily:'JetBrains Mono,monospace', color:'var(--text3)', textAlign:'right' }}>
                            {Math.round(prob*100)}%
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}

                <p style={{ fontSize:10.5, color:'var(--text3)', marginTop:14, fontFamily:'JetBrains Mono,monospace' }}>
                  {result.model_used === 'random_forest' ? '✓ Random Forest ML · Federated' : '⚠ Rule-based fallback'}
                </p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:340 }}>
                <div style={{
                  width:80, height:80, borderRadius:'50%',
                  background:'var(--green-dim)', border:'1px solid rgba(34,201,122,0.2)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:38, marginBottom:18,
                }}>🐄</div>
                <p style={{ color:'var(--text)', fontSize:15, fontWeight:600, fontFamily:'Syne,sans-serif' }}>Ready to analyse</p>
                <p style={{ color:'var(--text3)', fontSize:12.5, marginTop:6, textAlign:'center', lineHeight:1.6 }}>
                  Select an animal, enter vital signs,<br/>and run the prediction
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ REGISTER ══ */}
      {tab === 'register' && (
        <div className="animate-fade-up" style={{ maxWidth:540 }}>
          <div className="card" style={{ padding:'1.75rem' }}>
            <p className="section-tag">Registration</p>
            <h3 className="font-display" style={{ fontSize:18, fontWeight:700, color:'var(--text)', marginBottom:'1.5rem' }}>
              Register New Animal
            </h3>

            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {[
                { key:'tag_number', label:'Tag Number *', ph:'C001' },
                { key:'name',       label:'Name',         ph:'Lakshmi' },
                { key:'breed',      label:'Breed',        ph:'HF Cross' },
                { key:'age_years',  label:'Age (years)',  ph:'3', type:'number' },
                { key:'weight_kg',  label:'Weight (kg)',  ph:'380', type:'number' },
              ].map(({ key, label, ph, type='text' }) => (
                <div key={key}>
                  <label>{label}</label>
                  <input type={type} placeholder={ph} value={newCow[key]}
                    onChange={e => setNewCow({...newCow,[key]:e.target.value})} />
                </div>
              ))}

              <div>
                <label>Farm Node</label>
                <select value={newCow.farm_node} onChange={e => setNewCow({...newCow, farm_node:e.target.value})}>
                  <option value="node_1">Node 1 — Main Farm</option>
                  <option value="node_2">Node 2 — East Field</option>
                </select>
              </div>

              <div style={{ display:'flex', gap:10, marginTop:4 }}>
                <button className="btn-ghost" style={{ flex:1 }} onClick={() => setTab('list')}>Cancel</button>
                <button className="btn-primary" style={{ flex:2, justifyContent:'center' }} onClick={registerCow}>
                  Register Animal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}