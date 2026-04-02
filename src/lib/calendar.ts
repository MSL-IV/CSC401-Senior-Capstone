export function formatGoogleDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export function buildGoogleCalendarUrl({
  title,
  description,
  location,
  start,
  end,
}: {
  title: string;
  description: string;
  location: string;
  start: Date;
  end: Date;
}) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    details: description,
    location,
    dates: `${formatGoogleDate(start)}/${formatGoogleDate(end)}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildOutlookCalendarUrl({
  title,
  description,
  location,
  start,
  end,
}: {
  title: string;
  description: string;
  location: string;
  start: Date;
  end: Date;
}) {
  const params = new URLSearchParams({
    subject: title,
    body: description,
    location,
    startdt: start.toISOString(),
    enddt: end.toISOString(),
  });

  return `https://outlook.office.com/calendar/0/deeplink/compose?${params.toString()}`;
}