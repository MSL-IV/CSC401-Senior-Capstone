const EASTERN_TZ = "America/New_York";

type DateInput = string | number | Date;

const pad = (value: number) => value.toString().padStart(2, "0");

const toDate = (value: DateInput) => (value instanceof Date ? value : new Date(value));

type DateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function parseTimeString(value: string) {
  const match = value.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return null;
  const [, hourStr, minuteStr, secondStr] = match;
  const hour = Number.parseInt(hourStr, 10);
  const minute = Number.parseInt(minuteStr, 10);
  const second = secondStr ? Number.parseInt(secondStr, 10) : 0;
  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    Number.isNaN(second) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59 ||
    second < 0 ||
    second > 59
  ) {
    return null;
  }
  return { hour, minute, second };
}

function parseDay(value: string) {
  const [yearStr, monthStr, dayStr] = value.split("-");
  const year = Number.parseInt(yearStr, 10);
  const month = Number.parseInt(monthStr, 10);
  const day = Number.parseInt(dayStr, 10);
  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }
  return { year, month, day };
}

// Extract components for a given time zone so we can calculate offsets and format dates consistently.
function getParts(date: Date, timeZone: string = EASTERN_TZ): DateParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const values: DateParts = {
    year: 0,
    month: 0,
    day: 0,
    hour: 0,
    minute: 0,
    second: 0,
  };

  for (const part of parts) {
    if (part.type === "year") values.year = Number(part.value);
    if (part.type === "month") values.month = Number(part.value);
    if (part.type === "day") values.day = Number(part.value);
    if (part.type === "hour") values.hour = Number(part.value);
    if (part.type === "minute") values.minute = Number(part.value);
    if (part.type === "second") values.second = Number(part.value);
  }

  return values;
}

function getTimeZoneOffset(date: Date, timeZone: string = EASTERN_TZ) {
  const parts = getParts(date, timeZone);
  const asUTC = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
  return (asUTC - date.getTime()) / 60000; // minutes
}

export function formatInEastern(
  value: DateInput,
  options?: Intl.DateTimeFormatOptions
) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: EASTERN_TZ,
    ...options,
  }).format(toDate(value));
}

export function easternDateInputValue(value: DateInput = new Date()) {
  const parts = getParts(toDate(value), EASTERN_TZ);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

// Convert an Eastern local date/time into a real UTC Date instance.
export function zonedDateToUtc(
  day: string,
  time: string,
  timeZone: string = EASTERN_TZ
) {
  const dateParts = parseDay(day);
  const timeParts = parseTimeString(time);
  if (!dateParts || !timeParts) return new Date(NaN);
  const utcGuess = Date.UTC(
    dateParts.year,
    dateParts.month - 1,
    dateParts.day,
    timeParts.hour,
    timeParts.minute,
    timeParts.second
  );
  const utcDate = new Date(utcGuess);
  const offsetMinutes = getTimeZoneOffset(utcDate, timeZone);
  return new Date(utcGuess - offsetMinutes * 60_000);
}

export function isSameEasternDay(a: DateInput, b: DateInput) {
  return easternDateInputValue(a) === easternDateInputValue(b);
}

export { EASTERN_TZ };
