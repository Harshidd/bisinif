import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'

// Pages & Modules (Lazy)
import { createLazyRoute } from './core/routing/lazy'

const Home = createLazyRoute(() => import('./pages/Home'))
const ExamAnalysis = createLazyRoute(() => import('./modules/ExamAnalysis'))
const ClassManagement = createLazyRoute(() => import('./modules/ClassManagement'))
const Docs = createLazyRoute(() => import('./modules/Docs'))

function App() {
  return (
    <Router>
      <Routes>
        {/* Module Selection Home */}
        <Route path="/" element={<Home />} />

        {/* Exam Analysis Module */}
        <Route path="/exams/*" element={<ExamAnalysis />} />

        {/* Class Management Module */}
        <Route path="/class/*" element={<ClassManagement />} />

        {/* Docs Module (NEW) */}
        <Route path="/docs/*" element={<Docs />} />


        {/* Redirects for legacy users if any specific subroutes existed, though mostly it was root */}
        <Route path="/analiz" element={<Navigate to="/exams" replace />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
