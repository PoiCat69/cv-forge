import type { AppState, CVData } from '../types/cv';

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
        filename: `${fileName || 'cv'}.pdf`,
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

export function downloadJson(state: AppState, fileName: string) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName || 'cv'}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Parse an imported JSON file. Accepts either a full AppState or a bare CVData. */
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
