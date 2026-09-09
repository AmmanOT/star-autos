/** Self-contained print CSS — do not rely on Tailwind in the iframe. */
const RECEIPT_PRINT_CSS = `
  @page { size: 72.1mm auto; margin: 0; }
  *, *::before, *::after { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: #fff;
    width: 72.1mm;
    height: auto;
    overflow: visible;
    color: #000;
    font-family: Arial, Helvetica, sans-serif;
  }
  .thermal-receipt {
    display: block;
    width: 72.1mm;
    max-width: 72.1mm;
    margin: 0;
    padding: 0;
    color: #000;
    font-weight: 500;
    background: #fff;
  }
  .receipt-top-spacer, .receipt-bottom-spacer { height: 8mm; }
  .receipt-rule {
    border-top: 1px dashed #000;
    margin: 4px 6px;
    height: 0;
  }
  .receipt-header, .receipt-thanks, .receipt-footer { text-align: center; }
  .receipt-header { padding: 0 6px 6px; }
  .receipt-header p { margin: 0; }
  .receipt-header p:first-child {
    font-weight: 700;
    font-size: 15px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    line-height: 1.2;
  }
  .receipt-header p:nth-child(2) { font-size: 11px; margin-top: 4px; }
  .receipt-header p:nth-child(3) { font-size: 11px; margin-top: 8px; line-height: 1.35; }
  .receipt-header p:nth-child(4) { font-size: 11px; font-weight: 700; margin-top: 4px; }
  .receipt-meta, .receipt-totals { padding: 6px; font-size: 11px; }
  .receipt-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
    margin: 3px 0;
  }
  .receipt-label { flex: 0 0 auto; }
  .receipt-value { flex: 1 1 auto; text-align: right; word-break: break-word; }
  .receipt-total-row {
    border-top: 1px solid #000;
    padding-top: 5px;
    margin-top: 4px;
    font-weight: 700;
  }
  .receipt-grid {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    font-size: 10px;
    border: 1px solid #000;
    display: table;
  }
  .receipt-grid thead { display: table-header-group; }
  .receipt-grid tbody { display: table-row-group; }
  .receipt-grid tr { display: table-row; }
  .receipt-grid th, .receipt-grid td {
    display: table-cell;
    border: 1px solid #000;
    padding: 3px 2px;
    vertical-align: top;
    word-wrap: break-word;
    overflow-wrap: anywhere;
  }
  .receipt-grid th { font-weight: 700; text-align: center; }
  .col-sr { width: 7%; text-align: center; }
  .col-item { width: 30%; text-align: left; }
  .col-brand { width: 17%; text-align: center; }
  .col-qty { width: 10%; text-align: center; }
  .col-rate, .col-amt { width: 18%; text-align: right; }
  .receipt-thanks p { margin: 0; padding: 2px 6px; }
  .receipt-thanks p:first-child { font-size: 12px; font-weight: 700; padding-top: 8px; }
  .receipt-thanks p:last-child { font-size: 11px; padding-bottom: 8px; }
  .receipt-footer { padding: 8px 6px 4px; }
  .receipt-footer p { margin: 0; font-size: 10px; }
  .receipt-footer p:first-child {
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
`;

/**
 * Print only the thermal receipt.
 * window.print() on the billing page paginates the hidden app (min-h-screen)
 * and a position:fixed receipt repeats on every page — thermal rolls then
 * feed forever. An iframe whose body is just the receipt stops at receipt height.
 */
export function printThermalReceipt() {
  const source = document.querySelector('.thermal-receipt');
  if (!source) return;

  const prev = document.getElementById('thermal-print-frame');
  prev?.remove();

  const iframe = document.createElement('iframe');
  iframe.id = 'thermal-print-frame';
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText =
    'position:fixed;left:0;top:0;width:72.1mm;height:1px;border:0;opacity:0;pointer-events:none;';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc || !win) {
    iframe.remove();
    return;
  }

  doc.open();
  doc.write(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Receipt</title><style>${RECEIPT_PRINT_CSS}</style></head><body></body></html>`,
  );
  doc.close();
  doc.body.appendChild(source.cloneNode(true));

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    iframe.remove();
  };
  win.addEventListener('afterprint', cleanup);
  window.setTimeout(() => {
    win.focus();
    win.print();
  }, 250);
  window.setTimeout(cleanup, 60_000);
}
