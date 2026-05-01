import { useRef } from 'react'
import { X, Share2 } from 'lucide-react'

function PressureCard({ issue, onClose }) {
  const cardRef = useRef(null)

  const days = Math.floor(
    (Date.now() - new Date(issue.created_at)) / 86400000
  )

  const typeEmoji = (t) => {
    const map = {
      pothole: '🕳️', garbage: '🗑️', waterlogging: '🌊',
      streetlight: '💡', sewage: '🚰', tree: '🌳', other: '⚠️'
    }
    return map[t] || '⚠️'
  }

  const shareText = `🚨 CIVIC ALERT — ${issue.ward?.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━
${typeEmoji(issue.type)} Type: ${issue.type?.toUpperCase()}
🔢 Reports: ${issue.report_count} citizens
📅 Unresolved: ${days} DAYS
🏛️ Responsible: ${issue.authority}
━━━━━━━━━━━━━━━━━━━━
View on map: fixmycity-gamma.vercel.app

Share this. Tag your local authority.
#FixMyCity #CivicIssue #${issue.ward?.replace(/\s/g, '')}`

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'FixMyCity — Civic Alert',
        text: shareText,
        url: 'https://fixmycity-gamma.vercel.app'
      })
    } else {
      await navigator.clipboard.writeText(shareText)
      alert('Copied to clipboard! Paste and share.')
    }
  }

  const handleWhatsAppShare = () => {
    const encoded = encodeURIComponent(shareText)
    window.open(`https://wa.me/?text=${encoded}`, '_blank')
  }

  const handleTwitterShare = () => {
    const tweet = `🚨 ${issue.report_count} citizens reported a ${issue.type} at ${issue.ward} — ${days} days ignored by ${issue.authority}. #FixMyCity`
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`, '_blank')
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div ref={cardRef} className="bg-[#0d1117] border border-red-500/30 rounded-2xl overflow-hidden">
          <div className="bg-red-600 px-5 py-4">
            <div className="flex items-center justify-between">
              <span className="text-white font-black text-lg tracking-wider">🚨 CIVIC ALERT</span>
              <button onClick={onClose} className="text-white/70 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <p className="text-white/80 text-sm mt-0.5">FixMyCity — Public Issue Report</p>
          </div>

          <div className="px-5 py-1 bg-red-900/20">
            <p className="text-red-400 text-xs tracking-widest">━━━━━━━━━━━━━━━━━━━━</p>
          </div>

          <div className="px-5 py-4 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{typeEmoji(issue.type)}</span>
              <div>
                <p className="text-white font-bold capitalize text-lg">{issue.type}</p>
                <p className="text-white/50 text-sm">{issue.ward}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
                <p className="text-red-400 font-black text-3xl">{days}</p>
                <p className="text-red-400/70 text-xs">DAYS IGNORED</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                <p className="text-white font-black text-3xl">{issue.report_count}</p>
                <p className="text-white/40 text-xs">CITIZENS REPORTED</p>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Responsible Authority</p>
              <p className="text-white font-semibold">🏛️ {issue.authority}</p>
            </div>

            <div className="px-1">
              <p className="text-red-400/60 text-xs tracking-widest">━━━━━━━━━━━━━━━━━━━━</p>
            </div>

            <p className="text-white/30 text-xs text-center">fixmycity-gamma.vercel.app</p>
          </div>

          <div className="px-5 pb-5 space-y-2">
            <p className="text-white/30 text-xs text-center mb-3">Share this. Create pressure. Demand action.</p>

            <button
              onClick={handleWhatsAppShare}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              💬 Share on WhatsApp
            </button>

            <button
              onClick={handleTwitterShare}
              className="w-full bg-[#1a8cd8] hover:bg-[#1a7bc4] text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              🐦 Share on Twitter
            </button>

            <button
              onClick={handleShare}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <Share2 size={15} />
              Copy & Share
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PressureCard
