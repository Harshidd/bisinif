import React, { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Download, Printer, Save, Share2, UsersRound } from 'lucide-react'
import { generateParentMeetingDocx } from '../engine/parentMeetingDocxGenerator'
import { loadMeta, loadParentMeetingDraft, saveParentMeetingDraft } from '../storage/docsStorage'

const TOPICS = [
    {
        id: 'academic',
        label: 'Akademik konular',
        ref: 'Ders başarısı',
        notes: ['Ders başarısı değerlendirildi', 'Eksik kazanımlar konuşuldu', 'Çalışma düzeni ele alındı', 'Ödev takibi vurgulandı']
    },
    {
        id: 'attendance',
        label: 'Devamsızlık',
        ref: 'Okula devam',
        notes: ['Devamsızlık durumu paylaşıldı', 'Geç kalma konusu ele alındı', 'Düzenli takip istendi', 'Belge ve mazeret süreci açıklandı']
    },
    {
        id: 'behavior',
        label: 'Davranış durumu',
        ref: 'Okul davranışı',
        notes: ['Sınıf içi davranışlar konuşuldu', 'Uyarılar veliyle paylaşıldı', 'Olumlu davranış beklentisi belirtildi', 'Takip süreci planlandı']
    },
    {
        id: 'social',
        label: 'Sosyal uyum',
        ref: 'Akran ilişkileri',
        notes: ['Arkadaş ilişkileri değerlendirildi', 'Sosyal katılım konuşuldu', 'Uyum süreci izlendi', 'Destekleyici yaklaşım önerildi']
    },
    {
        id: 'family',
        label: 'Ailevi konular',
        ref: 'Ev-okul ilişkisi',
        notes: ['Aile içi durumlar dinlendi', 'Ev ortamındaki takip konuşuldu', 'İletişim kanalları netleştirildi', 'Gizlilik hassasiyeti korundu']
    },
    {
        id: 'psychological',
        label: 'Psikolojik uyum',
        ref: 'Duygusal destek',
        notes: ['Duygusal uyum konuşuldu', 'Rehberlik desteği değerlendirildi', 'Gözlem süreci planlandı', 'Veliye destekleyici öneriler sunuldu']
    },
    {
        id: 'guidance',
        label: 'Yönetim / rehberlik yönlendirmesi',
        ref: 'Okul içi yönlendirme',
        notes: ['Rehberlik birimi bilgilendirilecek', 'İdareyle paylaşım yapılacak', 'Gerekli yönlendirme açıklandı', 'Takip görüşmesi planlanacak']
    },
    {
        id: 'environment',
        label: 'Okul / çevre uyumu',
        ref: 'Okul ortamı',
        notes: ['Okula uyum süreci konuşuldu', 'Çevre koşulları değerlendirildi', 'Güvenli okul ortamı vurgulandı', 'Aile-okul iş birliği planlandı']
    },
    {
        id: 'other',
        label: 'Diğer',
        ref: 'Özel görüşme konusu',
        notes: ['Veli talebi dinlendi', 'Öğrenciye özel durum konuşuldu', 'Ek takip ihtiyacı belirtildi', 'Görüşme notu kayıt altına alındı']
    }
]

const MEETING_TYPES = [
    ['face', 'Yüz yüze'],
    ['phone', 'Telefon'],
    ['called', 'Veli çağrısı sonrası']
]

const RESULT_OPTIONS = [
    ['parentInformed', 'Veli bilgilendirildi'],
    ['homeFollow', 'Evde takip önerildi'],
    ['guidanceReferral', 'Rehberlik yönlendirmesi yapıldı'],
    ['repeatMeeting', 'Tekrar görüşme önerildi'],
    ['adminInformed', 'İdare bilgilendirildi']
]

const inputClass = 'w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-[13px] text-gray-900 outline-none transition-all focus:border-amber-300 focus:ring-4 focus:ring-amber-50'
const todayIso = () => new Date().toISOString().split('T')[0]
const dateText = value => value ? value.split('-').reverse().join('.') : ''
const textValue = value => String(value || '').trim()

const normalizeDraft = (draft) => {
    if (!draft || typeof draft !== 'object') return null
    return {
        studentName: textValue(draft.studentName),
        classSection: textValue(draft.classSection),
        schoolNumber: textValue(draft.schoolNumber),
        parentName: textValue(draft.parentName),
        relationship: textValue(draft.relationship),
        interviewer: textValue(draft.interviewer),
        date: draft.date || todayIso(),
        meetingType: MEETING_TYPES.some(([value]) => value === draft.meetingType) ? draft.meetingType : MEETING_TYPES[0][0],
        subject: textValue(draft.subject),
        topicId: TOPICS.some(topic => topic.id === draft.topicId) ? draft.topicId : TOPICS[0].id,
        notes: Array.isArray(draft.notes) ? draft.notes.filter(note => typeof note === 'string') : [],
        summaryNote: textValue(draft.summaryNote),
        results: draft.results && typeof draft.results === 'object' ? draft.results : {},
        collaborator: textValue(draft.collaborator)
    }
}

const buildDraft = (data) => ({
    studentName: data.studentName,
    classSection: data.classSection,
    schoolNumber: data.schoolNumber,
    parentName: data.parentName,
    relationship: data.relationship,
    interviewer: data.interviewer,
    date: data.date,
    meetingType: data.meetingType,
    subject: data.subject,
    topicId: data.topicId,
    notes: data.notes,
    summaryNote: data.summaryNote,
    results: data.results,
    collaborator: data.collaborator
})

const ParentMeetingDocsPage = () => {
    const [meta, setMeta] = useState({})
    const [busy, setBusy] = useState(false)
    const [notice, setNotice] = useState(null)
    const [data, setData] = useState({
        studentName: '',
        classSection: '',
        schoolNumber: '',
        parentName: '',
        relationship: '',
        interviewer: '',
        date: todayIso(),
        meetingType: MEETING_TYPES[0][0],
        subject: '',
        topicId: TOPICS[0].id,
        notes: [],
        summaryNote: '',
        results: {},
        collaborator: ''
    })

    useEffect(() => {
        const draft = normalizeDraft(loadParentMeetingDraft())
        const initialMeta = loadMeta() || {}
        setMeta(initialMeta)
        setData(prev => ({
            ...prev,
            classSection: prev.classSection || initialMeta.className || '',
            interviewer: prev.interviewer || initialMeta.teacherName || '',
            ...(draft || {})
        }))

        const updateMeta = () => {
            const nextMeta = loadMeta() || {}
            setMeta(nextMeta)
            setData(prev => ({
                ...prev,
                classSection: prev.classSection || nextMeta.className || '',
                interviewer: prev.interviewer || nextMeta.teacherName || ''
            }))
        }
        window.addEventListener('storage', updateMeta)
        return () => window.removeEventListener('storage', updateMeta)
    }, [])

    const topic = TOPICS.find(item => item.id === data.topicId) || TOPICS[0]
    const meetingTypeLabel = MEETING_TYPES.find(([value]) => value === data.meetingType)?.[1] || MEETING_TYPES[0][1]
    const selectedResults = RESULT_OPTIONS
        .filter(([key]) => data.results[key])
        .map(([, label]) => label)

    const summaryText = [
        topic.label,
        data.subject.trim() ? `Görüşme konusu: ${data.subject.trim()}.` : '',
        data.notes.length ? `Görüşmede ${data.notes.join('; ')}.` : '',
        data.summaryNote.trim() ? data.summaryNote.trim() : '',
        selectedResults.length ? `Sonuç: ${selectedResults.join('; ')}.` : '',
        data.collaborator.trim() ? `İş birliği yapılacak kişi/kurum: ${data.collaborator.trim()}.` : ''
    ].filter(Boolean).join('\n\n')

    const setField = (field, value) => {
        setData(prev => ({ ...prev, [field]: value }))
        setNotice(null)
    }

    const setTopic = topicId => {
        setData(prev => ({ ...prev, topicId, notes: [] }))
        setNotice(null)
    }

    const toggleNote = note => {
        setData(prev => ({
            ...prev,
            notes: prev.notes.includes(note) ? prev.notes.filter(item => item !== note) : [...prev.notes, note]
        }))
        setNotice(null)
    }

    const toggleResult = key => {
        setData(prev => ({
            ...prev,
            results: { ...prev.results, [key]: !prev.results[key] }
        }))
        setNotice(null)
    }

    const validate = () => {
        if (!data.studentName.trim()) return 'Öğrenci adı zorunlu.'
        if (!data.classSection.trim()) return 'Sınıf / şube zorunlu.'
        if (!data.parentName.trim()) return 'Veli adı soyadı zorunlu.'
        if (!data.interviewer.trim()) return 'Görüşmeyi yapan kişi zorunlu.'
        return null
    }

    const handleSave = () => {
        const saved = saveParentMeetingDraft(buildDraft(data))
        setNotice(saved
            ? { type: 'success', text: 'Veli görüşme taslağı kaydedildi.' }
            : { type: 'error', text: 'Taslak kaydedilemedi.' })
    }

    const handleWord = () => {
        const error = validate()
        if (error) return setNotice({ type: 'error', text: error })
        setBusy(true)
        generateParentMeetingDocx(docData()).then(result => {
            setBusy(false)
            setNotice(result.success
                ? { type: 'success', text: 'Word belgesi hazırlandı.' }
                : { type: 'error', text: result.error || 'Word belgesi oluşturulamadı.' })
        })
    }

    const handlePdf = () => {
        const error = validate()
        if (error) return setNotice({ type: 'error', text: error })
        const title = document.title
        document.title = `Veli_Gorusme_Tutanagi_${data.studentName.trim().replace(/\s+/g, '_')}`
        window.print()
        document.title = title
    }

    const handleShare = async () => {
        const error = validate()
        if (error) return setNotice({ type: 'error', text: error })
        const text = `Veli Görüşme Tutanağı\nÖğrenci: ${data.studentName}\nVeli: ${data.parentName}\nTarih: ${dateText(data.date)}\n\n${summaryText}`
        try {
            if (navigator.share) await navigator.share({ title: 'Veli Görüşme Tutanağı', text })
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
        parentName: data.parentName.trim(),
        relationship: data.relationship.trim(),
        interviewer: data.interviewer.trim(),
        reportDate: dateText(data.date),
        meetingTypeLabel,
        subject: data.subject.trim(),
        topicLabel: topic.label,
        summaryText
    })

    return (
        <div className="relative left-1/2 w-[min(1500px,calc(100vw-3rem))] -translate-x-1/2 animate-fade-in pb-12">
            <PrintStyles />

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(620px,1fr)_minmax(390px,0.72fr)] gap-6 items-start">
                <section className="no-print space-y-4">
                    <SectionCard tone="warm">
                        <div className="flex items-center gap-3 mb-5">
                            <span className="w-9 h-9 rounded-lg bg-white text-amber-700 flex items-center justify-center border border-amber-100 shadow-sm">
                                <UsersRound className="w-5 h-5" />
                            </span>
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">Belgeler</p>
                                <h1 className="text-xl font-bold text-gray-900">Veli Görüşme Tutanağı</h1>
                            </div>
                        </div>

                        <SectionTitle title="A. Öğrenci ve Veli Bilgileri" helper="Tek görüşme için temel öğrenci, veli ve görüşmeci bilgileri." />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <TextField label="Öğrencinin adı soyadı" value={data.studentName} onChange={value => setField('studentName', value)} placeholder="Örn: Ali Veli" />
                            <TextField label="Sınıf / şube" value={data.classSection} onChange={value => setField('classSection', value)} placeholder="Örn: 9-A" />
                            <TextField label="Okul numarası" value={data.schoolNumber} onChange={value => setField('schoolNumber', value)} placeholder="124" />
                            <TextField label="Veli adı soyadı" value={data.parentName} onChange={value => setField('parentName', value)} placeholder="Örn: Ayşe Veli" />
                            <TextField label="Öğrenciye yakınlığı" value={data.relationship} onChange={value => setField('relationship', value)} placeholder="Anne, baba, vasi" />
                            <TextField label="Görüşmeyi yapan kişi / öğretmen" value={data.interviewer} onChange={value => setField('interviewer', value)} placeholder="Örn: Rehber Öğretmen" />
                        </div>
                    </SectionCard>

                    <SectionCard>
                        <SectionTitle title="B. Görüşme Bilgileri" helper="Görüşmenin tarihi, tipi ve kısa konusu." />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                                <Label>Görüşme tarihi</Label>
                                <input type="date" value={data.date} onChange={event => setField('date', event.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <Label>Görüşme tipi</Label>
                                <div className="grid grid-cols-1 gap-2">
                                    {MEETING_TYPES.map(([value, label]) => (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => setField('meetingType', value)}
                                            className={`rounded-lg border px-3 py-2 text-left text-[13px] font-semibold transition-all ${
                                                data.meetingType === value
                                                    ? 'border-amber-300 bg-amber-50 text-amber-800 ring-2 ring-amber-50'
                                                    : 'border-gray-200 bg-white text-gray-600 hover:border-amber-200 hover:bg-amber-50'
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <Label>Görüşme konusu</Label>
                                <textarea
                                    value={data.subject}
                                    onChange={event => setField('subject', event.target.value)}
                                    rows={5}
                                    placeholder="Kısa görüşme konusu"
                                    className={inputClass}
                                />
                            </div>
                        </div>
                    </SectionCard>

                    <SectionCard>
                        <SectionTitle title="C. Görüşme Konusu Kartları" helper="Görüşmenin ana başlığını seçin." />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {TOPICS.map(item => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setTopic(item.id)}
                                    className={`min-h-[82px] rounded-lg border p-3 text-left transition-all ${
                                        data.topicId === item.id
                                            ? 'border-amber-300 bg-amber-50 shadow-sm ring-2 ring-amber-50'
                                            : 'border-gray-200 bg-white hover:border-amber-200 hover:bg-amber-50'
                                    }`}
                                >
                                    <span className="block text-[13px] font-semibold leading-snug text-gray-900">{item.label}</span>
                                    <span className="mt-1.5 block text-[11px] text-gray-500">{item.ref}</span>
                                </button>
                            ))}
                        </div>
                    </SectionCard>

                    <SectionCard>
                        <SectionTitle title="D. Görüşme Özeti" helper="Hızlı notlar daha sonra resmi özet metnine temel olacak." />
                        <div className="mb-5">
                            <div className="flex items-center justify-between gap-3 mb-3">
                                <div>
                                    <h2 className="text-[15px] font-bold text-gray-900">Hızlı not önerileri</h2>
                                    <p className="text-xs text-gray-500">Seçilen notlar önizleme metnine eklenir.</p>
                                </div>
                                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">{data.notes.length} seçili</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {topic.notes.map(note => (
                                    <button
                                        key={note}
                                        type="button"
                                        onClick={() => toggleNote(note)}
                                        className={`rounded-lg border px-3 py-2 text-[12px] font-semibold transition-all ${
                                            data.notes.includes(note)
                                                ? 'border-amber-300 bg-amber-100 text-amber-900 shadow-sm'
                                                : 'border-gray-200 bg-white text-gray-600 hover:border-amber-200 hover:bg-amber-50'
                                        }`}
                                    >
                                        {note}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <Label>Kısa serbest görüşme notu</Label>
                        <textarea
                            value={data.summaryNote}
                            onChange={event => setField('summaryNote', event.target.value)}
                            rows={3}
                            placeholder="Görüşmeye dair kısa not ekleyin."
                            className={inputClass}
                        />
                    </SectionCard>

                    <SectionCard>
                        <SectionTitle title="E. Sonuç ve Öneri" helper="Görüşme sonunda alınan karar ve takip adımlarını seçin." />
                        <div className="flex flex-wrap gap-2 mb-4">
                            {RESULT_OPTIONS.map(([key, label]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => toggleResult(key)}
                                    className={`rounded-lg border px-3 py-2 text-[12px] font-semibold transition-all ${
                                        data.results[key]
                                            ? 'border-green-200 bg-green-50 text-green-800 shadow-sm'
                                            : 'border-gray-200 bg-white text-gray-600 hover:border-green-200 hover:bg-green-50'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        <TextField label="İş birliği yapılacak kişi/kurum" value={data.collaborator} onChange={value => setField('collaborator', value)} placeholder="Rehberlik servisi, idare, kurum adı" />
                    </SectionCard>
                </section>

                <aside className="no-print xl:sticky xl:top-5">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                        <div className="flex flex-col gap-3 mb-4">
                            <div>
                                <h2 className="text-base font-bold text-gray-900">Önizleme</h2>
                                <p className="text-xs text-gray-500">Tek görüşme tutanağı canlı güncellenir.</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <ActionButton onClick={handleSave} icon={<Save className="w-4 h-4" />}>Kaydet</ActionButton>
                                <ActionButton onClick={handleWord} disabled={busy} icon={<Download className="w-4 h-4" />} primary>Word İndir</ActionButton>
                                <ActionButton onClick={handlePdf} icon={<Printer className="w-4 h-4" />}>PDF İndir</ActionButton>
                                <ActionButton onClick={handleShare} icon={<Share2 className="w-4 h-4" />}>Paylaş</ActionButton>
                            </div>
                        </div>
                        {notice && <Notice notice={notice} />}
                        <div className="max-h-[80vh] overflow-y-auto rounded-lg bg-stone-100 p-4">
                            <DocumentPreview data={data} meta={meta} topic={topic} meetingTypeLabel={meetingTypeLabel} summaryText={summaryText} />
                        </div>
                    </div>
                </aside>
            </div>

            <div id="parent-meeting-print" className="hidden">
                <DocumentPreview data={data} meta={meta} topic={topic} meetingTypeLabel={meetingTypeLabel} summaryText={summaryText} printMode />
            </div>
        </div>
    )
}

const PrintStyles = () => (
    <style>{`
        @media print {
            body * { visibility: hidden !important; }
            #parent-meeting-print, #parent-meeting-print * { visibility: visible !important; }
            #parent-meeting-print { display: block !important; position: absolute; left: 0; top: 0; width: 100%; background: white; }
            .print-page { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 22mm; page-break-after: always; box-shadow: none !important; }
            .print-page:last-child { page-break-after: auto; }
        }
    `}</style>
)

const SectionCard = ({ children, tone }) => (
    <section className={`rounded-xl border shadow-sm p-4 ${tone === 'warm' ? 'border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50' : 'border-gray-100 bg-white'}`}>
        {children}
    </section>
)

const SectionTitle = ({ title, helper }) => (
    <div className="mb-4">
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        <p className="text-xs text-gray-500 mt-1">{helper}</p>
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
                ? 'bg-amber-600 text-white hover:bg-amber-700'
                : 'border border-gray-200 bg-white text-gray-700 hover:border-amber-200 hover:bg-amber-50'
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

const DocumentPreview = ({ data, meta, topic, meetingTypeLabel, summaryText, printMode = false }) => {
    const pageClass = printMode
        ? 'print-page bg-white text-black'
        : 'mx-auto mb-4 w-full max-w-[410px] aspect-[210/297] bg-white text-black shadow-lg border border-stone-200 px-8 py-9 text-[9.5px] leading-relaxed'
    const school = meta.schoolName || '................................ OKULU'
    const student = data.studentName || '................................'
    const parent = data.parentName || '................................'
    const classNo = `${data.classSection || '........'} / ${data.schoolNumber || '........'}`

    return (
        <article className={pageClass}>
            <div className="text-center border-b border-black pb-4 mb-6">
                <h2 className="font-bold text-[1.22em] uppercase">{school}</h2>
                <p className="mt-2 font-bold underline text-[1.15em]">VELİ GÖRÜŞME TUTANAĞI</p>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-6">
                <p><strong>Tarih:</strong> {dateText(data.date)}</p>
                <p><strong>Görüşme tipi:</strong> {meetingTypeLabel}</p>
                <p><strong>Öğrenci:</strong> {student}</p>
                <p><strong>Sınıf / No:</strong> {classNo}</p>
                <p><strong>Veli:</strong> {parent}</p>
                <p><strong>Yakınlığı:</strong> {data.relationship || '........'}</p>
                <p className="col-span-2"><strong>Görüşmeyi yapan:</strong> {data.interviewer || '................................'}</p>
            </div>
            <div className="mb-5">
                <p className="font-bold underline mb-2">Görüşme Konusu</p>
                <p>{topic.label}</p>
                <p className="mt-1 text-gray-600">{topic.ref}</p>
            </div>
            <div className="mb-8">
                <p className="font-bold underline mb-2">Görüşme Özeti ve Sonuç</p>
                <div className="min-h-[260px] whitespace-pre-wrap border border-gray-300 p-4">{summaryText || 'Görüşme notları seçildikçe burada resmi özet taslağı oluşur.'}</div>
            </div>
            <div className="grid grid-cols-2 gap-10 pt-8">
                <Signature title={data.interviewer || '................................'} subtitle="Görüşmeyi yapan" />
                <Signature title={parent} subtitle="Veli" />
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

export default ParentMeetingDocsPage
