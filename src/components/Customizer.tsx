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
    <div className="space-y-4">
      {/* Template */}
      <div>
        <p className="mb-2 text-xs font-semibold app-muted">Template</p>
        <div className="grid grid-cols-2 gap-2">
          {TEMPLATES.map((t) => {
            const active = custom.template === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onChange({ template: t.id as TemplateId })}
                className="rounded-lg border p-2.5 text-left transition"
                style={{
                  borderColor: active ? custom.accent : 'var(--border)',
                  background: active ? `${custom.accent}14` : 'var(--surface)',
                  boxShadow: active ? `0 0 0 1px ${custom.accent}` : 'none',
                }}
              >
                <div className="text-[12px] font-semibold">{t.name}</div>
                <div className="text-[10px] app-muted">{t.blurb}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Accent */}
      <div>
        <p className="mb-2 text-xs font-semibold app-muted">Accent color</p>
        <div className="flex flex-wrap items-center gap-2">
          {ACCENT_PRESETS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Accent ${c}`}
              onClick={() => onChange({ accent: c })}
              className="h-6 w-6 rounded-full transition"
              style={{ background: c, boxShadow: custom.accent === c ? `0 0 0 2px var(--surface), 0 0 0 4px ${c}` : 'none' }}
            />
          ))}
          <label className="relative h-6 w-6 cursor-pointer overflow-hidden rounded-full border" style={{ borderColor: 'var(--border)' }}>
            <input type="color" value={custom.accent} onChange={(e) => onChange({ accent: e.target.value })} className="absolute -left-1 -top-1 h-8 w-8 cursor-pointer" />
          </label>
        </div>
      </div>

      {/* Font */}
      <div>
        <p className="mb-2 text-xs font-semibold app-muted">Font</p>
        <div className="grid grid-cols-3 gap-2">
          {FONTS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onChange({ font: f.id as FontId })}
              className="rounded-lg border px-2 py-2 text-[11px] transition"
              style={{
                fontFamily: f.stack,
                borderColor: custom.font === f.id ? custom.accent : 'var(--border)',
                background: custom.font === f.id ? `${custom.accent}14` : 'var(--surface)',
              }}
            >
              {f.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Density */}
      <div>
        <p className="mb-2 text-xs font-semibold app-muted">Spacing density</p>
        <div className="grid grid-cols-3 gap-2">
          {(['compact', 'normal', 'relaxed'] as Density[]).map((den) => (
            <button
              key={den}
              type="button"
              onClick={() => onChange({ density: den })}
              className="rounded-lg border px-2 py-2 text-[11px] capitalize transition"
              style={{
                borderColor: custom.density === den ? custom.accent : 'var(--border)',
                background: custom.density === den ? `${custom.accent}14` : 'var(--surface)',
              }}
            >
              {den}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
