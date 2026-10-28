function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function brandLogoUrl(): string {
  return `${window.location.origin}/brand/madina-traders-logo.png`;
}

const STOCK_CSS = `
  @page { size: A4; margin: 8mm 8mm 10mm; }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    color: #0a2342;
    background: #fff;
    color-scheme: light;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 9.5px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .brand-header {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #0a2342;
    color: #fff;
    padding: 8px 10px;
    border-bottom: 3px solid #c8102e;
  }
  .brand-logo {
    width: 48px;
    height: 48px;
    object-fit: contain;
    background: #fff;
    border-radius: 8px;
    padding: 3px;
    flex-shrink: 0;
  }
  .brand-copy h1 {
    margin: 0;
    font-size: 15px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .brand-copy p { margin: 1px 0 0; font-size: 9px; color: #d5dee9; }
  .brand-copy .tag {
    margin: 1px 0 0;
    color: #f4c430;
    font-size: 8px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    font-weight: 700;
  }
  table { width: 100%; border-collapse: collapse; }
  thead { display: table-header-group; }
  th, td { padding: 3px 5px; vertical-align: top; border-bottom: 1px solid #d5dee9; }
  th {
    background: #0a2342;
    color: #fff;
    font-size: 8px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    text-align: left;
  }
  td.num, th.num { text-align: right; white-space: nowrap; }
  tbody tr:nth-child(even) { background: #eef2f7; }
  tbody tr:nth-child(odd) { background: #fff; }
  .stock-table { table-layout: fixed; }
  .stock-table td.sr, .stock-table th.sr { width: 6%; text-align: right; }
  .stock-table td.brand, .stock-table th.brand { width: 18%; }
  .stock-table th.sr:nth-child(4), .stock-table td.sr:nth-child(4) {
    border-left: 2px solid #0a2342;
    padding-left: 8px;
  }
  .meta-line { padding: 6px 10px; font-size: 10px; background: #eef2f7; }
  .invoice { margin: 8px 0 0; page-break-inside: avoid; border: 1px solid #aabccc; }
  .invoice-head {
    display: flex;
    justify-content: space-between;
    padding: 5px 8px;
    background: #0a2342;
    color: #fff;
    font-weight: 700;
    font-size: 11px;
  }
  .invoice-total {
    display: flex;
    justify-content: space-between;
    padding: 5px 8px;
    background: #eef2f7;
    font-weight: 700;
  }
  .pay-block { margin: 10px 0 0; border: 1px solid #aabccc; }
  .pay-block h3 {
    margin: 0;
    padding: 5px 8px;
    background: #1e3a5f;
    color: #fff;
    font-size: 11px;
  }
  .total-box {
    margin-top: 10px;
    padding: 8px 10px;
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    font-weight: 800;
    color: #fff;
    background: #c8102e;
  }
  .receipt-close {
    margin-top: 10px;
    padding: 10px 8px 6px;
    text-align: center;
    border-top: 1px dashed #1e3a5f;
  }
  .receipt-close .thanks { margin: 0; font-size: 12px; font-weight: 800; }
  .receipt-close .visit { margin: 3px 0 8px; font-size: 10px; color: #4d6d8c; }
  .receipt-close .software {
    margin: 0;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #c8102e;
  }
  .receipt-close p { margin: 2px 0 0; font-size: 9px; }
`;

function waitForImages(doc: Document): Promise<void> {
  const images = Array.from(doc.images);
  if (images.length === 0) return Promise.resolve();
  return Promise.all(
    images.map(
      (img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              img.onload = () => resolve();
              img.onerror = () => resolve();
            }),
    ),
  ).then(() => undefined);
}

export function printA4Pdf(title: string, bodyHtml: string) {
  const prev = document.getElementById('a4-export-frame');
  prev?.remove();

  const iframe = document.createElement('iframe');
  iframe.id = 'a4-export-frame';
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText =
    'position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none;';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc || !win) {
    iframe.remove();
    return;
  }

  doc.open();
  doc.write(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>${STOCK_CSS}</style></head><body>${bodyHtml}</body></html>`,
  );
  doc.close();

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    iframe.remove();
  };
  win.addEventListener('afterprint', cleanup);
  void waitForImages(doc).then(() => {
    window.setTimeout(() => {
      win.focus();
      win.print();
    }, 200);
  });
  window.setTimeout(cleanup, 90_000);
}

export function brandedHeader(shop: string, address: string, phone: string, title: string): string {
  return `
    <header class="brand-header">
      <img class="brand-logo" src="${brandLogoUrl()}" alt="${escapeHtml(shop)}" />
      <div class="brand-copy">
        <h1>${escapeHtml(shop)}</h1>
        <p class="tag">Auto Spare Parts</p>
        <p>${escapeHtml(address)} · ${escapeHtml(phone)}</p>
        <p>${escapeHtml(title)}</p>
      </div>
    </header>
  `;
}

export function brandedFooter(): string {
  return `
    <footer class="receipt-close">
      <p class="thanks">شکریہ — Thank You!</p>
      <p class="visit">Please visit again</p>
      <p class="software">Software by AS CodeWorks</p>
      <p>© Provided for Madina Traders</p>
      <p>Contact: 0325-9055292</p>
    </footer>
  `;
}

export { escapeHtml };
