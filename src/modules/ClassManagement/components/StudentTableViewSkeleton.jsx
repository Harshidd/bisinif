import React from 'react'
import { MessageCircle, Zap, ShieldAlert } from 'lucide-react'

// Bu component kart görünümünden tablo görünümüne geçiş için bir prototiptir.
// Gerçek veri bağlaması ve tam yetenekler sonraki adımda eklenecektir.
export default function StudentTableViewSkeleton({ students }) {
    if (!students || students.length === 0) return null

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-fade-in">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                            <th className="py-3 px-4 w-16 font-semibold">No</th>
                            <th className="py-3 px-4 font-semibold">Ad Soyad</th>
                            <th className="py-3 px-4 w-32 font-semibold text-center">Konuşkanlık</th>
                            <th className="py-3 px-4 w-32 font-semibold text-center">Dikkat</th>
                            <th className="py-3 px-4 w-32 font-semibold text-center">Disiplin</th>
                            <th className="py-3 px-4 font-semibold">Notlar</th>
                            <th className="py-3 px-4 w-28 text-right font-semibold">Kısıtlamalar</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {students.map(student => {
                            const profile = student._profile || {}
                            return (
                                <tr key={student.id} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="py-3 px-4 text-sm text-gray-500 font-mono">
                                        {student.no || '-'}
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="font-bold text-gray-900 text-sm">{student.name || student.fullName || '-'}</div>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <div className="flex justify-center items-center gap-1">
                                            <MessageCircle className="w-4 h-4 text-amber-500" />
                                            <span className="text-xs font-semibold">{profile.talkativeness || 0}/5</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <div className="flex justify-center items-center gap-1">
                                            <Zap className="w-4 h-4 text-emerald-500" />
                                            <span className="text-xs font-semibold">{profile.attention || 0}/5</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <div className="flex justify-center items-center gap-1">
                                            <ShieldAlert className="w-4 h-4 text-red-500" />
                                            <span className="text-xs font-semibold">{profile.disciplineRisk || 0}/3</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-xs text-gray-400 italic">
                                        <span className="line-clamp-1">{profile.notes || '(Not yok)'}</span>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <button disabled className="text-xs bg-gray-100 text-gray-400 px-2 py-1 rounded opacity-50 cursor-not-allowed">
                                            Devre Dışı
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
            {/* Footer */}
            <div className="px-4 py-3 bg-gray-50/30 border-t border-gray-100 text-xs text-gray-500 font-medium">
                Bu görünüm test aşamasındadır. Veriler sadece okunabilir durumdadır.
            </div>
        </div>
    )
}
