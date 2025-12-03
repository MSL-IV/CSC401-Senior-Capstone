"use client";

<<<<<<< Updated upstream
import { useMemo, useState } from "react";
=======
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { easternDateInputValue, formatInEastern } from "@/utils/time";
>>>>>>> Stashed changes

type EquipmentStatus = "available" | "unavailable";

type EquipmentItem = {
  id: string;
  name: string;
  type: string;

  status: EquipmentStatus;
  hoursUsedThisWeek: number;
  maintenanceNote?: string;
};

type ActiveReservation = {
  id: string;
  equipmentName: string;
  userName: string;
  userEmail: string;
  startedAt: string;
  expectedEnd: string;
  status: "on-time" | "overdue";
};

const defaultEquipment: EquipmentItem[] = [
  {
    id: "eq-001",
    name: "Formlabs 3L",
    type: "3D Printer",
    status: "available",
    hoursUsedThisWeek: 18,
  },
  {
    id: "eq-002",
    name: "Universal Laser Systems",
    type: "Laser Cutter",
    status: "unavailable",
    hoursUsedThisWeek: 24,
    maintenanceNote: "Replacing exhaust filters",
  },
  {
    id: "eq-003",
    name: "FlashForge Creator 4",
    type: "3D Printer",
    status: "available",
    hoursUsedThisWeek: 12,
  },
  {
    id: "eq-004",
    name: "Roland MDX-50",
    type: "CNC Mill",
    status: "unavailable",
    hoursUsedThisWeek: 9,
    maintenanceNote: "Awaiting safety inspection",
  },
  {
    id: "eq-005",
    name: "Epilog Fusion Edge",
    type: "Laser Cutter",
    status: "available",
    hoursUsedThisWeek: 20,
  },
];

const defaultReservations: ActiveReservation[] = [
  {
    id: "res-001",
    equipmentName: "Formlabs 3L",
    userName: "Ryan Mitchell",
    userEmail: "ryan.mitchell@ut.edu",
    startedAt: "Today • 10:15 AM",
    expectedEnd: "12:45 PM",
    status: "on-time",
  },
  {
    id: "res-002",
    equipmentName: "Universal Laser Systems",
    userName: "Sofia Gutierrez",
    userEmail: "sofia.gutierrez@ut.edu",
    startedAt: "Today • 09:30 AM",
    expectedEnd: "11:00 AM",
    status: "overdue",
  },
  {
    id: "res-003",
    equipmentName: "Roland MDX-50",
    userName: "Kevin Zhou",
    userEmail: "kzhou@ut.edu",
    startedAt: "Today • 08:00 AM",
    expectedEnd: "01:00 PM",
    status: "on-time",
  },
];

export function EquipmentManagementPage() {
  const [equipment, setEquipment] = useState(defaultEquipment);
  const [reservations] = useState(defaultReservations);

  const summary = useMemo(() => {
    const total = equipment.length;
    const available = equipment.filter((item) => item.status === "available").length;
    return {
      total,
      available,
      unavailable: total - available,
    };
  }, [equipment]);

<<<<<<< Updated upstream
  const toggleEquipmentStatus = (id: string) => {
    setEquipment((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: item.status === "available" ? "unavailable" : "available",
            }
          : item,
      ),
=======
  const toggleEquipmentStatus = async (id: string) => {
    setUpdateLoading(id);
    try {
      const item = equipment.find(eq => eq.id === id);
      if (!item) return;

      const newActive = !item.active;
      
      const { error } = await supabase
        .from('machines')
        .update({ active: newActive })
        .eq('id', id);

      if (error) {
        setError('Failed to update machine status: ' + error.message);
        return;
      }

      // Update local state
      setEquipment(prev => 
        prev.map(item => 
          item.id === id ? { ...item, active: newActive } : item
        )
      );
    } catch (err) {
      setError('An unexpected error occurred while updating machine');
      console.error('Machine update error:', err);
    } finally {
      setUpdateLoading(null);
    }
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    const todayEastern = easternDateInputValue();
    const timeEasternDay = easternDateInputValue(date);

    const timeFormatted = formatInEastern(date, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    if (timeEasternDay === todayEastern) {
      return `Today • ${timeFormatted}`;
    }
    return `${formatInEastern(date, { month: 'short', day: 'numeric' })} • ${timeFormatted}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)] mx-auto mb-4"></div>
          <p>Loading equipment data...</p>
        </div>
      </div>
>>>>>>> Stashed changes
    );
  };

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: "var(--background)",
        color: "var(--text-primary)",
      }}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12">
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
            Admin / Equipment
          </p>
          <div>
            <h1 className="font-heading text-3xl font-bold md:text-4xl">
              Equipment & Reservations
            </h1>
            <p className="text-base text-[var(--text-secondary)]">
              Update availability in real time and monitor who is currently using
              high-demand tools.
            </p>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <article
            className="rounded-3xl border bg-white p-6 shadow-sm"
            style={{
              borderColor: "var(--border)",
              boxShadow: "var(--shadow-soft)",
            }}
          >
            <p className="text-sm font-semibold text-[var(--text-secondary)]">
              Total Assets
            </p>
            <p className="mt-4 font-heading text-3xl font-bold">{summary.total}</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Across all labs
            </p>
          </article>
          <article
            className="rounded-3xl border bg-white p-6 shadow-sm"
            style={{
              borderColor: "var(--border)",
              boxShadow: "var(--shadow-soft)",
            }}
          >
            <p className="text-sm font-semibold text-emerald-600">Available</p>
            <p className="mt-4 font-heading text-3xl font-bold">
              {summary.available}
            </p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Students can reserve now
            </p>
          </article>
          <article
            className="rounded-3xl border bg-white p-6 shadow-sm"
            style={{
              borderColor: "var(--border)",
              boxShadow: "var(--shadow-soft)",
            }}
          >
            <p className="text-sm font-semibold text-rose-600">Unavailable</p>
            <p className="mt-4 font-heading text-3xl font-bold">
              {summary.unavailable}
            </p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Needs maintenance or review
            </p>
          </article>
        </section>

        <section
          className="space-y-5 rounded-3xl border bg-white p-6 shadow-sm"
          style={{
            borderColor: "var(--border)",
            boxShadow: "var(--shadow-soft)",
          }}
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-heading text-xl font-semibold">
                Availability Control
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                Toggle items on or off to instantly update the public equipment
                status board.
              </p>
            </div>
            <div className="rounded-full bg-[var(--surface-muted)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
              Changes auto-save
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--border)]">
              <thead className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                <tr>
                  <th className="py-3 pr-4">Equipment</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Usage</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Toggle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {equipment.map((item) => (
                  <tr key={item.id} className="text-sm">
                    <td className="py-4 pr-4">
                      <p className="font-semibold">{item.name}</p>
                      {item.maintenanceNote && (
                        <p className="text-xs text-rose-600">
                          {item.maintenanceNote}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-[var(--text-secondary)]">
                      {item.type}
                    </td>
                    <td className="px-4 py-4 text-[var(--text-secondary)]">
                      {item.hoursUsedThisWeek} hrs this week
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                          item.status === "available"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            item.status === "available"
                              ? "bg-emerald-500"
                              : "bg-rose-500"
                          }`}
                        />
                        {item.status === "available" ? "Available" : "Unavailable"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => toggleEquipmentStatus(item.id)}
                        className={`rounded-[var(--radius-button)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition ${
                          item.status === "available"
                            ? "bg-rose-500 hover:bg-rose-600"
                            : "bg-emerald-600 hover:bg-emerald-700"
                        }`}
                      >
                        {item.status === "available" ? "Mark Offline" : "Mark Online"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section
          className="space-y-5 rounded-3xl border bg-white p-6 shadow-sm"
          style={{
            borderColor: "var(--border)",
            boxShadow: "var(--shadow-soft)",
          }}
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-heading text-xl font-semibold">
                Equipment In Use
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                Track who is currently on the machines and intervene if a session
                runs long.
              </p>
            </div>
            <button
              type="button"
              className="rounded-[var(--radius-button)] border border-[var(--border)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)] transition hover:border-[var(--secondary)] hover:text-[var(--text-primary)]"
            >
              View schedule
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {reservations.map((reservation) => (
              <article
                key={reservation.id}
                className="rounded-2xl border border-[var(--border)] p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                  {reservation.equipmentName}
                </p>
                <p className="mt-2 font-heading text-lg font-semibold text-[var(--text-primary)]">
                  {reservation.userName}
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  {reservation.userEmail}
                </p>
                <dl className="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
                  <div className="flex items-center justify-between">
                    <dt>Started</dt>
                    <dd className="font-semibold text-[var(--text-primary)]">
                      {reservation.startedAt}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt>Expected End</dt>
                    <dd className="font-semibold text-[var(--text-primary)]">
                      {reservation.expectedEnd}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt>Status</dt>
                    <dd>
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                          reservation.status === "on-time"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            reservation.status === "on-time"
                              ? "bg-emerald-500"
                              : "bg-amber-500"
                          }`}
                        />
                        {reservation.status === "on-time" ? "On schedule" : "Overdue"}
                      </span>
                    </dd>
                  </div>
                </dl>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    className="flex-1 rounded-[var(--radius-button)] bg-[var(--secondary)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-[var(--secondary-accent)]"
                  >
                    Send Reminder
                  </button>
                  <button
                    type="button"
                    className="rounded-[var(--radius-button)] border border-[var(--border)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)] transition hover:border-[var(--secondary)] hover:text-[var(--text-primary)]"
                  >
                    End Session
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
