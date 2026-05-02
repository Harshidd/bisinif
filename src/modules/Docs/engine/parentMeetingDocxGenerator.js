const MIME_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export const generateParentMeetingDocx = async (data) => {
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
        console.error('[DocsParentMeetingEngine] Generation failed:', error)
        return { success: false, error: error.message }
    }
}

const buildDocumentXml = (data) => {
    const sections = buildMeetingSections(data)
    const body = [
        titleBlock(data),
        p('Veli Görüşme Tutanağı', { align: 'center', bold: true, size: 30, after: 260 }),
        infoBlock(data),
        sectionHeading('Görüşme Konusu'),
        p(sections.subject, { align: 'both', firstLine: true, after: 260 }),
        sectionHeading('Görüşme Özeti'),
        ...sections.summary.map(text => p(text, { align: 'both', firstLine: true, after: 220 })),
        sectionHeading('Sonuç ve Öneri'),
        p(sections.result, { align: 'both', firstLine: true, after: 220 }),
        sections.collaboration ? sectionHeading('İş Birliği / Yönlendirme') : '',
        sections.collaboration ? p(sections.collaboration, { align: 'both', firstLine: true, after: 220 }) : '',
        p('', { after: 420 }),
        signatureRow(data)
    ].filter(Boolean).join('')

    return xmlWrapper(body)
}

const buildMeetingSections = (data) => {
    const student = normalizeInline(data.studentName) || 'ilgili öğrenci'
    const parent = normalizeInline(data.parentName) || 'ilgili veli'
    const classText = normalizeInline(data.className)
    const schoolNumber = normalizeInline(data.schoolNumber)
    const classPart = classText ? `${classText}${schoolNumber ? ` / ${schoolNumber}` : ''}` : ''
    const topic = normalizeInline(data.topicLabel || data.subject || 'Veli görüşmesi')
    const subject = normalizeInline(data.subject)
    const meetingType = normalizeInline(data.meetingTypeLabel || 'görüşme')
    const date = data.reportDate || dateToday()
    const paragraphs = splitParagraphs(data.summaryText).filter(item => item !== topic)
    const resultParagraph = paragraphs.find(item => item.toLocaleLowerCase('tr-TR').startsWith('sonuç:'))
    const collaborationParagraph = paragraphs.find(item => item.toLocaleLowerCase('tr-TR').startsWith('iş birliği yapılacak kişi/kurum:'))
    const summaryItems = paragraphs
        .filter(item => item !== resultParagraph && item !== collaborationParagraph)
        .filter(item => !item.toLocaleLowerCase('tr-TR').startsWith('görüşme konusu:'))
        .map(cleanSummaryParagraph)
        .filter(Boolean)
    const resultText = resultParagraph ? stripEnding(resultParagraph.replace(/^Sonuç:\s*/i, '')) : ''
    const collaborationText = collaborationParagraph ? stripEnding(collaborationParagraph.replace(/^İş birliği yapılacak kişi\/kurum:\s*/i, '')) : ''

    return {
        subject: buildSubjectParagraph({ date, student, parent, classPart, meetingType, topic, subject }),
        summary: buildSummaryParagraphs(summaryItems),
        result: resultParagraph
            ? buildResultParagraph(resultText)
            : 'Görüşme sonunda veli bilgilendirilmiş, öğrencinin sürecinin okul ve aile iş birliğiyle takip edilmesi uygun görülmüştür.',
        collaboration: collaborationParagraph
            ? buildCollaborationParagraph(collaborationText)
            : ''
    }
}

const buildSubjectParagraph = ({ date, student, parent, classPart, meetingType, topic, subject }) => {
    const meeting = meetingType.toLocaleLowerCase('tr-TR')
    const topicText = lowerFirst(topic)
    const subjectText = subject ? ` Görüşmede ayrıca ${lowerFirst(stripEnding(subject))} başlığı üzerinde durulmuştur.` : ''
    return normalizeBodyText(`${date} tarihinde ${student}${classPart ? ` (${classPart})` : ''} velisi ${parent} ile ${meeting} görüşme gerçekleştirilmiştir. Görüşmenin ana çerçevesi ${topicText} olarak belirlenmiştir.${subjectText}`)
}

const buildSummaryParagraphs = (items) => {
    if (items.length === 0) {
        return ['Görüşmede öğrenciye ilişkin gözlem, ihtiyaç ve takip başlıkları veli ile paylaşılmıştır.']
    }
    return items.map(item => normalizeBodyText(item))
}

const cleanSummaryParagraph = (text) => {
    const clean = stripEnding(text)
    if (!clean) return ''
    const withoutMeetingPrefix = clean.replace(/^Görüşmede\s+/i, '')
    if (withoutMeetingPrefix !== clean) {
        return `Görüşmede ${lowerFirst(withoutMeetingPrefix)}.`
    }
    return normalizeBodyText(clean)
}

const buildResultParagraph = (resultText) => {
    const items = splitInlineList(resultText).map(resultItemToDecision)
    if (items.length === 0) {
        return 'Görüşme sonunda öğrencinin sürecinin okul ve aile iş birliğiyle takip edilmesi uygun görülmüştür.'
    }
    return normalizeBodyText(`Görüşme sonunda ${joinTurkish(items)} karar verilmiştir`)
}

const resultItemToDecision = (item) => {
    const key = item.toLocaleLowerCase('tr-TR')
    const decisions = {
        'veli bilgilendirildi': 'velinin bilgilendirilmesine',
        'evde takip önerildi': 'evde takibin sürdürülmesine',
        'rehberlik yönlendirmesi yapıldı': 'rehberlik yönlendirmesinin yapılmasına',
        'tekrar görüşme önerildi': 'ihtiyaç halinde tekrar görüşme yapılmasına',
        'idare bilgilendirildi': 'idarenin bilgilendirilmesine'
    }
    return decisions[key] || `${lowerFirst(item)} başlığının takip edilmesine`
}

const buildCollaborationParagraph = (collaborationText) => {
    const clean = stripEnding(collaborationText)
    if (!clean) return ''
    return normalizeBodyText(`Süreç, gerekli görülmesi halinde ${clean} ile iş birliği içinde takip edilecektir`)
}

const titleBlock = (data) => [
    p('T.C.', { align: 'center', bold: true, size: 24, after: 80 }),
    p('MİLLÎ EĞİTİM BAKANLIĞI', { align: 'center', bold: true, size: 24, after: 80 }),
    p((data.schoolName || '................................ OKULU').toUpperCase(), { align: 'center', bold: true, size: 24, after: 300 })
].join('')

const sectionHeading = (title) => p(title, { bold: true, size: 23, after: 120, keepNext: true, keepLines: true })

const infoBlock = (data) => `<w:tbl>
<w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="D9D9D9"/><w:left w:val="single" w:sz="4" w:space="0" w:color="D9D9D9"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="D9D9D9"/><w:right w:val="single" w:sz="4" w:space="0" w:color="D9D9D9"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="E5E5E5"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="E5E5E5"/></w:tblBorders><w:tblCellMar><w:top w:w="100" w:type="dxa"/><w:bottom w:w="100" w:type="dxa"/><w:left w:w="140" w:type="dxa"/><w:right w:w="140" w:type="dxa"/></w:tblCellMar></w:tblPr>
<w:tblGrid><w:gridCol w:w="4510"/><w:gridCol w:w="4510"/></w:tblGrid>
${infoRow(infoText('Öğrenci', withFallback(data.studentName)), infoText('Veli', withFallback(data.parentName)))}
${infoRow(infoText('Sınıf / No', [data.className, data.schoolNumber].filter(Boolean).join(' / ') || '........'), infoText('Yakınlığı', data.relationship || '........'))}
${infoRow(infoText('Tarih', data.reportDate || dateToday()), infoText('Görüşme Tipi', data.meetingTypeLabel || '........'))}
${infoRow(infoText('Görüşmeyi Yapan', withFallback(data.interviewer)), infoText('Okul', data.schoolName || '........'))}
</w:tbl>${p('', { after: 300 })}`

const infoRow = (left, right) => `<w:tr><w:trPr><w:cantSplit/></w:trPr>${infoCell(left)}${infoCell(right)}</w:tr>`

const infoCell = (content) => `<w:tc><w:tcPr><w:tcW w:w="4510" w:type="dxa"/></w:tcPr>${content}</w:tc>`

const infoText = (label, value) => p(`${label}: ${normalizeInline(value)}`, { after: 40, size: 22, keepLines: true })

const withFallback = (value) => normalizeInline(value) || '................................'

const signatureRow = (data) => `<w:tbl>
<w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/><w:insideH w:val="nil"/><w:insideV w:val="nil"/></w:tblBorders><w:tblCellMar><w:left w:w="120" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tblCellMar></w:tblPr>
<w:tblGrid><w:gridCol w:w="4510"/><w:gridCol w:w="4510"/></w:tblGrid>
<w:tr><w:trPr><w:cantSplit/></w:trPr>${signatureCell(data.interviewer || '................................', 'Görüşmeyi yapan')}${signatureCell(data.parentName || '................................', 'Veli')}</w:tr>
</w:tbl>`

const signatureCell = (name, title) => `<w:tc>
<w:tcPr><w:tcW w:w="4510" w:type="dxa"/><w:tcBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/></w:tcBorders></w:tcPr>
${p(normalizeInline(name), { align: 'center', bold: true, after: 80, keepNext: true, keepLines: true })}
${p(title, { align: 'center', after: 300, keepNext: true, keepLines: true })}
${p('____________________', { align: 'center', after: 40, keepNext: true, keepLines: true })}
${p('İmza', { align: 'center', after: 120, keepLines: true })}
</w:tc>`

const splitParagraphs = (text) => {
    const clean = String(text || '').trim()
    return clean ? clean.split(/\n{2,}/).map(item => item.trim()).filter(Boolean) : ['Görüşme özeti henüz eklenmemiştir.']
}

const normalizeInline = (value) => String(value || '').replace(/\s+/g, ' ').trim()

const lowerFirst = (value) => value ? value.charAt(0).toLocaleLowerCase('tr-TR') + value.slice(1) : value

const stripEnding = (value) => normalizeInline(value).replace(/[.!?]$/, '')

const splitInlineList = (value) => stripEnding(value)
    .split(/\s*;\s*/)
    .map(item => stripEnding(item))
    .filter(Boolean)

const joinTurkish = (items) => {
    if (items.length <= 1) return items[0] || ''
    return `${items.slice(0, -1).join(', ')} ve ${items[items.length - 1]}`
}

const normalizeBodyText = (value) => {
    const clean = normalizeInline(value)
    if (!clean) return ''
    return /[.!?]$/.test(clean) ? clean : `${clean}.`
}

const p = (text, options = {}) => {
    const keep = `${options.keepNext ? '<w:keepNext/>' : ''}${options.keepLines ? '<w:keepLines/>' : ''}`
    const spacing = `<w:spacing w:after="${options.after ?? 160}" w:line="276" w:lineRule="auto"/>`
    const indent = options.firstLine ? '<w:ind w:firstLine="720"/>' : ''
    const align = options.align ? `<w:jc w:val="${options.align}"/>` : ''
    const pPr = `<w:pPr>${keep}${spacing}${indent}${align}</w:pPr>`
    const bold = options.bold ? '<w:b/>' : ''
    const underline = options.underline ? '<w:u w:val="single"/>' : ''
    const size = `<w:sz w:val="${options.size || 24}"/><w:szCs w:val="${options.size || 24}"/>`
    const rPr = `<w:rPr>${bold}${underline}${size}</w:rPr>`
    return `<w:p>${pPr}<w:r>${rPr}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`
}

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
    const datePart = new Date().toISOString().split('T')[0]
    return `Veli_Gorusme_Tutanagi_${student}_${datePart}.docx`
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
