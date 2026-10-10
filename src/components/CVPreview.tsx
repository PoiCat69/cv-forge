import { useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  Mail, Phone, MapPin, Globe, Linkedin, Github, ExternalLink,
} from 'lucide-react';
import type { CVData, Customization } from '../types/cv';
import { FONTS } from '../types/cv';
import { densityTokens } from '../lib/defaults';

// A4 at 96dpi ≈ 794 × 1123px. We render at that base and scale via transform.
const A4_W = 794;
const A4_H = 1123;

export function CVPreview({
  cv,
  custom,
  forPrint = false,
  onPageCountChange,
}: {
  cv: CVData;
  custom: Customization;
  forPrint?: boolean;
  onPageCountChange?: (count: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);
  const font = FONTS.find((f) => f.id === custom.font)?.stack ?? FONTS[0].stack;
  const d = densityTokens[custom.density];

  useEffect(() => {
    if (forPrint) return;
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const h = el.scrollHeight;
      const count = Math.max(1, Math.ceil((h - 5) / A4_H));
      setPageCount(count);
      onPageCountChange?.(count);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [forPrint, cv, custom, onPageCountChange]);

  const style: CSSProperties = {
    width: A4_W,
    minHeight: A4_H,
    fontFamily: font,
    // custom props consumed by template CSS via inline style vars
    ['--accent' as string]: custom.accent,
    ['--line' as string]: String(d.line),
    ['--gap' as string]: `${d.gap}rem`,
    ['--sec' as string]: `${d.section}rem`,
  };

  const Template = TEMPLATE_MAP[custom.template];

  return (
    <div
      ref={forPrint ? undefined : containerRef}
      id={forPrint ? 'print-root' : undefined}
      className={forPrint ? 'cv-paper bg-white text-slate-900' : 'relative cv-paper bg-white text-slate-900 shadow-paper'}
      style={style}
    >
      <Template cv={cv} accent={custom.accent} />

      {/* A4 Page Break guidelines (Screen preview only, NEVER in print/PDF) */}
      {!forPrint && pageCount > 1 && (
        <>
          {Array.from({ length: pageCount - 1 }).map((_, idx) => {
            const pageBreakTop = (idx + 1) * A4_H;
            return (
              <div
                key={idx}
                className="pointer-events-none absolute left-0 right-0 z-30 flex items-center justify-between border-b-2 border-dashed border-red-500/70 px-4 py-1 select-none"
                style={{ top: `${pageBreakTop}px` }}
              >
                <span className="rounded bg-red-600 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm">
                  Akhir Halaman {idx + 1} (Batas A4)
                </span>
                <span className="rounded bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700 shadow-sm dark:bg-red-950 dark:text-red-300">
                  Halaman {idx + 2} dimulai
                </span>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------
function Contact({ cv, mono }: { cv: CVData; mono?: boolean }) {
  const p = cv.personal;
  const items = [
    p.email && { icon: Mail, text: p.email },
    p.phone && { icon: Phone, text: p.phone },
    p.location && { icon: MapPin, text: p.location },
    p.website && { icon: Globe, text: p.website },
    p.linkedin && { icon: Linkedin, text: p.linkedin },
    p.github && { icon: Github, text: p.github },
  ].filter(Boolean) as { icon: typeof Mail; text: string }[];

  return (
    <div className={`flex flex-wrap gap-x-4 gap-y-1 text-[11px] ${mono ? 'font-mono' : ''}`}>
      {items.map((it, i) => (
        <span key={i} className="inline-flex items-center gap-1 text-slate-600">
          <it.icon size={11} /> {it.text}
        </span>
      ))}
    </div>
  );
}

function Avatar({ cv, size = 88 }: { cv: CVData; size?: number }) {
  const p = cv.personal;
  if (!p.showAvatar || !p.avatar) return null;
  return (
    <div
      className="shrink-0 overflow-hidden rounded-full"
      style={{ width: size, height: size, border: '3px solid var(--accent)' }}
    >
      <img
        src={p.avatar}
        alt=""
        className="h-full w-full object-cover"
        style={{ transform: `scale(${p.avatarZoom}) translate(${p.avatarOffsetX}%, ${p.avatarOffsetY}%)` }}
      />
    </div>
  );
}

function SectionTitle({ children, mono }: { children: string; mono?: boolean }) {
  return (
    <h2
      className={`mb-1.5 text-[12px] font-bold uppercase tracking-wider ${mono ? 'font-mono' : ''}`}
      style={{ color: 'var(--accent)' }}
    >
      {children}
    </h2>
  );
}

const dateRange = (a: string, b: string, current: boolean) =>
  [a, current ? 'Present' : b].filter(Boolean).join(' – ');

function Experience({ cv }: { cv: CVData }) {
  const items = cv.experience.filter((e) => e.visible);
  if (!cv.sectionVisibility.experience || !items.length) return null;
  return (
    <section id="cv-section-experience" style={{ marginBottom: 'var(--sec)' }}>
      <SectionTitle>{cv.sectionLabels?.experience || 'Experience'}</SectionTitle>
      <div className="space-y-[var(--gap)]">
        {items.map((e) => (
          <div key={e.id}>
            <div className="flex items-baseline justify-between">
              <span className="text-[13px] font-semibold">{e.role || 'Role'}{e.company && <span className="font-normal text-slate-600"> · {e.company}</span>}</span>
              <span className="text-[10px] text-slate-500">{dateRange(e.startDate, e.endDate, e.current)}</span>
            </div>
            {e.location && <div className="text-[10px] text-slate-500">{e.location}</div>}
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[11.5px] leading-[var(--line)] text-slate-700">
              {e.bullets.filter(Boolean).map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function Projects({ cv }: { cv: CVData }) {
  const items = cv.projects.filter((p) => p.visible);
  if (!cv.sectionVisibility.projects || !items.length) return null;
  return (
    <section id="cv-section-projects" style={{ marginBottom: 'var(--sec)' }}>
      <SectionTitle>{cv.sectionLabels?.projects || 'Projects'}</SectionTitle>
      <div className="space-y-[var(--gap)]">
        {items.map((p) => (
          <div key={p.id}>
            <div className="flex items-baseline gap-2">
              <span className="text-[13px] font-semibold">{p.title || 'Project'}</span>
              {p.link && <span className="inline-flex items-center gap-0.5 text-[10px]" style={{ color: 'var(--accent)' }}><ExternalLink size={9} />{p.link}</span>}
            </div>
            {p.description && <p className="text-[11.5px] leading-[var(--line)] text-slate-700">{p.description}</p>}
            {!!p.tech.length && <p className="mt-0.5 text-[10px] text-slate-500">{p.tech.join(' · ')}</p>}
            {!!p.achievements.length && (
              <ul className="mt-0.5 list-disc pl-4 text-[11px] text-slate-700">
                {p.achievements.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function Education({ cv }: { cv: CVData }) {
  const items = cv.education.filter((e) => e.visible);
  if (!cv.sectionVisibility.education || !items.length) return null;
  return (
    <section id="cv-section-education" style={{ marginBottom: 'var(--sec)' }}>
      <SectionTitle>{cv.sectionLabels?.education || 'Education'}</SectionTitle>
      <div className="space-y-[var(--gap)]">
        {items.map((e) => (
          <div key={e.id} className="flex items-baseline justify-between">
            <div>
              <div className="text-[12.5px] font-semibold">{e.degree} {e.field && `· ${e.field}`}</div>
              <div className="text-[11px] text-slate-600">{e.institution}{e.details && ` — ${e.details}`}</div>
            </div>
            <span className="text-[10px] text-slate-500">{dateRange(e.startDate, e.endDate, false)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Certifications({ cv }: { cv: CVData }) {
  const items = cv.certifications.filter((c) => c.visible);
  if (!cv.sectionVisibility.certifications || !items.length) return null;
  return (
    <section id="cv-section-certifications" style={{ marginBottom: 'var(--sec)' }}>
      <SectionTitle>{cv.sectionLabels?.certifications || 'Certifications'}</SectionTitle>
      <ul className="space-y-0.5 text-[11.5px] text-slate-700">
        {items.map((c) => <li key={c.id}>{c.name}{c.issuer && ` — ${c.issuer}`}{c.date && ` (${c.date})`}</li>)}
      </ul>
    </section>
  );
}

function Honors({ cv }: { cv: CVData }) {
  const items = cv.honors.filter((h) => h.visible);
  if (!cv.sectionVisibility.honors || !items.length) return null;
  return (
    <section id="cv-section-honors" style={{ marginBottom: 'var(--sec)' }}>
      <SectionTitle>{cv.sectionLabels?.honors || 'Honors & Achievements'}</SectionTitle>
      <ul className="space-y-0.5 text-[11.5px] text-slate-700">
        {items.map((h) => <li key={h.id}><span className="font-medium">{h.title}</span>{h.issuer && ` — ${h.issuer}`}{h.date && ` (${h.date})`}{h.description && <span className="text-slate-600"> · {h.description}</span>}</li>)}
      </ul>
    </section>
  );
}

function Skills({ cv }: { cv: CVData }) {
  if (!cv.sectionVisibility.skills || !cv.skills.length) return null;
  return (
    <section id="cv-section-skills" style={{ marginBottom: 'var(--sec)' }}>
      <SectionTitle>{cv.sectionLabels?.skills || 'Skills'}</SectionTitle>
      <div className="space-y-1">
        {cv.skills.map((g) => (
          <div key={g.id} className="text-[11.5px]">
            {g.category && <span className="font-semibold">{g.category}: </span>}
            <span className="text-slate-700">{g.skills.join(', ')}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Summary({ cv }: { cv: CVData }) {
  if (!cv.sectionVisibility.summary || !cv.summary.trim()) return null;
  return (
    <section id="cv-section-summary" style={{ marginBottom: 'var(--sec)' }}>
      <SectionTitle>{cv.sectionLabels?.summary || 'Summary'}</SectionTitle>
      <p className="text-[11.5px] leading-[var(--line)] text-slate-700">{cv.summary}</p>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------
type TplProps = { cv: CVData; accent: string };

function ModernTemplate({ cv }: TplProps) {
  const p = cv.personal;
  return (
    <div className="p-10">
      <header id="cv-section-personal" className="mb-5 flex items-center gap-5 border-b pb-4" style={{ borderColor: 'var(--accent)' }}>
        <Avatar cv={cv} />
        <div>
          <h1 className="text-[26px] font-extrabold leading-tight">{p.fullName || 'Your Name'}</h1>
          <p className="text-[13px] font-medium" style={{ color: 'var(--accent)' }}>{p.title || 'Your professional title'}</p>
          <div className="mt-2"><Contact cv={cv} /></div>
        </div>
      </header>
      <Summary cv={cv} />
      <Experience cv={cv} />
      <Projects cv={cv} />
      <Skills cv={cv} />
      <Education cv={cv} />
      <Certifications cv={cv} />
      <Honors cv={cv} />
    </div>
  );
}

function TechTemplate({ cv }: TplProps) {
  const p = cv.personal;
  return (
    <div className="p-10 font-mono">
      <header id="cv-section-personal" className="mb-4">
        <h1 className="text-[24px] font-bold">{p.fullName || 'Your Name'}</h1>
        <p className="text-[12px]" style={{ color: 'var(--accent)' }}>{p.title || 'Your professional title'}</p>
        <div className="mt-2"><Contact cv={cv} mono /></div>
        <div className="mt-3 h-px w-full" style={{ background: 'var(--accent)' }} />
      </header>
      <Summary cv={cv} />
      <Experience cv={cv} />
      <Projects cv={cv} />
      <Skills cv={cv} />
      <Education cv={cv} />
      <Certifications cv={cv} />
      <Honors cv={cv} />
    </div>
  );
}

function CreativeTemplate({ cv }: TplProps) {
  const p = cv.personal;
  return (
    <div className="flex min-h-full">
      {/* Sidebar */}
      <aside id="cv-section-personal" className="w-[34%] p-6 text-white" style={{ background: 'var(--accent)' }}>
        <div className="flex flex-col items-center text-center">
          {p.showAvatar && p.avatar && (
            <div className="mb-3 h-28 w-28 overflow-hidden rounded-full border-4 border-white/40">
              <img src={p.avatar} alt="" className="h-full w-full object-cover" style={{ transform: `scale(${p.avatarZoom}) translate(${p.avatarOffsetX}%, ${p.avatarOffsetY}%)` }} />
            </div>
          )}
          <h1 className="text-[20px] font-extrabold leading-tight">{p.fullName || 'Your Name'}</h1>
          <p className="text-[11px] opacity-90">{p.title || 'Your title'}</p>
        </div>
        <div className="mt-5 space-y-2 text-[10.5px]">
          {p.email && <div className="flex items-center gap-1.5"><Mail size={11} /> {p.email}</div>}
          {p.phone && <div className="flex items-center gap-1.5"><Phone size={11} /> {p.phone}</div>}
          {p.location && <div className="flex items-center gap-1.5"><MapPin size={11} /> {p.location}</div>}
          {p.website && <div className="flex items-center gap-1.5"><Globe size={11} /> {p.website}</div>}
          {p.linkedin && <div className="flex items-center gap-1.5"><Linkedin size={11} /> {p.linkedin}</div>}
          {p.github && <div className="flex items-center gap-1.5"><Github size={11} /> {p.github}</div>}
        </div>
        {cv.sectionVisibility.skills && !!cv.skills.length && (
          <div className="mt-5">
            <h2 className="mb-1.5 text-[11px] font-bold uppercase tracking-wider">{cv.sectionLabels?.skills || 'Skills'}</h2>
            {cv.skills.map((g) => (
              <div key={g.id} className="mb-1.5 text-[10.5px]">
                <div className="font-semibold">{g.category}</div>
                <div className="opacity-90">{g.skills.join(', ')}</div>
              </div>
            ))}
          </div>
        )}
      </aside>
      {/* Main */}
      <div className="flex-1 p-7">
        <Summary cv={cv} />
        <Experience cv={cv} />
        <Projects cv={cv} />
        <Education cv={cv} />
        <Certifications cv={cv} />
        <Honors cv={cv} />
      </div>
    </div>
  );
}

function ClassicTemplate({ cv }: TplProps) {
  const p = cv.personal;
  return (
    <div className="p-12" style={{ fontFamily: 'Georgia, serif' }}>
      <header id="cv-section-personal" className="mb-5 text-center">
        <h1 className="text-[26px] font-bold">{p.fullName || 'Your Name'}</h1>
        <p className="text-[13px] italic text-slate-700">{p.title || 'Your professional title'}</p>
        <div className="mt-2 flex justify-center"><Contact cv={cv} /></div>
      </header>
      <Summary cv={cv} />
      <Experience cv={cv} />
      <Projects cv={cv} />
      <Education cv={cv} />
      <Skills cv={cv} />
      <Certifications cv={cv} />
      <Honors cv={cv} />
    </div>
  );
}

const TEMPLATE_MAP = {
  modern: ModernTemplate,
  tech: TechTemplate,
  creative: CreativeTemplate,
  classic: ClassicTemplate,
} as const;

export { A4_W, A4_H };
