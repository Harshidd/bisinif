/**
 * Kurum & Sınıf Bilgileri — Merkezi Depolama
 * 
 * Bu modül, ana sayfadaki "Kurum & Sınıf Bilgileri" kartının verilerini
 * localStorage üzerinde kalıcı biçimde saklar.
 * 
 * Mevcut storage/index.js'ye DOKUNULMADI.
 * Ayrı bir anahtar (bisinif_institution) kullanır.
 * Bu sayede mevcut profile/project state akışı bozulmaz.
 */

const INSTITUTION_STORAGE_KEY = 'bisinif_institution'
const INSTITUTION_VERSION = 1

/** Varsayılan boş kurum bilgileri */
export const INSTITUTION_DEFAULTS = {
  il: '',
  ilce: '',
  okulAdi: '',
  mudurAdi: '',
  ogretmenAdi: '',
  sinif: '',
  sube: '',
}

/**
 * Kurum bilgilerini localStorage'dan yükle.
 * Hata durumunda varsayılan değerleri döndürür — hiçbir zaman throw etmez.
 */
export const loadInstitution = () => {
  try {
    const raw = localStorage.getItem(INSTITUTION_STORAGE_KEY)
    if (!raw) return { ...INSTITUTION_DEFAULTS }

    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || parsed.version !== INSTITUTION_VERSION || !parsed.data) {
      return { ...INSTITUTION_DEFAULTS }
    }

    // Eksik alan koruması
    return {
      ...INSTITUTION_DEFAULTS,
      ...parsed.data,
    }
  } catch (err) {
    console.warn('[InstitutionStore] Yükleme hatası:', err)
    return { ...INSTITUTION_DEFAULTS }
  }
}

/**
 * Kurum bilgilerini localStorage'a kaydet.
 * @returns {boolean} Başarılı mı?
 */
export const saveInstitution = (data) => {
  try {
    const payload = {
      version: INSTITUTION_VERSION,
      savedAt: new Date().toISOString(),
      data: {
        ...INSTITUTION_DEFAULTS,
        ...data,
      },
    }
    localStorage.setItem(INSTITUTION_STORAGE_KEY, JSON.stringify(payload))
    return true
  } catch (err) {
    console.warn('[InstitutionStore] Kaydetme hatası:', err)
    return false
  }
}

/**
 * Kurum bilgilerini temizle (isteğe bağlı reset).
 */
export const clearInstitution = () => {
  try {
    localStorage.removeItem(INSTITUTION_STORAGE_KEY)
  } catch (err) {
    console.warn('[InstitutionStore] Silme hatası:', err)
  }
}
