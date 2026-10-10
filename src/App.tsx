import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  FileText, Moon, Sun, Download, FileJson, Upload, Printer,
  RotateCcw, ZoomIn, ZoomOut, Sliders, PanelLeftClose, PanelLeft,
  Undo2, Redo2, Check, AlertCircle, Layers, ChevronDown, HelpCircle,
  Maximize2, Minimize2,
} from 'lucide-react';
import type { AppState, Customization, CVData } from './types/cv';
import { defaultState, emptyCV, defaultCustomization } from './lib/defaults';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useCVHistory } from './hooks/useCVHistory';
import { useCVVersions } from './hooks/useCVVersions';
import { useTheme } from './hooks/useTheme';
import { FormBuilder } from './components/FormBuilder';
import { CVPreview, A4_W, A4_H } from './components/CVPreview';
import { Customizer } from './components/Customizer';
import { exportPdf, printCV, downloadJson, validateAndParseImport, generatePdfFileName } from './lib/export';
import { Toast, type ToastData } from './components/Toast';
import { VersionManagerModal } from './components/VersionManagerModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';

const STORAGE_KEY = 'cvforge.state.v1';

export default function App() {
  const [state, setState, { saveStatus, errorMessage }] = useLocalStorage<AppState>(STORAGE_KEY, defaultState);
  const { undo, redo, canUndo, canRedo, commitSnapshot } = useCVHistory(state, setState);
  const {
    versions,
    activeVersion,
    switchVersion,
    createVersion,
    duplicateVersion,
    renameVersion,
    deleteVersion,
  } = useCVVersions(state, setState);

  const { theme, themeMode, cycleTheme } = useTheme();
  const [focusMode, setFocusMode] = useState(false);
  const [mobileTab, setMobileTab] = useState<'form' | 'preview'>('form');
  const [showForm, setShowForm] = useState(true);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [showVersionsModal, setShowVersionsModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [zoom, setZoom] = useState(0.72);
  const [pageCount, setPageCount] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);

  // Focus Mode toggle via F10 or Escape
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if (e.key === 'F10') {
        e.preventDefault();
        setFocusMode((v) => !v);
      } else if (e.key === 'Escape' && focusMode) {
        setFocusMode(false);
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [focusMode]);

  const setCV = useCallback(
    (updater: (cv: CVData) => CVData) => setState((s) => ({ ...s, cv: updater(s.cv) })),
    [setState],
  );
  const setCustom = useCallback(
    (patch: Partial<Customization>) => setState((s) => ({ ...s, customization: { ...s.customization, ...patch } })),
    [setState],
  );

  const fitWidth = useCallback(() => {
    const el = canvasWrapRef.current;
    if (!el) return;
    const avail = el.clientWidth - 48;
    setZoom(Math.min(1.2, Math.max(0.35, avail / A4_W)));
  }, []);

  const fitPage = useCallback(() => {
    const el = canvasWrapRef.current;
    if (!el) return;
    const availH = el.clientHeight - 80;
    setZoom(Math.min(1.2, Math.max(0.35, availH / A4_H)));
  }, []);

  // Fit-to-width zoom on initial resize of the canvas column.
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

  const handleActiveSectionChange = useCallback((sectionKey: string) => {
    const el = canvasWrapRef.current?.querySelector(`#cv-section-${sectionKey}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, []);

  const handleImport = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = validateAndParseImport(String(reader.result));
      if (!result.ok || !result.data) {
        alert(result.error || 'File JSON tidak valid.');
        return;
      }
      commitSnapshot();
      setState((s) => ({
        cv: result.data!.cv ?? s.cv,
        customization: result.data!.customization ?? s.customization,
      }));
      setToast({
        id: String(Date.now()),
        message: 'CV berhasil diimpor',
        onUndo: undo,
      });
    };
    reader.readAsText(file);
  };

  const handleExportPdf = useCallback(async () => {
    setExporting(true);
    try {
      const pdfBaseName = generatePdfFileName(state.cv.personal).replace(/\.pdf$/i, '');
      await exportPdf(pdfBaseName);
    } finally {
      setExporting(false);
    }
  }, [state.cv.personal]);

  // Global Keyboard Shortcuts (Ctrl+/, Ctrl+S, Esc)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setShowShortcutsModal((v) => !v);
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleExportPdf();
      } else if (e.key === 'Escape') {
        setShowShortcutsModal(false);
        setShowVersionsModal(false);
        setShowCustomizer(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleExportPdf]);

  const fileName = generatePdfFileName(state.cv.personal).replace(/\.pdf$/i, '');

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
        {/* Brand / Logo & Status */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-control bg-[var(--primary)] text-white transition active:scale-[0.95]">
            <FileText size={17} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold leading-none tracking-[-0.224px] text-[var(--text)]">CV Forge</h1>
              {/* Auto-save status pill */}
              <div className="hidden sm:flex items-center">
                {saveStatus === 'saving' && (
                  <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-normal">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span>Menyimpan…</span>
                  </span>
                )}
                {saveStatus === 'saved' && (
                  <span className="flex items-center gap-1 text-xs text-[var(--text-muted)] font-normal" title="Semua perubahan tersimpan otomatis di browser">
                    <Check size={12} className="text-emerald-500" />
                    <span>Tersimpan</span>
                  </span>
                )}
                {saveStatus === 'error' && (
                  <span className="flex items-center gap-1 text-xs text-red-500 font-normal" title={errorMessage || 'Gagal menyimpan ke penyimpanan lokal'}>
                    <AlertCircle size={12} />
                    <span>Gagal simpan</span>
                  </span>
                )}
              </div>
            </div>
            <p className="mt-0.5 text-xs tracking-[-0.12px] text-[var(--text-muted)]">Real-time CV builder</p>
          </div>

          {/* Version Selector Pill */}
          <button
            type="button"
            onClick={() => setShowVersionsModal(true)}
            title="Kelola & ganti versi CV"
            className="hidden sm:flex items-center gap-1.5 rounded-pill border border-[var(--border)] bg-[var(--surface-pearl)] px-2.5 py-1 text-xs font-semibold text-[var(--text)] transition duration-fast ease-standard hover:border-[var(--primary)] active:scale-[0.95]"
          >
            <Layers size={13} className="text-[var(--primary)]" />
            <span className="max-w-[110px] truncate">{activeVersion.name}</span>
            <ChevronDown size={11} className="text-[var(--text-muted)]" />
          </button>

          {/* Undo / Redo buttons */}
          <div className="ml-2 hidden items-center gap-0.5 rounded-control border border-[var(--border)] p-0.5 md:flex">
            <button
              type="button"
              className="grid h-7 w-7 place-items-center rounded-control text-[var(--text-muted)] transition duration-fast ease-standard hover:bg-[var(--border-subtle)] hover:text-[var(--text)] disabled:opacity-30 disabled:pointer-events-none active:scale-[0.95]"
              onClick={undo}
              disabled={!canUndo}
              title="Urungkan (Ctrl+Z)"
              aria-label="Urungkan"
            >
              <Undo2 size={14} />
            </button>
            <button
              type="button"
              className="grid h-7 w-7 place-items-center rounded-control text-[var(--text-muted)] transition duration-fast ease-standard hover:bg-[var(--border-subtle)] hover:text-[var(--text)] disabled:opacity-30 disabled:pointer-events-none active:scale-[0.95]"
              onClick={redo}
              disabled={!canRedo}
              title="Ulangi (Ctrl+Shift+Z)"
              aria-label="Ulangi"
            >
              <Redo2 size={14} />
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Mobile undo/redo */}
          <div className="flex items-center gap-0.5 md:hidden">
            <button
              type="button"
              className="grid h-8 w-8 place-items-center rounded-control text-[var(--text-muted)] transition duration-fast ease-standard disabled:opacity-30 active:scale-[0.95]"
              onClick={undo}
              disabled={!canUndo}
              title="Urungkan"
              aria-label="Urungkan"
            >
              <Undo2 size={15} />
            </button>
            <button
              type="button"
              className="grid h-8 w-8 place-items-center rounded-control text-[var(--text-muted)] transition duration-fast ease-standard disabled:opacity-30 active:scale-[0.95]"
              onClick={redo}
              disabled={!canRedo}
              title="Ulangi"
              aria-label="Ulangi"
            >
              <Redo2 size={15} />
            </button>
          </div>

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

          {/* Focus Mode Trigger */}
          <button
            type="button"
            className={`btn btn-outline rounded-pill px-3 py-1.5 text-sm active:scale-[0.95] ${
              focusMode ? 'border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/10 font-semibold' : ''
            }`}
            onClick={() => setFocusMode((v) => !v)}
            title={focusMode ? 'Keluar Mode Fokus (Esc)' : 'Mode Fokus (Fokus menulis formulir - F10)'}
            aria-label="Mode Fokus"
          >
            {focusMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            <span className="hidden xl:inline">{focusMode ? 'Keluar Fokus' : 'Fokus'}</span>
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

          {/* Shortcuts Help Button */}
          <button
            type="button"
            className="btn btn-ghost grid h-10 w-10 place-items-center rounded-control p-0 text-[var(--text-muted)] hover:text-[var(--text)] transition duration-fast ease-standard active:scale-[0.95]"
            onClick={() => setShowShortcutsModal(true)}
            title="Pintasan keyboard (Ctrl+/)"
            aria-label="Pintasan keyboard"
          >
            <HelpCircle size={16} />
          </button>

          {/* Theme Toggle (System / Light / Dark) */}
          <button
            type="button"
            className="btn btn-ghost flex items-center gap-1.5 rounded-pill px-2.5 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition duration-fast ease-standard active:scale-[0.95]"
            onClick={cycleTheme}
            title={`Tema: ${themeMode === 'system' ? 'Sistem OS' : themeMode === 'dark' ? 'Gelap' : 'Terang'} (Klik untuk beralih)`}
            aria-label="Ganti tema warna"
          >
            {themeMode === 'system' ? (
              <span className="text-[13px]">💻</span>
            ) : theme === 'dark' ? (
              <Sun size={15} />
            ) : (
              <Moon size={15} />
            )}
            <span className="hidden sm:inline capitalize text-[11px] font-medium">
              {themeMode === 'system' ? 'Sistem' : themeMode === 'dark' ? 'Gelap' : 'Terang'}
            </span>
          </button>
        </div>
      </header>

      {/* Mobile Segmented Tab: Form vs Preview */}
      {!focusMode && (
        <div className="flex lg:hidden items-center border-b border-[var(--border)] bg-[var(--surface)] px-4 py-2 shrink-0">
          <div className="flex w-full rounded-pill bg-[var(--surface-pearl)] p-0.5 border border-[var(--border)]">
            <button
              type="button"
              onClick={() => setMobileTab('form')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-pill py-1.5 text-xs font-semibold transition duration-fast ${
                mobileTab === 'form'
                  ? 'bg-[var(--primary)] text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <span>📝 Formulir</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('preview')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-pill py-1.5 text-xs font-semibold transition duration-fast ${
                mobileTab === 'preview'
                  ? 'bg-[var(--primary)] text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <span>👁️ Pratinjau ({pageCount} Hal)</span>
            </button>
          </div>
        </div>
      )}

      {/* ---------------- 2. Split Workspace Body ---------------- */}
      {focusMode ? (
        <div className="scroll-slim flex min-h-0 flex-1 overflow-y-auto p-4 sm:p-8" style={{ background: 'var(--bg)' }}>
          <div className="mx-auto w-full max-w-3xl space-y-4">
            <div className="flex items-center justify-between rounded-control border border-[var(--primary)]/30 bg-[var(--primary)]/10 px-4 py-2.5 text-xs font-medium text-[var(--primary)]">
              <span className="flex items-center gap-2">
                <Maximize2 size={13} />
                <span>Mode Fokus Aktif · Menulis tanpa gangguan</span>
              </span>
              <button
                type="button"
                onClick={() => setFocusMode(false)}
                className="rounded-pill bg-[var(--primary)] px-3 py-1 font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-[0.95]"
              >
                Keluar Fokus (Esc)
              </button>
            </div>
            <FormBuilder
              cv={state.cv}
              setCV={setCV}
              accent={state.customization.accent}
              onActiveSectionChange={handleActiveSectionChange}
              onDeleteToast={(msg) => {
                commitSnapshot();
                setToast({
                  id: String(Date.now()),
                  message: msg,
                  onUndo: undo,
                });
              }}
            />
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Left pane: Form Builder */}
          <div
            className={`scroll-slim w-full overflow-y-auto border-r p-4 sm:p-6 lg:w-[46%] lg:max-w-[640px] ${
              mobileTab === 'form' ? 'block' : 'hidden lg:block'
            }`}
            style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
          >
            <FormBuilder
              cv={state.cv}
              setCV={setCV}
              accent={state.customization.accent}
              onActiveSectionChange={handleActiveSectionChange}
              onDeleteToast={(msg) => {
                commitSnapshot();
                setToast({
                  id: String(Date.now()),
                  message: msg,
                  onUndo: undo,
                });
              }}
            />
          </div>

          {/* Right pane: Preview Canvas (Parchment staging) */}
          <div
            ref={canvasWrapRef}
            className={`scroll-slim relative min-h-0 flex-1 overflow-auto ${
              mobileTab === 'preview' ? 'block' : 'hidden lg:block'
            }`}
            style={{ background: 'var(--surface-2)' }}
          >
          {/* Floating Zoom & Page Indicator Capsule */}
          <div className="sticky top-3 z-10 flex items-center justify-between px-6 pointer-events-none">
            {/* Page Count indicator badge */}
            <div className="pointer-events-auto">
              {pageCount > 1 ? (
                <div
                  className="flex items-center gap-1.5 rounded-pill border border-amber-500/50 bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300 backdrop-blur-md animate-modal-enter shadow-none"
                  title="Dokumen melebihi 1 halaman A4. Periksa garis batas halaman di preview untuk memastikan teks tidak terpotong saat diekspor."
                >
                  <AlertCircle size={13} />
                  <span>{pageCount} Halaman A4</span>
                </div>
              ) : (
                <div
                  className="flex items-center gap-1.5 rounded-pill border border-[var(--border)] px-3 py-1 text-xs font-medium text-[var(--text-muted)] backdrop-blur-md"
                  style={{ background: 'color-mix(in srgb, var(--surface) 90%, transparent)' }}
                  title="Dokumen pas dalam 1 halaman A4"
                >
                  <span>1 Halaman A4</span>
                </div>
              )}
            </div>

            {/* Zoom Controls */}
            <div
              className="pointer-events-auto flex items-center gap-1 rounded-pill border px-2 py-1 shadow-none backdrop-blur-md app-surface"
              style={{
                borderColor: 'var(--border)',
                background: 'color-mix(in srgb, var(--surface) 90%, transparent)',
              }}
            >
              <button
                type="button"
                className="grid h-7 w-7 place-items-center rounded-control text-[var(--text-muted)] transition duration-fast ease-standard hover:bg-[var(--border-subtle)] hover:text-[var(--text)] active:scale-[0.95]"
                onClick={() => setZoom((z) => Math.max(0.35, z - 0.08))}
                aria-label="Zoom out"
                title="Perkecil"
              >
                <ZoomOut size={13} />
              </button>
              <button
                type="button"
                onClick={() => setZoom(1.0)}
                title="Klik untuk reset ke 100%"
                className="w-11 text-center text-xs font-medium tracking-[-0.12px] text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                className="grid h-7 w-7 place-items-center rounded-control text-[var(--text-muted)] transition duration-fast ease-standard hover:bg-[var(--border-subtle)] hover:text-[var(--text)] active:scale-[0.95]"
                onClick={() => setZoom((z) => Math.min(1.25, z + 0.08))}
                aria-label="Zoom in"
                title="Perbesar"
              >
                <ZoomIn size={13} />
              </button>
              <span className="h-3 w-px bg-[var(--border)] mx-0.5" />
              <button
                type="button"
                className="grid h-7 w-7 place-items-center rounded-control text-[var(--text-muted)] transition duration-fast ease-standard hover:bg-[var(--border-subtle)] hover:text-[var(--text)] active:scale-[0.95]"
                onClick={fitWidth}
                aria-label="Pas lebar layar"
                title="Pas lebar layar (Fit Width)"
              >
                <Maximize2 size={13} />
              </button>
              <button
                type="button"
                className="grid h-7 w-7 place-items-center rounded-control text-[var(--text-muted)] transition duration-fast ease-standard hover:bg-[var(--border-subtle)] hover:text-[var(--text)] active:scale-[0.95]"
                onClick={fitPage}
                aria-label="Pas 1 halaman"
                title="Pas 1 halaman penuh (Fit Page)"
              >
                <Minimize2 size={13} />
              </button>
            </div>
          </div>

          {/* Staging A4 canvas with Apple single product drop-shadow */}
          <div className="flex justify-center px-4 pb-16 pt-4 sm:px-6 print-canvas">
            <div className="cv-scale" style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
              <CVPreview cv={state.cv} custom={state.customization} onPageCountChange={setPageCount} />
            </div>
          </div>
        </div>
      </div>
    )}

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
                    commitSnapshot();
                    setState({ cv: defaultState.cv, customization: defaultCustomization });
                    setShowCustomizer(false);
                    setToast({
                      id: String(Date.now()),
                      message: 'CV direset ke data contoh',
                      onUndo: undo,
                    });
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
                      commitSnapshot();
                      setCV(() => emptyCV);
                      setShowCustomizer(false);
                      setToast({
                        id: String(Date.now()),
                        message: 'CV dikosongkan',
                        onUndo: undo,
                      });
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

      {/* Floating Toast Notification */}
      <Toast toast={toast} onDismiss={() => setToast(null)} />

      {/* CV Version Manager Modal */}
      <VersionManagerModal
        isOpen={showVersionsModal}
        onClose={() => setShowVersionsModal(false)}
        versions={versions}
        activeVersion={activeVersion}
        onSwitch={switchVersion}
        onCreate={createVersion}
        onDuplicate={duplicateVersion}
        onRename={renameVersion}
        onDelete={deleteVersion}
      />

      {/* Keyboard Shortcuts Cheat Sheet Modal */}
      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />

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
