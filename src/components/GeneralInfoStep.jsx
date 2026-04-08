import React, { useState, useMemo } from 'react'
import { Card, CardContent } from './ui/Card'
import { Input } from './ui/Input'
import { Select } from './ui/Select'
import { Label } from './ui/Label'
import { Button } from './ui/Button'
import { Building2 } from 'lucide-react'
import { loadInstitution } from '../storage/institutionStore'

const GeneralInfoStep = ({ config, onConfigChange, onNext }) => {
  const [errors, setErrors] = useState({})

  // Ana sayfadaki kurum verilerini al
  const inst = useMemo(() => loadInstitution(), [])

  const validateForm = () => {
    const newErrors = {}
    if (!config.schoolName?.trim()) newErrors.schoolName = 'Okul adı gereklidir'
    if (!config.principalName?.trim()) newErrors.principalName = 'Müdür adı gereklidir'
    if (!config.courseName?.trim()) newErrors.courseName = 'Ders adı gereklidir'
    if (!config.teacherName?.trim()) newErrors.teacherName = 'Öğretmen adı gereklidir'
    if (!config.gradeLevel?.trim()) newErrors.gradeLevel = 'Sınıf seçiniz'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const courseType = config.courseType || 'Genel Ders'

  const handleSubmit = () => {
    if (validateForm()) {
      onNext()
    }
  }

  const gradeLevels = [
    '5. Sınıf',
    '6. Sınıf',
    '7. Sınıf',
    '8. Sınıf',
    '9. Sınıf',
    '10. Sınıf',
    '11. Sınıf',
    '12. Sınıf',
  ]

  const generalCourses = [
    'Matematik',
    'Fen Bilimleri',
    'Sosyal Bilgiler',
    'Tarih',
    'Coğrafya',
    'Fizik',
    'Kimya',
    'Biyoloji',
    'Din Kültürü',
    'Bilişim Teknolojileri',
  ]

  const languageCourses = [
    'Türkçe',
    'Türk Dili ve Edebiyatı',
    'İngilizce',
    'Almanca',
    'Fransızca',
    'Arapça',
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex flex-col items-center sm:items-start text-center sm:text-left">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Genel Bilgiler</h1>
        <p className="text-sm text-gray-500">Sınav bilgilerinizi girin.</p>
      </div>



      <Card className="shadow-apple-md">
        <CardContent className="p-6 md:p-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {!inst.il && (
              <div className="space-y-2">
                <Label htmlFor="city" className="text-gray-600">İl</Label>
                <Input
                  id="city"
                  value={config.city ?? ''}
                  onChange={(e) => onConfigChange({ city: e.target.value })}
                  placeholder="İl adını girin"
                />
              </div>
            )}

            {!inst.ilce && (
              <div className="space-y-2">
                <Label htmlFor="district" className="text-gray-600">İlçe</Label>
                <Input
                  id="district"
                  value={config.district ?? ''}
                  onChange={(e) => onConfigChange({ district: e.target.value })}
                  placeholder="İlçe adını girin"
                />
              </div>
            )}

            {!inst.okulAdi && (
              <div className="space-y-2">
                <Label htmlFor="schoolName" className="text-gray-600">Okul Adı</Label>
                <Input
                  id="schoolName"
                  value={config.schoolName ?? ''}
                  onChange={(e) => onConfigChange({ schoolName: e.target.value })}
                  placeholder="Okul adını girin"
                  className={errors.schoolName ? 'border-red-300 focus:border-red-400' : ''}
                />
                {errors.schoolName && (
                  <p className="text-xs text-red-500">{errors.schoolName}</p>
                )}
              </div>
            )}

            {!inst.mudurAdi && (
              <div className="space-y-2">
                <Label htmlFor="principalName" className="text-gray-600">Okul Müdürü</Label>
                <Input
                  id="principalName"
                  value={config.principalName ?? ''}
                  onChange={(e) => onConfigChange({ principalName: e.target.value })}
                  placeholder="Müdür adını girin"
                  className={errors.principalName ? 'border-red-300 focus:border-red-400' : ''}
                />
                {errors.principalName && (
                  <p className="text-xs text-red-500">{errors.principalName}</p>
                )}
              </div>
            )}

            <div className="space-y-3 col-span-1 md:col-span-2">
              <Label className="text-gray-600 font-medium">Ders Türü</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div 
                  onClick={() => onConfigChange({ courseType: 'Genel Ders', courseName: '' })}
                  className={`relative flex cursor-pointer rounded-xl border p-4 shadow-sm transition-all focus:outline-none ${courseType === 'Genel Ders' ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                >
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center">
                      <div className={`flex shrink-0 items-center justify-center rounded-full w-10 h-10 mr-3 ${courseType === 'Genel Ders' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="text-sm">
                        <p className={`font-semibold ${courseType === 'Genel Ders' ? 'text-blue-900' : 'text-gray-900'}`}>Genel Ders</p>
                        <p className={`mt-0.5 ${courseType === 'Genel Ders' ? 'text-blue-700' : 'text-gray-500'}`}>Matematik, Fen, Sosyal vb.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div 
                  onClick={() => onConfigChange({ courseType: 'Dil Dersi', courseName: '' })}
                  className={`relative flex cursor-pointer rounded-xl border p-4 shadow-sm transition-all focus:outline-none ${courseType === 'Dil Dersi' ? 'border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                >
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center">
                      <div className={`flex shrink-0 items-center justify-center rounded-full w-10 h-10 mr-3 ${courseType === 'Dil Dersi' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mic"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                      </div>
                      <div className="text-sm">
                        <p className={`font-semibold ${courseType === 'Dil Dersi' ? 'text-indigo-900' : 'text-gray-900'}`}>Dil Dersi</p>
                        <p className={`mt-0.5 ${courseType === 'Dil Dersi' ? 'text-indigo-700' : 'text-gray-500'}`}>Türkçe, Yabancı Dil, Edebiyat</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="courseName" className="text-gray-600">Ders Adı</Label>
              {courseType === 'Dil Dersi' ? (
                <Select
                  id="courseName"
                  value={config.courseName ?? ''}
                  onChange={(e) => onConfigChange({ courseName: e.target.value })}
                  className={errors.courseName ? 'border-red-300 focus:border-red-400' : ''}
                >
                  <option value="">Dil Dersi Seçiniz...</option>
                  {languageCourses.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              ) : (
                <div className="flex flex-col gap-2">
                  <Input
                    id="courseName"
                    list="generalCourseList"
                    value={config.courseName ?? ''}
                    onChange={(e) => onConfigChange({ courseName: e.target.value })}
                    placeholder="Ders adını girin veya seçin"
                    className={errors.courseName ? 'border-red-300 focus:border-red-400' : ''}
                  />
                  <datalist id="generalCourseList">
                    {generalCourses.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
              )}
              {errors.courseName && (
                <p className="text-xs text-red-500">{errors.courseName}</p>
              )}
            </div>



            {!inst.ogretmenAdi && (
              <div className="space-y-2">
                <Label htmlFor="teacherName" className="text-gray-600">Öğretmen Adı</Label>
                <Input
                  id="teacherName"
                  value={config.teacherName ?? ''}
                  onChange={(e) => onConfigChange({ teacherName: e.target.value })}
                  placeholder="Öğretmen adını girin"
                  className={errors.teacherName ? 'border-red-300 focus:border-red-400' : ''}
                />
                {errors.teacherName && (
                  <p className="text-xs text-red-500">{errors.teacherName}</p>
                )}
              </div>
            )}

            {!inst.sinif && (
              <div className="space-y-2">
                <Label htmlFor="gradeLevel" className="text-gray-600">Sınıf</Label>
                <Select
                  id="gradeLevel"
                  value={config.gradeLevel ?? ''}
                  onChange={(e) => onConfigChange({ gradeLevel: e.target.value })}
                  className={errors.gradeLevel ? 'border-red-300 focus:border-red-400' : ''}
                >
                  <option value="">Seçiniz...</option>
                  {gradeLevels.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </Select>
                {errors.gradeLevel && (
                  <p className="text-xs text-red-500">{errors.gradeLevel}</p>
                )}
              </div>
            )}

            {!inst.sube && (
              <div className="space-y-2">
                <Label htmlFor="classSection" className="text-gray-600">Şube</Label>
                <Select
                  id="classSection"
                  value={config.classSection ?? ''}
                  onChange={(e) => onConfigChange({ classSection: e.target.value })}
                >
                  <option value="">Seçiniz...</option>
                  {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((section) => (
                    <option key={section} value={section}>{section} Şubesi</option>
                  ))}
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="examName" className="text-gray-600">Sınav Adı</Label>
              <Input
                id="examName"
                value={config.examName ?? ''}
                onChange={(e) => onConfigChange({ examName: e.target.value })}
                placeholder="Sınav adını girin"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="examDate" className="text-gray-600">Tarih</Label>
              <Input
                id="examDate"
                type="date"
                value={config.examDate ?? ''}
                onChange={(e) => onConfigChange({ examDate: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center mt-10">
        <Button onClick={handleSubmit} size="xl" className="min-w-[240px]">
          Devam Et
        </Button>
      </div>
    </div>
  )
}

export default GeneralInfoStep
