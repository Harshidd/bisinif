
import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, ChevronRight, FileText, Pencil, Plus } from 'lucide-react'
import { loadMeta } from '../storage/docsStorage'
import ContextEditorPanel from './ContextEditorPanel'

const PAGE_TITLES = {
    'discipline': 'Disiplin',
    'committee': 'Zümre',
    'plans': 'Planlar',
    'homework': 'Ödevlendirme',
    'performance-project': 'Performans / Proje'
}

const DocsHeader = () => {
    const location = useLocation()
    const [metaDisplay, setMetaDisplay] = useState(null)
    const [isEditorOpen, setIsEditorOpen] = useState(false)

    // Load Meta for Display
    const updateHeaderMeta = () => {
        const meta = loadMeta() || {}
        const parts = [
            meta.schoolName,
            meta.className ? `Sınıf: ${meta.className}` : null,
            meta.teacherName
        ]
            .filter(Boolean)
            .map(s => s.trim())
            .filter(s => s.length > 0)

        if (parts.length > 0) {
            setMetaDisplay(parts.join(' · '))
        } else {
            setMetaDisplay(null)
        }
    }

    useEffect(() => {
        updateHeaderMeta()
        // Listen to storage changes to update header immediately after edit
        window.addEventListener('storage', updateHeaderMeta)
        return () => window.removeEventListener('storage', updateHeaderMeta)
    }, [location])

    // Route Logic
    const isDocsRoot = location.pathname === '/docs' || location.pathname === '/docs/'
    const currentPath = location.pathname.split('/').pop()
    const subPageTitle = PAGE_TITLES[currentPath]

    return (
        <>
            <header className="max-w-6xl mx-auto mb-6 z-50 relative">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">

                    {/* Left: Navigation Area */}
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full sm:w-auto">

                        {/* 1. App Home (Start) */}
                        <Link
                            to="/"
                            className="flex items-center text-gray-600 bg-white hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-xl border border-gray-200 shadow-sm transition-all active:scale-95 group font-medium text-sm"
                            title="Uygulama Ana Sayfası"
                        >
                            <Home className="w-4 h-4 mr-2 group-hover:text-blue-600 transition-colors" />
                            Ana Sayfa
                        </Link>

                        <ChevronRight className="w-4 h-4 text-gray-300" />

                        {/* 2. Module Root (Hub) - Active Context */}
                        <Link
                            to="/docs"
                            className={`
                                flex items-center px-3 py-2 rounded-xl border shadow-sm transition-all active:scale-95 text-sm
                                ${isDocsRoot
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold cursor-default pointer-events-none'
                                    : 'bg-white text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 border-gray-200'
                                }
                            `}
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            Evrak & Plan
                        </Link>

                        {/* 3. Subpage Breadcrumb (Only if deep) */}
                        {subPageTitle && (
                            <>
                                <ChevronRight className="w-4 h-4 text-gray-300" />
                                <span className="flex items-center px-3 py-2 rounded-xl bg-gray-50 text-gray-900 border border-gray-200 font-medium text-sm cursor-default">
                                    {subPageTitle}
                                </span>
                            </>
                        )}

                    </div>

                    {/* Right: Class Meta Info + Editor Trigger */}
                    <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 justify-end">
                        {metaDisplay && (
                            <span className="hidden md:flex text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm bg-white text-gray-600 items-center gap-2 transition-colors">
                                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                                {metaDisplay}
                            </span>
                        )}

                        <button
                            onClick={() => setIsEditorOpen(true)}
                            className={`
                                flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all active:scale-95 shadow-sm border
                                ${!metaDisplay
                                    ? 'bg-blue-600 text-white hover:bg-blue-700 border-blue-500 shadow-blue-200'
                                    : 'bg-white text-gray-600 hover:text-blue-600 hover:bg-blue-50 border-gray-200'
                                }
                            `}
                            title="Belge bağlamını düzenle"
                        >
                            {/* !metaDisplay ? 'Sınıf Bilgilerini Gir' : 'Pencil Icon Only' */}
                            {!metaDisplay ? (
                                <>
                                    <Plus className="w-4 h-4" />
                                    <span>Sınıf Bilgilerini Gir</span>
                                </>
                            ) : (
                                <Pencil className="w-4 h-4" />
                            )}
                        </button>
                    </div>

                </div>
            </header>

            {/* Context Editor Panel */}
            <ContextEditorPanel
                isOpen={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                onUpdate={updateHeaderMeta}
            />
        </>
    )
}

export default DocsHeader
