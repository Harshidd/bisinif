import React, { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, CheckSquare, Download, Printer, Save, Share2 } from 'lucide-react'
import { generateHomeworkAssignmentDocx } from '../engine/homeworkAssignmentDocxGenerator'
import { loadHomeworkAssignmentDraft, loadMeta, saveHomeworkAssignmentDraft } from '../storage/docsStorage'

const HOMEWORK_TYPES = [
    { id: 'daily', label: 'Günlük ödev', ref: 'Ders takibi', notes: ['öğrenciye ödev konusu açıklanmıştır', 'teslim tarihi bildirilmiştir', 'çalışmanın düzenli hazırlanması istenmiştir'] },
    { id: 'research', label: 'Araştırma ödevi', ref: 'Kaynak kullanımı', notes: ['kaynak kullanımı önerilmiştir', 'teslim tarihi bildirilmiştir', 'ödevin değerlendirmeye alınacağı belirtilmiştir'] },
    { id: 'performance', label: 'Performans ödevi', ref: 'Dönem çalışması', notes: ['ödevin değerlendirmeye alınacağı belirtilmiştir', 'eksiksiz teslim edilmesi gerektiği belirtilmiştir', 'veli bilgilendirilmiştir'] },
    { id: 'repeat', label: 'Tekrar / telafi ödevi', ref: 'Eksik kazanım', notes: ['çalışmanın düzenli hazırlanması istenmiştir', 'eksiksiz teslim edilmesi gerektiği belirtilmiştir', 'teslim tarihi bildirilmiştir'] },
    { id: 'projectPrep', label: 'Proje hazırlık ödevi', ref: 'Proje süreci', notes: ['kaynak kullanımı önerilmiştir', 'çalışmanın düzenli hazırlanması istenmiştir', 'ödevin değerlendirmeye alınacağı belirtilmiştir'] },
    { id: 'other', label: 'Diğer', ref: 'Özel çalışma', notes: ['öğrenciye ödev konusu açıklanmıştır', 'teslim tarihi bildirilmiştir', 'eksiksiz teslim edilmesi gerektiği belirtilmiştir'] }
]

const DELIVERY_METHODS = [
    ['written', 'Yazılı'],
    ['file', 'Dosya'],
    ['presentation', 'Sözlü sunum'],
    ['digital', 'Dijital']
]

const inputClass = 'w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-[13px] text-gray-900 outline-none transition-all focus:border-sky-300 focus:ring-4 focus:ring-sky-50'
const todayIso = () => new Date().toISOString().split('T')[0]
const dateText = value => value ? value.split('-').reverse().join('.') : ''
const textValue = value => String(value || '').trim()

const normalizeDraft = (draft) => {
    if (!draft || typeof draft !== 'object') return null
    return {
        studentName: textValue(draft.studentName),
        classSection: textValue(draft.classSection),
        schoolNumber: textValue(draft.schoolNumber),
        course: textValue(draft.course),
        homeworkTopic: textValue(draft.homeworkTopic),
        assignedDate: draft.assignedDate || todayIso(),
        dueDate: draft.dueDate || todayIso(),
        homeworkTypeId: HOMEWORK_TYPES.some(type => type.id === draft.homeworkTypeId) ? draft.homeworkTypeId : HOMEWORK_TYPES[0].id,
        notes: Array.isArray(draft.notes) ? draft.notes.filter(note => typeof note === 'string') : [],
        explanation: textValue(draft.explanation),
        parentInformed: !!draft.parentInformed,
        deliveryMethod: DELIVERY_METHODS.some(([value]) => value === draft.deliveryMethod) ? draft.deliveryMethod : DELIVERY_METHODS[0][0],
        additionalNote: textValue(draft.additionalNote),
        documentDate: draft.documentDate || todayIso()
    }
}

const buildDraft = (data) => ({
    studentName: data.studentName,
    classSection: data.classSection,
    schoolNumber: data.schoolNumber,
    course: data.course,
    homeworkTopic: data.homeworkTopic,
    assignedDate: data.assignedDate,
    dueDate: data.dueDate,
    homeworkTypeId: data.homeworkTypeId,
    notes: data.notes,
    explanation: data.explanation,
    parentInformed: data.parentInformed,
    deliveryMethod: data.deliveryMethod,
    additionalNote: data.additionalNote,
    documentDate: data.documentDate
})

const HomeworkDocsPage = () => {
    const [meta, setMeta] = useState({})
    const [busy, setBusy] = useState(false)
    const [notice, setNotice] = useState(null)
    const [data, setData] = useState({
        studentName: '',
        classSection: '',
        schoolNumber: '',
        course: '',
        homeworkTopic: '',
        assignedDate: todayIso(),
        dueDate: todayIso(),
        homeworkTypeId: HOMEWORK_TYPES[0].id,
        notes: [],
        explanation: '',
        parentInformed: false,
        deliveryMethod: DELIVERY_METHODS[0][0],
        additionalNote: '',
        documentDate: todayIso()
    })

    useEffect(() => {
        const draft = normalizeDraft(loadHomeworkAssignmentDraft())
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

    const homeworkType = HOMEWORK_TYPES.find(type => type.id === data.homeworkTypeId) || HOMEWORK_TYPES[0]
    const deliveryLabel = DELIVERY_METHODS.find(([value]) => value === data.deliveryMethod)?.[1] || DELIVERY_METHODS[0][1]
    const summaryText = [
        `${data.course || 'İlgili ders'} kapsamında "${data.homeworkTopic || 'belirtilen ödev konusu'}" çalışması öğrenciye verilmiştir.`,
        data.notes.length ? `Ödevlendirme sırasında ${data.notes.join('; ')}.` : '',
        data.explanation.trim() ? data.explanation.trim() : '',
        data.parentInformed ? 'Veli bilgilendirilmiştir.' : '',
        `Teslim şekli: ${deliveryLabel}.`,
        data.additionalNote.trim() ? data.additionalNote.trim() : ''
    ].filter(Boolean).join('\n\n')

    const setField = (field, value) => {
        setData(prev => ({ ...prev, [field]: value }))
        setNotice(null)
    }

    const setHomeworkType = homeworkTypeId => {
        setData(prev => ({ ...prev, homeworkTypeId, notes: [] }))
        setNotice(null)
    }

    const toggleNote = note => {
        setData(prev => ({
            ...prev,
            notes: prev.notes.includes(note) ? prev.notes.filter(item => item !== note) : [...prev.notes, note]
        }))
        setNotice(null)
    }

    const validate = () => {
        if (!data.studentName.trim()) return 'Öğrenci adı zorunlu.'
        if (!data.classSection.trim()) return 'Sınıf / şube zorunlu.'
        if (!data.course.trim()) return 'Ders bilgisi zorunlu.'
        if (!data.homeworkTopic.trim()) return 'Ödev konusu zorunlu.'
        return null
    }

    const handleSave = () => {
        const saved = saveHomeworkAssignmentDraft(buildDraft(data))
        setNotice(saved
            ? { type: 'success', text: 'Ödevlendirme taslağı kaydedildi.' }
            : { type: 'error', text: 'Taslak kaydedilemedi.' })
    }

    const handleWord = async () => {
        const error = validate()
        if (error) return setNotice({ type: 'error', text: error })
        setBusy(true)
        const result = await generateHomeworkAssignmentDocx(docData())
        setBusy(false)
        setNotice(result.success
            ? { type: 'success', text: 'Word belgesi hazırlandı.' }
            : { type: 'error', text: result.error || 'Word belgesi oluşturulamadı.' })
    }

    const handlePdf = () => {
        const error = validate()
        if (error) return setNotice({ type: 'error', text: error })
        const title = document.title
        document.title = `Odevlendirme_Tutanagi_${data.studentName.trim().replace(/\s+/g, '_')}`
        window.print()
        document.title = title
    }

    const handleShare = async () => {
        const error = validate()
        if (error) return setNotice({ type: 'error', text: error })
        const text = `Ödevlendirme Tutanağı\nÖğrenci: ${data.studentName}\nDers: ${data.course}\nTeslim: ${dateText(data.dueDate)}\n\n${summaryText}`
        try {
            if (navigator.share) await navigator.share({ title: 'Ödevlendirme Tutanağı', text })
            else {
                await navigator.clipboard.writeText(text)
                setNotice({ type: 'success', text: 'Paylaşım metni panoya kopyalandı.' })
            }
        } catch (err) {
            if (err.name !== 'AbortError') setNotice({ type: 'error', text: 'Paylaşım başlatılamadı.' })
        }
    }

    const docData = () => ({
        ...meta,
        className: data.classSection.trim(),
        studentName: data.studentName.trim(),
        schoolNumber: data.schoolNumber.trim(),
        course: data.course.trim(),
        homeworkTopic: data.homeworkTopic.trim(),
        assignedDate: dateText(data.assignedDate),
        dueDate: dateText(data.dueDate),
        homeworkType: homeworkType.label,
        quickNotes: data.notes,
        explanation: data.explanation.trim(),
        parentInformed: data.parentInformed,
        deliveryMethod: deliveryLabel,
        additionalNote: data.additionalNote.trim(),
        documentDate: dateText(data.documentDate),
        teacherName: meta.teacherName || ''
    })

    return (
        <div className="relative left-1/2 w-[min(1500px,calc(100vw-3rem))] -translate-x-1/2 animate-fade-in pb-12">
            <PrintStyles />

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(620px,1fr)_minmax(390px,0.72fr)] gap-6 items-start">
                <section className="no-print space-y-4">
                    <SectionCard tone="warm">
                        <div className="flex items-center gap-3 mb-5">
                            <span className="w-9 h-9 rounded-lg bg-white text-sky-700 flex items-center justify-center border border-sky-100 shadow-sm">
                                <CheckSquare className="w-5 h-5" />
                            </span>
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-700">Belgeler</p>
                                <h1 className="text-xl font-bold text-gray-900">Ödevlendirme Tutanağı</h1>
                            </div>
                        </div>

                        <SectionTitle title="A. Öğrenci Bilgileri" />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <TextField label="Öğrenci adı soyadı" value={data.studentName} onChange={value => setField('studentName', value)} placeholder="Örn: Ali Veli" />
                            <TextField label="Sınıf / şube" value={data.classSection} onChange={value => setField('classSection', value)} placeholder="Örn: 9-A" />
                            <TextField label="Okul numarası" value={data.schoolNumber} onChange={value => setField('schoolNumber', value)} placeholder="124" />
                        </div>
                    </SectionCard>

                    <SectionCard>
                        <SectionTitle title="B. Ödev Bilgileri" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                            <TextField label="Ders" value={data.course} onChange={value => setField('course', value)} placeholder="Türkçe, Matematik" />
                            <TextField label="Ödev konusu" value={data.homeworkTopic} onChange={value => setField('homeworkTopic', value)} placeholder="Konu / çalışma başlığı" />
                            <div>
                                <Label>Ödevin veriliş tarihi</Label>
                                <input type="date" value={data.assignedDate} onChange={event => setField('assignedDate', event.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <Label>Teslim tarihi</Label>
                                <input type="date" value={data.dueDate} onChange={event => setField('dueDate', event.target.value)} className={inputClass} />
                            </div>
                        </div>
                        <Label>Ödev türü</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {HOMEWORK_TYPES.map(item => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setHomeworkType(item.id)}
                                    className={`min-h-[82px] rounded-lg border p-3 text-left transition-all ${
                                        data.homeworkTypeId === item.id
                                            ? 'border-sky-300 bg-sky-50 shadow-sm ring-2 ring-sky-50'
                                            : 'border-gray-200 bg-white hover:border-sky-200 hover:bg-sky-50'
                                    }`}
                                >
                                    <span className="block text-[13px] font-semibold leading-snug text-gray-900">{item.label}</span>
                                    <span className="mt-1.5 block text-[11px] text-gray-500">{item.ref}</span>
                                </button>
                            ))}
                        </div>
                    </SectionCard>

                    <SectionCard>
                        <SectionTitle title="C. Açıklama ve Kapsam" />
                        <div className="mb-5">
                            <div className="flex items-center justify-between gap-3 mb-3">
                                <h2 className="text-[15px] font-bold text-gray-900">Hızlı not önerileri</h2>
                                <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700">{data.notes.length} seçili</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {homeworkType.notes.map(note => (
                                    <button
                                        key={note}
                                        type="button"
                                        onClick={() => toggleNote(note)}
                                        className={`rounded-lg border px-3 py-2 text-[12px] font-semibold transition-all ${
                                            data.notes.includes(note)
                                                ? 'border-sky-300 bg-sky-100 text-sky-900 shadow-sm'
                                                : 'border-gray-200 bg-white text-gray-600 hover:border-sky-200 hover:bg-sky-50'
                                        }`}
                                    >
                                        {note}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <Label>Kısa açıklama</Label>
                        <textarea value={data.explanation} onChange={event => setField('explanation', event.target.value)} rows={3} placeholder="Ödevin kapsamına dair kısa not." className={inputClass} />
                    </SectionCard>

                    <SectionCard>
                        <SectionTitle title="D. Ek Ayarlar" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                            <label className={`flex items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5 text-[13px] font-semibold transition-all ${
                                data.parentInformed
                                    ? 'border-sky-300 bg-sky-50 text-sky-800'
                                    : 'border-gray-200 bg-white text-gray-700'
                            }`}>
                                <span>Veli bilgilendirildi</span>
                                <span className={`relative h-5 w-9 rounded-full transition-all ${data.parentInformed ? 'bg-sky-600' : 'bg-gray-200'}`}>
                                    <input
                                        type="checkbox"
                                        checked={data.parentInformed}
                                        onChange={event => setField('parentInformed', event.target.checked)}
                                        className="sr-only"
                                    />
                                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${data.parentInformed ? 'left-4' : 'left-0.5'}`} />
                                </span>
                            </label>
                            <div>
                                <Label>Belge tarihi</Label>
                                <input type="date" value={data.documentDate} onChange={event => setField('documentDate', event.target.value)} className={inputClass} />
                            </div>
                        </div>

                        <Label>Teslim şekli</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                            {DELIVERY_METHODS.map(([value, label]) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setField('deliveryMethod', value)}
                                    className={`rounded-lg border px-3 py-2 text-[12px] font-semibold transition-all ${
                                        data.deliveryMethod === value
                                            ? 'border-sky-300 bg-sky-50 text-sky-800 ring-2 ring-sky-50'
                                            : 'border-gray-200 bg-white text-gray-600 hover:border-sky-200 hover:bg-sky-50'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
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
                                <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700">Canlı</span>
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
                            <DocumentPreview data={data} meta={meta} homeworkType={homeworkType} deliveryLabel={deliveryLabel} summaryText={summaryText} />
                        </div>
                    </div>
                </aside>
            </div>

            <div id="homework-print" className="hidden">
                <DocumentPreview data={data} meta={meta} homeworkType={homeworkType} deliveryLabel={deliveryLabel} summaryText={summaryText} printMode />
            </div>
        </div>
    )
}

const PrintStyles = () => (
    <style>{`
        @media print {
            body * { visibility: hidden !important; }
            #homework-print, #homework-print * { visibility: visible !important; }
            #homework-print { display: block !important; position: absolute; left: 0; top: 0; width: 100%; background: white; }
            .print-page { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 22mm; page-break-after: always; box-shadow: none !important; }
            .print-page:last-child { page-break-after: auto; }
        }
    `}</style>
)

const SectionCard = ({ children, tone }) => (
    <section className={`rounded-xl border shadow-sm p-4 ${tone === 'warm' ? 'border-sky-100 bg-gradient-to-r from-sky-50 to-emerald-50' : 'border-gray-100 bg-white'}`}>
        {children}
    </section>
)

const SectionTitle = ({ title }) => (
    <div className="mb-3">
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
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
                ? 'bg-sky-600 text-white hover:bg-sky-700'
                : 'border border-gray-200 bg-white text-gray-700 hover:border-sky-200 hover:bg-sky-50'
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

const DocumentPreview = ({ data, meta, homeworkType, deliveryLabel, summaryText, printMode = false }) => {
    const pageClass = printMode
        ? 'print-page bg-white text-black'
        : 'mx-auto mb-4 w-full max-w-[410px] aspect-[210/297] bg-white text-black shadow-lg border border-stone-200 px-8 py-9 text-[9.5px] leading-relaxed'
    const school = meta.schoolName || '................................ OKULU'
    const student = data.studentName || '................................'
    const classNo = `${data.classSection || '........'} / ${data.schoolNumber || '........'}`
    const teacher = meta.teacherName || '................................'

    return (
        <article className={pageClass}>
            <div className="text-center border-b border-black pb-4 mb-6">
                <h2 className="font-bold text-[1.22em] uppercase">{school}</h2>
                <p className="mt-2 font-bold underline text-[1.15em]">ÖDEVLENDİRME TUTANAĞI</p>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-6">
                <p><strong>Öğrenci:</strong> {student}</p>
                <p><strong>Sınıf / No:</strong> {classNo}</p>
                <p><strong>Ders:</strong> {data.course || '........'}</p>
                <p><strong>Ödev türü:</strong> {homeworkType.label}</p>
                <p><strong>Veriliş tarihi:</strong> {dateText(data.assignedDate)}</p>
                <p><strong>Teslim tarihi:</strong> {dateText(data.dueDate)}</p>
                <p><strong>Teslim şekli:</strong> {deliveryLabel}</p>
                <p><strong>Belge tarihi:</strong> {dateText(data.documentDate)}</p>
            </div>
            <div className="mb-5">
                <p className="font-bold underline mb-2">Ödev Konusu</p>
                <p>{data.homeworkTopic || 'Belirtilen ödev konusu'}</p>
                <p className="mt-1 text-gray-600">{homeworkType.ref}</p>
            </div>
            <div className="mb-8">
                <p className="font-bold underline mb-2">Açıklama ve Kapsam</p>
                <div className="min-h-[260px] whitespace-pre-wrap border border-gray-300 p-4">{summaryText || 'Ödev bilgileri girildikçe burada resmi tutanak taslağı oluşur.'}</div>
            </div>
            <div className="grid grid-cols-2 gap-10 pt-8">
                <Signature title={teacher} subtitle="Dersi / ödevi veren öğretmen" />
                <Signature title={student} subtitle="Öğrenci" />
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

export default HomeworkDocsPage
