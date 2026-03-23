// src/components/report/pdfExport.js
// PDF export fonksiyonları: blob üret + download

import React from "react";
import { pdf, Document } from "@react-pdf/renderer";
import FullReportDocument, { ClassListPages, OutcomeSuccessPage, RemedialPage, SummaryAndAnalysisPage, ItemAnalysisPage } from "./FullReportDocument";
import StudentCardsDocument from "./StudentCardsDocument";

import { loadInstitution } from '../../storage/institutionStore';

// ============================================
// YARDIMCI FONKSİYONLAR
// ============================================

const generateSafeFileName = (config, reportType, studentName = null) => {
    // Kurum bilgisini de hesaba katalım (Öncelikli)
    const inst = loadInstitution() || {};
    
    // Fallback logic
    const school = (inst.okulAdi || config?.schoolName || '').trim();
    
    // Sadece rakamı almak için regex (ör: "5. Sınıf" -> "5")
    const gradeMatch = (inst.sinif || config?.gradeLevel || '').match(/\d+/);
    const grade = gradeMatch ? gradeMatch[0] : '';
    
    // "A Şubesi" -> "A"
    let section = (inst.sube || config?.classSection || '').trim();
    if (section.toLowerCase().includes('şube')) {
        section = section.split(' ')[0];
    }
    
    const classInfo = grade || section ? `${grade}${section}` : '';
    const course = (config?.courseName || '').trim();
    const exam = (config?.examName || '').trim();
    
    // Bugünün tarihi: YYYY-MM-DD
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    const parts = [];
    if (school) parts.push(school);
    if (classInfo) parts.push(classInfo);
    if (course) parts.push(course);
    if (exam) parts.push(exam);
    if (studentName) parts.push(studentName);
    if (reportType) parts.push(reportType);
    parts.push(dateStr);
    
    // Birleştir
    let filename = parts.join('_');
    
    // Türkçe karakter dönüşümü
    const charMap = {
        'ç': 'c', 'Ç': 'C',
        'ğ': 'g', 'Ğ': 'G',
        'ı': 'i', 'İ': 'I',
        'ö': 'o', 'Ö': 'O',
        'ş': 's', 'Ş': 'S',
        'ü': 'u', 'Ü': 'U'
    };
    
    filename = filename.replace(/[çÇğĞıİöÖşŞüÜ]/g, char => charMap[char]);
    
    // Boşlukları ve geçersiz karakterleri alt çizgi yap
    filename = filename.replace(/[^a-zA-Z0-9_\-]/g, '_');
    
    // Birden fazla alt çizgiyi teke indir ve baş/sondaki alt çizgileri sil
    filename = filename.replace(/_+/g, '_').replace(/^_|_$/g, '');
    
    // Çok uzarsa kes (Max 80 karakter civarı, ama tarih ve tip kısımlarını korumak daha iyi)
    // Şimdilik sadece Windows vb limitlerine takılmaması için 150'den keselim
    if (filename.length > 150) {
        filename = filename.substring(0, 150).replace(/_+$/, '');
    }
    
    // Fallback
    return `${filename}.pdf`;
};

const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Better browser compatibility: append to body
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
};

// ============================================
// EXPORT FONKSİYONLARI
// ============================================

/**
 * TAM ANALİZ RAPORU
 * Sayfa 1: Özet + Analiz
 * Sayfa 2-3: Tam Öğrenci Listesi
 * Sayfa 4: Telafi Listesi
 * Sayfa 5+: Öğrenci Karneleri (2/sayfa)
 */
export const exportFullReportPDF = async ({ analysis, config, questions }) => {
    const doc = React.createElement(FullReportDocument, { analysis, config, questions });
    const blob = await pdf(doc).toBlob();
    downloadBlob(blob, generateSafeFileName(config, 'TamRapor'));
};

/**
 * SADECE ÖĞRENCİ KARNELERİ
 * Her öğrenci 1 tam sayfa (detaylı)
 */
export const exportStudentCardsPDF = async ({ analysis, config, students }) => {
    const doc = React.createElement(StudentCardsDocument, { analysis, config, students });
    const blob = await pdf(doc).toBlob();
    downloadBlob(blob, generateSafeFileName(config, 'Karneler'));
};

/**
 * TEK ÖĞRENCİ KARNESİ
 * 1 öğrenci için detaylı karne
 */
export const exportSingleStudentPDF = async ({ analysis, config, student }) => {
    const doc = React.createElement(StudentCardsDocument, {
        analysis,
        config,
        students: [student]
    });
    const blob = await pdf(doc).toBlob();
    const studentName = student?.name || student?.fullName || 'Ogrenci';
    downloadBlob(blob, generateSafeFileName(config, 'Karne', studentName));
};

// ============================================
// BÖLÜM BAZLI EXPORT FONKSİYONLARI
// ============================================

/** Helper: gradeLevel + classSection → "5. Sınıf A Şubesi" */
const composeClassName = (config) =>
    [config?.gradeLevel, config?.classSection ? `${config.classSection} Şubesi` : ''].filter(Boolean).join(' ') || 'Sınıf';

/**
 * SINIF LİSTESİ PDF
 */
export const exportClassListPDF = async ({ analysis, config }) => {
    const doc = (
        <Document title={`Sınıf Listesi - ${composeClassName(config)}`}>
            <ClassListPages analysis={analysis} config={config} />
        </Document>
    );
    const blob = await pdf(doc).toBlob();
    downloadBlob(blob, generateSafeFileName(config, 'SinifListesi'));
};

/**
 * KAZANIM ANALİZİ PDF (Grafik + Liste)
 */
export const exportOutcomeAnalysisPDF = async ({ analysis, config }) => {
    const doc = (
        <Document title={`Kazanım Analizi - ${composeClassName(config)}`}>
            <OutcomeSuccessPage analysis={analysis} config={config} />
        </Document>
    );
    const blob = await pdf(doc).toBlob();
    downloadBlob(blob, generateSafeFileName(config, 'KazanimAnalizi'));
};

/**
 * SADECE TELAFİ LİSTESİ PDF
 */
export const exportRemedialListPDF = async ({ analysis, config }) => {
    const doc = (
        <Document title={`Telafi Listesi - ${composeClassName(config)}`}>
            <RemedialPage analysis={analysis} config={config} />
        </Document>
    );
    const blob = await pdf(doc).toBlob();
    downloadBlob(blob, generateSafeFileName(config, 'TelafiListesi'));
};

/**
 * SORU ANALİZİ PDF (Detaylı Liste)
 */
export const exportItemAnalysisPDF = async ({ analysis, config }) => {
    const doc = (
        <Document title={`Soru Analizi - ${composeClassName(config)}`}>
            <ItemAnalysisPage analysis={analysis} config={config} />
        </Document>
    );
    const blob = await pdf(doc).toBlob();
    downloadBlob(blob, generateSafeFileName(config, 'SoruAnalizi'));
};

/**
 * ÖZET DURUM PDF (Soru Analizi Dahil)
 */
export const exportSummaryPDF = async ({ analysis, config, questions }) => {
    const doc = (
        <Document title={`Özet Rapor - ${composeClassName(config)}`}>
            <SummaryAndAnalysisPage analysis={analysis} config={config} />
        </Document>
    );
    const blob = await pdf(doc).toBlob();
    downloadBlob(blob, generateSafeFileName(config, 'OzetRapor'));
};
