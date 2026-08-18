import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

/* ═══════════════════════════════════════════════════════
   PASHUTRACK — Investor-grade SaaS landing page
   Palette: brand #2f8f7c · deep greens #1c3a30 / #12201b
            cream #f7f5ef · gold accent #c9a24b
   Type: Syne (display) · DM Sans (body) · JetBrains Mono (data)
═══════════════════════════════════════════════════════ */

/* "Brass & Teal" — matches the app's own design system (index.css):
   teal for status/brand, indigo·plum·rust for the four modules,
   brass gold as the one sparing signature highlight. */
const BRAND      = '#2f8f7c'   // teal
const DARK_1     = '#1c3a30'
const DARK_2     = '#12201b'
const CREAM      = '#faf4e8'
const GOLD       = '#d3a030'   // brass
const INDIGO     = '#5a6fa5'
const PLUM       = '#8b5a8c'
const RUST       = '#c1752e'

/* ---------- reveal-on-scroll hook ---------- */
function useReveal() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); io.unobserve(el) } },
      { threshold: 0.15 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return [ref, visible]
}

function Reveal({ children, delay = 0, style = {} }) {
  const [ref, visible] = useReveal()
  return (
    <div ref={ref} style={{
      ...style,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(28px)',
      transition: `opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
    }}>
      {children}
    </div>
  )
}

/* ---------- animated counter ---------- */
function Counter({ to, suffix = '', duration = 1400 }) {
  const [ref, visible] = useReveal()
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!visible) return
    const start = performance.now()
    let raf
    const tick = now => {
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(to * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [visible, to, duration])
  return <span ref={ref}>{val.toLocaleString('en-IN')}{suffix}</span>
}

/* ---------- data ---------- */
const NAV_ITEMS = [
  { label: 'Home',    to: 'top' },
  { label: 'Dashboard', to: '/' },
  { label: 'Health',  to: '/health' },
  { label: 'Vet AI',  to: '/vet' },
  { label: 'Milk Quality', to: '/milk' },
  { label: 'Finance', to: '/finance' },
  { label: 'Contact', to: 'contact' },
]

const STAT_CARDS = [
  {
    label: 'Total Cattle', value: 480, suffix: '+',
    desc: 'Animals tracked across every connected farm node.',
    img: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=800&q=80',
    icon: '🐄',
  },
  {
    label: 'Healthy Animals', value: 96, suffix: '%',
    desc: 'Verified low-risk on the latest AI health scan.',
    img: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=800&q=80',
    icon: '💚',
  },
  {
    label: 'Daily Milk Production', value: 3120, suffix: 'L',
    desc: 'Litres logged and quality-checked every day.',
    img: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80',
    icon: '🥛',
  },
  {
    label: 'Monthly Revenue', value: 8, suffix: 'L+',
    desc: 'Gross farm revenue tracked through Finance AI.',
    img: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=800&q=80',
    icon: '₹',
  },
]

const FEATURES = [
  {
    label: 'AI Health Monitoring', tag: 'Module 01', accent: BRAND,
    desc: 'Random-forest models score every animal from six vitals and flag disease risk before symptoms show.',
    img: 'https://images.unsplash.com/photo-1560114928-40f1f1eb26a0?auto=format&fit=crop&w=900&q=80',
    path: '/health',
  },
  {
    label: 'AI Vet Assistant', tag: 'Module 02', accent: INDIGO,
    desc: 'Instant first-aid guidance from an on-farm AI, with live video hand-off to a real veterinarian.',
    img: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=900&q=80',
    path: '/vet',
  },
  {
    label: 'Milk Quality Analysis', tag: 'Module 03', accent: PLUM,
    desc: 'A six-parameter purity classifier issues a pass/fail verdict and a certified PDF in seconds.',
    img: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=900&q=80',
    path: '/milk',
  },
  {
    label: 'Smart Finance Management', tag: 'Module 04', accent: RUST,
    desc: 'Forecast milk prices, track profit per animal, and manage buyers from a single ledger.',
    img: 'https://images.unsplash.com/photo-1454165833762-8a3961cbba4e?auto=format&fit=crop&w=900&q=80',
    path: '/finance',
  },
]

const WHY_CHOOSE = [
  { icon: '🔬', title: 'AI Disease Prediction', desc: 'Federated learning across farm nodes catches early warning signs a manual check would miss.' },
  { icon: '📡', title: 'Real-Time Monitoring', desc: 'Live vitals and alerts stream to your dashboard the moment they are logged — no waiting on reports.' },
  { icon: '📊', title: 'Smart Analytics', desc: 'Production, purity, and profit trends, forecast weeks ahead so decisions get made early, not late.' },
]

const TESTIMONIALS = [
  {
    name: 'Ramesh Gowda', location: 'Mandya, Karnataka', rating: 5,
    quote: 'PashuTrack caught a health issue in one of my cows two days before I would have noticed anything myself.',
  },
  {
    name: 'Lakshmi Devi', location: 'Mysuru, Karnataka', rating: 5,
    quote: 'The milk certificate used to take a lab visit and a full day. Now it takes ninety seconds and a phone.',
  },
  {
    name: 'Suresh Patil', location: 'Belagavi, Karnataka', rating: 5,
    quote: 'Seeing profit per animal changed how I feed and breed. I dropped two low performers and margins went up.',
  },
]

const GALLERY = [
  { img: 'https://images.unsplash.com/photo-1560114928-40f1f1eb26a0?auto=format&fit=crop&w=700&q=80', tall: true,  label: 'Cattle health scan' },
  { img: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=700&q=80', tall: false, label: 'Milk collection' },
  { img: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=700&q=80', tall: false, label: 'Veterinary care' },
  { img: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=700&q=80', tall: true,  label: 'Herd on pasture' },
  { img: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=700&q=80', tall: false, label: 'Field monitoring' },
  { img: 'https://images.unsplash.com/photo-1594761051556-8bf78dc6fa25?auto=format&fit=crop&w=700&q=80', tall: false, label: 'Smart farm tech' },
]

/* ═══════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════ */
export default function LandingPage() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [tIndex, setTIndex] = useState(0)

  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=JetBrains+Mono:wght@400;500&display=swap'
    document.head.appendChild(link)
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => { window.removeEventListener('scroll', onScroll); document.head.removeChild(link) }
  }, [])

  useEffect(() => {
    const id = setInterval(() => setTIndex(i => (i + 1) % TESTIMONIALS.length), 5500)
    return () => clearInterval(id)
  }, [])

  const go = to => {
    setMobileOpen(false)
    if (to === 'top') return window.scrollTo({ top: 0, behavior: 'smooth' })
    if (to === 'contact') return document.getElementById('pt-contact')?.scrollIntoView({ behavior: 'smooth' })
    navigate(to)
  }

  return (
    <div style={S.page}>

      {/* ══════ NAVBAR ══════ */}
      <nav style={{ ...S.nav, ...(scrolled ? S.navScrolled : {}) }}>
        <button style={S.brand} onClick={() => go('top')}>
          <span style={S.brandMark}>🐄</span>
          <span>Pashu<span style={{ color: BRAND }}>Track</span></span>
        </button>

        <div style={S.navLinksDesktop} className="pt-desktop-only">
          {NAV_ITEMS.map(item => (
            <button key={item.label} style={S.navLink} className="pt-navlink" onClick={() => go(item.to)}>
              {item.label}
            </button>
          ))}
        </div>

        <button style={S.navCta} className="pt-desktop-only" onClick={() => go('/')}>Get Started</button>

        <button style={S.hamburger} className="pt-mobile-only" onClick={() => setMobileOpen(o => !o)} aria-label="Menu">
          <span style={{ ...S.hbLine, transform: mobileOpen ? 'translateY(6px) rotate(45deg)' : 'none' }} />
          <span style={{ ...S.hbLine, opacity: mobileOpen ? 0 : 1 }} />
          <span style={{ ...S.hbLine, transform: mobileOpen ? 'translateY(-6px) rotate(-45deg)' : 'none' }} />
        </button>
      </nav>

      {mobileOpen && (
        <div style={S.mobileMenu}>
          {NAV_ITEMS.map(item => (
            <button key={item.label} style={S.mobileLink} onClick={() => go(item.to)}>{item.label}</button>
          ))}
          <button style={{ ...S.navCta, marginTop: 8, width: '100%', justifyContent: 'center' }} onClick={() => go('/')}>Get Started</button>
        </div>
      )}

      {/* ══════ HERO ══════ */}
      <section style={S.hero}>
        <div style={S.heroBg}>
          <img
            src="https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=2000&q=80"
            alt="Dairy cattle grazing in a green pasture at sunrise"
            style={S.heroImg}
          />
        </div>
        <div style={S.heroOverlay} />
        <div style={S.particles}>
          {Array.from({ length: 22 }).map((_, i) => (
            <span key={i} style={{
              ...S.particle,
              left: `${(i * 47) % 100}%`,
              animationDelay: `${(i % 10) * 0.9}s`,
              animationDuration: `${9 + (i % 6)}s`,
            }} />
          ))}
        </div>

        <div style={S.heroContent} className="pt-hero-in">
          <div style={S.badge}>
            <span style={S.badgeDot} />
            AI Powered Dairy Management
          </div>
          <h1 style={S.h1}>Smart Dairy Farming<br />Powered by <span style={{ color: BRAND }}>Artificial Intelligence</span></h1>
          <p style={S.heroSub}>
            Cattle health monitoring, disease prediction, milk quality analysis, veterinary support
            and farm finance management — unified in one platform built for modern dairy operations.
          </p>
          <div style={S.heroActions}>
            <button style={S.btnPrimary} onClick={() => document.getElementById('pt-features')?.scrollIntoView({ behavior: 'smooth' })}>
              Explore Platform
            </button>
            <button style={S.btnGhost} onClick={() => document.getElementById('pt-dashboard')?.scrollIntoView({ behavior: 'smooth' })}>
              ▶ Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* ══════ STAT CARDS ══════ */}
      <section style={S.statsSection}>
        <div style={S.statsGrid}>
          {STAT_CARDS.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08}>
              <div style={S.statCard} className="pt-lift">
                <div style={S.statCardImgWrap}>
                  <img src={s.img} alt="" style={S.statCardImg} className="pt-zoom" />
                  <div style={S.statCardImgOverlay} />
                  <span style={S.statCardIcon}>{s.icon}</span>
                </div>
                <div style={S.statCardBody}>
                  <p style={S.statCardValue}><Counter to={s.value} suffix={s.suffix} /></p>
                  <p style={S.statCardLabel}>{s.label}</p>
                  <p style={S.statCardDesc}>{s.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══════ FEATURE SHOWCASE 2x2 ══════ */}
      <section style={S.featuresSection} id="pt-features">
        <Reveal><p style={S.eyebrow}>Platform Modules</p></Reveal>
        <Reveal delay={0.05}><h2 style={S.h2}>Everything a modern dairy farm needs</h2></Reveal>

        <div style={S.featuresGrid} className="pt-features-grid">
          {FEATURES.map((f, i) => (
            <Reveal key={f.label} delay={i * 0.07}>
              <div style={S.featCard} className="pt-lift" onClick={() => navigate(f.path)}>
                <img src={f.img} alt="" style={S.featImg} className="pt-zoom" />
                <div style={S.featOverlay} />
                <div style={S.featBody}>
                  <p style={{ ...S.featTag, color: f.accent }}>{f.tag}</p>
                  <p style={S.featTitle}>{f.label}</p>
                  <p style={S.featDesc}>{f.desc}</p>
                  <span style={{ ...S.featLink, color: f.accent }}>Open module →</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══════ WHY CHOOSE (cream) ══════ */}
      <section style={S.whySection}>
        <Reveal><p style={{ ...S.eyebrow, color: DARK_1 }}>Why PashuTrack</p></Reveal>
        <Reveal delay={0.05}><h2 style={{ ...S.h2, color: DARK_2 }}>Built for farmers who want an edge</h2></Reveal>

        <div style={S.whyGrid}>
          {WHY_CHOOSE.map((w, i) => (
            <Reveal key={w.title} delay={i * 0.08}>
              <div style={S.whyCol}>
                <div style={S.whyIcon}>{w.icon}</div>
                <p style={S.whyTitle}>{w.title}</p>
                <p style={S.whyDesc}>{w.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══════ DASHBOARD MOCKUP ══════ */}
      <section style={S.dashSection} id="pt-dashboard">
        <Reveal><p style={S.eyebrow}>Live Dashboard</p></Reveal>
        <Reveal delay={0.05}><h2 style={S.h2}>Every metric, one screen</h2></Reveal>

        <Reveal delay={0.1}>
          <div style={S.laptop}>
            <div style={S.laptopScreen}>
              <div style={S.laptopBar}>
                <span style={{ ...S.dot, background: '#c1443a' }} /><span style={{ ...S.dot, background: '#c1752e' }} /><span style={{ ...S.dot, background: BRAND }} />
              </div>
              <div style={S.laptopBody}>
                <div style={S.mockStatsRow} className="pt-mock-stats">
                  {[['Cattle', '482', BRAND], ['Alerts', '3', '#c1752e'], ['Purity', '96%', '#5a6fa5'], ['Income', '₹1.2L', GOLD]].map(([l, v, c]) => (
                    <div key={l} style={S.mockStat}>
                      <p style={{ ...S.mockStatVal, color: c }}>{v}</p>
                      <p style={S.mockStatLabel}>{l}</p>
                    </div>
                  ))}
                </div>
                <div style={S.mockChartRow} className="pt-mock-charts">
                  <div style={S.mockChart}>
                    <p style={S.mockChartLabel}>Milk Production — 7 days</p>
                    <svg viewBox="0 0 300 80" style={{ width: '100%', height: 70 }}>
                      <polyline points="0,60 40,45 80,50 120,30 160,38 200,20 240,28 300,14" fill="none" stroke={BRAND} strokeWidth="2.5" />
                    </svg>
                  </div>
                  <div style={S.mockChart}>
                    <p style={S.mockChartLabel}>Risk Breakdown</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                      {[['Low', 82, BRAND], ['Medium', 14, '#c1752e'], ['High', 4, '#c1443a']].map(([l, v, c]) => (
                        <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', width: 46 }}>{l}</span>
                          <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 4 }}>
                            <div style={{ width: `${v}%`, height: '100%', background: c, borderRadius: 4 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div style={S.laptopBase} />
          </div>
        </Reveal>
      </section>

      {/* ══════ TESTIMONIALS ══════ */}
      <section style={S.testiSection}>
        <Reveal><p style={S.eyebrow}>Trusted by farmers</p></Reveal>
        <Reveal delay={0.05}><h2 style={S.h2}>What the field says</h2></Reveal>

        <Reveal delay={0.1}>
          <div style={S.testiCard}>
            <p style={S.testiStars}>{'★'.repeat(TESTIMONIALS[tIndex].rating)}</p>
            <p style={S.testiQuote}>&ldquo;{TESTIMONIALS[tIndex].quote}&rdquo;</p>
            <p style={S.testiName}>{TESTIMONIALS[tIndex].name}</p>
            <p style={S.testiLoc}>{TESTIMONIALS[tIndex].location}</p>
            <div style={S.testiDots}>
              {TESTIMONIALS.map((_, i) => (
                <button key={i} onClick={() => setTIndex(i)} style={{ ...S.testiDotBtn, background: i === tIndex ? BRAND : 'rgba(255,255,255,0.18)' }} aria-label={`Testimonial ${i + 1}`} />
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ══════ GALLERY (masonry) ══════ */}
      <section style={S.gallerySection}>
        <Reveal><p style={S.eyebrow}>On the ground</p></Reveal>
        <Reveal delay={0.05}><h2 style={S.h2}>Smart farming, in the field</h2></Reveal>

        <div style={S.masonry}>
          {GALLERY.map((g, i) => (
            <Reveal key={g.label} delay={(i % 3) * 0.06} style={{ gridRow: g.tall ? 'span 2' : 'span 1' }}>
              <div style={{ ...S.galleryItem, height: g.tall ? 340 : 162 }}>
                <img src={g.img} alt={g.label} style={S.galleryImg} className="pt-zoom" />
                <div style={S.galleryOverlay}>{g.label}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══════ CTA BANNER ══════ */}
      <section style={S.ctaSection} id="pt-contact">
        <div style={S.ctaBg}>
          <img src="https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1800&q=80" alt="" style={S.heroImg} />
        </div>
        <div style={S.ctaOverlay} />
        <Reveal>
          <div style={S.ctaContent}>
            <h2 style={S.ctaTitle}>Ready to transform your dairy farm?</h2>
            <p style={S.ctaSub}>Join farmers already using AI to catch disease early, certify milk in seconds, and grow margins with confidence.</p>
            <div style={S.heroActions}>
              <button style={S.btnPrimary} onClick={() => go('/')}>Get Started</button>
              <button style={S.btnGhost} onClick={() => go('/')}>Book Demo</button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ══════ FOOTER ══════ */}
      <footer style={S.footer}>
        <div style={S.footerGrid} className="pt-footer-grid">
          <div style={S.footerBrandCol}>
            <div style={S.brand}><span style={S.brandMark}>🐄</span><span>Pashu<span style={{ color: BRAND }}>Track</span></span></div>
            <p style={S.footerTagline}>AI-powered dairy management for the modern farm.</p>
            <div style={S.footerSocial}>
              {['X', 'in', 'ig'].map(s => <span key={s} style={S.socialDot}>{s}</span>)}
            </div>
          </div>

          {[
            { title: 'Company', links: ['About', 'Careers', 'Press', 'Contact'] },
            { title: 'Products', links: ['Health Monitor', 'Vet AI', 'Milk Quality', 'Finance'] },
            { title: 'Resources', links: ['Documentation', 'Blog', 'Case Studies', 'API'] },
            { title: 'Support', links: ['Help Center', 'Community', 'Status', 'Contact Us'] },
          ].map(col => (
            <div key={col.title} style={S.footerCol}>
              <p style={S.footerColTitle}>{col.title}</p>
              {col.links.map(l => <span key={l} style={S.footerLink}>{l}</span>)}
            </div>
          ))}

          <div style={S.footerCol}>
            <p style={S.footerColTitle}>Stay Updated</p>
            <p style={S.footerLink}>Farm insights, monthly.</p>
            <div style={S.newsletterRow}>
              <input type="email" placeholder="you@farm.com" style={S.newsletterInput} />
              <button style={S.newsletterBtn}>→</button>
            </div>
          </div>
        </div>
        <div style={S.footerBottom}>
          <span>© 2026 PashuTrack · Mysuru, Karnataka</span>
          <span>Built for farmers, powered by AI</span>
        </div>
      </footer>

      <style>{`
        .pt-navlink { position: relative; }
        .pt-navlink::after {
          content: ''; position: absolute; left: 16px; right: 16px; bottom: 4px; height: 1.5px;
          background: ${BRAND}; transform: scaleX(0); transform-origin: left;
          transition: transform 0.25s ease;
        }
        .pt-navlink:hover::after { transform: scaleX(1); }
        .pt-navlink:hover { color: #fff !important; }

        .pt-lift { transition: transform 0.35s cubic-bezier(0.16,1,0.3,1), box-shadow 0.35s; cursor: pointer; }
        .pt-lift:hover { transform: translateY(-6px); box-shadow: 0 20px 44px rgba(0,0,0,0.28); }
        .pt-lift:hover .pt-zoom { transform: scale(1.08); }
        .pt-zoom { transition: transform 0.6s cubic-bezier(0.16,1,0.3,1); }

        @keyframes ptFloat {
          0%   { transform: translateY(0) translateX(0); opacity: 0; }
          10%  { opacity: 0.55; }
          90%  { opacity: 0.35; }
          100% { transform: translateY(-90vh) translateX(18px); opacity: 0; }
        }
        @keyframes ptPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
        @keyframes ptFadeUp { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: translateY(0); } }
        .pt-hero-in { animation: ptFadeUp 1s cubic-bezier(0.16,1,0.3,1) both; }

        .pt-mobile-only { display: none; }
        @media (max-width: 900px) {
          .pt-desktop-only { display: none !important; }
          .pt-mobile-only { display: flex !important; }
        }
        @media (max-width: 720px) {
          .pt-features-grid { grid-template-columns: 1fr !important; }
          .pt-footer-grid { grid-template-columns: repeat(2,1fr) !important; }
          .pt-mock-stats { grid-template-columns: repeat(2,1fr) !important; }
          .pt-mock-charts { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════════ */
const S = {
  page: { fontFamily: "'DM Sans', sans-serif", background: DARK_2, color: '#fff', overflowX: 'hidden', WebkitFontSmoothing: 'antialiased' },

  /* NAV */
  nav: {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 300, height: 72,
    display: 'flex', alignItems: 'center', gap: 8, padding: '0 clamp(1rem,4vw,2.5rem)',
    background: 'rgba(15,43,29,0.28)', backdropFilter: 'blur(14px) saturate(1.3)', WebkitBackdropFilter: 'blur(14px) saturate(1.3)',
    borderBottom: '1px solid rgba(255,255,255,0.06)', transition: 'background 0.3s, border-color 0.3s',
  },
  navScrolled: { background: 'rgba(10,30,20,0.86)', borderBottom: '1px solid rgba(255,255,255,0.09)' },
  brand: { display: 'flex', alignItems: 'center', gap: 9, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 19, color: '#fff' },
  brandMark: { width: 34, height: 34, borderRadius: 9, background: 'rgba(34,201,122,0.14)', border: '1px solid rgba(34,201,122,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 },
  navLinksDesktop: { display: 'flex', alignItems: 'center', gap: 2, margin: '0 auto' },
  navLink: { padding: '9px 16px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, fontWeight: 500, color: 'rgba(255,255,255,0.75)' },
  navCta: { padding: '10px 22px', borderRadius: 9, background: BRAND, color: '#041209', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13.5, letterSpacing: '0.01em' },
  hamburger: { display: 'none', flexDirection: 'column', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: 6 },
  hbLine: { width: 20, height: 2, background: '#fff', transition: 'all 0.25s' },
  mobileMenu: { position: 'fixed', top: 72, left: 0, right: 0, zIndex: 290, background: 'rgba(10,26,17,0.98)', backdropFilter: 'blur(16px)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 4, borderBottom: '1px solid rgba(255,255,255,0.08)' },
  mobileLink: { padding: '12px 8px', background: 'none', border: 'none', textAlign: 'left', color: '#fff', fontSize: 15, cursor: 'pointer' },

  /* HERO */
  hero: { position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', paddingTop: 72 },
  heroBg: { position: 'absolute', inset: 0, zIndex: 0 },
  heroImg: { width: '100%', height: '100%', objectFit: 'cover' },
  heroOverlay: { position: 'absolute', inset: 0, zIndex: 1, background: `linear-gradient(180deg, rgba(15,43,29,0.55) 0%, rgba(10,26,17,0.35) 32%, rgba(10,26,17,0.78) 78%, ${DARK_2} 100%)` },
  particles: { position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none', overflow: 'hidden' },
  particle: { position: 'absolute', bottom: '-4%', width: 4, height: 4, borderRadius: '50%', background: 'rgba(34,201,122,0.7)', boxShadow: `0 0 8px 1px ${BRAND}`, animationName: 'ptFloat', animationIterationCount: 'infinite', animationTimingFunction: 'linear' },
  heroContent: { position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: 880, padding: '0 1.5rem' },
  badge: { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 18px', borderRadius: 24, background: 'rgba(34,201,122,0.12)', border: '1px solid rgba(34,201,122,0.32)', fontFamily: "'JetBrains Mono',monospace", fontSize: 11, letterSpacing: '0.13em', color: BRAND, textTransform: 'uppercase', marginBottom: '1.5rem' },
  badgeDot: { width: 6, height: 6, borderRadius: '50%', background: BRAND, animation: 'ptPulse 2s infinite' },
  h1: { fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(34px,6.4vw,68px)', lineHeight: 1.08, letterSpacing: '-0.025em', marginBottom: '1.25rem', textShadow: '0 3px 30px rgba(0,0,0,0.5)' },
  heroSub: { fontSize: 'clamp(14px,1.8vw,17px)', color: 'rgba(255,255,255,0.68)', lineHeight: 1.65, maxWidth: 640, margin: '0 auto 2.25rem' },
  heroActions: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap' },
  btnPrimary: { padding: '13px 32px', borderRadius: 10, background: BRAND, color: '#041209', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14.5, boxShadow: '0 6px 28px rgba(34,201,122,0.32)', transition: 'transform 0.2s' },
  btnGhost: { padding: '13px 32px', borderRadius: 10, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14.5, transition: 'transform 0.2s' },

  /* STAT CARDS */
  statsSection: { padding: 'clamp(2.5rem,6vw,4rem) clamp(1.25rem,4vw,2.5rem)', background: DARK_2 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 20, maxWidth: 1200, margin: '0 auto' },
  statCard: { borderRadius: 18, overflow: 'hidden', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(6px)' },
  statCardImgWrap: { position: 'relative', height: 128, overflow: 'hidden' },
  statCardImg: { width: '100%', height: '100%', objectFit: 'cover' },
  statCardImgOverlay: { position: 'absolute', inset: 0, background: `linear-gradient(180deg, rgba(15,43,29,0.15), ${DARK_2})` },
  statCardIcon: { position: 'absolute', top: 12, right: 14, fontSize: 20, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))' },
  statCardBody: { padding: '1.1rem 1.3rem 1.4rem' },
  statCardValue: { fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 30, color: BRAND, lineHeight: 1.1 },
  statCardLabel: { fontSize: 13, fontWeight: 600, color: '#fff', marginTop: 4 },
  statCardDesc: { fontSize: 12, color: 'rgba(255,255,255,0.42)', marginTop: 6, lineHeight: 1.55 },

  /* FEATURES */
  featuresSection: { padding: 'clamp(3rem,7vw,5.5rem) clamp(1.25rem,4vw,2.5rem)', background: DARK_2 },
  eyebrow: { fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: BRAND, letterSpacing: '0.15em', textTransform: 'uppercase', textAlign: 'center', marginBottom: '0.6rem' },
  h2: { fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(24px,3.6vw,38px)', textAlign: 'center', letterSpacing: '-0.02em', color: '#eef5f0', marginBottom: '2.75rem' },
  featuresGrid: { display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 20, maxWidth: 980, margin: '0 auto' },
  featCard: { position: 'relative', borderRadius: 20, overflow: 'hidden', height: 300 },
  featImg: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' },
  featOverlay: { position: 'absolute', inset: 0, background: `linear-gradient(0deg, ${DARK_2} 8%, rgba(15,43,29,0.45) 55%, rgba(15,43,29,0.15) 100%)` },
  featBody: { position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '1.5rem' },
  featTag: { fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, color: BRAND, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 },
  featTitle: { fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 19, color: '#fff', marginBottom: 6 },
  featDesc: { fontSize: 12.5, color: 'rgba(255,255,255,0.72)', lineHeight: 1.6, maxWidth: 340, marginBottom: 10 },
  featLink: { fontSize: 12, color: BRAND, fontFamily: "'JetBrains Mono',monospace" },

  /* WHY CHOOSE */
  whySection: { padding: 'clamp(3rem,7vw,5.5rem) clamp(1.25rem,4vw,2.5rem)', background: CREAM },
  whyGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 32, maxWidth: 1000, margin: '0 auto' },
  whyCol: { textAlign: 'center', padding: '0 1rem' },
  whyIcon: { width: 56, height: 56, borderRadius: 14, background: 'rgba(23,77,46,0.08)', border: `1px solid rgba(23,77,46,0.16)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 1rem' },
  whyTitle: { fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 17, color: DARK_2, marginBottom: 8 },
  whyDesc: { fontSize: 13.5, color: '#4a5d52', lineHeight: 1.65 },

  /* DASHBOARD MOCKUP */
  dashSection: { padding: 'clamp(3rem,7vw,5.5rem) clamp(1.25rem,4vw,2.5rem)', background: DARK_2, textAlign: 'center' },
  laptop: { maxWidth: 820, margin: '0 auto' },
  laptopScreen: { background: '#0a1712', borderRadius: '16px 16px 0 0', border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none', boxShadow: '0 30px 70px rgba(0,0,0,0.45)', textAlign: 'left', overflow: 'hidden' },
  laptopBar: { display: 'flex', gap: 6, padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  dot: { width: 9, height: 9, borderRadius: '50%' },
  laptopBody: { padding: 'clamp(1rem,3vw,1.75rem)' },
  mockStatsRow: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 18 },
  mockStat: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '12px 10px', textAlign: 'center' },
  mockStatVal: { fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18 },
  mockStatLabel: { fontSize: 10.5, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  mockChartRow: { display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 12 },
  mockChart: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '14px 16px' },
  mockChartLabel: { fontSize: 10.5, color: 'rgba(255,255,255,0.45)', fontFamily: "'JetBrains Mono',monospace" },
  laptopBase: { height: 16, background: 'linear-gradient(180deg, #1a2b22, #0d1712)', borderRadius: '0 0 10px 10px', boxShadow: '0 10px 24px rgba(0,0,0,0.4)' },

  /* TESTIMONIALS */
  testiSection: { padding: 'clamp(3rem,7vw,5.5rem) clamp(1.25rem,4vw,2.5rem)', background: DARK_1, textAlign: 'center' },
  testiCard: { maxWidth: 620, margin: '0 auto', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 'clamp(1.75rem,4vw,2.5rem)' },
  testiStars: { color: GOLD, fontSize: 16, letterSpacing: 3, marginBottom: 14 },
  testiQuote: { fontSize: 'clamp(15px,2vw,18px)', color: '#f1f7f3', lineHeight: 1.7, marginBottom: 18, fontStyle: 'italic' },
  testiName: { fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14.5, color: '#fff' },
  testiLoc: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2, marginBottom: 18 },
  testiDots: { display: 'flex', justifyContent: 'center', gap: 7 },
  testiDotBtn: { width: 7, height: 7, borderRadius: '50%', border: 'none', cursor: 'pointer' },

  /* GALLERY */
  gallerySection: { padding: 'clamp(3rem,7vw,5.5rem) clamp(1.25rem,4vw,2.5rem)', background: DARK_2 },
  masonry: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gridAutoRows: 162, gap: 14, maxWidth: 1100, margin: '0 auto' },
  galleryItem: { position: 'relative', borderRadius: 14, overflow: 'hidden' },
  galleryImg: { width: '100%', height: '100%', objectFit: 'cover' },
  galleryOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: '10px 12px', fontSize: 11.5, color: '#fff', background: 'linear-gradient(0deg, rgba(0,0,0,0.65), transparent)' },

  /* CTA */
  ctaSection: { position: 'relative', padding: 'clamp(4rem,9vw,6.5rem) 2rem', textAlign: 'center', overflow: 'hidden' },
  ctaBg: { position: 'absolute', inset: 0, zIndex: 0 },
  ctaOverlay: { position: 'absolute', inset: 0, zIndex: 1, background: `linear-gradient(180deg, rgba(10,26,17,0.86), rgba(15,43,29,0.92))` },
  ctaContent: { position: 'relative', zIndex: 2, maxWidth: 640, margin: '0 auto' },
  ctaTitle: { fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(26px,4.4vw,44px)', color: '#fff', letterSpacing: '-0.02em', marginBottom: 14, lineHeight: 1.12 },
  ctaSub: { fontSize: 14.5, color: 'rgba(255,255,255,0.62)', lineHeight: 1.65, marginBottom: 28 },

  /* FOOTER */
  footer: { background: '#0a1712', padding: 'clamp(2.5rem,5vw,3.5rem) clamp(1.25rem,4vw,2.5rem) 1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' },
  footerGrid: { display: 'grid', gridTemplateColumns: '1.6fr repeat(4,1fr)', gap: 28, maxWidth: 1200, margin: '0 auto 2.5rem' },
  footerBrandCol: { display: 'flex', flexDirection: 'column', gap: 10 },
  footerTagline: { fontSize: 12.5, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, maxWidth: 220 },
  footerSocial: { display: 'flex', gap: 8, marginTop: 4 },
  socialDot: { width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, color: 'rgba(255,255,255,0.6)' },
  footerCol: { display: 'flex', flexDirection: 'column', gap: 10 },
  footerColTitle: { fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 12.5, color: '#fff', letterSpacing: '0.03em', marginBottom: 2 },
  footerLink: { fontSize: 12.5, color: 'rgba(255,255,255,0.42)' },
  newsletterRow: { display: 'flex', gap: 6, marginTop: 4 },
  newsletterInput: { flex: 1, minWidth: 0, padding: '9px 11px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 12.5 },
  newsletterBtn: { width: 36, borderRadius: 8, border: 'none', background: BRAND, color: '#041209', fontWeight: 700, cursor: 'pointer' },
  footerBottom: { maxWidth: 1200, margin: '0 auto', paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, fontSize: 11.5, color: 'rgba(255,255,255,0.32)', fontFamily: "'JetBrains Mono',monospace" },
}