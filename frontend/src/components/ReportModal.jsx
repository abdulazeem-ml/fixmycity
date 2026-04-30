import { useState } from 'react'
import { X, Upload, MapPin, MessageCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

const ISSUE_TYPES = [
  { value: 'pothole', label: 'Pothole', emoji: '🕳️' },
  { value: 'garbage', label: 'Garbage', emoji: '🗑️' },
  { value: 'waterlogging', label: 'Flooding', emoji: '🌊' },
  { value: 'streetlight', label: 'Streetlight', emoji: '💡' },
  { value: 'sewage', label: 'Sewage', emoji: '🚰' },
  { value: 'tree', label: 'Fallen Tree', emoji: '🌳' },
  { value: 'manhole', label: 'Manhole', emoji: '⚠️' },
  { value: 'footpath', label: 'Footpath', emoji: '🚧' },
  { value: 'other', label: 'Other', emoji: '📍' },
]

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function ReportModal({ onClose }) {
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState(null)
  const [type, setType] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handlePhoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPhoto(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async () => {
    if (!photo || !type) return
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('image', photo)
      formData.append('type', type)
      formData.append('description', description)
      formData.append('lat', '12.3375')
      formData.append('lng', '76.6394')
      await axios.post(`${API_URL}/api/report`, formData)
      setSuccess(true)
      setTimeout(() => onClose(), 2000)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full md:w-[500px] bg-[#0d1117] rounded-t-2xl md:rounded-2xl border border-[#1e2433] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2433]">
            <div>
              <h2 className="text-white font-bold">Report a Civic Issue</h2>
              <p className="text-white/30 text-xs mt-0.5">Help fix your city</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/30 hover:text-white p-1.5 hover:bg-white/5 rounded-lg transition-all"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {success ? (
              <div className="text-center py-10">
                <div className="text-6xl mb-4">✅</div>
                <p className="text-white font-bold text-lg">Report Submitted!</p>
                <p className="text-white/40 text-sm mt-1">
                  Thank you for helping fix your city
                </p>
              </div>
            ) : (
              <>
                {/* WhatsApp preferred */}
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex items-center gap-3">
                  <MessageCircle size={20} className="text-green-400 flex-shrink-0" />
                  <div>
                    <p className="text-green-400 text-sm font-medium">
                      Preferred: Report via WhatsApp
                    </p>
                    <p className="text-white/40 text-xs mt-0.5">
                      Send photo + location to{' '}
                      <span className="text-green-400 font-mono">+1-415-523-8886</span>
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-[#1e2433]" />
                  <span className="text-white/20 text-xs">or report here</span>
                  <div className="flex-1 h-px bg-[#1e2433]" />
                </div>

                {/* Photo upload */}
                <div>
                  <label className="text-white/40 text-xs uppercase tracking-wider mb-2 block">
                    Photo *
                  </label>
                  <label className="cursor-pointer block">
                    <div className={`w-full h-36 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all ${
                      preview
                        ? 'border-transparent'
                        : 'border-[#2a3447] hover:border-red-500/50'
                    }`}>
                      {preview ? (
                        <img
                          src={preview}
                          alt="preview"
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-white/20">
                          <Upload size={24} />
                          <span className="text-xs">Tap to upload photo</span>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhoto}
                    />
                  </label>
                </div>

                {/* Issue type */}
                <div>
                  <label className="text-white/40 text-xs uppercase tracking-wider mb-2 block">
                    Issue Type *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {ISSUE_TYPES.map(t => (
                      <button
                        key={t.value}
                        onClick={() => setType(t.value)}
                        className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl border transition-all duration-150 ${
                          type === t.value
                            ? 'border-red-500 bg-red-500/10 text-white'
                            : 'border-[#2a3447] bg-[#1a2235] text-white/40 hover:border-[#3a4457]'
                        }`}
                      >
                        <span className="text-lg">{t.emoji}</span>
                        <span className="text-[10px]">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-white/40 text-xs uppercase tracking-wider mb-2 block">
                    Description (optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Briefly describe the issue..."
                    rows={2}
                    className="w-full bg-[#1a2235] border border-[#2a3447] rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 resize-none focus:outline-none focus:border-red-500/50 transition-colors"
                  />
                </div>

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={!photo || !type || loading}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-[#1a2235] disabled:text-white/20 text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="animate-spin text-lg">⏳</span>
                  ) : (
                    <>
                      <MapPin size={16} />
                      Submit Report
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default ReportModal