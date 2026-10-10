import { Pipette } from 'lucide-react';
import { TEMPLATES, FONTS, ACCENT_PRESETS } from '../types/cv';
import type { Customization, Density, FontId, TemplateId } from '../types/cv';

export function Customizer({
  custom,
  onChange,
}: {
  custom: Customization;
  onChange: (patch: Partial<Customization>) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Template */}
      <div>
        <p className="mb-2 text-sm font-semibold tracking-[-0.224px] text-[var(--text)]">Template</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {TEMPLATES.map((t) => {
            const active = custom.template === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onChange({ template: t.id as TemplateId })}
                className={`relative flex flex-col items-start rounded-control p-4 text-left transition duration-base ease-standard active:scale-[0.95] ${
                  active
                    ? 'border-2 border-[var(--primary)] bg-[var(--surface-pearl)]'
                    : 'border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--text-muted)]'
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-sm font-semibold tracking-[-0.224px] text-[var(--text)]">{t.name}</span>
                  {active && (
                    <span className="h-2 w-2 rounded-pill bg-[var(--primary)]" />
                  )}
                </div>
                <span className="mt-1 text-xs leading-normal text-[var(--text-muted)]">{t.blurb}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Accent */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold tracking-[-0.224px] text-[var(--text)]">Accent color</p>
          <span className="text-xs font-mono text-[var(--text-muted)]">{custom.accent}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {ACCENT_PRESETS.map((c) => {
            const isSelected = custom.accent.toLowerCase() === c.toLowerCase();
            return (
              <button
                key={c}
                type="button"
                aria-label={`Select accent color ${c}`}
                onClick={() => onChange({ accent: c })}
                className="relative h-7 w-7 rounded-pill transition duration-base ease-standard active:scale-[0.95]"
                style={{
                  background: c,
                  boxShadow: isSelected
                    ? `0 0 0 2px var(--surface), 0 0 0 4px var(--primary)`
                    : 'inset 0 0 0 1px rgba(0,0,0,0.1)',
                }}
              />
            );
          })}
          <label
            title="Custom color"
            className="group relative flex h-7 w-7 cursor-pointer items-center justify-center overflow-hidden rounded-pill border border-[var(--border)] bg-[var(--surface-pearl)] transition duration-base ease-standard hover:border-[var(--primary)] active:scale-[0.95]"
          >
            <Pipette size={13} className="text-[var(--text-muted)] group-hover:text-[var(--primary)]" />
            <input
              type="color"
              aria-label="Custom color picker"
              value={custom.accent}
              onChange={(e) => onChange({ accent: e.target.value })}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </label>
        </div>
      </div>

      {/* Font */}
      <div>
        <p className="mb-2 text-sm font-semibold tracking-[-0.224px] text-[var(--text)]">Typography</p>
        <div className="grid grid-cols-3 gap-2">
          {FONTS.map((f) => {
            const isSelected = custom.font === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onChange({ font: f.id as FontId })}
                className={`rounded-pill px-3 py-2 text-center text-xs transition duration-base ease-standard active:scale-[0.95] ${
                  isSelected
                    ? 'border-2 border-[var(--primary)] bg-[var(--surface-pearl)] font-semibold text-[var(--text)]'
                    : 'border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
                style={{ fontFamily: f.stack }}
              >
                {f.name.split(' ')[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Density */}
      <div>
        <p className="mb-2 text-sm font-semibold tracking-[-0.224px] text-[var(--text)]">Spacing density</p>
        <div className="grid grid-cols-3 gap-2">
          {(['compact', 'normal', 'relaxed'] as Density[]).map((den) => {
            const isSelected = custom.density === den;
            return (
              <button
                key={den}
                type="button"
                onClick={() => onChange({ density: den })}
                className={`rounded-pill px-3 py-2 text-center text-xs capitalize transition duration-base ease-standard active:scale-[0.95] ${
                  isSelected
                    ? 'border-2 border-[var(--primary)] bg-[var(--surface-pearl)] font-semibold text-[var(--text)]'
                    : 'border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                {den}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
