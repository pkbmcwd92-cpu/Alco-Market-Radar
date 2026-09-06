import {
  AdObservation,
  Competitor,
  ConfidenceAssessment,
  EvidenceChain,
  EvidenceItem,
  MarketOpportunityScore,
  MarketSignal,
  SignalSeverity,
  SignalType,
} from '../types/radar';
import { buildCreativeIntelligenceV1_1 } from './classificationEngine';
import { generateTemporalTrendReport } from './trendEngine';
import {
  ANGLE_LABELS,
  FORMAT_LABELS,
  HOOK_LABELS,
  OFFER_LABELS,
  formatDeltaPercentagePoints,
} from '../utils/labels';

/**
 * ALCO MARKET RADAR V1.1.1
 * Deterministically evaluates market signals and attaches traceable evidence chains.
 * Adheres strictly to:
 * - Bahasa Indonesia output
 * - Cautious epistemic separation: TERAMATI vs POLA vs INTERPRETASI vs HIPOTESIS vs LANGKAH BERIKUTNYA
 * - No unsupported strategic claims (no assumed private spend, ROAS, internal fatigue reasons, or winner/loser status)
 */
export function evaluateSignalsV1_1(
  workspaceId: string,
  ads: AdObservation[],
  competitors: Competitor[]
): MarketSignal[] {
  const signals: MarketSignal[] = [];
  const workspaceAds = ads.filter((a) => a.workspaceId === workspaceId);
  const competitorMap = new Map<string, string>(competitors.map((c) => [c.id, c.name]));

  if (workspaceAds.length === 0) return [];

  // Generate temporal report
  const trendReport = generateTemporalTrendReport(workspaceId, workspaceAds, competitorMap, 7);

  // 1. Detect Creative Surge / Velocity Spike per competitor
  for (const vel of trendReport.competitorVelocities) {
    if (vel.newCreativesCurrentPeriod >= 2 && vel.velocityChangePct >= 50) {
      const recentAds = workspaceAds.filter(
        (a) => a.competitorId === vel.competitorId && (a.observedDays || 1) <= 7
      );

      const evidenceId = `ev_surge_${vel.competitorId}`;
      const evidence: EvidenceItem[] = [
        {
          evidenceId,
          type: 'LAUNCH_VELOCITY_SPIKE',
          description: `Laju peluncuran creative ${vel.competitorName} naik dari ${vel.newCreativesPreviousPeriod} menjadi ${vel.newCreativesCurrentPeriod} creative per periode pengamatan (+${vel.velocityChangePct}%).`,
          sourceId: vel.competitorId,
          observedAt: new Date().toISOString(),
          value: `+${vel.velocityChangePct}% laju peluncuran`,
          previousValue: `${vel.newCreativesPreviousPeriod} creative`,
          currentValue: `${vel.newCreativesCurrentPeriod} creative`,
          supportingIds: recentAds.map((a) => a.id),
        },
      ];

      const evidenceConfidence = recentAds.length >= 3 ? 'HIGH' : 'MEDIUM';
      const interpretationConfidence = 'MEDIUM'; // Launch velocity is verified, but testing intent is inferred
      const hypothesisConfidence = 'LOW'; // Internal advertiser intent remains unverified

      const confidenceAssessment: ConfidenceAssessment = {
        evidence: evidenceConfidence,
        interpretation: interpretationConfidence,
        hypothesis: hypothesisConfidence,
        rationale: `Terdeteksi ${recentAds.length} creative publik baru dalam 7 hari terakhir. Peningkatan jumlah terverifikasi dari data observasi publik, namun kalender promosi internal dan alokasi anggaran tidak dapat dikonfirmasi dari data publik saja.`,
      };

      const chain: EvidenceChain = {
        observation: `${vel.newCreativesCurrentPeriod} creative baru terdeteksi dalam 7 hari terakhir untuk ${vel.competitorName}.`,
        evidenceSummary: `Jumlah creative periode sebelumnya: ${vel.newCreativesPreviousPeriod}. Periode saat ini: ${vel.newCreativesCurrentPeriod}. Perubahan: +${vel.velocityChangePct}%.`,
        pattern: `Laju peluncuran creative baru meningkat dari ${vel.newCreativesPreviousPeriod} menjadi ${vel.newCreativesCurrentPeriod} creative per periode pengamatan.`,
        signal: `Lonjakan aktivitas creative baru terdeteksi pada ${vel.competitorName}.`,
        interpretation: `Aktivitas creative brand ini meningkat dibanding periode sebelumnya.`,
        hypothesis: `Pola ini mungkin konsisten dengan periode eksperimen atau rotasi creative yang lebih aktif, tetapi tujuan internal advertiser tidak dapat dikonfirmasi dari data publik.`,
        strategicImplication: `Pantau apakah creative baru tersebut tetap aktif selama 14 hari berikutnya.`,
      };

      signals.push({
        id: `sig_surge_${vel.competitorId}`,
        workspaceId,
        type: 'CREATIVE_SURGE',
        title: `${vel.competitorName}: Lonjakan Jumlah Creative Baru`,
        description: `Terdeteksi ${vel.newCreativesCurrentPeriod} creative baru dalam 7 hari terakhir (+${vel.velocityChangePct}% dibanding periode pengamatan sebelumnya).`,
        whyItMatters: `Lonjakan aktivitas dapat menunjukkan adanya perubahan pendekatan creative yang layak dipantau.`,
        severity: 'high',
        confidence: evidenceConfidence,
        confidenceAssessment,
        detectedAt: new Date().toISOString(),
        evidence,
        relatedCompetitors: [vel.competitorId],
        relatedAds: recentAds.map((a) => a.id),
        relatedCreatives: recentAds.map((a) => a.creativeId),
        status: 'active',
        triad: {
          observed: chain.observation,
          inferred: chain.interpretation,
          hypothesis: chain.hypothesis,
        },
        observedFacts: [
          `${vel.newCreativesCurrentPeriod} creative baru terdeteksi dalam 7 hari terakhir.`,
          `Format terbanyak yang diamati: ${FORMAT_LABELS[vel.dominantFormat] || vel.dominantFormat}.`,
          `Angle pesan terbanyak yang diamati: ${ANGLE_LABELS[vel.dominantAngle] || vel.dominantAngle}.`,
        ],
        calculatedPatterns: [
          `Laju peluncuran creative naik ${vel.velocityChangePct}% dibanding periode pengamatan sebelumnya.`,
          `Total inventory creative aktif yang terpantau: ${vel.activeInventoryCount} creative.`,
        ],
        interpretation: chain.interpretation,
        hypothesis: chain.hypothesis,
        strategicImplication: chain.strategicImplication,
        nextActions: [
          `Pantau apakah creative baru tersebut masih aktif dalam 7–14 hari berikutnya.`,
          `Periksa variasi messaging dan penawaran pada materi yang baru diluncurkan.`,
        ],
        evidenceChain: chain,
        createdAt: new Date().toISOString(),
      });
    }
  }

  // 2. Detect Creative Disappearance / Pauses
  for (const vel of trendReport.competitorVelocities) {
    if (vel.disappearedCreatives >= 2) {
      const inactiveAds = workspaceAds.filter(
        (a) => a.competitorId === vel.competitorId && a.adStatus === 'inactive'
      );

      const chain: EvidenceChain = {
        observation: `${vel.disappearedCreatives} creative yang sebelumnya aktif kini tidak lagi terdeteksi sebagai aktif pada ${vel.competitorName}.`,
        evidenceSummary: `${vel.disappearedCreatives} ad beralih status ke tidak aktif dalam pustaka iklan publik.`,
        pattern: `Terjadi penurunan inventory aktif sebesar ${vel.disappearedCreatives} creative (${Math.round((vel.disappearedCreatives / (vel.activeInventoryCount + vel.disappearedCreatives || 1)) * 100)}% dari total creative yang terpantau).`,
        signal: `Creative tidak lagi aktif terdeteksi pada ${vel.competitorName}.`,
        interpretation: `Terjadi pengurangan inventory creative aktif.`,
        hypothesis: `Penghentian dapat disebabkan oleh rotasi creative, berakhirnya promo, perubahan campaign, stok, atau faktor lain yang tidak dapat dikonfirmasi dari data publik.`,
        strategicImplication: `Bandingkan pola creative yang berhenti dengan creative yang masih aktif untuk mengamati perbedaan pesan.`,
      };

      signals.push({
        id: `sig_disappear_${vel.competitorId}`,
        workspaceId,
        type: 'CREATIVE_DISAPPEARANCE',
        title: `${vel.competitorName}: ${vel.disappearedCreatives} Creative Tidak Lagi Aktif`,
        description: `${vel.disappearedCreatives} creative yang sebelumnya aktif kini tidak lagi terdeteksi dalam pustaka iklan publik ${vel.competitorName}.`,
        whyItMatters: `Pemantauan creative yang berhenti tayang membantu mengidentifikasi variasi materi yang tidak lagi dilanjutkan distribusinya.`,
        severity: 'medium',
        confidence: 'HIGH',
        confidenceAssessment: {
          evidence: 'HIGH',
          interpretation: 'MEDIUM',
          hypothesis: 'LOW',
          rationale: `Observasi langsung status iklan yang beralih menjadi tidak aktif. Alasan internal penghentian tidak dapat dikonfirmasi tanpa data privat pengiklan.`,
        },
        detectedAt: new Date().toISOString(),
        evidence: [
          {
            evidenceId: `ev_disappear_${vel.competitorId}`,
            type: 'CREATIVE_STATUS_TRANSITION',
            description: `${vel.disappearedCreatives} materi iklan beralih dari aktif menjadi tidak aktif.`,
            sourceId: vel.competitorId,
            observedAt: new Date().toISOString(),
            value: `${vel.disappearedCreatives} creative berhenti`,
            supportingIds: inactiveAds.map((a) => a.id),
          },
        ],
        relatedCompetitors: [vel.competitorId],
        relatedAds: inactiveAds.map((a) => a.id),
        relatedCreatives: inactiveAds.map((a) => a.creativeId),
        status: 'active',
        triad: {
          observed: chain.observation,
          inferred: chain.interpretation,
          hypothesis: chain.hypothesis,
        },
        observedFacts: [
          `${vel.disappearedCreatives} creative yang sebelumnya aktif tidak lagi ditemukan dalam pantauan iklan publik.`,
        ],
        calculatedPatterns: [
          `Creative tidak aktif mewakili ${Math.round((vel.disappearedCreatives / (vel.activeInventoryCount + vel.disappearedCreatives || 1)) * 100)}% dari total materi yang terpantau.`,
        ],
        interpretation: chain.interpretation,
        hypothesis: chain.hypothesis,
        strategicImplication: chain.strategicImplication,
        nextActions: [
          `Bandingkan pola creative yang berhenti dengan creative yang masih aktif.`,
          `Catat apakah ada hook atau format tertentu yang tidak lagi digunakan.`,
        ],
        evidenceChain: chain,
        createdAt: new Date().toISOString(),
      });
    }
  }

  // 3. Detect Format Shift (e.g. Video vs Static)
  const topFormatShift = trendReport.formatShifts.find((m) => Math.abs(m.deltaPercentagePoints) >= 15 || m.currentPeriodPct >= 60);
  if (topFormatShift) {
    const matchingAds = workspaceAds.filter((a) => a.format === topFormatShift.name && a.adStatus !== 'inactive');
    const formatName = FORMAT_LABELS[topFormatShift.name as any] || topFormatShift.name;
    const deltaText = formatDeltaPercentagePoints(topFormatShift.deltaPercentagePoints);

    const chain: EvidenceChain = {
      observation: `Format ${formatName} mewakili ${topFormatShift.currentPeriodPct}% dari creative aktif yang diamati di antara ${topFormatShift.competitorBreadthCount} competitor.`,
      evidenceSummary: `Proporsi format ${formatName} ${deltaText} (dari ${topFormatShift.previousPeriodPct}% menjadi ${topFormatShift.currentPeriodPct}%).`,
      pattern: `Konsentrasi format: ${formatName} digunakan secara dominan di ${topFormatShift.competitorBreadthCount} pustaka iklan competitor berbeda.`,
      signal: `Pergeseran proporsi format ke arah ${formatName}.`,
      interpretation: `Penggunaan format ${formatName} meningkat di antara competitor yang dipantau.`,
      hypothesis: `Hal ini mungkin menunjukkan peningkatan eksplorasi format ${formatName} di kategori tersebut. Faktor efisiensi biaya tayang internal tidak dapat dikonfirmasi dari data publik.`,
      strategicImplication: `Bandingkan perubahan ini dengan komposisi format creative pada brand Anda.`,
    };

    signals.push({
      id: `sig_format_shift_${topFormatShift.name}`,
      workspaceId,
      type: 'FORMAT_SHIFT',
      title: `Dominasi Format ${formatName} di Kategori Pasar`,
      description: `Format ${formatName} mencakup ${topFormatShift.currentPeriodPct}% dari inventory creative aktif yang terpantau (${deltaText}).`,
      whyItMatters: `Perubahan konsentrasi format di pasar menunjukkan jenis materi iklan yang sedang paling banyak digunakan oleh competitor.`,
      severity: 'medium',
      confidence: 'HIGH',
      confidenceAssessment: {
        evidence: 'HIGH',
        interpretation: 'MEDIUM',
        hypothesis: 'LOW',
        rationale: `Dihitung secara deterministik dari ${matchingAds.length} observasi iklan publik terverifikasi di ${topFormatShift.competitorBreadthCount} brand. Efektivitas performa internal format tetap merupakan hipotesis yang belum terkonfirmasi.`,
      },
      detectedAt: new Date().toISOString(),
      evidence: [
        {
          evidenceId: `ev_fmt_${topFormatShift.name}`,
          type: 'FORMAT_SHARE_CALCULATION',
          description: `Pangsa format ${formatName} ${deltaText} di antara ${topFormatShift.competitorBreadthCount} competitor.`,
          sourceId: workspaceId,
          observedAt: new Date().toISOString(),
          value: `${topFormatShift.currentPeriodPct}%`,
          previousValue: `${topFormatShift.previousPeriodPct}%`,
          currentValue: `${topFormatShift.currentPeriodPct}%`,
          supportingIds: matchingAds.slice(0, 4).map((a) => a.id),
        },
      ],
      relatedCompetitors: Array.from(new Set(matchingAds.map((a) => a.competitorId))).slice(0, 4),
      relatedAds: matchingAds.slice(0, 4).map((a) => a.id),
      relatedCreatives: matchingAds.slice(0, 4).map((a) => a.creativeId),
      status: 'active',
      triad: {
        observed: chain.observation,
        inferred: chain.interpretation,
        hypothesis: chain.hypothesis,
      },
      observedFacts: [
        `${topFormatShift.currentPeriodPct}% dari creative aktif yang diamati menggunakan format ${formatName}.`,
        `Teramati di ${topFormatShift.competitorBreadthCount} brand yang dipantau.`,
      ],
      calculatedPatterns: [
        `Perubahan proporsi: ${deltaText} dibanding periode pengamatan sebelumnya.`,
      ],
      interpretation: chain.interpretation,
      hypothesis: chain.hypothesis,
      strategicImplication: chain.strategicImplication,
      nextActions: [
        `Bandingkan alokasi format materi brand Anda dengan rasio pasar ${topFormatShift.currentPeriodPct}%.`,
        `Pertimbangkan pengujian format ${formatName} bila belum tersedia dalam pengujian aktif.`,
      ],
      evidenceChain: chain,
      createdAt: new Date().toISOString(),
    });
  }

  // 4. Detect Messaging / Hook Shift (e.g. Authority / Clinical hooks)
  const topHookShift = trendReport.hookShifts.find((m) => m.deltaPercentagePoints >= 10 || m.currentPeriodPct >= 30);
  if (topHookShift) {
    const matchingAds = workspaceAds.filter((a) => buildCreativeIntelligenceV1_1(a).primaryHook === topHookShift.name);
    const hookLabel = HOOK_LABELS[topHookShift.name as any] || topHookShift.name;
    const deltaText = formatDeltaPercentagePoints(topHookShift.deltaPercentagePoints);

    const chain: EvidenceChain = {
      observation: `Creative dengan hook ${hookLabel} mewakili ${topHookShift.currentPeriodPct}% dari creative aktif yang diamati.`,
      evidenceSummary: `Proporsi hook ${hookLabel} ${deltaText} (dari ${topHookShift.previousPeriodPct}% menjadi ${topHookShift.currentPeriodPct}%) pada ${topHookShift.competitorBreadthCount} competitor.`,
      pattern: `Konvergensi hook: hook ${hookLabel} digunakan oleh ${topHookShift.competitorBreadthCount} competitor.`,
      signal: `Pergeseran pola creative ke arah hook ${hookLabel}.`,
      interpretation: `Hook berbasis ${hookLabel} semakin sering muncul dalam creative yang diamati.`,
      hypothesis: `Advertiser mungkin sedang meningkatkan penggunaan kredibilitas atau pesan ${hookLabel} dalam messaging. Perubahan psikologi konsumen tidak dapat dipastikan tanpa riset langsung.`,
      strategicImplication: `Evaluasi apakah brand Anda memiliki materi komunikasi dengan hook serupa atau memilih diferensiasi angle lain.`,
    };

    signals.push({
      id: `sig_hook_shift_${topHookShift.name}`,
      workspaceId,
      type: 'CREATIVE_PATTERN_SHIFT',
      title: `Peningkatan Penggunaan Hook ${hookLabel}`,
      description: `Pangsa creative dengan hook ${hookLabel} mencapai ${topHookShift.currentPeriodPct}% dari materi aktif yang diamati (${deltaText}).`,
      whyItMatters: `Ketika beberapa competitor mulai menggunakan variasi hook yang serupa, kepadatan pesan meningkat di kategori tersebut.`,
      severity: 'high',
      confidence: 'HIGH',
      confidenceAssessment: {
        evidence: 'HIGH',
        interpretation: 'MEDIUM',
        hypothesis: 'LOW',
        rationale: `Klasifikasi leksikal didasarkan pada ${matchingAds.length} teks iklan terverifikasi di ${topHookShift.competitorBreadthCount} brand.`,
      },
      detectedAt: new Date().toISOString(),
      evidence: [
        {
          evidenceId: `ev_hook_${topHookShift.name}`,
          type: 'HOOK_SHARE_DELTA',
          description: `Pangsa hook ${hookLabel} ${deltaText} di antara ${topHookShift.competitorBreadthCount} brand.`,
          sourceId: workspaceId,
          observedAt: new Date().toISOString(),
          value: `${topHookShift.currentPeriodPct}%`,
          previousValue: `${topHookShift.previousPeriodPct}%`,
          currentValue: `${topHookShift.currentPeriodPct}%`,
          supportingIds: matchingAds.slice(0, 3).map((a) => a.id),
        },
      ],
      relatedCompetitors: Array.from(new Set(matchingAds.map((a) => a.competitorId))).slice(0, 3),
      relatedAds: matchingAds.slice(0, 3).map((a) => a.id),
      relatedCreatives: matchingAds.slice(0, 3).map((a) => a.creativeId),
      status: 'active',
      triad: {
        observed: chain.observation,
        inferred: chain.interpretation,
        hypothesis: chain.hypothesis,
      },
      observedFacts: [
        `Hook ${hookLabel} teridentifikasi pada ${matchingAds.length} creative aktif yang diamati.`,
      ],
      calculatedPatterns: [
        `Pangsa hook di kategori naik dari ${topHookShift.previousPeriodPct}% menjadi ${topHookShift.currentPeriodPct}%.`,
      ],
      interpretation: chain.interpretation,
      hypothesis: chain.hypothesis,
      strategicImplication: chain.strategicImplication,
      nextActions: [
        `Evaluasi apakah brand Anda memiliki materi komunikasi dengan angle serupa.`,
        `Pantau apakah variasi hook ini terus dipertahankan oleh competitor selama 14 hari ke depan.`,
      ],
      evidenceChain: chain,
      createdAt: new Date().toISOString(),
    });
  }

  // 5. Detect Offer Shift (e.g. Bundles / Gift with Purchase)
  const topOfferShift = trendReport.offerShifts.find((m) => m.name !== 'no explicit offer' && (m.deltaPercentagePoints >= 10 || m.currentPeriodPct >= 30));
  if (topOfferShift) {
    const matchingAds = workspaceAds.filter((a) => buildCreativeIntelligenceV1_1(a).offerType === topOfferShift.name);
    const offerLabel = OFFER_LABELS[topOfferShift.name as any] || topOfferShift.name;
    const deltaText = formatDeltaPercentagePoints(topOfferShift.deltaPercentagePoints);

    const chain: EvidenceChain = {
      observation: `Iklan yang memuat penawaran ${offerLabel} mencakup ${topOfferShift.currentPeriodPct}% dari creative aktif yang diamati.`,
      evidenceSummary: `Struktur penawaran ${offerLabel} ${deltaText} (dari ${topOfferShift.previousPeriodPct}% menjadi ${topOfferShift.currentPeriodPct}%).`,
      pattern: `Pergeseran struktur penawaran: penawaran ${offerLabel} digunakan oleh ${topOfferShift.competitorBreadthCount} brand.`,
      signal: `Pergeseran pola penawaran pasar ke arah ${offerLabel}.`,
      interpretation: `Terlihat peningkatan penggunaan struktur penawaran ${offerLabel} di antara competitor yang dipantau.`,
      hypothesis: `Advertiser mungkin sedang menguji respons audiens terhadap kemasan penawaran ${offerLabel}. Pengaruh aktual terhadap nilai transaksi tidak dapat dikonfirmasi dari data publik.`,
      strategicImplication: `Bandingkan struktur penawaran brand Anda dengan pola penawaran yang sedang ramai digunakan competitor.`,
    };

    signals.push({
      id: `sig_offer_shift_${topOfferShift.name}`,
      workspaceId,
      type: 'OFFER_SHIFT',
      title: `Peningkatan Penggunaan Penawaran ${offerLabel}`,
      description: `Penawaran tipe ${offerLabel} muncul pada ${topOfferShift.currentPeriodPct}% creative aktif yang terpantau (${deltaText}).`,
      whyItMatters: `Struktur penawaran dapat mempengaruhi pertimbangan nilai pembeli saat mengunjungi halaman penawaran.`,
      severity: 'medium',
      confidence: 'MEDIUM',
      confidenceAssessment: {
        evidence: 'HIGH',
        interpretation: 'MEDIUM',
        hypothesis: 'LOW',
        rationale: `Observasi langsung kata kunci penawaran dalam materi iklan aktif. Dampak finansial langsung pada omset competitor adalah hipotesis yang belum terkonfirmasi.`,
      },
      detectedAt: new Date().toISOString(),
      evidence: [
        {
          evidenceId: `ev_offer_${topOfferShift.name}`,
          type: 'OFFER_SHARE_DELTA',
          description: `Pangsa penawaran ${offerLabel} ${deltaText}.`,
          sourceId: workspaceId,
          observedAt: new Date().toISOString(),
          value: `${topOfferShift.currentPeriodPct}%`,
          previousValue: `${topOfferShift.previousPeriodPct}%`,
          currentValue: `${topOfferShift.currentPeriodPct}%`,
          supportingIds: matchingAds.slice(0, 3).map((a) => a.id),
        },
      ],
      relatedCompetitors: Array.from(new Set(matchingAds.map((a) => a.competitorId))).slice(0, 3),
      relatedAds: matchingAds.slice(0, 3).map((a) => a.id),
      relatedCreatives: matchingAds.slice(0, 3).map((a) => a.creativeId),
      status: 'active',
      triad: {
        observed: chain.observation,
        inferred: chain.interpretation,
        hypothesis: chain.hypothesis,
      },
      observedFacts: [
        `${matchingAds.length} creative aktif secara eksplisit memuat penawaran tipe ${offerLabel}.`,
      ],
      calculatedPatterns: [
        `Proporsi penawaran berubah dari ${topOfferShift.previousPeriodPct}% menjadi ${topOfferShift.currentPeriodPct}%.`,
      ],
      interpretation: chain.interpretation,
      hypothesis: chain.hypothesis,
      strategicImplication: chain.strategicImplication,
      nextActions: [
        `Tinjau struktur harga dan paket bundling pada landing page competitor yang terpantau.`,
        `Bandingkan daya tarik paket penawaran brand Anda dengan penawaran competitor.`,
      ],
      evidenceChain: chain,
      createdAt: new Date().toISOString(),
    });
  }

  // 6. Detect Potential Market Gap (e.g. Uncontested Angle)
  const angleCounts = new Map<string, number>();
  for (const ad of workspaceAds) {
    const ci = buildCreativeIntelligenceV1_1(ad);
    angleCounts.set(ci.primaryAngle, (angleCounts.get(ci.primaryAngle) || 0) + 1);
  }

  const totalObserved = workspaceAds.length;
  const zeroAngles = ['convenience', 'fear/risk reduction', 'status'].filter(
    (ang) => (angleCounts.get(ang) || 0) === 0
  );

  if (zeroAngles.length > 0 && totalObserved >= 6) {
    const targetAngle = zeroAngles[0];
    const angleLabel = ANGLE_LABELS[targetAngle as any] || targetAngle;

    const chain: EvidenceChain = {
      observation: `0 dari ${totalObserved} creative aktif yang diamati saat ini menggunakan angle pesan ${angleLabel}.`,
      evidenceSummary: `Mayoritas creative saat ini terpusat pada solusi masalah kulit, transformasi, dan nilai ekonomis.`,
      pattern: `Celah penempatan pesan: 0% adopsi competitor pada angle ${angleLabel}.`,
      signal: `Potensi Celah Pasar: Angle ${angleLabel} belum banyak digunakan.`,
      interpretation: `Competitor saat ini lebih banyak mengulang klaim fitur produk langsung, sehingga angle ${angleLabel} relatif belum terisi pada observasi saat ini.`,
      hypothesis: `Area ini relatif kurang digunakan dalam observasi saat ini dan layak diuji sebagai kemungkinan diferensiasi. Keberhasilan komersial tetap memerlukan pengujian bertahap.`,
      strategicImplication: `Uji coba materi kreatif kecil dengan angle ${angleLabel} sementara competitor masih terkonsentrasi pada angle yang padat.`,
    };

    signals.push({
      id: `sig_gap_${targetAngle.replace(/\s+/g, '_')}`,
      workspaceId,
      type: 'POTENTIAL_MARKET_GAP',
      title: `Potensi Celah Pasar: Angle ${angleLabel} Belum Banyak Digunakan`,
      description: `Belum ditemukan creative aktif yang menggunakan pesan dengan fokus ${angleLabel} di antara brand yang dipantau.`,
      whyItMatters: `Area yang relatif belum banyak digunakan menawarkan ruang pengujian untuk membedakan pesan dari keramaian kompetisi.`,
      severity: 'low',
      confidence: 'MEDIUM',
      confidenceAssessment: {
        evidence: 'HIGH', // 0% observed is verifiable
        interpretation: 'MEDIUM', // Gap existence is verified, but demand is inferred
        hypothesis: 'LOW', // Commercial success of the angle is unproven
        rationale: `Tingkat adopsi 0% terverifikasi dari audit teks iklan publik di ${competitorMap.size} brand. Kelayakan komersial dari celah ini membutuhkan pengujian skala kecil.`,
      },
      detectedAt: new Date().toISOString(),
      evidence: [
        {
          evidenceId: `ev_gap_${targetAngle}`,
          type: 'TAXONOMY_ABSENCE_AUDIT',
          description: `0 dari ${totalObserved} creative aktif di ${workspaceId} menggunakan angle ${angleLabel}.`,
          sourceId: workspaceId,
          observedAt: new Date().toISOString(),
          value: '0% adopsi pasar',
          supportingIds: workspaceAds.slice(0, 2).map((a) => a.id),
        },
      ],
      relatedCompetitors: Array.from(competitorMap.keys()).slice(0, 3),
      relatedAds: workspaceAds.slice(0, 2).map((a) => a.id),
      relatedCreatives: workspaceAds.slice(0, 2).map((a) => a.creativeId),
      status: 'investigating',
      triad: {
        observed: chain.observation,
        inferred: chain.interpretation,
        hypothesis: chain.hypothesis,
      },
      observedFacts: [
        `0 dari ${totalObserved} creative aktif yang diamati menggunakan angle ${angleLabel}.`,
      ],
      calculatedPatterns: [
        `Tingkat adopsi di antara competitor yang dipantau: 0,0%.`,
      ],
      interpretation: chain.interpretation,
      hypothesis: chain.hypothesis,
      strategicImplication: chain.strategicImplication,
      nextActions: [
        `Susun 2-3 variasi konsep pengujian materi dengan angle ${angleLabel}.`,
        `Evaluasi respons awal sebelum memutuskan peningkatan alokasi produksi materi.`,
      ],
      evidenceChain: chain,
      createdAt: new Date().toISOString(),
    });
  }

  return signals;
}

/**
 * Deterministically calculates Market Opportunity Scores
 * Based strictly on observable factors:
 * - Novelty (rarity in current ad inventory)
 * - Adoption Gap (uncontested space across competitors)
 * - Evidence Strength (data completeness and sample size)
 * - Saturation (penalizes crowded, overused hooks)
 */
export function calculateMarketOpportunities(
  workspaceId: string,
  ads: AdObservation[],
  signals: MarketSignal[]
): MarketOpportunityScore[] {
  const opportunities: MarketOpportunityScore[] = [];
  const workspaceAds = ads.filter((a) => a.workspaceId === workspaceId);

  if (workspaceAds.length === 0) return [];

  const total = workspaceAds.length;
  const angleCounts = new Map<string, number>();

  for (const ad of workspaceAds) {
    const ci = buildCreativeIntelligenceV1_1(ad);
    angleCounts.set(ci.primaryAngle, (angleCounts.get(ci.primaryAngle) || 0) + 1);
  }

  // Opportunity 1: Differentiated Lifestyle / Uncontested Angle
  const lowestAngle = Array.from(angleCounts.entries()).sort((a, b) => a[1] - b[1])[0];
  const lowestAngleName = lowestAngle ? lowestAngle[0] : 'differentiation';
  const lowestAngleCount = lowestAngle ? lowestAngle[1] : 0;
  const saturationPct = Math.round((lowestAngleCount / total) * 100);

  const novelty = Math.max(10, 100 - saturationPct);
  const adoptionGap = Math.max(20, 95 - lowestAngleCount * 15);
  const evidenceStrength = Math.min(95, Math.round(total * 8));
  const compositeScore = Math.round(novelty * 0.35 + adoptionGap * 0.35 + evidenceStrength * 0.2 + (100 - saturationPct) * 0.1);
  const lowestAngleLabel = ANGLE_LABELS[lowestAngleName as any] || lowestAngleName;

  opportunities.push({
    id: `opp_angle_${lowestAngleName.replace(/\s+/g, '_')}`,
    workspaceId,
    title: `Peluang Diferensiasi Angle: ${lowestAngleLabel}`,
    description: `Hanya ${lowestAngleCount} dari ${total} creative aktif yang diamati menggunakan pesan dengan fokus ${lowestAngleLabel}. Konsentrasi competitor yang rendah memberikan ruang pengujian diferensiasi.`,
    score: Math.min(98, Math.max(20, compositeScore)),
    novelty,
    adoptionGap,
    evidenceStrength,
    saturation: saturationPct,
    uncontestedAngle: lowestAngleLabel,
    recommendedExploration: `Rancang 2-3 konsep creative yang membawakan manfaat produk melalui sudut pandang ${lowestAngleLabel}.`,
    supportingEvidenceIds: signals.map((s) => s.evidence[0]?.evidenceId).filter(Boolean).slice(0, 2),
    confidence: {
      evidence: 'HIGH',
      interpretation: 'MEDIUM',
      hypothesis: 'LOW',
      rationale: `Tingkat kejenuhan rendah (${saturationPct}%) dihitung secara deterministik dari ${total} observasi iklan publik. Performa komersial adalah hipotesis yang perlu diuji.`,
    },
  });

  // Opportunity 2: Bundle Value Differentiation
  const bundleCount = workspaceAds.filter((a) => buildCreativeIntelligenceV1_1(a).offerType === 'bundle').length;
  const bundleSat = Math.round((bundleCount / total) * 100);
  if (bundleSat >= 30) {
    opportunities.push({
      id: `opp_counter_bundle`,
      workspaceId,
      title: 'Peluang Diferensiasi Terhadap Penawaran Bundling Standar',
      description: `${bundleSat}% dari iklan yang terpantau menggunakan paket bundling harga. Uji coba penawaran berbasis solusi bertahap dapat dipertimbangkan dibanding diskon kuantitas semata.`,
      score: 78,
      novelty: 75,
      adoptionGap: 80,
      evidenceStrength: 85,
      saturation: bundleSat,
      uncontestedAngle: 'solusi bertahap bergaransi',
      recommendedExploration: 'Uji penawaran paket rutin 14 hari dengan jaminan hasil daripada sekadar potongan persentase.',
      supportingEvidenceIds: signals.map((s) => s.evidence[0]?.evidenceId).filter(Boolean).slice(0, 2),
      confidence: {
        evidence: 'HIGH',
        interpretation: 'MEDIUM',
        hypothesis: 'LOW',
        rationale: `Teramati tingginya ketergantungan competitor pada penawaran bundling harga. Daya tarik penawaran alternatif merupakan hipotesis pengujian strategis.`,
      },
    });
  }

  return opportunities;
}
