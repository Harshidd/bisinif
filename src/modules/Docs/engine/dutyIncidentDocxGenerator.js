const MIME_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export const generateDutyIncidentDocx = async (data) => {
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
        console.error('[DocsDutyIncidentEngine] Generation failed:', error)
        return { success: false, error: error.message }
    }
}

const buildDocumentXml = (data) => {
    const body = [
        titleBlock(data),
        p('Olay / Nöbet Tespit Tutanağı', { align: 'center', bold: true, size: 30, after: 260 }),
        infoBlock(data),
        sectionHeading('Olay Tespiti'),
        ...buildIncidentParagraphs(data).map(text => p(text, { align: 'both', firstLine: true, after: 220 })),
        data.additionalNote ? sectionHeading('Ek Not') : '',
        data.additionalNote ? p(normalizeBodyText(data.additionalNote), { align: 'both', firstLine: true, after: 220 }) : '',
        p('İşbu tutanak, olayın kayıt altına alınması amacıyla düzenlenmiştir.', { align: 'both', firstLine: true, after: 420 }),
        signatureRow(data)
    ].filter(Boolean).join('')

    return xmlWrapper(body)
}

const buildIncidentParagraphs = (data) => {
    const student = normalizeInline(data.studentName) || 'ilgili öğrenci'
    const classInfo = [data.className, data.schoolNumber].map(normalizeInline).filter(Boolean).join(' / ')
    const incidentType = normalizeInline(data.incidentType || 'okul içi olay')
    const place = normalizeInline(data.place || data.dutyArea || 'okul alanı')
    const time = [data.incidentDate || dateToday(), data.incidentTime].map(normalizeInline).filter(Boolean).join(' saat ')
    const notes = Array.isArray(data.quickNotes) ? data.quickNotes.map(normalizeInline).filter(Boolean) : []
    const base = `${time} tarihinde ${place} bölgesinde ${student}${classInfo ? ` (${classInfo})` : ''} ile ilgili ${incidentType.toLocaleLowerCase('tr-TR')} kapsamında bir durum tespit edilmiştir.`
    const detail = notes.length
        ? `Olay kapsamında ${joinTurkish(notes.map(lowerFirst))}.`
        : 'Olay, nöbet/gözlem sorumluluğu kapsamında kayıt altına alınmıştır.'
    const note = data.incidentNote ? normalizeBodyText(data.incidentNote) : ''
    const admin = data.adminNotified ? 'Durum hakkında okul idaresine bilgi verilmiştir.' : ''
    return [base, detail, note, admin].filter(Boolean).map(normalizeBodyText)
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
${infoRow(infoText('Olay Tarihi', data.incidentDate || dateToday()), infoText('Olay Saati', data.incidentTime || '........'))}
${infoRow(infoText('Olay Yeri', data.place || '........'), infoText('Nöbet Bölgesi', data.dutyArea || '........'))}
${infoRow(infoText('Olay Türü', data.incidentType || '........'), infoText('Belge Tarihi', data.documentDate || dateToday()))}
${infoRow(infoText('Öğrenci', data.studentName || '................................'), infoText('Sınıf / No', [data.className, data.schoolNumber].filter(Boolean).join(' / ') || '........'))}
</w:tbl>${p('', { after: 300 })}`

const infoRow = (left, right) => `<w:tr><w:trPr><w:cantSplit/></w:trPr>${infoCell(left)}${infoCell(right)}</w:tr>`

const infoCell = (content) => `<w:tc><w:tcPr><w:tcW w:w="4510" w:type="dxa"/></w:tcPr>${content}</w:tc>`

const infoText = (label, value) => p(`${label}: ${normalizeInline(value)}`, { after: 40, size: 22, keepLines: true })

const signatureRow = (data) => `<w:tbl>
<w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/><w:insideH w:val="nil"/><w:insideV w:val="nil"/></w:tblBorders><w:tblCellMar><w:left w:w="120" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tblCellMar></w:tblPr>
<w:tblGrid><w:gridCol w:w="4510"/><w:gridCol w:w="4510"/></w:tblGrid>
<w:tr><w:trPr><w:cantSplit/></w:trPr>${signatureCell(data.teacherName || '................................', 'Tutanağı düzenleyen')}${signatureCell(data.witnessName || '................................', data.witnessRole || 'Tanık / Gözlemci')}</w:tr>
</w:tbl>`

const signatureCell = (name, title) => `<w:tc>
<w:tcPr><w:tcW w:w="4510" w:type="dxa"/><w:tcBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/></w:tcBorders></w:tcPr>
${p(normalizeInline(name), { align: 'center', bold: true, after: 80, keepNext: true, keepLines: true })}
${p(title, { align: 'center', after: 300, keepNext: true, keepLines: true })}
${p('____________________', { align: 'center', after: 40, keepNext: true, keepLines: true })}
${p('İmza', { align: 'center', after: 120, keepLines: true })}
</w:tc>`

const normalizeInline = (value) => String(value || '').replace(/\s+/g, ' ').trim()

const lowerFirst = (value) => value ? value.charAt(0).toLocaleLowerCase('tr-TR') + value.slice(1) : value

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
    const size = `<w:sz w:val="${options.size || 24}"/><w:szCs w:val="${options.size || 24}"/>`
    const rPr = `<w:rPr>${bold}${size}</w:rPr>`
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
    return `Olay_Nobet_Tespit_Tutanagi_${student}_${datePart}.docx`
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
