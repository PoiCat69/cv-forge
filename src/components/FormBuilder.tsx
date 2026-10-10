import { useState } from 'react';
import {
  User, FileText, Briefcase, FolderGit2, GraduationCap, Wrench, Award,
  Sparkles, Trash2, Plus, Wand2, ChevronUp, ChevronDown, Copy, GripVertical,
} from 'lucide-react';
import type {
  CVData, ExperienceItem, ProjectItem, EducationItem, CertificationItem, SkillGroup, HonorItem,
} from '../types/cv';
import { uid } from '../lib/defaults';
import { polishSummary, suggestBullet } from '../lib/polish';
import { AccordionSection, Field, TagInput, AddButton, DateInput, DEFAULT_SKILL_SUGGESTIONS } from './ui';
import { AvatarUploader } from './AvatarUploader';
import { CVScoreWidget } from './CVScoreWidget';

function formatLink(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^(https?:\/\/|mailto:)/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

type SetCV = (updater: (cv: CVData) => CVData) => void;

function reorderList<T>(list: T[], fromIndex: number, toIndex: number): T[] {
  const result = [...list];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}

function duplicateItem<T extends { id: string }>(list: T[], index: number): T[] {
  const item = list[index];
  const copy = { ...item, id: uid() };
  const next = [...list];
  next.splice(index + 1, 0, copy);
  return next;
}

function ItemHeader({
  title,
  index,
  total,
  section,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onRemove,
}: {
  title: string;
  index: number;
  total: number;
  section: string;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-2 mb-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold tracking-[-0.12px] text-[var(--text)]">
        <span
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', JSON.stringify({ section, index }));
            e.dataTransfer.effectAllowed = 'move';
          }}
          title="Seret untuk mengatur urutan"
          aria-label="Seret untuk mengatur urutan"
          className="grid h-6 w-5 place-items-center cursor-grab rounded-control text-[var(--text-muted)] hover:bg-[var(--border-subtle)] hover:text-[var(--text)] active:cursor-grabbing"
        >
          <GripVertical size={13} />
        </span>
        <span>{title} #{index + 1}</span>
      </div>

      <div className="flex items-center gap-0.5">
        <button
          type="button"
          disabled={index === 0}
          onClick={onMoveUp}
          title="Pindahkan ke atas"
          aria-label="Pindahkan ke atas"
          className="grid h-7 w-7 place-items-center rounded-control text-[var(--text-muted)] transition duration-fast ease-standard hover:bg-[var(--border-subtle)] hover:text-[var(--text)] disabled:opacity-20 disabled:pointer-events-none active:scale-[0.95]"
        >
          <ChevronUp size={14} />
        </button>
        <button
          type="button"
          disabled={index === total - 1}
          onClick={onMoveDown}
          title="Pindahkan ke bawah"
          aria-label="Pindahkan ke bawah"
          className="grid h-7 w-7 place-items-center rounded-control text-[var(--text-muted)] transition duration-fast ease-standard hover:bg-[var(--border-subtle)] hover:text-[var(--text)] disabled:opacity-20 disabled:pointer-events-none active:scale-[0.95]"
        >
          <ChevronDown size={14} />
        </button>
        <button
          type="button"
          onClick={onDuplicate}
          title="Duplikat item ini"
          aria-label="Duplikat item"
          className="grid h-7 w-7 place-items-center rounded-control text-[var(--text-muted)] transition duration-fast ease-standard hover:bg-[var(--border-subtle)] hover:text-[var(--text)] active:scale-[0.95]"
        >
          <Copy size={13} />
        </button>
        <button
          type="button"
          onClick={onRemove}
          title="Hapus item ini"
          aria-label="Hapus item"
          className="grid h-7 w-7 place-items-center rounded-control text-red-600 transition duration-fast ease-standard hover:bg-red-500/10 dark:text-red-400 active:scale-[0.95]"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

export function FormBuilder({
  cv,
  setCV,
  accent,
  onDeleteToast,
  onActiveSectionChange,
}: {
  cv: CVData;
  setCV: SetCV;
  accent: string;
  onDeleteToast?: (msg: string) => void;
  onActiveSectionChange?: (section: string) => void;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem('cvforge.accordion.v1');
      if (raw) return JSON.parse(raw);
    } catch {}
    return { personal: true, summary: true, experience: true, projects: true, education: true, skills: true, honors: true };
  });

  const toggle = (k: string) => {
    setOpen((o) => {
      const next = { ...o, [k]: !o[k] };
      try {
        localStorage.setItem('cvforge.accordion.v1', JSON.stringify(next));
      } catch {}
      return next;
    });
    onActiveSectionChange?.(k);
  };

  const expandAll = () => {
    const next = { personal: true, summary: true, experience: true, projects: true, education: true, skills: true, honors: true };
    setOpen(next);
    try { localStorage.setItem('cvforge.accordion.v1', JSON.stringify(next)); } catch {}
  };

  const collapseAll = () => {
    const next = { personal: false, summary: false, experience: false, projects: false, education: false, skills: false, honors: false };
    setOpen(next);
    try { localStorage.setItem('cvforge.accordion.v1', JSON.stringify(next)); } catch {}
  };

  const vis = cv.sectionVisibility;
  const setVis = (k: keyof typeof vis, v: boolean) =>
    setCV((c) => ({ ...c, sectionVisibility: { ...c.sectionVisibility, [k]: v } }));

  return (
    <div className="space-y-6">
      {/* Top Accordion Controls */}
      <div className="flex items-center justify-between pb-1">
        <span className="text-xs font-medium text-[var(--text-muted)]">Formulir Riwayat Hidup</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={expandAll}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--primary)] active:scale-[0.95]"
          >
            Buka Semua
          </button>
          <span className="text-xs text-[var(--border)]">|</span>
          <button
            type="button"
            onClick={collapseAll}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--primary)] active:scale-[0.95]"
          >
            Tutup Semua
          </button>
        </div>
      </div>

      {/* CV Completeness & ATS Heuristics Meter */}
      <CVScoreWidget
        cv={cv}
        onFocusSection={(sec) => {
          if (!open[sec]) toggle(sec);
          onActiveSectionChange?.(sec);
        }}
      />

      {/* 1. Personal + avatar ------------------------------------------------ */}
      <AccordionSection title="Personal Info & Avatar" icon={<User size={18} />} open={!!open.personal} onToggle={() => toggle('personal')}>
        <div className="space-y-4" onFocus={() => onActiveSectionChange?.('personal')}>
          <AvatarUploader
            personal={cv.personal}
            onChange={(patch) => setCV((c) => ({ ...c, personal: { ...c.personal, ...patch } }))}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Full name"><input className="app-input" value={cv.personal.fullName} onChange={(e) => setCV((c) => ({ ...c, personal: { ...c.personal, fullName: e.target.value } }))} placeholder="Jane Doe" /></Field>
            <Field label="Headline / title" hint="A punchy role, e.g. 'Senior Backend Engineer · Payments'"><input className="app-input" value={cv.personal.title} onChange={(e) => setCV((c) => ({ ...c, personal: { ...c.personal, title: e.target.value } }))} placeholder="Senior Software Engineer" /></Field>
            <Field label="Email"><input className="app-input" value={cv.personal.email} onChange={(e) => setCV((c) => ({ ...c, personal: { ...c.personal, email: e.target.value } }))} placeholder="jane@example.com" /></Field>
            <Field label="Phone"><input className="app-input" value={cv.personal.phone} onChange={(e) => setCV((c) => ({ ...c, personal: { ...c.personal, phone: e.target.value } }))} placeholder="+1 555 000 1234" /></Field>
            <Field label="Location"><input className="app-input" value={cv.personal.location} onChange={(e) => setCV((c) => ({ ...c, personal: { ...c.personal, location: e.target.value } }))} placeholder="City, Country" /></Field>
            <Field label="Website"><input className="app-input" value={cv.personal.website} onChange={(e) => setCV((c) => ({ ...c, personal: { ...c.personal, website: e.target.value } }))} onBlur={(e) => setCV((c) => ({ ...c, personal: { ...c.personal, website: formatLink(e.target.value) } }))} placeholder="yoursite.dev" /></Field>
            <Field label="LinkedIn"><input className="app-input" value={cv.personal.linkedin} onChange={(e) => setCV((c) => ({ ...c, personal: { ...c.personal, linkedin: e.target.value } }))} onBlur={(e) => setCV((c) => ({ ...c, personal: { ...c.personal, linkedin: formatLink(e.target.value) } }))} placeholder="linkedin.com/in/you" /></Field>
            <Field label="GitHub"><input className="app-input" value={cv.personal.github} onChange={(e) => setCV((c) => ({ ...c, personal: { ...c.personal, github: e.target.value } }))} onBlur={(e) => setCV((c) => ({ ...c, personal: { ...c.personal, github: formatLink(e.target.value) } }))} placeholder="github.com/you" /></Field>
          </div>
        </div>
      </AccordionSection>

      {/* 2. Summary ---------------------------------------------------------- */}
      <AccordionSection
        title="Professional Summary"
        customTitle={cv.sectionLabels?.summary}
        onCustomTitleChange={(v) => setCV((c) => ({ ...c, sectionLabels: { ...c.sectionLabels, summary: v } }))}
        onResetCustomTitle={() => setCV((c) => ({ ...c, sectionLabels: { ...c.sectionLabels, summary: undefined } }))}
        icon={<FileText size={18} />}
        open={!!open.summary}
        onToggle={() => toggle('summary')}
        visible={vis.summary}
        onVisibleChange={(v) => setVis('summary', v)}
      >
        <div className="space-y-3" onFocus={() => onActiveSectionChange?.('summary')}>
          <Field label="Professional summary" hint="3-4 sentences highlighting impact, domain expertise, and career trajectory">
            <textarea
              className="app-textarea min-h-[96px]"
              value={cv.summary}
              placeholder="Backend engineer with 6+ years designing distributed systems…"
              onChange={(e) => setCV((c) => ({ ...c, summary: e.target.value }))}
            />
          </Field>
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-[var(--text-muted)]">
            <span>
              {cv.summary.trim() ? cv.summary.trim().split(/\s+/).length : 0} kata · {cv.summary.length} karakter{' '}
              <span className={(cv.summary.trim() ? cv.summary.trim().split(/\s+/).length : 0) >= 40 && (cv.summary.trim() ? cv.summary.trim().split(/\s+/).length : 0) <= 80 ? 'font-medium text-emerald-600 dark:text-emerald-400' : ''}>
                (Saran ATS: 40–80 kata)
              </span>
            </span>
            <button
              type="button"
              className="btn btn-outline rounded-pill px-4 py-1.5 text-xs text-[var(--primary)] hover:border-[var(--primary)] active:scale-[0.95]"
              onClick={() => setCV((c) => ({ ...c, summary: polishSummary(c.summary) }))}
            >
              <Sparkles size={14} /> <span>Polish writing</span>
            </button>
          </div>
        </div>
      </AccordionSection>

      {/* 3. Experience ------------------------------------------------------ */}
      <AccordionSection
        title="Work & Leadership Experience"
        customTitle={cv.sectionLabels?.experience}
        onCustomTitleChange={(v) => setCV((c) => ({ ...c, sectionLabels: { ...c.sectionLabels, experience: v } }))}
        onResetCustomTitle={() => setCV((c) => ({ ...c, sectionLabels: { ...c.sectionLabels, experience: undefined } }))}
        icon={<Briefcase size={18} />}
        open={!!open.experience}
        onToggle={() => toggle('experience')}
        visible={vis.experience}
        onVisibleChange={(v) => setVis('experience', v)}
      >
        <div className="space-y-4" onFocus={() => onActiveSectionChange?.('experience')}>
          {cv.experience.map((item, i) => (
            <ExperienceEditor
              key={item.id}
              item={item}
              index={i}
              total={cv.experience.length}
              onChange={(patch) => setCV((c) => ({ ...c, experience: c.experience.map((x) => (x.id === item.id ? { ...x, ...patch } : x)) }))}
              onMoveUp={() => setCV((c) => ({ ...c, experience: reorderList(c.experience, i, i - 1) }))}
              onMoveDown={() => setCV((c) => ({ ...c, experience: reorderList(c.experience, i, i + 1) }))}
              onDuplicate={() => setCV((c) => ({ ...c, experience: duplicateItem(c.experience, i) }))}
              onRemove={() => {
                setCV((c) => ({ ...c, experience: c.experience.filter((x) => x.id !== item.id) }));
                onDeleteToast?.('Pengalaman kerja dihapus');
              }}
              onReorder={(fromIdx, toIdx) => setCV((c) => ({ ...c, experience: reorderList(c.experience, fromIdx, toIdx) }))}
            />
          ))}
          <AddButton label="Add experience" onClick={() => setCV((c) => ({ ...c, experience: [...c.experience, newExperience()] }))} />
        </div>
      </AccordionSection>

      {/* 4. Projects -------------------------------------------------------- */}
      <AccordionSection
        title="Selected Projects"
        customTitle={cv.sectionLabels?.projects}
        onCustomTitleChange={(v) => setCV((c) => ({ ...c, sectionLabels: { ...c.sectionLabels, projects: v } }))}
        onResetCustomTitle={() => setCV((c) => ({ ...c, sectionLabels: { ...c.sectionLabels, projects: undefined } }))}
        icon={<FolderGit2 size={18} />}
        open={!!open.projects}
        onToggle={() => toggle('projects')}
        visible={vis.projects}
        onVisibleChange={(v) => setVis('projects', v)}
      >
        <div className="space-y-4" onFocus={() => onActiveSectionChange?.('projects')}>
          {cv.projects.map((item, i) => (
            <ProjectEditor
              key={item.id}
              item={item}
              index={i}
              total={cv.projects.length}
              accent={accent}
              onChange={(patch) => setCV((c) => ({ ...c, projects: c.projects.map((x) => (x.id === item.id ? { ...x, ...patch } : x)) }))}
              onMoveUp={() => setCV((c) => ({ ...c, projects: reorderList(c.projects, i, i - 1) }))}
              onMoveDown={() => setCV((c) => ({ ...c, projects: reorderList(c.projects, i, i + 1) }))}
              onDuplicate={() => setCV((c) => ({ ...c, projects: duplicateItem(c.projects, i) }))}
              onRemove={() => {
                setCV((c) => ({ ...c, projects: c.projects.filter((x) => x.id !== item.id) }));
                onDeleteToast?.('Proyek dihapus');
              }}
              onReorder={(fromIdx, toIdx) => setCV((c) => ({ ...c, projects: reorderList(c.projects, fromIdx, toIdx) }))}
            />
          ))}
          <AddButton label="Add project" onClick={() => setCV((c) => ({ ...c, projects: [...c.projects, newProject()] }))} />
        </div>
      </AccordionSection>

      {/* 5. Education + Certs ---------------------------------------------- */}
      <AccordionSection
        title="Education & Certifications"
        customTitle={cv.sectionLabels?.education}
        onCustomTitleChange={(v) => setCV((c) => ({ ...c, sectionLabels: { ...c.sectionLabels, education: v } }))}
        onResetCustomTitle={() => setCV((c) => ({ ...c, sectionLabels: { ...c.sectionLabels, education: undefined } }))}
        icon={<GraduationCap size={18} />}
        open={!!open.education}
        onToggle={() => toggle('education')}
        visible={vis.education}
        onVisibleChange={(v) => setVis('education', v)}
      >
        <div className="space-y-4" onFocus={() => onActiveSectionChange?.('education')}>
          {cv.education.map((item, i) => (
            <EducationEditor
              key={item.id}
              item={item}
              index={i}
              total={cv.education.length}
              onChange={(patch) => setCV((c) => ({ ...c, education: c.education.map((x) => (x.id === item.id ? { ...x, ...patch } : x)) }))}
              onMoveUp={() => setCV((c) => ({ ...c, education: reorderList(c.education, i, i - 1) }))}
              onMoveDown={() => setCV((c) => ({ ...c, education: reorderList(c.education, i, i + 1) }))}
              onDuplicate={() => setCV((c) => ({ ...c, education: duplicateItem(c.education, i) }))}
              onRemove={() => {
                setCV((c) => ({ ...c, education: c.education.filter((x) => x.id !== item.id) }));
                onDeleteToast?.('Pendidikan dihapus');
              }}
              onReorder={(fromIdx, toIdx) => setCV((c) => ({ ...c, education: reorderList(c.education, fromIdx, toIdx) }))}
            />
          ))}
          <AddButton label="Add education" onClick={() => setCV((c) => ({ ...c, education: [...c.education, newEducation()] }))} />

          <div className="pt-3">
            <p className="mb-3 text-sm font-semibold tracking-[-0.224px] text-[var(--text)]">Certifications</p>
            <div className="space-y-3">
              {cv.certifications.map((item, i) => (
                <div
                  key={item.id}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                  onDrop={(e) => {
                    e.preventDefault();
                    try {
                      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                      if (data.section === 'cert' && typeof data.index === 'number' && data.index !== i) {
                        setCV((c) => ({ ...c, certifications: reorderList(c.certifications, data.index, i) }));
                      }
                    } catch {}
                  }}
                  className="animate-item-enter rounded-control border border-[var(--border)] bg-[var(--surface-pearl)] p-4"
                >
                  <ItemHeader
                    title="Cert"
                    index={i}
                    total={cv.certifications.length}
                    section="cert"
                    onMoveUp={() => setCV((c) => ({ ...c, certifications: reorderList(c.certifications, i, i - 1) }))}
                    onMoveDown={() => setCV((c) => ({ ...c, certifications: reorderList(c.certifications, i, i + 1) }))}
                    onDuplicate={() => setCV((c) => ({ ...c, certifications: duplicateItem(c.certifications, i) }))}
                    onRemove={() => {
                      setCV((c) => ({ ...c, certifications: c.certifications.filter((x) => x.id !== item.id) }));
                      onDeleteToast?.('Sertifikasi dihapus');
                    }}
                  />
                  <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_1fr_130px]">
                    <input className="app-input" placeholder="Certificate" value={item.name} onChange={(e) => setCV((c) => ({ ...c, certifications: c.certifications.map((x) => (x.id === item.id ? { ...x, name: e.target.value } : x)) }))} />
                    <input className="app-input" placeholder="Issuer" value={item.issuer} onChange={(e) => setCV((c) => ({ ...c, certifications: c.certifications.map((x) => (x.id === item.id ? { ...x, issuer: e.target.value } : x)) }))} />
                    <DateInput placeholder="Year" value={item.date} onChange={(val) => setCV((c) => ({ ...c, certifications: c.certifications.map((x) => (x.id === item.id ? { ...x, date: val } : x)) }))} />
                  </div>
                </div>
              ))}
              <AddButton label="Add certification" onClick={() => setCV((c) => ({ ...c, certifications: [...c.certifications, newCert()] }))} />
            </div>
          </div>
        </div>
      </AccordionSection>

      {/* 6. Skills ---------------------------------------------------------- */}
      <AccordionSection
        title="Technical & Soft Skills"
        customTitle={cv.sectionLabels?.skills}
        onCustomTitleChange={(v) => setCV((c) => ({ ...c, sectionLabels: { ...c.sectionLabels, skills: v } }))}
        onResetCustomTitle={() => setCV((c) => ({ ...c, sectionLabels: { ...c.sectionLabels, skills: undefined } }))}
        icon={<Wrench size={18} />}
        open={!!open.skills}
        onToggle={() => toggle('skills')}
        visible={vis.skills}
        onVisibleChange={(v) => setVis('skills', v)}
      >
        <div className="space-y-4" onFocus={() => onActiveSectionChange?.('skills')}>
          {cv.skills.map((grp, i) => (
            <div
              key={grp.id}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
              onDrop={(e) => {
                e.preventDefault();
                try {
                  const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                  if (data.section === 'skill' && typeof data.index === 'number' && data.index !== i) {
                    setCV((c) => ({ ...c, skills: reorderList(c.skills, data.index, i) }));
                  }
                } catch {}
              }}
              className="animate-item-enter space-y-3 rounded-control border border-[var(--border)] bg-[var(--surface-pearl)] p-4"
            >
              <ItemHeader
                title="Skill Group"
                index={i}
                total={cv.skills.length}
                section="skill"
                onMoveUp={() => setCV((c) => ({ ...c, skills: reorderList(c.skills, i, i - 1) }))}
                onMoveDown={() => setCV((c) => ({ ...c, skills: reorderList(c.skills, i, i + 1) }))}
                onDuplicate={() => setCV((c) => ({ ...c, skills: duplicateItem(c.skills, i) }))}
                onRemove={() => {
                  setCV((c) => ({ ...c, skills: c.skills.filter((x) => x.id !== grp.id) }));
                  onDeleteToast?.('Grup keahlian dihapus');
                }}
              />
              <input className="app-input w-full" placeholder="Category (e.g. Languages, Frontend)" value={grp.category} onChange={(e) => setCV((c) => ({ ...c, skills: c.skills.map((x) => (x.id === grp.id ? { ...x, category: e.target.value } : x)) }))} />
              <TagInput
                values={grp.skills}
                accent={accent}
                suggestions={DEFAULT_SKILL_SUGGESTIONS}
                placeholder="Add skill + Enter (contoh: React, Python)"
                onChange={(skills) => setCV((c) => ({ ...c, skills: c.skills.map((x) => (x.id === grp.id ? { ...x, skills } : x)) }))}
              />
            </div>
          ))}
          <AddButton label="Add skill group" onClick={() => setCV((c) => ({ ...c, skills: [...c.skills, newSkillGroup()] }))} />
        </div>
      </AccordionSection>

      {/* 7. Honors ---------------------------------------------------------- */}
      <AccordionSection
        title="Honors & Achievements"
        customTitle={cv.sectionLabels?.honors}
        onCustomTitleChange={(v) => setCV((c) => ({ ...c, sectionLabels: { ...c.sectionLabels, honors: v } }))}
        onResetCustomTitle={() => setCV((c) => ({ ...c, sectionLabels: { ...c.sectionLabels, honors: undefined } }))}
        icon={<Award size={18} />}
        open={!!open.honors}
        onToggle={() => toggle('honors')}
        visible={vis.honors}
        onVisibleChange={(v) => setVis('honors', v)}
      >
        <div className="space-y-4" onFocus={() => onActiveSectionChange?.('honors')}>
          {cv.honors.map((item, i) => (
            <div
              key={item.id}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
              onDrop={(e) => {
                e.preventDefault();
                try {
                  const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                  if (data.section === 'honor' && typeof data.index === 'number' && data.index !== i) {
                    setCV((c) => ({ ...c, honors: reorderList(c.honors, data.index, i) }));
                  }
                } catch {}
              }}
              className="animate-item-enter space-y-3 rounded-control border border-[var(--border)] bg-[var(--surface-pearl)] p-4"
            >
              <ItemHeader
                title="Honor"
                index={i}
                total={cv.honors.length}
                section="honor"
                onMoveUp={() => setCV((c) => ({ ...c, honors: reorderList(c.honors, i, i - 1) }))}
                onMoveDown={() => setCV((c) => ({ ...c, honors: reorderList(c.honors, i, i + 1) }))}
                onDuplicate={() => setCV((c) => ({ ...c, honors: duplicateItem(c.honors, i) }))}
                onRemove={() => {
                  setCV((c) => ({ ...c, honors: c.honors.filter((x) => x.id !== item.id) }));
                  onDeleteToast?.('Penghargaan dihapus');
                }}
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_130px]">
                <input className="app-input" placeholder="Honor / award" value={item.title} onChange={(e) => setCV((c) => ({ ...c, honors: c.honors.map((x) => (x.id === item.id ? { ...x, title: e.target.value } : x)) }))} />
                <input className="app-input" placeholder="Issuer" value={item.issuer} onChange={(e) => setCV((c) => ({ ...c, honors: c.honors.map((x) => (x.id === item.id ? { ...x, issuer: e.target.value } : x)) }))} />
                <DateInput placeholder="Year" value={item.date} onChange={(val) => setCV((c) => ({ ...c, honors: c.honors.map((x) => (x.id === item.id ? { ...x, date: val } : x)) }))} />
              </div>
              <input className="app-input" placeholder="One-line description (optional)" value={item.description} onChange={(e) => setCV((c) => ({ ...c, honors: c.honors.map((x) => (x.id === item.id ? { ...x, description: e.target.value } : x)) }))} />
            </div>
          ))}
          <AddButton label="Add honor" onClick={() => setCV((c) => ({ ...c, honors: [...c.honors, newHonor()] }))} />
        </div>
      </AccordionSection>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Per-item editors
// ---------------------------------------------------------------------------
function ExperienceEditor({
  item,
  onChange,
  onRemove,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  index,
  total,
  onReorder,
}: {
  item: ExperienceItem;
  onChange: (p: Partial<ExperienceItem>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  index: number;
  total: number;
  onReorder: (from: number, to: number) => void;
}) {
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
      onDrop={(e) => {
        e.preventDefault();
        try {
          const data = JSON.parse(e.dataTransfer.getData('text/plain'));
          if (data.section === 'exp' && typeof data.index === 'number' && data.index !== index) {
            onReorder(data.index, index);
          }
        } catch {}
      }}
      className="animate-item-enter space-y-4 rounded-control border border-[var(--border)] bg-[var(--surface-pearl)] p-4"
    >
      <ItemHeader
        title="Experience"
        index={index}
        total={total}
        section="exp"
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        onDuplicate={onDuplicate}
        onRemove={onRemove}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input className="app-input" placeholder="Role / title" value={item.role} onChange={(e) => onChange({ role: e.target.value })} />
        <input className="app-input" placeholder="Company" value={item.company} onChange={(e) => onChange({ company: e.target.value })} />
        <input className="app-input" placeholder="Location" value={item.location} onChange={(e) => onChange({ location: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <DateInput placeholder="Start date" value={item.startDate} onChange={(val) => onChange({ startDate: val })} />
          <DateInput placeholder="End date" value={item.endDate} disabled={item.current} showPresent={true} onChange={(val) => onChange({ endDate: val })} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-[var(--text)] cursor-pointer">
        <input type="checkbox" checked={item.current} onChange={(e) => onChange({ current: e.target.checked, endDate: e.target.checked ? '' : item.endDate })} className="h-4 w-4 rounded-control accent-[var(--primary)] cursor-pointer" />
        <span>Masih bekerja di sini</span>
      </label>
      <BulletEditor bullets={item.bullets} onChange={(bullets) => onChange({ bullets })} />
    </div>
  );
}

function BulletEditor({ bullets, onChange }: { bullets: string[]; onChange: (b: string[]) => void }) {
  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[var(--text)]">Bullet points</span>
        <span className="text-xs text-[var(--text-muted)]">Tekan Enter untuk baris baru · Tempel multi-baris otomatis terpisah</span>
      </div>
      {bullets.map((b, i) => (
        <div key={i} className="animate-item-enter flex items-start gap-2">
          <textarea
            className="app-textarea min-h-[56px] flex-1 resize-y py-2"
            value={b}
            placeholder="Increased signup conversion by 23% by redesigning onboarding…"
            onChange={(e) => onChange(bullets.map((x, j) => (j === i ? e.target.value : x)))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const next = [...bullets];
                next.splice(i + 1, 0, '');
                onChange(next);
              }
            }}
            onPaste={(e) => {
              const text = e.clipboardData.getData('text');
              if (text.includes('\n') || text.includes('•') || text.includes('- ') || text.includes('* ')) {
                const lines = text
                  .split(/\r?\n/)
                  .map((l) => l.replace(/^[\s•\-\*]+/, '').trim())
                  .filter(Boolean);
                if (lines.length > 1) {
                  e.preventDefault();
                  const next = [...bullets];
                  next.splice(i, 1, ...lines);
                  onChange(next);
                }
              }
            }}
          />
          <div className="flex flex-col gap-2 pt-0.5">
            <button
              type="button"
              title="Suggest XYZ rewrite"
              aria-label="Suggest XYZ rewrite"
              className="btn btn-outline grid h-9 w-9 place-items-center rounded-control text-[var(--primary)] hover:border-[var(--primary)] transition duration-fast ease-standard active:scale-[0.95]"
              onClick={() => onChange(bullets.map((x, j) => (j === i ? suggestBullet(x) : x)))}
            >
              <Wand2 size={14} />
            </button>
            <button
              type="button"
              title="Remove bullet"
              aria-label="Remove bullet"
              className="btn grid h-9 w-9 place-items-center rounded-control text-red-600 transition duration-fast ease-standard hover:bg-red-500/10 dark:text-red-400 active:scale-[0.95]"
              onClick={() => onChange(bullets.filter((_, j) => j !== i))}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        className="btn rounded-pill px-3 py-1.5 text-xs text-[var(--primary)] transition duration-fast ease-standard hover:bg-[var(--border-subtle)] active:scale-[0.95]"
        onClick={() => onChange([...bullets, ''])}
      >
        <Plus size={14} /> <span>Add bullet</span>
      </button>
    </div>
  );
}

function ProjectEditor({
  item,
  onChange,
  onRemove,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  index,
  total,
  accent,
  onReorder,
}: {
  item: ProjectItem;
  onChange: (p: Partial<ProjectItem>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  index: number;
  total: number;
  accent: string;
  onReorder: (from: number, to: number) => void;
}) {
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
      onDrop={(e) => {
        e.preventDefault();
        try {
          const data = JSON.parse(e.dataTransfer.getData('text/plain'));
          if (data.section === 'proj' && typeof data.index === 'number' && data.index !== index) {
            onReorder(data.index, index);
          }
        } catch {}
      }}
      className="animate-item-enter space-y-4 rounded-control border border-[var(--border)] bg-[var(--surface-pearl)] p-4"
    >
      <ItemHeader
        title="Project"
        index={index}
        total={total}
        section="proj"
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        onDuplicate={onDuplicate}
        onRemove={onRemove}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input className="app-input" placeholder="Project title" value={item.title} onChange={(e) => onChange({ title: e.target.value })} />
        <input
          className="app-input"
          placeholder="Demo / repo link"
          value={item.link}
          onChange={(e) => onChange({ link: e.target.value })}
          onBlur={(e) => onChange({ link: formatLink(e.target.value) })}
        />
      </div>
      <input className="app-input" placeholder="One-line description" value={item.description} onChange={(e) => onChange({ description: e.target.value })} />
      <Field label="Tech stack"><TagInput values={item.tech} accent={accent} suggestions={DEFAULT_SKILL_SUGGESTIONS} placeholder="React + Enter" onChange={(tech) => onChange({ tech })} /></Field>
      <Field label="Key achievements"><TagInput values={item.achievements} placeholder="3k stars + Enter" onChange={(achievements) => onChange({ achievements })} /></Field>
    </div>
  );
}

function EducationEditor({
  item,
  onChange,
  onRemove,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  index,
  total,
  onReorder,
}: {
  item: EducationItem;
  onChange: (p: Partial<EducationItem>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  index: number;
  total: number;
  onReorder: (from: number, to: number) => void;
}) {
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
      onDrop={(e) => {
        e.preventDefault();
        try {
          const data = JSON.parse(e.dataTransfer.getData('text/plain'));
          if (data.section === 'edu' && typeof data.index === 'number' && data.index !== index) {
            onReorder(data.index, index);
          }
        } catch {}
      }}
      className="animate-item-enter space-y-3 rounded-control border border-[var(--border)] bg-[var(--surface-pearl)] p-4"
    >
      <ItemHeader
        title="Education"
        index={index}
        total={total}
        section="edu"
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        onDuplicate={onDuplicate}
        onRemove={onRemove}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input className="app-input" placeholder="Institution" value={item.institution} onChange={(e) => onChange({ institution: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <input className="app-input" placeholder="Degree" value={item.degree} onChange={(e) => onChange({ degree: e.target.value })} />
          <input className="app-input" placeholder="Field" value={item.field} onChange={(e) => onChange({ field: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <DateInput placeholder="Start year" value={item.startDate} onChange={(val) => onChange({ startDate: val })} />
          <DateInput placeholder="End year" value={item.endDate} disabled={item.current} showPresent={true} onChange={(val) => onChange({ endDate: val })} />
        </div>
        <input className="app-input" placeholder="Details (GPA, honors)" value={item.details} onChange={(e) => onChange({ details: e.target.value })} />
      </div>
      <label className="flex items-center gap-2 text-sm text-[var(--text)] cursor-pointer">
        <input
          type="checkbox"
          checked={!!item.current}
          onChange={(e) => onChange({ current: e.target.checked, endDate: e.target.checked ? '' : item.endDate })}
          className="h-4 w-4 rounded-control accent-[var(--primary)] cursor-pointer"
        />
        <span>Masih studi di sini</span>
      </label>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------
const newExperience = (): ExperienceItem => ({ id: uid(), company: '', role: '', location: '', startDate: '', endDate: '', current: false, bullets: [''], visible: true });
const newProject = (): ProjectItem => ({ id: uid(), title: '', tech: [], link: '', description: '', achievements: [], visible: true });
const newEducation = (): EducationItem => ({ id: uid(), institution: '', degree: '', field: '', startDate: '', endDate: '', current: false, details: '', visible: true });
const newCert = (): CertificationItem => ({ id: uid(), name: '', issuer: '', date: '', visible: true });
const newSkillGroup = (): SkillGroup => ({ id: uid(), category: '', skills: [] });
const newHonor = (): HonorItem => ({ id: uid(), title: '', issuer: '', date: '', description: '', visible: true });
