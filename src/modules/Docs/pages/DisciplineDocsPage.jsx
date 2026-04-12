import React, { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, ChevronDown, Download, Plus, Printer, Save, Share2, ShieldAlert, Trash2 } from 'lucide-react'
import { generateDisciplineDocx } from '../engine/disciplineDocxGenerator'
import { loadDisciplineDraft, loadMeta, saveDisciplineDraft } from '../storage/docsStorage'

const INCIDENTS = [
    {
        id: 'lesson',
        label: 'Ders düzenini bozma',
        ref: 'Sınıf içi düzen',
        text: 'Öğrencinin ders sırasında dersin akışını bozacak davranışlar sergilediği ve yapılan uyarılara rağmen bu tutumunu sürdürdüğü gözlemlenmiştir.',
        notes: ['Söz almadan konuştu', 'Ders akışını böldü', 'Arkadaşlarının dikkatini dağıttı', 'Uyarıları dikkate almadı']
    },
    {
        id: 'disrespect',
        label: 'Kaba ve saygısız davranma',
        ref: 'Okul davranış kuralları',
        text: 'Öğrencinin okul ortamında öğretmenlerine, okul çalışanlarına veya arkadaşlarına karşı kaba, saygısız ve okul düzenine uygun olmayan davranışlar sergilediği görülmüştür.',
        notes: ['Uygunsuz ifade kullandı', 'Olumsuz tavır sergiledi', 'Saygı sınırlarını aştı', 'Sınıf huzurunu bozdu']
    },
    {
        id: 'fight',
        label: 'Kavga / fiziksel müdahale',
        ref: 'Güvenli okul ortamı',
        text: 'Öğrencinin okul ortamında başka bir öğrenciyle tartışmaya girdiği ve olayın fiziksel müdahale boyutuna ulaştığı tespit edilmiştir.',
        notes: ['Tartışmayı sürdürdü', 'Fiziksel müdahalede bulundu', 'Güvenliği etkiledi', 'Olay sonrası sakinleşmekte zorlandı']
    },
    {
        id: 'dress',
        label: 'Kılık kıyafet kurallarına uymama',
        ref: 'Okul kıyafet düzeni',
        text: 'Öğrencinin okul tarafından belirlenen kılık kıyafet kurallarına aykırı davrandığı ve yapılan uyarılara rağmen durumun devam ettiği gözlemlenmiştir.',
        notes: ['Okul formasına uymadı', 'Uyarıya rağmen düzeltmedi', 'Kıyafet düzenini ihlal etti', 'Okul ciddiyetine uygun davranmadı']
    },
    {
        id: 'cheating',
        label: 'Kopya çekmek / yardım etmek',
        ref: 'Sınav güvenliği',
        text: 'Öğrencinin sınav veya değerlendirme sırasında kopya çekme girişiminde bulunduğu ya da başka bir öğrenciye yardım ettiği tespit edilmiştir.',
        notes: ['İzinsiz materyal kullandı', 'Yardım alırken görüldü', 'Başka öğrenciye yardım etti', 'Sınav düzenini ihlal etti']
    },
    {
        id: 'insult',
        label: 'Öğretmene hakaret',
        ref: 'Öğretmene saygı',
        text: 'Öğrencinin öğretmene karşı küçük düşürücü, incitici veya saygı sınırlarını aşan sözlü davranışta bulunduğu belirlenmiştir.',
        notes: ['Uygunsuz hitap kullandı', 'Yüksek sesle tepki gösterdi', 'Kırıcı ifade kullandı', 'Uyarıya olumsuz karşılık verdi']
    },
    {
        id: 'phone',
        label: 'Telefon / cihaz kullanımı',
        ref: 'Ders içi teknoloji kullanımı',
        text: 'Öğrencinin ders sırasında bilişim aracını izinsiz kullandığı ve bu durumun dersin işlenişini olumsuz etkilediği belirlenmiştir.',
        notes: ['Derste telefon kullandı', 'Uyarıya rağmen cihazı bırakmadı', 'İzinsiz kayıt aldı', 'Ders odağını dağıttı']
    },
    {
        id: 'tobacco',
        label: 'Tütün ürünleri bulundurma / kullanma',
        ref: 'Okul sağlığı ve güvenliği',
        text: 'Öğrencinin okul sınırları içerisinde tütün veya tütün ürünü bulundurduğu ya da kullandığı tespit edilmiştir.',
        notes: ['Üzerinde bulundurdu', 'Okul alanında kullandı', 'Okul sağlığını tehlikeye attı', 'Uyarıya rağmen davranışı sürdürdü']
    },
    {
        id: 'makeup',
        label: 'Makyaj',
        ref: 'Okul görünüm kuralları',
        text: 'Öğrencinin okulun görünüm ve düzen kurallarına aykırı şekilde makyaj yaptığı ve yapılan uyarıların kayıt altına alınması gerektiği değerlendirilmiştir.',
        notes: ['Uyarıya rağmen düzeltmedi', 'Okul kurallarına aykırı görünüm', 'Tekrarlayan durum olarak gözlendi', 'Rehberlik uyarısı yapıldı']
    }
]

const DEFENSES = [
    ['none', 'Yok'],
    ['blank', 'Boş savunma sayfası'],
    ['filled', 'Savunmayı şimdi yaz']
]

const WITNESS_ROLES = ['Tanık Öğretmen', 'Şahit', 'Gözlemci', 'Rehberlik Öğretmeni', 'Müdür Yardımcısı', 'Müdür']

const inputClass = 'w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-[13px] text-gray-900 outline-none transition-all focus:border-red-300 focus:ring-4 focus:ring-red-50'
const dateText = value => value ? value.split('-').reverse().join('.') : ''
const lowerFirst = value => value ? value.charAt(0).toLocaleLowerCase('tr-TR') + value.slice(1) : value
const textValue = value => String(value || '').trim()

const normalizeDraft = (draft) => {
    if (!draft || typeof draft !== 'object') return null
    return {
        studentName: textValue(draft.studentName),
        classSection: textValue(draft.classSection),
        schoolNumber: textValue(draft.schoolNumber),
        date: draft.date || new Date().toISOString().split('T')[0],
        incidentId: INCIDENTS.some(item => item.id === draft.incidentId) ? draft.incidentId : INCIDENTS[0].id,
        notes: Array.isArray(draft.notes) ? draft.notes.filter(note => typeof note === 'string') : [],
        extraNote: textValue(draft.extraNote),
        defenseMode: DEFENSES.some(([value]) => value === draft.defenseMode) ? draft.defenseMode : 'none',
        defenseText: textValue(draft.defenseText),
        witnesses: Array.isArray(draft.witnesses)
            ? draft.witnesses.map((witness, index) => ({
                id: witness.id || `draft-${index}`,
                role: WITNESS_ROLES.includes(witness.role) ? witness.role : WITNESS_ROLES[0],
                fullName: textValue(witness.fullName)
            }))
            : []
    }
}

const buildDraft = (data) => ({
    studentName: data.studentName,
    classSection: data.classSection,
    schoolNumber: data.schoolNumber,
    date: data.date,
    incidentId: data.incidentId,
    notes: data.notes,
    extraNote: data.extraNote,
    defenseMode: data.defenseMode,
    defenseText: data.defenseText,
    witnesses: data.witnesses.map(witness => ({
        id: witness.id,
        role: witness.role,
        fullName: witness.fullName
    }))
})

const DisciplineDocsPage = () => {
    const [meta, setMeta] = useState({})
    const [advanced, setAdvanced] = useState(false)
    const [busy, setBusy] = useState(false)
    const [notice, setNotice] = useState(null)
    const [data, setData] = useState({
        studentName: '',
        classSection: '',
        schoolNumber: '',
        date: new Date().toISOString().split('T')[0],
        incidentId: INCIDENTS[0].id,
        notes: [],
        extraNote: '',
        defenseMode: 'none',
        defenseText: '',
        witnesses: []
    })

    useEffect(() => {
        const draft = normalizeDraft(loadDisciplineDraft())
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

    const incident = INCIDENTS.find(item => item.id === data.incidentId) || INCIDENTS[0]
    const missingContext = [
        !meta.schoolName ? 'Okul' : null,
        !meta.teacherName ? 'Öğretmen' : null
    ].filter(Boolean)

    const detailText = [
        incident.text,
        data.notes.length
            ? `Olay sırasında ${data.notes.map(lowerFirst).join('; ')}.`
            : '',
        data.extraNote.trim() ? `Ayrıca, ${data.extraNote.trim()}` : ''
    ].filter(Boolean).join('\n\n')

    const setField = (field, value) => {
        setData(prev => ({ ...prev, [field]: value }))
        setNotice(null)
    }

    const setIncident = incidentId => {
        setData(prev => ({ ...prev, incidentId, notes: [] }))
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
        if (missingContext.length) return `Üstteki belge bağlamından eksik bilgileri tamamlayın: ${missingContext.join(', ')}.`
        if (!data.studentName.trim()) return 'Öğrenci adı zorunlu.'
        if (!data.classSection.trim()) return 'Sınıf / şube zorunlu.'
        if (data.defenseMode === 'filled' && !data.defenseText.trim()) return 'Savunmayı şimdi yaz seçildiğinde savunma metni girilmelidir.'
        return null
    }

    const docData = () => ({
        ...meta,
        className: data.classSection.trim(),
        studentName: data.studentName.trim(),
        schoolNumber: data.schoolNumber.trim(),
        incidentType: incident.label,
        incidentReference: incident.ref,
        incidentSeed: incident.text,
        quickNotes: data.notes,
        extraNote: data.extraNote.trim(),
        incidentNote: detailText,
        witnesses: data.witnesses
            .map(witness => ({ role: witness.role.trim(), fullName: witness.fullName.trim() }))
            .filter(witness => witness.role || witness.fullName),
        defenseMode: data.defenseMode,
        defenseText: data.defenseText.trim(),
        reportDate: dateText(data.date)
    })

    const handleWord = async () => {
        const error = validate()
        if (error) return setNotice({ type: 'error', text: error })
        setBusy(true)
        const result = await generateDisciplineDocx(docData())
        setBusy(false)
        setNotice(result.success
            ? { type: 'success', text: 'Word belgesi hazırlandı.' }
            : { type: 'error', text: result.error || 'Word belgesi oluşturulamadı.' })
    }

    const handlePdf = () => {
        const error = validate()
        if (error) return setNotice({ type: 'error', text: error })
        const title = document.title
        document.title = `Disiplin_Tutanagi_${data.studentName.trim().replace(/\s+/g, '_')}`
        window.print()
        document.title = title
    }

    const handleShare = async () => {
        const error = validate()
        if (error) return setNotice({ type: 'error', text: error })
        const text = `Disiplin Olay Tutanağı\nÖğrenci: ${data.studentName}\nSınıf: ${data.classSection}\nOlay tipi: ${incident.label}\n\n${detailText}`
        try {
            if (navigator.share) await navigator.share({ title: 'Disiplin Olay Tutanağı', text })
            else {
                await navigator.clipboard.writeText(text)
                setNotice({ type: 'success', text: 'Paylaşım metni panoya kopyalandı.' })
            }
        } catch (err) {
            if (err.name !== 'AbortError') setNotice({ type: 'error', text: 'Paylaşım başlatılamadı.' })
        }
    }

    const handleSave = () => {
        const saved = saveDisciplineDraft(buildDraft(data))
        setNotice(saved
            ? { type: 'success', text: 'Taslak kaydedildi. Bu sayfaya döndüğünüzde kaldığınız yerden devam edebilirsiniz.' }
            : { type: 'error', text: 'Taslak kaydedilemedi.' })
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
        setData(prev => ({
            ...prev,
            witnesses: prev.witnesses.filter(witness => witness.id !== id)
        }))
        setNotice(null)
    }

    return (
        <div className="relative left-1/2 w-[min(1500px,calc(100vw-3rem))] -translate-x-1/2 animate-fade-in pb-12">
            <PrintStyles />

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(620px,1fr)_minmax(390px,0.72fr)] gap-6 items-start">
                <section className="no-print space-y-4">
                    <SectionCard tone="warm">
                        <div className="flex items-center gap-3 mb-5">
                            <span className="w-9 h-9 rounded-lg bg-white text-red-600 flex items-center justify-center border border-red-100 shadow-sm">
                                <ShieldAlert className="w-5 h-5" />
                            </span>
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-red-600">Belgeler</p>
                                <h1 className="text-xl font-bold text-gray-900">Disiplin Tutanakları</h1>
                            </div>
                        </div>

                        {missingContext.length > 0 && (
                            <div className="mb-4 flex gap-3 rounded-lg border border-amber-100 bg-amber-50 p-3 text-[13px] text-amber-800">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <p>Okul ve öğretmen bilgileri üstteki tek belge bağlamından düzenlenir. Eksik: {missingContext.join(', ')}.</p>
                            </div>
                        )}

                        <SectionTitle title="A. Öğrenci Bilgileri" helper="Resmi tutanak için temel öğrenci ve belge bilgileri." />
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <TextField label="Öğrenci adı" value={data.studentName} onChange={value => setField('studentName', value)} placeholder="Örn: Ali Veli" wide />
                            <TextField label="Sınıf / şube" value={data.classSection} onChange={value => setField('classSection', value)} placeholder="Örn: 9-A" />
                            <TextField label="Okul numarası" value={data.schoolNumber} onChange={value => setField('schoolNumber', value)} placeholder="124" />
                            <div>
                                <Label>Belge tarihi</Label>
                                <input type="date" value={data.date} onChange={event => setField('date', event.target.value)} className={inputClass} />
                            </div>
                        </div>
                    </SectionCard>

                    <SectionCard>
                        <SectionTitle title="B. Olay Bilgileri" helper="Olay tipini seçin, hızlı notlarla belge metnini pratik şekilde oluşturun." />
                        <Label>Olay tipi kartları</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mb-5">
                            {INCIDENTS.map(item => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setIncident(item.id)}
                                    className={`min-h-[86px] rounded-lg border p-3 text-left transition-all ${
                                        data.incidentId === item.id
                                            ? 'border-red-300 bg-red-50 shadow-sm ring-2 ring-red-50'
                                            : 'border-gray-200 bg-white hover:border-red-200 hover:bg-red-50/40'
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
                                    <p className="text-xs text-gray-500">Seçilen notlar belge detayına otomatik eklenir.</p>
                                </div>
                                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">{data.notes.length} seçili</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {incident.notes.map(note => (
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

                        <Label>Serbest kısa olay açıklaması</Label>
                        <textarea
                            value={data.extraNote}
                            onChange={event => setField('extraNote', event.target.value)}
                            rows={3}
                            placeholder="Belgeye eklemek istediğiniz kısa açıklamayı yazın."
                            className={inputClass}
                        />
                    </SectionCard>

                    <SectionCard>
                        <button type="button" onClick={() => setAdvanced(prev => !prev)} className="flex w-full items-center justify-between gap-4 text-left">
                            <SectionTitle title="C. Gelişmiş / Ek Ayarlar" helper="Savunma sayfası ve savunma metni ayarları." noMargin />
                            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${advanced ? 'rotate-180' : ''}`} />
                        </button>

                        {advanced && (
                            <div className="mt-5 border-t border-gray-100 pt-5 space-y-4">
                                <Label>Savunma tipi</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    {DEFENSES.map(([value, label]) => (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => setField('defenseMode', value)}
                                            className={`rounded-lg border px-3 py-2.5 text-[13px] font-semibold transition-all ${
                                                data.defenseMode === value
                                                    ? 'border-red-300 bg-red-50 text-red-800 ring-2 ring-red-50'
                                                    : 'border-gray-200 bg-white text-gray-600 hover:border-red-200 hover:bg-red-50/40'
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                                {data.defenseMode === 'filled' && (
                                    <div>
                                        <Label>Savunma metni</Label>
                                        <textarea
                                            value={data.defenseText}
                                            onChange={event => setField('defenseText', event.target.value)}
                                            rows={5}
                                            placeholder="Öğrencinin savunmasını buraya yazın."
                                            className={inputClass}
                                        />
                                    </div>
                                )}

                                <div className="border-t border-gray-100 pt-4">
                                    <div className="flex items-center justify-between gap-3 mb-3">
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-900">Tanık / gözlemci</h3>
                                            <p className="text-xs text-gray-500">İsteğe bağlı imza alanı ekleyin.</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={addWitness}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 transition-all hover:border-red-200 hover:bg-red-50"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            Tanık / Gözlemci Ekle
                                        </button>
                                    </div>

                                    {data.witnesses.length > 0 && (
                                        <div className="space-y-2">
                                            {data.witnesses.map(witness => (
                                                <div key={witness.id} className="grid grid-cols-1 sm:grid-cols-[170px_1fr_auto] gap-2 rounded-lg border border-gray-100 bg-gray-50 p-2">
                                                    <select
                                                        value={witness.role}
                                                        onChange={event => updateWitness(witness.id, 'role', event.target.value)}
                                                        className={inputClass}
                                                    >
                                                        {WITNESS_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                                                    </select>
                                                    <input
                                                        type="text"
                                                        value={witness.fullName}
                                                        onChange={event => updateWitness(witness.id, 'fullName', event.target.value)}
                                                        placeholder="Ad soyad"
                                                        className={inputClass}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeWitness(witness.id)}
                                                        className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 text-gray-400 transition-all hover:border-red-200 hover:text-red-600"
                                                        title="Tanığı kaldır"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </SectionCard>
                </section>

                <aside className="no-print xl:sticky xl:top-5">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                        <div className="flex flex-col gap-3 mb-4">
                            <div>
                                <h2 className="text-base font-bold text-gray-900">Belge önizleme</h2>
                                <p className="text-xs text-gray-500">A4 görünüm canlı güncellenir.</p>
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
                            <DocumentPages incident={incident} detailText={detailText} data={data} meta={meta} />
                        </div>
                    </div>
                </aside>
            </div>

            <div id="discipline-print" className="hidden">
                <DocumentPages incident={incident} detailText={detailText} data={data} meta={meta} printMode />
            </div>
        </div>
    )
}

const PrintStyles = () => (
    <style>{`
        @media print {
            body * { visibility: hidden !important; }
            #discipline-print, #discipline-print * { visibility: visible !important; }
            #discipline-print { display: block !important; position: absolute; left: 0; top: 0; width: 100%; background: white; }
            .print-page { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 22mm; page-break-after: always; box-shadow: none !important; }
            .print-page:last-child { page-break-after: auto; }
        }
    `}</style>
)

const SectionCard = ({ children, tone }) => (
    <section className={`rounded-xl border shadow-sm p-4 ${tone === 'warm' ? 'border-red-100 bg-gradient-to-r from-red-50 to-amber-50' : 'border-gray-100 bg-white'}`}>
        {children}
    </section>
)

const SectionTitle = ({ title, helper, noMargin = false }) => (
    <div className={noMargin ? '' : 'mb-4'}>
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        <p className="text-xs text-gray-500 mt-1">{helper}</p>
    </div>
)

const Label = ({ children }) => <label className="block text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-1.5">{children}</label>
const TextField = ({ label, value, onChange, placeholder, wide = false }) => (
    <div className={wide ? 'md:col-span-1' : ''}>
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
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'border border-gray-200 bg-white text-gray-700 hover:border-red-200 hover:bg-red-50'
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

const DocumentPages = ({ incident, detailText, data, meta, printMode = false }) => {
    const pageClass = printMode
        ? 'print-page bg-white text-black'
        : 'mx-auto mb-4 w-full max-w-[410px] aspect-[210/297] bg-white text-black shadow-lg border border-stone-200 px-8 py-9 text-[9.5px] leading-relaxed'
    const school = meta.schoolName || '................................ OKULU'
    const teacher = meta.teacherName || '................................'
    const student = data.studentName || '................................'
    const classNo = `${data.classSection || '........'} / ${data.schoolNumber || '........'}`
    const witnesses = (data.witnesses || [])
        .map(witness => ({ role: witness.role?.trim(), fullName: witness.fullName?.trim() }))
        .filter(witness => witness.role || witness.fullName)
    const witnessSigners = witnesses.filter(witness => !isAdministrationWitness(witness))
    const administrationSigners = witnesses.filter(isAdministrationWitness)

    return (
        <>
            <article className={pageClass}>
                <div className="text-center border-b border-black pb-4 mb-6">
                    <h2 className="font-bold text-[1.22em] uppercase">{school}</h2>
                    <p className="mt-2 font-bold underline text-[1.15em]">DİSİPLİN OLAY TUTANAĞI</p>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <p><strong>Tarih:</strong> {dateText(data.date)}</p>
                    <p><strong>Yer:</strong> Okul</p>
                    <p><strong>Öğrenci:</strong> {student}</p>
                    <p><strong>Sınıf / No:</strong> {classNo}</p>
                </div>
                <div className="mb-5">
                    <p className="font-bold underline mb-2">Olay Tipi</p>
                    <p>{incident.label}</p>
                    <p className="mt-1 text-gray-600">{incident.ref}</p>
                </div>
                <div className="mb-8">
                    <p className="font-bold underline mb-2">Olay ve Tespit Detayları</p>
                    <div className="min-h-[190px] whitespace-pre-wrap border border-gray-300 p-4">{detailText}</div>
                </div>
                <div className="pt-8">
                    {witnessSigners.length > 0 && (
                        <div className="grid grid-cols-2 gap-8 mb-10">
                            {witnessSigners.map((witness, index) => (
                                <Signature key={`${witness.role}-${witness.fullName}-${index}`} title={witness.fullName || witness.role} subtitle={witness.fullName ? witness.role : ''} />
                            ))}
                        </div>
                    )}
                    <div className="flex justify-end">
                        <Signature title={teacher} subtitle="Tutanak düzenleyen öğretmen" strong />
                    </div>
                    {administrationSigners.length > 0 && (
                        <div className="mt-10 space-y-8">
                            {administrationSigners.map((witness, index) => (
                                <Signature key={`${witness.role}-${witness.fullName}-${index}`} title={witness.fullName || witness.role} subtitle={witness.fullName ? witness.role : ''} strong />
                            ))}
                        </div>
                    )}
                </div>
            </article>

            {data.defenseMode !== 'none' && (
                <article className={pageClass}>
                    <div className="text-center border-b border-black pb-4 mb-6">
                        <h2 className="font-bold text-[1.22em] uppercase">{school}</h2>
                        <p className="mt-2 font-bold underline text-[1.15em]">ÖĞRENCİ SAVUNMA FORMU</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <p><strong>Tarih:</strong> {dateText(data.date)}</p>
                        <p><strong>Sınıf / No:</strong> {classNo}</p>
                        <p className="col-span-2"><strong>Öğrenci:</strong> {student}</p>
                        <p className="col-span-2"><strong>Konu:</strong> {incident.label}</p>
                    </div>
                    <p className="font-bold underline mb-2">Savunma</p>
                    {data.defenseMode === 'filled' ? (
                        <div className="min-h-[300px] whitespace-pre-wrap border border-gray-300 p-4">{data.defenseText}</div>
                    ) : (
                        <div className="min-h-[300px] border border-gray-300 p-4">
                            {[...Array(9)].map((_, index) => <div key={index} className="h-7 border-b border-gray-300" />)}
                        </div>
                    )}
                    <div className="mt-10 flex justify-end">
                        <Signature title="Öğrenci İmzası" strong />
                    </div>
                </article>
            )}
        </>
    )
}

const Signature = ({ title, subtitle, strong = false }) => (
    <div className="text-center">
        <p className={`mb-12 ${strong ? 'font-bold' : ''}`}>{title}</p>
        {subtitle && <p className="-mt-10 mb-8 text-gray-500">{subtitle}</p>}
        <div className="border-t border-black pt-2">İmza</div>
    </div>
)

const isAdministrationWitness = (witness) => {
    const role = (witness.role || '').toLocaleLowerCase('tr-TR')
    return role === 'müdür' || role === 'müdür yardımcısı'
}

export default DisciplineDocsPage
