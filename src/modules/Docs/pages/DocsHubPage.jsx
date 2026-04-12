import React from 'react'
import { Link } from 'react-router-dom'
import {
    FileText,
    ShieldAlert,
    CalendarDays,
    ArrowRight
} from 'lucide-react'

const DocsHubPage = () => {
    return (
        <div className="animate-fade-in pb-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <section className="lg:col-span-2 bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-amber-50">
                        <div className="flex items-center gap-3">
                            <span className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                                <FileText className="w-5 h-5" />
                            </span>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Aktif Alan</p>
                                <h1 className="text-xl font-bold text-gray-900">Belgeler</h1>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-4">
                            Şu anda yalnızca hazır belge üretimi açık. Yeni belge türleri bu alana kontrollü şekilde eklenecek.
                        </p>
                    </div>

                    <div className="p-6">
                        <Link
                            to="discipline"
                            className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-red-100 bg-red-50/40 hover:bg-red-50 hover:border-red-200 transition-all"
                        >
                            <div className="flex items-start gap-4">
                                <span className="w-11 h-11 rounded-xl bg-white text-red-600 flex items-center justify-center border border-red-100 shadow-sm">
                                    <ShieldAlert className="w-5 h-5" />
                                </span>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Disiplin Tutanakları</h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Öğrenci davranışları ve olay tutanakları için mevcut belge alanı.
                                    </p>
                                </div>
                            </div>
                            <span className="inline-flex items-center gap-2 text-sm font-semibold text-red-700 group-hover:gap-3 transition-all">
                                Aç
                                <ArrowRight className="w-4 h-4" />
                            </span>
                        </Link>
                    </div>
                </section>

                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center">
                            <CalendarDays className="w-5 h-5" />
                        </span>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Yakında</p>
                            <h2 className="text-xl font-bold text-gray-900">Planlar</h2>
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-4">
                        Plan hazırlama akışları bu aşamada aktif değil. Bu alan sonraki geliştirme için ayrıldı.
                    </p>
                    <div className="mt-6 inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-50 text-gray-400 text-sm font-medium border border-gray-100">
                        Aktif değil
                    </div>
                </section>
            </div>
        </div>
    )
}

export default DocsHubPage
