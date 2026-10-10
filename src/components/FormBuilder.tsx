import { useState } from 'react';
import {
  User, FileText, Briefcase, FolderGit2, GraduationCap, Wrench, Award,
  Sparkles, Trash2, Plus, Wand2,
} from 'lucide-react';
import type {
  CVData, ExperienceItem, ProjectItem, EducationItem, CertificationItem, SkillGroup, HonorItem,
} from '../types/cv';
import { uid } from '../lib/defaults';
import { polishSummary, suggestBullet } from '../lib/polish';
import { AccordionSection, Field, TagInput, AddButton } from './ui';
import { AvatarUploader } from './AvatarUploader';

type SetCV = (updater: (cv: CVData) => CVData) => void;

export function FormBuilder({
  cv,
  setCV,
  accent,
  onDeleteToast,
}: {
  cv: CVData;
  setCV: SetCV;
  accent: string;
  onDeleteToast?: (msg: string) => void;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({ personal: true, summary: true });
  const toggle = (k: string) => setOpen((o) => ({ ...o, [k]: !o[k] }));
  const vis = cv.sectionVisibility;
  const setVis = (k: keyof typeof vis, v: boolean) =>
    setCV((c) => ({ ...c, sectionVisibility: { ...c.sectionVisibility, [k]: v } }));

  return (
    <div className="space-y-6">
      {/* 1. Personal + avatar ------------------------------------------------ */}
      <AccordionSection title="Personal Info & Avatar" icon={<User size={18} />} open={!!open.personal} onToggle={() => toggle('personal')}>
        <div className="space-y-4">
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
            <Field label="Website"><input className="app-input" value={cv.personal.website} onChange={(e) => setCV((c) => ({ ...c, personal: { ...c.personal, website: e.target.value } }))} placeholder="yoursite.dev" /></Field>
            <Field label="LinkedIn"><input className="app-input" value={cv.personal.linkedin} onChange={(e) => setCV((c) => ({ ...c, personal: { ...c.personal, linkedin: e.target.value } }))} placeholder="linkedin.com/in/you" /></Field>
            <Field label="GitHub"><input className="app-input" value={cv.personal.github} onChange={(e) => setCV((c) => ({ ...c, personal: { ...c.personal, github: e.target.value } }))} placeholder="github.com/you" /></Field>
          </div>
        </div>
      </AccordionSection>

      {/* 2. Summary --------------------------------------------------------- */}
      <AccordionSection title="Professional Summary" icon={<FileText size={18} />} open={!!open.summary} onToggle={() => toggle('summary')} visible={vis.summary} onVisibleChange={(v) => setVis('summary', v)}>
        <Field label="Summary" hint="2–3 sentences. Lead with impact and quantify, e.g. 'cut load time 40%'.">
          <textarea
            className="app-textarea min-h-[108px] resize-y"
            value={cv.summary}
            onChange={(e) => setCV((c) => ({ ...c, summary: e.target.value }))}
            placeholder="Full-stack engineer with 5+ years building…"
          />
        </Field>
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            className="btn btn-outline rounded-pill text-sm text-[var(--primary)] hover:border-[var(--primary)] hover:bg-[var(--surface-pearl)] active:scale-[0.95]"
            onClick={() => setCV((c) => ({ ...c, summary: polishSummary(c.summary) }))}
          >
            <Sparkles size={14} /> <span>Polish writing</span>
          </button>
        </div>
      </AccordionSection>

      {/* 3. Experience ------------------------------------------------------ */}
      <AccordionSection title="Work & Leadership Experience" icon={<Briefcase size={18} />} open={!!open.experience} onToggle={() => toggle('experience')} visible={vis.experience} onVisibleChange={(v) => setVis('experience', v)}>
        <div className="space-y-4">
          {cv.experience.map((item, i) => (
            <ExperienceEditor
              key={item.id}
              item={item}
              onChange={(patch) => setCV((c) => ({ ...c, experience: c.experience.map((x) => (x.id === item.id ? { ...x, ...patch } : x)) }))}
              onRemove={() => {
                setCV((c) => ({ ...c, experience: c.experience.filter((x) => x.id !== item.id) }));
                onDeleteToast?.('Pengalaman kerja dihapus');
              }}
              index={i}
            />
          ))}
          <AddButton label="Add experience" onClick={() => setCV((c) => ({ ...c, experience: [...c.experience, newExperience()] }))} />
        </div>
      </AccordionSection>

      {/* 4. Projects -------------------------------------------------------- */}
      <AccordionSection title="Selected Projects" icon={<FolderGit2 size={18} />} open={!!open.projects} onToggle={() => toggle('projects')} visible={vis.projects} onVisibleChange={(v) => setVis('projects', v)}>
        <div className="space-y-4">
          {cv.projects.map((item) => (
            <ProjectEditor
              key={item.id}
              item={item}
              accent={accent}
              onChange={(patch) => setCV((c) => ({ ...c, projects: c.projects.map((x) => (x.id === item.id ? { ...x, ...patch } : x)) }))}
              onRemove={() => {
                setCV((c) => ({ ...c, projects: c.projects.filter((x) => x.id !== item.id) }));
                onDeleteToast?.('Proyek dihapus');
              }}
            />
          ))}
          <AddButton label="Add project" onClick={() => setCV((c) => ({ ...c, projects: [...c.projects, newProject()] }))} />
        </div>
      </AccordionSection>

      {/* 5. Education + Certs ---------------------------------------------- */}
      <AccordionSection title="Education & Certifications" icon={<GraduationCap size={18} />} open={!!open.education} onToggle={() => toggle('education')} visible={vis.education} onVisibleChange={(v) => setVis('education', v)}>
        <div className="space-y-4">
          {cv.education.map((item) => (
            <EducationEditor
              key={item.id}
              item={item}
              onChange={(patch) => setCV((c) => ({ ...c, education: c.education.map((x) => (x.id === item.id ? { ...x, ...patch } : x)) }))}
              onRemove={() => {
                setCV((c) => ({ ...c, education: c.education.filter((x) => x.id !== item.id) }));
                onDeleteToast?.('Pendidikan dihapus');
              }}
            />
          ))}
          <AddButton label="Add education" onClick={() => setCV((c) => ({ ...c, education: [...c.education, newEducation()] }))} />

          <div className="pt-3">
            <p className="mb-3 text-sm font-semibold tracking-[-0.224px] text-[var(--text)]">Certifications</p>
            <div className="space-y-3">
              {cv.certifications.map((item) => (
                <div key={item.id} className="animate-item-enter grid grid-cols-1 items-center gap-3 rounded-control border border-[var(--border)] bg-[var(--surface-pearl)] p-4 sm:grid-cols-[1fr_1fr_96px_auto]">
                  <input className="app-input" placeholder="Certificate" value={item.name} onChange={(e) => setCV((c) => ({ ...c, certifications: c.certifications.map((x) => (x.id === item.id ? { ...x, name: e.target.value } : x)) }))} />
                  <input className="app-input" placeholder="Issuer" value={item.issuer} onChange={(e) => setCV((c) => ({ ...c, certifications: c.certifications.map((x) => (x.id === item.id ? { ...x, issuer: e.target.value } : x)) }))} />
                  <input className="app-input" placeholder="Year" value={item.date} onChange={(e) => setCV((c) => ({ ...c, certifications: c.certifications.map((x) => (x.id === item.id ? { ...x, date: e.target.value } : x)) }))} />
                  <button type="button" aria-label="Remove certification" className="btn grid h-10 w-10 place-items-center rounded-control text-red-600 transition duration-fast ease-standard hover:bg-red-500/10 dark:text-red-400 active:scale-[0.95]" onClick={() => {
                    setCV((c) => ({ ...c, certifications: c.certifications.filter((x) => x.id !== item.id) }));
                    onDeleteToast?.('Sertifikasi dihapus');
                  }}><Trash2 size={15} /></button>
                </div>
              ))}
              <AddButton label="Add certification" onClick={() => setCV((c) => ({ ...c, certifications: [...c.certifications, newCert()] }))} />
            </div>
          </div>
        </div>
      </AccordionSection>

      {/* 6. Skills ---------------------------------------------------------- */}
      <AccordionSection title="Technical & Soft Skills" icon={<Wrench size={18} />} open={!!open.skills} onToggle={() => toggle('skills')} visible={vis.skills} onVisibleChange={(v) => setVis('skills', v)}>
        <div className="space-y-4">
          {cv.skills.map((grp) => (
            <div key={grp.id} className="animate-item-enter space-y-3 rounded-control border border-[var(--border)] bg-[var(--surface-pearl)] p-4">
              <div className="flex items-center gap-2">
                <input className="app-input flex-1" placeholder="Category (e.g. Languages)" value={grp.category} onChange={(e) => setCV((c) => ({ ...c, skills: c.skills.map((x) => (x.id === grp.id ? { ...x, category: e.target.value } : x)) }))} />
                <button type="button" aria-label="Remove skill group" className="btn grid h-10 w-10 place-items-center rounded-control text-red-600 transition duration-fast ease-standard hover:bg-red-500/10 dark:text-red-400 active:scale-[0.95]" onClick={() => {
                  setCV((c) => ({ ...c, skills: c.skills.filter((x) => x.id !== grp.id) }));
                  onDeleteToast?.('Grup keahlian dihapus');
                }}><Trash2 size={15} /></button>
              </div>
              <TagInput
                values={grp.skills}
                accent={accent}
                placeholder="Add skill + Enter"
                onChange={(skills) => setCV((c) => ({ ...c, skills: c.skills.map((x) => (x.id === grp.id ? { ...x, skills } : x)) }))}
              />
            </div>
          ))}
          <AddButton label="Add skill group" onClick={() => setCV((c) => ({ ...c, skills: [...c.skills, newSkillGroup()] }))} />
        </div>
      </AccordionSection>

      {/* 7. Honors ---------------------------------------------------------- */}
      <AccordionSection title="Honors & Achievements" icon={<Award size={18} />} open={!!open.honors} onToggle={() => toggle('honors')} visible={vis.honors} onVisibleChange={(v) => setVis('honors', v)}>
        <div className="space-y-4">
          {cv.honors.map((item) => (
            <div key={item.id} className="animate-item-enter space-y-3 rounded-control border border-[var(--border)] bg-[var(--surface-pearl)] p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_96px]">
                <input className="app-input" placeholder="Honor / award" value={item.title} onChange={(e) => setCV((c) => ({ ...c, honors: c.honors.map((x) => (x.id === item.id ? { ...x, title: e.target.value } : x)) }))} />
                <input className="app-input" placeholder="Issuer" value={item.issuer} onChange={(e) => setCV((c) => ({ ...c, honors: c.honors.map((x) => (x.id === item.id ? { ...x, issuer: e.target.value } : x)) }))} />
                <input className="app-input" placeholder="Year" value={item.date} onChange={(e) => setCV((c) => ({ ...c, honors: c.honors.map((x) => (x.id === item.id ? { ...x, date: e.target.value } : x)) }))} />
              </div>
              <input className="app-input" placeholder="One-line description (optional)" value={item.description} onChange={(e) => setCV((c) => ({ ...c, honors: c.honors.map((x) => (x.id === item.id ? { ...x, description: e.target.value } : x)) }))} />
              <div className="flex justify-end">
                <button type="button" className="btn rounded-pill px-3 py-1.5 text-xs text-red-600 transition duration-fast ease-standard hover:bg-red-500/10 dark:text-red-400 active:scale-[0.95]" onClick={() => {
                  setCV((c) => ({ ...c, honors: c.honors.filter((x) => x.id !== item.id) }));
                  onDeleteToast?.('Penghargaan dihapus');
                }}><Trash2 size={14} /> Remove honor</button>
              </div>
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
function ExperienceEditor({ item, onChange, onRemove, index }: { item: ExperienceItem; onChange: (p: Partial<ExperienceItem>) => void; onRemove: () => void; index: number; }) {
  return (
    <div className="animate-item-enter space-y-4 rounded-control border border-[var(--border)] bg-[var(--surface-pearl)] p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold tracking-[-0.224px] text-[var(--text)]">Experience #{index + 1}</span>
        <button type="button" aria-label="Remove experience" className="btn grid h-9 w-9 place-items-center rounded-control text-red-600 transition duration-fast ease-standard hover:bg-red-500/10 dark:text-red-400 active:scale-[0.95]" onClick={onRemove}><Trash2 size={15} /></button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input className="app-input" placeholder="Role / title" value={item.role} onChange={(e) => onChange({ role: e.target.value })} />
        <input className="app-input" placeholder="Company" value={item.company} onChange={(e) => onChange({ company: e.target.value })} />
        <input className="app-input" placeholder="Location" value={item.location} onChange={(e) => onChange({ location: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <input className="app-input" placeholder="Start date" value={item.startDate} onChange={(e) => onChange({ startDate: e.target.value })} />
          <input className="app-input" placeholder="End date" value={item.endDate} disabled={item.current} onChange={(e) => onChange({ endDate: e.target.value })} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-[var(--text)] cursor-pointer">
        <input type="checkbox" checked={item.current} onChange={(e) => onChange({ current: e.target.checked, endDate: e.target.checked ? '' : item.endDate })} className="h-4 w-4 rounded-control accent-[var(--primary)] cursor-pointer" />
        <span>I currently work here</span>
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
        <span className="text-xs text-[var(--text-muted)]">XYZ formula: Accomplished [X] by doing [Z]</span>
      </div>
      {bullets.map((b, i) => (
        <div key={i} className="animate-item-enter flex items-start gap-2">
          <textarea
            className="app-textarea min-h-[56px] flex-1 resize-y py-2"
            value={b}
            placeholder="Increased signup conversion by 23% by redesigning onboarding…"
            onChange={(e) => onChange(bullets.map((x, j) => (j === i ? e.target.value : x)))}
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

function ProjectEditor({ item, onChange, onRemove, accent }: { item: ProjectItem; onChange: (p: Partial<ProjectItem>) => void; onRemove: () => void; accent: string; }) {
  return (
    <div className="animate-item-enter space-y-4 rounded-control border border-[var(--border)] bg-[var(--surface-pearl)] p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input className="app-input" placeholder="Project title" value={item.title} onChange={(e) => onChange({ title: e.target.value })} />
        <input className="app-input" placeholder="Demo / repo link" value={item.link} onChange={(e) => onChange({ link: e.target.value })} />
      </div>
      <input className="app-input" placeholder="One-line description" value={item.description} onChange={(e) => onChange({ description: e.target.value })} />
      <Field label="Tech stack"><TagInput values={item.tech} accent={accent} placeholder="React + Enter" onChange={(tech) => onChange({ tech })} /></Field>
      <Field label="Key achievements"><TagInput values={item.achievements} placeholder="3k stars + Enter" onChange={(achievements) => onChange({ achievements })} /></Field>
      <div className="flex justify-end">
        <button type="button" className="btn rounded-pill px-3 py-1.5 text-xs text-red-600 transition duration-fast ease-standard hover:bg-red-500/10 dark:text-red-400 active:scale-[0.95]" onClick={onRemove}><Trash2 size={14} /> Remove project</button>
      </div>
    </div>
  );
}

function EducationEditor({ item, onChange, onRemove }: { item: EducationItem; onChange: (p: Partial<EducationItem>) => void; onRemove: () => void; }) {
  return (
    <div className="animate-item-enter space-y-3 rounded-control border border-[var(--border)] bg-[var(--surface-pearl)] p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input className="app-input" placeholder="Institution" value={item.institution} onChange={(e) => onChange({ institution: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <input className="app-input" placeholder="Degree" value={item.degree} onChange={(e) => onChange({ degree: e.target.value })} />
          <input className="app-input" placeholder="Field" value={item.field} onChange={(e) => onChange({ field: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input className="app-input" placeholder="Start year" value={item.startDate} onChange={(e) => onChange({ startDate: e.target.value })} />
          <input className="app-input" placeholder="End year" value={item.endDate} onChange={(e) => onChange({ endDate: e.target.value })} />
        </div>
        <input className="app-input" placeholder="Details (GPA, honors)" value={item.details} onChange={(e) => onChange({ details: e.target.value })} />
      </div>
      <div className="flex justify-end">
        <button type="button" className="btn rounded-pill px-3 py-1.5 text-xs text-red-600 transition duration-fast ease-standard hover:bg-red-500/10 dark:text-red-400 active:scale-[0.95]" onClick={onRemove}><Trash2 size={14} /> Remove</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------
const newExperience = (): ExperienceItem => ({ id: uid(), company: '', role: '', location: '', startDate: '', endDate: '', current: false, bullets: [''], visible: true });
const newProject = (): ProjectItem => ({ id: uid(), title: '', tech: [], link: '', description: '', achievements: [], visible: true });
const newEducation = (): EducationItem => ({ id: uid(), institution: '', degree: '', field: '', startDate: '', endDate: '', details: '', visible: true });
const newCert = (): CertificationItem => ({ id: uid(), name: '', issuer: '', date: '', visible: true });
const newSkillGroup = (): SkillGroup => ({ id: uid(), category: '', skills: [] });
const newHonor = (): HonorItem => ({ id: uid(), title: '', issuer: '', date: '', description: '', visible: true });

