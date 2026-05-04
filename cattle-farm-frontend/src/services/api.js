import axios from 'axios'

export const BASE_URL = 'http://localhost:8000'  // ← ADD THIS LINE

const api = axios.create({
  baseURL: BASE_URL,                             // ← change from import.meta.env...
  timeout: 30000,                                // ← change from 15000
  headers: { 'Content-Type': 'application/json' },
})
// ── Module 1 — Health ────────────────────────────────────────
export const healthAPI = {
  getCattle:      ()       => api.get('/api/health/cattle'),
  createCattle:   (data)   => api.post('/api/health/cattle', data),
  predict:        (data)   => api.post('/api/health/predict', data),
  getRecords:     (id)     => api.get(`/api/health/records/${id}`),
  getAlerts:      ()       => api.get('/api/health/alerts'),
  getDashboard:   ()       => api.get('/api/health/dashboard-stats'),
}

// ── Module 2 — Vet ───────────────────────────────────────────
export const vetAPI = {
  firstAid:          (data) => api.post('/api/vet/first-aid', data),
  getNearbyVets:     (lat, lng) => api.get(`/api/vet/map?lat=${lat}&lng=${lng}`),
  savePrescription:  (id, data) => api.post(`/api/vet/prescription/${id}`, data),
  getConsultations:  ()     => api.get('/api/vet/consultations'),
  getVideoToken:     (room) => api.get(`/api/vet/video-token/${room}`),
}

// ── Module 3 — Milk ──────────────────────────────────────────
export const milkAPI = {
  runTest:   (data) => api.post('/api/milk/test', data),
  getTests:  ()     => api.get('/api/milk/tests'),
  getStats:  ()     => api.get('/api/milk/stats'),
  certUrl:   (id)   => `${api.defaults.baseURL}/api/milk/certificate/${id}`,
}

// ── Module 4 — Finance ───────────────────────────────────────
export const financeAPI = {
  recordSale:      (data)   => api.post('/api/finance/milk-sale', data),
  recordExpense:   (data)   => api.post('/api/finance/expense', data),
  getLedger:       ()       => api.get('/api/finance/ledger'),
  getPLReport:     (y, m)   => api.get(`/api/finance/pl-report?year=${y}&month=${m}`),
  getAnimalRank:   ()       => api.get('/api/finance/animal-ranking'),
  getForecast:     ()       => api.get('/api/finance/price-forecast'),
  getDashboard:    ()       => api.get('/api/finance/dashboard'),
  getBuyers:       ()       => api.get('/api/finance/buyers'),
  addBuyer:        (data)   => api.post('/api/finance/buyers', data),
}

export default api