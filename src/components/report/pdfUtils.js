// src/components/report/pdfUtils.js
// Yardımcı fonksiyonlar: güvenli veri erişimi, sıralama, chunk

export const toNum = (v, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
};

export const safeText = (v, fallback = "-") => {
    const s = (v ?? "").toString().trim();
    return s.length ? s : fallback;
};

export const getStudentNo = (s) =>
    safeText(s?.no ?? s?.studentNumber ?? s?.number ?? s?.schoolNo, "-");

export const getStudentName = (s) =>
    safeText(s?.name ?? s?.fullName ?? s?.adSoyad, "İsimsiz");

export const sortStudentsByNo = (students) => {
    const arr = Array.isArray(students) ? [...students] : [];
    arr.sort((a, b) => {
        const aNo = getStudentNo(a);
        const bNo = getStudentNo(b);
        // Numeric parse - non-digit karakterleri temizle
        const an = parseInt(String(aNo).replace(/\D/g, ''), 10);
        const bn = parseInt(String(bNo).replace(/\D/g, ''), 10);
        const aNum = Number.isFinite(an) ? an : Number.MAX_SAFE_INTEGER;
        const bNum = Number.isFinite(bn) ? bn : Number.MAX_SAFE_INTEGER;
        if (aNum !== bNum) return aNum - bNum;
        // Aynı numara ise isme göre
        return getStudentName(a).localeCompare(getStudentName(b), 'tr');
    });
    return arr;
};

export const chunk = (arr, size) => {
    const a = Array.isArray(arr) ? arr : [];
    if (size <= 0) return [a];
    const out = [];
    for (let i = 0; i < a.length; i += size) {
        out.push(a.slice(i, i + size));
    }
    return out.length ? out : [[]];
};

export const percent = (v) => {
    const n = toNum(v, 0);
    if (n <= 0) return 0;
    if (n >= 100) return 100;
    return n;
};

export const statusText = (total, threshold = 50) => {
    return toNum(total, 0) >= threshold ? "Geçti" : "Kaldı";
};

export const statusColor = (total, threshold = 50) => {
    return toNum(total, 0) >= threshold ? "#16A34A" : "#DC2626";
};

// Tarih formatla
export const formatDate = (d) => {
    if (!d) return "-";
    try {
        return new Date(d).toLocaleDateString('tr-TR');
    } catch {
        return String(d);
    }
};

// Kısa isim (Ad S.)
export const shortName = (full) => {
    if (!full) return "-";
    const parts = full.trim().split(/\s+/);
    if (parts.length < 2) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
};

// Başarı dağılımı bucket'ları
export const getDistributionBuckets = (students, threshold = 50) => {
    const buckets = [
        { label: "0-49", min: 0, max: 49, count: 0, color: "#EF4444" },
        { label: "50-59", min: 50, max: 59, count: 0, color: "#F59E0B" },
        { label: "60-69", min: 60, max: 69, count: 0, color: "#3B82F6" },
        { label: "70-84", min: 70, max: 84, count: 0, color: "#3B82F6" },
        { label: "85-100", min: 85, max: 100, count: 0, color: "#22C55E" },
    ];

    const arr = Array.isArray(students) ? students : [];
    arr.forEach(s => {
        const score = toNum(s?.total ?? s?.score ?? s?.puan, 0);
        for (const bucket of buckets) {
            if (score >= bucket.min && score <= bucket.max) {
                bucket.count++;
                break;
            }
        }
    });

    return buckets;
};

// Temel istatistikler hesapla
export const calculateStats = (students) => {
    const arr = Array.isArray(students) ? students : [];
    const scores = arr
        .map(s => toNum(s?.total ?? s?.score ?? s?.puan, 0))
        .filter(s => s > 0)
        .sort((a, b) => a - b);

    if (scores.length === 0) {
        return { avg: 0, min: 0, max: 0, median: 0, std: 0, count: 0 };
    }

    const count = scores.length;
    const sum = scores.reduce((a, b) => a + b, 0);
    const avg = sum / count;
    const min = scores[0];
    const max = scores[count - 1];
    const median = count % 2 === 0
        ? (scores[count / 2 - 1] + scores[count / 2]) / 2
        : scores[Math.floor(count / 2)];

    const variance = scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / count;
    const std = Math.sqrt(variance);

    return { avg, min, max, median, std, count };
};

// Kazanım başarı istatistikleri hesapla
export const calculateOutcomeSuccess = (outcomes, students, threshold = 50) => {
    const arr = Array.isArray(outcomes) ? outcomes : [];
    const studentCount = Array.isArray(students) ? students.length : 0;

    return arr.map((outcome, index) => {
        const successRate = toNum(outcome?.successRate ?? outcome?.rate, 0);

        // Başaran öğrenci sayısını hesapla
        // successRate zaten % cinsinden, öğrenci sayısını bul
        const passedCount = Math.round((successRate / 100) * studentCount);
        const failedCount = studentCount - passedCount;

        return {
            index,
            label: `K${index + 1}`,
            title: outcome?.title || outcome?.name || `Kazanım ${index + 1}`,
            passedCount,
            failedCount,
            totalCount: studentCount,
            successRate,
            color: successRate >= threshold ? "#22C55E" : successRate >= 40 ? "#F59E0B" : "#EF4444"
        };
    });
};

// Kazanım başarı istatistikleri + başarısız öğrenci listesi
export const calculateOutcomeSuccessWithFailures = (outcomes, students, threshold = 50) => {
    const arr = Array.isArray(outcomes) ? outcomes : [];
    const studentCount = Array.isArray(students) ? students.length : 0;

    return arr.map((outcome, index) => {
        const successRate = toNum(outcome?.successRate ?? outcome?.rate, 0);

        // Başarısız öğrenci listesi (analysisEngine'den geliyor)
        const failingStudents = Array.isArray(outcome?.failingStudents)
            ? outcome.failingStudents
            : [];

        // ✅ Gerçek başarısız sayısı (liste uzunluğu)
        const failedCount = failingStudents.length;
        const passedCount = studentCount - failedCount;

        return {
            index,
            label: `K${index + 1}`,
            title: outcome?.title || outcome?.name || `Kazanım ${index + 1}`,
            passedCount,
            failedCount,
            totalCount: studentCount,
            successRate,
            failingStudents: sortStudentsByNo(failingStudents), // No'ya göre sırala
            color: successRate >= threshold ? "#22C55E" : successRate >= 40 ? "#F59E0B" : "#EF4444"
        };
    });
};
