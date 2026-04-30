import { useEffect, useState } from 'react'
import { MapPin, Shield, Menu, X } from 'lucide-react'

const STATES_AND_CITIES = {
  'Karnataka': {
    cities: [
      { name: 'Mysuru', lat: 12.2958, lng: 76.6394 },
      { name: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
      { name: 'Hubli', lat: 15.3647, lng: 75.1240 },
      { name: 'Mangalore', lat: 12.8628, lng: 74.8607 },
      { name: 'Belagavi', lat: 15.8497, lng: 74.4977 },
    ]
  },
  'Maharashtra': {
    cities: [
      { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
      { name: 'Pune', lat: 18.5204, lng: 73.8567 },
      { name: 'Nagpur', lat: 21.1458, lng: 79.0882 },
      { name: 'Nashik', lat: 19.9975, lng: 73.7898 },
    ]
  },
  'Tamil Nadu': {
    cities: [
      { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
      { name: 'Coimbatore', lat: 11.0081, lng: 76.9958 },
      { name: 'Madurai', lat: 9.9252, lng: 78.1198 },
      { name: 'Salem', lat: 11.6643, lng: 78.1460 },
    ]
  },
  'Telangana': {
    cities: [
      { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
      { name: 'Warangal', lat: 17.9689, lng: 79.5941 },
      { name: 'Karimnagar', lat: 18.4386, lng: 78.1343 },
    ]
  },
  'Andhra Pradesh': {
    cities: [
      { name: 'Visakhapatnam', lat: 17.6869, lng: 83.2185 },
      { name: 'Vijayawada', lat: 16.5062, lng: 80.6480 },
      { name: 'Tirupati', lat: 13.2198, lng: 79.8250 },
    ]
  },
  'Kerala': {
    cities: [
      { name: 'Kochi', lat: 9.9312, lng: 76.2673 },
      { name: 'Thiruvananthapuram', lat: 8.5241, lng: 76.9366 },
      { name: 'Kozhikode', lat: 11.2588, lng: 75.7804 },
    ]
  },
  'Gujarat': {
    cities: [
      { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
      { name: 'Surat', lat: 21.1702, lng: 72.8313 },
      { name: 'Vadodara', lat: 22.3072, lng: 73.1812 },
      { name: 'Rajkot', lat: 22.3039, lng: 70.8022 },
    ]
  },
  'Rajasthan': {
    cities: [
      { name: 'Jaipur', lat: 26.9124, lng: 75.7873 },
      { name: 'Jodhpur', lat: 26.2389, lng: 73.0243 },
      { name: 'Udaipur', lat: 24.5854, lng: 73.7125 },
      { name: 'Kota', lat: 25.2138, lng: 75.8648 },
    ]
  },
  'Uttar Pradesh': {
    cities: [
      { name: 'Lucknow', lat: 26.8467, lng: 80.9462 },
      { name: 'Kanpur', lat: 26.4499, lng: 80.3319 },
      { name: 'Agra', lat: 27.1767, lng: 78.0081 },
      { name: 'Varanasi', lat: 25.3200, lng: 82.9789 },
    ]
  },
  'Delhi': {
    cities: [
      { name: 'New Delhi', lat: 28.6139, lng: 77.2090 },
      { name: 'Dwarka', lat: 28.5921, lng: 77.0460 },
      { name: 'Noida', lat: 28.5721, lng: 77.3560 },
    ]
  },
  'West Bengal': {
    cities: [
      { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
      { name: 'Howrah', lat: 22.5958, lng: 88.2636 },
      { name: 'Durgapur', lat: 23.1815, lng: 87.3129 },
    ]
  },
  'Punjab': {
    cities: [
      { name: 'Amritsar', lat: 31.6340, lng: 74.8723 },
      { name: 'Ludhiana', lat: 30.9010, lng: 75.8577 },
      { name: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
    ]
  },
  'Madhya Pradesh': {
    cities: [
      { name: 'Bhopal', lat: 23.1815, lng: 79.9864 },
      { name: 'Indore', lat: 22.7196, lng: 75.8577 },
      { name: 'Gwalior', lat: 26.2389, lng: 78.1937 },
    ]
  },
}

function TopBar({ cityName, onAdminClick, onCityChange, issues = [] }) {
  const now = new Date()
  const timeStr = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })

  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedState, setSelectedState] = useState(() => {
    const [city, state] = cityName.split(',').map(item => item.trim())
    return state && STATES_AND_CITIES[state] ? state : 'Karnataka'
  })
  const [selectedCity, setSelectedCity] = useState(() => {
    const [city] = cityName.split(',').map(item => item.trim())
    return city || 'Mysuru'
  })

  useEffect(() => {
    const [city, state] = cityName.split(',').map(item => item.trim())
    if (state && STATES_AND_CITIES[state]) {
      setSelectedState(state)
      setSelectedCity(city)
    }
  }, [cityName])

  const cityOptions = STATES_AND_CITIES[selectedState]?.cities || []
  const currentCity = cityOptions.find(c => c.name === selectedCity) || cityOptions[0]
  const totalIssues = issues.length
  const criticalCount = issues.filter(i => i.severity >= 4).length

  const handleGoToCity = () => {
    if (!currentCity) return
    onCityChange(currentCity.lat, currentCity.lng, currentCity.name, selectedState)
    setMenuOpen(false)
  }

  return (
    <>
      <div className="flex items-center justify-between px-4 h-[60px] bg-[#0d1117] border-b border-[#1e2433] z-50 flex-shrink-0">

        <div className="flex items-center gap-2">
          <div className="bg-red-600 p-1.5 rounded-lg">
            <MapPin size={16} className="text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-lg tracking-tight">
              Fix<span className="text-red-500">My</span>City
            </span>
            <p className="text-white/30 text-[10px] leading-none tracking-widest uppercase">
              Real-time Civic Intelligence
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-2 bg-[#1a2235] px-4 py-1.5 rounded-full border border-[#2a3447]">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-400 text-xs font-medium">Live</span>
          </div>
          <div className="flex items-center gap-2 bg-[#1a2235] px-4 py-1.5 rounded-full border border-[#2a3447]">
            <span className="text-white/70 text-xs">📍 {cityName}</span>
          </div>
          <span className="text-white/30 text-xs font-mono">{timeStr}</span>
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <a
            href="https://wa.me/14155238886"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 border border-green-700 text-white px-3 py-1.5 rounded-lg text-sm transition-all duration-200"
          >
            <span>💬</span>
            <span>WhatsApp</span>
          </a>

          <button
            onClick={onAdminClick}
            className="flex items-center gap-2 bg-[#1a2235] hover:bg-[#243050] border border-[#2a3447] hover:border-blue-500/50 text-white/70 hover:text-white px-3 py-1.5 rounded-lg text-sm transition-all duration-200"
          >
            <Shield size={14} />
            <span>Admin</span>
          </button>
        </div>

        <div className="flex lg:hidden items-center gap-3">
          <button
            onClick={() => setMenuOpen(true)}
            className="flex items-center justify-center p-2 rounded-lg bg-[#1a2235] border border-[#2a3447] text-white/80 hover:text-white"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-[#0d1117] text-white overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-4 border-b border-[#1e2433]">
            <div className="flex items-center gap-2">
              <div className="bg-red-600 p-1.5 rounded-lg">
                <MapPin size={16} className="text-white" />
              </div>
              <span className="text-white font-bold text-lg tracking-tight">
                Fix<span className="text-red-500">My</span>City
              </span>
            </div>
            <button
              onClick={() => setMenuOpen(false)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6 px-4 py-5">
            <div className="space-y-3">
              <p className="text-white/40 text-[10px] uppercase tracking-widest">Select Location</p>
              <div className="space-y-4">
                <div>
                  <label className="text-white/70 text-[11px] uppercase tracking-widest mb-2 block">State</label>
                  <select
                    value={selectedState}
                    onChange={(e) => {
                      const nextState = e.target.value
                      setSelectedState(nextState)
                      const firstCity = STATES_AND_CITIES[nextState]?.cities[0]
                      if (firstCity) setSelectedCity(firstCity.name)
                    }}
                    className="w-full bg-[#1a2235] border border-[#2a3447] rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500"
                  >
                    {Object.keys(STATES_AND_CITIES).map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-white/70 text-[11px] uppercase tracking-widest mb-2 block">City</label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full bg-[#1a2235] border border-[#2a3447] rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500"
                  >
                    {cityOptions.map((city) => (
                      <option key={city.name} value={city.name}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={handleGoToCity}
                className="w-full rounded-2xl bg-red-600 hover:bg-red-700 px-4 py-3 text-sm font-semibold text-white"
              >
                Go to City
              </button>
            </div>

            <div className="rounded-3xl border border-green-500/20 bg-green-900/20 p-5 space-y-3">
              <p className="text-sm font-semibold text-white">Report via WhatsApp</p>
              <ol className="list-decimal list-inside space-y-1 text-white/70 text-sm">
                <li>Open WhatsApp</li>
                <li>Send photo of the issue</li>
                <li>Share your live location</li>
                <li>Add a description like "pothole" or "garbage"</li>
              </ol>
              <p className="text-white/80 text-sm">Number: +1-415-523-8886</p>
              <a
                href="https://wa.me/14155238886"
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full justify-center rounded-2xl bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700"
              >
                Open WhatsApp
              </a>
            </div>

            <div className="rounded-3xl border border-[#2a3447] bg-[#111827] p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="bg-[#1e2433] p-3 rounded-2xl">
                  <Shield size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold">Admin Dashboard</p>
                  <p className="text-white/50 text-sm">Manage and resolve civic issues</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setMenuOpen(false)
                  onAdminClick()
                }}
                className="w-full rounded-2xl bg-[#1a2235] border border-[#2a3447] px-4 py-3 text-sm font-semibold text-white hover:bg-[#242f43]"
              >
                Login as Admin
              </button>
            </div>

            <div className="rounded-3xl border border-[#2a3447] bg-[#111827] p-5 space-y-3">
              <p className="text-sm font-semibold text-white">Quick Stats</p>
              <div className="space-y-2 text-sm text-white/70">
                <div className="flex items-center justify-between">
                  <span>Total issues</span>
                  <span className="text-white">{totalIssues}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Critical</span>
                  <span className="text-red-400">{criticalCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Selected city</span>
                  <span className="text-white/80">{cityName}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default TopBar