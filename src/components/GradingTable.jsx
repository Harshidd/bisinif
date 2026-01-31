import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card'
import { Input } from './ui/Input'
import { Button } from './ui/Button'
import { Alert, AlertDescription } from './ui/Alert'
import { AlertTriangle, AlertCircle, Zap, Trash2, Plus } from 'lucide-react'

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

const GradingTable = ({ config, questions = [], students, grades: existingGrades, onGradesChange, onStudentUpdate, onDeleteStudent, onAddStudent, onNext, onBack, showNavigation = true }) => {
  const [grades, setGrades] = useState({})
  const [warnings, setWarnings] = useState({})
  const [totalInputWarnings, setTotalInputWarnings] = useState({})
  const [totalInputValues, setTotalInputValues] = useState({})
  const [gradingMode, setGradingMode] = useState('fast')

  const maxTotalScore = questions.reduce((sum, question) => sum + (Number(question.maxScore) || 0), 0) || 0
  const generalPassingScore = config.generalPassingScore ?? 50

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
      questions.forEach((question) => {
        const key = question.qNo
        if (initialGrades[student.id][key] === undefined) {
          initialGrades[student.id][key] = ''
        }
      })
    })
    setGrades(initialGrades)
  }, [students, questions, existingGrades])

  const calculateTotal = (studentId) => {
    if (!grades[studentId]) return 0
    return questions.reduce((sum, question) => {
      const val = grades[studentId]?.[question.qNo]
      const num = Number(val)
      return sum + (Number.isFinite(num) ? num : 0)
    }, 0)
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

    const maxScores = questions.map(q => q.maxScore)
    const distributedScores = distributeIntegerTotal(numValue, maxScores)

    const newGrades = { ...grades }
    if (!newGrades[studentId]) newGrades[studentId] = {}

    questions.forEach((question, index) => {
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
      questions.forEach((question) => {
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
      return questions.every((question) => {
        const grade = grades[student.id]?.[question.qNo]
        return grade !== '' && grade !== undefined
      })
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
      questions.forEach((question) => {
        const grade = grades[student.id]?.[question.qNo]
        if (grade === '' || grade === undefined) count++
      })
    })
    return count
  }

  const getFilledStudentCount = () => {
    return students.filter((student) => {
      return questions.every((question) => {
        const grade = grades[student.id]?.[question.qNo]
        return grade !== '' && grade !== undefined
      })
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
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Not Girişi</CardTitle>
              <CardDescription>
                Soru puanlarını tek tek girin veya toplam puandan otomatik dağıtın
              </CardDescription>
            </div>
            <Button
              onClick={handleFillAllWithMaxScore}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Zap className="w-4 h-4 mr-2" />
              Tüm Öğrencilere Tam Puan Ver
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {hasOverflow() && (
            <Alert variant="destructive" className="mb-4 animate-pulse">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="font-bold">
                ⛔ HATA: Bazı öğrencilerin toplam puanı {maxTotalScore}'ü aşıyor!
              </AlertDescription>
            </Alert>
          )}

          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setGradingMode('fast')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${gradingMode === 'fast'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
              >
                Toplam Gir (Dağıt)
              </button>
              <button
                type="button"
                onClick={() => setGradingMode('detailed')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${gradingMode === 'detailed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
              >
                Soru Soru Gir
              </button>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg whitespace-nowrap shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Sınıf Ortalaması:</span>
                <span className="text-slate-900 font-bold">{Math.round(classAverage)} / {maxTotalScore}</span>
              </div>
              <div className="w-px h-3 bg-slate-300 mx-1 hidden sm:block"></div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Öğrenci:</span>
                <span className="text-slate-900 font-bold">{students.length}</span>
              </div>
            </div>
          </div>

          {/* Desktop Table View - Comapct & Sticky */}
          <div className="hidden lg:block w-full">
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

                    {questions.map((question) => {
                      const outcomeIndex = question.outcomeId !== '' ? Number(question.outcomeId) : NaN
                      const outcomeLabel = Number.isFinite(outcomeIndex)
                        ? config.outcomes?.[outcomeIndex]
                        : ''
                      return (
                        <th
                          key={question.qNo}
                          className="px-2 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wide text-center w-14 min-w-[3.5rem]"
                          title={outcomeLabel || ''}
                        >
                          <div>Q{question.qNo}</div>
                          <div className="text-[9px] font-normal text-gray-400 normal-case">({question.maxScore})</div>
                        </th>
                      )
                    })}

                    <th className="px-1 py-2 text-center text-[11px] font-semibold text-amber-700 uppercase tracking-wider w-16 min-w-[4rem] bg-amber-50">
                      <div>Toplam</div>
                      <div className="text-[9px] font-normal text-amber-600 normal-case">(max: {maxTotalScore})</div>
                    </th>
                    <th className="px-1 py-2 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wide w-10 min-w-[2.5rem] bg-gray-50">Sil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map((student) => {
                    const total = calculateTotal(student.id)
                    const isOverMax = total > maxTotalScore
                    const hasTotalWarning = totalInputWarnings[student.id]
                    const displayTotal = getTotalDisplayValue(student.id)

                    return (
                      <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                        <td className="sticky left-0 z-20 bg-white px-2 py-2 text-xs text-gray-600 text-center w-12 min-w-[3rem] max-w-[3rem] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{student.siraNo}</td>
                        <td className="sticky z-20 bg-white px-1 py-1 w-[5rem] min-w-[5rem] max-w-[5rem] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" style={{ left: '3rem' }}>
                          <Input
                            type="text"
                            value={student.studentNumber || student.no || ''}
                            onChange={(e) => onStudentUpdate?.(student.id, { no: e.target.value, studentNumber: e.target.value })}
                            className="text-xs h-7 px-1 w-full text-center border-transparent hover:border-gray-300 focus:border-blue-500"
                            placeholder="No"
                          />
                        </td>
                        <td className="sticky z-20 bg-white px-1 py-1 w-44 min-w-[11rem] max-w-[11rem] border-r border-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" style={{ left: '8rem' }}>
                          <Input
                            type="text"
                            value={student.name || ''}
                            onChange={(e) => onStudentUpdate?.(student.id, { name: e.target.value })}
                            className="text-xs h-7 px-2 w-full border-transparent hover:border-gray-300 focus:border-blue-500"
                            placeholder="Ad Soyad"
                          />
                        </td>

                        {questions.map((question) => {
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
                                aria-label={`Soru ${question.qNo} notu, ${student.name}`}
                                value={grades[student.id]?.[question.qNo] ?? ''}
                                onChange={(e) =>
                                  handleGradeChange(student.id, question.qNo, maxScoreForOutcome, e.target.value)
                                }
                                disabled={gradingMode === 'fast'}
                                className={`text-center text-xs py-1 w-12 min-w-[3rem] mx-auto h-7 px-0 ${hasWarning ? 'border-red-500 bg-red-50' : gradingMode === 'fast' ? 'bg-gray-100 text-gray-500' : 'border-gray-200'}`}
                                title={`Max: ${maxScoreForOutcome}`}
                              />
                            </td>
                          )
                        })}

                        <td className="px-1 py-1 relative bg-amber-50/50 text-center">
                          {gradingMode === 'fast' ? (
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
                                className={`text-center text-xs w-14 h-7 font-bold mx-auto px-1 ${hasTotalWarning
                                  ? 'border-red-500 bg-red-100 animate-pulse'
                                  : getTotalColorClass(total)
                                  }`}
                                title="Değer yazıp Enter'a basın veya kutudan çıkın"
                              />
                              {hasTotalWarning && (
                                <div className="absolute -top-8 left-0 right-0 bg-red-600 text-white text-xs px-2 py-1 rounded z-10 whitespace-nowrap text-center">
                                  {hasTotalWarning}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className={`text-center text-xs h-7 flex items-center justify-center font-bold mx-auto ${getTotalColorClass(total)}`}>
                              {Math.round(total)}
                            </div>
                          )}
                        </td>

                        {/* Silme Butonu */}
                        <td className="px-1 py-1 text-center bg-gray-50/50">
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
                    <tr className="bg-blue-50/50 hover:bg-blue-100/50 transition-colors">
                      <td colSpan={questions.length + 5} className="px-4 py-2 text-center">
                        <button
                          type="button"
                          onClick={onAddStudent}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Yeni Öğrenci Ekle
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
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
                      {gradingMode === 'fast' ? (
                        <>
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
                            className={`text-center text-xl font-bold ${hasTotalWarning ? 'border-red-500 bg-red-100' : ''
                              }`}
                            placeholder="Toplam girin"
                          />
                          {hasTotalWarning && (
                            <p className="text-xs text-red-600 mt-1 flex items-center">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              {hasTotalWarning}
                            </p>
                          )}
                          <p className="text-xs text-amber-600 mt-1">
                            💡 Değer yazıp Enter'a basın veya kutudan çıkın
                          </p>
                        </>
                      ) : (
                        <div className={`text-center text-xl font-bold ${getTotalColorClass(total)}`}>
                          {Math.round(total)}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {questions.map((question) => {
                        const hasWarning = warnings[`${student.id}-${question.qNo}`]
                        const maxScoreForOutcome = question.maxScore

                        return (
                          <div key={question.qNo} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-medium">Q{question.qNo}</span>
                              <span className="text-gray-400">({maxScoreForOutcome})</span>
                            </div>
                            <Input
                              type="number"
                              min="0"
                              max={maxScoreForOutcome}
                              step="1"
                              name={`q-${student.id}-${question.qNo}-mobile`}
                              aria-label={`Soru ${question.qNo} notu, ${student.name}`}
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
            <Alert className="mt-4 bg-blue-50 border-blue-300">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700">
                Lütfen tüm öğrenciler için puanları girin veya <strong>"Tüm Öğrencilere Tam Puan Ver"</strong> butonunu kullanın.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

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
