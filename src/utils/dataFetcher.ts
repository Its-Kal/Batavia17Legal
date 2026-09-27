// Utility placeholder — Data fetcher for Google Sheets CSV
// In production: implement actual fetch + parse logic

export interface CsvRow {
  [key: string]: string;
}

export async function fetchCsv(url: string): Promise<CsvRow[]> {
  // Placeholder — would use fetch + parseCSV in production
  return [];
}

export function parseCsv(raw: string): CsvRow[] {
  const lines = raw.trim().split('\n');
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(',').map(v => v.trim());
    return headers.reduce((acc, h, i) => {
      acc[h] = values[i] ?? '';
      return acc;
    }, {} as CsvRow);
  });
}
