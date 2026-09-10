export function formatPKR(amount: number): string {
  return `Rs. ${amount.toLocaleString('en-PK')}`;
}

const PK_TZ = 'Asia/Karachi';

/** Calendar date in Pakistan (YYYY-MM-DD), used so "today" matches shop time. */
export function pkDateKey(date: Date | string = new Date()): string {
  return new Date(date).toLocaleDateString('en-CA', { timeZone: PK_TZ });
}

export function formatDate(dateStr: string, lang: 'en' | 'ur' = 'en'): string {
  const d = new Date(dateStr);
  return d.toLocaleString(lang === 'ur' ? 'ur-PK' : 'en-PK', {
    timeZone: PK_TZ,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-PK', {
    timeZone: PK_TZ,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function generateBillNumber(): string {
  const year = new Date().getFullYear();
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `INV-${year}-${num}`;
}

export function whatsappBillLink(phone: string, billText: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  const pkPhone = cleanPhone.startsWith('92') ? cleanPhone : `92${cleanPhone.replace(/^0/, '')}`;
  return `https://wa.me/${pkPhone}?text=${encodeURIComponent(billText)}`;
}

export function buildBillWhatsAppText(
  shopName: string,
  billNumber: string,
  items: { name: string; qty: number; total: number }[],
  total: number,
  paid: number,
  due: number,
): string {
  const lines = [
    `🧾 *${shopName}*`,
    `Bill: ${billNumber}`,
    '---',
    ...items.map((i, n) => `${n + 1}. ${i.name} x${i.qty} = Rs.${i.total.toLocaleString()}`),
    '---',
    `*Total: Rs.${total.toLocaleString()}*`,
    `Paid: Rs.${paid.toLocaleString()}`,
    due > 0 ? `Due: Rs.${due.toLocaleString()}` : '✅ Fully Paid',
    '',
    'شکریہ / Thank you!',
  ];
  return lines.join('\n');
}

export function getMonthYear(dateStr: string) {
  const d = new Date(dateStr);
  return { month: d.getMonth(), year: d.getFullYear() };
}

export function isLowStock(qty: number, min: number) {
  return qty <= min;
}
