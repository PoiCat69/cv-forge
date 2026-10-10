import { useState, useMemo } from 'react';
import { CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Sparkles, ShieldCheck } from 'lucide-react';
import type { CVData } from '../types/cv';

interface SuggestionItem {
  id: string;
  section: string;
  label: string;
  tip: string;
  passed: boolean;
  weight: number;
}

const ACTION_VERBS = [
  // English
  'led', 'developed', 'built', 'designed', 'increased', 'managed', 'created', 'implemented',
  'architected', 'automated', 'engineered', 'spearheaded', 'reduced', 'improved', 'optimized',
  'scaled', 'launched', 'delivered', 'analyzed', 'orchestrated', 'streamlined', 'generated',
  // Indonesian
  'memimpin', 'mengembangkan', 'membangun', 'mendesain', 'meningkatkan', 'mengelola', 'membuat',
  'mengimplementasikan', 'mengarsiteki', 'mengotomatisasi', 'mengoptimalkan', 'meluncurkan',
  'merancang', 'menganalisis', 'menghasilkan', 'mengurangi', 'mempercepat',
];

export function CVScoreWidget({
  cv,
  onFocusSection,
}: {
  cv: CVData;
  onFocusSection?: (section: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const analysis = useMemo(() => {
    const suggestions: SuggestionItem[] = [];

    // 1. Personal Info
    const hasName = !!cv.personal.fullName.trim();
    suggestions.push({
      id: 'name',
      section: 'personal',
      label: 'Nama Lengkap',
      tip: 'Cantumkan nama lengkap profesional Anda.',
      passed: hasName,
      weight: 10,
    });

    const hasTitle = !!cv.personal.title.trim();
    suggestions.push({
      id: 'title',
      section: 'personal',
      label: 'Judul Profesi / Headline',
      tip: 'Beri judul spesifik, misal: "Senior Backend Engineer · Go & AWS".',
      passed: hasTitle,
      weight: 10,
    });

    const hasEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cv.personal.email.trim());
    suggestions.push({
      id: 'email',
      section: 'personal',
      label: 'Email Valid',
      tip: 'Gunakan alamat email profesional yang valid.',
      passed: hasEmail,
      weight: 10,
    });

    const hasPhone = cv.personal.phone.trim().length >= 8;
    suggestions.push({
      id: 'phone',
      section: 'personal',
      label: 'Nomor Telepon',
      tip: 'Cantumkan nomor telepon aktif yang mudah dihubungi.',
      passed: hasPhone,
      weight: 5,
    });

    const hasLocation = !!cv.personal.location.trim();
    suggestions.push({
      id: 'location',
      section: 'personal',
      label: 'Lokasi / Kota',
      tip: 'Sertakan kota dan negara domisili (misal: Jakarta, Indonesia).',
      passed: hasLocation,
      weight: 5,
    });

    // 2. Summary
    const summaryWords = cv.summary.trim() ? cv.summary.trim().split(/\s+/).length : 0;
    const summaryOptimal = summaryWords >= 35 && summaryWords <= 90;
    suggestions.push({
      id: 'summary',
      section: 'summary',
      label: 'Ringkasan Profesional ATS',
      tip: `Panjang ringkasan ideal 40–80 kata (saat ini: ${summaryWords} kata).`,
      passed: summaryOptimal,
      weight: 15,
    });

    // 3. Experience
    const hasExp = cv.experience.length > 0;
    const hasExpDetails = cv.experience.some(
      (e) => e.role.trim() && e.company.trim() && e.bullets.filter((b) => b.trim()).length >= 2
    );
    suggestions.push({
      id: 'experience',
      section: 'experience',
      label: 'Pengalaman Kerja & Pencapaian',
      tip: 'Tambahkan minimal 1 pengalaman kerja dengan 2+ poin bullet pencapaian.',
      passed: hasExp && hasExpDetails,
      weight: 20,
    });

    // Action verbs in bullets
    const allBullets = cv.experience.flatMap((e) => e.bullets).map((b) => b.trim().toLowerCase());
    const hasActionVerbs = allBullets.some((b) =>
      ACTION_VERBS.some((verb) => b.startsWith(verb) || b.includes(` ${verb} `))
    );
    suggestions.push({
      id: 'action_verbs',
      section: 'experience',
      label: 'Kata Kerja Aksi (Action Verbs)',
      tip: 'Gunakan kata kerja aksi di awal bullet (contoh: Mengembangkan, Meningkatkan, Led, Designed).',
      passed: hasActionVerbs,
      weight: 5,
    });

    // 4. Skills
    const totalSkills = cv.skills.reduce((acc, g) => acc + g.skills.length, 0);
    const hasEnoughSkills = totalSkills >= 5;
    suggestions.push({
      id: 'skills',
      section: 'skills',
      label: 'Keahlian Teknis (5+ Skill)',
      tip: `Sertakan minimal 5 keahlian relevan yang dicari mesin ATS (saat ini: ${totalSkills}).`,
      passed: hasEnoughSkills,
      weight: 10,
    });

    // 5. Education
    const hasEdu = cv.education.some((e) => e.institution.trim() && (e.degree.trim() || e.field.trim()));
    suggestions.push({
      id: 'education',
      section: 'education',
      label: 'Riwayat Pendidikan',
      tip: 'Cantumkan nama institusi dan gelar/jurusan pendidikan.',
      passed: hasEdu,
      weight: 10,
    });

    const earnedWeight = suggestions.filter((s) => s.passed).reduce((acc, s) => acc + s.weight, 0);
    const totalWeight = suggestions.reduce((acc, s) => acc + s.weight, 0);
    const percentage = Math.round((earnedWeight / totalWeight) * 100);

    return {
      percentage,
      suggestions,
      passedCount: suggestions.filter((s) => s.passed).length,
      totalCount: suggestions.length,
    };
  }, [cv]);

  const scoreLabel = useMemo(() => {
    if (analysis.percentage >= 90) return { text: 'Sangat Baik (ATS Ready)', color: 'text-emerald-600 dark:text-emerald-400' };
    if (analysis.percentage >= 70) return { text: 'Cukup Lengkap', color: 'text-[var(--primary)]' };
    if (analysis.percentage >= 50) return { text: 'Sedang Berkembang', color: 'text-amber-600 dark:text-amber-400' };
    return { text: 'Perlu Dilengkapi', color: 'text-slate-500' };
  }, [analysis.percentage]);

  return (
    <div className="rounded-card border border-[var(--border)] bg-[var(--surface)] p-4 transition-all duration-base">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative grid h-11 w-11 place-items-center rounded-control bg-[var(--surface-pearl)] text-[var(--primary)]">
            <ShieldCheck size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-[-0.224px] text-[var(--text)]">
                Skor Kelengkapan & ATS
              </span>
              <span className={`text-xs font-semibold ${scoreLabel.color}`}>
                {analysis.percentage}% · {scoreLabel.text}
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              {analysis.passedCount} dari {analysis.totalCount} kriteria ATS terpenuhi (saran non-blokir)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 rounded-pill border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text)] transition duration-fast hover:bg-[var(--border-subtle)] active:scale-[0.95]"
        >
          <span>{expanded ? 'Tutup Detail' : 'Lihat Saran'}</span>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mt-3 h-2 w-full overflow-hidden rounded-pill bg-[var(--surface-pearl)]">
        <div
          className="h-full rounded-pill transition-all duration-base ease-standard"
          style={{
            width: `${analysis.percentage}%`,
            background:
              analysis.percentage >= 80
                ? '#10b981'
                : analysis.percentage >= 60
                ? 'var(--primary)'
                : '#f59e0b',
          }}
        />
      </div>

      {/* Expandable Checklist & Tips */}
      {expanded && (
        <div className="animate-dropdown-enter mt-4 space-y-2 border-t border-[var(--border)] pt-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)]">
            <Sparkles size={13} className="text-[var(--primary)]" />
            <span>Saran optimasi ramah ATS (Applicant Tracking System):</span>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {analysis.suggestions.map((item) => (
              <div
                key={item.id}
                onClick={() => onFocusSection?.(item.section)}
                className={`flex cursor-pointer items-start gap-2.5 rounded-control border p-2.5 transition duration-fast ${
                  item.passed
                    ? 'border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10'
                    : 'border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10'
                }`}
                title={`Klik untuk lompat ke ${item.section}`}
              >
                <div className="mt-0.5 shrink-0">
                  {item.passed ? (
                    <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertCircle size={15} className="text-amber-600 dark:text-amber-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--text)]">{item.label}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">+{item.weight}%</span>
                  </div>
                  <p className="mt-0.5 text-[11px] leading-tight text-[var(--text-muted)]">{item.tip}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
