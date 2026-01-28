import React, { useState } from 'react'
import { Card, CardContent } from './ui/Card'
import { Input } from './ui/Input'
import { Select } from './ui/Select'
import { Label } from './ui/Label'
import { Button } from './ui/Button'

const GeneralInfoStep = ({ config, onConfigChange, onNext }) => {
  const [errors, setErrors] = useState({})

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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="hero-title mb-3">Genel Bilgiler</h1>
        <p className="hero-subtitle">Okul ve sınav bilgilerinizi girin.</p>
      </div>

      <Card className="shadow-apple-lg">
        <CardContent className="p-8 md:p-10 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="city" className="text-gray-600">İl</Label>
              <Input
                id="city"
                value={config.city ?? ''}
                onChange={(e) => onConfigChange({ city: e.target.value })}
                placeholder="İl adını girin"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="district" className="text-gray-600">İlçe</Label>
              <Input
                id="district"
                value={config.district ?? ''}
                onChange={(e) => onConfigChange({ district: e.target.value })}
                placeholder="İlçe adını girin"
              />
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="courseName" className="text-gray-600">Ders Adı</Label>
              <Input
                id="courseName"
                value={config.courseName ?? ''}
                onChange={(e) => onConfigChange({ courseName: e.target.value })}
                placeholder="Ders adını girin"
                className={errors.courseName ? 'border-red-300 focus:border-red-400' : ''}
              />
              {errors.courseName && (
                <p className="text-xs text-red-500">{errors.courseName}</p>
              )}
            </div>

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
