
import React, { useState, useEffect } from 'react'
import { FileText, Download, AlertCircle, Settings, ChevronRight } from 'lucide-react'
import { loadMeta } from '../storage/docsStorage'
import { generateDocx } from '../engine/docxGenerator'
import ContextEditorPanel from './ContextEditorPanel'
import InputModal from './InputModal'

const TemplateButtonsGrid = ({ templates = [], prefilledInputs = {} }) => {
    const [meta, setMeta] = useState({})

    // Status state
    const [generatingId, setGeneratingId] = useState(null)
    const [error, setError] = useState(null)
    const [missingReqs, setMissingReqs] = useState([]) // For alert

    // UI State
    const [isEditorOpen, setIsEditorOpen] = useState(false)
    const [activeTemplate, setActiveTemplate] = useState(null) // Template waiting for input

    // Load meta on mount and listen for storage changes
    useEffect(() => {
        const updateMeta = () => setMeta(loadMeta() || {})
        updateMeta()

        window.addEventListener('storage', updateMeta)
        return () => window.removeEventListener('storage', updateMeta)
    }, [])

    // Helper: Check requirements
    const checkRequirements = (template) => {
        const missing = []
        if (!template.requiredFields) return []

        template.requiredFields.forEach(field => {
            if (!meta[field] || meta[field].trim() === '') {
                if (field === 'schoolName') missing.push('Okul')
                if (field === 'className') missing.push('Sınıf')
                if (field === 'teacherName') missing.push('Öğretmen')
            }
        })
        return missing
    }

    // A. Initial Click Handler
    const handleTemplateClick = (template) => {
        // 1. Check requirements
        const missing = checkRequirements(template)
        if (missing.length > 0) {
            setMissingReqs(missing)
            setIsEditorOpen(true)
            return
        }

        // 2. Check for optional inputs (e.g. studentName)
        if (template.optionalInputs && template.optionalInputs.length > 0) {
            setActiveTemplate(template) // Trigger InputModal
        } else {
            // 3. Proceed directly
            executeDownload(template, {})
        }
    }

    // B. Execute Generation (with optional inputs)
    const executeDownload = async (template, extraData) => {
        try {
            setGeneratingId(template.id)
            setError(null)

            // Artificial delay for UX
            await new Promise(r => setTimeout(r, 500))

            // Load Engine & Generate
            await generateDocx(template, {
                schoolName: meta.schoolName || '___________',
                className: meta.className || '___________',
                teacherName: meta.teacherName || '___________',
                ...meta,
                ...extraData
            })

        } catch (err) {
            console.error(err)
            setError('Şablon oluşturulurken bir hata oluştu.')
        } finally {
            setGeneratingId(null)
        }
    }

    // C. Modal Confirm Handler
    const handleInputConfirm = (data) => {
        if (!activeTemplate) return
        executeDownload(activeTemplate, data)
        setActiveTemplate(null)
    }

    if (!templates || templates.length === 0) {
        return (
            <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-100 text-gray-400 border-dashed">
                Bu kategoride şablon bulunamadı.
            </div>
        )
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                {templates.map((template) => {
                    const isGenerating = generatingId === template.id
                    const missing = checkRequirements(template)
                    const isReady = missing.length === 0

                    return (
                        <button
                            key={template.id}
                            onClick={() => handleTemplateClick(template)}
                            disabled={isGenerating}
                            className={`
                                group relative w-full text-left p-4 rounded-xl border transition-all duration-200
                                ${isGenerating
                                    ? 'bg-blue-50 border-blue-200'
                                    : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5'
                                }
                            `}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className={`font-bold text-base ${isGenerating ? 'text-blue-700' : 'text-gray-900 group-hover:text-blue-700'}`}>
                                            {template.title}
                                        </h3>
                                        {!isReady && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700">
                                                Eksik Bilgi
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 line-clamp-1 group-hover:text-gray-600">
                                        {template.description}
                                    </p>
                                </div>

                                <div className={`
                                    w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors
                                    ${isGenerating
                                        ? 'bg-blue-100 text-blue-600'
                                        : 'bg-gray-50 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600'
                                    }
                                `}>
                                    {isGenerating ? (
                                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        isReady ? <Download className="w-4 h-4" /> : <Settings className="w-4 h-4 text-orange-400" />
                                    )}
                                </div>
                            </div>
                        </button>
                    )
                })}
            </div>

            {error && (
                <div className="mt-4 bg-red-50 p-3 rounded-lg text-red-600 text-sm text-center border border-red-100 flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            {/* Shared Context Editor */}
            <ContextEditorPanel
                isOpen={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
            />

            {/* Template Input Modal */}
            <InputModal
                isOpen={!!activeTemplate}
                onClose={() => setActiveTemplate(null)}
                onConfirm={handleInputConfirm}
                inputs={activeTemplate?.optionalInputs || []}
                requiredInputs={activeTemplate?.requiredInputs || []}
                title={activeTemplate?.title}
                defaults={prefilledInputs}
            />
        </>
    )
}

export default TemplateButtonsGrid
