/**
 * ANALYSIS ENGINE (Pure Functions)
 * 
 * Logic for calculating exam statistics, student performance, and outcome mastery.
 * No UI dependencies.
 */

// Helper: Safely parse number
const safeNum = (val) => {
    if (typeof val === 'number') return Number.isFinite(val) ? val : 0
    if (typeof val === 'string' && val.trim() !== '') {
        const n = Number(val)
        return Number.isFinite(n) ? n : 0
    }
    return 0
}

/**
 * Main Analysis Entry Point
 * @param {Object} input
 * @param {Array} input.students - [{id, no, name, ...}]
 * @param {Object} input.grades - { [studentId]: { [qNo]: score } }
 * @param {Array} input.questions - [{qNo, maxScore, outcomeId}]
 * @param {Array} input.outcomes - ["Outcome 1", "Outcome 2"]
 * @param {Number} input.generalPassingScore - Absolute score (e.g. 50)
 * @param {Number} input.outcomeMasteryThreshold - Percentage (e.g. 50)
 */
export const buildAnalysis = ({
    students = [],
    grades = {},
    questions = [],
    outcomes = [],
    generalPassingScore = 50,
    outcomeMasteryThreshold = 50,
}) => {
    // 1. Calculate Exam Totals
    const examMax = questions.reduce((sum, q) => sum + safeNum(q.maxScore), 0)

    // 2. Process Students (Calculate Totals)
    let studentResults = students.map(student => {
        let total = 0
        const studentGrades = grades[student.id] || {}

        questions.forEach(q => {
            total += safeNum(studentGrades[q.qNo])
        })

        return {
            ...student,
            total,
            isPassing: total >= generalPassingScore
        }
    })

    // 3. Rank Students
    // Sort by Total Desc, then Name Asc
    studentResults.sort((a, b) => {
        if (b.total !== a.total) return b.total - a.total
        return (a.name || '').localeCompare(b.name || '')
    })

    // Add Rank & Percentile
    const studentCount = studentResults.length
    studentResults = studentResults.map((s, index) => {
        const rank = index + 1
        // Percentile: 1st place -> 100%, Last place -> 0%
        let percentile = 0
        if (studentCount > 1) {
            percentile = ((studentCount - rank) / (studentCount - 1)) * 100
        } else if (studentCount === 1) {
            percentile = 100
        }
        return { ...s, rank, percentile: Math.round(percentile) }
    })

    // 4. Calculate Class Meta Stats
    const classTotalSum = studentResults.reduce((sum, s) => sum + s.total, 0)
    const classAverage = studentCount > 0 ? (classTotalSum / studentCount) : 0
    const passCount = studentResults.filter(s => s.isPassing).length
    const failCount = studentCount - passCount
    const passRate = studentCount > 0 ? (passCount / studentCount) * 100 : 0

    // 5. Calculate Question Stats
    const questionStats = questions.map(q => {
        const qMax = safeNum(q.maxScore) || 0
        let sumScore = 0
        let count = 0

        students.forEach(s => {
            const g = safeNum(grades[s.id]?.[q.qNo])
            sumScore += g
            count++
        })

        const avgScore = count > 0 ? sumScore / count : 0
        const difficulty = (qMax > 0 && count > 0)
            ? (sumScore / (qMax * count)) * 100
            : 0

        // Note: difficulty usually means "how hard", typically 1 - success rate.
        // BUT in this app UI "Zorluk %" seems to display success rate (higher is greener/easier?).
        // In many TR systems "Zorluk derecesi" is often mapped to success rate (Madde Güçlük İndeksi p).
        // range 0.0 to 1.0. p > 0.8 is easy.
        // I will return 'difficulty' as success percentage (0-100) to match existing dashboard visual logic which likely expects success rate.

        return {
            qNo: q.qNo,
            maxScore: qMax,
            avgScore,
            difficulty, // actually success rate
            outcomeId: q.outcomeId
        }
    })

    // 6. Calculate Outcome Stats & Student Outcome Performance
    const outcomeMeta = outcomes.map((title, idx) => ({
        id: String(idx),
        title,
        questions: [],
        outcomeMax: 0
    }))

    questions.forEach(q => {
        if (q.outcomeId !== null && q.outcomeId !== '' && q.outcomeId !== undefined) {
            const mapped = outcomeMeta.find(o => o.id === String(q.outcomeId))
            if (mapped) {
                mapped.questions.push(q)
                mapped.outcomeMax += safeNum(q.maxScore)
            }
        }
    })

    // Calculate stats per outcome
    const outcomeStats = outcomeMeta.map(o => {
        return {
            outcomeId: o.id,
            title: o.title,
            questionNos: o.questions.map(q => q.qNo),
            outcomeMax: o.outcomeMax,
            outcomeIndex: Number(o.id),
            // placeholders
            sumStudentScores: 0,
            avgScore: 0,
            successRate: 0,
            maxScore: o.outcomeMax // Alias for UI compatibility
        }
    })

    // Augment studentResults with outcome scores array (for the table)
    studentResults = studentResults.map(s => {
        const sGrades = grades[s.id] || {}
        const outcomeScores = [] // simple array of scores matched to outcomes array index

        const myOutcomeData = outcomeMeta.map((oMeta, idx) => {
            let myScore = 0
            oMeta.questions.forEach(q => {
                myScore += safeNum(sGrades[q.qNo])
            })

            outcomeScores[idx] = myScore // Fill the array by index

            const pct = oMeta.outcomeMax > 0 ? (myScore / oMeta.outcomeMax) * 100 : 0
            return {
                outcomeId: oMeta.id,
                title: oMeta.title,
                myScore,
                outcomeMax: oMeta.outcomeMax,
                pct
            }
        })

        const sortedByPct = [...myOutcomeData].sort((a, b) => b.pct - a.pct)
        // Strong > 75%, otherwise sort by high
        const strongOutcomes = sortedByPct.filter(o => o.pct >= outcomeMasteryThreshold).slice(0, 5)
        // Weak < threshold
        const weakOutcomes = sortedByPct.filter(o => o.pct < outcomeMasteryThreshold).reverse().slice(0, 5)

        // ✅ Soru bazlı puanlar (questionScores)
        const questionScores = questions.map(q => {
            return safeNum(sGrades[q.qNo])
        })

        return {
            ...s,
            outcomeData: myOutcomeData,
            outcomeScores, // [score1, score2, ...] for quick table mapping
            questionScores, // ✅ YENİ: [q1Score, q2Score, ...] for question-based display
            weakOutcomes,
            strongOutcomes
        }
    })

    // Finalize Outcome Global Stats
    outcomeStats.forEach((oStat, idx) => {
        let earnedTotal = 0
        studentResults.forEach(s => {
            earnedTotal += s.outcomeScores[idx] || 0
        })

        oStat.sumStudentScores = earnedTotal
        const globalPossible = oStat.outcomeMax * studentCount
        oStat.avgScore = studentCount > 0 ? earnedTotal / studentCount : 0
        oStat.successRate = (globalPossible > 0) ? (earnedTotal / globalPossible) * 100 : 0

        // ⭐ YENİ: Başarısız öğrenci listesi ekle
        oStat.failingStudents = studentResults
            .filter(s => {
                const myO = s.outcomeData.find(od => od.outcomeId === oStat.outcomeId)
                return myO && myO.pct < outcomeMasteryThreshold
            })
            .map(s => {
                const myO = s.outcomeData.find(od => od.outcomeId === oStat.outcomeId)
                return {
                    id: s.id,
                    name: s.name,
                    no: s.studentNumber || s.no,
                    total: s.total,
                    pct: myO ? myO.pct : 0,
                    score: myO ? myO.myScore : 0,
                    maxScore: oStat.outcomeMax
                }
            })
    })

    // 7. Failure Matrix
    const failureRows = outcomeStats.map(o => {
        const failingStudents = studentResults
            .filter(s => {
                const myO = s.outcomeData.find(od => od.outcomeId === o.outcomeId)
                return myO && myO.pct < outcomeMasteryThreshold
            })
            .map(s => {
                const myO = s.outcomeData.find(od => od.outcomeId === o.outcomeId)
                return {
                    id: s.id,
                    name: s.name,
                    no: s.studentNumber || s.no,
                    total: s.total,
                    pct: myO ? myO.pct : 0,
                    score: myO ? myO.myScore : 0,
                    maxScore: o.outcomeMax
                }
            })

        return {
            outcomeId: o.outcomeId,
            title: o.title,
            successPct: o.successRate, // Alias
            failRate: 100 - o.successRate, // Approximation for UI
            failingStudents,
            outcome: o.title, // Alias
            index: o.outcomeIndex // Alias
        }
    })

    // Troubled Outcomes (High failure rate > 40-50%?) 
    // or simply outcomes where success rate < Threshold?
    // Let's filter outcomes that are 'risky'.
    const troubledOutcomes = failureRows.filter(r => r.successPct < outcomeMasteryThreshold)

    // 8. Histogram
    const scoreDistribution = [
        { label: '0-29', min: 0, max: 29, count: 0 },
        { label: '30-49', min: 30, max: 49, count: 0 },
        { label: '50-69', min: 50, max: 69, count: 0 },
        { label: '70-84', min: 70, max: 84, count: 0 },
        { label: '85-100', min: 85, max: 100, count: 0 },
    ]
    studentResults.forEach(s => {
        const t = s.total
        const bucket = scoreDistribution.find(d => t >= d.min && t <= d.max)
        if (bucket) bucket.count++
    })

    return {
        meta: {
            studentCount,
            examMax,
            classAverage,
            passCount: passCount,
            failCount: failCount,
            passRate,
            maxTotalScore: examMax // Alias
        },
        // Alias root properties for Dashboard compatibility where possible,
        // but prefer cleaner structure if refactoring dashboard.
        // I will refactor dashboard to read from meta.
        classAverage,   // Legacy for direct access
        maxTotalScore: examMax,
        passingCount: passCount,
        failingCount: failCount,
        passRate,

        questions: questionStats, // Item stats
        outcomes: outcomeStats,   // Outcome stats
        studentResults,           // Students (full data)
        failureMatrix: {
            rows: failureRows
        },
        troubledOutcomes,
        scoreDistribution
    }
}
