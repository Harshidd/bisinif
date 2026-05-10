import React from 'react';
import { Building2, MapPin, User, GraduationCap, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { loadInstitution } from '../storage/institutionStore';

const CRITICAL_FIELDS = [
    { key: 'okulAdi',     label: 'Okul Adı' },
    { key: 'mudurAdi',    label: 'Müdür Adı' },
    { key: 'ogretmenAdi', label: 'Öğretmen Adı' },
    { key: 'sinif',       label: 'Sınıf' },
];

/**
 * Merkeze girilmiş kurum verilerini tüm modüllerin üst bilgisinde göstermek için
 * kullanılan ortak read-only gösterim bandı.
 * Eksik kritik alan varsa sağ köşede mütevazı bir uyarı rozeti gösterir.
 * 
 * @param {Object} props
 * @param {Object} [props.activeConfig] - Aktif bir sınav varsa onun config'i (Tek gerçeklik kaynağı)
 */
export default function InstitutionBanner({ activeConfig }) {
    const inst = loadInstitution();

    const activeGradeLevel = activeConfig?.gradeLevel || inst?.sinif;
    const activeClassSection = activeConfig?.classSection || inst?.sube;

    if (!inst || (!inst.okulAdi && !inst.il && !activeGradeLevel)) {
        return null; // Hiç veri yoksa gösterme
    }

    const location = [inst.il, inst.ilce].filter(Boolean).join(' / ');
    const classInfo = [activeGradeLevel, activeClassSection ? `${activeClassSection} Şubesi` : ''].filter(Boolean).join(' - ');
    const missingFields = CRITICAL_FIELDS.filter((f) => {
        if (f.key === 'sinif') return !activeGradeLevel?.trim();
        return !inst[f.key]?.trim();
    });

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

            <div className="flex items-center gap-3">
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

                {/* Eksik alan rozeti — kritik veri eksikse ana sayfaya yönlendir */}
                {missingFields.length > 0 && (
                    <Link
                        to="/"
                        className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full hover:bg-amber-100 transition-colors shrink-0"
                        title={`Eksik: ${missingFields.map(f => f.label).join(', ')}`}
                    >
                        <AlertTriangle className="w-3 h-3" />
                        <span className="hidden sm:inline">Kurum bilgileri eksik</span>
                        <span className="sm:hidden">{missingFields.length} eksik</span>
                    </Link>
                )}
            </div>
        </div>
    );
}
