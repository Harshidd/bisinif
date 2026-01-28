const toNumber = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

export const calculateItemDifficulty = ({ questions = [], students = [], grades = {} }) => {
  const studentCount = students.length
  return questions.map((question) => {
    const maxScore = toNumber(question.maxScore)
    let totalScore = 0
    students.forEach((student) => {
      const score = toNumber(grades?.[student.id]?.[question.qNo])
      totalScore += score
    })
    const difficulty = maxScore > 0 && studentCount > 0
      ? (totalScore / (maxScore * studentCount)) * 100
      : 0
    const avgScore = studentCount > 0 ? totalScore / studentCount : 0
    return {
      qNo: question.qNo,
      maxScore,
      outcomeId: question.outcomeId || '',
      totalScore,
      avgScore,
      difficulty,
    }
  })
}
