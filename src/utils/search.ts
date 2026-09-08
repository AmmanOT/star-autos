/** Every whitespace-separated word must appear somewhere in the fields (any order). */
export function matchesSearch(query: string, ...fields: Array<string | null | undefined>): boolean {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = fields.map((f) => (f ?? '').toLowerCase()).join(' ');
  return words.every((word) => haystack.includes(word));
}

export function productMatchesSearch(
  query: string,
  p: { name: string; nameUrdu: string; partNumber: string; companyNumber: string; brand: string },
): boolean {
  return matchesSearch(query, p.name, p.nameUrdu, p.partNumber, p.companyNumber, p.brand);
}
