import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Map from './components/Map'
import DetailPanel from './components/DetailPanel'
import ReportModal from './components/ReportModal'
import TopBar from './components/TopBar'
import LeftSidebar from './components/LeftSidebar'
import RightPanel from './components/RightPanel'
import AdminDashboard from './pages/AdminDashboard'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

function MapPage() {
  const [selectedIssue, setSelectedIssue] = useState(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all')
  const [showHeatmap, setShowHeatmap] = useState(true)
  const [showMarkers, setShowMarkers] = useState(true)
  const [issues, setIssues] = useState([])
  const [selectedCity, setSelectedCity] = useState({ lat: 12.2958, lng: 76.6394, name: 'Mysuru' })
  const [selectedCityCoords, setSelectedCityCoords] = useState({ lat: 12.3375, lng: 76.6394, radius: 30000 })
  const [currentCity, setCurrentCity] = useState('Mysuru, Karnataka')

  useEffect(() => {
    fetchIssues()
    const interval = setInterval(fetchIssues, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchIssues = async () => {
    const { data } = await supabase
      .from('issues')
      .select('*')
      .neq('status', 'resolved')
      .order('priority_score', { ascending: false })
    if (data) setIssues(data)
  }

  const handleCityChange = (lat, lng, cityName, stateName) => {
    setSelectedCity({ lat, lng, name: cityName })
    setCurrentCity(`${cityName}, ${stateName}`)
    setSelectedCityCoords({ lat, lng, radius: 30000 })
  }

  const filteredIssues = activeFilter === 'all'
    ? issues
    : issues.filter(i => i.type === activeFilter)

  const filterByCity = (issuesList, coords) => {
    const toRad = (value) => value * Math.PI / 180
    const earthRadius = 6371000 // meters
    const { lat: centerLat, lng: centerLng, radius } = coords

    return issuesList.filter((issue) => {
      if (issue.lat == null || issue.lng == null) return false
      const dLat = toRad(issue.lat - centerLat)
      const dLng = toRad(issue.lng - centerLng)
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(centerLat)) * Math.cos(toRad(issue.lat)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      const distance = earthRadius * c
      return distance <= radius
    })
  }

  const cityIssues = filterByCity(filteredIssues, selectedCityCoords)

  return (
    <div className="flex flex-col w-screen h-screen bg-[#0d1117] overflow-hidden">

      {/* Top Bar */}
      <TopBar
        cityName={currentCity}
        onAdminClick={() => window.location.href = '/admin'}
        issues={issues}
        onCityChange={handleCityChange}
      />

      {/* Mobile filter pills */}
      <div className="lg:hidden flex gap-2 overflow-x-auto px-3 py-2 bg-[#0d1117] border-b border-[#1e2433] scrollbar-hide">
        {['all','pothole','garbage','waterlogging','streetlight','sewage'].map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`flex-shrink-0 rounded-full text-xs py-1 px-2.5 font-medium border transition-all ${
              activeFilter === f
                ? 'bg-red-600 border-red-600 text-white'
                : 'bg-black/40 border-white/20 text-white/60 backdrop-blur'
            }`}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left Sidebar — hidden on mobile */}
        <div className="hidden lg:flex">
          <LeftSidebar
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            showHeatmap={showHeatmap}
            setShowHeatmap={setShowHeatmap}
            showMarkers={showMarkers}
            setShowMarkers={setShowMarkers}
            issues={cityIssues}
            onCityChange={handleCityChange}
          />
        </div>

        {/* Map — center */}
        <div className="relative flex-1 pb-0">
          <Map
            onIssueClick={setSelectedIssue}
            activeFilter={activeFilter}
            showHeatmap={showHeatmap}
            showMarkers={showMarkers}
            issues={filteredIssues}
            selectedCity={selectedCity}
          />

          {/* Report button — desktop */}
          <button
            onClick={() => setShowReportModal(true)}
            className="hidden lg:flex absolute bottom-8 right-4 z-40 bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-3 rounded-full shadow-lg shadow-red-900/50 transition-all duration-200 items-center gap-2"
          >
            <span>📍</span> Report Issue
          </button>
        </div>

        {/* Right Panel — hidden on mobile */}
        <div className="hidden lg:flex">
          <RightPanel
            issues={cityIssues}
            onIssueClick={setSelectedIssue}
          />
        </div>

      </div>

      {/* Detail Panel */}
      {selectedIssue && (
        <DetailPanel
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
        />
      )}

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal onClose={() => setShowReportModal(false)} />
      )}

    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App