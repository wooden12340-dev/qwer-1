/**
 * Returns yesterday's date in YYYY-MM-DD format based on local time.
 * Daily box office statistics are finalized for dates strictly prior to today.
 */
export function getYesterdayDateInputString(): string {
  const now = new Date();
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  return formatDateToInput(yesterday);
}

export function formatDateToInput(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function inputDateToTargetDt(dateStr: string): string {
  return dateStr.replace(/-/g, '');
}

export function targetDtToInputDate(targetDt: string): string {
  if (targetDt.length !== 8) return targetDt;
  return `${targetDt.slice(0, 4)}-${targetDt.slice(4, 6)}-${targetDt.slice(6, 8)}`;
}

export function shiftDateInputString(dateStr: string, deltaDays: number, maxDateStr: string): string {
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return maxDateStr;
  const d = new Date(parts[0], parts[1] - 1, parts[2] + deltaDays);
  const shifted = formatDateToInput(d);
  if (shifted > maxDateStr) return maxDateStr;
  if (shifted < '2004-01-01') return '2004-01-01';
  return shifted;
}

export function formatKoreanDateLabel(dateStr: string): string {
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return dateStr;
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const dayOfWeek = weekdays[date.getDay()];
  return `${parts[0]}년 ${parts[1]}월 ${parts[2]}일 (${dayOfWeek})`;
}

export function formatOpenDt(openDt: string): string {
  if (!openDt || openDt.trim() === '') return '개봉일 미정';
  const cleaned = openDt.replace(/[^0-9]/g, '');
  if (cleaned.length === 8) {
    return `${cleaned.slice(0, 4)}.${cleaned.slice(4, 6)}.${cleaned.slice(6, 8)}`;
  }
  return openDt;
}

export function formatNumber(val: string | number | undefined): string {
  if (val === undefined || val === null || val === '') return '0';
  const num = typeof val === 'number' ? val : Number(val);
  if (isNaN(num)) return String(val);
  return num.toLocaleString('ko-KR');
}

export function formatCompactWon(val: string | number | undefined): string {
  const num = typeof val === 'number' ? val : Number(val || 0);
  if (isNaN(num) || num === 0) return '0원';
  if (num >= 100_000_000) {
    const eok = num / 100_000_000;
    return `${eok.toFixed(eok >= 100 ? 0 : 1)}억 원`;
  }
  if (num >= 10_000) {
    const man = Math.round(num / 10_000);
    return `${man.toLocaleString('ko-KR')}만 원`;
  }
  return `${num.toLocaleString('ko-KR')}원`;
}

export function formatCompactAudience(val: string | number | undefined): string {
  const num = typeof val === 'number' ? val : Number(val || 0);
  if (isNaN(num) || num === 0) return '0명';
  if (num >= 10_000) {
    const man = num / 10_000;
    return `${man.toFixed(man >= 100 ? 1 : 2)}만 명`;
  }
  return `${num.toLocaleString('ko-KR')}명`;
}
