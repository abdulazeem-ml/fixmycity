import { TrendingUp } from 'lucide-react'

const severityColor = (s) => {
  if (s >= 4) return 'text-red-400'
  if (s >= 3) return 'text-orange-400'
  if (s >= 2) return 'text-yellow-400'
  return 'text-green-400'
}

const severityLabel = (s) => {
  if (s >= 4) return 'Critical'
  if (s >= 3) return 'High'
  if (s >= 2) return 'Moderate'
  return 'Minor'
}

const statusColor = (s) => {
  if (s === 'resolved') return 'bg-green-500/20 text-green-400'
  if (s === 'in-progress') return 'bg-blue-500/20 text-blue-400'
  return 'bg-red-500/20 text-red-400'
}

const typeEmoji = (t) => {
  const map = {
    pothole: '🕳️', garbage: '🗑️', waterlogging: '🌊',
    streetlight: '💡', sewage: '🚰', tree: '🌳', other: '⚠️'
  }
  return map[t] || '⚠️'
}

function RightPanel({ issues, onIssueClick }) {
  const total = issues.length
  const critical = issues.filter(i => i.severity >= 4).length
  const moderate = issues.filter(i => i.severity === 2 || i.severity === 3).length
  const minor = issues.filter(i => i.severity === 1).length

  // Worst roads — top 5 by report count
  const worstRoads = [...issues]
    .sort((a, b) => b.report_count - a.report_count)
    .slice(0, 5)

  // Recent issues — last 5 by created_at
  const recent = [...issues]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5)

  const maxCount = worstRoads[0]?.report_count || 1

  return (
    <div className="w-[280px] h-full bg-[#0d1117] border-l border-[#1e2433] flex flex-col overflow-y-auto">

      {/* Overview */}
      <div className="p-4 border-b border-[#1e2433]">
        <p className="text-white/30 text-[10px] uppercase tracking-widest mb-3">Overview</p>

        {/* Total */}
        <div className="mb-3">
          <div className="flex items-end gap-2">
            <span className="text-white font-bold text-4xl">{total}</span>
            <span className="text-green-400 text-xs mb-1.5">
              Active reports
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#1a2235] rounded-lg p-2 text-center">
            <p className="text-red-400 font-bold text-lg">{critical}</p>
            <p className="text-white/30 text-[10px]">Critical</p>
          </div>
          <div className="bg-[#1a2235] rounded-lg p-2 text-center">
            <p className="text-orange-400 font-bold text-lg">{moderate}</p>
            <p className="text-white/30 text-[10px]">Moderate</p>
          </div>
          <div className="bg-[#1a2235] rounded-lg p-2 text-center">
            <p className="text-green-400 font-bold text-lg">{minor}</p>
            <p className="text-white/30 text-[10px]">Minor</p>
          </div>
        </div>
      </div>

      {/* Worst Roads */}
      <div className="p-4 border-b border-[#1e2433]">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={12} className="text-white/30" />
          <p className="text-white/30 text-[10px] uppercase tracking-widest">Worst Areas</p>
        </div>
        <div className="space-y-2">
          {worstRoads.map((issue, i) => (
            <div
              key={issue.id}
              className="flex items-center gap-2 cursor-pointer hover:bg-[#1a2235] rounded-lg p-1 transition-all"
              onClick={() => onIssueClick(issue)}
            >
              <span className="text-white/20 text-xs w-4">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white/70 text-xs truncate">{issue.ward}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="flex-1 bg-[#1e2433] rounded-full h-1">
                    <div
                      className={`h-1 rounded-full ${
                        i === 0 ? 'bg-red-500' :
                        i === 1 ? 'bg-orange-500' :
                        i === 2 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${(issue.report_count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              <span className="text-white/40 text-xs">{issue.report_count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Issues */}
      <div className="p-4">
        <p className="text-white/30 text-[10px] uppercase tracking-widest mb-3">Recent</p>
        <div className="space-y-2">
          {recent.map(issue => (
            <div
              key={issue.id}
              className="cursor-pointer hover:bg-[#1a2235] rounded-lg p-2 transition-all border border-transparent hover:border-[#2a3447]"
              onClick={() => onIssueClick(issue)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{typeEmoji(issue.type)}</span>
                  <p className="text-white/70 text-xs font-medium capitalize">
                    {issue.type} issue
                  </p>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${statusColor(issue.status)}`}>
                  {issue.status === 'in-progress' ? 'In Progress' :
                   issue.status === 'resolved' ? 'Resolved' : 'Reported'}
                </span>
              </div>
              <p className="text-white/30 text-[10px] mt-0.5 ml-5">
                {issue.ward} · {issue.report_count} reports · 
                <span className={` ml-1 ${severityColor(issue.severity)}`}>
                  {severityLabel(issue.severity)}
                </span>
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

export default RightPanel