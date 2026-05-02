import React, { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Download, Plus, Printer, Save, Share2, Trash2, ClipboardCheck } from 'lucide-react'
import { generateDutyIncidentDocx } from '../engine/dutyIncidentDocxGenerator'
import { loadDutyIncidentDraft, loadMeta, saveDutyIncidentDraft } from '../storage/docsStorage'

const INCIDENT_TYPES = [
    { id: 'hall', label: 'Koridorda uygunsuz davranış', ref: 'Koridor düzeni', notes: ['nöbet sırasında tarafımdan görülmüştür', 'sözlü uyarı yapılmıştır', 'durum kayıt altına alınmıştır'] },
    { id: 'fight', label: 'Sınıf dışında kavga / tartışma', ref: 'Güvenli okul ortamı', notes: ['ilgili öğrenciyle görüşülmüştür', 'idareye bilgi verilmiştir', 'tekrar yaşanmaması için uyarıda bulunulmuştur'] },
    { id: 'damage', label: 'Okul eşyasına zarar verme', ref: 'Okul malı koruma', notes: ['olay yerinde tespit edilmiştir', 'sözlü uyarı yapılmıştır', 'durum kayıt altına alınmıştır'] },
    { id: 'noise', label: 'Ders dışı gürültü / düzen bozma', ref: 'Ders dışı düzen', notes: ['nöbet sırasında tarafımdan görülmüştür', 'sözlü uyarı yapılmıştır', 'tekrar yaşanmaması için uyarıda bulunulmuştur'] },
    { id: 'area', label: 'İzinsiz alan değişikliği', ref: 'Alan kullanımı', notes: ['ilgili öğrenciyle görüşülmüştür', 'sözlü uyarı yapılmıştır', 'durum kayıt altına alınmıştır'] },
    { id: 'duty', label: 'Bahçe / koridor nöbet olayı', ref: 'Nöbet alanı', notes: ['nöbet sırasında tarafımdan görülmüştür', 'idareye bilgi verilmiştir', 'durum kayıt altına alınmıştır'] },
    { id: 'risk', label: 'Güvenlik riski oluşturan durum', ref: 'Güvenlik', notes: ['idareye bilgi verilmiştir', 'ilgili öğrenciyle görüşülmüştür', 'tekrar yaşanmaması için uyarıda bulunulmuştur'] },
    { id: 'other', label: 'Diğer', ref: 'Özel tespit', notes: ['durum kayıt altına alınmıştır', 'ilgili öğrenciyle görüşülmüştür', 'sözlü uyarı yapılmıştır'] }
]

const WITNESS_ROLES = ['Tanık Öğretmen', 'Gözlemci', 'Nöbetçi Öğretmen', 'Öğrenci Şahit', 'Müdür Yardımcısı']

const inputClass = 'w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-[13px] text-gray-900 outline-none transition-all focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50'
const todayIso = () => new Date().toISOString().split('T')[0]
const dateText = value => value ? value.split('-').reverse().join('.') : ''
const textValue = value => String(value || '').trim()

const normalizeDraft = (draft) => {
    if (!draft || typeof draft !== 'object') return null
    return {
        incidentDate: draft.incidentDate || todayIso(),
        incidentTime: textValue(draft.incidentTime),
        place: textValue(draft.place),
        dutyArea: textValue(draft.dutyArea),
        incidentTypeId: INCIDENT_TYPES.some(type => type.id === draft.incidentTypeId) ? draft.incidentTypeId : INCIDENT_TYPES[0].id,
        studentName: textValue(draft.studentName),
        classSection: textValue(draft.classSection),
        schoolNumber: textValue(draft.schoolNumber),
        notes: Array.isArray(draft.notes) ? draft.notes.filter(note => typeof note === 'string') : [],
        incidentNote: textValue(draft.incidentNote),
        witnesses: Array.isArray(draft.witnesses) ? draft.witnesses.map((witness, index) => ({
            id: witness.id || `draft-${index}`,
            role: WITNESS_ROLES.includes(witness.role) ? witness.role : WITNESS_ROLES[0],
            fullName: textValue(witness.fullName)
        })) : [],
        adminNotified: !!draft.adminNotified,
        additionalNote: textValue(draft.additionalNote),
        documentDate: draft.documentDate || todayIso()
    }
}

const buildDraft = (data) => ({
    incidentDate: data.incidentDate,
    incidentTime: data.incidentTime,
    place: data.place,
    dutyArea: data.dutyArea,
    incidentTypeId: data.incidentTypeId,
    studentName: data.studentName,
    classSection: data.classSection,
    schoolNumber: data.schoolNumber,
    notes: data.notes,
    incidentNote: data.incidentNote,
    witnesses: data.witnesses,
    adminNotified: data.adminNotified,
    additionalNote: data.additionalNote,
    documentDate: data.documentDate
})

const DutyIncidentDocsPage = () => {
    const [meta, setMeta] = useState({})
    const [busy, setBusy] = useState(false)
    const [notice, setNotice] = useState(null)
    const [data, setData] = useState({
        incidentDate: todayIso(),
        incidentTime: '',
        place: '',
        dutyArea: '',
        incidentTypeId: INCIDENT_TYPES[0].id,
        studentName: '',
        classSection: '',
        schoolNumber: '',
        notes: [],
        incidentNote: '',
        witnesses: [],
        adminNotified: false,
        additionalNote: '',
        documentDate: todayIso()
    })

    useEffect(() => {
        const draft = normalizeDraft(loadDutyIncidentDraft())
        const initialMeta = loadMeta() || {}
        setMeta(initialMeta)
        setData(prev => ({
            ...prev,
            classSection: prev.classSection || initialMeta.className || '',
            ...(draft || {})
        }))

        const updateMeta = () => {
            const nextMeta = loadMeta() || {}
            setMeta(nextMeta)
            setData(prev => ({ ...prev, classSection: prev.classSection || nextMeta.className || '' }))
        }
        window.addEventListener('storage', updateMeta)
        return () => window.removeEventListener('storage', updateMeta)
    }, [])

    const incidentType = INCIDENT_TYPES.find(type => type.id === data.incidentTypeId) || INCIDENT_TYPES[0]
    const primaryWitness = data.witnesses.find(witness => witness.fullName.trim() || witness.role)
    const summaryText = [
        `${dateText(data.incidentDate)} ${data.incidentTime ? `saat ${data.incidentTime}` : ''} tarihinde ${data.place || 'belirtilen okul alanında'} ${incidentType.label.toLocaleLowerCase('tr-TR')} kapsamında bir durum tespit edilmiştir.`,
        data.notes.length ? `Tespit sırasında ${data.notes.join('; ')}.` : '',
        data.incidentNote.trim() ? data.incidentNote.trim() : '',
        data.adminNotified ? 'Durum okul idaresine bildirilmiştir.' : '',
        data.additionalNote.trim() ? data.additionalNote.trim() : ''
    ].filter(Boolean).join('\n\n')

    const setField = (field, value) => {
        setData(prev => ({ ...prev, [field]: value }))
        setNotice(null)
    }

    const setIncidentType = incidentTypeId => {
        setData(prev => ({ ...prev, incidentTypeId, notes: [] }))
        setNotice(null)
    }

    const toggleNote = note => {
        setData(prev => ({
            ...prev,
            notes: prev.notes.includes(note) ? prev.notes.filter(item => item !== note) : [...prev.notes, note]
        }))
        setNotice(null)
    }

    const addWitness = () => {
        setData(prev => ({
            ...prev,
            witnesses: [...prev.witnesses, { id: Date.now(), role: WITNESS_ROLES[0], fullName: '' }]
        }))
        setNotice(null)
    }

    const updateWitness = (id, field, value) => {
        setData(prev => ({
            ...prev,
            witnesses: prev.witnesses.map(witness => witness.id === id ? { ...witness, [field]: value } : witness)
        }))
        setNotice(null)
    }

    const removeWitness = (id) => {
        setData(prev => ({ ...prev, witnesses: prev.witnesses.filter(witness => witness.id !== id) }))
        setNotice(null)
    }

    const validate = () => {
        if (!data.incidentDate) return 'Olay tarihi zorunlu.'
        if (!data.place.trim()) return 'Olay yeri zorunlu.'
        if (!data.studentName.trim()) return 'Öğrenci adı zorunlu.'
        if (!data.classSection.trim()) return 'Sınıf / şube zorunlu.'
        return null
    }

    const docData = () => ({
        ...meta,
        incidentDate: dateText(data.incidentDate),
        incidentTime: data.incidentTime.trim(),
        place: data.place.trim(),
        dutyArea: data.dutyArea.trim(),
        incidentType: incidentType.label,
        studentName: data.studentName.trim(),
        className: data.classSection.trim(),
        schoolNumber: data.schoolNumber.trim(),
        quickNotes: data.notes,
        incidentNote: data.incidentNote.trim(),
        adminNotified: data.adminNotified,
        additionalNote: data.additionalNote.trim(),
        documentDate: dateText(data.documentDate),
        teacherName: meta.teacherName || '',
        witnessName: primaryWitness?.fullName?.trim() || '',
        witnessRole: primaryWitness?.role || ''
    })

    const handleSave = () => {
        const saved = saveDutyIncidentDraft(buildDraft(data))
        setNotice(saved
            ? { type: 'success', text: 'Olay / nöbet taslağı kaydedildi.' }
            : { type: 'error', text: 'Taslak kaydedilemedi.' })
    }

    const handleWord = async () => {
        const error = validate()
        if (error) return setNotice({ type: 'error', text: error })
        setBusy(true)
        const result = await generateDutyIncidentDocx(docData())
        setBusy(false)
        setNotice(result.success
            ? { type: 'success', text: 'Word belgesi hazırlandı.' }
            : { type: 'error', text: result.error || 'Word belgesi oluşturulamadı.' })
    }

    const handlePdf = () => {
        const error = validate()
        if (error) return setNotice({ type: 'error', text: error })
        const title = document.title
        document.title = `Olay_Nobet_Tespit_Tutanagi_${data.studentName.trim().replace(/\s+/g, '_')}`
        window.print()
        document.title = title
    }

    const handleShare = async () => {
        const error = validate()
        if (error) return setNotice({ type: 'error', text: error })
        const text = `Olay / Nöbet Tespit Tutanağı\nÖğrenci: ${data.studentName}\nOlay yeri: ${data.place}\nOlay türü: ${incidentType.label}\n\n${summaryText}`
        try {
            if (navigator.share) await navigator.share({ title: 'Olay / Nöbet Tespit Tutanağı', text })
            else {
                await navigator.clipboard.writeText(text)
                setNotice({ type: 'success', text: 'Paylaşım metni panoya kopyalandı.' })
            }
        } catch (err) {
            if (err.name !== 'AbortError') setNotice({ type: 'error', text: 'Paylaşım başlatılamadı.' })
        }
    }

    return (
        <div className="relative left-1/2 w-[min(1500px,calc(100vw-3rem))] -translate-x-1/2 animate-fade-in pb-12">
            <PrintStyles />

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(620px,1fr)_minmax(390px,0.72fr)] gap-6 items-start">
                <section className="no-print space-y-4">
                    <SectionCard tone="warm">
                        <div className="flex items-center gap-3 mb-5">
                            <span className="w-9 h-9 rounded-lg bg-white text-emerald-700 flex items-center justify-center border border-emerald-100 shadow-sm">
                                <ClipboardCheck className="w-5 h-5" />
                            </span>
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Belgeler</p>
                                <h1 className="text-xl font-bold text-gray-900">Olay / Nöbet Tespit Tutanağı</h1>
                            </div>
                        </div>

                        <SectionTitle title="A. Olay Bilgileri" />
                        <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                <div>
                                    <Label>Olay tarihi</Label>
                                    <input type="date" value={data.incidentDate} onChange={event => setField('incidentDate', event.target.value)} className={inputClass} />
                                </div>
                                <TextField label="Olay saati" value={data.incidentTime} onChange={value => setField('incidentTime', value)} placeholder="10:35" />
                                <div className="sm:col-span-2">
                                    <TextField label="Olay yeri" value={data.place} onChange={value => setField('place', value)} placeholder="Koridor, bahçe, kantin" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.42fr)] gap-3">
                                <TextField label="Nöbet bölgesi / alanı" value={data.dutyArea} onChange={value => setField('dutyArea', value)} placeholder="1. kat koridoru" />
                                <div>
                                    <Label>Olay türü</Label>
                                    <div className="min-h-[42px] rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-[13px] font-semibold leading-snug text-emerald-800">{incidentType.label}</div>
                                </div>
                            </div>
                        </div>
                    </SectionCard>

                    <SectionCard>
                        <SectionTitle title="B. İlgili Kişi Bilgileri" />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <TextField label="Öğrenci adı soyadı" value={data.studentName} onChange={value => setField('studentName', value)} placeholder="Örn: Ali Veli" />
                            <TextField label="Sınıf / şube" value={data.classSection} onChange={value => setField('classSection', value)} placeholder="Örn: 9-A" />
                            <TextField label="Okul numarası" value={data.schoolNumber} onChange={value => setField('schoolNumber', value)} placeholder="124" />
                        </div>
                    </SectionCard>

                    <SectionCard>
                        <SectionTitle title="C. Olay Tespiti" />
                        <Label>Olay tipi kartları</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mb-5">
                            {INCIDENT_TYPES.map(item => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setIncidentType(item.id)}
                                    className={`min-h-[82px] rounded-lg border p-3 text-left transition-all ${
                                        data.incidentTypeId === item.id
                                            ? 'border-emerald-300 bg-emerald-50 shadow-sm ring-2 ring-emerald-50'
                                            : 'border-gray-200 bg-white hover:border-emerald-200 hover:bg-emerald-50'
                                    }`}
                                >
                                    <span className="block text-[13px] font-semibold leading-snug text-gray-900">{item.label}</span>
                                    <span className="mt-1.5 block text-[11px] text-gray-500">{item.ref}</span>
                                </button>
                            ))}
                        </div>

                        <div className="mb-5">
                            <div className="flex items-center justify-between gap-3 mb-3">
                                <div>
                                    <h2 className="text-[15px] font-bold text-gray-900">Hızlı not önerileri</h2>
                                </div>
                                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">{data.notes.length} seçili</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {incidentType.notes.map(note => (
                                    <button
                                        key={note}
                                        type="button"
                                        onClick={() => toggleNote(note)}
                                        className={`rounded-lg border px-3 py-2 text-[12px] font-semibold transition-all ${
                                            data.notes.includes(note)
                                                ? 'border-emerald-300 bg-emerald-100 text-emerald-900 shadow-sm'
                                                : 'border-gray-200 bg-white text-gray-600 hover:border-emerald-200 hover:bg-emerald-50'
                                        }`}
                                    >
                                        {note}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <Label>Kısa serbest olay notu</Label>
                        <textarea value={data.incidentNote} onChange={event => setField('incidentNote', event.target.value)} rows={3} placeholder="Olayla ilgili kısa tespit notu." className={inputClass} />
                    </SectionCard>

                    <SectionCard>
                        <SectionTitle title="D. Ek Ayarlar" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                            <label className={`flex items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5 text-[13px] font-semibold transition-all ${
                                data.adminNotified
                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                    : 'border-gray-200 bg-white text-gray-700'
                            }`}>
                                <span>İdareye bildirildi</span>
                                <span className={`relative h-5 w-9 rounded-full transition-all ${data.adminNotified ? 'bg-emerald-600' : 'bg-gray-200'}`}>
                                    <input
                                        type="checkbox"
                                        checked={data.adminNotified}
                                        onChange={event => setField('adminNotified', event.target.checked)}
                                        className="sr-only"
                                    />
                                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${data.adminNotified ? 'left-4' : 'left-0.5'}`} />
                                </span>
                            </label>
                            <div>
                                <Label>Belge tarihi</Label>
                                <input type="date" value={data.documentDate} onChange={event => setField('documentDate', event.target.value)} className={inputClass} />
                            </div>
                        </div>

                        <div className="rounded-lg border border-gray-100 bg-gray-50/70 p-3 mb-4">
                            <div className="flex items-center justify-between gap-3 mb-3">
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900">Tanık / gözlemci</h3>
                                    {data.witnesses.length === 0 && <p className="mt-0.5 text-[11px] text-gray-500">İsteğe bağlı</p>}
                                </div>
                                <button type="button" onClick={addWitness} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-100 bg-white px-3 py-2 text-[12px] font-semibold text-emerald-700 transition-all hover:border-emerald-200 hover:bg-emerald-50">
                                    <Plus className="w-3.5 h-3.5" />
                                    Tanık / Gözlemci Ekle
                                </button>
                            </div>
                            {data.witnesses.length > 0 && (
                                <div className="space-y-2">
                                    {data.witnesses.map(witness => (
                                        <div key={witness.id} className="grid grid-cols-1 sm:grid-cols-[180px_1fr_auto] gap-2 rounded-lg border border-gray-100 bg-gray-50 p-2">
                                            <select value={witness.role} onChange={event => updateWitness(witness.id, 'role', event.target.value)} className={inputClass}>
                                                {WITNESS_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                                            </select>
                                            <input type="text" value={witness.fullName} onChange={event => updateWitness(witness.id, 'fullName', event.target.value)} placeholder="Ad soyad" className={inputClass} />
                                            <button type="button" onClick={() => removeWitness(witness.id)} className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 text-gray-400 transition-all hover:border-emerald-200 hover:text-emerald-700" title="Tanığı kaldır">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <Label>Ek not</Label>
                        <textarea value={data.additionalNote} onChange={event => setField('additionalNote', event.target.value)} rows={3} placeholder="Belgeye eklenecek kısa ek not." className={inputClass} />
                    </SectionCard>
                </section>

                <aside className="no-print xl:sticky xl:top-5">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                        <div className="flex flex-col gap-3 border-b border-gray-100 pb-4 mb-4">
                            <div className="flex items-center justify-between gap-3">
                                <h2 className="text-base font-bold text-gray-900">Önizleme</h2>
                                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">Canlı</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <ActionButton onClick={handleSave} icon={<Save className="w-4 h-4" />}>Kaydet</ActionButton>
                                <ActionButton onClick={handleWord} disabled={busy} icon={<Download className="w-4 h-4" />} primary>Word İndir</ActionButton>
                                <ActionButton onClick={handlePdf} icon={<Printer className="w-4 h-4" />}>PDF İndir</ActionButton>
                                <ActionButton onClick={handleShare} icon={<Share2 className="w-4 h-4" />}>Paylaş</ActionButton>
                            </div>
                        </div>
                        {notice && <Notice notice={notice} />}
                        <div className="max-h-[80vh] overflow-y-auto rounded-xl border border-stone-200 bg-stone-100 p-4 shadow-inner">
                            <DocumentPreview data={data} meta={meta} incidentType={incidentType} summaryText={summaryText} />
                        </div>
                    </div>
                </aside>
            </div>

            <div id="duty-incident-print" className="hidden">
                <DocumentPreview data={data} meta={meta} incidentType={incidentType} summaryText={summaryText} printMode />
            </div>
        </div>
    )
}

const PrintStyles = () => (
    <style>{`
        @media print {
            body * { visibility: hidden !important; }
            #duty-incident-print, #duty-incident-print * { visibility: visible !important; }
            #duty-incident-print { display: block !important; position: absolute; left: 0; top: 0; width: 100%; background: white; }
            .print-page { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 22mm; page-break-after: always; box-shadow: none !important; }
            .print-page:last-child { page-break-after: auto; }
        }
    `}</style>
)

const SectionCard = ({ children, tone }) => (
    <section className={`rounded-xl border shadow-sm p-4 ${tone === 'warm' ? 'border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50' : 'border-gray-100 bg-white'}`}>
        {children}
    </section>
)

const SectionTitle = ({ title, helper }) => (
    <div className={helper ? 'mb-4' : 'mb-3'}>
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        {helper && <p className="text-xs text-gray-500 mt-1">{helper}</p>}
    </div>
)

const Label = ({ children }) => <label className="block text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-1.5">{children}</label>

const TextField = ({ label, value, onChange, placeholder }) => (
    <div>
        <Label>{label}</Label>
        <input type="text" value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} className={inputClass} />
    </div>
)

const ActionButton = ({ children, icon, onClick, primary = false, disabled = false }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-semibold transition-all disabled:opacity-60 ${
            primary
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'border border-gray-200 bg-white text-gray-700 hover:border-emerald-200 hover:bg-emerald-50'
        }`}
    >
        {icon}
        {children}
    </button>
)

const Notice = ({ notice }) => (
    <div className={`mb-4 flex items-center gap-2 rounded-lg border px-3 py-2.5 text-[13px] ${
        notice.type === 'success' ? 'border-green-100 bg-green-50 text-green-700' : 'border-red-100 bg-red-50 text-red-700'
    }`}>
        {notice.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
        {notice.text}
    </div>
)

const DocumentPreview = ({ data, meta, incidentType, summaryText, printMode = false }) => {
    const pageClass = printMode
        ? 'print-page bg-white text-black'
        : 'mx-auto mb-4 w-full max-w-[410px] aspect-[210/297] bg-white text-black shadow-lg border border-stone-200 px-8 py-9 text-[9.5px] leading-relaxed'
    const school = meta.schoolName || '................................ OKULU'
    const classNo = `${data.classSection || '........'} / ${data.schoolNumber || '........'}`

    return (
        <article className={pageClass}>
            <div className="text-center border-b border-black pb-4 mb-6">
                <h2 className="font-bold text-[1.22em] uppercase">{school}</h2>
                <p className="mt-2 font-bold underline text-[1.15em]">OLAY / NÖBET TESPİT TUTANAĞI</p>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-6">
                <p><strong>Olay Tarihi:</strong> {dateText(data.incidentDate)}</p>
                <p><strong>Olay Saati:</strong> {data.incidentTime || '........'}</p>
                <p><strong>Olay Yeri:</strong> {data.place || '........'}</p>
                <p><strong>Nöbet Bölgesi:</strong> {data.dutyArea || '........'}</p>
                <p><strong>Öğrenci:</strong> {data.studentName || '................................'}</p>
                <p><strong>Sınıf / No:</strong> {classNo}</p>
            </div>
            <div className="mb-5">
                <p className="font-bold underline mb-2">Olay Türü</p>
                <p>{incidentType.label}</p>
                <p className="mt-1 text-gray-600">{incidentType.ref}</p>
            </div>
            <div className="mb-8">
                <p className="font-bold underline mb-2">Olay Tespiti</p>
                <div className="min-h-[260px] whitespace-pre-wrap border border-gray-300 p-4">{summaryText}</div>
            </div>
            <div className="grid grid-cols-2 gap-10 pt-8">
                <Signature title={meta.teacherName || '................................'} subtitle="Tutanağı düzenleyen" />
                <Signature title={data.witnesses[0]?.fullName || '................................'} subtitle={data.witnesses[0]?.role || 'Tanık / Gözlemci'} />
            </div>
        </article>
    )
}

const Signature = ({ title, subtitle }) => (
    <div className="text-center">
        <p className="mb-12 font-bold">{title}</p>
        <p className="-mt-10 mb-8 text-gray-500">{subtitle}</p>
        <div className="border-t border-black pt-2">İmza</div>
    </div>
)

export default DutyIncidentDocsPage
