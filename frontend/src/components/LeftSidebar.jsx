import { useState } from 'react'
import { Layers, Activity } from 'lucide-react'

const ISSUE_TYPES = [
  { value: 'all', label: 'All Issues', emoji: '🗺️', color: 'bg-blue-500' },
  { value: 'pothole', label: 'Potholes', emoji: '🕳️', color: 'bg-red-500' },
  { value: 'garbage', label: 'Garbage', emoji: '🗑️', color: 'bg-orange-500' },
  { value: 'waterlogging', label: 'Flooding', emoji: '🌊', color: 'bg-blue-400' },
  { value: 'streetlight', label: 'Streetlights', emoji: '💡', color: 'bg-yellow-500' },
  { value: 'sewage', label: 'Sewage', emoji: '🚰', color: 'bg-purple-500' },
  { value: 'tree', label: 'Fallen Tree', emoji: '🌳', color: 'bg-green-500' },
  { value: 'other', label: 'Other', emoji: '⚠️', color: 'bg-gray-500' },
]

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
      { name: 'Surat', lat: 21.1702, lng: 72.8311 },
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
      { name: 'Ludhiana', lat: 30.9010, lng: 75.8573 },
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

function LeftSidebar({
  activeFilter, setActiveFilter,
  showHeatmap, setShowHeatmap,
  showMarkers, setShowMarkers,
  issues,
  onCityChange
}) {
  const [selectedState, setSelectedState] = useState('Karnataka')
  const [selectedCity, setSelectedCity] = useState('Mysuru')

  const getCount = (type) => {
    if (type === 'all') return issues.length
    return issues.filter(i => i.type === type).length
  }

  const resolvedToday = 0
  const avgResponse = '4.2h'
  const activeZones = issues.filter(i => i.report_count >= 12).length
  const reportsToday = issues.length

  const handleStateChange = (state) => {
    setSelectedState(state)
    const firstCity = STATES_AND_CITIES[state].cities[0]
    setSelectedCity(firstCity.name)
    if (onCityChange) {
      onCityChange(firstCity.lat, firstCity.lng, firstCity.name, state)
    }
  }

  const handleCityChange = (cityName) => {
    setSelectedCity(cityName)
    const city = STATES_AND_CITIES[selectedState].cities.find(c => c.name === cityName)
    if (city && onCityChange) {
      onCityChange(city.lat, city.lng, city.name, selectedState)
    }
  }

  return (
    <div className="w-[220px] h-full bg-[#0d1117] border-r border-[#1e2433] flex flex-col overflow-y-auto">

      {/* State/City */}
      <div className="p-4 border-b border-[#1e2433]">
        <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">State</p>
        <select
          value={selectedState}
          onChange={(e) => handleStateChange(e.target.value)}
          className="w-full bg-[#1a2235] border border-[#2a3447] rounded-lg px-3 py-2 text-white/80 text-sm mb-3 focus:outline-none focus:border-red-500 transition-colors cursor-pointer"
        >
          {Object.keys(STATES_AND_CITIES).map(state => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
        <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">City</p>
        <select
          value={selectedCity}
          onChange={(e) => handleCityChange(e.target.value)}
          className="w-full bg-[#1a2235] border border-[#2a3447] rounded-lg px-3 py-2 text-white/80 text-sm focus:outline-none focus:border-red-500 transition-colors cursor-pointer"
        >
          {STATES_AND_CITIES[selectedState].cities.map(city => (
            <option key={city.name} value={city.name}>
              {city.name}
            </option>
          ))}
        </select>
      </div>

      {/* Issue Types */}
      <div className="p-4 border-b border-[#1e2433]">
        <p className="text-white/30 text-[10px] uppercase tracking-widest mb-3">Issue Types</p>
        <div className="space-y-1">
          {ISSUE_TYPES.map(type => (
            <button
              key={type.value}
              onClick={() => setActiveFilter(type.value)}
              className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg transition-all duration-150 ${
                activeFilter === type.value
                  ? 'bg-[#1a2235] border border-[#2a3447]'
                  : 'hover:bg-[#1a2235]/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${type.color}`} />
                <span className="text-white/70 text-xs">{type.label}</span>
              </div>
              <span className="text-white/40 text-xs">{getCount(type.value)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Layers */}
      <div className="p-4 border-b border-[#1e2433]">
        <div className="flex items-center gap-2 mb-3">
          <Layers size={12} className="text-white/30" />
          <p className="text-white/30 text-[10px] uppercase tracking-widest">Layers</p>
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showHeatmap}
              onChange={e => setShowHeatmap(e.target.checked)}
              className="accent-red-500"
            />
            <span className="text-white/60 text-xs">Heatmap</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showMarkers}
              onChange={e => setShowMarkers(e.target.checked)}
              className="accent-red-500"
            />
            <span className="text-white/60 text-xs">Markers</span>
          </label>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity size={12} className="text-white/30" />
          <p className="text-white/30 text-[10px] uppercase tracking-widest">Quick Stats</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-white/50 text-xs">Resolved today</span>
            <span className="text-green-400 text-xs font-medium">{resolvedToday}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/50 text-xs">Avg response</span>
            <span className="text-orange-400 text-xs font-medium">{avgResponse}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/50 text-xs">Active zones</span>
            <span className="text-blue-400 text-xs font-medium">{activeZones}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/50 text-xs">Total issues</span>
            <span className="text-red-400 text-xs font-medium">+{reportsToday}</span>
          </div>
        </div>
      </div>

    </div>
  )
}

export default LeftSidebar