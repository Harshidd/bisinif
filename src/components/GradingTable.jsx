import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card'
import { Input } from './ui/Input'
import { Button } from './ui/Button'
import { Alert, AlertDescription } from './ui/Alert'
import { AlertTriangle, AlertCircle, Zap, Trash2, Plus, LayoutGrid, List, ClipboardList, X, Check } from 'lucide-react'
import { getLanguageProfile } from '../core/languageProfiles'

// Helper for integer-only distribution logic
// Strictly follows integer arithmetic to guarantee totals
const distributeIntegerTotal = (total, maxScores) => {
  // 1. Prepare integer capacities and target
  const caps = maxScores.map(m => Math.max(0, Math.floor(Number(m) || 0)))
  const target = Math.max(0, Math.floor(Number(total) || 0))
  const capSum = caps.reduce((a, b) => a + b, 0)

  // 2. Clamp target to global capacity
  const actualTarget = Math.min(target, capSum)
  const n = caps.length

  // Edge cases
  if (capSum === 0 || n === 0) return new Array(n).fill(0)

  // 3. Base allocation: equal split (floor)
  const base = Math.floor(actualTarget / n)
  const scores = new Array(n).fill(0)

  for (let i = 0; i < n; i++) {
    scores[i] = Math.min(base, caps[i])
  }

  // 4. Calculate what needs to be distributed conceptually
  let currentSum = scores.reduce((a, b) => a + b, 0)
  let remaining = actualTarget - currentSum

  // 5. Remainder allocation loop (deterministic round-robin)
  // Fill +1 into slots that still have capacity until remaining is gone
  // CHANGED: Distribute from END to START (preference to last questions)
  for (let i = n - 1; i >= 0 && remaining > 0; i--) {
    if (scores[i] < caps[i]) {
      scores[i]++
      remaining--
    }
  }

  // Double sweep from start if still remaining (rare logic fallback)
  if (remaining > 0) {
    for (let i = 0; i < n && remaining > 0; i++) {
      if (scores[i] < caps[i]) {
        scores[i]++
        remaining--
      }
    }
  }

  return scores
}

const GradingTable = ({ config, questions = [], students, grades: existingGrades, onGradesChange, onStudentUpdate, onDeleteStudent, onAddStudent, onClearStudentList, onResetGrades, onNewAnalysis, onNext, onBack, showNavigation = true, importerComponent }) => {
  const [grades, setGrades] = useState({})
  const [warnings, setWarnings] = useState({})
  const [totalInputWarnings, setTotalInputWarnings] = useState({})
  const [totalInputValues, setTotalInputValues] = useState({})
  const [viewMode, setViewMode] = useState('table') // 'table' or 'card'
  const [showClearMenu, setShowClearMenu] = useState(false)
  const [remedialStudent, setRemedialStudent] = useState(null)

  const isLanguage = config?.courseType === 'Dil Dersi'
  const langProfile = isLanguage ? getLanguageProfile(config.courseType, config.courseName) : null
  
  const displayQuestions = questions
  const maxWrittenScore = displayQuestions.reduce((sum, q) => sum + (Number(q.maxScore) || 0), 0) || 100
  const maxTotalScore = 100
  const generalPassingScore = config?.generalPassingScore ?? 50

  useEffect(() => {
    if (existingGrades && Object.keys(existingGrades).length > 0) {
      setGrades(existingGrades)
      return
    }

    const initialGrades = {}
    students.forEach((student) => {
      if (!initialGrades[student.id]) {
        initialGrades[student.id] = {}
      }
      displayQuestions.forEach((question) => {
        const key = question.qNo
        if (initialGrades[student.id][key] === undefined) {
          initialGrades[student.id][key] = ''
        }
      })
      if (config?.courseType === 'Dil Dersi') {
        if (initialGrades[student.id]['__dinleme'] === undefined) {
            initialGrades[student.id]['__dinleme'] = ''
        }
        if (initialGrades[student.id]['__konusma'] === undefined) {
            initialGrades[student.id]['__konusma'] = ''
        }
      }
    })
    setGrades(initialGrades)
  }, [students, displayQuestions, existingGrades, config?.courseType])
  const calculateWrittenTotal = (studentId) => {
    if (!grades[studentId]) return 0
    return displayQuestions.reduce((sum, question) => {
      const val = grades[studentId]?.[question.qNo]
      const num = Number(val)
      return sum + (Number.isFinite(num) ? num : 0)
    }, 0)
  }

  const calculateTotal = (studentId) => {
    if (!grades[studentId]) return 0
    const writtenTotal = calculateWrittenTotal(studentId)
    
    if (isLanguage) {
      // Normalize written total to 100 before weighting
      const writtenNormalized = maxWrittenScore > 0 ? (writtenTotal / maxWrittenScore) * 100 : 0
      const d = Number(grades[studentId]?.__dinleme) || 0
      const k = Number(grades[studentId]?.__konusma) || 0
      
      const w = langProfile.weights
      return Math.round(writtenNormalized * w.yazili + d * w.dinleme + k * w.konusma)
    }
    
    return writtenTotal
  }

  const classAverage = students.length > 0
    ? Math.round(students.reduce((sum, student) => sum + calculateTotal(student.id), 0) / students.length)
    : 0

  const handleGradeChange = (studentId, questionNo, maxScore, value) => {
    if (value === '' || value === null) {
      const newGrades = {
        ...grades,
        [studentId]: {
          ...grades[studentId],
          [questionNo]: '',
        },
      }
      setGrades(newGrades)
      onGradesChange(newGrades)
      setTotalInputValues(prev => {
        const newValues = { ...prev }
        delete newValues[studentId]
        return newValues
      })
      const newWarnings = { ...warnings }
      delete newWarnings[`${studentId}-${questionNo}`]
      setWarnings(newWarnings)
      return
    }

    let numValue = parseFloat(value)
    if (Number.isNaN(numValue)) numValue = 0
    const maxScoreForQuestion = Number(maxScore) || 0

    if (numValue < 0) numValue = 0
    if (numValue > maxScoreForQuestion) {
      numValue = maxScoreForQuestion
      setWarnings({
        ...warnings,
        [`${studentId}-${questionNo}`]: `Max ${maxScoreForQuestion}!`,
      })
    } else {
      const newWarnings = { ...warnings }
      delete newWarnings[`${studentId}-${questionNo}`]
      setWarnings(newWarnings)
    }

    const newGrades = {
      ...grades,
      [studentId]: {
        ...grades[studentId],
        [questionNo]: numValue,
      },
    }
    setGrades(newGrades)
    onGradesChange(newGrades)
    setTotalInputValues(prev => {
      const newValues = { ...prev }
      delete newValues[studentId]
      return newValues
    })
  }

  const handleTotalInputChange = (studentId, value) => {
    setTotalInputValues(prev => ({
      ...prev,
      [studentId]: value
    }))
    setTotalInputWarnings(prev => {
      const newWarnings = { ...prev }
      delete newWarnings[studentId]
      return newWarnings
    })
  }

  const handleTotalDistribute = (studentId) => {
    const value = totalInputValues[studentId]

    if (value === '' || value === null || value === undefined) {
      const newGrades = { ...grades }
      newGrades[studentId] = {}
      questions.forEach((question) => {
        newGrades[studentId][question.qNo] = ''
      })
      setGrades(newGrades)
      onGradesChange(newGrades)
      return
    }

    let numValue = parseFloat(value)
    if (Number.isNaN(numValue)) numValue = 0
    if (numValue < 0) numValue = 0

    const maxScores = displayQuestions.map(q => q.maxScore)
    const distributedScores = distributeIntegerTotal(numValue, maxScores)

    const newGrades = { ...grades }
    if (!newGrades[studentId]) newGrades[studentId] = {}

    displayQuestions.forEach((question, index) => {
      newGrades[studentId][question.qNo] = distributedScores[index]
    })

    if (numValue > maxTotalScore) {
      setTotalInputWarnings({
        ...totalInputWarnings,
        [studentId]: `Max ${maxTotalScore} puan! (${maxTotalScore} dağıtıldı)`
      })
      setTimeout(() => {
        setTotalInputWarnings(prev => {
          const w = { ...prev }
          delete w[studentId]
          return w
        })
      }, 3000)
    }

    setGrades(newGrades)
    onGradesChange(newGrades)
    setTotalInputValues(prev => {
      const newValues = { ...prev }
      delete newValues[studentId]
      return newValues
    })
  }

  const handleTotalKeyDown = (studentId, e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleTotalDistribute(studentId)
      e.target.blur()
    }
  }

  const handleFillAllWithMaxScore = () => {
    const newGrades = {}
    students.forEach((student) => {
      newGrades[student.id] = {}
      displayQuestions.forEach((question) => {
        const maxScore = Number(question.maxScore) || 0
        newGrades[student.id][question.qNo] = maxScore
      })
    })
    setGrades(newGrades)
    onGradesChange(newGrades)
    setWarnings({})
    setTotalInputWarnings({})
    setTotalInputValues({})
  }

  const getStatus = (total) => total >= generalPassingScore

  const getTotalColorClass = (total) => {
    if (total > maxTotalScore) return 'text-red-600 bg-red-100 animate-pulse'
    if (total >= generalPassingScore) return 'text-green-600 bg-green-50'
    if (total > 0) return 'text-blue-600 bg-blue-50'
    return 'text-gray-500 bg-gray-50'
  }

  const allGradesFilled = () => {
    return students.every((student) => {
      const writtenFilled = displayQuestions.every((question) => {
        const grade = grades[student.id]?.[question.qNo]
        return grade !== '' && grade !== undefined
      })
      if (!isLanguage) return writtenFilled
      
      const d = grades[student.id]?.__dinleme
      const k = grades[student.id]?.__konusma
      const skillsFilled = (d !== '' && d !== undefined) && (k !== '' && k !== undefined)
      return writtenFilled && skillsFilled
    })
  }

  const hasOverflow = () => {
    return students.some((student) => {
      const total = calculateTotal(student.id)
      return total > maxTotalScore + 0.01
    })
  }

  const getEmptyInputCount = () => {
    let count = 0
    students.forEach((student) => {
      displayQuestions.forEach((question) => {
        const grade = grades[student.id]?.[question.qNo]
        if (grade === '' || grade === undefined) count++
      })
      if (isLanguage) {
        if (grades[student.id]?.__dinleme === '' || grades[student.id]?.__dinleme === undefined) count++
        if (grades[student.id]?.__konusma === '' || grades[student.id]?.__konusma === undefined) count++
      }
    })
    return count
  }

  const getFilledStudentCount = () => {
    return students.filter((student) => {
      const writtenFilled = displayQuestions.every((question) => {
        const grade = grades[student.id]?.[question.qNo]
        return grade !== '' && grade !== undefined
      })
      if (!isLanguage) return writtenFilled
      
      const d = grades[student.id]?.__dinleme
      const k = grades[student.id]?.__konusma
      const skillsFilled = (d !== '' && d !== undefined) && (k !== '' && k !== undefined)
      return writtenFilled && skillsFilled
    }).length
  }

  const getTotalDisplayValue = (studentId) => {
    if (totalInputValues[studentId] !== undefined) {
      return totalInputValues[studentId]
    }
    const total = calculateTotal(studentId)
    return total > 0 ? Math.round(total) : ''
  }

  return (
    <div className="max-w-full mx-auto space-y-6">
      {hasOverflow() && (
        <Alert variant="destructive" className="mb-4 animate-pulse rounded-none border-x-0 border-t-0">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="font-bold">
            ⛔ HATA: Bazı öğrencilerin toplam puanı {maxTotalScore}'ü aşıyor! Lütfen tabloyu kontrol edin.
          </AlertDescription>
        </Alert>
      )}

      {/* Unified Grading Control Ribbon */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
        {/* Left side: View Mode & Grading Mode */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-white border border-slate-200 p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-slate-100 shadow-sm text-blue-700' : 'text-slate-400 hover:text-slate-600'}`}
              title="Tablo Görünümü"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('card')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'card' ? 'bg-slate-100 shadow-sm text-blue-700' : 'text-slate-400 hover:text-slate-600'}`}
              title="Mobil/Kart Görünümü"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Right side: Importer, Stats & Actions */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          {importerComponent && (
             <div className="shrink-0">
               {importerComponent}
             </div>
          )}
          
          <div className="flex items-center gap-3">
            <div className="hidden lg:block w-px h-5 bg-slate-300"></div>
            <div className="flex items-center gap-3 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm text-xs text-slate-600 shrink-0">
              <span>Ortalama: <strong className="text-slate-900">{Math.round(classAverage)}/{maxTotalScore}</strong></span>
              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
              <span>Kayıt: <strong className="text-slate-900">{students.length}</strong></span>
            </div>
            
            <Button 
              onClick={handleFillAllWithMaxScore} 
              variant="outline" 
              size="sm" 
              className="h-8 text-xs font-semibold border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-white shadow-sm shrink-0"
            >
              <Zap className="w-3.5 h-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Tümüne Tam Puan</span>
              <span className="sm:hidden">Tam Puan</span>
            </Button>

            {students.length > 0 && (
              <div className="relative">
                <Button
                  onClick={() => setShowClearMenu(!showClearMenu)}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-semibold border-red-200 text-red-600 hover:bg-red-50 bg-white shadow-sm shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">Temizle & Sıfırla</span>
                  <span className="sm:hidden">Temizle</span>
                </Button>

                {showClearMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-[90]" 
                      onClick={() => setShowClearMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 shadow-xl rounded-xl z-[100] overflow-hidden flex flex-col p-1 animate-in fade-in zoom-in-95 duration-100">
                      <button 
                        onClick={() => { 
                          if (window.confirm('Sadece girilen notlar silinecek. Emin misiniz?')) { 
                            onResetGrades && onResetGrades(); 
                            setShowClearMenu(false); 
                          }
                        }} 
                        className="text-left px-3 py-2.5 text-xs text-slate-700 hover:bg-slate-50 font-medium rounded-md w-full"
                      >
                        Sadece Notları Temizle
                      </button>
                      
                      {onClearStudentList && (
                        <button 
                          onClick={() => { 
                            if (window.confirm('Tüm öğrenci listesi ve girilen notlar silinecek. Sınav kurulumu korunacaktır. Emin misiniz?')) { 
                              onClearStudentList(); 
                              setShowClearMenu(false); 
                            }
                          }} 
                          className="text-left px-3 py-2.5 text-xs text-slate-700 hover:bg-slate-50 font-medium rounded-md w-full"
                        >
                          Sınıf Listesini Temizle
                        </button>
                      )}
                      
                      <div className="h-px bg-slate-100 my-1"></div>
                      
                      {onNewAnalysis && (
                        <button 
                          onClick={() => { 
                            if (window.confirm('TÜM çalışma (sınav ayarları, liste, notlar) sıfırlanacak. Başa dönülecek. Emin misiniz?')) { 
                              onNewAnalysis(); 
                              setShowClearMenu(false); 
                            }
                          }} 
                          className="text-left px-3 py-2.5 text-xs text-red-600 hover:bg-red-50 font-bold rounded-md w-full"
                        >
                          Tüm Çalışmayı Sıfırla
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="py-16 text-center bg-white border-t border-slate-100">
          <div className="text-slate-300 mb-3">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-slate-600">Sınıf Listesi Boş</h3>
          <p className="text-xs text-slate-400 mt-1">Lütfen üstteki araçtan listenizi yükleyiniz veya tekil öğrenci ekleyiniz.</p>
        </div>
      ) : (
        <>
          {/* Desktop/Responsive Table View - Compact & Sticky */}
          <div className={viewMode === 'table' ? 'block w-full' : 'hidden'}>
            {/* 
                Yatay ve Dikey Scroll konteyneri.
                max-h-[75vh] ile ekranın taşmasını engeller, scrollbar her zaman görünür olur.
            */}
            <div className="w-full overflow-auto rounded-xl border border-gray-100 bg-white shadow-sm max-h-[75vh] relative">
              <table className="table-fixed min-w-max border-collapse">
                <thead className="bg-gray-50 sticky top-0 z-40 shadow-sm">
                  <tr>
                    <th className="sticky left-0 z-50 bg-white px-2 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-12 min-w-[3rem] max-w-[3rem] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">#</th>
                    <th className="sticky z-50 bg-white px-2 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-[5rem] min-w-[5rem] max-w-[5rem] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" style={{ left: '3rem' }}>No</th>
                    <th className="sticky z-50 bg-white px-2 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-44 min-w-[11rem] max-w-[11rem] border-r border-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" style={{ left: '8rem' }}>Ad Soyad</th>

                    {displayQuestions.map((question) => {
                      const outcomeIndex = question.outcomeId !== '' && question.outcomeId !== undefined ? Number(question.outcomeId) : NaN
                      const outcomeLabel = Number.isFinite(outcomeIndex)
                        ? config?.outcomes?.[outcomeIndex]
                        : ''
                      return (
                        <th
                          key={question.qNo}
                          className="px-2 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wide text-center w-14 min-w-[3.5rem]"
                          title={outcomeLabel || ''}
                        >
                          <div>{question.label || `Q${question.qNo}`}</div>
                          <div className="text-[9px] font-normal text-gray-400 normal-case">({question.maxScore})</div>
                        </th>
                      )
                    })}

                    <th className="px-1 py-2 text-center text-[11px] font-semibold text-slate-700 uppercase tracking-wider w-16 min-w-[4rem] bg-slate-50 border-x border-slate-100">
                      <div>Yazılı</div>
                      <div className="text-[9px] font-normal text-slate-500 normal-case">(Top: {maxWrittenScore})</div>
                    </th>

                    {isLanguage && (
                      <>
                        <th className="px-1 py-2 text-center text-[11px] font-semibold text-blue-700 uppercase tracking-wider w-16 min-w-[4rem] bg-blue-50/50 border-r border-slate-100">
                          <div>Dinleme</div>
                          <div className="text-[9px] font-normal text-blue-500 normal-case">(max: 100)</div>
                        </th>
                        <th className="px-1 py-2 text-center text-[11px] font-semibold text-indigo-700 uppercase tracking-wider w-16 min-w-[4rem] bg-indigo-50/50 border-r border-slate-100">
                          <div>Konuşma</div>
                          <div className="text-[9px] font-normal text-indigo-500 normal-case">(max: 100)</div>
                        </th>
                      </>
                    )}

                    <th className="px-1 py-2 text-center text-[11px] font-semibold text-amber-700 uppercase tracking-wider w-16 min-w-[4rem] bg-amber-50">
                      <div>{isLanguage ? 'Final' : 'Toplam'}</div>
                      <div className="text-[9px] font-normal text-amber-600 normal-case">(max: 100)</div>
                    </th>
                    <th className="px-1 py-2 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wide w-12 min-w-[3rem] bg-gray-50 border-l border-gray-100">Telafi</th>
                    <th className="px-1 py-2 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wide w-10 min-w-[2.5rem] bg-gray-50 border-l border-gray-100">Sil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map((student) => {
                    const total = calculateTotal(student.id)
                    const isOverMax = total > maxTotalScore
                    const hasTotalWarning = totalInputWarnings[student.id]
                    const displayTotal = getTotalDisplayValue(student.id)

                    return (
                      <tr key={student.id} className="hover:bg-blue-50/50 transition-colors border-b border-slate-100 last:border-0 group">
                        <td className="sticky left-0 z-20 bg-white group-hover:bg-blue-50/50 px-1 py-1 text-[11px] font-semibold text-slate-400 text-center w-12 min-w-[3rem] max-w-[3rem] shadow-[1px_0_4px_-1px_rgba(0,0,0,0.05)] border-r border-slate-100">{student.siraNo}</td>
                        <td className="sticky z-20 bg-white group-hover:bg-blue-50/50 px-1 py-1 w-[5rem] min-w-[5rem] max-w-[5rem] shadow-[1px_0_4px_-1px_rgba(0,0,0,0.05)]" style={{ left: '3rem' }}>
                          <Input
                            type="text"
                            value={student.studentNumber || student.no || ''}
                            onChange={(e) => onStudentUpdate?.(student.id, { no: e.target.value, studentNumber: e.target.value })}
                            className="text-xs h-6 px-1 w-full text-center border-transparent hover:border-slate-300 focus:border-blue-500 bg-transparent"
                            placeholder="No"
                          />
                        </td>
                        <td className="sticky z-20 bg-white group-hover:bg-blue-50/50 px-1 py-1 w-44 min-w-[11rem] max-w-[11rem] border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" style={{ left: '8rem' }}>
                          <Input
                            type="text"
                            value={student.name || ''}
                            onChange={(e) => onStudentUpdate?.(student.id, { name: e.target.value })}
                            className="text-xs h-6 px-2 w-full font-medium border-transparent hover:border-slate-300 focus:border-blue-500 bg-transparent text-slate-800"
                            placeholder="Ad Soyad"
                          />
                        </td>

                        {displayQuestions.map((question) => {
                          const hasWarning = warnings[`${student.id}-${question.qNo}`]
                          const maxScoreForOutcome = question.maxScore

                          return (
                            <td key={question.qNo} className="px-1 py-1 text-center">
                                <Input
                                  type="number"
                                  min="0"
                                  max={maxScoreForOutcome}
                                  step="1"
                                  name={`q-${student.id}-${question.qNo}`}
                                  aria-label={`${question.label || 'Soru ' + question.qNo} notu, ${student.name}`}
                                  value={grades[student.id]?.[question.qNo] ?? ''}
                                  onChange={(e) =>
                                    handleGradeChange(student.id, question.qNo, maxScoreForOutcome, e.target.value)
                                  }
                                  className={`text-center text-[13px] font-medium py-0 w-12 min-w-[3rem] mx-auto h-6 px-0 border-transparent hover:border-slate-300 focus:border-blue-500 ${hasWarning ? 'bg-red-50 text-red-700' : 'bg-transparent text-slate-700'}`}
                                  title={`Max: ${maxScoreForOutcome}`}
                                />
                            </td>
                          )
                        })}

                        <td className="px-1 py-1 relative text-center bg-slate-50 font-bold text-slate-700 border-x border-slate-100 text-[13px]">
                          {isLanguage ? (
                            <>
                              <Input
                                type="number"
                                min="0"
                                max={maxWrittenScore}
                                step="1"
                                name={`written-total-${student.id}`}
                                aria-label={`Yazılı toplam not, ${student.name}`}
                                value={totalInputValues[student.id] !== undefined ? totalInputValues[student.id] : calculateWrittenTotal(student.id)}
                                onChange={(e) => handleTotalInputChange(student.id, e.target.value)}
                                onBlur={() => handleTotalDistribute(student.id)}
                                onKeyDown={(e) => handleTotalKeyDown(student.id, e)}
                                className={`text-center text-[13px] w-14 h-6 font-bold mx-auto px-1 ${totalInputWarnings[student.id]
                                  ? 'border-red-500 bg-red-100 text-red-700 animate-pulse'
                                  : 'border-slate-200 focus:border-slate-400 bg-transparent text-slate-700 hover:border-slate-300 transition-colors'
                                  }`}
                                title="Yazılı toplamı girip Enter'a basın"
                              />
                              {totalInputWarnings[student.id] && (
                                <div className="absolute -top-8 left-0 right-0 bg-red-600 text-white text-xs px-2 py-1 rounded z-10 whitespace-nowrap text-center shadow-md">
                                  {totalInputWarnings[student.id]}
                                </div>
                              )}
                            </>
                          ) : (
                            calculateWrittenTotal(student.id)
                          )}
                        </td>

                        {isLanguage && (
                          <>
                            <td className="px-1 py-1 text-center bg-blue-50/20 border-r border-slate-100">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={grades[student.id]?.__dinleme ?? ''}
                                onChange={(e) => handleGradeChange(student.id, '__dinleme', 100, e.target.value)}
                                className="text-center text-[13px] font-medium w-12 h-6 px-1 border-transparent focus:border-blue-400 bg-transparent text-blue-700"
                              />
                            </td>
                            <td className="px-1 py-1 text-center bg-indigo-50/20 border-r border-slate-100">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={grades[student.id]?.__konusma ?? ''}
                                onChange={(e) => handleGradeChange(student.id, '__konusma', 100, e.target.value)}
                                className="text-center text-[13px] font-medium w-12 h-6 px-1 border-transparent focus:border-indigo-400 bg-transparent text-indigo-700"
                              />
                            </td>
                          </>
                        )}

                        <td className="px-1 py-1 relative bg-amber-50/50 text-center">
                          {isLanguage ? (
                            <span className="text-center text-[14px] font-bold text-amber-900 block w-full px-1">
                              {calculateTotal(student.id)}
                            </span>
                          ) : (
                            <>
                              <Input
                                type="number"
                                min="0"
                                max={maxTotalScore}
                                step="1"
                                name={`total-${student.id}`}
                                aria-label={`Toplam not, ${student.name}`}
                                value={displayTotal}
                                onChange={(e) => handleTotalInputChange(student.id, e.target.value)}
                                onBlur={() => handleTotalDistribute(student.id)}
                                onKeyDown={(e) => handleTotalKeyDown(student.id, e)}
                                className={`text-center text-[13px] w-14 h-6 font-bold mx-auto px-1 ${hasTotalWarning
                                  ? 'border-red-500 bg-red-100 text-red-700 animate-pulse'
                                  : 'border-amber-200 focus:border-amber-500 text-amber-900 bg-white shadow-sm'
                                  }`}
                                title="Değer yazıp Enter'a basın veya kutudan çıkın"
                              />
                              {hasTotalWarning && (
                                <div className="absolute -top-8 left-0 right-0 bg-red-600 text-white text-xs px-2 py-1 rounded z-10 whitespace-nowrap text-center shadow-md">
                                  {hasTotalWarning}
                                </div>
                              )}
                            </>
                          )}
                        </td>

                        {/* Telafi Butonu */}
                        <td className="px-1 py-1 text-center bg-gray-50/50 border-l border-slate-100">
                          <div className="flex justify-center px-1">
                            <button
                              type="button"
                              onClick={() => setRemedialStudent(student)}
                              className={`flex items-center justify-center gap-1 w-full max-w-[4rem] px-1 py-1 text-[10px] font-medium rounded transition-all border ${(grades[student.id]?.__telafiSecimleri?.length > 0 || grades[student.id]?.__telafiNotu) ? 'border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100' : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 shadow-sm'}`}
                              title={((grades[student.id]?.__telafiSecimleri?.length > 0 || grades[student.id]?.__telafiNotu) ? 'Telafi notlarını düzenle' : 'Telafi çalışması ekle')}
                            >
                              <ClipboardList className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{(grades[student.id]?.__telafiSecimleri?.length > 0 || grades[student.id]?.__telafiNotu) ? 'Notlar' : 'Ekle'}</span>
                            </button>
                          </div>
                        </td>

                        {/* Silme Butonu */}
                        <td className="px-1 py-1 text-center bg-gray-50/50 border-l border-slate-100">
                          <button
                            type="button"
                            onClick={() => onDeleteStudent?.(student.id)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Öğrenciyi sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  {/* Yeni Öğrenci Ekle Satırı */}
                  {onAddStudent && (
                    <tr className="bg-slate-50/50 hover:bg-blue-50 transition-colors border-t border-slate-100">
                      <td colSpan={displayQuestions.length + 5} className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={onAddStudent}
                          className="inline-flex items-center gap-2 px-6 py-2 text-sm font-semibold text-blue-600 hover:text-blue-700 bg-white border border-blue-200 rounded-full shadow-sm hover:shadow-md transition-all active:scale-95"
                        >
                          <Plus className="w-4 h-4" />
                          Öğrenci Ekle
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className={viewMode === 'card' ? 'space-y-4' : 'hidden'}>
            {students.map((student) => {
              const total = calculateTotal(student.id)
              const isPassing = getStatus(total)
              const isOverMax = total > maxTotalScore
              const hasTotalWarning = totalInputWarnings[student.id]
              const displayTotal = getTotalDisplayValue(student.id)

              return (
                <Card key={student.id} className={`shadow-md ${isOverMax ? 'border-red-400 border-2' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500 font-mono">{student.siraNo}.</span>
                          <Input
                            type="text"
                            value={student.studentNumber || student.no || ''}
                            onChange={(e) => onStudentUpdate?.(student.id, { no: e.target.value, studentNumber: e.target.value })}
                            className="h-8 w-20 text-sm text-center"
                            placeholder="No"
                          />
                        </div>
                        <Input
                          type="text"
                          value={student.name || ''}
                          onChange={(e) => onStudentUpdate?.(student.id, { name: e.target.value })}
                          className="h-9 text-base font-medium"
                          placeholder="Ad Soyad"
                        />
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {isPassing ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm font-medium">
                            Geçti
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm font-medium">
                            Kaldı
                          </span>
                        )}
                          <button
                            type="button"
                            onClick={() => onDeleteStudent?.(student.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Öğrenciyi sil"
                          >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-amber-800">Toplam Puan</span>
                        <span className="text-sm text-amber-600">max: {maxTotalScore}</span>
                      </div>
                      <Input
                        type="number"
                        min="0"
                        max={maxTotalScore}
                        step="1"
                        name={`total-${student.id}-mobile`}
                        aria-label={`Toplam not, ${student.name}`}
                        value={displayTotal}
                        onChange={(e) => handleTotalInputChange(student.id, e.target.value)}
                        onBlur={() => handleTotalDistribute(student.id)}
                        onKeyDown={(e) => handleTotalKeyDown(student.id, e)}
                        className={`text-center text-xl font-bold bg-white ${hasTotalWarning ? 'border-red-500 bg-red-100' : 'border-amber-200 focus:border-amber-400'}`}
                        placeholder="Toplam girin"
                      />
                      {hasTotalWarning && (
                        <p className="text-xs text-red-600 mt-1 flex items-center">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {hasTotalWarning}
                        </p>
                      )}
                      <p className="text-xs text-amber-600 mt-1">
                        Değer yazıp Enter'a basın veya kutudan çıkın.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {displayQuestions.map((question) => {
                        const hasWarning = warnings[`${student.id}-${question.qNo}`]
                        const maxScoreForOutcome = question.maxScore

                        return (
                          <div key={question.qNo} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-medium">{question.label || `Q${question.qNo}`}</span>
                              <span className="text-gray-400">({maxScoreForOutcome})</span>
                            </div>
                            <Input
                              type="number"
                              min="0"
                              max={maxScoreForOutcome}
                              step="1"
                              name={`q-${student.id}-${question.qNo}-mobile`}
                              aria-label={`${question.label || 'Soru ' + question.qNo} notu, ${student.name}`}
                              value={grades[student.id]?.[question.qNo] ?? ''}
                              onChange={(e) =>
                                handleGradeChange(student.id, question.qNo, maxScoreForOutcome, e.target.value)
                              }
                              className={`text-center h-9 ${hasWarning ? 'border-red-500 bg-red-50' : ''
                                }`}
                              placeholder="0"
                            />
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {/* Mobile: Yeni Öğrenci Ekle Butonu */}
            {onAddStudent && (
              <Card className="shadow-md border-dashed border-2 border-blue-200 bg-blue-50/50">
                <CardContent className="py-4">
                  <button
                    type="button"
                    onClick={onAddStudent}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Yeni Öğrenci Ekle
                  </button>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="mt-4 p-4 bg-slate-100 rounded-lg">
            <div className="flex flex-wrap gap-4 justify-between items-center">
              <div className="text-sm text-gray-600">
                <strong>Geçme Puanı:</strong> {generalPassingScore} puan
              </div>
              <div className="flex gap-4 text-sm">
                <span className="text-green-600 font-medium">
                  ✓ {getFilledStudentCount()} öğrenci tamamlandı
                </span>
                {getEmptyInputCount() > 0 && (
                  <span className="text-amber-600 font-medium">
                    {getEmptyInputCount()} boş alan
                  </span>
                )}
              </div>
            </div>
          </div>

          {!allGradesFilled() && (
            <Alert className="m-4 bg-sky-50 border-sky-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-sky-600" />
              <AlertDescription className="text-sky-700 text-xs">
                Not: Analiz yapabilmek için tüm kırmızı veya boş hücreleri doldurunuz. Toplu giriş için şeritteki <strong>"Tümüne Tam Puan"</strong> butonunu kullanabilirsiniz.
              </AlertDescription>
            </Alert>
          )}
        </>
      )}

      {/* Remedial Work (Telafi) Modal */}
      {remedialStudent && (
        <>
          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[100]" onClick={() => setRemedialStudent(null)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-lg bg-white rounded-xl shadow-2xl z-[110] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 leading-tight">Telafi Çalışmaları</h3>
                  <p className="text-xs text-slate-500">{remedialStudent.name} ({remedialStudent.no || remedialStudent.studentNumber})</p>
                </div>
              </div>
              <button onClick={() => setRemedialStudent(null)} className="p-2 text-slate-400 hover:text-red-500 rounded-full transition-colors bg-white shadow-sm border border-slate-200 hover:border-red-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto max-h-[60vh] space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Uygulanan Aksiyonlar</label>
                <div className="grid gap-2">
                  {[
                    'Ek konu anlatımı yapıldı',
                    'Ödevlendirme yapıldı',
                    'Proje görevi verildi',
                    'Araştırma görevi verildi',
                    'Teknolojik araçlarla tekrar yapıldı',
                    'Birebir çalışma yapıldı',
                    'Veli bilgilendirildi',
                    'Ek kaynak verildi'
                  ].map(option => {
                    const isSelected = (grades[remedialStudent.id]?.__telafiSecimleri || []).includes(option);
                    return (
                      <label key={option} className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-200 ${isSelected ? 'bg-indigo-50 border-indigo-300 shadow-sm' : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50'}`}>
                        <div className="relative flex items-center justify-center shrink-0">
                          <input
                            type="checkbox"
                            className="peer absolute opacity-0 w-0 h-0"
                            checked={isSelected}
                            onChange={(e) => {
                              const current = grades[remedialStudent.id]?.__telafiSecimleri || [];
                              const next = e.target.checked ? [...current, option] : current.filter(x => x !== option);
                              const nextGrades = {
                                ...grades,
                                [remedialStudent.id]: {
                                  ...grades[remedialStudent.id],
                                  __telafiSecimleri: next
                                }
                              };
                              setGrades(nextGrades);
                              onGradesChange(nextGrades);
                            }}
                          />
                          <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors border ${isSelected ? 'bg-indigo-600 border-indigo-600 shadow-inner' : 'bg-white border-slate-300 peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500 peer-focus-visible:ring-offset-2'}`}>
                            {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                          </div>
                        </div>
                        <span className={`text-sm select-none transition-colors ${isSelected ? 'text-indigo-950 font-semibold' : 'text-slate-700 font-medium'}`}>{option}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Öğretmen Notu / Detaylar (Opsiyonel)</label>
                <textarea
                  className="w-full min-h-[100px] p-3 text-sm rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
                  placeholder="Yapılan özel telafi çalışmalarına dair ek notlar giriniz..."
                  value={grades[remedialStudent.id]?.__telafiNotu || ''}
                  onChange={(e) => {
                    const nextGrades = {
                      ...grades,
                      [remedialStudent.id]: {
                        ...grades[remedialStudent.id],
                        __telafiNotu: e.target.value
                      }
                    };
                    setGrades(nextGrades);
                    onGradesChange(nextGrades);
                  }}
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 text-right">
              <Button onClick={() => setRemedialStudent(null)} className="px-6">Bitti</Button>
            </div>
          </div>
        </>
      )}

      {
        showNavigation && (
          <div className="flex justify-between">
            <Button onClick={onBack} variant="outline" size="lg">
              Geri
            </Button>
            <Button
              onClick={onNext}
              size="lg"
              disabled={!allGradesFilled() || hasOverflow()}
              className={`min-w-[200px] ${(!allGradesFilled() || hasOverflow()) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {hasOverflow() ? (
                'Puan Hatası Var'
              ) : !allGradesFilled() ? (
                'Tüm Puanları Girin'
              ) : (
                'Analiz Sonuçlarını Gör'
              )}
            </Button>
          </div>
        )
      }
    </div >
  )
}

export default GradingTable
