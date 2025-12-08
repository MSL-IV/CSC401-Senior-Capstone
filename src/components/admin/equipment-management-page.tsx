"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { easternDateInputValue, formatInEastern } from "@/utils/time";

type EquipmentStatus = "available" | "unavailable" | "maintenance";

type EquipmentItem = {
  id: string;
  name: string;
  description?: string;
  location?: string;
  slot_minutes: number;
  open_time?: string;
  close_time?: string;
  active: boolean;
  created_at?: string;
};

type ActiveReservation = {
  reservation_id: number;
  created_at: string;
  name: string;
  email: string;
  start: string;
  duration: number;
  machine: string;
  end: string;
  user_id: string;
};

const supabase = createClient();

export function EquipmentManagementPage() {
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [reservations, setReservations] = useState<ActiveReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateLoading, setUpdateLoading] = useState<string | null>(null);

  async function fetchEquipment() {
    try {
      const { data, error } = await supabase
        .from('machines')
        .select('*')
        .order('name');

      if (error) {
        setError('Failed to fetch machines: ' + error.message);
        return;
      }

      setEquipment(data || []);
    } catch (err) {
      setError('An unexpected error occurred while fetching machines');
      console.error('Machines fetch error:', err);
    }
  }

  async function fetchReservations() {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .order('start');

      if (error) {
        setError('Failed to fetch reservations: ' + error.message);
        return;
      }

      const now = new Date();
      const activeReservations = (data || []).filter(res => {
        const startTime = new Date(res.start);
        const endTime = new Date(res.end);
        return startTime <= now && endTime >= now;
      });

      setReservations(activeReservations as ActiveReservation[]);
    } catch (err) {
      setError('An unexpected error occurred while fetching reservations');
      console.error('Reservations fetch error:', err);
    }
  }

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      await Promise.all([
        fetchEquipment(),
        fetchReservations()
      ]);
      setLoading(false);
    }
    
    loadData();
  }, []);

  const summary = useMemo(() => {
    const total = equipment.length;
    const available = equipment.filter((item) => item.active === true).length;
    const inUse = reservations.length;
    return {
      total,
      available,
      unavailable: total - available,
      inUse,
    };
  }, [equipment, reservations]);

  const toggleEquipmentStatus = async (id: string) => {
    setUpdateLoading(id);
    console.log('Attempting to toggle equipment status:', id);
    
    try {
      const item = equipment.find(eq => eq.id === id);
      if (!item) {
        console.error('Equipment item not found:', id);
        setError('Equipment item not found');
        return;
      }

      const newActive = !item.active;
      console.log('Updating machine active status from', item.active, 'to', newActive);
      
      // Check current user authentication
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !currentUser) {
        console.error('Authentication error:', authError);
        setError('Authentication required to update equipment');
        return;
      }
      console.log('Current authenticated user:', currentUser.id);

      // Perform the update
      const { data, error, count } = await supabase
        .from('machines')
        .update({ active: newActive })
        .eq('id', id)
        .select(); // Add select to return updated data

      console.log('Update result:', { data, error, count });

      if (error) {
        console.error('Database update error:', error);
        setError(`Failed to update machine status: ${error.message} (Code: ${error.code})`);
        return;
      }

      if (!data || data.length === 0) {
        console.warn('No rows were updated. Machine might not exist or RLS might be blocking the update.');
        setError('No machine was updated. Check permissions or machine existence.');
        return;
      }

      console.log('Successfully updated machine:', data[0]);

      setEquipment(prev => 
        prev.map(entry => 
          entry.id === id ? { ...entry, active: newActive } : entry
        )
      );
    } catch (err) {
      console.error('Unexpected error during machine update:', err);
      setError('An unexpected error occurred while updating machine');
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
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4 text-2xl">⚠️ Error</div>
          <p className="mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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
            className="rounded-3xl border bg-[var(--surface)] p-6 shadow-sm"
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
            className="rounded-3xl border bg-[var(--surface)] p-6 shadow-sm"
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
            className="rounded-3xl border bg-[var(--surface)] p-6 shadow-sm"
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
          className="space-y-5 rounded-3xl border bg-[var(--surface)] p-6 shadow-sm"
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
                  <th className="py-3 pr-4">Machine</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Slot Duration</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Toggle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {equipment.map((item) => (
                  <tr key={item.id} className="text-sm">
                    <td className="py-4 pr-4">
                      <p className="font-semibold">{item.name}</p>
                      {item.description && (
                        <p className="text-xs text-[var(--text-secondary)]">
                          {item.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-[var(--text-secondary)]">
                      {item.location || 'Not specified'}
                    </td>
                    <td className="px-4 py-4 text-[var(--text-secondary)]">
                      {item.slot_minutes} min slots
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                          item.active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            item.active
                              ? "bg-emerald-500"
                              : "bg-rose-500"
                          }`}
                        />
                        {item.active ? "Available" : "Unavailable"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => toggleEquipmentStatus(item.id)}
                        className={`rounded-[var(--radius-button)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition ${
                          item.active
                            ? "bg-rose-500 hover:bg-rose-600"
                            : "bg-emerald-600 hover:bg-emerald-700"
                        } ${updateLoading === item.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={updateLoading === item.id}
                      >
                        {updateLoading === item.id ? 'Updating...' : (item.active ? "Mark Offline" : "Mark Online")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section
          className="space-y-5 rounded-3xl border bg-[var(--surface)] p-6 shadow-sm"
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
                key={reservation.reservation_id}
                className="rounded-2xl border border-[var(--border)] p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                  {reservation.machine}
                </p>
                <p className="mt-2 font-heading text-lg font-semibold text-[var(--text-primary)]">
                  {reservation.name}
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  {reservation.email}
                </p>
                <dl className="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
                  <div className="flex items-center justify-between">
                    <dt>Started</dt>
                    <dd className="font-semibold text-[var(--text-primary)]">
                      {formatTime(reservation.start)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt>Expected End</dt>
                    <dd className="font-semibold text-[var(--text-primary)]">
                      {formatTime(reservation.end)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt>Status</dt>
                    <dd>
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                          new Date(reservation.end) >= new Date()
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            new Date(reservation.end) >= new Date()
                              ? "bg-emerald-500"
                              : "bg-amber-500"
                          }`}
                        />
                        {new Date(reservation.end) >= new Date() ? "On schedule" : "Overdue"}
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
