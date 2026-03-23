import React, { useCallback, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Alert, AlertDescription } from './ui/Alert'
import { Upload, AlertCircle, CheckCircle2, ChevronDown, ChevronRight, Users, Database } from 'lucide-react'
import * as XLSX from 'xlsx'
import { classRepo } from '../modules/ClassManagement/repo/classRepo'

/**
 * BiSınıf Student Importer
 * Unified component for Exam Analysis and Class Roster
 * Supports: Excel upload, paste, manual entry
 */

const StudentImporter = ({
    onImport, // Callback for Exam module specific state update
    existingStudents = [],
    compact = false,
    target = 'exam' // 'exam' | 'roster'
}) => {
    const [mode, setMode] = useState('excel') // 'excel' | 'paste' | 'manual'
    const [students, setStudents] = useState(existingStudents || [])
    const [error, setError] = useState(null)
    const [fileName, setFileName] = useState('')
    const [showTips, setShowTips] = useState(false)
    const [pasteText, setPasteText] = useState('')
    const [hasHeader, setHasHeader] = useState(true)

    // --- PROCESSING LOGIC ---

    const handleStudentsFound = (parsedStudents, sourceName) => {
        try {
            // 1. Save to Roster (Always)
            console.log(`[StudentImporter] Upserting ${parsedStudents.length} students to Roster...`)
            const result = classRepo.upsertRosterBulk(parsedStudents)

            // 2. Update Local/External State if needed
            if (onImport) {
                onImport(parsedStudents)
            }

            setStudents(parsedStudents)
            setFileName(sourceName)
            setError(null)

            console.log('[StudentImporter] Import success', result)
        } catch (err) {
            console.error(err)
            setError('Kayıt sırasında hata oluştu: ' + err.message)
        }
    }

    // Normalize Turkish characters
    const normalizeTurkish = (str) => {
        if (!str) return ''
        return String(str)
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/ı/g, 'i')
            .replace(/ş/g, 's')
            .replace(/ğ/g, 'g')
            .replace(/ü/g, 'u')
            .replace(/ö/g, 'o')
            .replace(/ç/g, 'c')
    }

    const cleanValue = (val) => {
        if (val === null || val === undefined) return ''
        return String(val).trim().replace(/\s+/g, ' ')
    }

    const detectColumnType = (headerText) => {
        const normalized = normalizeTurkish(headerText)

        if (
            normalized.includes('okul no') ||
            normalized.includes('ogrenci no') ||
            normalized.includes('ogr no') ||
            normalized === 'no' ||
            normalized === 'numara'
        ) return 'STUDENT_NUMBER'

        if (
            normalized.includes('ad soyad') ||
            normalized.includes('adi soyadi') ||
            normalized.includes('ad-soyad') ||
            normalized.includes('ogrenci') && !normalized.includes('no') ||
            normalized.includes('isim') ||
            normalized === 'ad'
        ) return 'NAME'

        return null
    }

    const generateTempId = (studentNumber, name, index) => {
        // Temporary ID for UI until saved to repo
        return `temp-${studentNumber || 'nonum'}-${index}-${Date.now()}`
    }

    const parseTableData = (rows, autoDetectHeader = true) => {
        if (!rows || rows.length === 0) return { error: 'Veri bulunamadı.' }

        let headerRowIndex = -1
        let studentNumberCol = -1
        let nameCol = -1

        if (autoDetectHeader) {
            for (let i = 0; i < Math.min(10, rows.length); i++) {
                const row = rows[i]
                if (!row || row.length < 1) continue
                let foundHeaders = 0
                for (let j = 0; j < row.length; j++) {
                    const cellValue = row[j]
                    if (!cellValue) continue
                    const columnType = detectColumnType(cellValue)
                    if (columnType === 'STUDENT_NUMBER' && studentNumberCol === -1) {
                        studentNumberCol = j
                        foundHeaders++
                    } else if (columnType === 'NAME' && nameCol === -1) {
                        nameCol = j
                        foundHeaders++
                    }
                }
                if (foundHeaders >= 1 && nameCol !== -1) {
                    headerRowIndex = i
                    break
                }
            }
        } else {
            headerRowIndex = -1
            if (rows.length > 0) {
                const firstRow = rows[0]
                if (firstRow.length >= 2) {
                    studentNumberCol = 0
                    nameCol = 1
                } else if (firstRow.length === 1) {
                    nameCol = 0
                }
            }
        }

        if (nameCol === -1) return { error: 'İsim sütunu bulunamadı.' }

        const parsedStudents = []
        const startRow = headerRowIndex + 1
        const seenNames = new Set()

        for (let i = startRow; i < rows.length; i++) {
            const row = rows[i]
            if (!row || row.length === 0) continue

            const rawName = row[nameCol]
            const studentName = cleanValue(rawName)
            if (!studentName) continue

            if (seenNames.has(studentName.toLowerCase())) continue
            seenNames.add(studentName.toLowerCase())

            const rawNumber = studentNumberCol !== -1 ? row[studentNumberCol] : null
            const studentNumber = cleanValue(rawNumber)

            parsedStudents.push({
                id: generateTempId(studentNumber, studentName, i),
                siraNo: String(parsedStudents.length + 1),
                studentNumber: studentNumber || null,
                no: studentNumber || null,
                name: studentName, // Exam schema uses 'name'
                fullName: studentName, // Roster schema uses 'fullName'
                schoolNo: studentNumber || null // Roster schema uses 'schoolNo'
            })
        }

        if (parsedStudents.length === 0) return { error: 'Öğrenci verisi bulunamadı.' }

        const hasNumbers = parsedStudents.some(s => s.studentNumber)
        const warning = !hasNumbers ? `⚠️ UYARI: Okul numarası bulunamadı.` : null

        return { students: parsedStudents, warning }
    }

    const parseExcelFile = useCallback((file) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result)
                const workbook = XLSX.read(data, { type: 'array' })
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })
                const result = parseTableData(jsonData, true)
                if (result.error) {
                    setError(result.error)
                    return
                }
                handleStudentsFound(result.students, file.name)
                if (result.warning) setError(result.warning)
            } catch (err) {
                setError('Excel hatası: ' + err.message)
            }
        }
        reader.readAsArrayBuffer(file)
    }, [])

    const handlePaste = () => {
        if (!pasteText.trim()) { setError('Lütfen liste yapıştırın.'); return }
        try {
            const lines = pasteText.trim().split('\n')
            const rows = lines.map(line => {
                if (line.includes('\t')) return line.split('\t').map(c => c.trim())
                return line.split(/\s{2,}/).map(c => c.trim())
            })
            const result = parseTableData(rows, hasHeader)
            if (result.error) { setError(result.error); return }
            handleStudentsFound(result.students, 'Pano Verisi')
            setPasteText('')
        } catch (err) {
            setError('İşlem hatası: ' + err.message)
        }
    }

    const handleAddManual = () => {
        const newStudent = {
            id: `manual-${Date.now()}`,
            siraNo: String(students.length + 1),
            studentNumber: '', no: '',
            name: 'Yeni Öğrenci',
            fullName: 'Yeni Öğrenci', schoolNo: ''
        }
        const updated = [...students, newStudent]
        handleStudentsFound(updated, 'Manuel Giriş')
    }

    const handleFileInput = (e) => {
        if (e.target.files.length > 0) parseExcelFile(e.target.files[0])
    }

    // --- RENDER ---

    if (compact) {
        return (
            <div className="relative flex items-center justify-end">
                <div className="flex items-center bg-white border border-slate-200 p-0.5 rounded-lg shadow-sm">
                    {/* Excel Upload */}
                    <input type="file" id="file-upload-c" className="hidden" accept=".xlsx,.xls" onChange={handleFileInput} />
                    <label 
                        htmlFor="file-upload-c" 
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-md cursor-pointer transition-colors" 
                        title="Excel'den Öğrenci Yükle"
                    >
                        <Upload className="w-3.5 h-3.5" /> 
                        <span className="hidden sm:inline">Excel Yükle</span>
                        <span className="sm:hidden">Excel</span>
                    </label>

                    <div className="w-px h-4 bg-slate-200 mx-0.5"></div>

                    {/* Paste Toggle */}
                    <button 
                        onClick={() => setMode(mode === 'paste' ? 'none' : 'paste')} 
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${mode === 'paste' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-700'}`}
                        title="Metin Yapıştırarak Ekle"
                    >
                        <span className="hidden sm:inline">Liste Yapıştır</span>
                        <span className="sm:hidden">Yapıştır</span>
                    </button>

                    <div className="w-px h-4 bg-slate-200 mx-0.5"></div>

                    {/* Manual */}
                    <button 
                        onClick={handleAddManual} 
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                        title="Boş Satır Ekle"
                    >
                        <span className="text-lg leading-none mt-[-2px]">+</span>
                        <span className="hidden sm:inline">Satır Ekle</span>
                    </button>
                </div>
                
                {/* Paste Popover Absolute Positioned */}
                {mode === 'paste' && (
                  <div className="absolute top-10 right-0 z-50 bg-white border border-slate-200 shadow-xl rounded-xl p-3 w-80 flex flex-col gap-2">
                     <p className="text-[10px] text-slate-500 font-medium">Excel veya e-Okul'dan kopyaladığınız listeyi aşağıya yapıştırın.</p>
                     <textarea 
                        value={pasteText} 
                        onChange={(e) => setPasteText(e.target.value)} 
                        placeholder="Öğrenci verilerini buraya yapıştırın..." 
                        className="w-full h-24 p-2 text-xs border border-slate-200 rounded-lg resize-none focus:outline-none focus:border-blue-400" 
                     />
                     <div className="flex justify-end gap-2 mt-1">
                        <Button variant="ghost" size="sm" onClick={() => setMode('none')} className="text-xs h-7 px-3 text-slate-500">İptal</Button>
                        <Button 
                            size="sm" 
                            onClick={() => { 
                                handlePaste(); 
                                if (!error) setMode('none'); 
                            }} 
                            className="text-xs h-7 px-4 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            İşle ve Ekle
                        </Button>
                     </div>
                  </div>
                )}
                
                {error && (
                    <div className="absolute top-10 right-0 z-50 bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded-lg shadow-md flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        <span>{error}</span>
                        <button onClick={() => setError(null)} className="ml-2 font-bold hover:text-red-800">×</button>
                    </div>
                )}
            </div>
        )
    }

    return (
        <Card className="shadow-apple-lg border border-gray-100">
            <CardHeader className="pb-3 border-b border-gray-50">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Users className="w-5 h-5 text-gray-400" />
                        Öğrenci Listesi
                    </CardTitle>
                    {target === 'roster' && (
                        <div className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase rounded tracking-wider">
                            Ana Liste Modu
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
                <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                    {[['excel', 'Excel Yükle'], ['paste', 'Kopyala/Yapıştır'], ['manual', 'Manuel']].map(([m, l]) => (
                        <button key={m} onClick={() => setMode(m)} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${mode === m ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                            {l}
                        </button>
                    ))}
                </div>

                <div className="min-h-[120px] flex flex-col justify-center">
                    {mode === 'excel' && (
                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer group">
                            <input type="file" id="file-upload" className="hidden" accept=".xlsx,.xls" onChange={handleFileInput} />
                            <label htmlFor="file-upload" className="cursor-pointer block">
                                <Upload className="w-8 h-8 text-gray-300 group-hover:text-blue-500 mx-auto mb-2 transition-colors" />
                                <p className="text-sm font-medium text-gray-700">Excel Dosyası Seç</p>
                                <p className="text-xs text-gray-400 mt-1">Sürükleyip bırakabilirsiniz</p>
                            </label>
                        </div>
                    )}

                    {mode === 'paste' && (
                        <div className="space-y-2">
                            <textarea value={pasteText} onChange={e => setPasteText(e.target.value)} className="w-full h-32 p-3 text-xs border border-gray-200 rounded-xl resize-none focus:outline-none focus:border-blue-500" placeholder="Excel veya e-Okul listesini buraya yapıştırın..." />
                            <Button onClick={handlePaste} className="w-full">Listeyi İşle</Button>
                        </div>
                    )}

                    {mode === 'manual' && (
                        <div className="text-center py-6">
                            <Button onClick={handleAddManual} variant="outline" className="mx-auto">
                                + Boş Öğrenci Ekle
                            </Button>
                            <p className="text-xs text-gray-400 mt-2">Listeye boş satır eklenir, tabloda düzenleyebilirsiniz.</p>
                        </div>
                    )}
                </div>

                {error && (
                    <Alert variant={error.includes('UYARI') ? 'default' : 'destructive'} className={error.includes('UYARI') ? 'bg-amber-50 text-amber-800 border-amber-200' : ''}>
                        <AlertDescription className="text-xs">{error}</AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    )
}

export default StudentImporter
