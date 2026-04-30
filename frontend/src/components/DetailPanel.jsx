import { X, MapPin, AlertTriangle, Clock, Building2, Share2, Calendar } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const severityConfig = (s) => {
  if (s >= 4) return { label: 'Critical', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' }
  if (s >= 3) return { label: 'High', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' }
  if (s >= 2) return { label: 'Moderate', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' }
  return { label: 'Low', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' }
}

const typeEmoji = (t) => {
  const map = {
    pothole: '🕳️', garbage: '🗑️', waterlogging: '🌊',
    streetlight: '💡', sewage: '🚰', tree: '🌳', other: '⚠️'
  }
  return map[t] || '⚠️'
}

const statusConfig = (s) => {
  if (s === 'resolved') return { label: 'Resolved', color: 'text-green-400', bg: 'bg-green-500/10' }
  if (s === 'in-progress') return { label: 'In Progress', color: 'text-blue-400', bg: 'bg-blue-500/10' }
  return { label: 'Reported', color: 'text-red-400', bg: 'bg-red-500/10' }
}

function DetailPanel({ issue, onClose }) {
  const severity = severityConfig(issue.severity)
  const status = statusConfig(issue.status)
  const days = issue.days || Math.floor(
    (Date.now() - new Date(issue.created_at)) / 86400000
  )

  const handleShare = () => {
    const text = `🚨 Civic Issue Alert!\n\nType: ${issue.type}\nLocation: ${issue.ward}\nReports: ${issue.report_count}\nDays unresolved: ${days}\n\nReport via FixMyCity`
    if (navigator.share) {
      navigator.share({ title: 'FixMyCity Issue', text })
    } else {
      navigator.clipboard.writeText(text)
      alert('Copied to clipboard!')
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="absolute top-0 right-0 h-full w-full md:w-[360px] z-50 bg-[#0d1117] border-l border-[#1e2433] overflow-y-auto flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1e2433] flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{typeEmoji(issue.type)}</span>
            <div>
              <h2 className="text-white font-bold capitalize">{issue.type} Issue</h2>
              <p className="text-white/40 text-xs">{issue.ward || 'Unknown Area'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        {/* Image */}
        <div className="w-full h-44 bg-[#1a2235] flex items-center justify-center flex-shrink-0 border-b border-[#1e2433]">
          {issue.image_urls && issue.image_urls.length > 0 ? (
            <img
              src={issue.image_urls[0]}
              alt="Issue"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-white/20">
              <span className="text-4xl">{typeEmoji(issue.type)}</span>
              <span className="text-xs">No photo available</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="p-4 space-y-3 flex-1">

          {/* Days unresolved — hero stat */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
            <p className="text-red-400 font-black text-5xl">{days}</p>
            <p className="text-red-400/70 text-sm mt-1">DAYS UNRESOLVED</p>
          </div>

          {/* Report count + severity */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#1a2235] rounded-xl p-3 text-center border border-[#2a3447]">
              <p className="text-white font-bold text-2xl">{issue.report_count}</p>
              <p className="text-white/40 text-xs mt-0.5">Total Reports</p>
            </div>
            <div className={`rounded-xl p-3 text-center border ${severity.bg} ${severity.border}`}>
              <p className={`font-bold text-xl ${severity.color}`}>{severity.label}</p>
              <p className="text-white/40 text-xs mt-0.5">Severity</p>
            </div>
          </div>

          {/* Status */}
          <div className={`rounded-xl p-3 flex items-center justify-between border ${status.bg} border-white/5`}>
            <span className="text-white/50 text-sm">Current Status</span>
            <span className={`text-sm font-semibold ${status.color}`}>{status.label}</span>
          </div>

          {/* Location */}
          <div className="bg-[#1a2235] rounded-xl p-3 border border-[#2a3447]">
            <div className="flex items-center gap-2 mb-1">
              <MapPin size={14} className="text-white/30" />
              <span className="text-white/40 text-xs uppercase tracking-wider">Location</span>
            </div>
            <p className="text-white/70 text-sm">
              {issue.ward || 'Unknown Area'}
            </p>
            <p className="text-white/30 text-xs mt-0.5">
              {issue.lat?.toFixed(4)}, {issue.lng?.toFixed(4)}
            </p>
          </div>

          {/* Authority */}
          <div className="bg-[#1a2235] rounded-xl p-3 border border-[#2a3447]">
            <div className="flex items-center gap-2 mb-1">
              <Building2 size={14} className="text-white/30" />
              <span className="text-white/40 text-xs uppercase tracking-wider">Responsible Authority</span>
            </div>
            <p className="text-white/70 text-sm">
              {issue.authority || 'Mysuru City Corporation'}
            </p>
          </div>

          {/* Reported date */}
          <div className="bg-[#1a2235] rounded-xl p-3 border border-[#2a3447] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-white/30" />
              <span className="text-white/40 text-xs uppercase tracking-wider">Reported</span>
            </div>
            <span className="text-white/60 text-sm">
              {new Date(issue.created_at).toLocaleDateString('en-IN')}
            </span>
          </div>

          {/* WhatsApp report hint */}
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex items-center gap-3">
            <span className="text-2xl">💬</span>
            <div>
              <p className="text-green-400 text-xs font-medium">Know about this issue?</p>
              <p className="text-white/40 text-xs">Send photo to +1-415-523-8886</p>
            </div>
          </div>

          {/* Share button */}
          <button
            onClick={handleShare}
            className="w-full flex items-center justify-center gap-2 bg-[#1a2235] hover:bg-[#243050] border border-[#2a3447] text-white/60 hover:text-white py-3 rounded-xl transition-all duration-200 text-sm"
          >
            <Share2 size={15} />
            Share this Issue
          </button>

        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default DetailPanel