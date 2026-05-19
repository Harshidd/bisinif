/**
 * classContextReset.js
 * ============================================================
 * Sınıf Bağlamı Sıfırlama — Merkezi ve Modüler Reset Mantığı
 * ============================================================
 *
 * AMAÇ:
 * Sınav omurgasını (ders, sınav adı, sorular, kazanımlar, puanlama)
 * korurken, sınıfa/öğrenciye bağlı tüm state'i güvenli şekilde temizler.
 *
 * KULLANIM:
 *   const classState = buildEmptyClassContext()
 *   // → { students: [], grades: {} }
 *
 *   const examBackbone = extractExamBackbone(config)
 *   // → Sınav omurgası alanlarını içeren config alt kümesi
 *
 * KURAL: Bu dosyaya sınav omurgasına ait hiçbir field eklenmez.
 * Öğrenciye bağlı yeni bir state eklenecekse buraya da eklenir.
 *
 * RED ÇİZGİ: analysisEngine.js'e dokunulmaz.
 */

// ============================================================
// SINAV OMURGASI ALANLARI (temizlenmeyecek)
// ============================================================
// Bu liste, config içinden korunması gereken key'leri tanımlar.
// Yeni bir omurga alanı eklenirse buraya da eklenmeli.
export const EXAM_BACKBONE_KEYS = [
  // Kurum
  'city',
  'district',
  'schoolLevel',
  'schoolName',
  'principalName',
  'teacherName',
  // Ders / Sınav kimliği
  'courseType',
  'courseName',
  'examName',
  'examDate',
  'semester',
  'examNumber',
  'academicYear',
  // Puanlama yapısı
  'successThreshold',
  'generalPassingScore',
  'outcomeMasteryThreshold',
  // Kazanım yapısı
  'outcomeCount',
  'outcomes',
  'outcomeScores',
]

// ============================================================
// SINIF BAĞLAMI ALANLARI (temizlenecek)
// ============================================================
// Bu alanlar config içinde yaşıyorsa sıfırlanır.
// Şu an config'te class-context field'ı yok; bu liste
// ileride eklenirse referans olsun.
export const CLASS_CONTEXT_CONFIG_KEYS = [
  'gradeLevel',    // örn: "9. Sınıf"
  'classSection',  // örn: "A"
]

// ============================================================
// SINIF BAĞLAMI TEMİZLEME — TEMEL FONKSİYON
// ============================================================

/**
 * Sadece öğrenciye/sınıfa bağlı state'i temizler.
 * Sınav omurgasına dokunmaz.
 *
 * @returns {{ students: Array, grades: Object }}
 */
export function buildEmptyClassContext() {
  return {
    students: [],
    grades: {},
  }
}

/**
 * Mevcut config'ten sadece sınav omurgasını çıkarır.
 * Sınıf bilgisi (gradeLevel, classSection) dahil edilmez — 
 * bu alanlar sınıf değişiminde yeni değerle güncellenir.
 *
 * NOT: gradeLevel/classSection zaten config'te kalır ve
 * kullanıcı tarafından değiştirilebilir. Bu fonksiyon,
 * "hangi alanların kesinlikle korunacağını" netleştirir.
 *
 * @param {Object} config — mevcut config state'i
 * @returns {Object} — sadece omurga alanlarını içeren config
 */
export function extractExamBackbone(config) {
  if (!config || typeof config !== 'object') return {}
  const backbone = {}
  for (const key of EXAM_BACKBONE_KEYS) {
    if (Object.prototype.hasOwnProperty.call(config, key)) {
      backbone[key] = config[key]
    }
  }
  return backbone
}

/**
 * Sınıf bağlamını sıfırlar:
 * - students ve grades temizlenir
 * - config omurgası korunur, gradeLevel/classSection güncellenir (isteğe bağlı)
 *
 * @param {Object} params
 * @param {Object}   params.config              — mevcut config
 * @param {Function} params.setConfig           — config setter
 * @param {Function} params.setStudents         — students setter
 * @param {Function} params.setGrades           — grades setter
 * @param {Object}   [params.newClassOverride]  — { gradeLevel?, classSection? } yeni sınıf bilgisi
 * @returns {void}
 */
export function resetClassContext({
  config,
  setConfig,
  setStudents,
  setGrades,
  newClassOverride = null,
}) {
  // 1. Öğrenci verisini sıfırla
  setStudents([])
  setGrades({})

  // 2. Eğer yeni sınıf bilgisi verilmişse config'e uygula
  //    (gradeLevel/classSection değişimi varsa anlık yansısın)
  if (newClassOverride && typeof newClassOverride === 'object') {
    const validKeys = ['gradeLevel', 'classSection']
    const patch = {}
    for (const key of validKeys) {
      if (Object.prototype.hasOwnProperty.call(newClassOverride, key)) {
        patch[key] = newClassOverride[key]
      }
    }
    if (Object.keys(patch).length > 0) {
      setConfig((prev) => ({ ...prev, ...patch }))
    }
  }
}

/**
 * Sınıf bağlamının temizlenip temizlenmediğini doğrular.
 * Test ve guard amaçlı kullanılabilir.
 *
 * @param {{ students: Array, grades: Object }} state
 * @returns {boolean}
 */
export function isClassContextClean({ students, grades }) {
  const studentsClean = Array.isArray(students) && students.length === 0
  const gradesClean = typeof grades === 'object' && grades !== null && Object.keys(grades).length === 0
  return studentsClean && gradesClean
}
