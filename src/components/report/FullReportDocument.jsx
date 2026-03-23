// src/components/report/FullReportDocument.jsx
// TAM ANALİZ RAPORU: Özet + Liste + Telafi + Karneler (2/sayfa)

import React from "react";
import { Document, Page, Text, View, StyleSheet, Svg, Rect, Line, G } from "@react-pdf/renderer";
import './fonts'; // Font kaydı
import {
    chunk,
    sortStudentsByNo,
    toNum,
    safeText,
    percent,
    getStudentNo,
    getStudentName,
    statusText,
    statusColor,
    formatDate,
    getDistributionBuckets,
    calculateStats,
    calculateOutcomeSuccess,
    calculateOutcomeSuccessWithFailures,
    shortName
} from "./pdfUtils";

// ============================================
// STİLLER - Kompakt ve Profesyonel
// ============================================

const colors = {
    primary: "#2563EB",
    success: "#16A34A",
    danger: "#DC2626",
    warning: "#F59E0B",
    muted: "#6B7280",
    border: "#E5E7EB",
    bg: "#F9FAFB",
    bgAlt: "#F3F4F6",
    text: "#111827"
};

const styles = StyleSheet.create({
    page: {
        paddingTop: 20,
        paddingBottom: 30,
        paddingHorizontal: 24,
        fontSize: 9,
        fontFamily: "Roboto",
        color: colors.text,
        backgroundColor: "#FFFFFF"
    },

    // Header
    header: {
        marginBottom: 10,
        paddingBottom: 6,
        borderBottomWidth: 2,
        borderBottomColor: colors.primary,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end"
    },
    h1: { fontFamily: "Roboto", fontSize: 14, fontWeight: "bold", color: colors.primary },
    h2: { fontFamily: "Roboto", fontSize: 11, fontWeight: "bold", color: colors.text, marginBottom: 6 },
    h3: { fontFamily: "Roboto", fontSize: 10, fontWeight: "bold", color: colors.text, marginBottom: 4 },
    subtitle: { fontFamily: "Roboto", fontSize: 8, color: colors.muted },

    // Grid & Cards
    row: { flexDirection: "row", gap: 8 },
    col2: { flex: 1 },
    card: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 4,
        padding: 8,
        backgroundColor: "#FFFFFF",
        marginBottom: 8
    },
    cardTitle: { fontFamily: "Roboto", fontSize: 10, fontWeight: "bold", marginBottom: 6, color: colors.text },

    // Stats Row
    statsRow: { flexDirection: "row", gap: 6, marginBottom: 10 },
    statBox: {
        flex: 1,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 4,
        padding: 6,
        backgroundColor: colors.bg,
        alignItems: "center"
    },
    statLabel: { fontFamily: "Roboto", fontSize: 7, color: colors.muted, marginBottom: 2 },
    statValue: { fontFamily: "Roboto", fontSize: 12, fontWeight: "bold", color: colors.text },
    statSub: { fontFamily: "Roboto", fontSize: 7, color: colors.muted },

    // Table
    table: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 4,
        overflow: "hidden"
    },
    trHead: {
        flexDirection: "row",
        backgroundColor: colors.bgAlt,
        borderBottomWidth: 1,
        borderBottomColor: colors.border
    },
    tr: {
        flexDirection: "row",
        borderBottomWidth: 0.5,
        borderBottomColor: colors.border
    },
    trAlt: {
        flexDirection: "row",
        backgroundColor: colors.bg,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.border
    },
    th: { fontFamily: "Roboto", padding: 4, fontWeight: "bold", fontSize: 8, color: colors.muted },
    td: { fontFamily: "Roboto", padding: 4, fontSize: 8 },
    tdBold: { fontFamily: "Roboto", padding: 4, fontSize: 8, fontWeight: "bold" },

    // Column widths
    colSira: { width: "8%" },
    colNo: { width: "12%" },
    colAd: { width: "50%" },
    colPuan: { width: "15%", textAlign: "right" },
    colDurum: { width: "15%", textAlign: "right" },

    // Bar chart
    barRow: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
    barLabel: { fontFamily: "Roboto", width: 40, fontSize: 8, color: colors.muted },
    barBg: { flex: 1, height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: "hidden" },
    barFill: { height: 8, borderRadius: 4 },
    barValue: { fontFamily: "Roboto", width: 24, fontSize: 8, textAlign: "right", fontWeight: "bold" },

    // Mini bar
    miniBarBg: { height: 5, backgroundColor: colors.border, borderRadius: 2, overflow: "hidden", marginTop: 2 },
    miniBarFill: { height: 5, borderRadius: 2 },

    // Student Cards (2 per page)
    twoCardWrap: { flexDirection: "row", gap: 10, flex: 1 },
    studentCard: {
        flex: 1,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 6,
        padding: 10,
        backgroundColor: "#FFFFFF"
    },
    studentBanner: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
        paddingBottom: 6,
        borderBottomWidth: 1,
        borderBottomColor: colors.border
    },
    studentName: { fontSize: 10, fontWeight: "bold" },
    badge: {
        paddingVertical: 3,
        paddingHorizontal: 8,
        borderRadius: 10,
        fontSize: 8,
        fontWeight: "bold"
    },

    // Footer
    footer: {
        position: "absolute",
        left: 24,
        right: 24,
        bottom: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: 4,
        borderTopWidth: 0.5,
        borderTopColor: colors.border
    },
    footerText: { fontSize: 7, color: colors.muted },

    // Meta info row
    metaRow: { flexDirection: "row", gap: 5, marginBottom: 8 },
    metaBox: {
        flex: 1,
        padding: 5,
        backgroundColor: colors.bg,
        borderRadius: 3,
        alignItems: "center"
    },
    metaLabel: { fontSize: 6, color: colors.muted },
    metaValue: { fontSize: 8, fontWeight: "bold", color: colors.text },

    // Remedial section
    remedialSection: {
        marginBottom: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.border
    },
    outcomeTitle: { fontSize: 9, fontWeight: "bold", marginBottom: 4 },
    remedialCount: { fontSize: 8, color: colors.danger, marginBottom: 6 }
});

// ============================================
// YARDIMCI BİLEŞENLER
// ============================================

const Header = ({ title, config }) => {
    // Sınıf bilgisini gradeLevel + classSection'dan oluştur
    const className = [config?.gradeLevel, config?.classSection ? `${config.classSection} Şubesi` : ''].filter(Boolean).join(' ');
    // İl/İlçe bilgisi
    const location = [config?.city, config?.district].filter(Boolean).join(' / ');

    return (
        <View style={styles.header}>
            <View>
                <Text style={styles.h1}>{title}</Text>
                <Text style={styles.subtitle}>BiSınıf Sınav Analiz Sistemi</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.subtitle}>{safeText(config?.schoolName)}</Text>
                {location ? <Text style={styles.subtitle}>{location}</Text> : null}
                <Text style={styles.subtitle}>{formatDate(config?.examDate ?? config?.date)}</Text>
            </View>
        </View>
    );
};

const Footer = ({ config }) => {
    const className = [config?.gradeLevel, config?.classSection ? `${config.classSection} Şubesi` : ''].filter(Boolean).join(' ');
    const label = [safeText(config?.schoolName, 'BiSınıf'), className].filter(Boolean).join(' • ');
    return (
        <View style={styles.footer} fixed>
            <Text style={styles.footerText}>{label}</Text>
            <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Sayfa ${pageNumber} / ${totalPages}`} />
        </View>
    );
};

const StatBox = ({ label, value, sub, color }) => (
    <View style={styles.statBox}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={[styles.statValue, color ? { color } : {}]}>{value}</Text>
        {sub && <Text style={styles.statSub}>{sub}</Text>}
    </View>
);

const Bar = ({ value, max, color = colors.success }) => {
    const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
    return (
        <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
        </View>
    );
};

const MiniBar = ({ value, color = colors.success }) => {
    const pct = percent(value);
    return (
        <View style={styles.miniBarBg}>
            <View style={[styles.miniBarFill, { width: `${pct}%`, backgroundColor: color }]} />
        </View>
    );
};

// ============================================
// SÜTUN GRAFİĞİ (SVG - Profesyonel)
// ============================================

const ColumnChart = ({ data = [], width = 240, height = 120 }) => {
    if (!Array.isArray(data) || data.length === 0) {
        return (
            <View style={{ width, height, justifyContent: "center", alignItems: "center" }}>
                <Text style={{ fontSize: 8, color: colors.muted }}>Veri yok</Text>
            </View>
        );
    }

    const maxCount = Math.max(...data.map(d => d.count || 0), 1);
    const padding = { top: 15, right: 10, bottom: 25, left: 35 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const barWidth = chartWidth / (data.length * 1.5);
    const barSpacing = barWidth * 0.5;

    return (
        <View style={{ width, height }}>
            <Svg width={width} height={height}>
                {/* Y Ekseni */}
                <Line
                    x1={padding.left}
                    y1={padding.top}
                    x2={padding.left}
                    y2={height - padding.bottom}
                    stroke={colors.border}
                    strokeWidth={1}
                />

                {/* X Ekseni */}
                <Line
                    x1={padding.left}
                    y1={height - padding.bottom}
                    x2={width - padding.right}
                    y2={height - padding.bottom}
                    stroke={colors.border}
                    strokeWidth={1}
                />

                {/* Y Ekseni Etiketleri */}
                <Text
                    x={padding.left - 5}
                    y={height - padding.bottom + 3}
                    fontSize={7}
                    fill={colors.muted}
                    textAnchor="end"
                >
                    0
                </Text>
                <Text
                    x={padding.left - 5}
                    y={padding.top + chartHeight / 2 + 3}
                    fontSize={7}
                    fill={colors.muted}
                    textAnchor="end"
                >
                    {Math.round(maxCount / 2)}
                </Text>
                <Text
                    x={padding.left - 5}
                    y={padding.top + 3}
                    fontSize={7}
                    fill={colors.muted}
                    textAnchor="end"
                >
                    {maxCount}
                </Text>

                {/* Sütunlar ve Etiketler */}
                {data.map((item, index) => {
                    const barHeight = (item.count / maxCount) * chartHeight;
                    const x = padding.left + index * (barWidth + barSpacing) + barSpacing;
                    const y = height - padding.bottom - barHeight;

                    return (
                        <G key={`col-${index}`}>
                            <Rect
                                x={x}
                                y={y}
                                width={barWidth}
                                height={barHeight}
                                fill={item.color || colors.primary}
                                rx={2}
                            />
                            <Text
                                x={x + barWidth / 2}
                                y={y - 4}
                                fontSize={8}
                                fontWeight="bold"
                                fill={colors.text}
                                textAnchor="middle"
                            >
                                {item.count}
                            </Text>
                            <Text
                                x={x + barWidth / 2}
                                y={height - padding.bottom + 12}
                                fontSize={7}
                                fill={colors.muted}
                                textAnchor="middle"
                            >
                                {item.label}
                            </Text>
                        </G>
                    );
                })}
            </Svg>
        </View>
    );
};

// ============================================
// YATAY BAR GRAFİĞİ (Kazanımlar için)
// ============================================

/**
 * Profesyonel Yatay Bar Grafiği
 * @param {Array} data - [{label, title, passedCount, totalCount, successRate, color}]
 * @param {Number} maxBars - Maksimum gösterilecek bar sayısı
 */
const HorizontalBarChart = ({ data = [], maxBars = 10 }) => {
    if (!Array.isArray(data) || data.length === 0) {
        return (
            <View style={{ padding: 10, alignItems: "center" }}>
                <Text style={{ fontSize: 8, color: colors.muted }}>Kazanım verisi yok</Text>
            </View>
        );
    }

    const displayData = data.slice(0, maxBars);
    const barHeight = 20;
    const barSpacing = 8;
    const labelWidth = 30;
    const statsWidth = 80;
    const chartWidth = 300;

    return (
        <View>
            {displayData.map((item, index) => {
                const percentage = Math.min(100, Math.max(0, item.successRate || 0));
                const barWidth = (percentage / 100) * (chartWidth - labelWidth - statsWidth - 20);

                return (
                    <View key={`hbar-${index}`} style={{ marginBottom: barSpacing }}>
                        {/* Başlık Satırı */}
                        <View style={{ flexDirection: "row", marginBottom: 2, alignItems: "center" }}>
                            <Text style={{ fontSize: 7, fontWeight: "bold", width: labelWidth, color: colors.muted }}>
                                {item.label}
                            </Text>
                            <Text style={{ fontSize: 7, flex: 1, color: colors.text }}>
                                {item.title.length > 45 ? item.title.slice(0, 45) + "..." : item.title}
                            </Text>
                        </View>

                        {/* Bar ve İstatistikler */}
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <View style={{ width: labelWidth }} />

                            {/* Bar Container */}
                            <View style={{
                                flex: 1,
                                height: barHeight,
                                backgroundColor: colors.bg,
                                borderRadius: 4,
                                overflow: "hidden",
                                marginRight: 8
                            }}>
                                {/* Bar Fill */}
                                <View style={{
                                    height: barHeight,
                                    width: `${percentage}%`,
                                    backgroundColor: item.color || colors.primary,
                                    borderRadius: 4,
                                    justifyContent: "center",
                                    paddingLeft: 6
                                }}>
                                    {percentage > 15 && (
                                        <Text style={{ fontSize: 7, color: "#FFFFFF", fontWeight: "bold" }}>
                                            {percentage.toFixed(0)}%
                                        </Text>
                                    )}
                                </View>
                            </View>

                            {/* İstatistikler */}
                            <View style={{ width: statsWidth, alignItems: "flex-end" }}>
                                <Text style={{ fontSize: 8, fontWeight: "bold", color: colors.text }}>
                                    {item.passedCount}/{item.totalCount}
                                </Text>
                                {percentage <= 15 && (
                                    <Text style={{ fontSize: 7, color: colors.muted }}>
                                        %{percentage.toFixed(0)}
                                    </Text>
                                )}
                            </View>
                        </View>
                    </View>
                );
            })}

            {data.length > maxBars && (
                <Text style={{ fontSize: 7, color: colors.muted, marginTop: 4, textAlign: "center" }}>
                    Not: İlk {maxBars} kazanım gösterildi. Toplam: {data.length}
                </Text>
            )}
        </View>
    );
};

// ============================================
// SAYFA 1: ÖZET + ANALİZ (Öğrenci Listesi YOK)
// ============================================

export const SummaryAndAnalysisPage = ({ analysis, config }) => {
    const students = sortStudentsByNo(analysis?.studentResults ?? []);
    const threshold = toNum(config?.generalPassingScore ?? config?.passScore ?? 50);
    const stats = calculateStats(students);
    const distribution = getDistributionBuckets(students, threshold);
    const maxCount = Math.max(...distribution.map(d => d.count), 1);

    const passCount = students.filter(s => toNum(s?.total, 0) >= threshold).length;
    const failCount = students.length - passCount;
    const successRate = students.length > 0 ? (passCount / students.length) * 100 : 0;

    const outcomes = Array.isArray(analysis?.outcomes) ? analysis.outcomes : [];
    const questions = Array.isArray(analysis?.questionStats)
        ? analysis.questionStats
        : (Array.isArray(analysis?.questions) ? analysis.questions : []);
    const configOutcomes = Array.isArray(config?.outcomes) ? config.outcomes : [];

    return (
        <Page size="A4" style={styles.page}>
            <Header title="Sınav Analiz Raporu" config={config} />

            {/* Meta Bilgiler */}
            <View style={styles.metaRow}>
                {(config?.city || config?.district) && (
                    <View style={styles.metaBox}>
                        <Text style={styles.metaLabel}>İL / İLÇE</Text>
                        <Text style={styles.metaValue}>{[config?.city, config?.district].filter(Boolean).join(' / ')}</Text>
                    </View>
                )}
                <View style={styles.metaBox}>
                    <Text style={styles.metaLabel}>OKUL</Text>
                    <Text style={styles.metaValue}>{safeText(config?.schoolName)}</Text>
                </View>
                <View style={styles.metaBox}>
                    <Text style={styles.metaLabel}>SINIF</Text>
                    <Text style={styles.metaValue}>{[config?.gradeLevel, config?.classSection ? `${config.classSection} Şb.` : ''].filter(Boolean).join(' ') || '-'}</Text>
                </View>
                <View style={styles.metaBox}>
                    <Text style={styles.metaLabel}>DERS</Text>
                    <Text style={styles.metaValue}>{safeText(config?.courseName ?? config?.subject)}</Text>
                </View>
                <View style={styles.metaBox}>
                    <Text style={styles.metaLabel}>ÖĞRETMEN</Text>
                    <Text style={styles.metaValue}>{safeText(config?.teacherName)}</Text>
                </View>
                {config?.principalName && (
                    <View style={styles.metaBox}>
                        <Text style={styles.metaLabel}>MÜDÜR</Text>
                        <Text style={styles.metaValue}>{safeText(config?.principalName)}</Text>
                    </View>
                )}
                <View style={styles.metaBox}>
                    <Text style={styles.metaLabel}>TARİH</Text>
                    <Text style={styles.metaValue}>{formatDate(config?.examDate ?? config?.date)}</Text>
                </View>
            </View>

            {/* İstatistik Kartları */}
            <View style={styles.statsRow}>
                <StatBox label="KATILIM" value={stats.count} sub={`${students.length} kayıtlı`} />
                <StatBox label="SINIF ORT." value={stats.avg.toFixed(1)} color={colors.primary} />
                <StatBox label="BAŞARILI" value={passCount} sub={`%${successRate.toFixed(0)}`} color={colors.success} />
                <StatBox label="BAŞARISIZ" value={failCount} sub={`%${(100 - successRate).toFixed(0)}`} color={colors.danger} />
                <StatBox label="GEÇME PUANI" value={threshold} color={colors.warning} />
            </View>

            {/* 2 Kolon: Dağılım + İstatistik */}
            <View style={styles.row}>
                {/* Sol: Başarı Dağılımı */}
                <View style={[styles.card, styles.col2]}>
                    <Text style={styles.cardTitle}>Başarı Dağılımı</Text>
                    <ColumnChart data={distribution} width={240} height={120} />
                </View>

                {/* Sağ: Temel İstatistikler */}
                <View style={[styles.card, styles.col2]}>
                    <Text style={styles.cardTitle}>Temel İstatistikler</Text>
                    <View style={{ gap: 4 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                            <Text style={{ color: colors.muted }}>Ortalama</Text>
                            <Text style={{ fontWeight: "bold" }}>{stats.avg.toFixed(1)}</Text>
                        </View>
                        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                            <Text style={{ color: colors.muted }}>Medyan</Text>
                            <Text style={{ fontWeight: "bold" }}>{stats.median.toFixed(1)}</Text>
                        </View>
                        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                            <Text style={{ color: colors.muted }}>En Yüksek</Text>
                            <Text style={{ fontWeight: "bold", color: colors.success }}>{stats.max}</Text>
                        </View>
                        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                            <Text style={{ color: colors.muted }}>En Düşük</Text>
                            <Text style={{ fontWeight: "bold", color: colors.danger }}>{stats.min}</Text>
                        </View>
                        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                            <Text style={{ color: colors.muted }}>Standart Sapma</Text>
                            <Text style={{ fontWeight: "bold" }}>{stats.std.toFixed(1)}</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Kazanım Analizi (Kompakt) */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Kazanım Analizi</Text>
                {outcomes.length === 0 ? (
                    <Text style={{ color: colors.muted, fontStyle: "italic" }}>Kazanım verisi yok</Text>
                ) : (
                    outcomes.slice(0, 6).map((o, i) => {
                        const title = configOutcomes[i] || o?.title || o?.name || `Kazanım ${i + 1}`;
                        const rate = toNum(o?.successRate ?? o?.rate, 0);
                        const failedCount = Array.isArray(o?.failedStudents) ? o.failedStudents.length : 0;
                        const barColor = rate >= threshold ? colors.success : colors.warning;

                        return (
                            <View key={`out-${i}`} style={{ marginBottom: 6 }}>
                                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
                                    <Text style={{ fontSize: 8, fontWeight: "bold" }}>
                                        <Text style={{ color: colors.muted }}>K{i + 1} </Text>
                                        {title.length > 40 ? title.slice(0, 40) + "..." : title}
                                    </Text>
                                    <Text style={{ fontSize: 8, fontWeight: "bold", color: barColor }}>
                                        %{rate.toFixed(0)} {failedCount > 0 && <Text style={{ color: colors.danger }}>• {failedCount} telafi</Text>}
                                    </Text>
                                </View>
                                <MiniBar value={rate} color={barColor} />
                            </View>
                        );
                    })
                )}
                {outcomes.length > 6 && (
                    <Text style={{ fontSize: 7, color: colors.muted, marginTop: 4 }}>
                        Not: İlk 6 kazanım gösterildi. Toplam: {outcomes.length}
                    </Text>
                )}
            </View>

            {/* Soru Analizi (Kompakt Tablo) */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Soru Analizi</Text>
                <Text style={{ fontSize: 7, color: colors.muted, marginBottom: 6 }}>
                    Zorluk: Yüksek % = Kolay (çok öğrenci yaptı), Düşük % = Zor (az öğrenci yaptı)
                </Text>
                {questions.length === 0 ? (
                    <Text style={{ color: colors.muted, fontStyle: "italic" }}>Soru verisi yok</Text>
                ) : (
                    <View style={styles.table}>
                        <View style={styles.trHead}>
                            <Text style={[styles.th, { width: "15%" }]}>Soru</Text>
                            <Text style={[styles.th, { width: "15%" }]}>Max</Text>
                            <Text style={[styles.th, { width: "15%" }]}>Ort.</Text>
                            <Text style={[styles.th, { width: "35%" }]}>Zorluk</Text>
                            <Text style={[styles.th, { width: "20%", textAlign: "right" }]}>%</Text>
                        </View>
                        {questions.slice(0, 10).map((q, i) => {
                            const maxScore = toNum(q?.maxScore, 10);
                            const avgScore = toNum(q?.avgScore, 0);
                            const difficulty = maxScore > 0 ? (avgScore / maxScore) * 100 : 0;
                            const barColor = difficulty > 70 ? colors.success : difficulty < 40 ? colors.danger : colors.warning;
                            const rowStyle = i % 2 === 0 ? styles.tr : styles.trAlt;

                            return (
                                <View key={`q-${i}`} style={rowStyle}>
                                    <Text style={[styles.td, { width: "15%" }]}>S{q?.qNo ?? i + 1}</Text>
                                    <Text style={[styles.td, { width: "15%" }]}>{maxScore}</Text>
                                    <Text style={[styles.td, { width: "15%" }]}>{avgScore.toFixed(1)}</Text>
                                    <View style={[styles.td, { width: "35%", flexDirection: "row", alignItems: "center" }]}>
                                        <View style={{ flex: 1 }}>
                                            <MiniBar value={difficulty} color={barColor} />
                                        </View>
                                    </View>
                                    <Text style={[styles.td, { width: "20%", textAlign: "right", fontWeight: "bold", color: barColor }]}>
                                        %{difficulty.toFixed(0)}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                )}
                {questions.length > 10 && (
                    <Text style={{ fontSize: 7, color: colors.muted, marginTop: 4 }}>
                        Not: İlk 10 soru gösterildi. Toplam: {questions.length}
                    </Text>
                )}
            </View>

            <Footer config={config} />
        </Page>
    );
};

// ============================================
// SAYFA 2-3: TAM SINIF LİSTESİ
// ============================================

export const ClassListPages = ({ analysis, config }) => {
    const threshold = toNum(config?.generalPassingScore ?? config?.passScore ?? 50);
    const students = sortStudentsByNo(analysis?.studentResults ?? []);
    // Maksimum 20 soru gösterelim, taşma olmasın
    const questions = (analysis?.questions ?? []).slice(0, 20);

    if (students.length === 0) return null;

    // A4 Landscape: ~550pt yükseklik (kullanılabilir). 40 satır için ~13pt/satır
    const ROWS_PER_PAGE = 40;
    const pages = chunk(students, ROWS_PER_PAGE);

    // Daha okunaklı ve "oturaklı" stiller
    const rowStyles = {
        th: {
            fontFamily: "Roboto",
            fontSize: 9,
            paddingVertical: 4,
            paddingHorizontal: 2,
            fontWeight: "bold",
            backgroundColor: colors.bg,
            borderBottomWidth: 1,
            borderBottomColor: colors.primary,
            color: colors.primary,
            textAlign: "center"
        },
        td: {
            fontFamily: "Roboto",
            fontSize: 9,
            paddingVertical: 3,
            paddingHorizontal: 2,
            borderBottomWidth: 0.5,
            borderBottomColor: colors.border,
            textAlign: "center"
        },
        tdLeft: {
            fontFamily: "Roboto",
            fontSize: 9,
            paddingVertical: 3,
            paddingHorizontal: 4,
            borderBottomWidth: 0.5,
            borderBottomColor: colors.border,
            textAlign: "left"
        },
        tdBold: {
            fontFamily: "Roboto",
            fontSize: 9,
            fontWeight: "bold",
            paddingVertical: 3,
            paddingHorizontal: 2,
            borderBottomWidth: 0.5,
            borderBottomColor: colors.border,
            textAlign: "center"
        }
    };

    // Sütun genişlikleri (Landscape ~800pt kullanılabilir)
    const colWidths = {
        sira: 30,
        no: 50,
        ad: 160,
        soru: questions.length > 0 ? (450 / questions.length) : 0, // Kalan alanı bölüştür
        toplam: 50,
        durum: 60
    };

    return pages.map((rows, pageIdx) => (
        <Page key={`class-${pageIdx}`} size="A4" style={styles.page} orientation="landscape">
            <Header title={`Sınıf Listesi (${pageIdx + 1}/${pages.length})`} config={config} />

            <View style={[styles.table, { marginTop: 10 }]}>
                {/* Header Row */}
                <View style={{ flexDirection: "row", backgroundColor: colors.bg, alignItems: "center" }}>
                    <Text style={[rowStyles.th, { width: colWidths.sira }]}>#</Text>
                    <Text style={[rowStyles.th, { width: colWidths.no }]}>No</Text>
                    <Text style={[rowStyles.th, { width: colWidths.ad, textAlign: "left", paddingLeft: 4 }]}>Ad Soyad</Text>
                    {/* Soru Sütunları */}
                    {questions.map((q, i) => (
                        <Text key={`qh-${i}`} style={[rowStyles.th, { width: colWidths.soru }]}>
                            S{i + 1}
                        </Text>
                    ))}
                    <Text style={[rowStyles.th, { width: colWidths.toplam }]}>Puan</Text>
                    <Text style={[rowStyles.th, { width: colWidths.durum }]}>Durum</Text>
                </View>

                {/* Data Rows */}
                {rows.map((s, i) => {
                    const globalIndex = pageIdx * ROWS_PER_PAGE + i + 1;
                    const total = toNum(s?.total, 0);
                    const durum = statusText(total, threshold);
                    const bgColor = i % 2 === 0 ? '#fff' : colors.bgAlt;

                    return (
                        <View key={`cl-${globalIndex}`} style={{ flexDirection: "row", backgroundColor: bgColor, alignItems: "center" }}>
                            <Text style={[rowStyles.td, { width: colWidths.sira }]}>{globalIndex}</Text>
                            <Text style={[rowStyles.td, { width: colWidths.no }]}>{getStudentNo(s)}</Text>
                            <Text style={[rowStyles.tdLeft, { width: colWidths.ad }]}>
                                {getStudentName(s).length > 25 ? getStudentName(s).slice(0, 25) + "..." : getStudentName(s)}
                            </Text>
                            {/* Soru Puanları */}
                            {questions.map((q, qi) => {
                                const score = s.questionScores?.[qi] ?? 0;
                                // Tam sayı ise ondalık gösterme
                                const displayScore = Number.isInteger(score) ? score : score.toFixed(1);
                                return (
                                    <Text key={`sq-${qi}`} style={[rowStyles.td, { width: colWidths.soru }]}>
                                        {displayScore}
                                    </Text>
                                );
                            })}
                            <Text style={[rowStyles.tdBold, { width: colWidths.toplam }]}>{Math.round(total)}</Text>
                            <Text style={[rowStyles.td, { width: colWidths.durum, color: statusColor(total, threshold), fontSize: 8 }]}>
                                {durum}
                            </Text>
                        </View>
                    );
                })}
            </View>

            <Footer config={config} />
        </Page>
    ));
};

// ============================================
// SAYFA 4: TELAFİ LİSTESİ (Ayrı Sayfa)
// ============================================

export const RemedialPage = ({ analysis, config }) => {
    const outcomes = Array.isArray(analysis?.outcomes) ? analysis.outcomes : [];
    const configOutcomes = Array.isArray(config?.outcomes) ? config.outcomes : [];
    const threshold = toNum(config?.generalPassingScore ?? config?.passScore ?? 50);

    // En az 1 telafi öğrencisi olan kazanımlar
    const outcomesWithRemedial = outcomes.filter(o => {
        const failed = Array.isArray(o?.failedStudents) ? o.failedStudents : [];
        return failed.length > 0;
    });

    if (outcomesWithRemedial.length === 0) return null;

    return (
        <Page size="A4" style={styles.page}>
            <Header title="Telafi Programı Önerisi" config={config} />

            <View style={{ marginBottom: 15, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Text style={{ fontFamily: "Roboto", fontSize: 11, color: colors.muted }}>
                    Aşağıdaki kazanımlarda başarı oranı %{threshold} altında kalan veya eksik öğrenmesi bulunan öğrenciler listelenmiştir.
                </Text>
            </View>

            <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 6, overflow: "hidden" }}>
                {/* Header */}
                <View style={{ flexDirection: "row", backgroundColor: colors.bg, paddingVertical: 8, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: colors.primary }}>
                    <Text style={{ fontFamily: "Roboto", fontSize: 10, fontWeight: "bold", width: "40%", color: colors.primary }}>Kazanım</Text>
                    <Text style={{ fontFamily: "Roboto", fontSize: 10, fontWeight: "bold", width: "10%", textAlign: "center", color: colors.primary }}>Sayı</Text>
                    <Text style={{ fontFamily: "Roboto", fontSize: 10, fontWeight: "bold", width: "50%", color: colors.primary }}>Öğrenci Listesi</Text>
                </View>

                {outcomesWithRemedial.map((o, i) => {
                    const title = configOutcomes[i] || o?.title || `Kazanım ${i + 1}`;
                    const failedStudents = o.failedStudents || [];
                    const bgColor = i % 2 === 0 ? "#fff" : colors.bgAlt;

                    return (
                        <View key={`rem-${i}`} style={{ flexDirection: "row", backgroundColor: bgColor, paddingVertical: 8, paddingHorizontal: 4, borderBottomWidth: 0.5, borderBottomColor: colors.border }}>
                            <View style={{ width: "40%", paddingRight: 8 }}>
                                <Text style={{ fontFamily: "Roboto", fontSize: 9, color: colors.muted, marginBottom: 2 }}>K{i + 1}</Text>
                                <Text style={{ fontFamily: "Roboto", fontSize: 10, color: colors.text }}>{title}</Text>
                            </View>
                            <View style={{ width: "10%", justifyContent: "center", alignItems: "center" }}>
                                <View style={{ backgroundColor: "#FCA5A5", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
                                    <Text style={{ fontFamily: "Roboto", fontSize: 10, fontWeight: "bold", color: "#991B1B" }}>{failedStudents.length}</Text>
                                </View>
                            </View>
                            <View style={{ width: "50%", justifyContent: "center" }}>
                                <Text style={{ fontFamily: "Roboto", fontSize: 9, color: colors.text, lineHeight: 1.4 }}>
                                    {failedStudents.map(s => getStudentName(s)).join(", ")}
                                </Text>
                            </View>
                        </View>
                    );
                })}
            </View>

            <Footer config={config} />
        </Page>
    );
};



// ============================================
// KAZANIM BAŞARI GRAFİĞİ SAYFASI
// ============================================

export const OutcomeSuccessPage = ({ analysis, config }) => {
    const outcomes = Array.isArray(analysis?.outcomes) ? analysis.outcomes : [];
    const students = Array.isArray(analysis?.studentResults) ? analysis.studentResults : [];
    const configOutcomes = Array.isArray(config?.outcomes) ? config.outcomes : [];
    const threshold = toNum(config?.generalPassingScore ?? config?.passScore ?? 50);

    if (outcomes.length === 0) return null;

    // Kazanım başarı verilerini hesapla
    const outcomeData = calculateOutcomeSuccessWithFailures(outcomes, students, threshold).map((item, idx) => ({
        ...item,
        title: configOutcomes[idx] || item.title,
        originalIndex: idx
    }));

    // Tek sayfa - tüm kazanımlar
    const totalStudents = students.length;

    // Telafi listesi için
    const failureData = outcomeData.filter(o => o.failingStudents && o.failingStudents.length > 0);

    return (
        <Page size="A4" style={styles.page}>
            <Header title="Kazanım Başarı Analizi" config={config} />

            <View style={{ marginBottom: 15 }}>
                {/* İstatistik Header */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 4 }}>
                    <Text style={{ fontFamily: "Roboto", fontSize: 13, fontWeight: "bold", color: colors.primary }}>Kazanım Başarı Oranları</Text>
                    <View style={{ flexDirection: "row", gap: 10 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                            <View style={{ width: 10, height: 10, backgroundColor: colors.success, borderRadius: 3 }} />
                            <Text style={{ fontFamily: "Roboto", fontSize: 9, color: colors.muted }}>Başarılı</Text>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                            <View style={{ width: 10, height: 10, backgroundColor: colors.danger, borderRadius: 3 }} />
                            <Text style={{ fontFamily: "Roboto", fontSize: 9, color: colors.muted }}>Telafi</Text>
                        </View>
                    </View>
                </View>

                {/* Kazanım Kartları - Kompakt */}
                {outcomeData.map((outcome, i) => {
                    const failedCount = outcome.failingStudents?.length ?? 0;
                    const passedCount = totalStudents - failedCount;
                    const successRate = totalStudents > 0 ? (passedCount / totalStudents) * 100 : 0;

                    return (
                        <View key={`outcome-${i}`} style={{ marginBottom: 8, padding: 8, backgroundColor: colors.bgAlt, borderRadius: 6, borderLeftWidth: 4, borderLeftColor: successRate >= threshold ? colors.success : colors.danger }}>
                            {/* Başlık */}
                            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                                <View style={{ flex: 1, paddingRight: 8 }}>
                                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                                        <Text style={{ fontFamily: "Roboto", fontSize: 8, fontWeight: "bold", color: colors.muted, marginRight: 4 }}>K{i + 1}</Text>
                                        <Text style={{ fontFamily: "Roboto", fontSize: 9, fontWeight: "bold", color: colors.text }} numberOfLines={1}>
                                            {outcome.title}
                                        </Text>
                                    </View>
                                </View>
                                <View style={{ alignItems: "flex-end" }}>
                                    <Text style={{ fontFamily: "Roboto", fontSize: 11, fontWeight: "bold", color: successRate >= threshold ? colors.success : colors.danger }}>
                                        %{successRate.toFixed(0)}
                                    </Text>
                                    <Text style={{ fontFamily: "Roboto", fontSize: 7, color: colors.muted }}>
                                        {failedCount} Telafi
                                    </Text>
                                </View>
                            </View>

                            {/* Progress Bar */}
                            <View style={{ flexDirection: "row", height: 10, borderRadius: 3, overflow: "hidden", backgroundColor: "#E5E7EB" }}>
                                {passedCount > 0 && (
                                    <View style={{ width: `${successRate}%`, backgroundColor: colors.success }} />
                                )}
                                {failedCount > 0 && (
                                    <View style={{ width: `${100 - successRate}%`, backgroundColor: colors.danger }} />
                                )}
                            </View>
                        </View>
                    );
                })}
            </View>

            {/* TELAFİ LİSTESİ TABLOSU */}
            {failureData.length > 0 ? (
                <View style={{ marginTop: 5, padding: 8, backgroundColor: "#FEF2F2", borderRadius: 6, borderWidth: 1, borderColor: colors.danger + "30" }}>
                    <Text style={{ fontFamily: "Roboto", fontSize: 11, fontWeight: "bold", color: colors.danger, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.danger + "30", paddingBottom: 4 }}>
                        Telafi Gereken Öğrenciler
                    </Text>

                    <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: colors.danger + "30", paddingBottom: 2, marginBottom: 4 }}>
                        <Text style={{ fontFamily: "Roboto", fontSize: 8, fontWeight: "bold", width: "40%", color: colors.danger }}>Kazanım</Text>
                        <Text style={{ fontFamily: "Roboto", fontSize: 8, fontWeight: "bold", width: "10%", textAlign: "center", color: colors.danger }}>Sayı</Text>
                        <Text style={{ fontFamily: "Roboto", fontSize: 8, fontWeight: "bold", width: "50%", color: colors.danger }}>Öğrenci Listesi</Text>
                    </View>

                    {failureData.map((outcome, idx) => {
                        const studentNames = outcome.failingStudents.map(s => getStudentName(s)).join(", ");
                        return (
                            <View key={`telafi-${idx}`} style={{ flexDirection: "row", marginBottom: 4, paddingBottom: 4, borderBottomWidth: 0.5, borderBottomColor: colors.danger + "20" }}>
                                <View style={{ width: "40%", paddingRight: 4 }}>
                                    <Text style={{ fontFamily: "Roboto", fontSize: 8, color: colors.text }}>
                                        <Text style={{ fontWeight: "bold" }}>K{outcome.originalIndex + 1}</Text>: {outcome.title.slice(0, 30)}
                                        {outcome.title.length > 30 ? "..." : ""}
                                    </Text>
                                </View>
                                <View style={{ width: "10%", alignItems: "center" }}>
                                    <Text style={{ fontFamily: "Roboto", fontSize: 9, fontWeight: "bold", color: colors.danger }}>{outcome.failedCount}</Text>
                                </View>
                                <View style={{ width: "50%" }}>
                                    <Text style={{ fontFamily: "Roboto", fontSize: 8, color: colors.text, lineHeight: 1.2 }}>
                                        {studentNames}
                                    </Text>
                                </View>
                            </View>
                        );
                    })}
                </View>
            ) : (
                <View style={{ marginTop: 10, padding: 10, backgroundColor: "#F0FDF4", borderRadius: 6, borderWidth: 1, borderColor: colors.success + "30", alignItems: "center" }}>
                    <Text style={{ fontFamily: "Roboto", fontSize: 10, color: colors.success, fontWeight: "bold" }}>
                        🎉 Tebrikler! Tüm kazanımlarda tam başarı sağlandı.
                    </Text>
                    <Text style={{ fontFamily: "Roboto", fontSize: 8, color: colors.muted, marginTop: 2 }}>
                        Telafi gerektiren öğrenci bulunmamaktadır.
                    </Text>
                </View>
            )}

            <Footer config={config} />
        </Page>
    );
};

// ============================================
// SORU ANALİZİ (DETAYLI LİSTE) SAYFASI
// ============================================

export const ItemAnalysisPage = ({ analysis, config }) => {
    const questions = Array.isArray(analysis?.questions) ? analysis.questions : [];

    // A4 Portrait: ~750pt available height. ~30-35 items per page.
    // If there are many questions, we might need pagination, but let's assume one page fits for now or use Map directly which wraps automatically in react-pdf if not inside a fixed View?
    // React-PDF View doesn't auto-wrap across pages like that unless using Wrap. Text does.
    // Ideally we chunk it like ClassListPages. 

    // Let's assume standard test length (20-40 questions) fits in 1-2 pages.
    // We will use similar logic to ClassListPages for chunking.

    const ROWS_PER_PAGE = 35;
    const pages = chunk(questions, ROWS_PER_PAGE);

    if (questions.length === 0) return null;

    // Renkler ve Stiller (Component içinde duplicate etmeyelim, module scope'tan alır)
    // colors ve styles upper scope'da tanımlı.

    return pages.map((rows, pageIdx) => (
        <Page key={`item-page-${pageIdx}`} size="A4" style={styles.page}>
            <Header title={`Soru Analizi Raporu (${pageIdx + 1}/${pages.length})`} config={config} />

            <View style={{ marginBottom: 10 }}>
                <Text style={{ fontSize: 9, color: colors.muted }}>
                    Her bir sorunun ayırt edicilik düzeyi ve doğru cevaplanma oranı aşağıdaki gibidir.
                </Text>
            </View>

            <View style={[styles.table, { borderWidth: 1, borderColor: colors.border }]}>
                <View style={[styles.trHead, { backgroundColor: colors.bgAlt }]}>
                    <Text style={[styles.th, { width: "10%", textAlign: "center" }]}>No</Text>
                    <Text style={[styles.th, { width: "15%", textAlign: "center" }]}>Max Puan</Text>
                    <Text style={[styles.th, { width: "15%", textAlign: "center" }]}>Ortalama</Text>
                    <Text style={[styles.th, { width: "40%", textAlign: "left", paddingLeft: 8 }]}>Zorluk Seviyesi</Text>
                    <Text style={[styles.th, { width: "20%", textAlign: "center" }]}>Başarı %</Text>
                </View>

                {rows.map((q, i) => {
                    const globalIdx = pageIdx * ROWS_PER_PAGE + i + 1;
                    const maxScore = toNum(q?.maxScore, 10);
                    const avgScore = toNum(q?.avgScore, 0);
                    const difficulty = maxScore > 0 ? (avgScore / maxScore) * 100 : 0;

                    let diffText = "Orta";
                    let diffColor = colors.warning;

                    if (difficulty > 70) { diffText = "Kolay / Çok Başarılı"; diffColor = colors.success; }
                    else if (difficulty < 40) { diffText = "Zor / Düşük Başarı"; diffColor = colors.danger; }

                    const bgColor = i % 2 === 0 ? "#fff" : colors.bgAlt;

                    return (
                        <View key={`qrow-${globalIdx}`} style={[styles.tr, { backgroundColor: bgColor, alignItems: "center" }]}>
                            <Text style={[styles.td, { width: "10%", textAlign: "center", fontWeight: "bold" }]}>{q.qNo || globalIdx}</Text>
                            <Text style={[styles.td, { width: "15%", textAlign: "center" }]}>{maxScore}</Text>
                            <Text style={[styles.td, { width: "15%", textAlign: "center" }]}>{avgScore.toFixed(2)}</Text>
                            <View style={[styles.td, { width: "40%", paddingLeft: 8 }]}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                    <View style={{ width: 60, height: 4, backgroundColor: colors.border, borderRadius: 2 }}>
                                        <View style={{ width: `${difficulty}%`, height: 4, backgroundColor: diffColor, borderRadius: 2 }} />
                                    </View>
                                    <Text style={{ fontSize: 8, color: diffColor }}>{diffText}</Text>
                                </View>
                            </View>
                            <Text style={[styles.tdBold, { width: "20%", textAlign: "center", color: diffColor }]}>%{difficulty.toFixed(0)}</Text>
                        </View>
                    );
                })}
            </View>

            <Footer config={config} />
        </Page>
    ));
};

// ============================================
// ANA DOKÜMAN
// ============================================

export default function FullReportDocument({ analysis, config, questions }) {
    const enrichedAnalysis = {
        ...analysis,
        questions: questions ?? analysis?.questions ?? analysis?.questionStats ?? []
    };

    return (
        <Document>
            <SummaryAndAnalysisPage analysis={enrichedAnalysis} config={config} />
            <ClassListPages analysis={enrichedAnalysis} config={config} />
            <OutcomeSuccessPage analysis={enrichedAnalysis} config={config} />
            {/* Öğrenci karneleri ayrı sekmeden indirilecek */}
        </Document>
    );
}
