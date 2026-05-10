import React, { useMemo, useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card'
import { Input } from './ui/Input'
import { Label } from './ui/Label'
import { Button } from './ui/Button'
import { Alert, AlertDescription } from './ui/Alert'
import { AlertTriangle, GraduationCap } from 'lucide-react'
import StudentImporter from './StudentImporter'
import GradingTable from './GradingTable'
import ChangeClassModal from './ChangeClassModal'
import OutcomeSetManager from './OutcomeSetManager'
import ClassTemplateManager from './ClassTemplateManager'
import ExamWorkspaceManager from './ExamWorkspaceManager'
import { getLanguageProfile } from '../core/languageProfiles'

const toNumber = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

const normalizeQuestions = (count, existingQuestions, outcomes) => {
  const outcomeIds = new Set(outcomes.map((_, index) => String(index)))
  if (count <= 0) return []
  return Array.from({ length: count }).map((_, index) => {
    const existing = existingQuestions[index]
    let outcomeId = existing?.outcomeId ?? null
    if (outcomeId !== null && outcomeId !== '' && !outcomeIds.has(String(outcomeId))) {
      outcomeId = null
    }
    return {
      qNo: index + 1,
      maxScore: Math.max(0, Math.floor(Number.isFinite(toNumber(existing?.maxScore)) ? toNumber(existing?.maxScore) : 1)),
      outcomeId,
    }
  })
}

const areQuestionsEqual = (a, b) => {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i += 1) {
    if (a[i].qNo !== b[i].qNo) return false
    if (toNumber(a[i].maxScore) !== toNumber(b[i].maxScore)) return false
    const aOutcome = a[i].outcomeId ?? null
    const bOutcome = b[i].outcomeId ?? null
    if (String(aOutcome) !== String(bOutcome)) return false
  }
  return true
}

const SetupAndGradesStep = ({
  config,
  questions = [],
  onQuestionsChange,
  students,
  onStudentsChange,
  grades,
  onGradesChange,
  onConfigChange,
  onBack,
  onNext,
  onNewAnalysis,
  onClassContextReset,
  gradeTableResetKey,
}) => {
  const [outcomeTexts, setOutcomeTexts] = useState(config.outcomes || [])
  const [outcomeCount, setOutcomeCount] = useState((config.outcomes || []).length)
  const [questionCount, setQuestionCount] = useState(questions.length || 0)
  const [scoringMode, setScoringMode] = useState('auto') // 'auto' or 'manual'
  const [showGradeResetWarning, setShowGradeResetWarning] = useState(false)
  const [showOutcomesPanel, setShowOutcomesPanel] = useState(false) // Mobile accordion
  const [showChangeClassModal, setShowChangeClassModal] = useState(false)
  const lastQuestionCountRef = useRef(questions.length || 0)

  // Sync outcomeTexts with config.outcomes
  useEffect(() => {
    const outcomeList = config.outcomes || []
    if (JSON.stringify(outcomeTexts) !== JSON.stringify(outcomeList)) {
      setOutcomeTexts(outcomeList)
      setOutcomeCount(outcomeList.length)
    }
  }, [config.outcomes])

  // Sync questionCount with questions.length
  useEffect(() => {
    if (questions.length !== questionCount) {
      setQuestionCount(questions.length)
    }
  }, [questions.length])

  // Normalize questions when count or outcomes or questions change to prevent stale closures overwriting mappings
  useEffect(() => {
    const normalized = normalizeQuestions(questionCount, questions, outcomeTexts)
    if (!areQuestionsEqual(normalized, questions)) {
      onQuestionsChange(normalized)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionCount, outcomeTexts, questions])

  // Grade reset warning when question count changes
  useEffect(() => {
    const prev = lastQuestionCountRef.current
    if (prev !== questionCount && questionCount > 0) {
      const hasAnyGrade = students.some((student) => {
        const studentGrades = grades?.[student.id]
        if (!studentGrades) return false
        return Object.values(studentGrades).some((value) => value !== '' && value !== null && value !== undefined)
      })
      if (hasAnyGrade) {
        setShowGradeResetWarning(true)
      }
      lastQuestionCountRef.current = questionCount
    }
  }, [questionCount, students, grades])

  const handleOutcomeCountChange = (value) => {
    const count = parseInt(value, 10) || 0
    setOutcomeCount(count)
    const next = Array(count).fill('').map((_, i) => outcomeTexts[i] || '')
    setOutcomeTexts(next)
    onConfigChange({ outcomeCount: count, outcomes: next })
  }

  const handleOutcomeTextChange = (index, value) => {
    const next = [...outcomeTexts]
    next[index] = value
    setOutcomeTexts(next)
    onConfigChange({ outcomes: next })
  }

  const handleQuestionCountChange = (value) => {
    const parsed = parseInt(value, 10)
    const newCount = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
    setQuestionCount(newCount)
  }

  const handleQuestionScoreChange = (qNo, value) => {
    const next = questions.map((q) => 
      q.qNo === qNo ? { ...q, maxScore: Math.max(0, Math.floor(Number(value) || 0)) } : q
    )
    onQuestionsChange(next)
  }

  const handleOutcomeChange = (qNo, selectedValue) => {
    const next = questions.map((q) => 
      q.qNo === qNo ? { ...q, outcomeId: selectedValue === '' ? null : selectedValue } : q
    )
    onQuestionsChange(next)
  }

  const handleAutoDistribute = () => {
    if (questionCount <= 0) return
    const baseQuestions = normalizeQuestions(questionCount, questions, outcomeTexts)

    const n = questionCount
    const base = Math.floor(100 / n)
    const remainder = 100 - (base * n)

    const next = baseQuestions.map((question, index) => {
      // Distribute 100 points: base for everyone, remainder to the last one
      // Guarantees Sum = 100 and Integers
      const add = (index === n - 1) ? remainder : 0
      const score = base + add

      return {
        ...question,
        maxScore: score,
      }
    })
    onQuestionsChange(next)
  }

  const hasAnyGrade = useMemo(() => {
    return students.some((student) => {
      const studentGrades = grades?.[student.id]
      if (!studentGrades) return false
      return Object.values(studentGrades).some((value) => value !== '' && value !== null && value !== undefined)
    })
  }, [students, grades])

  const isLanguage = config.courseType === 'Dil Dersi'
  const canAnalyze = students.length > 0 && questions.length > 0 && hasAnyGrade

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* UPPER PANEL: Sınav Kurulum Paneli — tüm ders türleri için aynı */}
      <div className="border border-slate-200 bg-white shadow-sm rounded-xl overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-2">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2 h-6 bg-blue-600 rounded-sm"></span>
            Sınav Kurulumu & Parametreler
          </h2>
          <div className="flex items-center gap-2">
            {isLanguage && (() => {
              const lp = getLanguageProfile(config.courseType, config.courseName)
              const w = lp?.weights || { yazili: 0.5, dinleme: 0.25, konusma: 0.25 }
              return (
                <span className="text-[10px] font-medium px-2 py-1 bg-blue-50 border border-blue-200 rounded-full text-blue-600 hidden sm:inline-block">
                  Yazılı %{Math.round(w.yazili * 100)} · Dinleme %{Math.round(w.dinleme * 100)} · Konuşma %{Math.round(w.konusma * 100)}
                </span>
              )
            })()}

            <ExamWorkspaceManager
              config={config}
              questions={questions}
              students={students}
              grades={grades}
              onLoad={(data) => {
                onConfigChange(data.config)
                onQuestionsChange(data.questions)
                onStudentsChange(data.students)
                onGradesChange(data.grades)
              }}
            />

            {/* 1. Sınıf Bilgisi (Pasif) */}
            <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold px-3 py-1 bg-slate-50 border border-slate-200 rounded-full shadow-sm">
              <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
              {config.gradeLevel || 'Sınıf Yok'} {config.classSection ? `- ${config.classSection} Şubesi` : ''}
            </div>

            {/* 2. Sınıf Değiştir (Aksiyon) */}
            <button
              type="button"
              onClick={() => setShowChangeClassModal(true)}
              className="text-xs font-semibold px-3 py-1 bg-white text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-full shadow-sm transition-colors whitespace-nowrap"
            >
              Sınıf Değiştir
            </button>

            {/* 3. Yeni Sınav Kur (Aksiyon) */}
            <button
              type="button"
              onClick={() => {
                if (window.confirm('TÜM çalışma (sınav ayarları, liste, notlar) sıfırlanacak. Başa dönülecek. Emin misiniz?')) {
                  if (onNewAnalysis) onNewAnalysis()
                }
              }}
              className="text-xs font-semibold px-3 py-1 bg-white text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-full shadow-sm transition-colors whitespace-nowrap"
            >
              Yeni Sınav Kur
            </button>
          </div>
        </div>

        <ChangeClassModal
          isOpen={showChangeClassModal}
          onClose={() => setShowChangeClassModal(false)}
          currentGradeLevel={config.gradeLevel}
          currentClassSection={config.classSection}
          onConfirm={(newClassData) => {
            setShowChangeClassModal(false)
            if (onClassContextReset) {
              onClassContextReset(newClassData)
            }
          }}
          onNewAnalysis={onNewAnalysis}
        />

        <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-6 bg-white">
          {/* Kolon 1: Soru Sayısı + Geçme Puanı */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="questionCount" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Toplam Soru (N)</Label>
              <Input
                id="questionCount"
                type="number"
                min="0"
                value={questionCount}
                onChange={(e) => handleQuestionCountChange(e.target.value)}
                className="h-8 text-sm focus:ring-blue-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="generalPassingScore" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Genel Geçme Puanı</Label>
              <Input
                id="generalPassingScore"
                type="number"
                min="0"
                max="100"
                value={config.generalPassingScore ?? 50}
                onChange={(e) => onConfigChange({ generalPassingScore: parseFloat(e.target.value) || 0 })}
                className="h-8 text-sm focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Kolon 2: Puanlama Modu + Kazanım Barajı */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Puanlama Modu</Label>
              <div className="flex items-center gap-1 border border-slate-200 p-0.5 rounded-lg bg-slate-50">
                <button
                  type="button"
                  onClick={() => setScoringMode('auto')}
                  className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all ${scoringMode === 'auto' ? 'bg-white shadow-sm text-blue-700 border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Otomatik
                </button>
                <button
                  type="button"
                  onClick={() => setScoringMode('manual')}
                  className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all ${scoringMode === 'manual' ? 'bg-white shadow-sm text-blue-700 border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Manuel
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="outcomeMasteryThreshold" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Kazanım Barajı (%)</Label>
              <Input
                id="outcomeMasteryThreshold"
                type="number"
                min="0"
                max="100"
                value={config.outcomeMasteryThreshold ?? 50}
                onChange={(e) => onConfigChange({ outcomeMasteryThreshold: parseFloat(e.target.value) || 0 })}
                className="h-8 text-sm focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Kolon 3 & 4: Kazanım Listesi */}
          <div className="md:col-span-2 space-y-2 border-l border-slate-100 pl-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Kazanım Listesi</Label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400">Adet:</span>
                <Input
                  type="number"
                  min="0"
                  value={outcomeCount}
                  onChange={(e) => handleOutcomeCountChange(e.target.value)}
                  className="h-6 w-16 text-xs px-2"
                />
              </div>
            </div>
            
            <div className="max-h-[110px] overflow-y-auto space-y-1.5 pr-2 scrollbar-thin scrollbar-thumb-slate-200">
              {outcomeCount === 0 && (
                <div className="text-xs text-slate-400 italic">Kazanım tanımlanmadı. Sadece genel not verilecekse şart değildir.</div>
              )}
              {Array.from({ length: outcomeCount }).map((_, index) => (
                <div key={index} className="flex gap-2">
                  <div className="w-8 h-7 shrink-0 bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 rounded border border-slate-200">
                    K{index + 1}
                  </div>
                  <Input
                    value={outcomeTexts[index] || ''}
                    onChange={(e) => handleOutcomeTextChange(index, e.target.value)}
                    placeholder={`Kazanım ${index + 1} açıklamasını girin...`}
                    className="h-7 text-xs flex-1"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Soru-Kazanım Eşleştirme Alt Paneli */}
        {questionCount > 0 && (
          <div className="border-t border-slate-100 bg-slate-50/50 p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 gap-2">
              <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Soru - Kazanım Dağılımı</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Önce kazanımları tanımlayınız, ardından her soruyu ilgili kazanımla aşağıdaki listeden eşleştiriniz.</p>
              </div>
              <div className="flex items-center gap-2">
                <OutcomeSetManager
                  currentOutcomes={outcomeTexts}
                  currentQuestions={questions}
                  onLoad={({ questions: loadedQuestions, outcomes: loadedOutcomes }) => {
                    const nextOutcomes = loadedOutcomes || []
                    setOutcomeCount(nextOutcomes.length)
                    setOutcomeTexts(nextOutcomes)
                    onConfigChange({ outcomeCount: nextOutcomes.length, outcomes: nextOutcomes })
                    
                    const nextQuestions = loadedQuestions || []
                    setQuestionCount(nextQuestions.length)
                    onQuestionsChange(nextQuestions)
                  }}
                />
              {scoringMode === 'auto' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAutoDistribute}
                  className="h-7 text-[10px] uppercase font-bold text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100"
                >
                  Puanları Eşit Dağıt (100)
                </Button>
              )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 bg-white border border-slate-200 rounded-lg max-h-[280px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 p-2">
              {questions.map((question) => (
                <div key={question.qNo} className="flex flex-row items-center justify-between gap-2 p-1.5 border border-slate-100 rounded bg-slate-50 hover:bg-slate-100/70 transition-colors">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs font-bold text-slate-600 w-11">Soru {question.qNo}</span>
                    {scoringMode === 'auto' ? (
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded shadow-sm min-w-[32px] text-center">{Math.round(question.maxScore ?? 0)}p</span>
                    ) : (
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={question.maxScore ?? 0}
                        onChange={(e) => handleQuestionScoreChange(question.qNo, e.target.value)}
                        className="w-12 h-6 text-xs text-center px-1 border-slate-200 focus:border-blue-500 font-bold"
                      />
                    )}
                  </div>
                  <select
                    value={question.outcomeId ?? ''}
                    onChange={(e) => handleOutcomeChange(question.qNo, e.target.value)}
                    className="flex-1 min-w-[100px] h-7 py-0 px-2 text-[10px] border border-slate-200 rounded text-slate-700 focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="" className="text-slate-400">Kazanım Seç...</option>
                    {outcomeTexts.map((outcome, index) => (
                      <option key={index} value={String(index)}>
                        K{index + 1}: {(outcome || '').substring(0, 30)}...
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            
            {showGradeResetWarning && (
              <Alert className="mt-3 bg-red-50 border-red-200 py-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700 text-xs flex flex-col md:flex-row md:items-center justify-between gap-2 ml-2">
                  <span>Soru sayısı değişti. Mevcut öğrenci notları yeni düzene uymayabilir.</span>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      onGradesChange({})
                      setShowGradeResetWarning(false)
                    }}
                    className="h-7 text-[10px] px-2"
                  >
                    Tüm Notları Sıfırla
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </div>

      {/* LOWER PANEL: Öğrenci Not Girişi */}
      <div className="border border-slate-200 bg-white shadow-sm rounded-xl overflow-hidden mt-6">
        <GradingTable
          config={config}
          questions={questions}
          students={students}
          grades={grades}
          onGradesChange={onGradesChange}
          onStudentUpdate={(studentId, patch) => {
            const nextStudents = students.map(s =>
              s.id === studentId ? { ...s, ...patch } : s
            )
            onStudentsChange(nextStudents)
          }}
          onDeleteStudent={(studentId) => {
            if (!window.confirm('Öğrenci listeden silinecek, emin misiniz?')) return
            const nextStudents = students.filter(s => String(s.id) !== String(studentId))
            onStudentsChange(nextStudents)
            const nextGrades = { ...grades }
            delete nextGrades[studentId]
            onGradesChange(nextGrades)
          }}
          onClearStudentList={() => {
            // Merkezi sınıf bağlamı reset — sınav omurgası korunur
            if (onClassContextReset) {
              onClassContextReset()
            } else {
              // Fallback: prop gelmezse local temizlik yap
              onStudentsChange([])
              onGradesChange({})
            }
          }}
          onResetGrades={() => {
            onGradesChange({})
          }}
          onNewAnalysis={onNewAnalysis}
          onAddStudent={() => {
            const newStudent = {
              id: Date.now(),
              siraNo: students.length + 1,
              no: '',
              studentNumber: '',
              name: ''
            }
            onStudentsChange([...students, newStudent])
          }}
          showNavigation={false}
          resetKey={gradeTableResetKey}
          importerComponent={
            <div className="flex items-center justify-end gap-2">
              <ClassTemplateManager
                currentStudents={students}
                onLoad={(templateStudents) => {
                  if (onClassContextReset) onClassContextReset()
                  onStudentsChange(templateStudents)
                }}
              />
              <StudentImporter
                onImport={onStudentsChange}
                existingStudents={students}
                compact={true}
                target="exam"
              />
            </div>
          }
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {canAnalyze ? 'Hazır: Analize geçebilirsiniz.' : 'Analiz için soru, öğrenci ve not girin.'}
        </div>
        <Button onClick={onNext} disabled={!canAnalyze} size="lg" className="min-w-[200px]">
          Analize Git
        </Button>
      </div>
    </div>
  )
}

export default SetupAndGradesStep