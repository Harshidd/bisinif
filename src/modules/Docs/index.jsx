
import React from 'react'
import { Routes, Route } from 'react-router-dom'
import DocsHeader from './components/DocsHeader'
import DocsHubPage from './pages/DocsHubPage'
import DisciplineDocsPage from './pages/DisciplineDocsPage'
import CommitteeDocsPage from './pages/CommitteeDocsPage'
import PlansDocsPage from './pages/PlansDocsPage'
import HomeworkDocsPage from './pages/HomeworkDocsPage'

export default function Docs() {
    return (
        <div className="min-h-screen bg-[#F5F5F7] p-6 font-sans">
            <DocsHeader />
            <main className="max-w-6xl mx-auto">
                <Routes>
                    <Route path="/" element={<DocsHubPage />} />
                    <Route path="discipline" element={<DisciplineDocsPage />} />
                    <Route path="committee" element={<CommitteeDocsPage />} />
                    <Route path="plans" element={<PlansDocsPage />} />
                    <Route path="homework" element={<HomeworkDocsPage />} />
                </Routes>
            </main>
        </div>
    )
}
