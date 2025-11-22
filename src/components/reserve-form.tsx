"use client";

import { useMemo, useState } from "react";

type Equip = { id: string; name: string; slotMinutes: number };
type Slot = { start: Date; end: Date };

function toISODate(d: Date) {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
}

function generateSlots(
  day: string,
  open = "09:00",
  close = "21:00",
  stepMinutes = 30
): Slot[] {
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

  const slots = useMemo(() => {
    const step = machine?.slotMinutes ?? 30;
    return generateSlots(date, "09:00", "21:00", step);
  }, [date, machine]);

  const now = new Date();
  const isPast = (s: Slot) => s.end < now && date === toISODate(now);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !machineId || !selected) {
      setMessage("Please choose a date, equipment, and a time slot.");
      return;
    }
    const eqName = equipment.find((e) => e.id === machineId)?.name ?? machineId;
    const fmt = (d: Date) =>
      d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    setMessage(
      `Selected: ${date} • ${fmt(selected.start)}–${fmt(
        selected.end
      )} • ${eqName}`
    );
    console.log({
      date,
      machineId,
      start: selected.start.toISOString(),
      end: selected.end.toISOString(),
    });
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
        RESERVE
      </button>

      {message && <p className="text-sm">{message}</p>}

      <section className="pt-4">
        <h2 className="text-lg font-semibold">Your Reservations</h2>
        <p className="text-sm text-gray-600">Coming soon…</p>
      </section>
    </form>
  );
}
