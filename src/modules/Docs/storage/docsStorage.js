
// Docs Module Storage Access
// Manages Docs-owned context (independent of global class selection)
// SSOT: src/core/storage/docsKeys.js

import { DOCS_KEYS } from '../../../core/storage/docsKeys'
import { KEY_MAP } from '../../../core/storage/classKeys'

const KEYS = {
    // Primary: Docs-owned context
    DOCS_CONTEXT: DOCS_KEYS.CONTEXT,

    // Docs-local discipline draft
    DISCIPLINE_DRAFT: 'bisinif.docs.disciplineDraft.v1',

    // Docs-local parent meeting draft
    PARENT_MEETING_DRAFT: 'bisinif.docs.parentMeetingDraft.v1',

    // Docs-local duty incident draft
    DUTY_INCIDENT_DRAFT: 'bisinif.docs.dutyIncidentDraft.v1',

    // Docs-local homework assignment draft
    HOMEWORK_ASSIGNMENT_DRAFT: 'bisinif.docs.homeworkAssignmentDraft.v1',

    // Docs-local performance/project evaluation draft
    PERFORMANCE_PROJECT_DRAFT: 'bisinif.docs.performanceProjectDraft.v1',

    // Fallback/Import Source: Global ClassManagement meta
    // Used ONLY for "Import from Class" action, never auto-sync
    GLOBAL_META: KEY_MAP.META
}

// Read helper with error handling
const readStorage = (key, defaultValue) => {
    try {
        if (typeof window === 'undefined') return defaultValue
        const raw = localStorage.getItem(key)
        if (!raw) return defaultValue
        return JSON.parse(raw)
    } catch (error) {
        console.warn(`[DocsStorage] Failed to read ${key}:`, error)
        return defaultValue
    }
}

// Write helper with event dispatch for reactivity
const writeStorage = (key, value) => {
    try {
        const serialized = JSON.stringify(value)
        localStorage.setItem(key, serialized)

        // Dispatch storage event for cross-tab/local updates
        window.dispatchEvent(new Event('storage'))
        return true
    } catch (error) {
        console.warn(`[DocsStorage] Failed to write ${key}:`, error)
        return false
    }
}

// 1. Load Docs Context (Primary)
export const loadMeta = () => readStorage(KEYS.DOCS_CONTEXT, {})

// 2. Save Docs Context (Docs ONLY)
export const saveMeta = (meta) => writeStorage(KEYS.DOCS_CONTEXT, meta)

// 2b. Discipline draft (Docs ONLY)
export const loadDisciplineDraft = () => readStorage(KEYS.DISCIPLINE_DRAFT, null)

export const saveDisciplineDraft = (draft) => writeStorage(KEYS.DISCIPLINE_DRAFT, {
    ...draft,
    savedAt: new Date().toISOString()
})

export const loadParentMeetingDraft = () => readStorage(KEYS.PARENT_MEETING_DRAFT, null)

export const saveParentMeetingDraft = (draft) => writeStorage(KEYS.PARENT_MEETING_DRAFT, {
    ...draft,
    savedAt: new Date().toISOString()
})

export const loadDutyIncidentDraft = () => readStorage(KEYS.DUTY_INCIDENT_DRAFT, null)

export const saveDutyIncidentDraft = (draft) => writeStorage(KEYS.DUTY_INCIDENT_DRAFT, {
    ...draft,
    savedAt: new Date().toISOString()
})

export const loadHomeworkAssignmentDraft = () => readStorage(KEYS.HOMEWORK_ASSIGNMENT_DRAFT, null)

export const saveHomeworkAssignmentDraft = (draft) => writeStorage(KEYS.HOMEWORK_ASSIGNMENT_DRAFT, {
    ...draft,
    savedAt: new Date().toISOString()
})

export const loadPerformanceProjectDraft = () => readStorage(KEYS.PERFORMANCE_PROJECT_DRAFT, null)

export const savePerformanceProjectDraft = (draft) => writeStorage(KEYS.PERFORMANCE_PROJECT_DRAFT, {
    ...draft,
    savedAt: new Date().toISOString()
})

// 3. Import from Global (One-time action)
// Copies current ClassManagement metadata into Docs context
export const importGlobalMeta = () => {
    const globalMeta = readStorage(KEYS.GLOBAL_META, {})
    // Only copy relevant fields to avoid pollution
    const cleanMeta = {
        schoolName: globalMeta.schoolName || '',
        className: globalMeta.className || '',
        teacherName: globalMeta.teacherName || '',
        year: globalMeta.year || '',
        term: globalMeta.term || ''
    }
    return saveMeta(cleanMeta)
}

// 4. Helper: Check if global has valid data to import
export const hasGlobalMeta = () => {
    const globalMeta = readStorage(KEYS.GLOBAL_META, {})
    return !!(globalMeta.schoolName && globalMeta.className)
}
