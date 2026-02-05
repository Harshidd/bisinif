import { classRepo } from '../../repo/classRepo'
import { seatingRepo } from '../repo/seatingRepo'

/**
 * DETERMINISTIC SEATING ALGORITHM V4
 * - Logic-first, no Math.random()
 * - Strict priorities
 * - Guarantee front-row fill
 * - Weekly deterministic rotation
 */

/**
 * 1. DETERMINISTIC PRNG (Mulberry32)
 * High-quality seedable random generator.
 * Replacing simple LCG for better distribution.
 */
function mulberry32(a) {
    return function () {
        var t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

/**
 * 2. WEEKLY SEED GENERATOR
 * Returns integer: YYYYWW (e.g., 202405)
 * Ensures consistency for the entire week.
 */
const getWeeklySeed = () => {
    const now = new Date()
    // ISO Week calculation or simple approx is fine for this use case
    // Using simple "Week of Year" logic
    const start = new Date(now.getFullYear(), 0, 1)
    const diff = now - start + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000)
    const oneWeek = 1000 * 60 * 60 * 24 * 7
    const weekNum = Math.floor(diff / oneWeek)

    return (now.getFullYear() * 100) + weekNum
}

/**
 * 3. SHUFFLE HELPER
 * Fisher-Yates shuffle using deterministic PRNG.
 */
const deterministicShuffle = (array, seed) => {
    const rng = mulberry32(seed)
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled
}

/**
 * 4. MAIN GENERATION FUNCTION
 */
export const generateSeatingPlan = (existingPlan = null, mode = 'free') => {
    const seed = getWeeklySeed()
    console.log(`[Algorithm] Generating for Seed: ${seed} (Week-Based)`)

    // A. Load Repo Data
    const allStudents = classRepo.getStudents()
    const conflicts = classRepo.listConflicts()
    const layout = seatingRepo.loadSetup()

    if (!allStudents || allStudents.length === 0) return { error: 'Öğrenci listesi boş.' }

    // B. Identify Pinned Seats (Respect Manual Locks)
    const assignments = {} // seatId -> studentId
    const pinnedSeatIds = existingPlan?.pinnedSeatIds ? new Set(existingPlan.pinnedSeatIds) : new Set()
    const placedStudentIds = new Set()

    // Re-hydrate pinned assignments if both seat and student still exist
    if (existingPlan?.assignments) {
        pinnedSeatIds.forEach(seatId => {
            const studentId = existingPlan.assignments[seatId]
            const studentExists = allStudents.some(s => s.id === studentId)

            // Note: We don't check if seat exists in *new* layout yet, but we will skip invalid pins during fill
            if (studentId && studentExists) {
                assignments[seatId] = studentId
                placedStudentIds.add(studentId)
            } else {
                pinnedSeatIds.delete(seatId)
            }
        })
    }

    // C. Prepare Unassigned Roster
    const pool = allStudents.filter(s => !placedStudentIds.has(s.id))

    // D. SORT & TIERING STRATEGY
    // 1. Sort base pool alphabetically (for consistent base state before shuffle)
    pool.sort((a, b) => (a.name || '').localeCompare(b.name || ''))

    // 2. Split into Tiers
    // Tier 1: Special Needs (Highest Priority)
    // Tier 2: Front Row Preferred
    // Tier 3: Standard
    const tierSpecial = []
    const tierFront = []
    const tierStandard = []

    pool.forEach(s => {
        // Safe access to profile properties
        const isSpecial = s._profile?.specialNeeds || (s._profile?.tags && s._profile.tags.length > 0) || false
        const isFrontPref = s._profile?.frontRowPreferred || false

        if (isSpecial) {
            tierSpecial.push(s)
        } else if (isFrontPref) {
            tierFront.push(s)
        } else {
            tierStandard.push(s)
        }
    })

    // E. ROTATION (Deterministic Shuffle per Tier)
    // We utilize the seed. To ensure different tiers don't sync up weirdly, we can offset seed.
    const readySpecial = deterministicShuffle(tierSpecial, seed + 1)
    const readyFront = deterministicShuffle(tierFront, seed + 2)
    const readyStandard = deterministicShuffle(tierStandard, seed + 3)

    // F. Final Priority Queue
    const distributionQueue = [
        ...readySpecial,
        ...readyFront,
        ...readyStandard
    ]

    // G. GENERATE DESK LAYOUT (Front-To-Back)
    // We create an ordered array of desks.
    const desks = []

    for (let r = 1; r <= layout.rows; r++) {
        for (let c = 1; c <= layout.cols; c++) {
            const deskId = `D-R${r}-C${c}`
            const isFront = r <= layout.frontRows

            const desk = {
                id: deskId,
                row: r,
                col: c,
                isFront,
                seats: []
            }

            if (layout.deskType === 'double') {
                desk.seats.push({ id: `R${r}-C${c}-L`, deskId })
                desk.seats.push({ id: `R${r}-C${c}-R`, deskId })
            } else {
                desk.seats.push({ id: `R${r}-C${c}`, deskId })
            }
            desks.push(desk)
        }
    }

    // Sort Desks: Strictly Row then Col (Front-Left to Back-Right)
    desks.sort((a, b) => {
        if (a.row !== b.row) return a.row - b.row
        return a.col - b.col
    })

    // H. PLACEMENT ENGINE

    // Helper: Conflict & Mode Check
    const checkCompatibility = (s1, s2) => {
        if (!s1 || !s2) return true

        // 1. HARD CONSTRAINT: Conflict List
        const hasConflict = conflicts.some(c =>
            (c.studentIdA === s1.id && c.studentIdB === s2.id) ||
            (c.studentIdA === s2.id && c.studentIdB === s1.id)
        )
        if (hasConflict) return false

        // 2. SOFT CONSTRAINT: Mode (Girl-Boy) - Not Hard, but we try to respect
        // For this strict algo request, we treat Conflict as HARD, but Gender as strict IF mode enabled
        // Goal: "NEVER force conflict". 
        // We will implement Mode logic in the selection heuristic, not blocking.
        // If mode is strict, return false? Let's assume Conflict is the ONLY hard constraint per prompt.
        // Prompt says "Double Desk Rule ... try to match non-conflict... conflict = HARD".
        // It does not emphasize gender mode. We focus on conflict.

        return true
    }

    // Fill Desks
    for (const desk of desks) {
        if (distributionQueue.length === 0) break

        const seats = desk.seats

        // --- CASE 1: Single Desk Layout ---
        if (seats.length === 1) {
            const sId = seats[0].id
            // If pinned, skip
            if (assignments[sId]) continue

            const student = distributionQueue.shift()
            assignments[sId] = student.id
            placedStudentIds.add(student.id)
            continue
        }

        // --- CASE 2: Double Desk Layout ---
        const leftId = seats[0].id
        const rightId = seats[1].id

        const pinnedL = assignments[leftId]
        const pinnedR = assignments[rightId]

        // If both pinned, nothing to do
        if (pinnedL && pinnedR) continue

        // If one pinned, fill the other
        if (pinnedL || pinnedR) {
            const fixedStudentId = pinnedL || pinnedR
            const targetSeatId = pinnedL ? rightId : leftId
            const fixedStudent = allStudents.find(s => s.id === fixedStudentId)

            // Try to find best partner
            let bestMatchIndex = -1

            for (let i = 0; i < distributionQueue.length; i++) {
                const candidate = distributionQueue[i]
                if (checkCompatibility(fixedStudent, candidate)) {
                    bestMatchIndex = i
                    break // Take first compatible (High priority)
                }
            }

            if (bestMatchIndex !== -1) {
                const chosen = distributionQueue.splice(bestMatchIndex, 1)[0]
                assignments[targetSeatId] = chosen.id
                placedStudentIds.add(chosen.id)
            } else {
                // If NO compatible partner found in entire list, leave empty
                // Per requirement: "Conflict = HARD constraint"
                // Better empty than conflict.
            }
            continue
        }

        // Neither pinned: Fill both
        if (distributionQueue.length === 0) break

        if (distributionQueue.length === 1) {
            // Only 1 left, place alone
            const s1 = distributionQueue.shift()
            assignments[leftId] = s1.id
            placedStudentIds.add(s1.id)
            continue
        }

        // Standard Pairing
        const s1 = distributionQueue.shift()

        // Find partner for s1
        let partnerIndex = -1

        for (let i = 0; i < distributionQueue.length; i++) {
            const candidate = distributionQueue[i]
            if (checkCompatibility(s1, candidate)) {
                partnerIndex = i
                break
            }
        }

        if (partnerIndex !== -1) {
            const s2 = distributionQueue.splice(partnerIndex, 1)[0]
            assignments[leftId] = s1.id
            assignments[rightId] = s2.id
            placedStudentIds.add(s1.id)
            placedStudentIds.add(s2.id)
        } else {
            // s1 splits with everyone? Place alone.
            assignments[leftId] = s1.id
            placedStudentIds.add(s1.id)
        }
    }


    // I. COMPILE RESULT
    // Re-generate seats list for UI consumption (flat list)
    const flatSeats = []
    desks.forEach(d => {
        d.seats.forEach(s => {
            flatSeats.push({
                ...s,
                row: d.row,
                col: d.col,
                isFront: d.isFront,
                position: d.seats.length === 1 ? 'single' : (s.id.endsWith('-L') ? 'left' : 'right')
            })
        })
    })

    const violations = validatePlan(assignments, flatSeats, allStudents, conflicts)

    return {
        id: Date.now(), // Unique ID for this run
        seed: seed,     // Store seed for reference
        createdAt: new Date().toISOString(),
        assignments,
        pinnedSeatIds: Array.from(pinnedSeatIds),
        manualMoves: existingPlan?.manualMoves || 0,
        seats: flatSeats,
        violations,
        stats: {
            placed: placedStudentIds.size,
            total: allStudents.length,
            conflicts: violations.length
        }
    }
}

/**
 * 5. VALIDATOR
 * Checks constraints on a generated/existing plan.
 */
export const validatePlan = (assignments, seats, roster, conflicts) => {
    const violations = []

    Object.entries(assignments).forEach(([seatId, studentId]) => {
        if (!studentId) return
        const student = roster.find(s => s.id === studentId)
        if (!student) return
        const seat = seats.find(s => s.id === seatId)
        if (!seat) return

        // Rule 1: Special Needs Front
        if (student._profile?.specialNeeds && !seat.isFront) {
            violations.push({
                type: 'specialNeeds',
                seatId,
                studentId,
                message: `${student.name} (Özel Durum) ön sırada olmalı.`
            })
        }

        // Rule 2: Conflicts
        // Only check double desk neighbors
        if (seatId.endsWith('-L')) {
            const rightId = seatId.replace('-L', '-R')
            const neighborId = assignments[rightId]
            if (neighborId) {
                const hasConflict = conflicts.some(c =>
                    (c.studentIdA === studentId && c.studentIdB === neighborId) ||
                    (c.studentIdA === neighborId && c.studentIdB === studentId)
                )
                if (hasConflict) {
                    violations.push({
                        type: 'conflict',
                        seatId,
                        message: `Çatışma algılandı: ${student.name}`
                    })
                }
            }
        }
    })

    return violations
}
