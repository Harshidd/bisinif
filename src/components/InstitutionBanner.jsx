import React from 'react';
import { Building2, MapPin, User, GraduationCap } from 'lucide-react';
import { loadInstitution } from '../storage/institutionStore';

/**
 * Merkeze girilmiş kurum verilerini tüm modüllerin üst bilgisinde göstermek için
 * kullanılan ortak read-only gösterim bandı.
 */
export default function InstitutionBanner() {
    const inst = loadInstitution();
    
    // Eğer temel bilgiler girilmediyse bandı göstermeyebiliriz veya sade gösterebiliriz.
    // Ancak her modülde bağlam vermek istendiği için gösterelim.
    if (!inst || (!inst.okulAdi && !inst.il && !inst.sinif)) {
        return null; // Hiç veri yoksa gösterme
    }

    const location = [inst.il, inst.ilce].filter(Boolean).join(' / ');
    const classInfo = [inst.sinif, inst.sube ? `${inst.sube} Şubesi` : ''].filter(Boolean).join(' - ');

    return (
        <div className="bg-slate-50 border-b border-gray-300 px-4 py-1 sm:px-6 lg:px-8 mb-4 shadow-sm flex items-center justify-between gap-4 min-h-[40px]">
            <div className="flex items-center gap-2">
                <div className="text-amber-700">
                    <Building2 className="w-4 h-4" />
                </div>
                <div className="flex items-baseline gap-2">
                    <h2 className="text-sm font-bold text-slate-800 tracking-tight leading-none">
                        {inst.okulAdi || 'Okul Adı Girilmedi'}
                    </h2>
                    {location && (
                        <span className="text-[11px] text-slate-500 hidden sm:inline-block leading-none">
                            — {location}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-4">
                {(inst.mudurAdi || inst.ogretmenAdi) && (
                    <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-600">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>
                            {[inst.mudurAdi, inst.ogretmenAdi].filter(Boolean).join(' • ')}
                        </span>
                    </div>
                )}

                {classInfo && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-bold">{classInfo}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
