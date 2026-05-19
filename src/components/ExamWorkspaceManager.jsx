import React, { useRef } from 'react'
import { Download, Upload, FileJson } from 'lucide-react'

export default function ExamWorkspaceManager({ config, questions, students, grades, onLoad }) {
  const fileInputRef = useRef(null)
  const [successStatus, setSuccessStatus] = React.useState(null)

  const handleExport = () => {
    const workspace = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      config,
      questions,
      students,
      grades
    }

    const dataStr = JSON.stringify(workspace, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const gradeLevel = (config.gradeLevel || '').replace(/\s+/g, '')
    const classSection = (config.classSection || '').trim()
    const course = (config.courseName || 'Ders').replace(/\s+/g, '')
    const exam = (config.examName || 'Sinav').replace(/\s+/g, '')
    
    let filename = `${gradeLevel}${classSection}_${course}_${exam}_Calismasi.json`
    // Temizlik
    filename = filename.replace(/[^a-zA-Z0-9_.]/g, '')
    if (!filename || filename === '_Calismasi.json') filename = 'BiSinif_Calismasi.json'

    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target.result
        const data = JSON.parse(content)

        // Validation
        if (!data.config || !Array.isArray(data.questions) || !Array.isArray(data.students) || typeof data.grades !== 'object') {
          throw new Error('Geçersiz dosya formatı. Bu dosya geçerli bir BiSınıf çalışma dosyası değil.')
        }

        if (window.confirm('DİKKAT:\n\nMevcut sınav çalışmanız (kurulum, liste, notlar) SİLİNECEK ve bu dosyadaki çalışma yüklenecek.\n\nDevam etmek istiyor musunuz?')) {
          // Gecikmeli sıçramayı önlemek ve React batch update'i güvenceye almak için
          // işlemler yapılıyor.
          onLoad({
            config: data.config,
            questions: data.questions,
            students: data.students,
            grades: data.grades
          })
          
          setSuccessStatus('Çalışma başarıyla yüklendi!')
          setTimeout(() => setSuccessStatus(null), 3500)
        }
      } catch (err) {
        alert('Dosya okunurken hata oluştu:\n' + err.message)
      }
      
      // Reset input
      e.target.value = ''
    }
    reader.readAsText(file)
  }

  return (
    <div className="flex items-center gap-2">
      {successStatus && (
        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full animate-in fade-in slide-in-from-right-2">
          {successStatus}
        </span>
      )}
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-full p-0.5 shadow-sm">
        <input 
          type="file" 
          accept=".json" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
        />
        <button
          type="button"
          onClick={handleImportClick}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors"
          title="Çalışmayı İçe Aktar (.json)"
        >
          <Upload className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Çalışmayı İçe Aktar</span>
          <span className="md:hidden">İçe Aktar</span>
        </button>
        <div className="w-px h-3 bg-slate-200 mx-0.5"></div>
        <button
          type="button"
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors"
          title="Çalışmayı Dışa Aktar (.json)"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Çalışmayı Dışa Aktar</span>
          <span className="md:hidden">Dışa Aktar</span>
        </button>
      </div>
    </div>
  )
}
