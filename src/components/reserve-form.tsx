"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient as createBrowserClient } from "@/utils/supabase/client";
import {
  easternDateInputValue,
  formatInEastern,
  zonedDateToUtc,
} from "@/utils/time";

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

function generateSlots(
  day: string,
  openTime = "09:00:00",
  closeTime = "17:00:00",
  stepMinutes = 30
): Slot[] {
  const start = zonedDateToUtc(day, openTime);
  const end = zonedDateToUtc(day, closeTime);
  const step = Math.max(1, stepMinutes || 30);
  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end <= start
  ) {
    return [];
  }
  const maxIterations = Math.ceil((24 * 60) / step) + 1;
  const out: Slot[] = [];
  for (let cur = new Date(start); cur < end; ) {
    const next = new Date(cur.getTime() + stepMinutes * 60_000);
    if (next > end) break;
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
  const hasEquipment = equipment && equipment.length > 0;

  const [date, setDate] = useState(() => easternDateInputValue());
  const [machineId, setMachineId] = useState(() => equipment[0]?.id ?? "");
  const machine = useMemo(
    () => equipment.find((e) => e.id === machineId) ?? equipment[0] ?? null,
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
  const [machineReservations, setMachineReservations] = useState<
    { start: string; end: string }[]
  >([]);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [checkingTraining, setCheckingTraining] = useState(true);

  const supabase = useMemo(() => createBrowserClient(), []);

  const slots = useMemo(() => {
    if (!machine) return [];
    const step = machine.slotMinutes ?? 30;
    const open = machine.openTime ?? "09:00:00";
    const close = machine.closeTime ?? "17:00:00";
    return generateSlots(date, open, close, step);
  }, [date, machine]);

  const isPast = (s: Slot) =>
    date === easternDateInputValue() && s.end < new Date();

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
        if (!active) return;
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
            const dateLabel = formatInEastern(startDate, {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            const timeLabel = `${formatInEastern(startDate, {
              hour: "numeric",
              minute: "2-digit",
            })}${
              endDate
                ? ` - ${formatInEastern(endDate, {
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
    const checkTraining = async () => {
      setCheckingTraining(true);
      setIsAuthorized(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsAuthorized(false);
        setCheckingTraining(false);
        return;
      }

      // Query training table
      const { data, error } = await supabase
        .from("training_certificates")
        .select("expires_at")
        .eq("user_id", user.id)
        .eq("machine_name", machine?.name);

      if (error) {
        console.error("Training check error:", error);
        setIsAuthorized(false);
        setCheckingTraining(false);
        return;
      }

      if (!data || data.length === 0) {
        setIsAuthorized(false);
        setCheckingTraining(false);
        return;
      }

      // Training expiration check
      const cert = data[0];
      if (cert.expires_at && new Date(cert.expires_at) < new Date()) {
        setIsAuthorized(false);
      } else {
        setIsAuthorized(true);
      }

      setCheckingTraining(false);
    };

    if (machine) checkTraining();
  }, [machineId, machine]);

  useEffect(() => {
    const loadMachineReservations = async () => {
      if (!machine || !machineId || !date) return;

      const startOfDay = zonedDateToUtc(date, "00:00:00").toISOString();
      const endOfDay = zonedDateToUtc(date, "23:59:59").toISOString();

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
        setMachineReservations(
          (data as { start: string; end: string }[]) || []
        );
      }
    };

    loadMachineReservations();
  }, [machineId, date, supabase, machine]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (!date || !machineId || !selected || !machine) {
      setMessage("Please choose a date, equipment, and a time slot.");
      return;
    }

    setLoading(true);
    try {
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
        formatInEastern(d, { hour: "numeric", minute: "2-digit" });
      const fmtDate = (d: Date) =>
        formatInEastern(d, {
          month: "short",
          day: "numeric",
          year: "numeric",
        });

      setMessage(
        `✅ Reserved ${eqName} on ${fmtDate(selected.start)} from ${fmt(
          selected.start
        )} to ${fmt(selected.end)}`
      );
      if (inserted) {
        const insertedStart = new Date(inserted.start);
        const insertedEnd = inserted.end ? new Date(inserted.end) : null;
        const dateLabel = fmtDate(insertedStart);
        const timeLabel = `${fmt(insertedStart)}${
          insertedEnd ? ` - ${fmt(insertedEnd)}` : ""
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

  if (!hasEquipment) {
    return (
      <div className="text-sm text-gray-500">
        No equipment available yet. Please check back later.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Date</span>
          <input
            type="date"
            value={date}
            min={easternDateInputValue()}
            onChange={(e) => {
              const newDate = e.target.value;
              const day = new Date(newDate).getDay();

              if (day === 5 || day === 6) {
                setMessage("Reservations are not available on weekends.");
                return;
              }

              setDate(newDate);
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
              setMachineId(e.target.value);
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
      {isAuthorized === false && (
        <p className="text-red-600 text-sm mb-4">
          You are not authorized to use this machine. Complete required training
          first.
        </p>
      )}

      {checkingTraining && (
        <p className="text-gray-500 text-sm mb-4">Checking training status…</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {slots.map((s, i) => {
          const label = `${formatInEastern(s.start, {
            hour: "numeric",
            minute: "2-digit",
          })}–${formatInEastern(s.end, {
            hour: "numeric",
            minute: "2-digit",
          })}`;
          const overlapsExisting = machineReservations.some((r) => {
            const rStart = new Date(r.start);
            const rEnd = new Date(r.end);
            return s.start < rEnd && s.end > rStart;
          });

          const disabled =
            isPast(s) ||
            overlapsExisting ||
            checkingTraining ||
            isAuthorized === false;
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
        disabled={loading || isAuthorized === false || checkingTraining}
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
