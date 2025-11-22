"use client";

import { useMemo, useState } from "react";
import { createClient as createBrowserClient } from "@/utils/supabase/client";

type Equip = {
  id: string;
  name: string;
  slotMinutes: number;
  openTime: string;
  closeTime: string;
};
type Slot = { start: Date; end: Date };

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
}: {
  equipment?: Equip[];
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

  const slots = useMemo(() => {
    const step = machine?.slotMinutes ?? 30;
    const open = machine?.openTime ?? "09:00:00";
    const close = machine?.closeTime ?? "21:00:00";
    return generateSlots(date, open, close, step);
  }, [date, machine]);

  const now = new Date();
  const isPast = (s: Slot) => s.end < now && date === toISODate(now);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (!date || !machineId || !selected || !machine) {
      setMessage("Please choose a date, equipment, and a time slot.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createBrowserClient();

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

      const { error } = await supabase.from("reservations").insert([
        {
          user_id: user.id, // uuid from auth
          machine: eqName, // matches your 'machine' text column
          start: startISO,
          end: endISO,
          duration, // int4
          // you can add name/email later once you join profiles
        },
      ]);

      if (error) {
        console.error("Insert error:", error);
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

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {slots.map((s, i) => {
          const label = `${s.start.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          })}–${s.end.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          })}`;
          const disabled = isPast(s);
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

      <section className="pt-4">
        <h2 className="text-lg font-semibold">Your Reservations</h2>
        <p className="text-sm text-gray-600">Coming soon…</p>
      </section>
    </form>
  );
}
