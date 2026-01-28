const toNumber = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

const buildOutcomeMap = (outcomes = []) => {
  return outcomes.map((outcome, index) => ({
    id: String(index),
    name: outcome,
    index,
  }))
}

export const calculateOutcomeStats = ({
  outcomes = [],
  questions = [],
  students = [],
  grades = {},
  outcomeMasteryThreshold = 50,
}) => {
  const outcomeMap = buildOutcomeMap(outcomes)
  const studentCount = students.length

  return outcomeMap.map((outcome) => {
    const outcomeQuestions = questions.filter((q) => String(q.outcomeId) === outcome.id)
    const maxScore = outcomeQuestions.reduce((sum, q) => sum + toNumber(q.maxScore), 0)

    let totalScore = 0
    let successCount = 0

    students.forEach((student) => {
      let studentScore = 0
      outcomeQuestions.forEach((q) => {
        studentScore += toNumber(grades?.[student.id]?.[q.qNo])
      })
      totalScore += studentScore

      const pct = maxScore > 0 ? (studentScore / maxScore) * 100 : 0
      if (pct >= outcomeMasteryThreshold) {
        successCount += 1
      }
    })

    const successRate = maxScore > 0 && studentCount > 0
      ? (totalScore / (maxScore * studentCount)) * 100
      : 0
    const avgScore = studentCount > 0 ? totalScore / studentCount : 0
    const avgPercentage = maxScore > 0 ? (avgScore / maxScore) * 100 : 0

    return {
      outcome: outcome.name,
      index: outcome.index,
      maxScore,
      successRate,
      avgScore,
      avgPercentage,
      successCount,
      failCount: studentCount - successCount,
      failRate: studentCount > 0 ? 100 - ((successCount / studentCount) * 100) : 0,
    }
  })
}

export const buildFailureMatrix = ({
  outcomes = [],
  questions = [],
  students = [],
  grades = {},
  outcomeMasteryThreshold = 50,
}) => {
  const outcomeMap = buildOutcomeMap(outcomes)
  const studentCount = students.length

  return outcomeMap.map((outcome) => {
    const outcomeQuestions = questions.filter((q) => String(q.outcomeId) === outcome.id)
    const maxScore = outcomeQuestions.reduce((sum, q) => sum + toNumber(q.maxScore), 0)
    const failThreshold = maxScore * (outcomeMasteryThreshold / 100)

    const failedStudents = students
      .filter((student) => {
        let studentScore = 0
        outcomeQuestions.forEach((q) => {
          studentScore += toNumber(grades?.[student.id]?.[q.qNo])
        })
        return studentScore < failThreshold
      })
      .map((student) => {
        let studentScore = 0
        outcomeQuestions.forEach((q) => {
          studentScore += toNumber(grades?.[student.id]?.[q.qNo])
        })
        const pct = maxScore > 0 ? (studentScore / maxScore) * 100 : 0
        return {
          id: student.id,
          name: student.name,
          score: studentScore,
          maxScore,
          percentage: pct,
        }
      })

    const failRate = studentCount > 0 ? (failedStudents.length / studentCount) * 100 : 0

    return {
      outcome: outcome.name,
      index: outcome.index,
      maxScore,
      failedStudents,
      failedCount: failedStudents.length,
      totalStudents: studentCount,
      failRate,
      isAllSuccess: failedStudents.length === 0,
    }
  })
}
