import React, { useState, useEffect } from 'react'
import { Save, Download, Trash2, Check, X } from 'lucide-react'

const STORAGE_KEY = 'bisinif_outcome_sets'

export default function OutcomeSetManager({ currentOutcomes, currentQuestions, onLoad }) {
  const [sets, setSets] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveName, setSaveName] = useState('')

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setSets(JSON.parse(stored))
    } catch (e) {
      console.error('Failed to load outcome sets', e)
    }
  }, [])

  const saveSets = (newSets) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSets))
      setSets(newSets)
    } catch (e) {
      console.error('Failed to save outcome sets', e)
    }
  }

  const handleSaveCurrent = () => {
    if (!saveName.trim()) return
    const newSet = {
      id: Date.now().toString(),
      name: saveName.trim(),
      outcomes: currentOutcomes,
      questions: currentQuestions,
      date: new Date().toISOString()
    }
    saveSets([...sets, newSet])
    setSaveName('')
    setIsSaving(false)
  }

  const handleDelete = (id, e) => {
    e.stopPropagation()
    if (window.confirm('Bu kazanım setini silmek istediğinize emin misiniz?')) {
      saveSets(sets.filter(s => s.id !== id))
    }
  }

  const handleLoad = (set) => {
    if (window.confirm(`"${set.name}" seti yüklenecek. Mevcut sorularınızın üzerine yazılacaktır. Onaylıyor musunuz?`)) {
      onLoad({ questions: set.questions, outcomes: set.outcomes })
      setIsOpen(false)
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded transition-colors"
      >
        <Save className="w-3.5 h-3.5" />
        Kazanım Setleri
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-slate-200 shadow-xl rounded-xl z-50 overflow-hidden flex flex-col p-2 animate-in fade-in zoom-in-95 duration-100">
            
            {/* Save Form */}
            {isSaving ? (
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 mb-2">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Şu anki seti kaydet</div>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="Örn: 9. Sınıf Mat 1"
                    className="flex-1 h-7 px-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-blue-500"
                    autoFocus
                  />
                  <button onClick={handleSaveCurrent} className="h-7 w-7 flex items-center justify-center bg-blue-600 text-white rounded hover:bg-blue-700">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setIsSaving(false)} className="h-7 w-7 flex items-center justify-center bg-slate-200 text-slate-600 rounded hover:bg-slate-300">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsSaving(true)}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-md transition-colors mb-1"
              >
                <Save className="w-3.5 h-3.5" />
                Şu Anki Seti Kaydet
              </button>
            )}

            {/* List */}
            {sets.length > 0 ? (
              <div className="max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 divide-y divide-slate-100 border-t border-slate-100 pt-1">
                {sets.map(set => (
                  <div key={set.id} className="flex items-center justify-between group hover:bg-slate-50 rounded-md px-2 py-1.5 cursor-pointer" onClick={() => handleLoad(set)}>
                    <div className="overflow-hidden">
                      <div className="text-xs font-semibold text-slate-700 truncate">{set.name}</div>
                      <div className="text-[10px] text-slate-400">{set.questions?.length || 0} Soru • {set.outcomes?.length || 0} Kazanım</div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => handleDelete(set.id, e)} className="p-1 text-slate-400 hover:text-red-600 rounded" title="Sil">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1 text-blue-600 rounded" title="Yükle">
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center border-t border-slate-100">
                <div className="text-[10px] text-slate-400">Henüz kaydedilmiş kazanım seti yok.</div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
