import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, Users, ChevronRight, School, Camera, FileText, Info, X } from 'lucide-react'
import InstitutionCard from '../components/InstitutionCard'

// Home Layout
export default function Home() {
    const [showOnboarding, setShowOnboarding] = useState(false)

    useEffect(() => {
        const seen = localStorage.getItem('bisinif_onboarding_seen')
        if (!seen) {
            setShowOnboarding(true)
        }
    }, [])

    const handleDismissOnboarding = () => {
        localStorage.setItem('bisinif_onboarding_seen', 'true')
        setShowOnboarding(false)
    }

    return (
        <div className="min-h-screen bg-[#F5F5F7] flex flex-col justify-center items-center p-6">
            <div className="w-full max-w-4xl animate-fade-in">

                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-sm mb-6">
                        <School className="w-8 h-8 text-blue-600" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-4">
                        BiSınıf
                    </h1>
                    <p className="text-xl text-gray-500 font-medium">
                        Bugün ne yapmak istiyorsun?
                    </p>
                </div>

                {/* İlk Açılış Bilgilendirme Kartı */}
                {showOnboarding && (
                    <div className="mb-6 bg-blue-50 border border-blue-200 rounded-2xl p-5 md:p-6 flex items-start gap-4 shadow-sm relative">
                        <button 
                            onClick={handleDismissOnboarding} 
                            className="absolute top-4 right-4 text-blue-400 hover:text-blue-600 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                            <Info className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-blue-900 mb-1.5">BiSınıf'a Hoş Geldiniz!</h3>
                            <p className="text-blue-800/80 text-sm leading-relaxed max-w-2xl">
                                Sistemi en verimli şekilde kullanmak için lütfen öncelikle aşağıdaki <span className="font-semibold text-blue-900">Kurum & Sınıf Bilgileri</span> kartını doldurun. 
                                Burada girdiğiniz veriler; Sınav Analizi, Evrak Yönetimi ve diğer tüm modüllerde otomatik olarak kullanılacak ve sizi tekrar tekrar form doldurmaktan kurtaracaktır.
                            </p>
                            <button 
                                onClick={handleDismissOnboarding} 
                                className="mt-3 text-sm font-semibold text-blue-700 hover:text-blue-900 transition-colors"
                            >
                                Anladım, gizle
                            </button>
                        </div>
                    </div>
                )}

                {/* Kurum & Sınıf Bilgileri — Merkezi Veri Girişi */}
                <div className="mb-10">
                    <InstitutionCard />
                </div>

                {/* Module Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">

                    {/* Card 1: Exam Analysis */}
                    <Link
                        to="/exams"
                        className="group relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <BarChart3 className="w-32 h-32" />
                        </div>

                        <div className="flex flex-col h-full">
                            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-blue-600 group-hover:scale-110 transition-transform duration-300">
                                <BarChart3 className="w-7 h-7" />
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Sınav Analizi
                            </h2>
                            <p className="text-gray-500 mb-8 flex-1">
                                PDF ve Excel raporları ile detaylı sınav analizi ve karne oluşturma.
                            </p>

                            <div className="flex items-center text-blue-600 font-semibold group-hover:translate-x-1 transition-transform">
                                Başla <ChevronRight className="w-5 h-5 ml-1" />
                            </div>
                        </div>
                    </Link>

                    {/* Card 2: Class Management */}
                    <Link
                        to="/class"
                        className="group relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Users className="w-32 h-32" />
                        </div>

                        <div className="flex flex-col h-full">
                            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 text-emerald-600 group-hover:scale-110 transition-transform duration-300">
                                <Users className="w-7 h-7" />
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Sınıf Yönetimi
                            </h2>
                            <p className="text-gray-500 mb-8 flex-1">
                                Oturma düzeni, öğrenci profilleri ve sınıf içi yönetim araçları.
                            </p>

                            <div className="flex items-center text-emerald-600 font-semibold group-hover:translate-x-1 transition-transform">
                                Yönet <ChevronRight className="w-5 h-5 ml-1" />
                            </div>
                        </div>
                    </Link>

                    {/* Card 3: Deneme Okut */}
                    <Link
                        to="/deneme-okut"
                        className="group relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Camera className="w-32 h-32" />
                        </div>

                        <div className="flex flex-col h-full">
                            <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 text-purple-600 group-hover:scale-110 transition-transform duration-300">
                                <Camera className="w-7 h-7" />
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Deneme Okut
                            </h2>
                            <p className="text-gray-500 mb-8 flex-1">
                                Optik form okuma ve hızlı deneme değerlendirme.
                            </p>

                            <div className="flex items-center text-purple-600 font-semibold group-hover:translate-x-1 transition-transform">
                                Başla <ChevronRight className="w-5 h-5 ml-1" />
                            </div>
                        </div>
                    </Link>

                    {/* Card 4: Documentation & Plans */}
                    <Link
                        to="/docs"
                        className="group relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <FileText className="w-32 h-32" />
                        </div>
                        <div className="absolute top-6 right-6">
                            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200 shadow-sm">YENİ</span>
                        </div>

                        <div className="flex flex-col h-full">
                            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 text-indigo-600 group-hover:scale-110 transition-transform duration-300">
                                <FileText className="w-7 h-7" />
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Evrak & Plan
                            </h2>
                            <p className="text-gray-500 mb-8 flex-1">
                                Tutanak, plan ve kontrol formlarını otomatik üretin ve yönetin.
                            </p>

                            <div className="flex items-center text-indigo-600 font-semibold group-hover:translate-x-1 transition-transform">
                                Oluştur <ChevronRight className="w-5 h-5 ml-1" />
                            </div>
                        </div>
                    </Link>

                </div>

                {/* Footer */}
                <p className="text-center text-gray-400 text-sm mt-12">
                    © 2026 BiSınıf · Tüm hakları saklıdır
                </p>

            </div>
        </div>
    )
}
