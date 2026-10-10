import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  FileText, Moon, Sun, Download, FileJson, Upload, Printer,
  RotateCcw, ZoomIn, ZoomOut, Sliders, PanelLeftClose, PanelLeft,
} from 'lucide-react';
import type { AppState, Customization, CVData } from './types/cv';
import { defaultState, emptyCV, defaultCustomization } from './lib/defaults';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useTheme } from './hooks/useTheme';
import { FormBuilder } from './components/FormBuilder';
import { CVPreview, A4_W } from './components/CVPreview';
import { Customizer } from './components/Customizer';
import { exportPdf, printCV, downloadJson, parseImport } from './lib/export';

const STORAGE_KEY = 'cvforge.state.v1';

export default function App() {
  const [state, setState] = useLocalStorage<AppState>(STORAGE_KEY, defaultState);
  const { theme, toggle } = useTheme();
  const [showForm, setShowForm] = useState(true);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [zoom, setZoom] = useState(0.72);
  const [exporting, setExporting] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);

  const setCV = useCallback(
    (updater: (cv: CVData) => CVData) => setState((s) => ({ ...s, cv: updater(s.cv) })),
    [setState],
  );
  const setCustom = useCallback(
    (patch: Partial<Customization>) => setState((s) => ({ ...s, customization: { ...s.customization, ...patch } })),
    [setState],
  );

  // Fit-to-width zoom on resize of the canvas column.
  useEffect(() => {
    const el = canvasWrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const avail = el.clientWidth - 48;
      setZoom(Math.min(1, Math.max(0.4, avail / A4_W)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleImport = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseImport(String(reader.result));
      if (!parsed) {
        alert('That file is not valid CV Forge JSON.');
        return;
      }
      setState((s) => ({
        cv: parsed.cv ?? s.cv,
        customization: parsed.customization ?? s.customization,
      }));
    };
    reader.readAsText(file);
  };

  const handleExportPdf = async () => {
    setExporting(true);
    // Temporarily force 1:1 scale so html2canvas captures full resolution.
    try {
      await exportPdf(state.cv.personal.fullName || 'cv');
    } finally {
      setExporting(false);
    }
  };

  const fileName = state.cv.personal.fullName?.trim().replace(/\s+/g, '_') || 'cv';

  return (
    <div className="flex h-screen flex-col" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {/* ---------------- Header ---------------- */}
      <header className="flex items-center justify-between gap-2 border-b px-4 py-2.5 app-surface" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: state.customization.accent }}>
            <FileText size={17} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-none">CV Forge</h1>
            <p className="text-[10px] app-muted">Real-time CV builder</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <button className="btn btn-ghost lg:hidden" onClick={() => setShowForm((v) => !v)} title="Toggle editor">
            {showForm ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
          </button>
          <button className="btn btn-outline" onClick={() => setShowCustomizer((v) => !v)}>
            <Sliders size={15} /> <span className="hidden sm:inline">Design</span>
          </button>
          <input ref={importRef} type="file" accept="application/json" className="hidden" onChange={(e) => handleImport(e.target.files?.[0])} />
          <button className="btn btn-outline" onClick={() => importRef.current?.click()} title="Import JSON"><Upload size={15} /><span className="hidden md:inline">Import</span></button>
          <button className="btn btn-outline" onClick={() => downloadJson(state, fileName)} title="Export JSON"><FileJson size={15} /><span className="hidden md:inline">JSON</span></button>
          <button className="btn btn-outline" onClick={printCV} title="Print"><Printer size={15} /><span className="hidden md:inline">Print</span></button>
          <button
            className="btn text-white"
            style={{ background: state.customization.accent }}
            onClick={handleExportPdf}
            disabled={exporting}
          >
            <Download size={15} /> {exporting ? 'Exporting…' : 'PDF'}
          </button>
          <button className="btn btn-ghost" onClick={toggle} title="Toggle theme" aria-label="Toggle color theme">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      {/* ---------------- Body ---------------- */}
      <div className="flex min-h-0 flex-1">
        {/* Left — form */}
        {showForm && (
          <div className="scroll-slim w-full overflow-y-auto border-r p-4 lg:w-[46%] lg:max-w-[640px]" style={{ borderColor: 'var(--border)' }}>
            {showCustomizer && (
              <div className="mb-4 rounded-xl border p-4 app-surface animate-fade-in" style={{ borderColor: 'var(--border)' }}>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold">Design & Template</h2>
                  <button className="btn btn-ghost px-2 py-1 text-xs" onClick={() => {
                    if (confirm('Reset all content and design to the sample CV?')) setState({ cv: defaultState.cv, customization: defaultCustomization });
                  }}><RotateCcw size={13} /> Reset</button>
                </div>
                <Customizer custom={state.customization} onChange={setCustom} />
                <button
                  className="btn btn-ghost mt-3 w-full text-xs"
                  onClick={() => { if (confirm('Clear all fields and start from blank?')) setCV(() => emptyCV); }}
                >
                  Start from blank
                </button>
              </div>
            )}
            <FormBuilder cv={state.cv} setCV={setCV} accent={state.customization.accent} />
          </div>
        )}

        {/* Right — preview canvas */}
        <div
          ref={canvasWrapRef}
          className={`scroll-slim relative min-h-0 flex-1 overflow-auto ${showForm ? 'hidden lg:block' : 'block'}`}
          style={{ background: 'var(--surface-2)' }}
        >
          {/* Zoom controls */}
          <div className="sticky top-0 z-10 flex items-center justify-end gap-1 px-4 py-2">
            <div className="flex items-center gap-1 rounded-lg border px-1.5 py-1 app-surface" style={{ borderColor: 'var(--border)' }}>
              <button className="btn btn-ghost px-1.5 py-1" onClick={() => setZoom((z) => Math.max(0.4, z - 0.08))}><ZoomOut size={15} /></button>
              <span className="w-10 text-center text-[11px] app-muted">{Math.round(zoom * 100)}%</span>
              <button className="btn btn-ghost px-1.5 py-1" onClick={() => setZoom((z) => Math.min(1.2, z + 0.08))}><ZoomIn size={15} /></button>
            </div>
          </div>

          <div className="flex justify-center px-6 pb-10 print-canvas">
            <div className="cv-scale" style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
              <CVPreview cv={state.cv} custom={state.customization} />
            </div>
          </div>
        </div>
      </div>

      {/* Hidden print/export copy — lives at the body level (#print-mount),
          free of the on-screen zoom transform and scroll containers so it
          prints and exports as a clean, unscaled A4 page. */}
      {typeof document !== 'undefined' &&
        document.getElementById('print-mount') &&
        createPortal(
          <CVPreview cv={state.cv} custom={state.customization} forPrint />,
          document.getElementById('print-mount')!,
        )}
    </div>
  );
}
