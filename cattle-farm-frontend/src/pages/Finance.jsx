import { useState, useEffect } from 'react'
import { financeAPI } from '../services/api'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const TAB_LABELS = {
  dashboard: '📊 Dashboard',
  record:    '✏️ Record',
  plreport:  '📈 P&L Report',
  ranking:   '🏆 Ranking',
  forecast:  '🔮 Forecast',
  buyers:    '🤝 Buyers',
}

const amtColor = a => a >= 0 ? 'var(--green)' : 'var(--red)'

export default function Finance() {
  const [tab, setTab]           = useState('dashboard')
  const [dashboard, setDash]    = useState(null)
  const [ledger, setLedger]     = useState([])
  const [pl, setPL]             = useState(null)
  const [ranking, setRanking]   = useState([])
  const [forecast, setForecast] = useState([])
  const [buyers, setBuyers]     = useState([])
  const [saleForm, setSale]     = useState({ litres:'', price_per_litre:'', buyer_name:'' })
  const [expForm, setExp]       = useState({ record_type:'feed', description:'', amount:'' })
  const [buyerForm, setBuyer]   = useState({ name:'', phone:'', location:'', buyer_type:'dairy', avg_price:'' })
  const now = new Date()

  useEffect(() => {
    financeAPI.getDashboard().then(r => setDash(r.data)).catch(() => {})
    financeAPI.getLedger().then(r => setLedger(r.data)).catch(() => {})
    financeAPI.getPLReport(now.getFullYear(), now.getMonth()+1).then(r => setPL(r.data)).catch(() => {})
    financeAPI.getAnimalRank().then(r => setRanking(r.data.animals || [])).catch(() => {})
    financeAPI.getForecast().then(r => setForecast(r.data.forecast?.slice(0,14) || [])).catch(() => {})
    financeAPI.getBuyers().then(r => setBuyers(r.data)).catch(() => {})
  }, [])

  const recordSale = async () => {
    if (!saleForm.litres || !saleForm.price_per_litre) return alert('Fill litres and price')
    try {
      await financeAPI.recordSale({ litres: parseFloat(saleForm.litres), price_per_litre: parseFloat(saleForm.price_per_litre), buyer_name: saleForm.buyer_name })
      setSale({ litres:'', price_per_litre:'', buyer_name:'' })
      financeAPI.getLedger().then(r => setLedger(r.data)).catch(() => {})
      financeAPI.getDashboard().then(r => setDash(r.data)).catch(() => {})
      alert('Sale recorded!')
    } catch(e) { alert(e.response?.data?.detail || 'Error') }
  }

  const recordExp = async () => {
    if (!expForm.description || !expForm.amount) return alert('Fill all fields')
    try {
      await financeAPI.recordExpense({ ...expForm, amount: parseFloat(expForm.amount) })
      setExp({ record_type:'feed', description:'', amount:'' })
      financeAPI.getLedger().then(r => setLedger(r.data)).catch(() => {})
      alert('Expense recorded!')
    } catch(e) { alert(e.response?.data?.detail || 'Error') }
  }

  const addBuyer = async () => {
    if (!buyerForm.name) return alert('Name required')
    try {
      await financeAPI.addBuyer({ ...buyerForm, avg_price: parseFloat(buyerForm.avg_price)||0 })
      financeAPI.getBuyers().then(r => setBuyers(r.data)).catch(() => {})
      setBuyer({ name:'', phone:'', location:'', buyer_type:'dairy', avg_price:'' })
    } catch(e) { alert(e.response?.data?.detail || 'Error') }
  }

  // ── Helpers ──
  const FieldInput = ({ label, value, onChange, type='text', placeholder }) => (
    <div style={{ marginBottom:14 }}>
      <label>{label}</label>
      <input type={type} placeholder={placeholder} value={value} onChange={onChange} />
    </div>
  )

  return (
    <div style={{ padding: 'clamp(1rem,3vw,2rem)', maxWidth: 1160, margin: '0 auto' }}>

      {/* ── Page Header ── */}
      <div style={{ marginBottom: '2rem' }} className="animate-fade-up">
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '5px 16px', borderRadius: 24,
          background: 'rgba(193,117,46,0.10)',
          border: '1px solid rgba(193,117,46,0.26)',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10.5, letterSpacing: '0.13em', color: 'var(--amber)',
          textTransform: 'uppercase', marginBottom: '1rem',
        }}>
          
        </div>
        <h1 className="font-display" style={{
          fontSize: 'clamp(26px,4.5vw,36px)',
          fontWeight: 800, color: 'var(--text)',
          letterSpacing: '-0.027em', lineHeight: 1.08, marginBottom: '0.6rem',
        }}>
          Finance Manager
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text2)' }}>
          Prophet forecast · P&L · Per-animal ranking · Buyer directory
        </p>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display:'flex', gap:8, marginBottom:'1.75rem', flexWrap:'wrap' }}>
        {Object.entries(TAB_LABELS).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`module-tab${tab===id?' active':''}`}
            style={{ fontSize:12.5 }}>
            {label}
          </button>
        ))}
      </div>

      {/* ══ DASHBOARD ══ */}
      {tab === 'dashboard' && (
        <div className="animate-fade-up">
          {/* Stat cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:12, marginBottom:'1.5rem' }}>
            {[
              { label:"Today's Income",   value:`₹${dashboard?.today?.income ?? 0}`,   color:'var(--green)', icon:'📈', sub:'Gross earned today' },
              { label:"Today's Expenses", value:`₹${dashboard?.today?.expenses ?? 0}`, color:'var(--red)',   icon:'📉', sub:'Spent today'        },
              { label:"Month Net",        value:`₹${dashboard?.this_month?.net ?? 0}`, color:'var(--amber)', icon:'💰', sub:'Net this month'     },
              { label:"Total Milk (L)",   value: dashboard?.total_milk_litres ?? 0,     color:'var(--blue)',  icon:'🥛', sub:'Litres recorded'   },
            ].map(({ label, value, color, icon, sub }) => (
              <div key={label} className="card stat-card" style={{ padding:'1.4rem', '--accent-color':color }}>
                <div style={{
                  width:42, height:42, borderRadius:10,
                  background:`color-mix(in srgb, ${color} 12%, transparent)`,
                  border:`1px solid color-mix(in srgb, ${color} 24%, transparent)`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:20, marginBottom:14,
                }}>
                  {icon}
                </div>
                <p style={{ fontSize:26, fontWeight:800, color, fontFamily:'Syne,sans-serif', lineHeight:1.1, marginBottom:4 }}>{value}</p>
                <p style={{ fontSize:12.5, fontWeight:600, color:'var(--text)', marginBottom:2 }}>{label}</p>
                <p style={{ fontSize:11, color:'var(--text3)' }}>{sub}</p>
              </div>
            ))}
          </div>

          {/* Recent ledger */}
          <div className="card" style={{ padding:'1.5rem' }}>
            <p className="section-tag">Transactions</p>
            <h3 className="font-display" style={{ fontSize:16, fontWeight:700, color:'var(--text)', marginBottom:'1.25rem' }}>
              Recent Activity
            </h3>
            {ledger.length === 0 ? (
              <p style={{ color:'var(--text3)', fontSize:13 }}>No transactions yet.</p>
            ) : (
              ledger.slice(0,8).map(r => (
                <div key={r.id} style={{
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                  padding:'11px 0', borderBottom:'1px solid var(--border)',
                }}>
                  <div>
                    <p style={{ fontSize:13.5, color:'var(--text)', fontWeight:500 }}>{r.description}</p>
                    <p style={{ fontSize:11.5, color:'var(--text3)', marginTop:2, fontFamily:'JetBrains Mono,monospace' }}>
                      {r.record_type} · {r.buyer_name || '—'}
                    </p>
                  </div>
                  <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:14, fontWeight:700, color:amtColor(r.amount) }}>
                    {r.amount >= 0 ? '+' : ''}₹{Math.abs(r.amount).toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ══ RECORD ══ */}
      {tab === 'record' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))', gap:'1.5rem' }}
             className="animate-fade-up">

          {/* Sale */}
          <div className="card" style={{ padding:'1.75rem' }}>
            <p className="section-tag">Income</p>
            <h3 className="font-display" style={{ fontSize:17, fontWeight:700, color:'var(--text)', marginBottom:'1.5rem' }}>
              Record Milk Sale
            </h3>
            <FieldInput label="Litres Sold" value={saleForm.litres} type="number" placeholder="12.5"
              onChange={e => setSale({...saleForm, litres:e.target.value})} />
            <FieldInput label="Price / Litre ₹" value={saleForm.price_per_litre} type="number" placeholder="38"
              onChange={e => setSale({...saleForm, price_per_litre:e.target.value})} />
            <FieldInput label="Buyer Name" value={saleForm.buyer_name} placeholder="Nandini Dairy"
              onChange={e => setSale({...saleForm, buyer_name:e.target.value})} />
            <button className="btn-primary" style={{ width:'100%', justifyContent:'center' }} onClick={recordSale}>
              💰 Record Sale
            </button>
          </div>

          {/* Expense */}
          <div className="card" style={{ padding:'1.75rem' }}>
            <p className="section-tag">Expense</p>
            <h3 className="font-display" style={{ fontSize:17, fontWeight:700, color:'var(--text)', marginBottom:'1.5rem' }}>
              Record Expense
            </h3>
            <div style={{ marginBottom:14 }}>
              <label>Category</label>
              <select value={expForm.record_type} onChange={e => setExp({...expForm, record_type:e.target.value})}>
                <option value="feed">Feed</option>
                <option value="medicine">Medicine</option>
                <option value="labour">Labour</option>
                <option value="other">Other</option>
              </select>
            </div>
            <FieldInput label="Description" value={expForm.description} placeholder="Monthly feed purchase"
              onChange={e => setExp({...expForm, description:e.target.value})} />
            <FieldInput label="Amount ₹" value={expForm.amount} type="number" placeholder="500"
              onChange={e => setExp({...expForm, amount:e.target.value})} />
            <button className="btn-ghost" style={{ width:'100%', justifyContent:'center' }} onClick={recordExp}>
              📉 Record Expense
            </button>
          </div>
        </div>
      )}

      {/* ══ P&L REPORT ══ */}
      {tab === 'plreport' && (
        <div className="card animate-fade-up" style={{ padding:'1.75rem' }}>
          <p className="section-tag">Profit & Loss</p>
          <h3 className="font-display" style={{ fontSize:17, fontWeight:700, color:'var(--text)', marginBottom:'1.5rem' }}>
            Monthly P&L Report
          </h3>
          {pl ? (
            <div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:10, marginBottom:'1.5rem' }}>
                {[
                  { label:'Total Income',   value:`₹${pl.income ?? 0}`,   color:'var(--green)' },
                  { label:'Total Expenses', value:`₹${pl.expenses ?? 0}`, color:'var(--red)'   },
                  { label:'Net Profit',     value:`₹${pl.net ?? 0}`,      color:'var(--amber)' },
                  { label:'Milk Sold (L)',  value: pl.milk_litres ?? 0,   color:'var(--blue)'  },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{
                    padding:'1.1rem 1.25rem', borderRadius:12,
                    background:`color-mix(in srgb, ${color} 8%, transparent)`,
                    border:`1px solid color-mix(in srgb, ${color} 18%, transparent)`,
                  }}>
                    <p style={{ fontSize:22, fontWeight:800, color, fontFamily:'Syne,sans-serif' }}>{value}</p>
                    <p style={{ fontSize:11.5, color:'var(--text3)', marginTop:4 }}>{label}</p>
                  </div>
                ))}
              </div>
              <p style={{ fontSize:11, color:'var(--text3)', fontFamily:'JetBrains Mono,monospace' }}>
                Period: {pl.month}/{pl.year}
              </p>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📈</div>
              <p>No P&L data yet</p>
              <small>Record some sales and expenses to generate report</small>
            </div>
          )}
        </div>
      )}

      {/* ══ RANKING ══ */}
      {tab === 'ranking' && (
        <div className="animate-fade-up">
          <p style={{ fontSize:13, color:'var(--text2)', marginBottom:'1.25rem' }}>
            Ranked by net profit — best performing animals first
          </p>
          {ranking.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-icon">🏆</div>
                <p>No ranking data yet</p>
                <small>Record some sales first to generate rankings</small>
              </div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {ranking.map(a => (
                <div key={a.cattle_id} className="card card-hover" style={{ padding:'1.1rem 1.5rem', display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
                  <div style={{
                    width:46, height:46, borderRadius:'50%',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontWeight:800, fontSize:14, flexShrink:0, fontFamily:'Syne,sans-serif',
                    background: a.rank===1 ? 'var(--amber-dim)' : 'var(--bg2)',
                    color: a.rank===1 ? 'var(--amber)' : 'var(--text3)',
                    border: `1px solid ${a.rank===1 ? 'rgba(193,117,46,0.3)' : 'var(--border)'}`,
                  }}>
                    #{a.rank}
                  </div>
                  <div style={{ flex:1 }}>
                    <p style={{ fontWeight:600, color:'var(--text)', fontSize:14 }}>
                      {a.tag_number}{a.name ? ` — ${a.name}` : ''}
                      {a.rank === 1 && <span style={{ marginLeft:8, fontSize:13 }}>🥇</span>}
                    </p>
                    <p style={{ fontSize:12, color:'var(--text3)', marginTop:3, fontFamily:'JetBrains Mono,monospace' }}>
                      {a.breed} · {a.total_litres}L produced
                    </p>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <p style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:700, fontSize:16, color:amtColor(a.net_profit) }}>
                      ₹{a.net_profit.toFixed(0)}
                    </p>
                    <p style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>net profit</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ FORECAST ══ */}
      {tab === 'forecast' && (
        <div className="card animate-fade-up" style={{ padding:'1.75rem' }}>
          <p className="section-tag">Prediction</p>
          <h3 className="font-display" style={{ fontSize:17, fontWeight:700, color:'var(--text)', marginBottom:'1.5rem' }}>
            14-Day Milk Price Forecast <span style={{ fontSize:13, fontFamily:'JetBrains Mono,monospace', color:'var(--text3)' }}>(₹/Litre)</span>
          </h3>
          {forecast.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={forecast} margin={{ top:4, right:0, bottom:0, left:-10 }}>
                <XAxis dataKey="date"
                  tick={{ fill:'var(--text3)', fontSize:11, fontFamily:'JetBrains Mono,monospace' }}
                  axisLine={false} tickLine={false}
                  tickFormatter={d => d.slice(5)} />
                <YAxis
                  tick={{ fill:'var(--text3)', fontSize:11 }}
                  axisLine={false} tickLine={false} domain={['auto','auto']} />
                <Tooltip
                  contentStyle={{ background:'rgba(15,26,18,0.96)', border:'1px solid rgba(47,143,124,0.2)', borderRadius:10, fontSize:12 }}
                  labelStyle={{ color:'var(--text3)', fontFamily:'JetBrains Mono,monospace' }}
                  itemStyle={{ color:'var(--green)' }}
                />
                <Line type="monotone" dataKey="predicted" stroke="var(--green)" strokeWidth={2.5} dot={false} name="Predicted ₹" />
                <Line type="monotone" dataKey="upper"     stroke="var(--text3)" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Upper bound" />
                <Line type="monotone" dataKey="lower"     stroke="var(--text3)" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Lower bound" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📈</div>
              <p>Forecast not available yet</p>
              <small>Need 10+ milk sale records to activate Prophet forecast</small>
            </div>
          )}
        </div>
      )}

      {/* ══ BUYERS ══ */}
      {tab === 'buyers' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))', gap:'1.5rem' }}
             className="animate-fade-up">

          {/* Add buyer form */}
          <div className="card" style={{ padding:'1.75rem' }}>
            <p className="section-tag">New Buyer</p>
            <h3 className="font-display" style={{ fontSize:17, fontWeight:700, color:'var(--text)', marginBottom:'1.5rem' }}>
              Add Buyer
            </h3>
            <FieldInput label="Name *" value={buyerForm.name} placeholder="Nandini Dairy"
              onChange={e => setBuyer({...buyerForm, name:e.target.value})} />
            <FieldInput label="Phone" value={buyerForm.phone} placeholder="9876543210"
              onChange={e => setBuyer({...buyerForm, phone:e.target.value})} />
            <FieldInput label="Location" value={buyerForm.location} placeholder="Mysuru"
              onChange={e => setBuyer({...buyerForm, location:e.target.value})} />
            <FieldInput label="Avg Price/L ₹" value={buyerForm.avg_price} type="number" placeholder="38"
              onChange={e => setBuyer({...buyerForm, avg_price:e.target.value})} />
            <div style={{ marginBottom:18 }}>
              <label>Buyer Type</label>
              <select value={buyerForm.buyer_type} onChange={e => setBuyer({...buyerForm, buyer_type:e.target.value})}>
                <option value="dairy">Dairy Company</option>
                <option value="cooperative">Cooperative</option>
                <option value="individual">Individual</option>
              </select>
            </div>
            <button className="btn-primary" style={{ width:'100%', justifyContent:'center' }} onClick={addBuyer}>
              Add Buyer
            </button>
          </div>

          {/* Buyer list */}
          <div>
            <p style={{ fontSize:10.5, color:'var(--text3)', marginBottom:14, letterSpacing:'0.08em', fontFamily:'JetBrains Mono,monospace' }}>
              BUYER DIRECTORY ({buyers.length})
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {buyers.length === 0 ? (
                <div className="card">
                  <div className="empty-state" style={{ padding:'2rem' }}>
                    <p>No buyers added yet</p>
                  </div>
                </div>
              ) : (
                buyers.map(b => (
                  <div key={b.id} className="card card-hover" style={{ padding:'1rem 1.4rem', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
                    <div>
                      <p style={{ fontWeight:600, color:'var(--text)', fontSize:14, marginBottom:3 }}>{b.name}</p>
                      <p style={{ fontSize:12, color:'var(--text3)' }}>{b.location} · {b.phone}</p>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <span className="badge badge-blue" style={{ fontSize:11 }}>{b.buyer_type}</span>
                      {b.avg_price > 0 && (
                        <p style={{ fontSize:13, color:'var(--green)', marginTop:5, fontFamily:'JetBrains Mono,monospace', fontWeight:600 }}>
                          ₹{b.avg_price}/L
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}