
import React, { useState, useEffect } from 'react'
import { FileText, Download, AlertCircle, Settings } from 'lucide-react'
import { TEMPLATES } from '../templates/registry'
import { loadMeta } from '../storage/docsStorage'
import { generateDocx } from '../engine/docxGenerator'
import ContextEditorPanel from './ContextEditorPanel'
import InputModal from './InputModal'

const TemplateList = ({ category, prefilledInputs = {} }) => {
    // 1. Get templates for this category
    const templates = TEMPLATES.filter(t => t.category === category)
    const [meta, setMeta] = useState({})

    // Status state
    const [generatingId, setGeneratingId] = useState(null)
    const [error, setError] = useState(null)

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
                // Map field names to human readable - Concise keys
                if (field === 'schoolName') missing.push('Okul')
                if (field === 'className') missing.push('Sınıf')
                if (field === 'teacherName') missing.push('Öğretmen')
            }
        })
        return missing
    }

    // A. Initial Click Handler
    const handleDownloadClick = (template) => {
        // Check for optional inputs (e.g. studentName)
        if (template.optionalInputs && template.optionalInputs.length > 0) {
            setActiveTemplate(template) // Trigger InputModal
        } else {
            // Proceed directly
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
            // Merge meta + extraData
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

    if (templates.length === 0) {
        return (
            <div className="p-8 text-center bg-white rounded-2xl border border-gray-100 text-center text-gray-400">
                Bu kategoride henüz şablon bulunmuyor.
            </div>
        )
    }

    return (
        <>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in">

                {/* Capabilities Chips REMOVED from top */}

                <div className="divide-y divide-gray-100">
                    {templates.map((template) => {
                        const missingFields = checkRequirements(template)
                        const isReady = missingFields.length === 0
                        const isGenerating = generatingId === template.id

                        return (
                            <div key={template.id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:bg-gray-50 transition-colors">
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                                        {template.title}
                                    </h4>
                                    <p className="text-sm text-gray-500 mb-2">
                                        {template.description}
                                    </p>

                                    {/* Status Tags */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                                            DOCX
                                        </span>

                                        {!isReady && (
                                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-100 flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" />
                                                Eksik: {missingFields.join(', ')}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    {/* Helper Action for Missing Fields */}
                                    {!isReady && (
                                        <button
                                            onClick={() => setIsEditorOpen(true)}
                                            className="px-3 py-2 text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-100 rounded-xl transition-colors w-full sm:w-auto flex items-center justify-center gap-1"
                                            title="Eksik bilgileri tamamla"
                                        >
                                            <Settings className="w-3.5 h-3.5" />
                                            Tamamla
                                        </button>
                                    )}

                                    {/* Word Button (Primary) */}
                                    <button
                                        onClick={() => handleDownloadClick(template)}
                                        disabled={!isReady || isGenerating}
                                        className={`
                                            px-4 py-2 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all w-full sm:w-auto shadow-sm
                                            ${isReady
                                                ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 hidden sm:flex'
                                            }
                                        `}
                                        title={isReady ? "Word dosyasını indir" : "Eksik bilgileri tamamlayın"}
                                    >
                                        {isGenerating ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Hazırlanıyor...
                                            </>
                                        ) : (
                                            <>
                                                <Download className="w-4 h-4" />
                                                Word İndir
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {error && (
                    <div className="bg-red-50 p-3 text-red-600 text-sm text-center border-t border-red-100">
                        {error}
                    </div>
                )}
            </div>

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

export default TemplateList
