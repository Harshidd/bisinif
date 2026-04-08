export const LANGUAGE_PROFILES = {
  'normal': { type: 'normal' },
  'Türkçe': { type: 'language', weights: { yazili: 0.50, dinleme: 0.25, konusma: 0.25 } },
  'Türk Dili ve Edebiyatı': { type: 'language', weights: { yazili: 0.70, dinleme: 0.15, konusma: 0.15 } },
  'İngilizce': { type: 'language', weights: { yazili: 0.50, dinleme: 0.25, konusma: 0.25 } },
  'Almanca': { type: 'language', weights: { yazili: 0.50, dinleme: 0.25, konusma: 0.25 } },
  'Fransızca': { type: 'language', weights: { yazili: 0.50, dinleme: 0.25, konusma: 0.25 } },
  'Arapça': { type: 'language', weights: { yazili: 0.50, dinleme: 0.25, konusma: 0.25 } },
  'DEFAULT_LANG': { type: 'language', weights: { yazili: 0.50, dinleme: 0.25, konusma: 0.25 } }
}

export const getLanguageProfile = (courseType, courseName) => {
  if (courseType !== 'Dil Dersi') return LANGUAGE_PROFILES['normal']
  if (!courseName) return LANGUAGE_PROFILES['DEFAULT_LANG']
  
  const trimmed = courseName.trim()
  if (LANGUAGE_PROFILES[trimmed]) return LANGUAGE_PROFILES[trimmed]
  
  if (trimmed.toLowerCase().includes('edebiyat')) return LANGUAGE_PROFILES['Türk Dili ve Edebiyatı']
  
  return LANGUAGE_PROFILES['DEFAULT_LANG']
}
