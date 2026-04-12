const MIME_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export const generateDisciplineDocx = async (data) => {
    try {
        const PizZipModule = await import('pizzip')
        const PizZip = PizZipModule.default
        const zip = new PizZip()

        zip.file('[Content_Types].xml', contentTypesXml)
        zip.folder('_rels').file('.rels', packageRelsXml)
        zip.folder('word').file('document.xml', buildDocumentXml(data))
        zip.folder('word').file('styles.xml', stylesXml)
        zip.folder('word/_rels').file('document.xml.rels', documentRelsXml)

        const blob = zip.generate({
            type: 'blob',
            mimeType: MIME_TYPE,
            compression: 'DEFLATE'
        })

        saveBlob(blob, buildFilename(data))
        return { success: true }
    } catch (error) {
        console.error('[DocsDisciplineEngine] Generation failed:', error)
        return { success: false, error: error.message }
    }
}

const buildDocumentXml = (data) => {
    const officialBody = buildOfficialBody(data)
    const studentName = normalizePersonName(data.studentName)
    const body = [
        titleBlock(data),
        p('DİSİPLİN OLAY TUTANAĞI', { align: 'center', bold: true, underline: true, size: 28, after: 360 }),
        p(`Tarih: ${data.reportDate || dateToday()}`, { after: 120 }),
        p(`Öğrenci Adı Soyadı: ${studentName}`, { after: 120 }),
        p(`Sınıf / Şube: ${data.className}`, { after: 120 }),
        data.schoolNumber ? p(`Okul Numarası: ${data.schoolNumber}`, { after: 120 }) : '',
        p('', { after: 180 }),
        p('TUTANAK METNİ', { bold: true, underline: true, after: 180 }),
        ...officialBody.map(text => p(text, { align: 'both', firstLine: true, after: 220 })),
        p('İşbu tutanak, belirtilen olayın kayda geçirilmesi amacıyla düzenlenmiştir.', { align: 'both', firstLine: true, after: 420, keepNext: true, keepLines: true }),
        signatureBlock(data.teacherName, data.witnesses),
        data.defenseMode !== 'none' ? pageBreak() : '',
        data.defenseMode !== 'none' ? defensePage(data) : ''
    ].filter(Boolean).join('')

    return xmlWrapper(body)
}

const buildOfficialBody = (data) => {
    const student = normalizePersonName(data.studentName || 'ilgili öğrenci')
    const classText = data.className ? `${normalizeInline(data.className)} sınıfı` : 'ilgili sınıf'
    const schoolNumber = data.schoolNumber ? ` (${normalizeInline(data.schoolNumber)})` : ''
    const date = data.reportDate || dateToday()
    const paragraphs = [
        `${date} tarihinde ${classText} öğrencisi ${student}${schoolNumber} hakkında aşağıdaki gözlem ve açıklamalar tutanak altına alınmıştır.`,
        getIncidentObservation(data),
        buildQuickNoteParagraph(data.quickNotes),
        data.extraNote ? `Ayrıca, ${normalizeBodyText(data.extraNote)}` : ''
    ].filter(Boolean)

    return paragraphs.length > 1 ? paragraphs : splitParagraphs(data.incidentNote)
}

const buildQuickNoteParagraph = (notes = []) => {
    if (!Array.isArray(notes) || notes.length === 0) return ''
    const clauses = notes.map(noteToClause).filter(Boolean)
    if (clauses.length === 0) return ''
    return `Aynı olay kapsamında öğrencinin ${joinTurkish(clauses)} da gözlenmiştir.`
}

const getIncidentObservation = (data) => {
    const incidentType = normalizeInline(data.incidentType || '').toLocaleLowerCase('tr-TR')
    const observations = [
        ['ders düzenini bozma', 'Ders sırasında sınıf düzenini ve dersin akışını etkileyen bir davranış gözlenmiştir.'],
        ['kaba ve saygısız davranma', 'Öğrencinin okul ortamında saygı sınırlarıyla bağdaşmayan bir davranış sergilediği görülmüştür.'],
        ['kavga / fiziksel müdahale', 'Öğrencinin dahil olduğu tartışmanın fiziksel müdahale boyutuna ulaştığı görülmüştür.'],
        ['kılık kıyafet', 'Öğrencinin kılık kıyafet düzeniyle ilgili okul kurallarına uygun olmayan bir durumda olduğu görülmüştür.'],
        ['kopya çekmek', 'Sınav veya değerlendirme sırasında sınav düzeniyle bağdaşmayan bir durum tespit edilmiştir.'],
        ['öğretmene hakaret', 'Öğrencinin öğretmene yönelik uygun olmayan sözlü davranışta bulunduğu görülmüştür.'],
        ['telefon / cihaz', 'Ders sırasında bilişim aracı kullanımıyla ilgili okul kurallarına uygun olmayan bir durum gözlenmiştir.'],
        ['tütün ürünleri', 'Okul sınırları içinde tütün ürünüyle ilgili okul kurallarına uygun olmayan bir durum tespit edilmiştir.'],
        ['makyaj', 'Öğrencinin okul görünüm kurallarıyla ilgili uygun olmayan bir durumda olduğu görülmüştür.']
    ]
    const match = observations.find(([key]) => incidentType.includes(key))
    return match ? match[1] : normalizeBodyText(data.incidentSeed || firstParagraph(data.incidentNote))
}

const noteToClause = (note) => {
    const clauses = {
        'Söz almadan konuştu': 'söz almadan konuştuğu',
        'Ders akışını böldü': 'ders akışını böldüğü',
        'Arkadaşlarının dikkatini dağıttı': 'arkadaşlarının dikkatini dağıttığı',
        'Uyarıları dikkate almadı': 'yapılan uyarıları dikkate almadığı',
        'Uygunsuz ifade kullandı': 'uygunsuz ifadeler kullandığı',
        'Olumsuz tavır sergiledi': 'olumsuz tavır sergilediği',
        'Saygı sınırlarını aştı': 'saygı sınırlarıyla bağdaşmayan davranışta bulunduğu',
        'Sınıf huzurunu bozdu': 'sınıf içi düzeni etkilediği',
        'Tartışmayı sürdürdü': 'tartışmayı sürdürdüğü',
        'Fiziksel müdahalede bulundu': 'fiziksel müdahalede bulunduğu',
        'Güvenliği etkiledi': 'ortamın güvenliğini olumsuz etkileyen davranışta bulunduğu',
        'Olay sonrası sakinleşmekte zorlandı': 'olay sonrasında sakinleşmekte zorlandığı',
        'Okul formasına uymadı': 'okul formasına uygun giyinmediği',
        'Uyarıya rağmen düzeltmedi': 'uyarıya rağmen davranışını düzeltmediği',
        'Kıyafet düzenini ihlal etti': 'kıyafet düzenini ihlal ettiği',
        'Okul ciddiyetine uygun davranmadı': 'okul ortamına uygun olmayan bir görünüm sergilediği',
        'İzinsiz materyal kullandı': 'izinsiz materyal kullandığı',
        'Yardım alırken görüldü': 'yardım alırken görüldüğü',
        'Başka öğrenciye yardım etti': 'başka bir öğrenciye yardım ettiği',
        'Sınav düzenini ihlal etti': 'sınav düzenine uygun olmayan bir davranışta bulunduğu',
        'Uygunsuz hitap kullandı': 'uygunsuz hitap kullandığı',
        'Yüksek sesle tepki gösterdi': 'yüksek sesle tepki gösterdiği',
        'Kırıcı ifade kullandı': 'kırıcı ifadeler kullandığı',
        'Uyarıya olumsuz karşılık verdi': 'uyarıya olumsuz karşılık verdiği',
        'Derste telefon kullandı': 'derste telefon kullandığı',
        'Uyarıya rağmen cihazı bırakmadı': 'uyarıya rağmen cihazı bırakmadığı',
        'İzinsiz kayıt aldı': 'izinsiz kayıt aldığı',
        'Ders odağını dağıttı': 'dersin odağını etkilediği',
        'Üzerinde bulundurdu': 'üzerinde tütün ürünü bulundurduğu',
        'Okul alanında kullandı': 'okul alanında tütün ürünü kullandığı',
        'Okul sağlığını tehlikeye attı': 'okul sağlığı açısından uygun olmayan bir durum oluşturduğu',
        'Uyarıya rağmen davranışı sürdürdü': 'uyarıya rağmen davranışı sürdürdüğü',
        'Okul kurallarına aykırı görünüm': 'okul kurallarına aykırı görünümle geldiği',
        'Tekrarlayan durum olarak gözlendi': 'durumun tekrar ettiği',
        'Rehberlik uyarısı yapıldı': 'kendisine rehberlik uyarısı yapıldığı'
    }
    const normalizedNote = normalizeBodyText(note).replace(/[.!?]$/, '')
    return clauses[note] || `${lowerFirst(normalizedNote)} olduğu`
}

const joinTurkish = (items) => {
    if (items.length <= 1) return items[0] || ''
    return `${items.slice(0, -1).join(', ')} ve ${items[items.length - 1]}`
}

const ensureSentence = (text) => {
    const clean = String(text || '').trim()
    if (!clean) return ''
    return /[.!?]$/.test(clean) ? clean : `${clean}.`
}

const firstParagraph = (text) => splitParagraphs(text)[0]

const lowerFirst = value => value ? value.charAt(0).toLocaleLowerCase('tr-TR') + value.slice(1) : value

const normalizeInline = (value) => normalizeBodyText(value).replace(/[.!?]$/, '')

const normalizePersonName = (value) => {
    const clean = String(value || '').replace(/\s+/g, ' ').trim()
    if (!clean) return ''
    if (!isMostlyUppercase(clean)) return clean
    return clean
        .toLocaleLowerCase('tr-TR')
        .split(' ')
        .map(part => part ? part.charAt(0).toLocaleUpperCase('tr-TR') + part.slice(1) : part)
        .join(' ')
}

const normalizeBodyText = (value) => {
    const clean = String(value || '').replace(/\s+/g, ' ').trim()
    if (!clean) return ''
    const sentenceCase = isMostlyUppercase(clean) ? toSentenceCase(clean) : clean
    return ensureSentence(sentenceCase)
}

const isMostlyUppercase = (value) => {
    const letters = Array.from(value).filter(char => char.toLocaleLowerCase('tr-TR') !== char.toLocaleUpperCase('tr-TR'))
    if (letters.length < 4) return false
    const uppercaseCount = letters.filter(char => char === char.toLocaleUpperCase('tr-TR')).length
    return uppercaseCount / letters.length > 0.75
}

const toSentenceCase = (value) => {
    const lower = value.toLocaleLowerCase('tr-TR')
    return lower.charAt(0).toLocaleUpperCase('tr-TR') + lower.slice(1)
}

const titleBlock = (data) => [
    p('T.C.', { align: 'center', bold: true, size: 24, after: 80 }),
    p('MİLLÎ EĞİTİM BAKANLIĞI', { align: 'center', bold: true, size: 24, after: 80 }),
    p((data.schoolName || '................................ OKULU').toUpperCase(), { align: 'center', bold: true, size: 24, after: 360 })
].join('')

const defensePage = (data) => [
    titleBlock(data),
    p('ÖĞRENCİ SAVUNMA FORMU', { align: 'center', bold: true, underline: true, size: 28, after: 360 }),
    p(`Tarih: ${data.reportDate || dateToday()}`, { after: 120 }),
    p(`Öğrenci Adı Soyadı: ${normalizePersonName(data.studentName)}`, { after: 120 }),
    p(`Sınıf / Şube: ${data.className}`, { after: 120 }),
    data.schoolNumber ? p(`Okul Numarası: ${data.schoolNumber}`, { after: 120 }) : '',
    p(`Savunma Konusu: ${data.incidentType}`, { after: 300 }),
    p('SAVUNMA METNİ', { bold: true, underline: true, after: 180 }),
    data.defenseMode === 'filled'
        ? splitParagraphs(data.defenseText).map(text => p(normalizeBodyText(text), { align: 'both', firstLine: true, after: 220 })).join('')
        : blankDefenseLines(),
    p('', { after: 380 }),
    rightSignature('Öğrenci İmzası')
].filter(Boolean).join('')

const signatureBlock = (teacherName, witnesses = []) => {
    const cleanWitnesses = normalizeWitnesses(witnesses)
    const witnessSigners = cleanWitnesses.filter(witness => !isAdministrationSigner(witness))
    const administrationSigners = cleanWitnesses.filter(isAdministrationSigner)

    return signatureTable(witnessSigners, teacherName, administrationSigners)
}

const normalizeWitnesses = (witnesses = []) => {
    if (!Array.isArray(witnesses)) return []
    return witnesses
        .map(witness => ({
            role: normalizeWitnessRole(witness.role),
            fullName: normalizePersonName(witness.fullName || '')
        }))
        .filter(witness => witness.role || witness.fullName)
}

const normalizeWitnessRole = (role) => {
    const clean = normalizeInline(role || 'Tanık / Gözlemci')
    const key = clean.toLocaleLowerCase('tr-TR')
    if (key === 'idareci') return 'Müdür Yardımcısı'
    if (key === 'tanık öğretmen') return 'Tanık Öğretmen'
    if (key === 'rehberlik öğretmeni') return 'Rehberlik Öğretmeni'
    if (key === 'müdür yardımcısı') return 'Müdür Yardımcısı'
    if (key === 'müdür') return 'Müdür'
    if (key === 'şahit') return 'Şahit'
    if (key === 'gözlemci') return 'Gözlemci'
    return clean
}

const isAdministrationSigner = (witness) => {
    const role = (witness.role || '').toLocaleLowerCase('tr-TR')
    return role === 'müdür' || role === 'müdür yardımcısı'
}

const signatureTable = (signers, teacherName, administrationSigners) => {
    const teacherSigner = {
        role: 'Tutanak düzenleyen öğretmen',
        fullName: normalizePersonName(teacherName) || '................................',
        strong: true
    }
    const rows = []

    if (signers.length > 0) {
        rows.push([
            null,
            { label: 'Tanık / gözlemci imzaları' },
            null
        ])
    }

    if (signers.length === 0) {
        rows.push([null, null, teacherSigner])
    } else {
        for (let index = 0; index < signers.length; index += 2) {
            rows.push([
                signers[index] || null,
                signers[index + 1] || null,
                index === 0 ? teacherSigner : null
            ])
        }
    }

    administrationSigners.forEach(signer => {
        rows.push([null, { ...signer, strong: true }, null])
    })

    return `<w:tbl>
<w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/><w:insideH w:val="nil"/><w:insideV w:val="nil"/></w:tblBorders><w:tblCellMar><w:left w:w="120" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tblCellMar></w:tblPr>
<w:tblGrid><w:gridCol w:w="3006"/><w:gridCol w:w="3006"/><w:gridCol w:w="3008"/></w:tblGrid>
${rows.map(row => `<w:tr><w:trPr><w:cantSplit/></w:trPr>${signatureCell(row[0])}${signatureCell(row[1])}${signatureCell(row[2])}</w:tr>`).join('')}
</w:tbl>`
}

const signatureCell = (signer) => `<w:tc>
<w:tcPr><w:tcW w:w="3006" w:type="dxa"/><w:tcBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/></w:tcBorders></w:tcPr>
${signer ? signatureCellContent(signer) : p('', { after: 0 })}
</w:tc>`

const signatureCellContent = (signer) => signer.label
    ? p(signer.label, { align: 'center', size: 20, after: 260, keepNext: true, keepLines: true })
    : signerSignatureBlock(signer, 'center')

const signerSignatureBlock = (signer, align = 'center') => [
    p(signer.fullName || '................................', { align, bold: !!signer.fullName || !!signer.strong, after: 60, keepNext: true, keepLines: true }),
    p(signer.role || 'Tanık / Gözlemci', { align, after: 220, keepNext: true, keepLines: true }),
    p('____________________', { align, after: 30, keepNext: true, keepLines: true }),
    p('İmza', { align, after: 120, keepLines: true })
].join('')

const rightSignature = (title) => [
    p(title, { align: 'right', bold: true, after: 520 }),
    p('İmza', { align: 'right', overline: true, after: 120 })
].join('')

const blankDefenseLines = () => Array.from({ length: 12 }, () => p(' ', { bottomBorder: true, after: 180 })).join('')

const splitParagraphs = (text) => {
    const clean = (text || '').trim()
    return clean ? clean.split(/\n{2,}/).map(item => item.trim()).filter(Boolean) : ['Olayla ilgili açıklama bulunmamaktadır.']
}

const p = (text, options = {}) => {
    const align = options.align ? `<w:jc w:val="${options.align}"/>` : ''
    const spacing = `<w:spacing w:after="${options.after ?? 160}" w:line="276" w:lineRule="auto"/>`
    const keep = `${options.keepNext ? '<w:keepNext/>' : ''}${options.keepLines ? '<w:keepLines/>' : ''}`
    const indent = options.firstLine ? '<w:ind w:firstLine="720"/>' : ''
    const border = options.bottomBorder ? '<w:pBdr><w:bottom w:val="single" w:sz="4" w:space="1" w:color="999999"/></w:pBdr>' : ''
    const pPr = `<w:pPr>${keep}${border}${spacing}${indent}${align}</w:pPr>`
    const bold = options.bold ? '<w:b/>' : ''
    const underline = options.underline ? '<w:u w:val="single"/>' : ''
    const overline = options.overline ? '<w:u w:val="single"/>' : ''
    const size = `<w:sz w:val="${options.size || 24}"/><w:szCs w:val="${options.size || 24}"/>`
    const rPr = `<w:rPr>${bold}${underline || overline}${size}</w:rPr>`
    return `<w:p>${pPr}<w:r>${rPr}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`
}

const pageBreak = () => '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'

const xmlWrapper = (body) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr></w:body>
</w:document>`

const escapeXml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

const dateToday = () => new Date().toLocaleDateString('tr-TR')

const buildFilename = (data) => {
    const student = normalizeFilename(data.studentName || 'Ogrenci')
    const className = normalizeFilename(data.className || 'Sinif')
    const datePart = new Date().toISOString().split('T')[0]
    return `Disiplin_Tutanagi_${student}_${className}_${datePart}.docx`
}

const normalizeFilename = (value) => String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'I')
    .replace(/ş/g, 's')
    .replace(/Ş/g, 'S')
    .replace(/ğ/g, 'g')
    .replace(/Ğ/g, 'G')
    .replace(/ü/g, 'u')
    .replace(/Ü/g, 'U')
    .replace(/ö/g, 'o')
    .replace(/Ö/g, 'O')
    .replace(/ç/g, 'c')
    .replace(/Ç/g, 'C')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '')

const saveBlob = (blob, filename) => {
    if (typeof window === 'undefined') return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 100)
}

const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`

const packageRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`

const documentRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`

const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:style w:type="paragraph" w:default="1" w:styleId="Normal">
<w:name w:val="Normal"/>
<w:qFormat/>
<w:pPr><w:spacing w:after="160" w:line="276" w:lineRule="auto"/></w:pPr>
<w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr>
</w:style>
</w:styles>`
