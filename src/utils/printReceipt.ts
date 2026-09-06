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
  doc.write('<!DOCTYPE html><html><head><title>Receipt</title></head><body></body></html>');
  doc.close();

  document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
    doc.head.appendChild(node.cloneNode(true));
  });

  const override = doc.createElement('style');
  override.textContent = `
    @page { size: 72.1mm auto; margin: 0; }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #fff !important;
      width: 72.1mm !important;
      height: auto !important;
      min-height: 0 !important;
      overflow: visible !important;
    }
    body * { display: revert !important; visibility: visible !important; }
    .thermal-receipt {
      display: block !important;
      position: static !important;
      left: auto !important;
      top: auto !important;
      width: 72.1mm !important;
      max-width: 72.1mm !important;
      margin: 0 !important;
      box-shadow: none !important;
    }
    .thermal-receipt table { display: table !important; }
    .thermal-receipt thead { display: table-header-group !important; }
    .thermal-receipt tbody { display: table-row-group !important; }
    .thermal-receipt tr { display: table-row !important; }
    .thermal-receipt th, .thermal-receipt td { display: table-cell !important; }
  `;
  doc.head.appendChild(override);
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
  }, 80);
  window.setTimeout(cleanup, 60_000);
}
