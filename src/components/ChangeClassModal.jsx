import React, { useState, useEffect } from 'react'
import { GraduationCap, AlertTriangle, ArrowRight, X } from 'lucide-react'

const gradeLevels = [
  '5. Sınıf',
  '6. Sınıf',
  '7. Sınıf',
  '8. Sınıf',
  '9. Sınıf',
  '10. Sınıf',
  '11. Sınıf',
  '12. Sınıf',
]

const classSections = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

export default function ChangeClassModal({
  isOpen,
  onClose,
  currentGradeLevel,
  currentClassSection,
  onConfirm,
  onNewAnalysis
}) {
  const [gradeLevel, setGradeLevel] = useState(currentGradeLevel || '')
  const [classSection, setClassSection] = useState(currentClassSection || '')

  // Reset local state when modal opens
  useEffect(() => {
    if (isOpen) {
      setGradeLevel(currentGradeLevel || '')
      setClassSection(currentClassSection || '')
    }
  }, [isOpen, currentGradeLevel, currentClassSection])

  if (!isOpen) return null

  const isSameClass = gradeLevel === currentGradeLevel && classSection === currentClassSection
  const isValid = gradeLevel !== ''

  const handleConfirm = () => {
    if (isValid && !isSameClass) {
      onConfirm({ gradeLevel, classSection })
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-xl z-[101] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <GraduationCap className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Sınıfı Değiştir</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Info Alert */}
          <div className="flex items-center gap-3 bg-blue-50/50 border border-blue-100 rounded-xl px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-blue-100/50 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-blue-600" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[13px] font-medium text-slate-700">Sınav kurulumu <span className="font-bold text-blue-700">korunur</span>.</p>
              <p className="text-[13px] font-medium text-slate-700">Öğrenci listesi ve notlar <span className="font-bold text-blue-700">sıfırlanır</span>.</p>
            </div>
          </div>

          {/* Form */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Hedef Sınıf</label>
              <div className="relative">
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="w-full h-11 pl-3.5 pr-8 text-[13px] font-medium bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all appearance-none cursor-pointer"
                >
                  <option value="" disabled>Seçiniz...</option>
                  {gradeLevels.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Hedef Şube</label>
              <div className="relative">
                <select
                  value={classSection}
                  onChange={(e) => setClassSection(e.target.value)}
                  className="w-full h-11 pl-3.5 pr-8 text-[13px] font-medium bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all appearance-none cursor-pointer"
                >
                  <option value="">Şubesiz / Seçiniz...</option>
                  {classSections.map((section) => (
                    <option key={section} value={section}>{section} Şubesi</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex gap-3 items-center justify-end">
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
            >
              İptal
            </button>
            <button
              onClick={handleConfirm}
              disabled={isSameClass || !isValid}
              className={`flex-1 sm:flex-none px-5 py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                isSameClass || !isValid
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
              }`}
            >
              Yeni Sınıfa Geç
            </button>
          </div>
        </div>

      </div>
    </>
  )
}
