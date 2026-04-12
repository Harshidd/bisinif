import React from 'react'
import { CalendarDays, Clock } from 'lucide-react'

const PlansDocsPage = () => {
    return (
        <div className="space-y-8 animate-fade-in pb-12">
            <div className="bg-white p-12 rounded-3xl border border-gray-100 shadow-sm text-center">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <CalendarDays className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Planlar</h1>
                <p className="text-gray-500 max-w-md mx-auto mb-8">
                    Yıllık ve günlük plan akışları yeni pratik arayüzle yakında eklenecektir.
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-400 rounded-xl text-sm font-medium border border-gray-100 italic">
                    <Clock className="w-4 h-4" />
                    Yakında Yayında
                </div>
            </div>
        </div>
    )
}

export default PlansDocsPage
