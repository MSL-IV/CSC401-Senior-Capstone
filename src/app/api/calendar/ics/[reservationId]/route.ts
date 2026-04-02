import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/utils/supabase/server";

function formatICSDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeICS(text: string) {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ reservationId: string }> },
) {
  const { reservationId } = await context.params;
  const supabase = await createServerClient();

  const { data: reservation, error } = await supabase
    .from("reservations")
    .select("reservation_id, machine, start, end")
    .eq("reservation_id", reservationId)
    .single();

  if (error || !reservation) {
    return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
  }

  const start = new Date(reservation.start);
  const end = new Date(reservation.end);

  const title = `${reservation.machine} Reservation`;
  const description = `Equipment reservation for ${reservation.machine}.`;
  const location = "Makerspace";
  const uid = `${reservation.reservation_id}@equipment-reservations`;

  const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Equipment Reservations//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${formatICSDate(new Date())}
DTSTART:${formatICSDate(start)}
DTEND:${formatICSDate(end)}
SUMMARY:${escapeICS(title)}
DESCRIPTION:${escapeICS(description)}
LOCATION:${escapeICS(location)}
END:VEVENT
END:VCALENDAR`;

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="reservation-${reservation.reservation_id}.ics"`,
    },
  });
}