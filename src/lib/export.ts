import type { AppState, CVData, PersonalInfo } from '../types/cv';

/** Generates clean, automated PDF filename from name and title. */
export function generatePdfFileName(personal?: Partial<PersonalInfo>): string {
  const name = personal?.fullName?.trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
  const title = personal?.title?.trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
  if (name && title) return `${name}_${title}_CV`;
  if (name) return `${name}_CV`;
  return `CV_${new Date().toISOString().slice(0, 10)}`;
}

/** Export the live A4 node to a high-quality PDF via html2pdf.js (lazy-loaded). */
export async function exportPdf(fileName: string) {
  const el = document.getElementById('print-root');
  const mount = document.getElementById('print-mount');
  if (!el || !mount) return;

  // The print copy is display:none on screen; html2canvas cannot capture a
  // zero-size node, so reveal it off-screen for the duration of the capture.
  const prev = mount.style.cssText;
  mount.style.cssText =
    'display:block;position:fixed;left:-10000px;top:0;z-index:-1;background:#ffffff;';

  // Lazy import keeps the main bundle lean.
  const html2pdf = (await import('html2pdf.js')).default;
  try {
    await html2pdf()
      .set({
        margin: 0,
        filename: `${fileName || 'CV'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', windowWidth: 794 },
        jsPDF: { unit: 'px', format: [794, 1123], orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] },
      })
      .from(el)
      .save();
  } finally {
    mount.style.cssText = prev;
  }
}

/** Browser-native print (vector-sharp, uses the @media print rules). */
export function printCV() {
  window.print();
}

/** Exports state to JSON including a format version field. */
export function downloadJson(state: AppState, fileName: string) {
  const payload = {
    version: 1,
    ...state,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName || 'CV'}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Parse an imported JSON file. Accepts versioned format, full AppState, or legacy bare CVData. */
export function parseImport(text: string): Partial<AppState> | null {
  try {
    const data = JSON.parse(text);
    if (data && typeof data === 'object') {
      if ('cv' in data && 'customization' in data) return data as AppState;
      if ('personal' in data) return { cv: data as CVData };
    }
    return null;
  } catch {
    return null;
  }
}
