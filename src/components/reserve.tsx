"use client";

import { Navbar } from "@/components/navbar";
import { SiteFooter } from "@/components/site-footer";
import ReserveForm from "@/components/reserve-form";
import { useEffect, useState } from "react";
import { createClient as createBrowserClient } from "@/utils/supabase/client";
import { formatInEastern } from "@/utils/time";

type Equipment = {
  id: string;
  name: string;
  slotMinutes: number;
  openTime: string;
  closeTime: string;
};

type Reservation = {
  reservation_id: number;
  machine: string;
  start: string;
  end: string;
  duration: number | null;
};

export function Reserve({ equipment }: { equipment: Equipment[] }) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(true);
  const [reservationsError, setReservationsError] = useState<string | null>(
    null
  );

  useEffect(() => {
    const fetchReservations = async () => {
      const supabase = createBrowserClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setReservations([]);
        setLoadingReservations(false);
        return;
      }

      const { data, error } = await supabase
        .from("reservations")
        .select('reservation_id, machine, start, "end", duration')
        .eq("user_id", user.id)
        .gte("start", new Date().toISOString()) // only upcoming
        .order("start", { ascending: true });

      if (error) {
        console.error("Error loading reservations:", error);
        setReservationsError(error.message);
      } else {
        setReservations((data as Reservation[]) ?? []);
        setReservationsError(null);
      }

      setLoadingReservations(false);
    };

    fetchReservations();
  }, []);

  const handleCancel = async (id: number) => {
    const supabase = createBrowserClient();

    const { error } = await supabase
      .from("reservations")
      .delete()
      .eq("reservation_id", id);

    if (error) {
      console.error("Cancel error:", error);
      setReservationsError("Failed to cancel reservation.");
      return;
    }

    setReservations((prev) => prev.filter((r) => r.reservation_id !== id));
  };

  const refreshReservations = async () => {
    const supabase = createBrowserClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("reservations")
      .select('reservation_id, machine, start, "end", duration')
      .eq("user_id", user.id)
      .gte("start", new Date().toISOString())
      .order("start", { ascending: true });

    setReservations(data || []);
  };

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: "var(--background)",
        color: "var(--text-primary)",
      }}
    >
      <Navbar />
      <main className="mx-auto flex max-w-6xl flex-col items-stretch gap-16 px-6 py-20">
        <section
          className="overflow-hidden rounded-3xl border shadow-sm bg-[var(--surface)] text-[var(--text-primary)]"
          style={{
            borderColor: "var(--border)",
            borderRadius: "var(--radius-card)",
            boxShadow: "var(--shadow-soft)",
          }}
        >
          <div className="px-6 pt-12 md:px-20">
            <div className="mx-auto max-w-3xl space-y-4">
              <h1
                className="font-heading text-4xl font-bold tracking-tight md:text-5xl"
                style={{ color: "var(--text-primary)" }}
              >
                Reserve Equipment
              </h1>
              <p
                className="text-lg leading-relaxed md:text-xl"
                style={{ color: "var(--text-secondary)" }}
              >
                Choose a date, pick a machine, and select an available time
                slot.
              </p>
            </div>
            <div
              className="mt-8 h-1 w-full rounded-full"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, var(--primary) 0%, var(--accent) 60%, var(--primary-hover) 100%)",
              }}
            />
          </div>

          <div className="px-6 py-12 md:px-20">
            <div className="mx-auto max-w-4xl">
              <ReserveForm
                equipment={equipment}
                onReservationCreated={refreshReservations}
              />
              <div className="mt-10 border-t pt-8">
                <h2 className="mb-4 text-lg font-semibold">
                  Your Upcoming Reservations
                </h2>

                {loadingReservations ? (
                  <p className="text-sm text-gray-500">Loading reservations…</p>
                ) : reservationsError ? (
                  <p className="text-sm text-red-600">{reservationsError}</p>
                ) : reservations.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    You have no upcoming reservations.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {reservations.map((r) => (
                      <li
                        key={r.reservation_id}
                        className="flex items-center justify-between rounded-md border px-4 py-2 text-sm"
                      >
                        <div>
                          <div className="font-medium">{r.machine}</div>
                          <div className="text-xs text-gray-500">
                            {formatInEastern(new Date(r.start), {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}{" "}
                            –{" "}
                            {formatInEastern(new Date(r.end), {
                              hour: "numeric",
                              minute: "2-digit",
                            })}{" "}
                            ({r.duration ?? "?"} min)
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCancel(r.reservation_id)}
                          className="text-xs font-semibold text-red-600 hover:underline"
                        >
                          Cancel
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

export default Reserve;
