import { useState, type ReactNode } from 'react';
import { ChevronDown, Info, X, Plus } from 'lucide-react';

// --------------------------------------------------------------------------
// Field with optional guidance tooltip
// --------------------------------------------------------------------------
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-semibold tracking-[-0.224px] text-[var(--text)]">
        <span>{label}</span>
        {hint && (
          <span className="group relative inline-flex items-center">
            <Info size={14} className="cursor-help text-[var(--text-muted)] transition-colors duration-base ease-standard hover:text-[var(--primary)]" />
            <span
              role="tooltip"
              className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-56 -translate-x-1/2 rounded-control border border-[var(--border)] bg-[var(--surface)] p-3 text-xs font-normal leading-normal text-[var(--text)] opacity-0 transition-opacity duration-base ease-standard group-hover:opacity-100 group-focus-within:opacity-100"
            >
              {hint}
            </span>
          </span>
        )}
      </span>
      {children}
    </label>
  );
}

// --------------------------------------------------------------------------
// Tag / pill creator (Input control: radius 8px, tags: radius pill 9999px)
// --------------------------------------------------------------------------
export function TagInput({
  values,
  onChange,
  placeholder = 'Type and press Enter',
  accent,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  accent?: string;
}) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const v = draft.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setDraft('');
  };

  return (
    <div
      className="flex min-h-[44px] flex-wrap items-center gap-2 rounded-control border border-[var(--border)] bg-[var(--surface)] p-2 transition-colors duration-base ease-standard focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary-focus)]"
    >
      {values.map((v) => (
        <span
          key={v}
          className="chip"
          style={{
            background: accent ? `${accent}18` : 'var(--border-subtle)',
            color: accent ?? 'var(--text)',
            border: `1px solid ${accent ? `${accent}40` : 'var(--border)'}`,
          }}
        >
          <span>{v}</span>
          <button
            type="button"
            onClick={() => onChange(values.filter((x) => x !== v))}
            aria-label={`Remove ${v}`}
            className="grid h-4 w-4 place-items-center rounded-pill opacity-70 transition duration-fast ease-standard hover:opacity-100 active:scale-[0.95]"
          >
            <X size={11} />
          </button>
        </span>
      ))}
      <div className="flex min-w-[140px] flex-1 items-center px-1">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            } else if (e.key === 'Backspace' && !draft && values.length) {
              onChange(values.slice(0, -1));
            }
          }}
          placeholder={placeholder}
          className="w-full bg-transparent text-base leading-normal outline-none text-[var(--text)] placeholder:text-[var(--text-muted)]"
        />
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Accordion section (Store Utility Card: radius-card 12px, padding 16-24px)
// --------------------------------------------------------------------------
export function AccordionSection({
  title,
  icon,
  open,
  onToggle,
  visible,
  onVisibleChange,
  children,
}: {
  title: string;
  icon: ReactNode;
  open: boolean;
  onToggle: () => void;
  visible?: boolean;
  onVisibleChange?: (v: boolean) => void;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-card border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={onToggle}
          className="flex flex-1 items-center gap-2 text-left transition duration-fast ease-standard active:scale-[0.98]"
        >
          <span className="text-[var(--text-muted)]">{icon}</span>
          <span className="text-lg font-semibold tracking-[-0.374px] text-[var(--text)]">{title}</span>
        </button>
        <div className="flex items-center gap-2">
          {onVisibleChange && (
            <Toggle
              checked={visible ?? true}
              onChange={onVisibleChange}
              srLabel={`Toggle ${title} section`}
            />
          )}
          <button
            type="button"
            onClick={onToggle}
            aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
            className="grid h-10 w-10 place-items-center rounded-control text-[var(--text-muted)] transition duration-fast ease-standard hover:bg-[var(--border-subtle)] active:scale-[0.95]"
          >
            <ChevronDown
              size={18}
              className="transition-transform duration-base ease-standard"
              style={{ transform: open ? 'rotate(180deg)' : 'none' }}
            />
          </button>
        </div>
      </div>
      {open && (
        <div className="animate-dropdown-enter border-t border-[var(--border)] p-4 sm:p-6">
          {children}
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
// Toggle switch (radius-pill / kontrol 44px hit-box)
// --------------------------------------------------------------------------
export function Toggle({
  checked,
  onChange,
  srLabel,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  srLabel: string;
}) {
  return (
    <div className="flex items-center justify-center min-h-[44px] min-w-[44px]">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={srLabel}
        onClick={() => onChange(!checked)}
        className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-pill p-0.5 transition-colors duration-base ease-standard active:scale-[0.95]"
        style={{
          background: checked ? 'var(--primary)' : 'var(--border)',
        }}
      >
        <span
          className="h-5 w-5 rounded-pill bg-white transition-transform duration-base ease-standard"
          style={{
            transform: checked ? 'translateX(20px)' : 'translateX(0)',
          }}
        />
      </button>
    </div>
  );
}

// --------------------------------------------------------------------------
// "Add item" button (Pill / aksi sekunder)
// --------------------------------------------------------------------------
export function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn btn-outline min-h-[40px] w-full rounded-pill border border-dashed border-[var(--border)] text-sm text-[var(--primary)] transition duration-fast ease-standard hover:border-[var(--primary)] hover:bg-[var(--surface-pearl)] active:scale-[0.95]"
    >
      <Plus size={16} />
      <span>{label}</span>
    </button>
  );
}
