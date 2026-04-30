import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { MapPin, Shield, LogOut, AlertTriangle, CheckCircle, Clock, Activity } from 'lucide-react'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

const severityConfig = (s) => {
  if (s >= 4) return { label: 'Critical', color: 'text-red-400', bg: 'bg-red-500/10' }
  if (s >= 3) return { label: 'High', color: 'text-orange-400', bg: 'bg-orange-500/10' }
  if (s >= 2) return { label: 'Moderate', color: 'text-yellow-400', bg: 'bg-yellow-500/10' }
  return { label: 'Low', color: 'text-green-400', bg: 'bg-green-500/10' }
}

const typeEmoji = (t) => {
  const map = {
    pothole: '🕳️', garbage: '🗑️', waterlogging: '🌊',
    streetlight: '💡', sewage: '🚰', tree: '🌳', other: '⚠️'
  }
  return map[t] || '⚠️'
}

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = () => {
    setLoading(true)
    setError('')
    setTimeout(() => {
      if (email === 'admin@fixmycity.com' && password === 'fixmycity@123') {
        onLogin()
      } else {
        setError('Invalid credentials')
      }
      setLoading(false)
    }, 800)
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-[#0d1117]"
      style={{
        backgroundImage: `radial-gradient(ellipse at 50% 50%, #1a0a0a 0%, #0d1117 70%)`,
      }}
    >
      <div className="w-full max-w-sm mx-4">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="bg-red-600 p-2 rounded-xl">
            <MapPin size={20} className="text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-2xl">
              Fix<span className="text-red-500">My</span>City
            </span>
            <p className="text-white/30 text-[10px] tracking-widest uppercase">Admin Portal</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#0d1117] border border-[#1e2433] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Shield size={16} className="text-white/40" />
            <h2 className="text-white font-bold">Admin Login</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-white/40 text-xs uppercase tracking-wider mb-1.5 block">
                Username
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter username"
                className="w-full bg-[#1a2235] border border-[#2a3447] focus:border-blue-500/50 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 outline-none transition-colors"
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>

            <div>
              <label className="text-white/40 text-xs uppercase tracking-wider mb-1.5 block">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-[#1a2235] border border-[#2a3447] focus:border-blue-500/50 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 outline-none transition-colors"
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>

            {error && (
              <p className="text-red-400 text-xs text-center">{error}</p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 bg-[#1a2235] hover:bg-[#243050] border border-[#2a3447] text-white/60 hover:text-white py-3 rounded-xl text-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleLogin}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-all"
              >
                {loading ? '...' : 'Login'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Dashboard({ onLogout }) {
  const [issues, setIssues] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchIssues()
    const interval = setInterval(fetchIssues, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchIssues = async () => {
    const { data } = await supabase
      .from('issues')
      .select('*')
      .order('priority_score', { ascending: false })
    if (data) setIssues(data)
    setLoading(false)
  }

  const updateStatus = async (id, status) => {
    await supabase
      .from('issues')
      .update({
        status,
        last_updated: new Date().toISOString(),
        ...(status === 'resolved' ? { resolved_at: new Date().toISOString() } : {})
      })
      .eq('id', id)
    fetchIssues()
  }

  const filtered = filter === 'all'
    ? issues
    : issues.filter(i => i.status === filter)

  const total = issues.length
  const pending = issues.filter(i => i.status === 'reported').length
  const inProgress = issues.filter(i => i.status === 'in-progress').length
  const resolved = issues.filter(i => i.status === 'resolved').length

  const getDays = (created_at) =>
    Math.floor((Date.now() - new Date(created_at)) / 86400000)

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col">

      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 h-[60px] bg-[#0d1117] border-b border-[#1e2433] flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-red-600 p-1.5 rounded-lg">
            <MapPin size={16} className="text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-lg">
              Fix<span className="text-red-500">My</span>City
            </span>
            <span className="text-white/30 text-xs ml-2">Admin</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#1a2235] px-3 py-1.5 rounded-full border border-[#2a3447]">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-400 text-xs">Live</span>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors"
          >
            <LogOut size={15} />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-auto">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Issues', value: total, color: 'text-white', icon: Activity },
            { label: 'Pending', value: pending, color: 'text-red-400', icon: AlertTriangle },
            { label: 'In Progress', value: inProgress, color: 'text-blue-400', icon: Clock },
            { label: 'Resolved', value: resolved, color: 'text-green-400', icon: CheckCircle },
          ].map(stat => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="bg-[#0d1117] border border-[#1e2433] rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-white/40 text-xs">{stat.label}</p>
                  <Icon size={14} className={stat.color} />
                </div>
                <p className={`font-bold text-3xl ${stat.color}`}>{stat.value}</p>
              </div>
            )
          })}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4">
          {['all', 'reported', 'in-progress', 'resolved'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all border ${
                filter === f
                  ? 'bg-red-600 border-red-600 text-white'
                  : 'bg-[#1a2235] border-[#2a3447] text-white/40 hover:text-white'
              }`}
            >
              {f === 'all' ? 'All' :
               f === 'in-progress' ? 'In Progress' :
               f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Issues Table */}
        <div className="bg-[#0d1117] border border-[#1e2433] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e2433]">
                  {['Type', 'Ward', 'Reports', 'Severity', 'Days', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-white/30 text-xs uppercase tracking-wider font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-white/20">
                      Loading issues...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-white/20">
                      No issues found
                    </td>
                  </tr>
                ) : filtered.map(issue => {
                  const sev = severityConfig(issue.severity)
                  const days = getDays(issue.created_at)
                  return (
                    <tr key={issue.id} className="border-b border-[#1e2433] hover:bg-[#1a2235]/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span>{typeEmoji(issue.type)}</span>
                          <span className="text-white/70 text-sm capitalize">{issue.type}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white/50 text-sm">{issue.ward}</td>
                      <td className="px-4 py-3 text-white font-bold text-sm">{issue.report_count}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${sev.bg} ${sev.color}`}>
                          {sev.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-medium ${days > 30 ? 'text-red-400' : days > 7 ? 'text-orange-400' : 'text-white/50'}`}>
                          {days}d
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          issue.status === 'resolved' ? 'bg-green-500/10 text-green-400' :
                          issue.status === 'in-progress' ? 'bg-blue-500/10 text-blue-400' :
                          'bg-red-500/10 text-red-400'
                        }`}>
                          {issue.status === 'in-progress' ? 'In Progress' :
                           issue.status === 'resolved' ? 'Resolved' : 'Reported'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateStatus(issue.id, 'in-progress')}
                            disabled={issue.status === 'in-progress' || issue.status === 'resolved'}
                            className="text-xs px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            In Progress
                          </button>
                          <button
                            onClick={() => updateStatus(issue.id, 'resolved')}
                            disabled={issue.status === 'resolved'}
                            className="text-xs px-2 py-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            Resolve
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}

function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  if (!isLoggedIn) {
    return <LoginScreen onLogin={() => setIsLoggedIn(true)} />
  }

  return <Dashboard onLogout={() => setIsLoggedIn(false)} />
}

export default AdminDashboard