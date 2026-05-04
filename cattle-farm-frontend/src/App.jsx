import { Routes, Route } from 'react-router-dom'
import { Component } from 'react'
import Navbar from './components/Navbar'
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import Health from './pages/Health'
import Vet from './pages/Vet'
import Milk from './pages/Milk'
import Finance from './pages/Finance'

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '2rem', maxWidth: 600, margin: '4rem auto' }}>
          <p style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: 'var(--red)', letterSpacing: '0.1em', marginBottom: 8 }}>PAGE ERROR</p>
          <p className="font-display" style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>Something crashed on this page</p>
          <div className="card" style={{ padding: '1rem', marginBottom: 16 }}>
            <p style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: 'var(--red)' }}>
              {this.state.error.message}
            </p>
          </div>
          <button className="btn-primary" onClick={() => this.setState({ error: null })}>Try again</button>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  return (
    <Routes>
      {/* Landing page — no navbar/sidebar */}
      <Route path="/home" element={<LandingPage />} />

      {/* Dashboard app — with navbar + sidebar */}
      <Route path="/*" element={
        <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
          <Navbar />
          <main className="flex-1 lg:ml-60 min-h-screen overflow-x-hidden main-content">
            <ErrorBoundary>
              <Routes>
                <Route path="/"        element={<Dashboard />} />
                <Route path="/health"  element={<Health />} />
                <Route path="/vet"     element={<Vet />} />
                <Route path="/milk"    element={<Milk />} />
                <Route path="/finance" element={<Finance />} />
              </Routes>
            </ErrorBoundary>
          </main>
        </div>
      } />
    </Routes>
  )
}