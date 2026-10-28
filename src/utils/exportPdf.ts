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

const A4_CSS = `
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    color: #0a2342;
    background: #f4f6f9;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 12px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .sheet { background: #fff; padding: 0 0 8px; }
  .brand-header {
    display: flex;
    align-items: center;
    gap: 18px;
    background: linear-gradient(135deg, #040d1a 0%, #0a2342 55%, #1e3a5f 100%);
    color: #fff;
    padding: 16px 18px 14px;
    border-bottom: 6px solid #c8102e;
  }
  .brand-logo {
    width: 92px;
    height: 92px;
    object-fit: contain;
    background: #fff;
    border-radius: 16px;
    padding: 8px;
    flex-shrink: 0;
  }
  .brand-copy h1 {
    margin: 0;
    font-size: 22px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
  .brand-copy .tag {
    margin: 4px 0 8px;
    color: #f4c430;
    font-size: 11px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    font-weight: 700;
  }
  .brand-copy p { margin: 3px 0 0; font-size: 11px; color: #d5dee9; }
  .sheet-title {
    margin-top: 10px !important;
    color: #fff !important;
    font-size: 15px !important;
    font-weight: 700;
  }
  .meta-chip {
    display: inline-block;
    margin-top: 8px;
    background: #c8102e;
    color: #fff;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
  }
  .invoices { padding: 14px 14px 6px; }
  .invoice {
    margin: 0 0 14px;
    border: 2px solid #1e3a5f;
    border-radius: 10px;
    overflow: hidden;
    page-break-inside: avoid;
  }
  .invoice:nth-child(4n+1) { border-color: #0a2342; }
  .invoice:nth-child(4n+2) { border-color: #0e7490; }
  .invoice:nth-child(4n+3) { border-color: #c8102e; }
  .invoice:nth-child(4n+4) { border-color: #b45309; }
  .invoice-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    color: #fff;
    font-weight: 700;
  }
  .invoice:nth-child(4n+1) .invoice-head { background: #0a2342; }
  .invoice:nth-child(4n+2) .invoice-head { background: #0e7490; }
  .invoice:nth-child(4n+3) .invoice-head { background: #c8102e; }
  .invoice:nth-child(4n+4) .invoice-head { background: #b45309; }
  .invoice-head .bill-no { font-size: 14px; letter-spacing: 0.04em; }
  .invoice-head .bill-date { font-size: 11px; opacity: 0.92; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 6px 8px; vertical-align: top; border-bottom: 1px solid #d5dee9; }
  th { background: #eef2f7; color: #0a2342; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; text-align: left; }
  td.num, th.num { text-align: right; white-space: nowrap; }
  tbody tr:nth-child(even) { background: #f8fafc; }
  tbody tr:nth-child(odd) { background: #fff; }
  .invoice-total {
    display: flex;
    justify-content: space-between;
    padding: 8px 12px;
    background: #eef2f7;
    font-weight: 700;
    color: #0a2342;
  }
  .total-box {
    margin: 8px 14px 14px;
    border-radius: 10px;
    padding: 14px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 16px;
    font-weight: 800;
    color: #fff;
    background: linear-gradient(90deg, #c8102e 0%, #a50d25 100%);
    letter-spacing: 0.04em;
  }
  .receipt-close {
    margin: 4px 14px 12px;
    padding: 14px 12px 12px;
    text-align: center;
    border-top: 2px dashed #1e3a5f;
  }
  .receipt-close .thanks {
    margin: 0;
    font-size: 14px;
    font-weight: 800;
    color: #0a2342;
  }
  .receipt-close .visit {
    margin: 4px 0 10px;
    font-size: 12px;
    color: #4d6d8c;
  }
  .receipt-close .software {
    margin: 0;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #c8102e;
  }
  .receipt-close p {
    margin: 2px 0 0;
    font-size: 10px;
    color: #1e3a5f;
  }
  .stock-wrap { padding: 14px; }
  .stock-wrap table { border: 1px solid #aabccc; border-radius: 8px; overflow: hidden; }
  .stock-wrap th { background: #0a2342; color: #fff; }
  .stock-wrap tbody tr:nth-child(even) { background: #eef2f7; }
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
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>${A4_CSS}</style></head><body><div class="sheet">${bodyHtml}</div></body></html>`,
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

export function brandedHeader(
  shop: string,
  address: string,
  phone: string,
  title: string,
  extraHtml = '',
): string {
  return `
    <header class="brand-header">
      <img class="brand-logo" src="${brandLogoUrl()}" alt="${escapeHtml(shop)}" />
      <div class="brand-copy">
        <h1>${escapeHtml(shop)}</h1>
        <p class="tag">Auto Spare Parts</p>
        <p>${escapeHtml(address)} · ${escapeHtml(phone)}</p>
        <p class="sheet-title">${escapeHtml(title)}</p>
        ${extraHtml}
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
