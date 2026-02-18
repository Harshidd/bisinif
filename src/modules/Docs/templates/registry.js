
// Docs Template Registry
// Defines available templates and their configuration.
// REFACTORED FOR SSOT FILENAMES

import { BASE_V1 } from './files/baseTemplate'
import { DISCIPLINE_V1 } from './files/disciplineTemplate'

export const DOCUMENT_CATEGORIES = {
    DISCIPLINE: 'discipline',
    COMMITTEE: 'committee',
    PLANS: 'plans',
    HOMEWORK: 'homework'
}

export const TEMPLATES = [
    // ----------------------------------------------------------------------
    // 1. Discipline
    // ----------------------------------------------------------------------
    {
        id: 'discipline_incident_v1',
        category: DOCUMENT_CATEGORIES.DISCIPLINE,
        status: 'active',
        title: 'Öğrenci Olay Tutanağı (Veli Çağrı)',
        description: 'Veli görüşmesi ve olay detaylarını kayıt altına almak için standart tutanak.',
        filePattern: 'Ogrenci_Olay_Tutanagi_{className}_{date}',
        sourceBase64: DISCIPLINE_V1,
        enabledFormats: { docx: true, pdf: false },
        requiredFields: ['schoolName', 'className', 'teacherName'],
        requiredInputs: ['studentName'],
        optionalInputs: ['studentName']
    },
    {
        id: 'discipline_violation_v1',
        category: DOCUMENT_CATEGORIES.DISCIPLINE,
        status: 'active',
        title: 'Ders Düzeni İhlal Formu',
        description: 'Ders akışını bozan durumların tespiti için kullanılan form.',
        filePattern: 'Ders_Duzeni_Ihlal_Formu_{className}_{date}',
        sourceBase64: BASE_V1,
        enabledFormats: { docx: true, pdf: false },
        requiredFields: ['schoolName', 'className', 'teacherName'],
        optionalInputs: ['studentName']
    },
    // v2 Placeholders
    {
        id: 'discipline_parent_meeting_v2',
        category: DOCUMENT_CATEGORIES.DISCIPLINE,
        status: 'v2',
        title: 'Veli Görüşme Tutanağı',
        description: 'Planlı veli toplantıları veya bireysel görüşme notları.',
    },
    {
        id: 'discipline_defense_request_v2',
        category: DOCUMENT_CATEGORIES.DISCIPLINE,
        status: 'v2',
        title: 'Savunma İstemi (v2)',
        description: 'Resmi disiplin süreçleri için savunma talep formu.',
    },
    {
        id: 'discipline_committee_referral_v2',
        category: DOCUMENT_CATEGORIES.DISCIPLINE,
        status: 'v2',
        title: 'Disiplin Kurulu Sevk Yazısı (v2)',
        description: 'Öğrencinin disiplin kuruluna sevk edilmesi için gerekli üst yazı.',
    },

    // ----------------------------------------------------------------------
    // 2. Committee
    // ----------------------------------------------------------------------
    {
        id: 'committee_meeting_v1',
        category: DOCUMENT_CATEGORIES.COMMITTEE,
        status: 'active',
        title: 'Zümre Toplantı Tutanağı',
        description: 'Dönem başı/sonu zümre toplantı kararlarının yazıldığı şablon.',
        filePattern: 'Zumre_Toplanti_Tutanagi_{date}',
        sourceBase64: BASE_V1,
        enabledFormats: { docx: true, pdf: false },
        requiredFields: ['schoolName', 'teacherName']
    },
    // v2 Placeholders
    {
        id: 'committee_agenda_v2',
        category: DOCUMENT_CATEGORIES.COMMITTEE,
        status: 'v2',
        title: 'Gündem / Karar Listesi',
        description: 'Toplantı öncesi hazırlık ve hızlı karar notları.',
    },
    {
        id: 'committee_signatures_v2',
        category: DOCUMENT_CATEGORIES.COMMITTEE,
        status: 'v2',
        title: 'İmza Çizelgesi',
        description: 'Toplantı katılımcıları için hazır imza sirküsü.',
    },
    {
        id: 'committee_annual_plan_v2',
        category: DOCUMENT_CATEGORIES.COMMITTEE,
        status: 'v2',
        title: 'Yıllık Zümre Planı (v2)',
        description: 'Tüm seneyi kapsayan zümre çalışma takvimi.',
    },

    // ----------------------------------------------------------------------
    // 3. Plans
    // ----------------------------------------------------------------------
    {
        id: 'plans_cover_v1',
        category: DOCUMENT_CATEGORIES.PLANS,
        status: 'active',
        title: 'Yıllık Plan Kapak Sayfası',
        description: 'Ders defteri veya yıllık plan dosyası için standart kapak.',
        filePattern: 'Yillik_Plan_Kapak_{className}_{date}',
        sourceBase64: BASE_V1,
        enabledFormats: { docx: true, pdf: false },
        requiredFields: ['schoolName', 'className', 'teacherName']
    },
    // v2 Placeholders
    {
        id: 'plans_daily_v2',
        category: DOCUMENT_CATEGORIES.PLANS,
        status: 'v2',
        title: 'Günlük Plan / Ders Planı',
        description: 'Kazanım odaklı günlük ders işleyiş planı.',
    },
    {
        id: 'plans_club_calendar_v2',
        category: DOCUMENT_CATEGORIES.PLANS,
        status: 'v2',
        title: 'Kulüp Çalışma Takvimi',
        description: 'Sosyal kulüpler için yıllık etkinlik çizelgesi.',
    },
    {
        id: 'plans_activity_v2',
        category: DOCUMENT_CATEGORIES.PLANS,
        status: 'v2',
        title: 'Etkinlik Planı (v2)',
        description: 'Okul içi veya dışı özel etkinlikler için detaylı plan.',
    },

    // ----------------------------------------------------------------------
    // 4. Homework
    // ----------------------------------------------------------------------
    {
        id: 'homework_check_v1',
        category: DOCUMENT_CATEGORIES.HOMEWORK,
        status: 'active',
        title: 'Ödev Kontrol Çizelgesi',
        description: 'Sınıf listesi ile uyumlu, haftalık ödev takip çizelgesi.',
        filePattern: 'Odev_Kontrol_Cizelgesi_{className}_{date}',
        sourceBase64: BASE_V1,
        enabledFormats: { docx: true, pdf: false },
        requiredFields: ['schoolName', 'className']
    },
    // v2 Placeholders
    {
        id: 'homework_project_tracking_v2',
        category: DOCUMENT_CATEGORIES.HOMEWORK,
        status: 'v2',
        title: 'Proje Teslim Takip',
        description: 'Dönem ödevleri ve projelerin teslim durumlarını izleyin.',
    },
    {
        id: 'homework_rubric_v2',
        category: DOCUMENT_CATEGORIES.HOMEWORK,
        status: 'v2',
        title: 'Performans Görevi Rubriği (v2)',
        description: 'Detaylı puanlama anahtarı ve değerlendirme kriterleri.',
    },
    {
        id: 'homework_parent_note_v2',
        category: DOCUMENT_CATEGORIES.HOMEWORK,
        status: 'v2',
        title: 'Veli Bilgilendirme Notu (v2)',
        description: 'Ödev yapmayan veya eksik getiren öğrenciler için hazır veli notu.',
    }
]

export const getTemplatesByCategory = (category) => {
    return TEMPLATES.filter(t => t.category === category)
}
