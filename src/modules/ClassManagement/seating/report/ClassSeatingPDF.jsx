import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

// === ROBUST FONT LOADING STRATEGY ===
// @react-pdf/renderer does NOT support CSS-style fallback chains like "Roboto, Helvetica"
// Solution: Register Roboto with fallback to Helvetica using same family name

let fontFamily = 'Roboto'

try {
    // Try to register Roboto from Google Fonts CDN
    Font.register({
        family: 'Roboto',
        fonts: [
            {
                src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf',
                fontWeight: 'normal'
            },
            {
                src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlvAx05IsDqlA.ttf',
                fontWeight: 'bold'
            }
        ]
    })
    console.log('✅ Roboto font loaded successfully')
} catch (error) {
    console.warn('⚠️ Roboto font loading failed, using Helvetica fallback:', error)
    // Use Helvetica (built-in PDF font, always available)
    fontFamily = 'Helvetica'
}

// === THEME CONFIG ===
const THEME = {
    primary: '#1E293B',      // Dark Navy (Text)
    accent: '#334155',       // Slightly Lighter Navy
    border: '#CBD5E1',       // Standard Border
    deskBg: '#F8FAFC',       // Very light gray/blue fill for desks
    deskBorder: '#E2E8F0',
    deskShadow: '#94A3B8',   // Darker gray for 3D bottom border
    boardBg: '#1E293B',      // Dark Smart Board
    badgeBg: '#E0F2FE',      // Light Blue for Number Badge
    badgeText: '#0369A1',    // Dark Blue for Number Text
    textDark: '#0F172A',
    textGray: '#64748B',
    white: '#FFFFFF'
}

const styles = StyleSheet.create({
    page: {
        padding: 0,
        fontFamily: fontFamily, // Dynamic: 'Roboto' or 'Helvetica'
        backgroundColor: '#FFFFFF'
    },
    // --- Layout 1: Scene Plan (Full Scale) ---

    // HEADER (Antet) - Optimized for readability across all devices
    headerContainer: {
        position: 'absolute',
        top: 20,
        left: 30,
        right: 30,
        height: 55,  // Increased for better spacing
        justifyContent: 'center',
        alignItems: 'center',
        borderBottom: `1pt solid ${THEME.border}`,
    },
    schoolName: {
        fontSize: 16,  // Increased from 13 for readability
        fontWeight: 'bold',
        color: THEME.textDark,
        textTransform: 'uppercase',
        marginBottom: 3
    },
    classNameTitle: {
        fontSize: 14,  // Increased from 10 for readability
        fontWeight: 'bold',
        color: THEME.accent,
        marginBottom: 3
    },
    metaRow: {
        flexDirection: 'row',
        gap: 15,
        alignItems: 'center'
    },
    metaText: {
        fontSize: 9,  // Increased from 7 for readability
        color: THEME.textGray,
        fontWeight: 'normal'
    },

    // Scene container - Balanced spacing
    sceneContainer: {
        marginTop: 80,  // Adjusted for header height
        flex: 1,
        paddingHorizontal: 30,
        paddingBottom: 15,
        alignItems: 'center',
    },

    // Scene Elements - Ultra-compact for 6-row support
    boardBar: {
        width: '50%',
        height: 10,  // Reduced from 12
        backgroundColor: THEME.boardBg,
        borderRadius: 4,
        marginBottom: 6,  // Reduced from 8
        alignItems: 'center',
        justifyContent: 'center',
    },
    boardLabel: {
        color: '#FFF',
        fontSize: 5,  // Reduced from 6
        fontWeight: 'bold',
        letterSpacing: 2
    },
    teacherDesk: {
        width: 85,   // Reduced from 90
        height: 30,  // Reduced from 35
        backgroundColor: '#F1F5F9',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: THEME.border,
        borderStyle: 'solid',
        borderBottomWidth: 3,
        borderBottomColor: '#CBD5E1',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15  // Reduced from 20
    },
    teacherLabel: {
        fontSize: 6,  // Reduced from 7
        color: THEME.textGray,
        fontWeight: 'bold',
        textTransform: 'uppercase'
    },

    // ARCHITECTURAL DOOR (Top-Left)
    doorArea: {
        position: 'absolute',
        top: 60, // Near the board/front row
        left: 30, // Far left
        width: 50,
        height: 50,
    },
    doorSwing: {
        width: 40,
        height: 40,
        borderTopLeftRadius: 40, // arc
        borderTopWidth: 2,
        borderLeftWidth: 2,
        borderColor: '#94A3B8', // Architectural Gray
        borderStyle: 'dashed'
    },
    doorLabel: {
        position: 'absolute',
        top: 15,
        left: 10,
        fontSize: 6,
        color: '#94A3B8',
        fontWeight: 'bold',
        transform: 'rotate(-45deg)'
    },

    row: {
        flexDirection: 'row',
        justifyContent: 'center'
    },

    // deskBox: The container for the desk (Single or Double)
    deskBox: {
        backgroundColor: THEME.deskBg, // Light Fill
        borderWidth: 1,
        borderColor: THEME.deskBorder,
        borderStyle: 'solid',
        borderRadius: 8, // Soft corners
        overflow: 'hidden',
        borderBottomWidth: 3, // 3D Effect
        borderBottomColor: THEME.deskShadow // Darker bottom
    },
    deskDouble: { flexDirection: 'row' },
    deskSingle: {},

    seat: {
        width: '50%',
        height: '100%',
        padding: 6,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
    },
    seatLeftBorder: {
        borderRightWidth: 1,
        borderRightColor: THEME.deskBorder,
        borderRightStyle: 'dashed'
    },

    // Clean Backgrounds
    bgEmpty: { opacity: 0.5 }, // Faded if empty
    bgNormal: { opacity: 1 },

    // Typography for Student Card
    badgeContainer: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: THEME.badgeBg,
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 4
    },
    studentNo: {
        fontSize: 7,
        color: THEME.badgeText,
        fontWeight: 'bold'
    },

    nameContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingTop: 6  // Reduced from 8
    },
    firstName: {
        fontWeight: 'bold',
        color: THEME.primary,
        textAlign: 'center',
        lineHeight: 1.0  // Reduced from 1.1 for tighter packing
    },
    lastName: {
        fontWeight: 'normal',
        color: THEME.textGray,
        textAlign: 'center',
        lineHeight: 1.0,  // Reduced from 1.1
        marginTop: 1      // Reduced from 2
    },

    // REMOVED REPORT-ONLY STYLES TO CLEANUP
})

// --- Components ---

// Dynamic font size calculator - special handling for long names
const calculateDynamicFontSize = (text, baseFontSize) => {
    if (!text) return baseFontSize

    const length = text.length

    // More aggressive for very long names (ABDULKADIR, etc.)
    if (length <= 8) return baseFontSize           // Short: full size
    if (length <= 10) return baseFontSize - 1      // Medium: -1pt
    if (length <= 14) return baseFontSize - 2      // Long: -2pt
    return Math.max(6, baseFontSize - 3)           // Very long: -3pt (min 6pt)
}

const Seat = ({ student, isDouble, side, fontSize }) => {
    const containerStyle = [styles.seat]
    if (isDouble) {
        containerStyle.push({ width: '50%' })
    } else {
        containerStyle.push({ width: '100%' })
    }

    if (isDouble && side === 'left') containerStyle.push(styles.seatLeftBorder)

    if (!student) {
        // Render Empty Seat
        return (
            <View style={[...containerStyle, styles.bgEmpty]}>
                {/* Optional: Add a very faint placeholder number or text if needed */}
            </View>
        )
    }

    containerStyle.push(styles.bgNormal)

    // Name Parsing
    const parts = (student.name || '').trim().split(' ')
    let firstName = student.name
    let lastName = ''

    if (parts.length > 1) {
        lastName = parts.pop()
        firstName = parts.join(' ')
    }

    // Calculate dynamic font sizes with less aggressive scaling
    const firstNameSize = calculateDynamicFontSize(firstName, fontSize)
    const lastNameSize = calculateDynamicFontSize(lastName, Math.max(7, fontSize - 1))

    return (
        <View style={containerStyle}>
            {/* Number Badge */}
            <View style={styles.badgeContainer}>
                <Text style={styles.studentNo}>
                    {student.schoolNo || student.no || ''}
                </Text>
            </View>

            <View style={styles.nameContainer}>
                <Text
                    style={[styles.firstName, { fontSize: firstNameSize, maxWidth: '95%' }]}
                    hyphenationCallback={(word) => [word]}
                >
                    {firstName}
                </Text>
                <Text
                    style={[styles.lastName, { fontSize: lastNameSize, maxWidth: '95%' }]}
                    hyphenationCallback={(word) => [word]}
                >
                    {lastName}
                </Text>
            </View>
        </View>
    )
}

const SceneGrid = ({ setup, assignments, students }) => {
    const rows = Array.from({ length: setup.rows }, (_, i) => i + 1)
    const cols = Array.from({ length: setup.cols }, (_, i) => i + 1)

    const studentMap = new Map(students.map(s => [s.id, s]))

    // === FINAL EXPERT SOLUTION - DYNAMIC ASPECT RATIO SYSTEM ===
    // A4 Landscape: 842 x 595 points
    // Responsive design: aspect ratio adapts to row count

    const rowCount = rows.length
    const colCount = cols.length
    const totalSeats = rowCount * colCount

    // Dynamic aspect ratio: 1.4:1 (square-ish) → 2.1:1 (landscape)
    // More rows = wider, shorter desks for vertical efficiency

    let MIN_DESK_W, MAX_DESK_W, MIN_DESK_H, MAX_DESK_H, GAP_X, GAP_Y, AVAIL_HEIGHT

    if (rowCount <= 3) {
        // TIER 1: Comfortable (1-3 rows)
        // Aspect ratio: ~1.43:1 (square-ish for premium look)
        MIN_DESK_W = 90
        MAX_DESK_W = 180
        MIN_DESK_H = 63   // 90/63 = 1.43
        MAX_DESK_H = 120
        GAP_X = 20
        GAP_Y = 18
        AVAIL_HEIGHT = 440
    } else if (rowCount <= 5) {
        // TIER 2: Balanced (4-5 rows)
        // Aspect ratio: ~1.83:1 (moderate landscape)
        MIN_DESK_W = 88
        MAX_DESK_W = 150
        MIN_DESK_H = 48   // 88/48 = 1.83
        MAX_DESK_H = 85
        GAP_X = 14
        GAP_Y = 12
        AVAIL_HEIGHT = 460
    } else {
        // TIER 3: Compact (6+ rows)
        // Aspect ratio: ~2.12:1 (full landscape for max efficiency)
        MIN_DESK_W = 85
        MAX_DESK_W = 140
        MIN_DESK_H = 40   // 85/40 = 2.12 - LANDSCAPE!
        MAX_DESK_H = 68
        GAP_X = 10
        GAP_Y = 8
        AVAIL_HEIGHT = 510  // Maximum vertical space
    }

    const isDouble = setup.deskType === 'double'

    let calcW = (780 - (colCount * GAP_X)) / colCount
    let calcH = (AVAIL_HEIGHT - (rowCount * GAP_Y)) / rowCount

    const finalW = Math.min(Math.max(calcW, MIN_DESK_W), MAX_DESK_W)
    const finalH = Math.min(Math.max(calcH, MIN_DESK_H), MAX_DESK_H)

    // Font scaling optimized for landscape desks
    const fontSizeName = Math.max(6, Math.min(12, finalH * 0.16))

    // Always use flex-start to prevent overflow
    const justifyMethod = 'flex-start'

    return (
        <View style={[styles.sceneContainer, { justifyContent: justifyMethod }]}>
            {/* BOARD */}
            <View style={styles.boardBar}>
                <Text style={styles.boardLabel}>AKILLI TAHTA</Text>
            </View>

            {/* TEACHER DESK */}
            <View style={styles.teacherDesk}>
                <Text style={styles.teacherLabel}>ÖĞRETMEN MASASI</Text>
            </View>

            {/* DOOR (Moved to Top Left area via absolute pos relative to scene container, but needs to be handled carefully) */}
            {/* Since sceneContainer centers items, absolute positioning might be tricky relative to dynamic width. */}
            {/* We will place it using the doorArea style which is absolute to the PAGE or relative to Container? */}
            {/* Let's keep it simple: Absolute inside the SceneContainer works if relative to it. */}
            <View style={styles.doorArea}>
                <View style={styles.doorSwing} />
                <Text style={styles.doorLabel}>KAPI</Text>
            </View>

            {rows.map(r => (
                <View key={r} style={[styles.row, { marginBottom: GAP_Y }]}>
                    {cols.map(c => {
                        const leftId = `R${r}-C${c}-L`
                        const rightId = `R${r}-C${c}-R`
                        const singleId = `R${r}-C${c}`

                        if (isDouble) {
                            return (
                                <View key={c} style={[styles.deskBox, styles.deskDouble, { width: finalW, height: finalH, marginHorizontal: GAP_X / 2 }]}>
                                    <Seat
                                        student={studentMap.get(assignments[leftId])}
                                        isDouble={true} side="left"
                                        fontSize={fontSizeName}
                                    />
                                    <Seat
                                        student={studentMap.get(assignments[rightId])}
                                        isDouble={true} side="right"
                                        fontSize={fontSizeName}
                                    />
                                </View>
                            )
                        } else {
                            return (
                                <View key={c} style={[styles.deskBox, styles.deskSingle, { width: finalW, height: finalH, marginHorizontal: GAP_X / 2 }]}>
                                    <Seat
                                        student={studentMap.get(assignments[singleId])}
                                        isDouble={false}
                                        fontSize={fontSizeName}
                                    />
                                </View>
                            )
                        }
                    })}
                </View>
            ))}
        </View>
    )
}

export const ClassSeatingPDF = ({ setup, assignments, students, reportData, violations, meta }) => {
    // Current date formatted DD.MM.YYYY
    const today = new Date().toLocaleDateString('tr-TR')

    // Fallbacks
    const schoolName = meta?.schoolName || '(OKUL ADI TANIMLANMADI)'
    const className = meta?.className || '(SINIF)'
    const teacherName = meta?.teacherName || '(Öğretmen Tanımlanmadı)'

    return (
        <Document>
            <Page size="A4" orientation="landscape" style={styles.page}>
                {/* Antet */}
                <View style={styles.headerContainer}>
                    <Text style={styles.schoolName}>{schoolName}</Text>
                    <Text style={styles.classNameTitle}>{className} SINIFI OTURMA PLANI</Text>
                    <View style={styles.metaRow}>
                        <Text style={styles.metaText}>Öğretmen: {teacherName}</Text>
                        <Text style={styles.metaText}>|</Text>
                        <Text style={styles.metaText}>Tarih: {today}</Text>
                    </View>
                </View>

                {/* Scene */}
                <SceneGrid
                    setup={setup}
                    assignments={assignments}
                    students={students}
                />
            </Page>
        </Document>
    )
}
