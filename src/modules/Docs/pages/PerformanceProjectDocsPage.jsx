import React, { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, ClipboardList, Download, Plus, Printer, Save, Share2, Trash2 } from 'lucide-react'
import { loadMeta, loadPerformanceProjectDraft, savePerformanceProjectDraft } from '../storage/docsStorage'

const WORK_TYPES = [
    ['performance', 'Performans'],
    ['project', 'Proje']
]

const DEFAULT_CRITERIA = [
    { id: 'relevance', label: 'Konuya uygunluk' },
    { id: 'content', label: 'Araştırma / içerik yeterliliği' },
    { id: 'order', label: 'Düzen ve tertip' },
    { id: 'timing', label: 'Zamanında teslim' },
    { id: 'originality', label: 'Özgünlük' },
    { id: 'presentation', label: 'Sunum / anlatım' },
    { id: 'sources', label: 'Kaynak kullanımı' }
]

const SCORE_LABELS = {
    1: 'Geliştirilmeli',
    2: 'Kısmen',
    3: 'Yeterli',
    4: 'İyi',
    5: 'Çok iyi'
}

const CRITERION_MAX_SCORE = 5
const inputClass = 'w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-[13px] text-gray-900 outline-none transition-all focus:border-violet-300 focus:ring-4 focus:ring-violet-50'
const todayIso = () => new Date().toISOString().split('T')[0]
const dateText = value => value ? value.split('-').reverse().join('.') : ''
const textValue = value => String(value || '').trim()

const defaultCriteria = () => DEFAULT_CRITERIA.map(criterion => ({ ...criterion }))
const defaultScores = (criteria = DEFAULT_CRITERIA) => criteria.reduce((scores, criterion) => ({ ...scores, [criterion.id]: 3 }), {})
const normalizeCriteria = (criteria) => {
    if (!Array.isArray(criteria)) return defaultCriteria()
    const normalized = criteria
        .map((criterion, index) => ({
            id: textValue(criterion?.id) || `criterion-${index}`,
            label: textValue(criterion?.label)
        }))
        .filter(criterion => criterion.label)

    return normalized.length ? normalized : defaultCriteria()
}

const criterionScore = (scores, criterionId) => {
    const value = Number(scores?.[criterionId])
    return Number.isInteger(value) && value >= 1 && value <= CRITERION_MAX_SCORE ? value : 3
}

const calculateScoreSummary = (criteria, scores) => {
    const activeCriteria = Array.isArray(criteria) ? criteria : []
    const total = activeCriteria.reduce((sum, criterion) => sum + criterionScore(scores, criterion.id), 0)
    const max = activeCriteria.length * CRITERION_MAX_SCORE
    const grade100 = max ? Math.round((total / max) * 100) : 0

    return {
        total,
        max,
        grade100
    }
}

const normalizeDraft = (draft) => {
    if (!draft || typeof draft !== 'object') return null
    const criteria = normalizeCriteria(draft.criteria)
    const scores = defaultScores(criteria)
    criteria.forEach(criterion => {
        scores[criterion.id] = criterionScore(draft.scores, criterion.id)
    })

    return {
        studentName: textValue(draft.studentName),
        classSection: textValue(draft.classSection),
        schoolNumber: textValue(draft.schoolNumber),
        course: textValue(draft.course),
        workType: WORK_TYPES.some(([value]) => value === draft.workType) ? draft.workType : 'performance',
        topic: textValue(draft.topic),
        deliveryDate: draft.deliveryDate || todayIso(),
        evaluationDate: draft.evaluationDate || todayIso(),
        criteria,
        scores,
        generalEvaluation: textValue(draft.generalEvaluation),
        teacherOpinion: textValue(draft.teacherOpinion),
        strengths: textValue(draft.strengths),
        improvements: textValue(draft.improvements),
        teacherName: textValue(draft.teacherName)
    }
}

const buildDraft = (data) => ({
    studentName: data.studentName,
    classSection: data.classSection,
    schoolNumber: data.schoolNumber,
    course: data.course,
    workType: data.workType,
    topic: data.topic,
    deliveryDate: data.deliveryDate,
    evaluationDate: data.evaluationDate,
    criteria: data.criteria,
    scores: data.criteria.reduce((scores, criterion) => ({
        ...scores,
        [criterion.id]: criterionScore(data.scores, criterion.id)
    }), {}),
    generalEvaluation: data.generalEvaluation,
    teacherOpinion: data.teacherOpinion,
    strengths: data.strengths,
    improvements: data.improvements,
    teacherName: data.teacherName
})

const PerformanceProjectDocsPage = () => {
    const [meta, setMeta] = useState({})
    const [notice, setNotice] = useState(null)
    const [newCriterionLabel, setNewCriterionLabel] = useState('')
    const [data, setData] = useState({
        studentName: '',
        classSection: '',
        schoolNumber: '',
        course: '',
        workType: 'performance',
        topic: '',
        deliveryDate: todayIso(),
        evaluationDate: todayIso(),
        criteria: defaultCriteria(),
        scores: defaultScores(),
        generalEvaluation: '',
        teacherOpinion: '',
        strengths: '',
        improvements: '',
        teacherName: ''
    })

    useEffect(() => {
        const draft = normalizeDraft(loadPerformanceProjectDraft())
        const initialMeta = loadMeta() || {}
        setMeta(initialMeta)
        setData(prev => ({
            ...prev,
            classSection: prev.classSection || initialMeta.className || '',
            ...(draft || {}),
            teacherName: draft?.teacherName || prev.teacherName || initialMeta.teacherName || ''
        }))

        const updateMeta = () => {
            const nextMeta = loadMeta() || {}
            setMeta(nextMeta)
            setData(prev => ({
                ...prev,
                classSection: prev.classSection || nextMeta.className || '',
                teacherName: prev.teacherName || nextMeta.teacherName || ''
            }))
        }
        window.addEventListener('storage', updateMeta)
        return () => window.removeEventListener('storage', updateMeta)
    }, [])

    const workTypeLabel = WORK_TYPES.find(([value]) => value === data.workType)?.[1] || 'Performans'
    const scoreSummary = calculateScoreSummary(data.criteria, data.scores)

    const setField = (field, value) => {
        setData(prev => ({ ...prev, [field]: value }))
        setNotice(null)
    }

    const setScore = (criterionId, score) => {
        setData(prev => ({ ...prev, scores: { ...prev.scores, [criterionId]: score } }))
        setNotice(null)
    }

    const addCriterion = () => {
        const label = newCriterionLabel.trim()
        if (!label) return
        const id = `custom-${Date.now()}`
        setData(prev => ({
            ...prev,
            criteria: [...prev.criteria, { id, label }],
            scores: { ...prev.scores, [id]: 3 }
        }))
        setNewCriterionLabel('')
        setNotice(null)
    }

    const removeCriterion = (criterionId) => {
        setData(prev => ({
            ...prev,
            criteria: prev.criteria.filter(criterion => criterion.id !== criterionId)
        }))
        setNotice(null)
    }

    const validate = () => {
        if (!data.studentName.trim()) return 'Öğrenci adı soyadı zorunlu.'
        if (!data.classSection.trim()) return 'Sınıf / şube zorunlu.'
        if (!data.course.trim()) return 'Ders bilgisi zorunlu.'
        if (!data.topic.trim()) return 'Konu / başlık zorunlu.'
        if (!data.criteria.length) return 'En az bir değerlendirme ölçütü eklenmelidir.'
        return null
    }

    const handleSave = () => {
        const saved = savePerformanceProjectDraft(buildDraft(data))
        setNotice(saved
            ? { type: 'success', text: 'Performans / proje değerlendirme taslağı kaydedildi.' }
            : { type: 'error', text: 'Taslak kaydedilemedi.' })
    }

    const handleWord = () => {
        const error = validate()
        if (error) return setNotice({ type: 'error', text: error })
        const html = buildWordHtml(data, meta, workTypeLabel, scoreSummary)
        const blob = new Blob([html], { type: 'application/msword;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Performans_Proje_Degerlendirme_${normalizeFilename(data.studentName)}.doc`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        setTimeout(() => URL.revokeObjectURL(url), 100)
        setNotice({ type: 'success', text: 'İlk sürüm Word belgesi hazırlandı.' })
    }

    const handlePdf = () => {
        const error = validate()
        if (error) return setNotice({ type: 'error', text: error })
        const title = document.title
        document.title = `Performans_Proje_Degerlendirme_${data.studentName.trim().replace(/\s+/g, '_')}`
        window.print()
        document.title = title
    }

    const handleShare = async () => {
        const error = validate()
        if (error) return setNotice({ type: 'error', text: error })
        const text = `Performans / Proje Değerlendirme Formu\nÖğrenci: ${data.studentName}\nDers: ${data.course}\nÇalışma: ${workTypeLabel} - ${data.topic}\nToplam Puan: ${scoreSummary.total}/${scoreSummary.max}\nGenel Not: ${scoreSummary.grade100}/100\n\n${data.teacherOpinion || data.generalEvaluation}`
        try {
            if (navigator.share) await navigator.share({ title: 'Performans / Proje Değerlendirme Formu', text })
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
                            <span className="w-9 h-9 rounded-lg bg-white text-violet-700 flex items-center justify-center border border-violet-100 shadow-sm">
                                <ClipboardList className="w-5 h-5" />
                            </span>
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-700">Belgeler</p>
                                <h1 className="text-xl font-bold text-gray-900">Performans / Proje Değerlendirme Formu</h1>
                            </div>
                        </div>

                        <SectionTitle title="A. Öğrenci Bilgileri" helper="Formun öğrenciye ait resmi kimlik alanları." />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <TextField label="Öğrenci adı soyadı" value={data.studentName} onChange={value => setField('studentName', value)} placeholder="Örn: Ali Veli" />
                            <TextField label="Sınıf / şube" value={data.classSection} onChange={value => setField('classSection', value)} placeholder="Örn: 9-A" />
                            <TextField label="Okul numarası" value={data.schoolNumber} onChange={value => setField('schoolNumber', value)} placeholder="124" />
                        </div>
                    </SectionCard>

                    <SectionCard>
                        <SectionTitle title="B. Çalışma Bilgileri" helper="Ders, çalışma türü ve değerlendirme tarihlerini küçük adımlarla girin." />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                            <TextField label="Ders" value={data.course} onChange={value => setField('course', value)} placeholder="Türkçe, Matematik" />
                            <TextField label="Konu / başlık" value={data.topic} onChange={value => setField('topic', value)} placeholder="Çalışmanın konusu" />
                            <TextField label="Öğretmen adı soyadı" value={data.teacherName} onChange={value => setField('teacherName', value)} placeholder={meta.teacherName || 'Belgeyi düzenleyen öğretmen'} />
                            <div>
                                <Label>Teslim tarihi</Label>
                                <input type="date" value={data.deliveryDate} onChange={event => setField('deliveryDate', event.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <Label>Değerlendirme tarihi</Label>
                                <input type="date" value={data.evaluationDate} onChange={event => setField('evaluationDate', event.target.value)} className={inputClass} />
                            </div>
                        </div>
                        <Label>Çalışma türü</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {WORK_TYPES.map(([value, label]) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setField('workType', value)}
                                    className={`rounded-lg border px-3 py-2.5 text-[13px] font-semibold transition-all ${
                                        data.workType === value
                                            ? 'border-violet-300 bg-violet-50 text-violet-800 ring-2 ring-violet-50'
                                            : 'border-gray-200 bg-white text-gray-600 hover:border-violet-200 hover:bg-violet-50'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </SectionCard>

                    <SectionCard>
                        <div className="flex items-start justify-between gap-3 mb-4">
                            <SectionTitle title="C. Değerlendirme Ölçütleri" helper="Her ölçüt için 1-5 arası pratik bir değerlendirme seçin." noMargin />
                            <span className="rounded-lg bg-violet-50 px-3 py-2 text-[12px] font-bold text-violet-800">{scoreSummary.total}/{scoreSummary.max}</span>
                        </div>
                        <div className="space-y-2.5">
                            {data.criteria.map(criterion => (
                                <div key={criterion.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-900">{criterion.label}</h3>
                                            <p className="text-xs text-gray-500">{SCORE_LABELS[criterionScore(data.scores, criterion.id)]}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="grid grid-cols-5 gap-1.5 sm:w-[230px]">
                                                {[1, 2, 3, 4, 5].map(score => (
                                                    <button
                                                        key={score}
                                                        type="button"
                                                        onClick={() => setScore(criterion.id, score)}
                                                        title={SCORE_LABELS[score]}
                                                        className={`h-9 rounded-lg border text-[12px] font-bold transition-all ${
                                                            criterionScore(data.scores, criterion.id) === score
                                                                ? 'border-violet-400 bg-violet-600 text-white shadow-sm'
                                                                : 'border-gray-200 bg-white text-gray-600 hover:border-violet-200 hover:bg-violet-50'
                                                        }`}
                                                    >
                                                        {score}
                                                    </button>
                                                ))}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeCriterion(criterion.id)}
                                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                                title="Ölçütü kaldır"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
                            <input
                                type="text"
                                value={newCriterionLabel}
                                onChange={event => setNewCriterionLabel(event.target.value)}
                                onKeyDown={event => {
                                    if (event.key === 'Enter') {
                                        event.preventDefault()
                                        addCriterion()
                                    }
                                }}
                                placeholder="Yeni ölçüt adı"
                                className={inputClass}
                            />
                            <button
                                type="button"
                                onClick={addCriterion}
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-[13px] font-semibold text-violet-800 transition-all hover:bg-violet-100"
                            >
                                <Plus className="w-4 h-4" />
                                Ölçüt ekle
                            </button>
                        </div>
                    </SectionCard>

                    <SectionCard>
                        <SectionTitle title="D. Sonuç ve Açıklama" helper="Kısa, resmi ve öğretmen diline uygun sonuç alanları." />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <TextArea label="Genel değerlendirme" value={data.generalEvaluation} onChange={value => setField('generalEvaluation', value)} placeholder="Çalışmanın genel sonucu..." />
                            <TextArea label="Öğretmen görüşü" value={data.teacherOpinion} onChange={value => setField('teacherOpinion', value)} placeholder="Öğretmen kanaati..." />
                            <TextArea label="Güçlü yönler" value={data.strengths} onChange={value => setField('strengths', value)} placeholder="Öne çıkan olumlu yönler..." />
                            <TextArea label="Geliştirilmesi gereken yönler" value={data.improvements} onChange={value => setField('improvements', value)} placeholder="Desteklenmesi gereken alanlar..." />
                        </div>
                    </SectionCard>
                </section>

                <aside className="no-print xl:sticky xl:top-5">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                        <div className="flex flex-col gap-3 border-b border-gray-100 pb-4 mb-4">
                            <div className="flex items-center justify-between gap-3">
                                <h2 className="text-base font-bold text-gray-900">Önizleme</h2>
                                <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700">Canlı</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <ActionButton onClick={handleSave} icon={<Save className="w-4 h-4" />}>Kaydet</ActionButton>
                                <ActionButton onClick={handleWord} icon={<Download className="w-4 h-4" />} primary>Word İndir</ActionButton>
                                <ActionButton onClick={handlePdf} icon={<Printer className="w-4 h-4" />}>PDF İndir</ActionButton>
                                <ActionButton onClick={handleShare} icon={<Share2 className="w-4 h-4" />}>Paylaş</ActionButton>
                            </div>
                        </div>
                        {notice && <Notice notice={notice} />}
                        <div className="max-h-[80vh] overflow-y-auto rounded-xl border border-stone-200 bg-stone-100 p-4 shadow-inner">
                            <DocumentPreview data={data} meta={meta} workTypeLabel={workTypeLabel} scoreSummary={scoreSummary} />
                        </div>
                    </div>
                </aside>
            </div>

            <div id="performance-project-print" className="hidden">
                <DocumentPreview data={data} meta={meta} workTypeLabel={workTypeLabel} scoreSummary={scoreSummary} printMode />
            </div>
        </div>
    )
}

const PrintStyles = () => (
    <style>{`
        @media print {
            body * { visibility: hidden !important; }
            #performance-project-print, #performance-project-print * { visibility: visible !important; }
            #performance-project-print { display: block !important; position: absolute; left: 0; top: 0; width: 100%; background: white; }
            .print-page { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 22mm; page-break-after: always; box-shadow: none !important; }
            .print-page:last-child { page-break-after: auto; }
        }
    `}</style>
)

const SectionCard = ({ children, tone }) => (
    <section className={`rounded-xl border shadow-sm p-4 ${tone === 'warm' ? 'border-violet-100 bg-gradient-to-r from-violet-50 to-cyan-50' : 'border-gray-100 bg-white'}`}>
        {children}
    </section>
)

const SectionTitle = ({ title, helper, noMargin = false }) => (
    <div className={noMargin ? '' : 'mb-3'}>
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

const TextArea = ({ label, value, onChange, placeholder }) => (
    <div>
        <Label>{label}</Label>
        <textarea value={value} onChange={event => onChange(event.target.value)} rows={4} placeholder={placeholder} className={inputClass} />
    </div>
)

const ActionButton = ({ children, icon, onClick, primary = false }) => (
    <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-semibold transition-all ${
            primary
                ? 'bg-violet-600 text-white hover:bg-violet-700'
                : 'border border-gray-200 bg-white text-gray-700 hover:border-violet-200 hover:bg-violet-50'
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

const DocumentPreview = ({ data, meta, workTypeLabel, scoreSummary, printMode = false }) => {
    const pageClass = printMode
        ? 'print-page bg-white text-black'
        : 'mx-auto mb-4 w-full max-w-[410px] aspect-[210/297] bg-white text-black shadow-lg border border-stone-200 px-8 py-9 text-[9.5px] leading-relaxed'
    const school = meta.schoolName || '................................ OKULU'
    const student = data.studentName || '................................'
    const classNo = `${data.classSection || '........'} / ${data.schoolNumber || '........'}`
    const teacher = data.teacherName || meta.teacherName || '................................'

    return (
        <article className={pageClass}>
            <div className="text-center border-b border-black pb-4 mb-5">
                <h2 className="font-bold text-[1.22em] uppercase">{school}</h2>
                <p className="mt-2 font-bold underline text-[1.15em]">PERFORMANS / PROJE DEĞERLENDİRME FORMU</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
                <p><strong>Öğrenci:</strong> {student}</p>
                <p><strong>Sınıf / No:</strong> {classNo}</p>
                <p><strong>Ders:</strong> {data.course || '........'}</p>
                <p><strong>Çalışma türü:</strong> {workTypeLabel}</p>
                <p><strong>Konu / başlık:</strong> {data.topic || '........'}</p>
                <p><strong>Teslim tarihi:</strong> {dateText(data.deliveryDate)}</p>
                <p><strong>Değerlendirme tarihi:</strong> {dateText(data.evaluationDate)}</p>
                <p><strong>Toplam Puan:</strong> {scoreSummary.total} / {scoreSummary.max}</p>
                <p><strong>Genel Not:</strong> {scoreSummary.grade100} / 100</p>
            </div>

            <div className="mb-5">
                <p className="font-bold underline mb-2">Değerlendirme Ölçütleri</p>
                <div className="border border-gray-300">
                    {data.criteria.map(criterion => (
                        <div key={criterion.id} className="grid grid-cols-[1fr_62px_88px] border-b border-gray-200 last:border-b-0">
                            <div className="p-2 font-semibold">{criterion.label}</div>
                            <div className="border-l border-gray-200 p-2 text-center">{criterionScore(data.scores, criterion.id)}</div>
                            <div className="border-l border-gray-200 p-2 text-center text-gray-600">{SCORE_LABELS[criterionScore(data.scores, criterion.id)]}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-8">
                <PreviewBox title="Genel Değerlendirme" text={data.generalEvaluation} />
                <PreviewBox title="Öğretmen Görüşü" text={data.teacherOpinion} />
                <PreviewBox title="Güçlü Yönler" text={data.strengths} />
                <PreviewBox title="Geliştirilmesi Gereken Yönler" text={data.improvements} />
            </div>

            <div className="grid grid-cols-2 gap-10 pt-6">
                <Signature title={teacher} subtitle="Dersi veren öğretmen" />
                <Signature title={student} subtitle="Öğrenci" />
            </div>
        </article>
    )
}

const PreviewBox = ({ title, text }) => (
    <div>
        <p className="font-bold underline mb-1">{title}</p>
        <div className="min-h-[58px] whitespace-pre-wrap border border-gray-300 p-2">{text || '................................'}</div>
    </div>
)

const Signature = ({ title, subtitle }) => (
    <div className="text-center">
        <p className="mb-12 font-bold">{title}</p>
        <p className="-mt-10 mb-8 text-gray-500">{subtitle}</p>
        <div className="border-t border-black pt-2">İmza</div>
    </div>
)

const buildWordHtml = (data, meta, workTypeLabel, scoreSummary) => `<!doctype html>
<html><head><meta charset="utf-8"><title>Performans / Proje Değerlendirme Formu</title>
<style>
body { font-family: "Times New Roman", serif; font-size: 11pt; line-height: 1.2; }
p { margin: 0 0 6pt 0; }
h2 { margin: 0 0 6pt 0; }
h3 { margin: 0 0 10pt 0; }
table { page-break-inside: auto; }
.criteria-table { margin-top: 6pt; margin-bottom: 6pt; }
.signature-block { width: 100%; margin-top: 18pt; page-break-inside: avoid; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
.signature-cell { width: 45%; text-align: center; page-break-inside: avoid; }
</style></head>
<body>
<h2 style="text-align:center">${escapeHtml(meta.schoolName || '................................ OKULU')}</h2>
<h3 style="text-align:center;text-decoration:underline">PERFORMANS / PROJE DEĞERLENDİRME FORMU</h3>
<p><strong>Öğrenci:</strong> ${escapeHtml(data.studentName)} &nbsp; <strong>Sınıf / No:</strong> ${escapeHtml(data.classSection)} / ${escapeHtml(data.schoolNumber)}</p>
<p><strong>Ders:</strong> ${escapeHtml(data.course)} &nbsp; <strong>Çalışma türü:</strong> ${escapeHtml(workTypeLabel)}</p>
<p><strong>Konu / başlık:</strong> ${escapeHtml(data.topic)}</p>
<p><strong>Teslim tarihi:</strong> ${dateText(data.deliveryDate)} &nbsp; <strong>Değerlendirme tarihi:</strong> ${dateText(data.evaluationDate)}</p>
<table class="criteria-table" border="1" cellspacing="0" cellpadding="5" style="border-collapse:collapse;width:100%">
<tr><th>Ölçüt</th><th>Puan</th><th>Düzey</th></tr>
${data.criteria.map(criterion => {
    const score = criterionScore(data.scores, criterion.id)
    return `<tr><td>${escapeHtml(criterion.label)}</td><td>${score}</td><td>${escapeHtml(SCORE_LABELS[score])}</td></tr>`
}).join('')}
</table>
<p><strong>Toplam Puan:</strong> ${scoreSummary.total}/${scoreSummary.max}</p>
<p><strong>Genel Not:</strong> ${scoreSummary.grade100}/100</p>
<p><strong>Genel değerlendirme:</strong><br>${escapeHtml(data.generalEvaluation)}</p>
<p><strong>Öğretmen görüşü:</strong><br>${escapeHtml(data.teacherOpinion)}</p>
<p><strong>Güçlü yönler:</strong><br>${escapeHtml(data.strengths)}</p>
<p><strong>Geliştirilmesi gereken yönler:</strong><br>${escapeHtml(data.improvements)}</p>
<table class="signature-block"><tr><td style="width:55%"></td><td class="signature-cell">
<strong>${escapeHtml(data.teacherName || meta.teacherName || '................................')}</strong><br>
Dersi veren öğretmen<br><br>
____________________<br>İmza
</td></tr></table>
</body></html>`

const escapeHtml = value => String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

const normalizeFilename = value => String(value || 'Ogrenci')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'I')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '')

export default PerformanceProjectDocsPage
