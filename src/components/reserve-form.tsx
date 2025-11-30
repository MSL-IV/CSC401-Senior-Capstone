"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient as createBrowserClient } from "@/utils/supabase/client";

type Equip = {
  id: string;
  name: string;
  slotMinutes: number;
  openTime: string;
  closeTime: string;
};
type Slot = { start: Date; end: Date };

type ReservationItem = {
  id: string;
  title: string;
  date: string;
  time: string;
};

function toISODate(d: Date) {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
}

function generateSlots(
  day: string,
  openTime = "09:00:00",
  closeTime = "21:00:00",
  stepMinutes = 30
): Slot[] {
  const open = openTime.slice(0, 5);
  const close = closeTime.slice(0, 5);

  const start = new Date(`${day}T${open}:00`);
  const end = new Date(`${day}T${close}:00`);
  const out: Slot[] = [];
  for (let cur = new Date(start); cur < end; ) {
    const next = new Date(cur.getTime() + stepMinutes * 60_000);
    out.push({ start: new Date(cur), end: next });
    cur = next;
  }
  return out;
}

export default function ReserveForm({
  equipment = [],
  onReservationCreated,
}: {
  equipment?: Equip[];
  onReservationCreated?: () => void;
}) {
  if (!equipment || equipment.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        No equipment available yet. Please check back later.
      </div>
    );
  }
  const [date, setDate] = useState(toISODate(new Date()));
  const [machineId, setMachineId] = useState(() => equipment[0]?.id ?? "");

  const machine = useMemo(
    () => equipment.find((e) => e.id === machineId) ?? equipment[0],
    [machineId, equipment]
  );

  const [selected, setSelected] = useState<Slot | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [reservationsLoading, setReservationsLoading] = useState(true);
  const [reservationsError, setReservationsError] = useState<string | null>(
    null
  );
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [machineReservations, setMachineReservations] = useState<any[]>([]);
  const supabase = useMemo(() => createBrowserClient(), []);

  const slots = useMemo(() => {
    const step = machine?.slotMinutes ?? 30;
    const open = machine?.openTime ?? "09:00:00";
    const close = machine?.closeTime ?? "21:00:00";
    return generateSlots(date, open, close, step);
  }, [date, machine]);

  const now = new Date();
  const isPast = (s: Slot) => s.end < now && date === toISODate(now);

  useEffect(() => {
    let active = true;
    const loadReservations = async () => {
      setReservationsLoading(true);
      setReservationsError(null);
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        setReservations([]);
        setReservationsLoading(false);
        setReservationsError(null);
        return;
      }

      const { data, error } = await supabase
        .from("reservations")
        .select("reservation_id, machine, start, end")
        .eq("user_id", user.id)
        .order("start", { ascending: false })
        .limit(10);

      if (!active) return;

      if (error) {
        setReservationsError("Unable to load reservations right now.");
        setReservations([]);
      } else {
        const mapped =
          data?.map((res) => {
            const startDate = new Date(res.start as string);
            const endDate = res.end ? new Date(res.end as string) : null;
            const dateLabel = startDate.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            const timeLabel = `${startDate.toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            })}${
              endDate
                ? ` - ${endDate.toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}`
                : ""
            }`;
            return {
              id: String(
                res.reservation_id ?? res.start ?? crypto.randomUUID()
              ),
              title: res.machine ?? "Reservation",
              date: dateLabel,
              time: timeLabel,
            } satisfies ReservationItem;
          }) ?? [];
        setReservations(mapped);
      }
      setReservationsLoading(false);
    };

    loadReservations();

    return () => {
      active = false;
    };
  }, [supabase]);
  useEffect(() => {
    const loadMachineReservations = async () => {
      if (!machineId || !date) return;

      const startOfDay = `${date}T00:00:00`;
      const endOfDay = `${date}T23:59:59`;

      const { data, error } = await supabase
        .from("reservations")
        .select("start, end")
        .eq("machine", machine.name) // machine stored as name in DB
        .gte("start", startOfDay)
        .lte("start", endOfDay);

      if (error) {
        console.error("Error loading machine reservations:", error);
        setMachineReservations([]);
      } else {
        setMachineReservations(data || []);
      }
    };

    loadMachineReservations();
  }, [machineId, date]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (!date || !machineId || !selected || !machine) {
      setMessage("Please choose a date, equipment, and a time slot.");
      return;
    }

    setLoading(true);
    try {
      // Get the logged-in user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setMessage("You must be logged in to make a reservation.");
        return;
      }

      const startISO = selected.start.toISOString();
      const endISO = selected.end.toISOString();
      const duration = machine.slotMinutes;
      const eqName =
        equipment.find((e) => e.id === machineId)?.name ?? machineId;

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, email")
        .eq("id", user.id)
        .single();

      const displayName =
        profile?.first_name || profile?.last_name
          ? `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim()
          : (user.user_metadata?.full_name as string | undefined) ||
            (user.user_metadata?.first_name as string | undefined) ||
            user.email;

      const email = profile?.email ?? user.email ?? null;

      const { data: inserted, error } = await supabase
        .from("reservations")
        .insert([
          {
            user_id: user.id,
            machine: eqName,
            start: startISO,
            end: endISO,
            duration,
            name: displayName || null,
            email,
          },
        ])
        .select("reservation_id, machine, start, end")
        .single();

      if (error) {
        console.error("Insert error:", error);

        if (
          error.message?.includes("reservations_no_overlap") ||
          error.details?.includes("reservations_no_overlap")
        ) {
          setMessage(
            "That time slot is already booked for this machine. Please choose another time."
          );
          return;
        }

        setMessage(`Failed to create reservation: ${error.message}`);
        return;
      }

      const fmt = (d: Date) =>
        d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

      setMessage(
        `✅ Reserved ${eqName} on ${date} from ${fmt(selected.start)} to ${fmt(
          selected.end
        )}`
      );
      if (inserted) {
        const insertedStart = new Date(inserted.start);
        const insertedEnd = inserted.end ? new Date(inserted.end) : null;
        const dateLabel = insertedStart.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        const timeLabel = `${insertedStart.toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        })}${
          insertedEnd
            ? ` - ${insertedEnd.toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}`
            : ""
        }`;

        setReservations((prev) => [
          {
            id: String(
              inserted.reservation_id ?? inserted.start ?? crypto.randomUUID()
            ),
            title: inserted.machine ?? eqName,
            date: dateLabel,
            time: timeLabel,
          },
          ...prev,
        ]);
        onReservationCreated?.();
      }
      setSelected(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Date</span>
          <input
            type="date"
            value={date}
            min={toISODate(new Date())}
            onChange={(e) => {
              setDate(e.target.value);
              setSelected(null);
              setMessage("");
            }}
            className="rounded-md border p-2"
          />
        </label>

        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-sm font-medium">Reserve</span>
          <select
            value={machineId}
            onChange={(e) => {
              const newDate = e.target.value;
              const day = new Date(newDate).getDay();

              if (day === 0 || day === 6) {
                setMessage("Reservations are not available on weekends.");
                return;
              }

              setDate(newDate);
              setSelected(null);
              setMessage("");
            }}
            className="rounded-md border p-2"
          >
            {equipment.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.slotMinutes} min)
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {slots.map((s, i) => {
          const label = `${s.start.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          })}–${s.end.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          })}`;
          const overlapsExisting = machineReservations.some((r) => {
            const rStart = new Date(r.start);
            const rEnd = new Date(r.end);
            return s.start < rEnd && s.end > rStart;
          });

          const disabled = isPast(s) || overlapsExisting;
          const isActive =
            selected &&
            selected.start.getTime() === s.start.getTime() &&
            selected.end.getTime() === s.end.getTime();
          return (
            <button
              type="button"
              key={i}
              disabled={disabled}
              onClick={() => setSelected(s)}
              className={`rounded border px-3 py-2 text-sm transition
                ${
                  disabled
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-black/5"
                }
                ${isActive ? "ring-2 ring-blue-600 bg-blue-50" : ""}
              `}
              title={disabled ? "Past time" : "Select slot"}
            >
              {label}
            </button>
          );
        })}
      </div>

      <button
        type="submit"
        className="rounded-lg px-4 py-2 text-sm font-semibold text-white shadow transition hover:brightness-90"
        style={{
          backgroundColor: "var(--primary)",
          boxShadow: "var(--shadow-soft)",
        }}
      >
        {loading ? "Reserving…" : "RESERVE"}
      </button>

      {message && <p className="text-sm">{message}</p>}
    </form>
  );
}
