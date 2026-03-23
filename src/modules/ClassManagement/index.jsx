import React, { useState, useEffect } from 'react'
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom'
import { ArrowLeft, Users, LayoutDashboard, TableProperties, Database, History, PieChart } from 'lucide-react'
import StudentList from './pages/StudentList'
import RosterPage from './pages/RosterPage'
import SeatingGeneratePage from './seating/pages/SeatingGeneratePage'
import SeatingHistoryPage from './seating/pages/SeatingHistoryPage'
import SeatingAnalyticsPage from './seating/pages/SeatingAnalyticsPage'
import BackupPage from './backup/BackupPage'
import ClassSettingsPage from './pages/ClassSettingsPage'
import { Routes, Route } from 'react-router-dom'
import { Settings } from 'lucide-react'
import InstitutionBanner from '../../components/InstitutionBanner'

import { loadMeta } from './storage/classStorage'
import { AlertTriangle } from 'lucide-react'

// Placeholder Dashboard
const ClassDashboard = () => {
    const [missingInfo, setMissingInfo] = useState(false)

    useEffect(() => {
        const meta = loadMeta() || {}
        if (!meta.schoolName || !meta.className) {
            setMissingInfo(true)
        }
    }, [])

    return (
        <div className="space-y-6 animate-fade-in">

            {/* Onboarding Banner */}
            {missingInfo && (
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-center justify-between shadow-sm animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-3 text-orange-800">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm">Sınıf Bilgileri Eksik</h4>
                            <p className="text-xs opacity-90">Rapor çıktılarında görünmesi için okul ve sınıf bilgilerinizi tanımlayın.</p>
                        </div>
                    </div>
                    <Link
                        to="settings"
                        className="px-4 py-2 bg-white border border-orange-200 text-orange-700 text-sm font-semibold rounded-xl hover:bg-orange-100 transition-colors shadow-sm"
                    >
                        Ayarları Tamamla
                    </Link>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* 1. Roster */}
                <Link
                    to="roster"
                    className="group block p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all"
                >
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl inline-flex mb-4 group-hover:scale-110 transition-transform">
                        <TableProperties className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Sınıf Listesi (Roster)</h3>
                    <p className="text-sm text-gray-500">
                        Ana öğrenci listesini yönetin, Excel'den toplu içe aktarın.
                    </p>
                </Link>

                {/* 2. Seating Plan */}
                <Link
                    to="seating"
                    className="group block p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all"
                >
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-xl inline-flex mb-4 group-hover:scale-110 transition-transform">
                        <LayoutDashboard className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Oturma Planı</h3>
                    <p className="text-sm text-gray-500">
                        Otomatik veya manuel yerleşim ile sınıf düzeni oluşturun.
                    </p>
                </Link>

                {/* 3. History */}
                <Link
                    to="seating/history"
                    className="group block p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all"
                >
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl inline-flex mb-4 group-hover:scale-110 transition-transform">
                        <History className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Plan Geçmişi</h3>
                    <p className="text-sm text-gray-500">
                        Oluşturulan eski planlara göz atın ve geri yükleyin.
                    </p>
                </Link>

                {/* 4. Analytics */}
                <Link
                    to="seating/analytics"
                    className="group block p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-teal-200 transition-all"
                >
                    <div className="p-3 bg-teal-50 text-teal-600 rounded-xl inline-flex mb-4 group-hover:scale-110 transition-transform">
                        <PieChart className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Analiz</h3>
                    <p className="text-sm text-gray-500">
                        Oturma düzeni analizlerini ve istatistikleri inceleyin.
                    </p>
                </Link>

                {/* 5. Settings */}
                <Link
                    to="settings"
                    className="group block p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all"
                >
                    <div className="p-3 bg-slate-50 text-slate-600 rounded-xl inline-flex mb-4 group-hover:scale-110 transition-transform">
                        <Settings className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Sınıf Ayarları</h3>
                    <p className="text-sm text-gray-500">
                        Okul adı, öğretmen bilgisi ve genel tanımlamaları güncelleyin.
                    </p>
                </Link>

                {/* 6. Backup -> ZORUNLU */}
                <Link
                    to="settings/backup"
                    className="group block p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all"
                >
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl inline-flex mb-4 group-hover:scale-110 transition-transform">
                        <Database className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Yedekleme</h3>
                    <p className="text-sm text-gray-500">
                        Verilerinizi yedekleyin, dışa aktarın veya geri yükleyin.
                    </p>
                </Link>

            </div>
        </div>
    )
}

import ClassHeader from './components/ClassHeader'

export default function ClassManagement() {
    const location = useLocation()

    return (
        <div className="min-h-screen bg-[#F5F5F7] p-6 font-sans">
            <ClassHeader title="Sınıf Yönetimi" />
            <InstitutionBanner />

            <main className="max-w-6xl mx-auto">
                <Routes>
                    <Route path="/" element={<ClassDashboard />} />
                    <Route path="students" element={<StudentList />} />
                    <Route path="roster" element={<RosterPage />} />
                    <Route path="seating" element={<SeatingGeneratePage />} />
                    <Route path="seating/history" element={<SeatingHistoryPage />} />
                    <Route path="seating/analytics" element={<SeatingAnalyticsPage />} />
                    <Route path="settings" element={<ClassSettingsPage />} />
                    <Route path="settings/backup" element={<BackupPage />} />
                </Routes>
            </main>
        </div>
    )
}
