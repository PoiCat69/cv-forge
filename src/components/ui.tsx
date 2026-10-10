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
      <span className="mb-1 flex items-center gap-1.5 text-xs font-semibold app-muted">
        {label}
        {hint && (
          <span className="group relative inline-flex">
            <Info size={13} className="cursor-help opacity-70" />
            <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 w-52 -translate-x-1/2 rounded-md border p-2 text-[11px] font-normal leading-snug opacity-0 shadow-lg transition group-hover:opacity-100 app-surface">
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
// Tag / pill creator
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
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border p-2 app-surface" style={{ borderColor: 'var(--border)' }}>
      {values.map((v) => (
        <span
          key={v}
          className="chip"
          style={{
            background: accent ? `${accent}1a` : 'var(--surface-2)',
            color: accent ?? 'var(--text)',
          }}
        >
          {v}
          <button type="button" onClick={() => onChange(values.filter((x) => x !== v))} aria-label={`Remove ${v}`}>
            <X size={12} />
          </button>
        </span>
      ))}
      <div className="flex min-w-[120px] flex-1 items-center">
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
          className="w-full bg-transparent text-sm outline-none"
          style={{ color: 'var(--text)' }}
        />
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Accordion section
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
    <div className="overflow-hidden rounded-xl border app-surface" style={{ borderColor: 'var(--border)' }}>
      <div className="flex items-center pr-2">
        <button
          type="button"
          onClick={onToggle}
          className="flex flex-1 items-center gap-2.5 py-3 pl-4 pr-2 text-left"
        >
          <span className="app-muted">{icon}</span>
          <span className="text-sm font-semibold">{title}</span>
        </button>
        <div className="flex items-center gap-3">
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
            aria-label={open ? 'Collapse section' : 'Expand section'}
            className="btn btn-ghost grid h-7 w-7 place-items-center p-0"
          >
            <ChevronDown
              size={18}
              className="app-muted transition-transform"
              style={{ transform: open ? 'rotate(180deg)' : 'none' }}
            />
          </button>
        </div>
      </div>
      {open && <div className="animate-fade-in border-t px-4 py-4" style={{ borderColor: 'var(--border)' }}>{children}</div>}
    </div>
  );
}

// --------------------------------------------------------------------------
// Toggle switch
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
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={srLabel}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full px-0.5 transition-colors"
      style={{ background: checked ? 'var(--ring)' : 'var(--border)' }}
    >
      <span
        className="h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200"
        style={{ transform: checked ? 'translateX(16px)' : 'translateX(0)' }}
      />
    </button>
  );
}

// --------------------------------------------------------------------------
// "Add item" button
// --------------------------------------------------------------------------
export function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn btn-outline w-full border-dashed"
      style={{ borderColor: 'var(--border)' }}
    >
      <Plus size={16} />
      {label}
    </button>
  );
}
