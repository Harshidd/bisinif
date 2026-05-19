import React, { useState, useEffect } from 'react'
import { Save, Download, Trash2, Check, X, Users } from 'lucide-react'

const STORAGE_KEY = 'bisinif_class_templates'

export default function ClassTemplateManager({ currentStudents, onLoad }) {
  const [templates, setTemplates] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveName, setSaveName] = useState('')

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setTemplates(JSON.parse(stored))
    } catch (e) {
      console.error('Failed to load class templates', e)
    }
  }, [])

  const saveTemplates = (newTemplates) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newTemplates))
      setTemplates(newTemplates)
    } catch (e) {
      console.error('Failed to save class templates', e)
    }
  }

  const handleSaveCurrent = () => {
    if (!saveName.trim()) return
    if (!currentStudents || currentStudents.length === 0) {
      alert("Şablon olarak kaydedilecek öğrenci yok.")
      setIsSaving(false)
      return
    }

    const cleanStudents = currentStudents.map(s => ({
      no: s.no || s.studentNumber || '',
      name: s.name || s.fullName || '',
      siraNo: s.siraNo
    }))

    const newTemplate = {
      id: Date.now().toString(),
      name: saveName.trim(),
      students: cleanStudents,
      date: new Date().toISOString()
    }
    
    // Check for overwrite
    const existingIndex = templates.findIndex(t => t.name.toLowerCase() === newTemplate.name.toLowerCase())
    if (existingIndex !== -1) {
       if (!window.confirm(`"${newTemplate.name}" adında bir şablon zaten var. Üzerine yazılsın mı?`)) {
          return
       }
       const updated = [...templates]
       updated[existingIndex] = newTemplate
       saveTemplates(updated)
    } else {
       saveTemplates([...templates, newTemplate])
    }
    
    setSaveName('')
    setIsSaving(false)
  }

  const handleDelete = (id, e) => {
    e.stopPropagation()
    if (window.confirm('Bu sınıf şablonunu silmek istediğinize emin misiniz?')) {
      saveTemplates(templates.filter(t => t.id !== id))
    }
  }

  const handleLoad = (template) => {
    if (window.confirm(`"${template.name}" şablonu yüklenecek.\n\nMEVCUT ÖĞRENCİ LİSTESİ VE NOTLAR SIFIRLANACAK.\n(Sınav omurgası korunur.)\n\nOnaylıyor musunuz?`)) {
      // Create fresh IDs for loaded students
      const freshStudents = (template.students || []).map((s, idx) => ({
        id: `template-${Date.now()}-${idx}`,
        siraNo: s.siraNo || (idx + 1).toString(),
        no: s.no || '',
        studentNumber: s.no || '',
        name: s.name || '',
        fullName: s.name || ''
      }))
      onLoad(freshStudents)
      setIsOpen(false)
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
        title="Öğrenci Listesini Kaydet veya Yükle"
      >
        <Users className="w-3.5 h-3.5" />
        <span className="hidden md:inline">Listeyi Kaydet / Yükle</span>
        <span className="md:hidden">Liste İşlemleri</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 shadow-xl rounded-xl z-50 overflow-hidden flex flex-col p-2 animate-in fade-in zoom-in-95 duration-100">
            
            {/* Save Form */}
            {isSaving ? (
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 mb-2">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Mevcut Listeyi Kaydet</div>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="Örn: 9A Fizik"
                    className="flex-1 h-7 px-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-blue-500"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveCurrent()}
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
                className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-md transition-colors mb-1"
              >
                <Save className="w-3.5 h-3.5" />
                Mevcut Listeyi Kaydet
              </button>
            )}

            {/* List */}
            {templates.length > 0 ? (
              <div className="max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 divide-y divide-slate-100 border-t border-slate-100 pt-1">
                {templates.map(template => (
                  <div key={template.id} className="flex items-center justify-between group hover:bg-slate-50 rounded-md px-2 py-1.5 cursor-pointer" onClick={() => handleLoad(template)}>
                    <div className="overflow-hidden">
                      <div className="text-xs font-semibold text-slate-700 truncate">{template.name}</div>
                      <div className="text-[10px] text-slate-400">{template.students?.length || 0} Öğrenci</div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => handleDelete(template.id, e)} className="p-1 text-slate-400 hover:text-red-600 rounded" title="Sil">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1 text-emerald-600 rounded" title="Yükle">
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center border-t border-slate-100">
                <div className="text-[10px] text-slate-400">Henüz kaydedilmiş sınıf listesi yok.</div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
