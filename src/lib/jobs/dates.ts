const ETHIOPIAN_EPOCH_JDN = 1724221;

const MONTHS: Record<string, number> = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sep: 9,
  sept: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
};

const ETHIOPIAN_MONTHS: Record<string, number> = {
  meskerem: 1,
  መስከረም: 1,
  tikimt: 2,
  ጥቅምት: 2,
  hidar: 3,
  ሕዳር: 3,
  ኅዳር: 3,
  tahsas: 4,
  ታህሳስ: 4,
  ታኅሣሥ: 4,
  tir: 5,
  ጥር: 5,
  yekatit: 6,
  የካቲት: 6,
  megabit: 7,
  መጋቢት: 7,
  miazia: 8,
  ሚያዝያ: 8,
  ginbot: 9,
  ግንቦት: 9,
  sene: 10,
  ሰኔ: 10,
  hamle: 11,
  ሐምሌ: 11,
  nehase: 12,
  ነሐሴ: 12,
  pagume: 13,
  ጳጉሜ: 13,
};

export function gregorianToJdn(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

export function jdnToGregorian(jdn: number): { year: number; month: number; day: number } {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = 100 * b + d - 4800 + Math.floor(m / 10);
  return { year, month, day };
}

function daysSinceEthiopianEpoch(year: number, month: number, day: number): number {
  const yearsBefore = year - 1;
  const leaps = yearsBefore >= 3 ? Math.floor((yearsBefore - 3) / 4) + 1 : 0;
  return yearsBefore * 365 + leaps + (month - 1) * 30 + (day - 1);
}

export function ethiopianToGregorian(
  year: number,
  month: number,
  day: number,
): { year: number; month: number; day: number } {
  const leap = year % 4 === 3;
  const maxDay = month === 13 ? (leap ? 6 : 5) : 30;
  if (month < 1 || month > 13 || day < 1 || day > maxDay) {
    throw new Error(`Invalid Ethiopian date ${year}-${month}-${day}`);
  }
  return jdnToGregorian(ETHIOPIAN_EPOCH_JDN + daysSinceEthiopianEpoch(year, month, day));
}

export function toIsoDate(year: number, month: number, day: number): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)}`;
}

function validGregorian(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > 2100) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

function looksEthiopian(window: string): boolean {
  return /ዓ\.?\s*ም|ዓ\/ም|\bE\.?\s?C\.?\b|ethiopian calendar/i.test(window);
}

export function parseDateToken(token: string, ethiopian = false): string | null {
  const cleaned = token.normalize("NFC").trim().replace(/,/g, "");
  const iso = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso && !ethiopian) {
    const year = Number(iso[1]);
    const month = Number(iso[2]);
    const day = Number(iso[3]);
    return validGregorian(year, month, day) ? toIsoDate(year, month, day) : null;
  }

  const numeric = cleaned.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (numeric) {
    const day = Number(numeric[1]);
    const month = Number(numeric[2]);
    const year = Number(numeric[3]);
    if (ethiopian || (looksEthiopian(cleaned) && year < 2021)) {
      try {
        const gregorian = ethiopianToGregorian(year, month, day);
        return toIsoDate(gregorian.year, gregorian.month, gregorian.day);
      } catch {
        return null;
      }
    }
    return validGregorian(year, month, day) ? toIsoDate(year, month, day) : null;
  }

  const dmy = cleaned.match(/^(\d{1,2})\s+([^\d\s]+)\s+(\d{4})$/i);
  const mdy = cleaned.match(/^([^\d\s]+)\s+(\d{1,2})\s+(\d{4})$/i);
  if (dmy || mdy) {
    const day = Number(dmy ? dmy[1] : mdy?.[2]);
    const monthName = (dmy ? dmy[2] : (mdy?.[1] ?? "")).toLowerCase();
    const year = Number(dmy ? dmy[3] : mdy?.[3]);
    const ethMonth = ETHIOPIAN_MONTHS[monthName];
    if (ethMonth) {
      try {
        const gregorian = ethiopianToGregorian(year, ethMonth, day);
        return toIsoDate(gregorian.year, gregorian.month, gregorian.day);
      } catch {
        return null;
      }
    }
    const month = MONTHS[monthName];
    if (!month) return null;
    return validGregorian(year, month, day) ? toIsoDate(year, month, day) : null;
  }

  return null;
}

const DATE_PATTERN =
  /(\d{4}-\d{1,2}-\d{1,2}|\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{4}|\d{1,2}\s+[A-Za-z\u1200-\u137F.]+\s+\d{4}|[A-Za-z]+\s+\d{1,2},?\s+\d{4})/;

export function parseDateInText(text: string): string | null {
  const match = text.normalize("NFC").match(DATE_PATTERN);
  if (!match) return null;
  const window = text.slice(
    Math.max(0, (match.index ?? 0) - 24),
    (match.index ?? 0) + match[0].length + 16,
  );
  return parseDateToken(match[0], looksEthiopian(window));
}

const DEADLINE_KEYWORD = /deadline|closing date|close date|apply by|due date|የመጨረሻ ቀን|መጨረሻ ቀን/i;

export function parseDeadlineFromText(text: string): string | null {
  const match = DEADLINE_KEYWORD.exec(text);
  if (!match || match.index === undefined) return null;
  return parseDateInText(text.slice(match.index, match.index + 90));
}
