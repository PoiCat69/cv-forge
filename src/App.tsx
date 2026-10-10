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
    <div className="flex h-screen flex-col overflow-hidden" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {/* ---------------- 1. Top Frosted Bar (Apple sub-nav-frosted style) ---------------- */}
      <header
        className="sticky top-0 z-20 flex h-[52px] shrink-0 items-center justify-between border-b px-4 backdrop-blur-md sm:px-6 app-surface"
        style={{
          borderColor: 'var(--border)',
          background: 'color-mix(in srgb, var(--surface) 85%, transparent)',
        }}
      >
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-control bg-[var(--primary)] text-white transition active:scale-[0.95]">
            <FileText size={17} />
          </div>
          <div>
            <h1 className="text-base font-semibold leading-none tracking-[-0.224px] text-[var(--text)]">CV Forge</h1>
            <p className="mt-0.5 text-xs tracking-[-0.12px] text-[var(--text-muted)]">Real-time CV builder</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Mobile pane toggle */}
          <button
            type="button"
            className="btn btn-ghost grid h-10 w-10 place-items-center rounded-control p-0 lg:hidden"
            onClick={() => setShowForm((v) => !v)}
            title="Toggle editor / preview pane"
            aria-label="Toggle editor"
          >
            {showForm ? <PanelLeftClose size={17} /> : <PanelLeft size={17} />}
          </button>

          {/* Design Modal Trigger */}
          <button
            type="button"
            className={`btn btn-outline rounded-pill px-4 py-1.5 text-sm active:scale-[0.95] ${
              showCustomizer ? 'border-[var(--primary)] text-[var(--primary)]' : ''
            }`}
            onClick={() => setShowCustomizer((v) => !v)}
            aria-expanded={showCustomizer}
          >
            <Sliders size={14} />
            <span className="hidden sm:inline">Design</span>
          </button>

          {/* JSON Import */}
          <input
            ref={importRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              handleImport(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            className="btn btn-outline rounded-pill px-4 py-1.5 text-sm active:scale-[0.95]"
            onClick={() => importRef.current?.click()}
            title="Import JSON"
            aria-label="Import JSON"
          >
            <Upload size={14} />
            <span className="hidden md:inline">Import</span>
          </button>

          {/* JSON Export */}
          <button
            type="button"
            className="btn btn-outline rounded-pill px-4 py-1.5 text-sm active:scale-[0.95]"
            onClick={() => downloadJson(state, fileName)}
            title="Export JSON"
            aria-label="Export JSON"
          >
            <FileJson size={14} />
            <span className="hidden md:inline">JSON</span>
          </button>

          {/* Native Print */}
          <button
            type="button"
            className="btn btn-outline rounded-pill px-4 py-1.5 text-sm active:scale-[0.95]"
            onClick={printCV}
            title="Print"
            aria-label="Print"
          >
            <Printer size={14} />
            <span className="hidden md:inline">Print</span>
          </button>

          {/* Primary Action Pill: Export PDF */}
          <button
            type="button"
            className="btn btn-primary rounded-pill px-5 py-1.5 text-sm font-semibold active:scale-[0.95]"
            onClick={handleExportPdf}
            disabled={exporting}
            aria-label="Export PDF"
          >
            <Download size={14} />
            <span>{exporting ? 'Exporting…' : 'PDF'}</span>
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            className="btn btn-ghost grid h-10 w-10 place-items-center rounded-control p-0 text-[var(--text-muted)] hover:text-[var(--text)] transition duration-fast ease-standard active:scale-[0.95]"
            onClick={toggle}
            title="Toggle theme"
            aria-label="Toggle color theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      {/* ---------------- 2. Split Workspace Body ---------------- */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left pane: Form Builder */}
        {showForm && (
          <div
            className="scroll-slim w-full overflow-y-auto border-r p-4 sm:p-6 lg:w-[46%] lg:max-w-[640px]"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
          >
            <FormBuilder cv={state.cv} setCV={setCV} accent={state.customization.accent} />
          </div>
        )}

        {/* Right pane: Preview Canvas (Parchment staging) */}
        <div
          ref={canvasWrapRef}
          className={`scroll-slim relative min-h-0 flex-1 overflow-auto ${showForm ? 'hidden lg:block' : 'block'}`}
          style={{ background: 'var(--surface-2)' }}
        >
          {/* Floating Zoom Controls Capsule */}
          <div className="sticky top-3 z-10 flex items-center justify-end px-6">
            <div
              className="flex items-center gap-1 rounded-pill border px-2 py-1 shadow-none backdrop-blur-md app-surface"
              style={{
                borderColor: 'var(--border)',
                background: 'color-mix(in srgb, var(--surface) 90%, transparent)',
              }}
            >
              <button
                type="button"
                className="grid h-7 w-7 place-items-center rounded-control text-[var(--text-muted)] transition duration-fast ease-standard hover:bg-[var(--border-subtle)] hover:text-[var(--text)] active:scale-[0.95]"
                onClick={() => setZoom((z) => Math.max(0.4, z - 0.08))}
                aria-label="Zoom out"
                title="Zoom out"
              >
                <ZoomOut size={14} />
              </button>
              <span className="w-11 text-center text-xs font-medium tracking-[-0.12px] text-[var(--text-muted)]">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                className="grid h-7 w-7 place-items-center rounded-control text-[var(--text-muted)] transition duration-fast ease-standard hover:bg-[var(--border-subtle)] hover:text-[var(--text)] active:scale-[0.95]"
                onClick={() => setZoom((z) => Math.min(1.2, z + 0.08))}
                aria-label="Zoom in"
                title="Zoom in"
              >
                <ZoomIn size={14} />
              </button>
            </div>
          </div>

          {/* Staging A4 canvas with Apple single product drop-shadow */}
          <div className="flex justify-center px-4 pb-16 pt-4 sm:px-6 print-canvas">
            <div className="cv-scale" style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
              <CVPreview cv={state.cv} custom={state.customization} />
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- 3. Design & Customizer Modal Sheet ---------------- */}
      {showCustomizer && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Design & Template customizer"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity duration-slow ease-standard"
          style={{ background: 'rgba(0, 0, 0, 0.4)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCustomizer(false);
          }}
        >
          <div
            className="animate-modal-enter relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-card border border-[var(--border)] app-surface"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold tracking-[-0.374px] text-[var(--text)]">Design & Template</h2>
                <p className="text-xs text-[var(--text-muted)]">Customize the visual presentation of your CV</p>
              </div>
              <button
                type="button"
                className="btn btn-outline rounded-pill px-3 py-1.5 text-xs active:scale-[0.95]"
                onClick={() => {
                  if (confirm('Reset all content and design to the sample CV?')) {
                    setState({ cv: defaultState.cv, customization: defaultCustomization });
                  }
                }}
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="scroll-slim flex-1 overflow-y-auto p-6">
              <Customizer custom={state.customization} onChange={setCustom} />

              <div className="mt-6 border-t border-[var(--border)] pt-4">
                <button
                  type="button"
                  className="btn btn-ghost w-full rounded-pill text-sm text-red-600 transition duration-fast ease-standard hover:bg-red-500/10 dark:text-red-400 active:scale-[0.95]"
                  onClick={() => {
                    if (confirm('Clear all fields and start from blank?')) {
                      setCV(() => emptyCV);
                    }
                  }}
                >
                  Start from blank
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end border-t border-[var(--border)] bg-[var(--surface-pearl)] px-6 py-3">
              <button
                type="button"
                className="btn btn-primary rounded-pill px-6 py-2 text-sm font-semibold active:scale-[0.95]"
                onClick={() => setShowCustomizer(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 4. Hidden print/export copy ---------------- */}
      {typeof document !== 'undefined' &&
        document.getElementById('print-mount') &&
        createPortal(
          <CVPreview cv={state.cv} custom={state.customization} forPrint />,
          document.getElementById('print-mount')!,
        )}
    </div>
  );
}
