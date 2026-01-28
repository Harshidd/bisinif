import React, { useMemo, useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card'
import { Input } from './ui/Input'
import { Select } from './ui/Select'
import { Label } from './ui/Label'
import { Button } from './ui/Button'
import { Alert, AlertDescription } from './ui/Alert'
import { AlertTriangle } from 'lucide-react'
import ExcelUploader from './ExcelUploader'
import GradingTable from './GradingTable'

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
    let outcomeId = existing?.outcomeId ?? (outcomes.length > 0 ? '0' : null)
    if (outcomeId !== null && outcomeId !== '' && !outcomeIds.has(String(outcomeId))) {
      outcomeId = null
    }
    return {
      qNo: index + 1,
      maxScore: Number.isFinite(toNumber(existing?.maxScore)) ? toNumber(existing?.maxScore) : 1,
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

const getAssignedQuestions = (questions, outcomeId) => {
  return questions
    .filter((question) => String(question.outcomeId) === String(outcomeId))
    .map((question) => question.qNo)
    .sort((a, b) => a - b)
}

const getUnassignedQuestions = (questions) => {
  return questions
    .filter((question) => question.outcomeId === null || question.outcomeId === '' || question.outcomeId === undefined)
    .map((question) => question.qNo)
    .sort((a, b) => a - b)
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
}) => {
  const [activeTab, setActiveTab] = useState('setup')
  const [outcomeTexts, setOutcomeTexts] = useState(config.outcomes || [])
  const [questionCount, setQuestionCount] = useState(questions.length || 0)
  const [expandedOutcomeIndex, setExpandedOutcomeIndex] = useState(null)
  const [showScoreEditor, setShowScoreEditor] = useState(false)
  const [showGradeResetWarning, setShowGradeResetWarning] = useState(false)
  const lastQuestionCountRef = useRef(questions.length || 0)

  useEffect(() => {
    const outcomeList = config.outcomes || []
    if (outcomeTexts.length !== outcomeList.length) {
      setOutcomeTexts(outcomeList)
    }
    if ((config.outcomeCount ?? outcomeList.length) !== outcomeList.length) {
      onConfigChange({ outcomeCount: outcomeList.length })
    }
  }, [config.outcomes, config.outcomeCount, outcomeTexts.length, onConfigChange])

  useEffect(() => {
    if (config.outcomeCount && outcomeTexts.length !== config.outcomeCount) {
      const newTexts = Array(config.outcomeCount).fill('').map((_, i) => outcomeTexts[i] || '')
      setOutcomeTexts(newTexts)
    }
  }, [config.outcomeCount])

  useEffect(() => {
    if (questions.length !== questionCount) {
      setQuestionCount(questions.length)
    }
  }, [questions.length])

  useEffect(() => {
    const normalized = normalizeQuestions(questionCount, questions, config.outcomes || [])
    if (!areQuestionsEqual(normalized, questions)) {
      onQuestionsChange(normalized)
    }
  }, [questionCount, questions, config.outcomes, onQuestionsChange])

  useEffect(() => {
    const prev = lastQuestionCountRef.current
    if (prev !== questionCount) {
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

  const handleOutcomeCountChange = (e) => {
    const count = parseInt(e.target.value, 10) || 0
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
    setQuestionCount(Number.isFinite(parsed) ? parsed : 0)
  }

  const handleOutcomeQuestionCountChange = (outcomeIndex, targetCount) => {
    const outcomeId = String(outcomeIndex)
    const next = normalizeQuestions(questionCount, questions, config.outcomes || [])
    const assigned = getAssignedQuestions(next, outcomeId)
    const unassigned = getUnassignedQuestions(next)

    let updated = [...assigned]
    if (targetCount > assigned.length) {
      const needed = targetCount - assigned.length
      const toAssign = unassigned.slice(0, needed)
      updated = assigned.concat(toAssign)
      toAssign.forEach((qNo) => {
        const question = next.find((q) => q.qNo === qNo)
        if (question) question.outcomeId = outcomeId
      })
    } else if (targetCount < assigned.length) {
      const toRemove = assigned.slice(targetCount)
      toRemove.forEach((qNo) => {
        const question = next.find((q) => q.qNo === qNo)
        if (question) question.outcomeId = null
      })
      updated = assigned.slice(0, targetCount)
    }

    onQuestionsChange(next)
  }

  const handleQuestionScoreChange = (qNo, value) => {
    const next = [...questions]
    const question = next.find((item) => item.qNo === qNo)
    if (!question) return
    question.maxScore = toNumber(value)
    onQuestionsChange(next)
  }

  const handleToggleQuestion = (outcomeIndex, qNo) => {
    const outcomeId = String(outcomeIndex)
    const next = normalizeQuestions(questionCount, questions, config.outcomes || [])
    const question = next.find((q) => q.qNo === qNo)
    if (!question) return
    if (String(question.outcomeId) === outcomeId) {
      question.outcomeId = null
    } else {
      question.outcomeId = outcomeId
    }
    onQuestionsChange(next)
  }

  const handleAutoDistributeQuestions = () => {
    if (questionCount <= 0) return
    const baseQuestions = normalizeQuestions(questionCount, questions, config.outcomes || [])
    const perQuestion = 100 / questionCount
    let runningSum = 0
    const next = baseQuestions.map((question, index) => {
      const value = index === questionCount - 1
        ? 100 - runningSum
        : perQuestion
      const rounded = Number(value.toFixed(2))
      if (index < questionCount - 1) {
        runningSum += rounded
      }
      return {
        ...question,
        maxScore: rounded,
      }
    })
    onQuestionsChange(next)
  }

  const questionTotalScore = useMemo(() => {
    return questions.reduce((sum, question) => sum + toNumber(question.maxScore), 0)
  }, [questions])

  const hasAnyGrade = useMemo(() => {
    return students.some((student) => {
      const studentGrades = grades?.[student.id]
      if (!studentGrades) return false
      return Object.values(studentGrades).some((value) => value !== '' && value !== null && value !== undefined)
    })
  }, [students, grades])

  const canAnalyze = students.length > 0 && questions.length > 0 && hasAnyGrade

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Sınav Kurulumu & Not Girişi</h1>
          <p className="text-sm text-gray-500">Sınavı kurun, öğrencileri yükleyin ve notları girin.</p>
        </div>
        <Button onClick={onBack} variant="outline">
          Geri
        </Button>
      </div>

      <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-full w-fit">
        <button
          onClick={() => setActiveTab('setup')}
          className={`px-4 py-2 text-sm rounded-full transition-all ${
            activeTab === 'setup'
              ? 'bg-white text-gray-900 shadow-apple'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Sınav Kurulumu
        </button>
        <button
          onClick={() => setActiveTab('grades')}
          className={`px-4 py-2 text-sm rounded-full transition-all ${
            activeTab === 'grades'
              ? 'bg-white text-gray-900 shadow-apple'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Öğrenci & Notlar
        </button>
      </div>

      {activeTab === 'setup' && (
        <div className="space-y-6">
          <Card className="shadow-apple-lg">
            <CardHeader>
              <CardTitle>Sınav Kurulumu</CardTitle>
              <CardDescription>Kazanım listesi ve soru blueprint eşlemesi.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="generalPassingScore" className="text-gray-600">Genel Geçme Puanı</Label>
                  <Input
                    id="generalPassingScore"
                    type="number"
                    min="0"
                    max="100"
                    value={config.generalPassingScore ?? 50}
                    onChange={(e) => onConfigChange({ generalPassingScore: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="outcomeMasteryThreshold" className="text-gray-600">Kazanım Ustalık Barajı (%)</Label>
                  <Input
                    id="outcomeMasteryThreshold"
                    type="number"
                    min="0"
                    max="100"
                    value={config.outcomeMasteryThreshold ?? 50}
                    onChange={(e) => onConfigChange({ outcomeMasteryThreshold: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Kazanım Kartları</h3>
                    <p className="text-sm text-gray-500">Soru dağılımını kazanım bazında yapın.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowScoreEditor((prev) => !prev)}
                      disabled={questionCount <= 0}
                    >
                      Soru Değerlerini Düzenle
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleAutoDistributeQuestions}
                      disabled={questionCount <= 0}
                    >
                      Otomatik Dağıt (100/n)
                    </Button>
                  </div>
                  {showScoreEditor && questionCount > 0 && (
  <div className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
    <div className="text-sm font-medium text-gray-700 mb-3">Soru Değerleri</div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {questions.map((question) => (
        <div key={`score-${question.qNo}`} className="flex items-center gap-2">
          <span className="text-xs text-gray-500 w-10">Q{question.qNo}</span>
          <Input
            type="number"
            min="0"
            value={question.maxScore ?? 0}
            onChange={(e) => handleQuestionScoreChange(question.qNo, e.target.value)}
            className="text-right"
          />
        </div>
      ))}
    </div>
  </div>
)}

                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="questionCount" className="text-gray-600">Toplam Soru Sayısı (n)</Label>
                    <Input
                      id="questionCount"
                      type="number"
                      min="0"
                      value={questionCount}
                      onChange={(e) => handleQuestionCountChange(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-600">Toplam Puan</Label>
                    <div className="h-10 flex items-center px-3 rounded-lg bg-gray-50 text-gray-700 font-semibold">
                      {questionTotalScore.toFixed(2)}
                    </div>
                  </div>
                </div>

                {questionCount > 0 && questionTotalScore !== 100 && (
                  <Alert className="bg-amber-50 border-amber-200">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-700 text-sm">
                      Toplam puan 100 değil. (Şu an: {questionTotalScore.toFixed(2)})
                    </AlertDescription>
                  </Alert>
                )}

                {showGradeResetWarning && (
                  <Alert className="bg-amber-50 border-amber-200">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-700 text-sm flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <span>Soru sayısı değişti. Mevcut notlar yeni düzene uymayabilir.</span>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          onGradesChange({})
                          setShowGradeResetWarning(false)
                        }}
                      >
                        Notları Sıfırla
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="pt-4 border-t border-gray-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Kazanımlar</h3>
                      <p className="text-sm text-gray-500">Kazanım adlarını ve soru dağılımını belirleyin.</p>
                    </div>
                    <div className="w-32">
                      <Input
                        type="number"
                        min="0"
                        value={config.outcomeCount ?? 0}
                        onChange={handleOutcomeCountChange}
                        placeholder="Adet"
                      />
                    </div>
                  </div>

                  {config.outcomeCount > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Array.from({ length: config.outcomeCount }).map((_, index) => {
                        const outcomeId = String(index)
                        const assigned = getAssignedQuestions(questions, outcomeId)
                        const unassigned = getUnassignedQuestions(questions)
                        const maxAssignable = assigned.length + unassigned.length
                        const currentCount = assigned.length
                        const outcomeTitle = outcomeTexts[index] || `Kazanım ${index + 1}`

                        return (
                          <div key={outcomeId} className="p-4 rounded-2xl border border-gray-100 bg-white shadow-sm">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex-1">
                                <Label className="text-xs text-gray-500">Kazanım {index + 1}</Label>
                                <Input
                                  value={outcomeTexts[index] || ''}
                                  onChange={(e) => handleOutcomeTextChange(index, e.target.value)}
                                  placeholder={`Kazanım ${index + 1} açıklaması`}
                                  className="mt-1"
                                />
                              </div>
                              <div className="flex flex-col items-end">
                                <Label className="text-xs text-gray-500">Soru Sayısı</Label>
                                <div className="flex items-center gap-2 mt-1">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleOutcomeQuestionCountChange(index, Math.max(0, currentCount - 1))}
                                    disabled={currentCount === 0}
                                  >
                                    -
                                  </Button>
                                  <span className="text-sm font-semibold w-8 text-center">{currentCount}</span>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleOutcomeQuestionCountChange(index, Math.min(maxAssignable, currentCount + 1))}
                                    disabled={currentCount >= maxAssignable}
                                  >
                                    +
                                  </Button>
                                </div>
                              </div>
                            </div>

                            <div className="mt-3">
                              <div className="flex flex-wrap gap-2">
                                {assigned.length === 0 && (
                                  <span className="text-xs text-gray-400">Henüz soru atanmadı.</span>
                                )}
                                {assigned.map((qNo) => {
                                  const maxScore = questions.find((q) => q.qNo === qNo)?.maxScore ?? 0
                                  return (
                                    <span
                                      key={`${outcomeId}-q${qNo}`}
                                      className="inline-flex items-center gap-2 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                                    >
                                      Q{qNo} ({toNumber(maxScore)})
                                    </span>
                                  )
                                })}
                              </div>
                            </div>

                            <div className="mt-3">
                              <button
                                type="button"
                                className="text-xs text-blue-600 hover:text-blue-800"
                                onClick={() => setExpandedOutcomeIndex(expandedOutcomeIndex === index ? null : index)}
                              >
                                {expandedOutcomeIndex === index ? 'Seçimi Kapat' : 'Soruları Seç'}
                              </button>
                            </div>

                            {expandedOutcomeIndex === index && questionCount > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {questions.map((question) => {
                                  const isSelected = String(question.outcomeId) === outcomeId
                                  return (
                                    <button
                                      key={`picker-${outcomeId}-${question.qNo}`}
                                      type="button"
                                      onClick={() => handleToggleQuestion(index, question.qNo)}
                                      className={`px-2 py-1 text-xs rounded-full border ${
                                        isSelected
                                          ? 'bg-blue-600 text-white border-blue-600'
                                          : 'bg-white text-gray-600 border-gray-200'
                                      }`}
                                      title={outcomeTitle}
                                    >
                                      Q{question.qNo}
                                    </button>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'grades' && (
        <div className="space-y-6">
          <ExcelUploader
            onStudentsImported={onStudentsChange}
            existingStudents={students}
            showNavigation={false}
          />

          <GradingTable
            config={config}
            questions={questions}
            students={students}
            grades={grades}
            onGradesChange={onGradesChange}
            showNavigation={false}
          />
        </div>
      )}

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
                