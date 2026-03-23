import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent } from './ui/Card'
import { Input } from './ui/Input'
import { Select } from './ui/Select'
import { Label } from './ui/Label'
import { Building2, Check, ChevronDown, ChevronUp, MapPin, Save, Download } from 'lucide-react'
import { getIller, getIlceler } from '../data/il-ilce'
import { loadInstitution, saveInstitution } from '../storage/institutionStore'
import { Button } from './ui/Button'

/**
 * InstitutionCard — Ana sayfada kurum & sınıf bilgilerini toplayan merkezi kart.
 *
 * - localStorage'a otomatik kayıt (debounce 600ms)
 * - Mevcut modüllere müdahale etmez
 * - Collapse/expand ile yer tasarrufu
 */
const InstitutionCard = () => {
  const [data, setData] = useState(() => loadInstitution())
  const [isOpen, setIsOpen] = useState(() => {
    // İlk açılışta veri yoksa açık, varsa kapalı
    const saved = loadInstitution()
    return !saved.okulAdi
  })
  const [saveStatus, setSaveStatus] = useState('idle') // idle | saving | saved
  const saveTimerRef = useRef(null)
  const statusTimerRef = useRef(null)

  // İl listesi (memo)
  const iller = getIller()

  // Seçilen ile bağlı ilçeler
  const ilceler = data.il ? getIlceler(data.il) : []

  // Debounced auto-save
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current)

    saveTimerRef.current = setTimeout(() => {
      setSaveStatus('saving')
      const success = saveInstitution(data)
      if (success) {
        setSaveStatus('saved')
        statusTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000)
      } else {
        setSaveStatus('idle')
      }
    }, 600)

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current)
    }
  }, [data])

  const handleChange = useCallback((field, value) => {
    setData((prev) => {
      const next = { ...prev, [field]: value }

      // İl değiştiğinde ilçeyi sıfırla
      if (field === 'il') {
        next.ilce = ''
      }

      return next
    })
  }, [])

  const handleManualSave = () => {
    setSaveStatus('saving')
    const success = saveInstitution(data)
    if (success) {
      setTimeout(() => {
        setSaveStatus('saved')
        statusTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000)
      }, 300)
    }
  }

  // Özet bilgi (kapalıyken görünecek)
  const summary = [data.il, data.ilce, data.okulAdi].filter(Boolean).join(' · ')

  const siniflar = [
    '1. Sınıf', '2. Sınıf', '3. Sınıf', '4. Sınıf',
    '5. Sınıf', '6. Sınıf', '7. Sınıf', '8. Sınıf',
    '9. Sınıf', '10. Sınıf', '11. Sınıf', '12. Sınıf',
  ]

  const subeler = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

  return (
    <Card className="shadow-apple-lg border border-gray-100 overflow-hidden">
      {/* Header — Her zaman görünür */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between p-6 md:p-8 hover:bg-gray-50/50 transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Kurum & Sınıf Bilgileri</h2>
            {!isOpen && summary && (
              <p className="text-sm text-gray-500 mt-0.5">{summary}</p>
            )}
            {!isOpen && !summary && (
              <p className="text-sm text-gray-400 mt-0.5 italic">Henüz bilgi girilmedi</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Kayıt durumu göstergesi */}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
              <Check className="w-3.5 h-3.5" />
              Kaydedildi
            </span>
          )}
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
              <Save className="w-3.5 h-3.5 animate-pulse" />
              Kaydediliyor…
            </span>
          )}

          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Content — Açılır/kapanır */}
      {isOpen && (
        <CardContent className="px-6 md:px-8 pb-8 pt-0 animate-fade-in">
          <div className="border-t border-gray-100 pt-6">
            <p className="text-sm text-gray-500 mb-6 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              Bu bilgiler tüm modüllerden erişilebilir olacak şekilde kaydedilir.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* İl */}
              <div className="space-y-2">
                <Label htmlFor="inst-il" className="text-gray-600">İl</Label>
                <Select
                  id="inst-il"
                  value={data.il}
                  onChange={(e) => handleChange('il', e.target.value)}
                >
                  <option value="">İl seçiniz…</option>
                  {iller.map((il) => (
                    <option key={il} value={il}>{il}</option>
                  ))}
                </Select>
              </div>

              {/* İlçe */}
              <div className="space-y-2">
                <Label htmlFor="inst-ilce" className="text-gray-600">İlçe</Label>
                <Select
                  id="inst-ilce"
                  value={data.ilce}
                  onChange={(e) => handleChange('ilce', e.target.value)}
                  disabled={!data.il}
                >
                  <option value="">
                    {data.il ? 'İlçe seçiniz…' : 'Önce il seçiniz'}
                  </option>
                  {ilceler.map((ilce) => (
                    <option key={ilce} value={ilce}>{ilce}</option>
                  ))}
                </Select>
              </div>

              {/* Okul Adı */}
              <div className="space-y-2">
                <Label htmlFor="inst-okul" className="text-gray-600">Okul Adı</Label>
                <Input
                  id="inst-okul"
                  value={data.okulAdi}
                  onChange={(e) => handleChange('okulAdi', e.target.value)}
                  placeholder="Okulunuzun adını girin"
                />
              </div>

              {/* Müdür Adı */}
              <div className="space-y-2">
                <Label htmlFor="inst-mudur" className="text-gray-600">Müdür Adı</Label>
                <Input
                  id="inst-mudur"
                  value={data.mudurAdi}
                  onChange={(e) => handleChange('mudurAdi', e.target.value)}
                  placeholder="Okul müdürünün adını girin"
                />
              </div>

              {/* Öğretmen Adı */}
              <div className="space-y-2">
                <Label htmlFor="inst-ogretmen" className="text-gray-600">Öğretmen Adı</Label>
                <Input
                  id="inst-ogretmen"
                  value={data.ogretmenAdi}
                  onChange={(e) => handleChange('ogretmenAdi', e.target.value)}
                  placeholder="Adınızı ve soyadınızı girin"
                />
              </div>

              {/* Sınıf */}
              <div className="space-y-2">
                <Label htmlFor="inst-sinif" className="text-gray-600">Sınıf</Label>
                <Select
                  id="inst-sinif"
                  value={data.sinif}
                  onChange={(e) => handleChange('sinif', e.target.value)}
                >
                  <option value="">Sınıf seçiniz…</option>
                  {siniflar.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </div>

              {/* Şube */}
              <div className="space-y-2">
                <Label htmlFor="inst-sube" className="text-gray-600">Şube</Label>
                <Select
                  id="inst-sube"
                  value={data.sube}
                  onChange={(e) => handleChange('sube', e.target.value)}
                >
                  <option value="">Şube seçiniz…</option>
                  {subeler.map((s) => (
                    <option key={s} value={s}>{s} Şubesi</option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Kaydet Butonu */}
            <div className="mt-8 flex items-center justify-end border-t border-gray-100 pt-6">
              <Button 
                onClick={handleManualSave} 
                disabled={saveStatus === 'saving'}
                className="bg-blue-600 hover:bg-blue-700 min-w-[140px]"
              >
                {saveStatus === 'saved' ? (
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Kaydedildi
                  </span>
                ) : saveStatus === 'saving' ? (
                  <span className="flex items-center gap-2">
                    <Save className="w-4 h-4 animate-pulse" />
                    Kaydediliyor...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Bilgileri Kaydet
                  </span>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

export default InstitutionCard
